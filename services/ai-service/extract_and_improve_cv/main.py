import os
# Set timezone to Vietnam Standard Time
os.environ['TZ'] = 'Asia/Ho_Chi_Minh'

from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse, PlainTextResponse
import pdfplumber
from groq import Groq
import json
import os
import shutil
import fitz  # PyMuPDF - thay thế pdf2image
from PIL import Image
import io
import base64
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import psycopg2
from psycopg2.extras import RealDictCursor
import uuid
from datetime import datetime
from dotenv import load_dotenv
import pathlib

# Load .env file from current directory
env_path = pathlib.Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="CV Extraction and Improvement API",
    description="AI-powered CV extraction and improvement service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Hoặc chỉ định origin như ["http://localhost:5500"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

#-----------------Hàm trích xuất thông tin từ cv-------------------------
# đầu vào: đường dẫn cv
# đầu ra: cv định dạng json theo mẫu cho trước
def extract_cv(cv_path, json_mau):
    cv_text = ""
    with pdfplumber.open(cv_path) as pdf:
        for page in pdf.pages:
            cv_text += page.extract_text() + "\n"

    # Khởi tạo client
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

    # Gửi yêu cầu
    chat_completion = client.chat.completions.create(
        messages=[
            # Thiết lập hệ thống
            {
                 "role": "system",
                 "content": "You are a helpful assistant."
            },
            # Prompt
            {
                "role": "user",
                "content": f"""
            Tôi có đoạn văn bản CV như sau, bạn hãy trích xuất các thông tin quan trọng theo định dạng JSON:

            Văn bản CV:
            {cv_text}

            Yêu cầu trích xuất theo mẫu json (trường nào không có thì để trống, và định dạng trong các trường giống json mẫu, trích xuất đầy đủ thông tin, không thêm bớt thông tin):
            {json_mau}

            Hãy chỉ trả lời bằng JSON, không thêm lời giải thích.
            """
            }
        ],
        response_format={"type": "json_object"}, # định dạng trả về: json
        model = "llama-3.3-70b-versatile" # mô hình đang dùng
    )
    # Trả về kết quả json 
    response = chat_completion.choices[0].message.content.strip()
    return(response)


# hàm để chuyển ảnh từ định dạng Image thành định dạng chuỗi base64
def encode_image(image):
    buffered = io.BytesIO()
    image.save(buffered, format="JPEG")
    return base64.b64encode(buffered.getvalue()).decode('utf-8')

# hàm chuyển PDF thành images sử dụng PyMuPDF
def pdf_to_images(pdf_path):
    """Convert PDF to list of PIL Images using PyMuPDF"""
    images = []
    try:
        doc = fitz.open(pdf_path)
        for page_num in range(len(doc)):
            page = doc[page_num]
            pix = page.get_pixmap()
            img_data = pix.tobytes('png')
            pil_image = Image.open(io.BytesIO(img_data))
            images.append(pil_image)
        doc.close()
        return images
    except Exception as e:
        print(f"Error converting PDF to images: {e}")
        return []


#-------------------Hàm để yêu cầu cải thiện cv------------------------
def improve_cv(cv_path, cong_ty_ung_tuyen:str, vi_tri_ung_tuyen:str, linh_vuc:str):
    cv_text = ""
    with pdfplumber.open(cv_path) as pdf:
        for page in pdf.pages:
            cv_text += page.extract_text() + "\n"

    cv_extract = extract_cv(cv_path, json_mau)

    TARGET_COMPANY_INFO = "Công ty: " + cong_ty_ung_tuyen + "\n Vị trí tuyển dụng: "+ vi_tri_ung_tuyen +"\n Lĩnh vực: "+ linh_vuc

    # Bước 3: Tạo danh sách các phần nội dung hình ảnh
    content = [
        {
            "type": "text",
            "text": f"""Tôi cần bạn đánh giá và đề xuất cải tiến cho CV dưới đây:
    1. Nêu điểm mạnh của cv
    2. Nhận xét về ngoại quan(phần nhìn của CV), gợi ý cải tiến nếu cần
    3. Nhận xét về phần nội dung cv xem đã phù hợp với thông tin ứng tuyển chưa, nói cụ thể về những phần cần cải thiện
    Hãy trình bày thành các đầu mục rõ ràng, dễ nhìn


    Thông tin công ty ứng tuyển:
    {TARGET_COMPANY_INFO}

    Dưới đây là CV của ứng viên cả về hình ảnh và nội dung:
    """
        },
        {
            "type": "text",
            "text": f"Nội dung CV (đã trích xuất):\n{cv_extract}"
        }
    ]

    # Convert PDF to images using PyMuPDF (thay thế pdf2image)
    images = pdf_to_images(cv_path)
    
    if images:
        print(f"Successfully converted PDF to {len(images)} images")
        for image in images:
            base64_image = encode_image(image)
            content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{base64_image}",
                }
            })
    else:
        print("Warning: Could not convert PDF to images, proceeding with text only")
        content.append({
            "type": "text",
            "text": "Note: Visual analysis not available. Analysis based on text content only."
        })

    # Khởi tạo client
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

    # Gửi yêu cầu
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": content,
            }
        ],
        model="meta-llama/llama-4-scout-17b-16e-instruct",
    )
    # Trả về kết quả
    response = chat_completion.choices[0].message.content.strip()
    return PlainTextResponse(response)

