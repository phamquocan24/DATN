from fastapi import FastAPI, Depends, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .db import get_db
from .utils import (
    get_job, get_or_create_job_test, create_question,
    generate_questions_from_jd, evaluate_single_answer, evaluate_test_result, get_answer_details
)
from .models import TestQuestion, JobTest, Job, QuestionAnswer, TestResult,  Application
from .utils import GenerateQuestionRequest, QuestionCreate, EvaluateAnswerRequest
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="JD AI Interview Question API",
    description="AI-powered interview question generation and evaluation service",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_prefix = "/api/v1/ai"

# 1. Generate questions from single JD
@app.post(f"{api_prefix}/generate-interview-questions")
def generate_interview_questions(payload: GenerateQuestionRequest, db: Session = Depends(get_db)):
    # 1. Lấy thông tin job
    job = get_job(db, payload.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # 2. Gọi AI để sinh câu hỏi (kết quả là list[dict])
    questions = generate_questions_from_jd(job.description or "")
    if not questions:
        raise HTTPException(status_code=500, detail="Failed to generate questions")

    # 3. Tạo hoặc lấy job_test tương ứng
    test = get_or_create_job_test(db, payload.job_id)

    # 4. Lưu từng câu hỏi vào test_questions
    saved_questions = []
    for idx, item in enumerate(questions):
        q = TestQuestion(
            test_id=test.test_id,
            question_text=item["question_text"],
            question_type=item["question_type"],  # "core", "problem_solving", "fit"
            points=1.0,
            time_limit_seconds=120,
            order_index=idx + 1,
            explanation="",
            required=True
        )
        db.add(q)
        saved_questions.append(q)

    db.commit()

    return {
        "job_id": payload.job_id,
        "test_id": test.test_id,
        "questions_saved": [
            {
                "question_text": q.question_text,
                #"question_type": q.question_type
            }
            for q in saved_questions
        ]
    }



# 2. Bulk generate for multiple jobs (example)
@app.post(f"{api_prefix}/questions/bulk-generate")
def bulk_generate_questions(job_ids: List[str], db: Session = Depends(get_db)):
    results = []
    for job_id in job_ids:
        job = get_job(db, job_id)
        if not job:
            continue
        qs = generate_questions_from_jd(job.description or "")
        results.append({"job_id": job_id, "questions": qs})
    return {"results": results}

# 3. Customize questions (HR submit new ones)
@app.post(f"{api_prefix}/customize-questions")
def customize_questions(payload: QuestionCreate, db: Session = Depends(get_db)):
    test = db.query(JobTest).filter(JobTest.test_id == payload.test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    q = create_question(db, payload.test_id, payload.question_text, payload.explanation)
    return {"question_id": q.question_id, "message": "Question saved"}

# 4. Update existing question
@app.put(f"{api_prefix}/questions/{{question_id}}/customize")
def update_question(question_id: str = Path(...), payload: QuestionCreate = Depends(), db: Session = Depends(get_db)):
    q = db.query(TestQuestion).filter(TestQuestion.question_id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    q.question_text = payload.question_text
    q.explanation = payload.explanation
    db.commit()
    return {"message": "Question updated", "question_id": q.question_id}

# 5. Get question templates (demo hardcoded or rule-based)
@app.get(f"{api_prefix}/question-templates")
def get_question_templates():
    return {
        "templates": [
            "What challenges have you faced in [ROLE]?",
            "How would you approach [TASK] described in the JD?",
            "Give an example of solving a real-world problem relevant to this role."
        ]
    }

# 6. Validate answer using LLM
@app.post(f"{api_prefix}/evaluate-single-answer")
def evaluate_one(question_id: str, answer_id: str, db: Session = Depends(get_db)):
    result = evaluate_single_answer(question_id, answer_id, db)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

# 7. Evaluate test result
@app.post(f"{api_prefix}/evaluate-test-result")
def api_evaluate_result(result_id: str, db: Session = Depends(get_db)):
    """
    Đánh giá toàn bộ bài test theo result_id,
    chấm từng câu trả lời và cập nhật kết quả tổng thể.
    """
    return evaluate_test_result(result_id, db)

@app.get(f"{api_prefix}/test-result/{{result_id}}/answers") 
def get_result_answers(result_id: str, db: Session = Depends(get_db)):
    return get_answer_details(result_id, db)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "generating-and-evaluating-questions"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("SERVICE_PORT", 8002))
    host = os.getenv("SERVICE_HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
