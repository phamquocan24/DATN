# DATN Project Structure

## Cấu trúc thư mục mới

```
DATN/
├── ai-cv/                    # AI CV Processing Service (Port 8002)
│   ├── main.py
│   ├── requirements.txt
│   └── shared/
├── ai-match/                 # AI Job Matching Service (Port 8003)
│   ├── app/
│   ├── requirements.txt
│   └── shared/
├── ai-question/              # AI Questions Generation Service (Port 8001)
│   ├── app/
│   ├── requirements.txt
│   └── shared/
├── business/                 # Business Service & API Gateway
│   ├── server.js             # Business Service (Port 5001)
│   ├── api-gateway/          # API Gateway (Port 4000)
│   └── package.json
├── frontend/                 # Frontend Service (Port 5173)
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── services/                 # Thư mục cũ (backup)
```

## Services và Ports

| Service | Port | Công nghệ | Mô tả |
|---------|------|-----------|--------|
| AI CV Processing | 8002 | Python/FastAPI | Xử lý và cải thiện CV |
| AI Matching | 8003 | Python/FastAPI | Matching CV với JD |
| AI Questions | 8001 | Python/FastAPI | Tạo câu hỏi test |
| Business Service | 5001 | Node.js/Express | Logic nghiệp vụ |
| API Gateway | 4000 | Node.js/Express | Gateway routing |
| Frontend | 5173 | React/Vite | Giao diện người dùng |

## Chạy từng service

### AI Services (Python)
```bash
cd ai-cv && python main.py
cd ai-match && cd app && python main.py
cd ai-question && cd app && python main.py
```

### Business Services (Node.js)
```bash
cd business && node server.js
cd business/api-gateway && node server.js
```

### Frontend
```bash
cd frontend && npm run dev
```

## PM2 Management
- ai-cv-processing: PM2 ID 2
- ai-matching: PM2 ID 3
- ai-questions: PM2 ID 41
- api-gateway: PM2 ID 1
- business-service: PM2 ID 33
- frontend-service: PM2 ID 37