# Load mẫu JSON
json_mau_path = r'dataset/mau.json'
with open(json_mau_path, "r", encoding="utf-8") as f:
    json_mau = json.dumps(json.load(f), ensure_ascii=False, indent=2)

# model="llama-3.3-70b-versatile"


# Kết nối MongoDB
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb+srv://leminhst24:1234@cluster0.ntwmf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
client = AsyncIOMotorClient(MONGODB_URL)
db = client["cv"]
feedback_collection = db["feedback"]

# PostgreSQL connection configuration
POSTGRES_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'userdb'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'postgres')
}

def get_postgres_connection():
    """Create PostgreSQL connection"""
    try:
        conn = psycopg2.connect(**POSTGRES_CONFIG)
        return conn
    except Exception as e:
        print(f"Error connecting to PostgreSQL: {e}")
        return None

class Feedback(BaseModel):
    rating: int
    comment: str = ""

class CVExtractRequest(BaseModel):
    cv_id: str
    file_content: str = None

def save_cv_content_to_postgres(cv_id: str, extracted_data: dict):
    """Save extracted CV content to PostgreSQL with enhanced field extraction"""
    try:
        conn = get_postgres_connection()
        if not conn:
            return {"success": False, "error": "Database connection failed"}
        
        cursor = conn.cursor()
        
        # Extract raw text if available
        raw_text = extracted_data.get('raw_text', '')
        
        # Store the full extracted data as JSON
        parsed_content = json.dumps(extracted_data, ensure_ascii=False)
        
        # Extract specific fields for better querying
        extracted_skills = []
        extracted_contact = {}
        extracted_experience = []
        extracted_education = []
        
        # Extract skills from parsed data
        if 'ky_nang' in extracted_data:
            skills_data = extracted_data['ky_nang']
            if isinstance(skills_data, dict):
                all_skills = []
                for skill_category in ['ky_nang_chuyen_mon', 'ngon_ngu_lap_trinh', 'cong_cu_va_cong_nghe']:
                    if skill_category in skills_data and isinstance(skills_data[skill_category], list):
                        all_skills.extend(skills_data[skill_category])
                extracted_skills = [skill for skill in all_skills if skill and skill.strip()]
        
        # Extract contact information
        if any(field in extracted_data for field in ['ho_va_ten', 'email', 'so_dien_thoai', 'dia_chi']):
            extracted_contact = {
                'name': extracted_data.get('ho_va_ten', ''),
                'email': extracted_data.get('email', ''),
                'phone': extracted_data.get('so_dien_thoai', ''),
                'address': extracted_data.get('dia_chi', ''),
                'website': extracted_data.get('website', ''),
                'linkedin': extracted_data.get('linkedin', ''),
                'github': extracted_data.get('github', '')
            }
        
        # Extract work experience
        if 'kinh_nghiem_lam_viec' in extracted_data and isinstance(extracted_data['kinh_nghiem_lam_viec'], list):
            extracted_experience = extracted_data['kinh_nghiem_lam_viec']
        
        # Extract education
        if 'hoc_van' in extracted_data and isinstance(extracted_data['hoc_van'], list):
            extracted_education = extracted_data['hoc_van']
        
        # Insert or update cv_content table with enhanced fields
        query = """
            INSERT INTO cv_content (
                cv_id, raw_text, parsed_content, 
                extracted_skills, extracted_contact, extracted_experience, extracted_education,
                created_at, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            ON CONFLICT (cv_id) 
            DO UPDATE SET 
                parsed_content = EXCLUDED.parsed_content,
                raw_text = EXCLUDED.raw_text,
                extracted_skills = EXCLUDED.extracted_skills,
                extracted_contact = EXCLUDED.extracted_contact,
                extracted_experience = EXCLUDED.extracted_experience,
                extracted_education = EXCLUDED.extracted_education,
                updated_at = NOW()
            RETURNING cv_id
        """
        
        cursor.execute(query, (
            cv_id, raw_text, parsed_content,
            extracted_skills, json.dumps(extracted_contact, ensure_ascii=False),
            json.dumps(extracted_experience, ensure_ascii=False), 
            json.dumps(extracted_education, ensure_ascii=False)
        ))
        result = cursor.fetchone()
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ CV content saved to PostgreSQL for cv_id: {cv_id}")
        print(f"📊 Extracted {len(extracted_skills)} skills, {len(extracted_experience)} work experiences, {len(extracted_education)} education records")
        return {"success": True, "cv_id": result[0] if result else cv_id}
        
    except Exception as e:
        print(f"❌ Error saving CV content to PostgreSQL: {e}")
        if conn:
            conn.rollback()
            conn.close()
        return {"success": False, "error": str(e)}

