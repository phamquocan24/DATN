from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse, PlainTextResponse
import pdfplumber
from groq import Groq
import json
import os
import shutil
import fitz  # PyMuPDF
import base64
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import logging
import traceback

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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


# hàm để chuyển ảnh từ định dạng PyMuPDF pixmap thành định dạng chuỗi base64
def encode_image(pixmap):
    img_data = pixmap.tobytes("jpeg")
    return base64.b64encode(img_data).decode('utf-8')


#-------------------Hàm để yêu cầu cải thiện cv------------------------
def improve_cv(cv_path, cong_ty_ung_tuyen:str, vi_tri_ung_tuyen:str, linh_vuc:str):
    logger.info(f"Starting CV improvement for file: {cv_path}")
    logger.info(f"Company: {cong_ty_ung_tuyen}, Position: {vi_tri_ung_tuyen}, Field: {linh_vuc}")
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

    # Chuyển PDF sang ảnh bằng PyMuPDF (fitz)
    try:
        doc = fitz.open(cv_path)
        logger.info(f"Successfully opened PDF with {len(doc)} pages")
        
        for page in doc:
            pix = page.get_pixmap()
            base64_image = encode_image(pix)
            content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{base64_image}",
                }
            })
        doc.close()
    except Exception as e:
        logger.warning(f"Could not convert PDF to images using PyMuPDF: {e}")
        logger.info("Continuing with text-only analysis...")
        # Add a note that visual analysis is not available
        content.append({
            "type": "text", 
            "text": "\n[Lưu ý: Không thể phân tích hình ảnh CV do lỗi chuyển đổi PDF. Chỉ phân tích nội dung text.]"
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

class Feedback(BaseModel):
    rating: int
    comment: str = ""

@app.post("/extract-cv")
def extract_cv2(cv: UploadFile = File(...)):
    try:
        # Validate file
        if not cv.filename or not cv.filename.endswith(".pdf"):
            return JSONResponse(status_code=400, content={"message": "Chỉ hỗ trợ file PDF."})

        file_path = os.path.join(UPLOAD_DIR, cv.filename)

        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(cv.file, buffer)

        # Extract CV data
        cv_extract = extract_cv(file_path, json_mau)
        
        # Clean up uploaded file
        try:
            os.remove(file_path)
        except:
            pass  # Ignore cleanup errors
            
        return JSONResponse(status_code=200, content={"data": cv_extract})
        
    except Exception as e:
        # Clean up file if exists
        try:
            if 'file_path' in locals():
                os.remove(file_path)
        except:
            pass
        
        logger.error(f"Error in extract_cv2: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return JSONResponse(status_code=500, content={"message": f"Lỗi khi trích xuất CV: {str(e)}"})
    finally:
        # Ensure file is closed
        try:
            cv.file.close()
        except:
            pass

@app.post("/improve-cv")
def improve_cv_api(cv: UploadFile = File(...), cong_ty_ung_tuyen: str=Form(...), vi_tri_ung_tuyen: str=Form(...), linh_vuc: str=Form(...)):
    try:
        # Validate file type
        if not cv.filename or not cv.filename.endswith(".pdf"):
            return JSONResponse(status_code=400, content={"message": "Chỉ hỗ trợ file PDF."})

        # Validate form data
        if not cong_ty_ung_tuyen.strip() or not vi_tri_ung_tuyen.strip() or not linh_vuc.strip():
            return JSONResponse(status_code=400, content={"message": "Vui lòng điền đầy đủ thông tin công ty, vị trí và lĩnh vực."})

        file_path = os.path.join(UPLOAD_DIR, cv.filename)

        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(cv.file, buffer)

        # Process CV improvement
        response = improve_cv(file_path, cong_ty_ung_tuyen, vi_tri_ung_tuyen, linh_vuc)
        
        # Clean up uploaded file
        try:
            os.remove(file_path)
        except:
            pass  # Ignore cleanup errors
            
        return response
        
    except Exception as e:
        # Clean up file if exists
        try:
            if 'file_path' in locals():
                os.remove(file_path)
        except:
            pass
        
        logger.error(f"Error in improve_cv_api: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return JSONResponse(status_code=500, content={"message": f"Lỗi khi cải thiện CV: {str(e)}"})
    finally:
        # Ensure file is closed
        try:
            cv.file.close()
        except:
            pass


@app.post("/feedback") #lưu trữ vào database
async def save_feedback(feedback: Feedback):
    result = await feedback_collection.insert_one(feedback.model_dump())
    return {"message": "Feedback saved", "id": str(result.inserted_id)}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "extract-and-improve-cv"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("SERVICE_PORT", 8003))
    host = os.getenv("SERVICE_HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port) 