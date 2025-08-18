# AI Matching Service Integration

## Tổng quan

Hệ thống đã được tích hợp để sử dụng trực tiếp AI service cho chức năng matching CV-Job, bỏ qua business service để có hiệu suất tốt hơn và tận dụng tối đa khả năng của AI.

## Kiến trúc

```
Frontend → AI Service (port 8004) → Database
```

Thay vì:
```
Frontend → Business Service → AI Service → Database
```

## Các API Endpoints của AI Service

### 1. Calculate Match Score
```
POST /api/v1/ai/calculate-match
```
**Request:**
```json
{
  "cv_id": "uuid",
  "job_id": "uuid"
}
```

**Response:**
```json
{
  "match_id": "uuid",
  "job_id": "uuid", 
  "candidate_id": "uuid",
  "cv_id": "uuid",
  "overall_similarity": 0.85,
  "mo_ta_ban_than_similarity": 0.80,
  "ky_nang_similarity": 0.90,
  "kinh_nghiem_similarity": 0.85,
  "hoc_van_similarity": 0.75
}
```

### 2. Job Recommendations
```
GET /api/v1/ai/job-recommendations/{candidate_id}?top_k=5
```

**Response:**
```json
{
  "candidate_id": "uuid",
  "cv_id": "uuid", 
  "top_k": 5,
  "recommendations": [
    {
      "job_id": "uuid",
      "title": "Software Engineer",
      "group": "Tech Company",
      "overall_similarity": 0.85
    }
  ]
}
```

### 3. Similarity Score
```
GET /api/v1/ai/similarity?cv_id=uuid&job_id=uuid&section_type=full_text
```

**Response:**
```json
{
  "similarity": 0.85
}
```

### 4. Match Analysis
```
GET /api/v1/ai/match-analysis/{application_id}
```

## Database Schema

