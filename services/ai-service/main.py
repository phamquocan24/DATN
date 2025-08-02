from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse, PlainTextResponse
import pdfplumber
from groq import Groq
import json
import os
import shutil
from pdf2image import convert_from_path
import base64
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient


from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
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
    import io
    buffered = io.BytesIO()
    image.save(buffered, format="JPEG")
    return base64.b64encode(buffered.getvalue()).decode('utf-8')


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

    # Store Pdf with convert_from_path function
    images = convert_from_path(cv_path)

    for image in images:
        base64_image = encode_image(image)
        content.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:image/jpeg;base64,{base64_image}",
            }
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
    if not cv.filename.endswith(".pdf"):
        return JSONResponse(status_code=400, content={"message": "Chỉ hỗ trợ file PDF."})

    file_path = os.path.join(UPLOAD_DIR, cv.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(cv.file, buffer)

    try:
        cv_extract = extract_cv(file_path, json_mau)
        return(cv_extract)
    except Exception as e:
        return f"Lỗi khi trích xuất CV: {str(e)}"

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