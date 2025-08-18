from fastapi import FastAPI, HTTPException, Query
from models import MatchRequest, MatchResponse
from db import (
    get_db_connection,
    save_cv_embedding,
    save_job_embedding,
    get_embedding
)
from utils import calculate_similarity, make_cv_text, clean_text, detect_language_from_texts, build_reasoning_prompt, call_groq_reasoning
from sentence_transformers.util import cos_sim
import numpy as np
import json
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="JD-CV Matching API",
    description="AI-powered job description and CV matching service",
    version="1.0.0"
)

@app.post("/api/v1/ai/calculate-match", response_model=MatchResponse)
async def calculate_match(request: MatchRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Lấy candidate_id từ cv_id
    cursor.execute("SELECT candidate_id FROM candidate_cvs WHERE cv_id = %s", (request.cv_id,))
    result = cursor.fetchone()
    if not result:
        raise HTTPException(status_code=404, detail="CV not found")
    candidate_id = result[0]

    # Lấy JD từ bảng jobs
    cursor.execute("""
    SELECT description, requirements, responsibilities, education_requirements,
           min_experience_years, max_experience_years, language_requirements
    FROM jobs
    WHERE job_id = %s
    """, (request.job_id,))

    job_data = cursor.fetchone()
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Lấy kỹ năng từ job_skills
    cursor.execute("""
        SELECT skill_name
        FROM job_skills
        WHERE job_id = %s
    """, (request.job_id,))
    skill_rows = cursor.fetchall()
    jd_skills = [row[0] for row in skill_rows]
    skills_text = ' '.join(jd_skills)

    description, requirements, responsibilities, education, min_exp, max_exp, languages = job_data

    experience_years_text = f"{min_exp} đến {max_exp} năm kinh nghiệm" if min_exp or max_exp else ""
    language_text = ', '.join(languages) if languages else ""

    jd_text = f"{description} {requirements} {responsibilities} {education} {experience_years_text} {language_text} {skills_text}"



    # Lưu từng phần embedding của JD
    save_job_embedding(request.job_id, jd_text, "full_jd_embedding")
    save_job_embedding(request.job_id, requirements or "", "requirements_embedding")
    save_job_embedding(request.job_id, responsibilities or "", "responsibilities_embedding")
    save_job_embedding(request.job_id, education or "", "education_embedding")
    save_job_embedding(request.job_id, experience_years_text, "experience_embedding")
    save_job_embedding(request.job_id, language_text, "language_embedding")
    save_job_embedding(request.job_id, skills_text, "skills_embedding")


    # Lấy CV embedding
    # Lấy parsed_content từ cv_content
    cursor.execute(
        """
        SELECT parsed_content FROM cv_content
        WHERE cv_id = %s
        """,
        (request.cv_id,),
    )
    parsed_result = cursor.fetchone()
    if not parsed_result:
        raise HTTPException(status_code=404, detail="Parsed CV not found")

    parsed_content = parsed_result[0]
    parsed_content = json.loads(parsed_content) if isinstance(parsed_content, str) else parsed_content

    

    # Tạo văn bản CV tổng hợp và lưu embedding full_text
    cv_full_text = make_cv_text(parsed_content)
    cv_embedding_id = save_cv_embedding(request.cv_id, candidate_id, cv_full_text, 'full_text_embedding')

    # Tách từng phần của CV
    mo_ta_ban_than = parsed_content.get('mo_ta_ban_than', '')

    ky_nang_parsed = parsed_content.get('ky_nang', [])

    # Lấy kỹ năng từ bảng candidate_skills
    cursor.execute("""
        SELECT s.skill_name
        FROM candidate_skills cs
        JOIN candidate_profiles cp ON cp.user_id = %s
        JOIN skills s ON cs.skill_id = s.skill_id
        WHERE cs.profile_id = cp.profile_id
    """, (candidate_id,))
    ky_nang_db = [row[0] for row in cursor.fetchall()]

    # Gộp kỹ năng
    all_skills = list(set(ky_nang_parsed + ky_nang_db))
    ky_nang = ' '.join(all_skills)

    kinh_nghiem_text = ' '.join([
        clean_text(str(item.get(f, '')))
        for item in parsed_content.get('kinh_nghiem_lam_viec', [])
        for f in ['vi_tri', 'cong_ty', 'dia_diem', 'thoi_gian', 'mo_ta']
    ])
    hoc_van = ' '.join([
        clean_text(str(item.get(f, '')))
        for item in parsed_content.get('hoc_van', [])
        for f in ['truong', 'nganh', 'trinh_do', 'xep_loai']
    ])
    du_an_text = ' '.join([
        clean_text(str(item.get(f, '')))
        for item in parsed_content.get('du_an', [])
        for f in ['ten_du_an', 'vai_tro', 'mo_ta']
    ])
    
    kinh_nghiem = f"{kinh_nghiem_text} {du_an_text}".strip()

    # Lưu từng phần embedding
    # save_cv_embedding(request.cv_id, candidate_id, mo_ta_ban_than, 'mo_ta_ban_than_embedding')
    save_cv_embedding(request.cv_id, candidate_id, ky_nang, 'skills_embedding')
    save_cv_embedding(request.cv_id, candidate_id, kinh_nghiem, 'experience_embedding')
    save_cv_embedding(request.cv_id, candidate_id, hoc_van, 'education_embedding')


    # Tính độ tương đồng giữa các phần
    overall_similarity = calculate_similarity(cv_full_text, jd_text)
    mo_ta_ban_than_similarity = calculate_similarity(mo_ta_ban_than, requirements) if mo_ta_ban_than else 0.0
    ky_nang_similarity = calculate_similarity(ky_nang, skills_text) if ky_nang else 0.0
    kinh_nghiem_similarity = calculate_similarity(kinh_nghiem, experience_years_text) if kinh_nghiem else 0.0
    hoc_van_similarity = calculate_similarity(hoc_van, education) if hoc_van else 0.0
    
    weighted_score = overall_similarity

    # Lưu kết quả so khớp vào vector_matches
    cursor.execute(
    """
    INSERT INTO vector_matches (
        job_id, candidate_id, cv_id, overall_similarity, skills_similarity,
        experience_similarity, education_similarity, weighted_score, last_calculated, cv_embedding_id,
        match_type, computed_at
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), %s, %s, NOW())
    RETURNING match_id
    """,
    (
        request.job_id,
        candidate_id,
        request.cv_id,
        overall_similarity,
        ky_nang_similarity,
        kinh_nghiem_similarity,
        hoc_van_similarity,
        weighted_score,
        cv_embedding_id,
        'sbert',
    ),
)

    match_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()

    return MatchResponse(
        match_id=match_id,
        job_id=request.job_id,
        candidate_id=candidate_id,
        cv_id=request.cv_id,
        overall_similarity=overall_similarity,
        mo_ta_ban_than_similarity=mo_ta_ban_than_similarity,
        ky_nang_similarity=ky_nang_similarity,
        kinh_nghiem_similarity=kinh_nghiem_similarity,
        hoc_van_similarity=hoc_van_similarity,
    )


@app.get("/api/v1/ai/similarity")
async def get_similarity(
    cv_id: str = Query(...),  # Changed from int to str to accept UUID
    job_id: str = Query(...),  # Changed from int to str to accept UUID  
    section_type: str = Query("full_text")
):
    conn = get_db_connection()
    cursor = conn.cursor()

    # mapping section_type -> column
    column_map = {
        "full_text": "overall_similarity",
        "ky_nang": "skills_similarity",
        "kinh_nghiem_lam_viec": "experience_similarity",
        "hoc_van": "education_similarity",
        "du_an": "projects_similarity",
        "weighted": "weighted_score"
    }

    if section_type not in column_map:
        raise HTTPException(status_code=400, detail=f"Invalid section_type. Must be one of {list(column_map.keys())}")

    col = column_map[section_type]

    cursor.execute(f"""
        SELECT {col}
        FROM vector_matches
        WHERE cv_id = %s AND job_id = %s
        ORDER BY last_calculated DESC
        LIMIT 1
    """, (cv_id, job_id))
    
    result = cursor.fetchone()
    cursor.close()
    conn.close()

    if not result:
        raise HTTPException(status_code=404, detail="No match result found")

    return {
        "cv_id": cv_id,
        "job_id": job_id,
        "section_type": section_type,
        "similarity_score": round(float(result[0]), 4)
    }



@app.get("/api/v1/ai/job-recommendations/{candidate_id}")
async def recommend_jobs(candidate_id: str, top_k: int = Query(5, ge=1, le=50)):  # Changed from int to str
    conn = get_db_connection()
    cursor = conn.cursor()

    # --- B1: Lấy CV chính ---
    cursor.execute("""
        SELECT cv_id FROM candidate_cvs
        WHERE candidate_id = %s AND is_primary = TRUE
        LIMIT 1
    """, (candidate_id,))
    row = cursor.fetchone()

    if not row:
        cursor.execute("""
            SELECT cv_id FROM candidate_cvs
            WHERE candidate_id = %s
            ORDER BY updated_at DESC
            LIMIT 1
        """, (candidate_id,))
        row = cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="No CV found for candidate")

    cv_id = row[0]

    # --- B2: Đảm bảo CV đã có embedding ---
    cv_emb = get_embedding("cv_embeddings", "cv_id", cv_id, "full_text_embedding")
    if not cv_emb:
        # Tạo embedding từ parsed_content
        cursor.execute("SELECT candidate_id FROM candidate_cvs WHERE cv_id = %s", (cv_id,))
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Candidate not found")

        candidate_id_fetched = result[0]
        cursor.execute("SELECT parsed_content FROM cv_content WHERE cv_id = %s", (cv_id,))
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Parsed content not found")

        parsed_content = json.loads(result[0]) if isinstance(result[0], str) else result[0]
        cv_text = make_cv_text(parsed_content)
        save_cv_embedding(cv_id, candidate_id_fetched, cv_text, "full_text_embedding")

        cv_emb = get_embedding("cv_embeddings", "cv_id", cv_id, "full_text_embedding")
        if not cv_emb:
            raise HTTPException(status_code=500, detail="Failed to generate CV embedding")

    # --- B3: Lấy tất cả JD ---
    cursor.execute("""
        SELECT j.job_id, j.title, j.description, j.requirements, j.responsibilities,
               j.company_id, c.company_name
        FROM jobs j
        LEFT JOIN companies c ON j.company_id = c.company_id
    """)
    all_jobs = cursor.fetchall()

    recommendations = []

    for job in all_jobs:
        job_id, title, desc, reqs, resps, company_id, company_name = job

        # Đảm bảo JD đã có embedding
        jd_emb = get_embedding("job_embeddings", "job_id", job_id, "full_jd_embedding")
        if not jd_emb:
            jd_text = f"{desc or ''} {reqs or ''} {resps or ''}".strip()
            try:
                save_job_embedding(job_id, jd_text, "full_jd_embedding")
                jd_emb = get_embedding("job_embeddings", "job_id", job_id, "full_jd_embedding")
            except Exception as e:
                print(f"⚠️ Failed to embed JD {job_id}: {e}")
                continue

        if not jd_emb:
            continue

        # Tính cosine similarity
        try:
            sim = cos_sim(np.array(cv_emb), np.array(jd_emb)).item()
        except Exception as e:
            print(f"⚠️ Cosine error for job_id={job_id}: {e}")
            continue

        recommendations.append({
            "job_id": job_id,
            "title": title,
            "group": company_name,
            "overall_similarity": round(sim, 4)
        })

    cursor.close()
    conn.close()

    # --- B4: Sắp xếp và trả về Top-K ---
    recommendations.sort(key=lambda x: x["overall_similarity"], reverse=True)
    return {
        "candidate_id": candidate_id,
        "cv_id": cv_id,
        "top_k": top_k,
        "recommendations": recommendations[:top_k]
    }