### CV Embeddings
```sql
CREATE TABLE cv_embeddings (
  embedding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id UUID REFERENCES candidate_cvs(cv_id),
  candidate_id UUID REFERENCES candidate_profiles(profile_id),
  -- SBERT embeddings (384 dims)
  full_text_embedding_384 VECTOR(384),
  skills_embedding_384 VECTOR(384),
  experience_embedding_384 VECTOR(384),
  education_embedding_384 VECTOR(384),
  -- Larger embeddings (1536 dims)
  full_text_embedding_1536 VECTOR(1536),
  skills_embedding_1536 VECTOR(1536),
  experience_embedding_1536 VECTOR(1536),
  education_embedding_1536 VECTOR(1536),
  model_version VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Job Embeddings
```sql
CREATE TABLE job_embeddings (
  embedding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(job_id),
  -- SBERT embeddings (384 dims)
  full_jd_embedding_384 VECTOR(384),
  requirements_embedding_384 VECTOR(384),
  skills_embedding_384 VECTOR(384),
  responsibilities_embedding_384 VECTOR(384),
  -- Larger embeddings (1536 dims)
  full_jd_embedding_1536 VECTOR(1536),
  requirements_embedding_1536 VECTOR(1536),
  skills_embedding_1536 VECTOR(1536),
  responsibilities_embedding_1536 VECTOR(1536),
  model_version VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Vector Matches
```sql
CREATE TABLE vector_matches (
  match_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(job_id),
  candidate_id UUID REFERENCES candidate_profiles(profile_id),
  cv_id UUID REFERENCES candidate_cvs(cv_id),
  cv_embedding_id UUID REFERENCES cv_embeddings(embedding_id),
  job_embedding_id UUID REFERENCES job_embeddings(embedding_id),
  overall_similarity DECIMAL(5,4),
  skills_similarity DECIMAL(5,4),
  experience_similarity DECIMAL(5,4),
  education_similarity DECIMAL(5,4),
  weighted_score DECIMAL(5,4),
  match_type VARCHAR(30) CHECK (match_type IN ('AUTO', 'MANUAL', 'AI_SUGGEST')),
  last_calculated TIMESTAMP DEFAULT NOW(),
  computed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Frontend Integration

### 1. AI Matching API Service
File: `services/frontend-service/src/services/aiMatchingApi.ts`

Cung cấp các functions:
- `calculateAIMatchScore(cvId, jobId)` - Tính match score cho 1 cặp CV-Job
- `batchCalculateAIMatchScores(cvId, jobIds)` - Tính match score cho nhiều jobs cùng lúc
- `getAIJobRecommendations(candidateId, topK)` - Lấy job recommendations
- `getAISimilarity(cvId, jobId, sectionType)` - Lấy similarity score
- `checkAIMatchingServiceHealth()` - Kiểm tra health của service

### 2. Resume Component Updates
File: `services/frontend-service/src/components/candidate/Resume.tsx`

- Tự động lưu CV data và content vào database sau khi extract
- Sử dụng AI service trực tiếp cho matching thay vì text-based matching
- Fallback về text-based matching nếu AI service không khả dụng
- Batch processing để tính match scores hiệu quả hơn

### 3. Candidate API Updates  
File: `services/frontend-service/src/services/candidateApi.ts`

- `saveExtractedCV()` - Lưu CV metadata
- `saveCVContent()` - Lưu CV parsed content cho AI service

## Quy trình hoạt động

### 1. CV Upload & Processing
1. User upload CV file
2. AI service extract thông tin từ CV
3. Frontend tự động lưu CV metadata vào `candidate_cvs`
4. Frontend lưu parsed content vào `cv_content`
5. AI service tạo embeddings và lưu vào `cv_embeddings`

### 2. Job Matching
1. Frontend gọi `batchCalculateAIMatchScores(cvId, jobIds)`
2. AI service:
   - Lấy CV embeddings từ database
   - Tạo job embeddings nếu chưa có
   - Tính cosine similarity giữa CV và Job embeddings
   - Lưu kết quả vào `vector_matches`
   - Trả về detailed scores
3. Frontend hiển thị match scores với grades

### 3. Job Recommendations
1. Frontend gọi `getAIJobRecommendations(candidateId)`
2. AI service:
   - Lấy primary CV của candidate
   - Tính similarity với tất cả jobs active
   - Sắp xếp theo similarity score
   - Trả về top-K recommendations

## Configuration

### AI Service Environment
```env
# Database
POSTGRES_DB=recruitment_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Embedding Model
EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
```

### Frontend Environment
```env
# AI Service URL
VITE_AI_MATCHING_SERVICE_URL=http://localhost:8001
```

## Deployment

### 1. Start AI Service
```bash
cd services/ai-service/jd-cv-matching
pip install -r requirements.txt
python run.py
```

### 2. Database Migration
```bash
cd database
# Run migration 003 to add embedding tables
psql -d recruitment_db -f migrations/003_add_ai_embeddings_vector.sql
```

### 3. Frontend Build
```bash
cd services/frontend-service
npm install
npm run dev
```

## Monitoring & Health Checks

### AI Service Health
```bash
curl http://localhost:8001/health
```

### Database Vector Extension
```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### Embedding Statistics
```sql
-- Check CV embeddings
SELECT COUNT(*) as cv_embeddings_count FROM cv_embeddings;

-- Check Job embeddings  
SELECT COUNT(*) as job_embeddings_count FROM job_embeddings;

-- Check matches
SELECT COUNT(*) as matches_count FROM vector_matches;
```

## Performance Optimizations

1. **Batch Processing**: Sử dụng batch API để tính nhiều matches cùng lúc
2. **Caching**: AI service cache embeddings trong database
3. **Indexing**: Tạo indexes cho vector similarity search
4. **Connection Pooling**: Sử dụng connection pool cho database
5. **Async Processing**: Non-blocking API calls

## Error Handling

1. **AI Service Unavailable**: Fallback về text-based matching
2. **Database Connection**: Retry logic với exponential backoff  
3. **Invalid UUIDs**: Validation và error messages
4. **Missing Data**: Graceful degradation với default scores

## Future Enhancements

1. **Real-time Matching**: WebSocket integration cho real-time updates
2. **Advanced Analytics**: Match quality analytics và insights
3. **A/B Testing**: So sánh hiệu quả các embedding models
4. **Personalization**: User preference learning
5. **Multi-language**: Support nhiều ngôn ngữ
