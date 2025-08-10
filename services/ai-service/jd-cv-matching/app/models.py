from pydantic import BaseModel

class MatchRequest(BaseModel):
    cv_id: int
    job_id: int

class MatchResponse(BaseModel):
    match_id: int
    job_id: int
    candidate_id: int
    cv_id: int
    overall_similarity: float
    mo_ta_ban_than_similarity: float
    ky_nang_similarity: float
    kinh_nghiem_similarity: float
    hoc_van_similarity: float