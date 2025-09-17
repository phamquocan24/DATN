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
    title = Column(String(300), nullable=False)  # Fixed: added nullable=False as per schema
    description = Column(Text)
    requirements = Column(Text)
    responsibilities = Column(Text)
    benefits = Column(Text)
    experience_level = Column(String(20))
    employment_type = Column(String(30))
    work_arrangement = Column(String(20))  # Fixed: use work_arrangement instead of remote_work_option
    salary_min = Column(DECIMAL(12,2))
    salary_max = Column(DECIMAL(12,2))
    currency = Column(String(3))  # Fixed: reduced to 3 chars as per schema
    city_id = Column(UUID(as_uuid=True))
    district_id = Column(UUID(as_uuid=True))
    address = Column(Text)
    min_experience_years = Column(Integer)  # Added missing fields from schema
    max_experience_years = Column(Integer)
    category = Column(String(100))
    education_requirements = Column(Text)
    language_requirements = Column(ARRAY(String))
    application_deadline = Column(Date)
    auto_review_threshold = Column(DECIMAL(3,2))
    priority_level = Column(String(20))
    featured = Column(Boolean)
    status = Column(String(30))
    published_at = Column(TIMESTAMP)
    # Removed closed_at as it doesn't exist in actual schema
    view_count = Column(Integer, default=0)
    application_count = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)
    max_applications = Column(Integer)
    remote_work_option = Column(String(30))  # Added this field from schema
    

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
    question_text = Column(Text, nullable=False)  # Added nullable=False as per schema
    question_type = Column(String(30))
    points = Column(DECIMAL(5,2), default=1.00)  # Added default as per schema
    time_limit_seconds = Column(Integer)
    order_index = Column(Integer)
    explanation = Column(Text)
    required = Column(Boolean, default=True)
    difficulty_level = Column(String(20))  # Added from schema
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)  # Added from schema

class QuestionAnswer(Base):
    __tablename__ = "question_answers"
    answer_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    result_id = Column(UUID(as_uuid=True), ForeignKey("test_results.result_id", ondelete="CASCADE"))
    question_id = Column(UUID(as_uuid=True), ForeignKey("test_questions.question_id"))
    selected_option_id = Column(UUID(as_uuid=True), ForeignKey("question_options.option_id"))  # Added from schema
    answer_text = Column(Text)
    is_correct = Column(Boolean)
    points_earned = Column(DECIMAL(5,2), default=0)  # Added default as per schema
    time_taken_seconds = Column(Integer)
    submitted_at = Column(TIMESTAMP, default=datetime.utcnow)

class TestResult(Base):
    __tablename__ = "test_results"
    result_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.application_id", ondelete="CASCADE"))
    test_id = Column(UUID(as_uuid=True), ForeignKey("job_tests.test_id"))
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"))  # Added missing field from schema
    start_time = Column(TIMESTAMP)
    submit_time = Column(TIMESTAMP)
    total_score = Column(DECIMAL(5,2))
    max_possible_score = Column(DECIMAL(5,2))  # Added from schema
    percentage = Column(DECIMAL(5,2))
    status = Column(String(20), default='IN_PROGRESS')  # Added default as per schema
    passed = Column(Boolean)
    time_taken_seconds = Column(Integer)
    graded_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    graded_at = Column(TIMESTAMP)
    feedback = Column(Text)
    auto_graded = Column(Boolean, default=False)  # Added from schema
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