import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

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
import traceback

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

    try:
        # Lấy candidate_id từ cv_id
        cursor.execute("SELECT candidate_id FROM candidate_cvs WHERE cv_id = %s", (request.cv_id,))
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="CV not found")
        candidate_id = result[0]

        # Lấy JD từ bảng jobs - FIX: Handle null values properly
        cursor.execute("""
        SELECT description, requirements, responsibilities, education_requirements,
               min_experience_years, max_experience_years, language_requirements
        FROM jobs
        WHERE job_id = %s
        """, (request.job_id,))

        job_data = cursor.fetchone()
        if not job_data:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # FIX: Lấy kỹ năng từ job_skills với JOIN skills table
        cursor.execute("""
            SELECT s.skill_name
            FROM job_skills js
            JOIN skills s ON js.skill_id = s.skill_id
            WHERE js.job_id = %s
        """, (request.job_id,))
        skill_rows = cursor.fetchall()
        jd_skills = [row[0] for row in skill_rows]
        skills_text = ' '.join(jd_skills)

        description, requirements, responsibilities, education, min_exp, max_exp, languages = job_data

        # FIX: Handle experience years properly
        experience_years_text = ""
        if min_exp is not None or max_exp is not None:
            if min_exp is not None and max_exp is not None:
                experience_years_text = f"{min_exp} đến {max_exp} năm kinh nghiệm"
            elif min_exp is not None:
                experience_years_text = f"Tối thiểu {min_exp} năm kinh nghiệm"
            elif max_exp is not None:
                experience_years_text = f"Tối đa {max_exp} năm kinh nghiệm"

        # FIX: Handle language_requirements array properly
        language_text = ""
        if languages:
            if isinstance(languages, list):
                language_text = ' '.join(languages)
            else:
                language_text = str(languages)

        # Build JD text with null safety
        jd_text = f"{description or ''} {requirements or ''} {responsibilities or ''} {education or ''} {experience_years_text} {language_text} {skills_text}".strip()

        # Lưu từng phần embedding của JD - FIX: Only save columns that exist in schema
        save_job_embedding(request.job_id, jd_text, "full_jd")
        save_job_embedding(request.job_id, requirements or "", "requirements")
        save_job_embedding(request.job_id, responsibilities or "", "responsibilities")
        save_job_embedding(request.job_id, skills_text, "skills")
        # Note: education, experience, language embeddings not in job_embeddings schema

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
        
        # FIX: If no parsed content found, create a basic one from CV metadata
        if not parsed_result:
            print(f"No parsed content found for CV {request.cv_id}, creating basic structure")
            
            # Get CV basic info
            cursor.execute(
                """
                SELECT cv_name, file_name, candidate_id FROM candidate_cvs
                WHERE cv_id = %s
                """,
                (request.cv_id,),
            )
            cv_info = cursor.fetchone()
            
            if not cv_info:
                raise HTTPException(status_code=404, detail="CV not found in database")
            
            cv_name, file_name, cv_candidate_id = cv_info
            
            # Create basic parsed content structure
            parsed_content = {
                "full_name": (cv_name or "").replace("'s CV", "").replace(" CV", "").strip() or "Unknown",
                "email": "",
                "phone": "",
                "address": "",
                "mo_ta_ban_than": f"CV file: {file_name}",
                "ky_nang": [],
                "kinh_nghiem": [],
                "hoc_van": [],
                "du_an": [],
                "chung_chi": [],
                "ngoai_ngu": []
            }
            
            # Save this basic structure to cv_content for future use
            # Check if record exists first
            cursor.execute("SELECT content_id FROM cv_content WHERE cv_id = %s", (request.cv_id,))
            existing = cursor.fetchone()
            
            if existing:
                # Update existing record
                cursor.execute(
                    """
                    UPDATE cv_content 
                    SET parsed_content = %s, updated_at = NOW()
                    WHERE cv_id = %s
                    """,
                    (json.dumps(parsed_content), request.cv_id)
                )
            else:
                # Insert new record
                cursor.execute(
                    """
                    INSERT INTO cv_content (cv_id, parsed_content, created_at, updated_at)
                    VALUES (%s, %s, NOW(), NOW())
                    """,
                    (request.cv_id, json.dumps(parsed_content))
                )
            print(f"Created basic parsed content for CV {request.cv_id}")
        else:
            parsed_content = parsed_result[0]
            parsed_content = json.loads(parsed_content) if isinstance(parsed_content, str) else parsed_content

        # Tạo văn bản CV tổng hợp và lưu embedding full_text
        cv_full_text = make_cv_text(parsed_content)
        cv_embedding_id = save_cv_embedding(request.cv_id, candidate_id, cv_full_text, 'full_text')

        # Tách từng phần của CV
        mo_ta_ban_than = parsed_content.get('mo_ta_ban_than', '')

        ky_nang_parsed = parsed_content.get('ky_nang', [])

        # FIX: Lấy kỹ năng từ bảng candidate_skills - Get profile_id first
        cursor.execute("""
            SELECT profile_id FROM candidate_profiles 
            WHERE user_id = %s
        """, (candidate_id,))
        profile_result = cursor.fetchone()
        
        ky_nang_db = []
        if profile_result:
            profile_id = profile_result[0]
            cursor.execute("""
                SELECT s.skill_name
                FROM candidate_skills cs
                JOIN skills s ON cs.skill_id = s.skill_id
                WHERE cs.profile_id = %s
            """, (profile_id,))
            ky_nang_db = [row[0] for row in cursor.fetchall()]

        # Combine skills from parsed CV and database
        all_skills = []
        if isinstance(ky_nang_parsed, list):
            all_skills.extend([skill.get('name', '') if isinstance(skill, dict) else str(skill) for skill in ky_nang_parsed])
        all_skills.extend(ky_nang_db)
        ky_nang_text = ' '.join(filter(None, all_skills))

        # Get experience and education from parsed content
        kinh_nghiem_text = ""
        if 'kinh_nghiem' in parsed_content and isinstance(parsed_content['kinh_nghiem'], list):
            exp_list = []
            for exp in parsed_content['kinh_nghiem']:
                if isinstance(exp, dict):
                    exp_parts = [
                        exp.get('position', ''),
                        exp.get('company', ''),
                        exp.get('description', '')
                    ]
                    exp_list.append(' '.join(filter(None, exp_parts)))
            kinh_nghiem_text = ' '.join(exp_list)

        hoc_van_text = ""
        if 'hoc_van' in parsed_content and isinstance(parsed_content['hoc_van'], list):
            edu_list = []
            for edu in parsed_content['hoc_van']:
                if isinstance(edu, dict):
                    edu_parts = [
                        edu.get('school', ''),
                        edu.get('degree', ''),
                        edu.get('field', '')
                    ]
                    edu_list.append(' '.join(filter(None, edu_parts)))
            hoc_van_text = ' '.join(edu_list)

        # Save CV section embeddings
        save_cv_embedding(request.cv_id, candidate_id, ky_nang_text, 'skills')
        save_cv_embedding(request.cv_id, candidate_id, kinh_nghiem_text, 'experience')
        save_cv_embedding(request.cv_id, candidate_id, hoc_van_text, 'education')

        # Calculate similarities
        overall_similarity = calculate_similarity(cv_full_text, jd_text)
        mo_ta_ban_than_similarity = calculate_similarity(mo_ta_ban_than, description or "")
        ky_nang_similarity = calculate_similarity(ky_nang_text, skills_text) if ky_nang_text and skills_text else 0.0
        kinh_nghiem_similarity = calculate_similarity(kinh_nghiem_text, requirements or "") if kinh_nghiem_text else 0.0
        hoc_van_similarity = calculate_similarity(hoc_van_text, education or "") if hoc_van_text else 0.0
        
        weighted_score = overall_similarity

        # Lưu kết quả so khớp vào vector_matches
        # Check if match already exists
        cursor.execute(
            """
            SELECT match_id FROM vector_matches 
            WHERE job_id = %s AND candidate_id = %s AND cv_id = %s
            """,
            (request.job_id, candidate_id, request.cv_id)
        )
        existing_match = cursor.fetchone()
        
        if existing_match:
            # Update existing match
            match_id = existing_match[0]
            cursor.execute(
                """
                UPDATE vector_matches SET
                    overall_similarity = %s,
                    skills_similarity = %s,
                    experience_similarity = %s,
                    education_similarity = %s,
                    weighted_score = %s,
                    last_calculated = NOW(),
                    cv_embedding_id = %s,
                    match_type = %s,
                    computed_at = NOW()
                WHERE match_id = %s
                """,
                (
                    overall_similarity,
                    ky_nang_similarity,
                    kinh_nghiem_similarity,
                    hoc_van_similarity,
                    weighted_score,
                    cv_embedding_id,
                    'sbert',
                    match_id
                )
            )
        else:
            # Insert new match
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
                )
            )
            match_id = cursor.fetchone()[0]
        conn.commit()

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

    except Exception as e:
        try:
            conn.rollback()
        except:
            pass
        print(f"Error in calculate_match: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
    finally:
        try:
            cursor.close()
        except:
            pass
        try:
            conn.close()
        except:
            pass


@app.get("/api/v1/ai/similarity")
async def get_similarity(
    cv_id: str = Query(...),
    job_id: str = Query(...),  
    section_type: str = Query("full_text")
):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get CV embedding
        cv_column = f"{section_type}_embedding_384"
        cv_emb = get_embedding("cv_embeddings", "cv_id", cv_id, cv_column)
        
        if not cv_emb:
            raise HTTPException(status_code=404, detail="CV embedding not found")
        
        # Get Job embedding
        job_column = f"full_jd_embedding_384" if section_type == "full_text" else f"{section_type}_embedding_384"
        job_emb = get_embedding("job_embeddings", "job_id", job_id, job_column)
        
        if not job_emb:
            raise HTTPException(status_code=404, detail="Job embedding not found")
        
        # Calculate similarity
        similarity = cos_sim(np.array(cv_emb), np.array(job_emb)).item()
        
        try:
            cursor.close()
        except:
            pass
        try:
            conn.close()
        except:
            pass
        
        return {
            "similarity": round(float(similarity), 4)
        }
        
    except Exception as e:
        print(f"Error in get_similarity: {str(e)}")
        # Clean up connections on error
        if 'cursor' in locals():
            try:
                cursor.close()
            except:
                pass
        if 'conn' in locals():
            try:
                conn.close()
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/v1/ai/job-recommendations/{candidate_id}")
async def recommend_jobs(candidate_id: str, top_k: int = Query(5, ge=1, le=50)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get primary CV
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

        # Ensure CV has embedding
        cv_emb = get_embedding("cv_embeddings", "cv_id", cv_id, "full_text_embedding_384")
        if not cv_emb:
            # Generate embedding from parsed_content
            cursor.execute("SELECT parsed_content FROM cv_content WHERE cv_id = %s", (cv_id,))
            result = cursor.fetchone()
            if not result:
                # FIX: Create basic parsed content if not found (same logic as calculate_match)
                cursor.execute("SELECT cv_name, file_name FROM candidate_cvs WHERE cv_id = %s", (cv_id,))
                cv_info = cursor.fetchone()
                
                if not cv_info:
                    raise HTTPException(status_code=404, detail="CV not found")
                
                cv_name, file_name = cv_info
                parsed_content = {
                    "full_name": (cv_name or "").replace("'s CV", "").replace(" CV", "").strip() or "Unknown",
                    "mo_ta_ban_than": f"CV file: {file_name}",
                    "ky_nang": [],
                    "kinh_nghiem": [],
                    "hoc_van": []
                }
                
                # Save basic content
                # Check if record exists first
                cursor.execute("SELECT content_id FROM cv_content WHERE cv_id = %s", (cv_id,))
                existing = cursor.fetchone()
                
                if existing:
                    # Update existing record
                    cursor.execute(
                        """
                        UPDATE cv_content 
                        SET parsed_content = %s, updated_at = NOW()
                        WHERE cv_id = %s
                        """,
                        (json.dumps(parsed_content), cv_id)
                    )
                else:
                    # Insert new record
                    cursor.execute(
                        """
                        INSERT INTO cv_content (cv_id, parsed_content, created_at, updated_at)
                        VALUES (%s, %s, NOW(), NOW())
                        """,
                        (cv_id, json.dumps(parsed_content))
                    )
                print(f"Created basic parsed content for CV {cv_id}")
            else:
                parsed_content = json.loads(result[0]) if isinstance(result[0], str) else result[0]

            cv_text = make_cv_text(parsed_content)
            save_cv_embedding(cv_id, candidate_id, cv_text, "full_text")

            cv_emb = get_embedding("cv_embeddings", "cv_id", cv_id, "full_text_embedding_384")

        if not cv_emb:
            raise HTTPException(status_code=500, detail="Failed to generate CV embedding")

        # Get all active jobs
        cursor.execute("""
            SELECT j.job_id, j.title, j.description, j.requirements, j.responsibilities,
                   j.company_id, c.company_name
            FROM jobs j
            LEFT JOIN companies c ON j.company_id = c.company_id
            WHERE j.status = 'PUBLISHED' OR j.status = 'ACTIVE'
        """)
        all_jobs = cursor.fetchall()

        recommendations = []

        for job in all_jobs:
            job_id, title, desc, reqs, resps, company_id, company_name = job

            # Ensure job has embedding
            jd_emb = get_embedding("job_embeddings", "job_id", job_id, "full_jd_embedding_384")
            if not jd_emb:
                jd_text = f"{desc or ''} {reqs or ''} {resps or ''}".strip()
                if jd_text:
                    try:
                        save_job_embedding(job_id, jd_text, "full_jd")
                        jd_emb = get_embedding("job_embeddings", "job_id", job_id, "full_jd_embedding_384")
                    except Exception as e:
                        print(f"Failed to embed JD {job_id}: {e}")
                        continue

            if not jd_emb:
                continue

            # Calculate similarity
            try:
                sim = cos_sim(np.array(cv_emb), np.array(jd_emb)).item()
            except Exception as e:
                print(f"Cosine error for job_id={job_id}: {e}")
                continue

            recommendations.append({
                "job_id": job_id,
                "title": title,
                "group": company_name or "Unknown Company",
                "overall_similarity": round(sim, 4)
            })

        try:
            cursor.close()
        except:
            pass
        try:
            conn.close()
        except:
            pass

        # Sort and return top-K
        recommendations.sort(key=lambda x: x["overall_similarity"], reverse=True)
        return {
            "candidate_id": candidate_id,
            "cv_id": cv_id,
            "top_k": top_k,
            "recommendations": recommendations[:top_k]
        }
        
    except Exception as e:
        print(f"Error in recommend_jobs: {str(e)}")
        # Clean up connections on error
        if 'cursor' in locals():
            try:
                cursor.close()
            except:
                pass
        if 'conn' in locals():
            try:
                conn.close()
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/v1/ai/match-analysis/{application_id}")
async def match_reasoning(application_id: str):
    try:
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
        jd_text = f"{jd_desc or ''}\n\nRequirements:\n{jd_reqs or ''}"
        cv_text = make_cv_text(parsed)

        sim_scores = {
            "overall": float(overall) if overall else 0.0,
            "skills": float(skills_sim) if skills_sim else 0.0,
            "experience": float(exp_sim) if exp_sim else 0.0,
            "education": float(edu_sim) if edu_sim else 0.0
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
        
        try:
            cursor.close()
        except:
            pass
        try:
            conn.close()
        except:
            pass

        return {
            "application_id": application_id,
            "cv_id": cv_id,
            "job_id": job_id,
            "language_detected": lang,
            "similarity_scores": sim_scores,
            "reasoning": reasoning
        }
        
    except Exception as e:
        print(f"Error in match_reasoning: {str(e)}")
        # Clean up connections on error
        if 'cursor' in locals():
            try:
                cursor.close()
            except:
                pass
        if 'conn' in locals():
            try:
                conn.rollback()
            except:
                pass
            try:
                conn.close()
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        
        try:
            cursor.close()
        except:
            pass
        try:
            conn.close()
        except:
            pass
        
        return {
            "status": "healthy",
            "service": "JD-CV Matching API",
            "version": "1.0.0",
            "database": "connected"
        }
    except Exception as e:
        # Clean up connections on error
        if 'cursor' in locals():
            try:
                cursor.close()
            except:
                pass
        if 'conn' in locals():
            try:
                conn.close()
            except:
                pass
        
        return {
            "status": "unhealthy",
            "service": "JD-CV Matching API", 
            "version": "1.0.0",
            "database": "disconnected",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("SERVICE_PORT", 8001))
    host = os.getenv("SERVICE_HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)