@app.get("/api/v1/ai/match-analysis/{application_id}")
async def match_reasoning(application_id: str):  # Changed from int to str
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT a.cv_id, a.job_id,
               vm.overall_similarity, vm.skills_similarity,
               vm.experience_similarity, vm.education_similarity,
               cc.parsed_content,
               j.description, j.requirements
        FROM applications a
        JOIN vector_matches vm ON vm.cv_id = a.cv_id AND vm.job_id = a.job_id
        JOIN cv_content cc ON cc.cv_id = a.cv_id
        JOIN jobs j ON j.job_id = a.job_id
        WHERE a.application_id = %s
    """, (application_id,))

    row = cursor.fetchone()

    if not row:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Application not found")

    (
        cv_id, job_id,
        overall, skills_sim, exp_sim, edu_sim,
        parsed_content, jd_desc, jd_reqs
    ) = row

    parsed = json.loads(parsed_content) if isinstance(parsed_content, str) else parsed_content
    jd_text = f"{jd_desc}\n\nRequirements:\n{jd_reqs}"
    cv_text = make_cv_text(parsed)

    sim_scores = {
        "overall": float(overall),
        "skills": float(skills_sim),
        "experience": float(exp_sim),
        "education": float(edu_sim)
    }

    lang = detect_language_from_texts(jd_text, cv_text)

    prompt = build_reasoning_prompt(cv_text, jd_text, sim_scores, lang)
    reasoning = call_groq_reasoning(prompt, lang)

    ai_analysis_data = {
        "language": lang,
        "match_scores": sim_scores,
        "reasoning": reasoning
    }

    cursor.execute(
        "UPDATE applications SET ai_analysis = %s, updated_at = NOW() WHERE application_id = %s",
        (json.dumps(ai_analysis_data), application_id)
    )
    conn.commit()
    cursor.close()
    conn.close()

    return {
        "application_id": application_id,
        "cv_id": cv_id,
        "job_id": job_id,
        "language_detected": lang,
        "similarity_scores": sim_scores,
        "reasoning": reasoning
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "jd-cv-matching"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("SERVICE_PORT", 8001))
    host = os.getenv("SERVICE_HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
