from sqlalchemy import ARRAY, Column, BigInteger, Date, Integer, String, Text, ForeignKey, Boolean, DECIMAL, TIMESTAMP, JSON, VARCHAR
from sqlalchemy.dialects.postgresql import UUID
import uuid
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from .db import Base
from sqlalchemy.sql import func

class Job(Base):
    __tablename__ = "jobs"
    job_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recruiter_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.company_id", ondelete="CASCADE"))
    title = Column(String(200))
    description = Column(Text)
    requirements = Column(Text)
    responsibilities = Column(Text)
    experience_level = Column(String(20))
    employment_type = Column(String(20))
    salary_min = Column(DECIMAL(12,2))
    salary_max = Column(DECIMAL(12,2))
    city_id = Column(Integer)
    work_arrangement = Column(String(20))
    min_experience_years = Column(Integer)
    max_experience_years = Column(Integer)
    category = Column(String(100))
    education_requirements = Column(Text)
    language_requirements = Column(ARRAY(String))
    application_deadline = Column(Date)
    

class JobTest(Base):
    __tablename__ = "job_tests"
    test_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.job_id", ondelete="CASCADE"))
    test_name = Column(String(200))
    test_type = Column(String(30))
    difficulty_level = Column(String(20))
    duration_minutes = Column(Integer)
    passing_score = Column(DECIMAL(5,2))
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)

class TestQuestion(Base):
    __tablename__ = "test_questions"
    question_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_id = Column(UUID(as_uuid=True), ForeignKey("job_tests.test_id", ondelete="CASCADE"))
    question_text = Column(Text)
    question_type = Column(String(30))
    points = Column(DECIMAL(5,2))
    time_limit_seconds = Column(Integer)
    order_index = Column(Integer)
    explanation = Column(Text)
    required = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

class QuestionAnswer(Base):
    __tablename__ = "question_answers"
    answer_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    result_id = Column(UUID(as_uuid=True), ForeignKey("test_results.result_id", ondelete="CASCADE"))
    question_id = Column(UUID(as_uuid=True), ForeignKey("test_questions.question_id"))
    answer_text = Column(Text)
    is_correct = Column(Boolean)
    points_earned = Column(DECIMAL(5,2))
    time_taken_seconds = Column(Integer)
    submitted_at = Column(TIMESTAMP, default=datetime.utcnow)

class TestResult(Base):
    __tablename__ = "test_results"
    result_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.application_id", ondelete="CASCADE"))
    test_id = Column(UUID(as_uuid=True), ForeignKey("job_tests.test_id"))
    start_time = Column(TIMESTAMP)
    submit_time = Column(TIMESTAMP)
    total_score = Column(DECIMAL(5,2))
    percentage = Column(DECIMAL(5,2))
    status = Column(String(20))
    passed = Column(Boolean)
    time_taken_seconds = Column(Integer)
    graded_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    graded_at = Column(TIMESTAMP)
    feedback = Column(Text)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

class Application(Base):
    __tablename__ = "applications"

    application_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.job_id", ondelete="CASCADE"))
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"))
    cv_id = Column(UUID(as_uuid=True), ForeignKey("candidate_cvs.cv_id"))
    cover_letter = Column(Text)
    ai_match_score = Column(DECIMAL(5, 2))
    ai_analysis = Column(JSON)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    reviewed_at = Column(TIMESTAMP)
    rejection_reason = Column(Text)
    notes = Column(Text)
    priority = Column(VARCHAR(20))
    current_status = Column(VARCHAR(30))
    submitted_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255))
    phone = Column(String(20))
    full_name = Column(String(200), nullable=False)
    role = Column(String(20))  # Bạn có thể thêm validate ở tầng ứng dụng
    auth_provider = Column(String(20), default="LOCAL")
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=func.now())
    updated_at = Column(TIMESTAMP, default=func.now())