@app.post("/extract-cv")
def extract_cv2(cv: UploadFile = File(...), cv_id: str = Form(None)):
    if not cv.filename.endswith(".pdf"):
        return JSONResponse(status_code=400, content={"message": "Chỉ hỗ trợ file PDF."})

    file_path = os.path.join(UPLOAD_DIR, cv.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(cv.file, buffer)

    try:
        # Extract CV content using AI
        cv_extract = extract_cv(file_path, json_mau)
        
        # If cv_id is provided, save to PostgreSQL
        if cv_id:
            # Add raw text to extracted data
            raw_text = ""
            try:
                with pdfplumber.open(file_path) as pdf:
                    for page in pdf.pages:
                        raw_text += page.extract_text() + "\n"
            except Exception as text_error:
                print(f"Warning: Could not extract raw text: {text_error}")
            
            # Parse extracted data if it's a string
            if isinstance(cv_extract, str):
                try:
                    extracted_data = json.loads(cv_extract)
                except json.JSONDecodeError:
                    extracted_data = {"raw_response": cv_extract}
            else:
                extracted_data = cv_extract
            
            # Add raw text to the data
            extracted_data["raw_text"] = raw_text
            extracted_data["extraction_timestamp"] = str(datetime.now())
            
            # Save to PostgreSQL
            save_result = save_cv_content_to_postgres(cv_id, extracted_data)
            
            if save_result["success"]:
                return {
                    "success": True,
                    "message": "CV extracted and saved successfully",
                    "cv_id": cv_id,
                    "extracted_data": cv_extract,
                    "database_saved": True
                }
            else:
                return {
                    "success": True,
                    "message": "CV extracted but failed to save to database",
                    "cv_id": cv_id,
                    "extracted_data": cv_extract,
                    "database_saved": False,
                    "database_error": save_result["error"]
                }
        else:
            # Original behavior - just return extracted data
            return cv_extract
            
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Lỗi khi trích xuất CV: {str(e)}"}
        )

@app.post("/improve-cv")
def improve_cv_api(cv: UploadFile = File(...), cong_ty_ung_tuyen: str=Form(...), vi_tri_ung_tuyen: str=Form(...), linh_vuc: str=Form(...)):
    if not cv.filename.endswith(".pdf"):
        return JSONResponse(status_code=400, content={"message": "Chỉ hỗ trợ file PDF."})

    file_path = os.path.join(UPLOAD_DIR, cv.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(cv.file, buffer)

    response = improve_cv(file_path, cong_ty_ung_tuyen, vi_tri_ung_tuyen, linh_vuc)
    return(response)

@app.post("/feedback") #lưu trữ vào database
async def save_feedback(feedback: Feedback):
    result = await feedback_collection.insert_one(feedback.model_dump())
    return {"message": "Feedback saved", "id": str(result.inserted_id)}

@app.post("/extract-cv-with-id")
def extract_cv_with_id(cv: UploadFile = File(...), cv_id: str = Form(...)):
    """
    Extract CV content and save to PostgreSQL with specific cv_id
    This endpoint is designed to be called by business service
    """
    if not cv.filename.endswith(".pdf"):
        return JSONResponse(status_code=400, content={
            "success": False,
            "message": "Chỉ hỗ trợ file PDF."
        })

    if not cv_id:
        return JSONResponse(status_code=400, content={
            "success": False,
            "message": "cv_id is required"
        })

    file_path = os.path.join(UPLOAD_DIR, f"{cv_id}_{cv.filename}")

    try:
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(cv.file, buffer)

        # Extract CV content using AI
        cv_extract = extract_cv(file_path, json_mau)
        
        # Add raw text to extracted data
        raw_text = ""
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    raw_text += page.extract_text() + "\n"
        except Exception as text_error:
            print(f"Warning: Could not extract raw text: {text_error}")
        
        # Parse extracted data if it's a string
        if isinstance(cv_extract, str):
            try:
                extracted_data = json.loads(cv_extract)
            except json.JSONDecodeError:
                extracted_data = {"raw_response": cv_extract}
        else:
            extracted_data = cv_extract
        
        # Add metadata to the data
        extracted_data["raw_text"] = raw_text
        extracted_data["extraction_timestamp"] = str(datetime.now())
        extracted_data["file_name"] = cv.filename
        
        # Save to PostgreSQL
        save_result = save_cv_content_to_postgres(cv_id, extracted_data)
        
        # Clean up temporary file
        try:
            os.remove(file_path)
        except Exception as cleanup_error:
            print(f"Warning: Could not clean up file: {cleanup_error}")
        
        if save_result["success"]:
            return {
                "success": True,
                "message": "CV extracted and saved successfully",
                "cv_id": cv_id,
                "extracted_data": cv_extract,
                "database_saved": True
            }
        else:
            return {
                "success": False,
                "message": "CV extracted but failed to save to database",
                "cv_id": cv_id,
                "extracted_data": cv_extract,
                "database_saved": False,
                "database_error": save_result["error"]
            }
            
    except Exception as e:
        # Clean up temporary file on error
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except:
            pass
            
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Lỗi khi trích xuất CV: {str(e)}"
            }
        )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "extract-and-improve-cv"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("SERVICE_PORT", 8003))
    host = os.getenv("SERVICE_HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port) 