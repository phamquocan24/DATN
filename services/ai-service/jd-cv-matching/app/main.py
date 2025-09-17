import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set timezone to Vietnam Standard Time
os.environ['TZ'] = 'Asia/Ho_Chi_Minh'

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
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

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

        # Lấy JD từ bảng jobs với đầy đủ thông tin
        cursor.execute("""
        SELECT j.title, j.description, j.requirements, j.responsibilities, j.benefits,
               j.experience_level, j.employment_type, j.work_arrangement, j.category,
               j.education_requirements, j.min_experience_years, j.max_experience_years, 
               j.language_requirements, j.salary_min, j.salary_max, j.currency,
               c.company_name, c.industry
        FROM jobs j
        LEFT JOIN companies c ON j.company_id = c.company_id
        WHERE j.job_id = %s
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

        (title, description, requirements, responsibilities, benefits, 
         experience_level, employment_type, work_arrangement, category,
         education, min_exp, max_exp, languages, salary_min, salary_max, currency,
         company_name, industry) = job_data

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

        # Build comprehensive JD text with all available information
        jd_parts = [
            f"Vị trí: {title or ''}",
            f"Công ty: {company_name or ''} - Ngành: {industry or ''}",
            f"Mô tả: {description or ''}",
            f"Yêu cầu: {requirements or ''}",
            f"Trách nhiệm: {responsibilities or ''}",
            f"Quyền lợi: {benefits or ''}",
            f"Cấp độ: {experience_level or ''} - Loại hình: {employment_type or ''}",
            f"Làm việc: {work_arrangement or ''} - Lĩnh vực: {category or ''}",
            f"Học vấn: {education or ''}",
            f"Kinh nghiệm: {experience_years_text}",
            f"Ngôn ngữ: {language_text}",
            f"Kỹ năng: {skills_text}"
        ]
        jd_text = ' '.join([part for part in jd_parts if part and not part.endswith(': ')]).strip()

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
        
        if not parsed_result:
            raise HTTPException(status_code=404, detail="CV content not found. Please wait for CV processing to complete or contact support.")
        else:
            parsed_content = parsed_result[0]
            parsed_content = json.loads(parsed_content) if isinstance(parsed_content, str) else parsed_content

        # Tạo văn bản CV tổng hợp và lưu embedding full_text
        cv_full_text = make_cv_text(parsed_content)
        cv_embedding_id = save_cv_embedding(request.cv_id, candidate_id, cv_full_text, 'full_text')

        # Get personal description from parsed content - Try multiple field names
        mo_ta_ban_than = (parsed_content.get('mo_ta_ban_than') or 
                         parsed_content.get('summary') or 
                         parsed_content.get('objective') or 
                         parsed_content.get('gioi_thieu_ban_than') or 
                         parsed_content.get('personal_summary') or '')

        # Get skills from parsed content - Try multiple field names and structures
        ky_nang_parsed = (parsed_content.get('ky_nang') or 
                         parsed_content.get('skills') or 
                         parsed_content.get('ki_nang') or [])

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

        # Combine skills from parsed CV and database with improved extraction
        all_skills = []
        
        # Handle different skill data formats - FIXED to handle nested structure
        if isinstance(ky_nang_parsed, dict):
            # Handle nested skills structure like {"ky_nang_chuyen_mon": [...], "ngoai_ngu": [...]}
            for skill_category, skill_list in ky_nang_parsed.items():
                if isinstance(skill_list, list):
                    all_skills.extend([str(skill) for skill in skill_list if skill])
                elif isinstance(skill_list, str) and skill_list:
                    all_skills.append(skill_list)
        elif isinstance(ky_nang_parsed, list):
            for skill in ky_nang_parsed:
                if isinstance(skill, dict):
                    # Try multiple possible field names for skill name
                    skill_name = (skill.get('name', '') or 
                                skill.get('skill_name', '') or 
                                skill.get('ten_ky_nang', '') or 
                                str(skill))
                    all_skills.append(skill_name)
                elif isinstance(skill, str):
                    all_skills.append(skill)
        elif isinstance(ky_nang_parsed, str):
            all_skills.append(ky_nang_parsed)
            
        all_skills.extend(ky_nang_db)
        ky_nang_text = ' '.join(filter(None, all_skills))

        # Get experience from parsed content - Try multiple field names
        kinh_nghiem_text = ""
        
        # Try different possible field names for experience
        experience_data = (parsed_content.get('kinh_nghiem') or 
                          parsed_content.get('kinh_nghiem_lam_viec') or 
                          parsed_content.get('experience') or [])
        
        if isinstance(experience_data, list):
            exp_list = []
            for exp in experience_data:
                if isinstance(exp, dict):
                    # Try multiple possible field names for each experience entry
                    exp_parts = [
                        exp.get('position', '') or exp.get('vi_tri', '') or exp.get('job_title', ''),
                        exp.get('company', '') or exp.get('cong_ty', '') or exp.get('company_name', ''),
                        exp.get('description', '') or exp.get('mo_ta', '') or exp.get('job_description', ''),
                        exp.get('duration', '') or exp.get('thoi_gian', '') or exp.get('time_period', '')
                    ]
                    exp_list.append(' '.join(filter(None, exp_parts)))
            kinh_nghiem_text = ' '.join(exp_list)
        elif isinstance(experience_data, str):
            kinh_nghiem_text = experience_data

        # Get education from parsed content - Try multiple field names
        hoc_van_text = ""
        
        # Try different possible field names for education
        education_data = (parsed_content.get('hoc_van') or 
                         parsed_content.get('education') or 
                         parsed_content.get('hoc_van_dao_tao') or [])
        
        if isinstance(education_data, list):
            edu_list = []
            for edu in education_data:
                if isinstance(edu, dict):
                    # Try multiple possible field names for each education entry
                    edu_parts = [
                        edu.get('school', '') or edu.get('truong', '') or edu.get('school_name', ''),
                        edu.get('degree', '') or edu.get('bang_cap', '') or edu.get('trinh_do', ''),
                        edu.get('field', '') or edu.get('nganh', '') or edu.get('major', ''),
                        edu.get('graduation_year', '') or edu.get('nam_tot_nghiep', '') or edu.get('year', '')
                    ]
                    edu_list.append(' '.join(filter(None, edu_parts)))
            hoc_van_text = ' '.join(edu_list)
        elif isinstance(education_data, str):
            hoc_van_text = education_data

        # Save CV section embeddings
        save_cv_embedding(request.cv_id, candidate_id, ky_nang_text, 'skills')
        save_cv_embedding(request.cv_id, candidate_id, kinh_nghiem_text, 'experience')
        save_cv_embedding(request.cv_id, candidate_id, hoc_van_text, 'education')

        # Debug logging
        print(f"=== DEBUG SIMILARITY CALCULATION ===")
        print(f"mo_ta_ban_than length: {len(mo_ta_ban_than) if mo_ta_ban_than else 0}")
        print(f"ky_nang_text length: {len(ky_nang_text) if ky_nang_text else 0}")
        print(f"kinh_nghiem_text length: {len(kinh_nghiem_text) if kinh_nghiem_text else 0}")
        print(f"hoc_van_text length: {len(hoc_van_text) if hoc_van_text else 0}")
        print(f"JD description length: {len(description) if description else 0}")
        print(f"JD skills_text length: {len(skills_text) if skills_text else 0}")
        print(f"JD requirements length: {len(requirements) if requirements else 0}")
        print(f"JD education length: {len(education) if education else 0}")
        print(f"==================================")

        # Calculate similarities - Fixed logic
        overall_similarity = calculate_similarity(cv_full_text, jd_text)
        
        # Fix mo_ta_ban_than_similarity: Calculate even if one side is empty
        mo_ta_ban_than_similarity = calculate_similarity(mo_ta_ban_than or "", description or "") if mo_ta_ban_than or description else 0.0
        
        # Fix ky_nang_similarity: Calculate if either side has content  
        ky_nang_similarity = calculate_similarity(ky_nang_text or "", skills_text or "") if ky_nang_text or skills_text else 0.0
        
        # Fix kinh_nghiem_similarity: Calculate if either side has content
        kinh_nghiem_similarity = calculate_similarity(kinh_nghiem_text or "", requirements or "") if kinh_nghiem_text or requirements else 0.0
        
        # Fix hoc_van_similarity: Calculate if either side has content
        hoc_van_similarity = calculate_similarity(hoc_van_text or "", education or "") if hoc_van_text or education else 0.0
        
        print(f"Calculated similarities:")
        print(f"  overall_similarity: {overall_similarity}")
        print(f"  mo_ta_ban_than_similarity: {mo_ta_ban_than_similarity}")
        print(f"  ky_nang_similarity: {ky_nang_similarity}")
        print(f"  kinh_nghiem_similarity: {kinh_nghiem_similarity}")
        print(f"  hoc_van_similarity: {hoc_van_similarity}")
        
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
                    'AUTO',
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
                    'AUTO',
                )
            )
            match_id = cursor.fetchone()[0]
        conn.commit()

        # Calculate match score as percentage (0-100)
        match_score = round(overall_similarity * 100, 2)
        
        # Generate reasoning based on scores
        reasoning_parts = []
        if ky_nang_similarity >= 0.8:
            reasoning_parts.append("Kỹ năng phù hợp cao")
        elif ky_nang_similarity >= 0.6:
            reasoning_parts.append("Kỹ năng phù hợp trung bình")
        else:
            reasoning_parts.append("Kỹ năng cần cải thiện")
            
        if kinh_nghiem_similarity >= 0.8:
            reasoning_parts.append("kinh nghiệm tốt")
        elif kinh_nghiem_similarity >= 0.6:
            reasoning_parts.append("kinh nghiệm phù hợp")
        else:
            reasoning_parts.append("kinh nghiệm hạn chế")
            
        reasoning = ", ".join(reasoning_parts)
        
        # Identify strengths and weaknesses
        strengths = []
        weaknesses = []
        
        if ky_nang_similarity >= 0.7:
            strengths.append("Kỹ năng chuyên môn")
        else:
            weaknesses.append("Kỹ năng chuyên môn")
            
        if kinh_nghiem_similarity >= 0.7:
            strengths.append("Kinh nghiệm làm việc")
        else:
            weaknesses.append("Kinh nghiệm làm việc")
            
        if hoc_van_similarity >= 0.7:
            strengths.append("Trình độ học vấn")
        else:
            weaknesses.append("Trình độ học vấn")

        return MatchResponse(
            match_id=match_id,
            job_id=request.job_id,
            candidate_id=candidate_id,
            cv_id=request.cv_id,
            overall_similarity=overall_similarity,
            match_score=match_score,
            mo_ta_ban_than_similarity=mo_ta_ban_than_similarity,
            ky_nang_similarity=ky_nang_similarity,
            kinh_nghiem_similarity=kinh_nghiem_similarity,
            hoc_van_similarity=hoc_van_similarity,
            reasoning=reasoning,
            strengths=strengths,
            weaknesses=weaknesses
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
        cv_column = f"{section_type}_embedding"  # Remove _384 suffix
        cv_emb = get_embedding("cv_embeddings", "cv_id", cv_id, cv_column)
        
        if not cv_emb:
            raise HTTPException(status_code=404, detail="CV embedding not found")
        
        # Get Job embedding
        job_column = f"full_jd_embedding_384" if section_type == "full_text" else f"{section_type}_embedding_384"
        job_emb = get_embedding("job_embeddings", "job_id", job_id, job_column)
        
        if not job_emb:
            raise HTTPException(status_code=404, detail="Job embedding not found")
        
        # Calculate similarity - ensure same dtype
        cv_array = np.array(cv_emb, dtype=np.float32)
        job_array = np.array(job_emb, dtype=np.float32)
        similarity = cos_sim(cv_array, job_array).item()
        
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


# OLD ENDPOINT REMOVED - Use unified endpoint instead


@app.get("/api/v1/ai/cv-job-match-analysis/{cv_id}/{job_id}")
async def cv_job_match_reasoning(cv_id: str, job_id: str):
    """
    Get AI reasoning for CV-Job match without requiring an application
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT vm.overall_similarity, vm.skills_similarity,
                   vm.experience_similarity, vm.education_similarity,
                   cc.parsed_content,
                   j.title, j.description, j.requirements
            FROM vector_matches vm
            JOIN cv_content cc ON cc.cv_id = vm.cv_id
            JOIN jobs j ON j.job_id = vm.job_id
            WHERE vm.cv_id = %s AND vm.job_id = %s
        """, (cv_id, job_id))

        row = cursor.fetchone()

        if not row:
            cursor.close()
            conn.close()
            raise HTTPException(status_code=404, detail="Match not found")

        (
            overall, skills_sim, exp_sim, edu_sim,
            parsed_content, job_title, jd_description, jd_requirements
        ) = row

        cursor.close()
        conn.close()

        # Build CV text from parsed content
        cv_text = make_cv_text(json.loads(parsed_content) if isinstance(parsed_content, str) else parsed_content)
        
        # Build JD text
        jd_text = f"{job_title}\n\n{jd_description}\n\nRequirements:\n{jd_requirements}"

        sim_scores = {
            "overall": float(overall) if overall else 0.0,
            "skills": float(skills_sim) if skills_sim else 0.0,
            "experience": float(exp_sim) if exp_sim else 0.0,
            "education": float(edu_sim) if edu_sim else 0.0
        }

        lang = detect_language_from_texts(jd_text, cv_text)

        # Try Groq API with retries
        reasoning = None
        max_retries = 3
        
        for attempt in range(max_retries):
            try:
                print(f"Attempting Groq API call (attempt {attempt + 1}/{max_retries})...")
                prompt = build_reasoning_prompt(cv_text, jd_text, sim_scores, lang)
                reasoning = call_groq_reasoning(prompt, lang)
                print("✅ Groq API call successful!")
                break
            except Exception as groq_error:
                print(f"❌ Groq API attempt {attempt + 1} failed: {str(groq_error)}")
                if attempt == max_retries - 1:  # Last attempt
                    print("🔄 All Groq API attempts failed, using enhanced fallback reasoning...")
                    
                    # Enhanced fallback reasoning with more details
                    overall_pct = sim_scores['overall'] * 100
                    skills_pct = sim_scores['skills'] * 100
                    exp_pct = sim_scores['experience'] * 100
                    edu_pct = sim_scores['education'] * 100
                    
                    # Detailed analysis based on scores
                    strengths = []
                    weaknesses = []
                    recommendations = []
                    
                    # Skills analysis
                    if skills_pct > 50:
                        strengths.append(f"🔹 Kỹ năng rất phù hợp ({skills_pct:.1f}%): CV thể hiện các kỹ năng có độ tương đồng cao với yêu cầu công việc")
                    elif skills_pct > 30:
                        strengths.append(f"🔹 Kỹ năng khá phù hợp ({skills_pct:.1f}%): Một số kỹ năng trong CV trùng khớp với yêu cầu")
                    else:
                        weaknesses.append(f"⚠️ Kỹ năng cần cải thiện ({skills_pct:.1f}%): CV chưa thể hiện rõ các kỹ năng phù hợp với công việc")
                        recommendations.append("💡 Bổ sung và làm nổi bật các kỹ năng chuyên môn phù hợp với JD")
                    
                    # Experience analysis
                    if exp_pct > 30:
                        strengths.append(f"🔹 Kinh nghiệm phù hợp ({exp_pct:.1f}%): Có kinh nghiệm liên quan đến vị trí ứng tuyển")
                    else:
                        weaknesses.append(f"⚠️ Thiếu thông tin kinh nghiệm ({exp_pct:.1f}%): CV chưa thể hiện kinh nghiệm phù hợp")
                        recommendations.append("💡 Bổ sung thông tin chi tiết về kinh nghiệm làm việc và dự án đã thực hiện")
                    
                    # Education analysis
                    if edu_pct > 30:
                        strengths.append(f"🔹 Học vấn phù hợp ({edu_pct:.1f}%): Nền tảng giáo dục phù hợp với yêu cầu")
                    else:
                        weaknesses.append(f"⚠️ Thiếu thông tin học vấn ({edu_pct:.1f}%): CV chưa thể hiện học vấn liên quan")
                        recommendations.append("💡 Bổ sung thông tin về trình độ học vấn và các chứng chỉ chuyên môn")
                    
                    # Overall assessment
                    if overall_pct > 60:
                        summary = f"📊 Độ phù hợp tổng thể cao ({overall_pct:.1f}%): Ứng viên có tiềm năng tốt cho vị trí này"
                    elif overall_pct > 40:
                        summary = f"📊 Độ phù hợp tổng thể trung bình ({overall_pct:.1f}%): Ứng viên cần cải thiện một số điểm"
                    else:
                        summary = f"📊 Độ phù hợp tổng thể thấp ({overall_pct:.1f}%): Cần cải thiện đáng kể để phù hợp với vị trí"
                    
                    # Additional recommendations
                    recommendations.extend([
                        "✅ Sử dụng từ khóa chuyên môn phù hợp với JD trong CV",
                        "✅ Làm nổi bật những thành tích và kết quả cụ thể",
                        "✅ Cấu trúc lại CV để dễ đọc và thu hút nhà tuyển dụng"
                    ])
                    
                    reasoning = {
                        "summary": summary,
                        "strengths": strengths,
                        "weaknesses": weaknesses,
                        "recommendations": recommendations
                    }

        return {
            "success": True,
            "cv_id": cv_id,
            "job_id": job_id,
            "job_title": job_title,
            "language_detected": lang,
            "similarity_scores": sim_scores,
            "reasoning": reasoning
        }
        
    except Exception as e:
        print(f"Error in cv_job_match_reasoning: {str(e)}")
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

@app.get("/api/v1/ai/job-recommendations/{candidate_uuid}")
async def get_unified_job_recommendations(
    candidate_uuid: str,
    top_k: int = Query(10, description="Number of top recommendations to return"),
    cv_id: str = Query(None, description="Specific CV ID to use (optional)"),
    include_reasoning: bool = Query(True, description="Include AI reasoning in response")
):
    """
    UNIFIED AI Job Recommendations Endpoint
    Uses candidate_uuid as primary identifier
    Auto-detects best CV and calculates matches with all available jobs
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        print(f"🎯 UNIFIED AI Recommendations for candidate: {candidate_uuid}")
        
        # Step 1: Get candidate's primary CV (or use specified cv_id)
        if cv_id:
            # Use specified CV
            cursor.execute("""
                SELECT cv_id, file_path, file_name 
                FROM candidate_cvs 
                WHERE cv_id = %s AND candidate_id = %s
            """, (cv_id, candidate_uuid))
        else:
            # Get primary CV
            cursor.execute("""
                SELECT cv_id, file_path, file_name 
                FROM candidate_cvs 
                WHERE candidate_id = %s AND is_primary = true
                ORDER BY created_at DESC 
                LIMIT 1
            """, (candidate_uuid,))
        
        cv_result = cursor.fetchone()
        if not cv_result:
            return {
                "success": False,
                "message": "No CV found for candidate",
                "candidate_uuid": candidate_uuid,
                "recommendations": [],
                "total_jobs": 0,
                "recommendations_count": 0,
                "error_code": "NO_CV_FOUND"
            }
        
        selected_cv_id, file_path, file_name = cv_result
        print(f"📄 Using CV: {file_name} (ID: {selected_cv_id})")

        # Step 2: Get all available published jobs
        cursor.execute("""
            SELECT job_id, title, description, requirements 
            FROM jobs 
            WHERE status = 'PUBLISHED'
            AND (application_deadline IS NULL OR application_deadline > CURRENT_DATE)
            ORDER BY created_at DESC, featured DESC
            LIMIT 50
        """)
        
        available_jobs = cursor.fetchall()
        if not available_jobs:
            return {
                "success": True,
                "message": "No available jobs found",
                "candidate_uuid": candidate_uuid,
                "cv_id": selected_cv_id,
                "recommendations": [],
                "total_jobs": 0,
                "recommendations_count": 0
            }

        print(f"📊 Found {len(available_jobs)} available jobs for analysis")

        # Step 3: Batch calculate matches
        job_ids = [job[0] for job in available_jobs]
        batch_request = {
            "cv_id": selected_cv_id,
            "job_ids": job_ids,
            "include_reasoning": include_reasoning
        }
        
        # Call existing batch matching logic
        batch_result = await batch_calculate_matches(batch_request)
        
        if not batch_result.get("success"):
            raise HTTPException(status_code=500, detail="Batch matching failed")

        # Step 4: Sort by match score and return top-k
        recommendations = sorted(
            batch_result.get("results", []),
            key=lambda x: x.get("match_score", 0),
            reverse=True
        )[:top_k]

        # Step 5: Add ranking information
        for i, rec in enumerate(recommendations):
            rec["recommendation_rank"] = i + 1
            rec["candidate_uuid"] = candidate_uuid

        avg_score = sum(r.get("match_score", 0) for r in recommendations) / len(recommendations) if recommendations else 0

        return {
            "success": True,
            "message": f"Generated {len(recommendations)} AI-powered job recommendations",
            "candidate_uuid": candidate_uuid,
            "cv_id": selected_cv_id,
            "cv_name": file_name,
            "recommendations": recommendations,
            "total_jobs": len(available_jobs),
            "recommendations_count": len(recommendations),
            "average_match_score": round(avg_score, 2),
            "top_k": top_k,
            "processing_time": batch_result.get("processing_time", "0s"),
            "api_version": "unified_v1"
        }

    except Exception as e:
        print(f"❌ Error in unified recommendations: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to generate recommendations: {str(e)}"
        )
    finally:
        cursor.close()
        conn.close()

@app.post("/api/v1/ai/batch-calculate-matches")
async def batch_calculate_matches(request: dict):
    """
    Calculate matches for a CV against ALL active jobs in database
    """
    try:
        cv_id = request.get("cv_id")
        if not cv_id:
            raise HTTPException(status_code=400, detail="cv_id is required")
            
        # Get all active jobs
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT j.job_id, j.title, c.company_name, j.experience_level, j.work_arrangement
            FROM jobs j
            LEFT JOIN companies c ON j.company_id = c.company_id
            WHERE j.status = 'PUBLISHED' 
            AND (j.application_deadline IS NULL OR j.application_deadline > CURRENT_DATE)
            ORDER BY j.created_at DESC
        """)
        
        active_jobs = cursor.fetchall()
        
        if not active_jobs:
            return {
                "success": True,
                "message": "No active jobs found",
                "cv_id": cv_id,
                "matches_calculated": 0,
                "results": []
            }
        
        # Calculate matches for all jobs
        results = []
        successful_matches = 0
        
        for job_id, job_title, company_name, experience_level, work_arrangement in active_jobs:
            try:
                # Call the existing calculate_match function
                match_request = MatchRequest(cv_id=cv_id, job_id=job_id)
                match_result = await calculate_match(match_request)
                
                results.append({
                    "job_id": job_id,
                    "job_title": job_title,
                    "company_name": company_name or "Unknown",
                    "experience_level": experience_level or "Not specified",
                    "work_arrangement": work_arrangement or "Not specified",
                    "match_score": match_result.match_score,
                    "reasoning": match_result.reasoning,
                    "strengths": match_result.strengths,
                    "weaknesses": match_result.weaknesses,
                    "status": "success"
                })
                successful_matches += 1
                
            except Exception as job_error:
                results.append({
                    "job_id": job_id,
                    "job_title": job_title,
                    "company_name": company_name or "Unknown",
                    "experience_level": experience_level or "Not specified",
                    "work_arrangement": work_arrangement or "Not specified",
                    "status": "error",
                    "error": str(job_error)
                })
        
        # Sort results by match_score descending
        results.sort(key=lambda x: x.get('match_score', 0), reverse=True)
        
        cursor.close()
        conn.close()
        
        return {
            "success": True,
            "message": f"Batch matching completed for {successful_matches}/{len(active_jobs)} jobs",
            "cv_id": cv_id,
            "total_jobs": len(active_jobs),
            "matches_calculated": successful_matches,
            "results": results
        }
        
    except Exception as e:
        print(f"Error in batch_calculate_matches: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("SERVICE_PORT", 8001))
    host = os.getenv("SERVICE_HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)