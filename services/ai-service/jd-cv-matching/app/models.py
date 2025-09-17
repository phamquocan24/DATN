from pydantic import BaseModel
from uuid import UUID

class MatchRequest(BaseModel):
    cv_id: str  # Changed from int to str to accept UUID
    job_id: str  # Changed from int to str to accept UUID

class MatchResponse(BaseModel):
    match_id: str  # Changed from int to str to return UUID
    job_id: str  # Changed from int to str to return UUID  
    candidate_id: str  # Changed from int to str to return UUID
    cv_id: str  # Changed from int to str to return UUID
    overall_similarity: float
    match_score: float  # Percentage score (0-100)
    mo_ta_ban_than_similarity: float
    ky_nang_similarity: float
    kinh_nghiem_similarity: float
    hoc_van_similarity: float
    reasoning: str = ""  # Match reasoning
    strengths: list = []  # Strong points
    weaknesses: list = []  # Weak points