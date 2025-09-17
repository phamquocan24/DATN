import re
import numpy as np
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer
from sentence_transformers.util import cos_sim
from langdetect import detect
from groq import Groq
import os
import json
import torch

# Force CPU usage to avoid CUDA errors
torch.device('cpu')

model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2", device='cpu')
tokenizer = AutoTokenizer.from_pretrained("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")


def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"\b(tôi là|tôi|i am|i'm)\b", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"\S+@\S+\.\S+", " ", text)  # email
    text = re.sub(r"\+?\d[\d\s\-\(\)]{8,}", " ", text)  # phone
    text = re.sub(r"\b[A-ZĐ][a-zà-ỹ]+\b", " ", text)  # proper nouns (names)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def chunk_text(text: str, max_tokens=128) -> list:
    tokens = tokenizer.tokenize(text)
    chunks = []
    for i in range(0, len(tokens), max_tokens):
        chunk_tokens = tokens[i:i+max_tokens]
        chunk = tokenizer.convert_tokens_to_string(chunk_tokens)
        chunks.append(chunk)
    return chunks


def get_text_embedding(text: str, chunk_size=128) -> np.ndarray:
    # Handle empty or None text
    if not text or not text.strip():
        print(f"Warning: Empty text provided for embedding")
        return np.zeros(model.get_sentence_embedding_dimension())
    
    cleaned = clean_text(text)
    if not cleaned or len(cleaned.strip()) < 3:
        print(f"Warning: Text too short after cleaning: '{cleaned}'")
        # Use original text if cleaning made it too short
        cleaned = text.strip()
    
    chunks = chunk_text(cleaned, max_tokens=chunk_size)
    if not chunks:
        print(f"Warning: No chunks generated from text: '{cleaned[:50]}...'")
        return np.zeros(model.get_sentence_embedding_dimension())
    
    embeddings = model.encode(chunks)
    return np.mean(embeddings, axis=0)


def calculate_similarity(text1: str, text2: str) -> float:
    emb1 = get_text_embedding(text1)
    emb2 = get_text_embedding(text2)
    # Ensure same dtype to avoid double != float error
    emb1_array = np.array(emb1, dtype=np.float32)
    emb2_array = np.array(emb2, dtype=np.float32)
    return cos_sim(emb1_array, emb2_array).item()


def make_cv_text(parsed_content: dict) -> str:
    parts = []
    
    # Add full_name if available
    if parsed_content.get("full_name"):
        parts.append(str(parsed_content["full_name"]))
    
    for section in ['mo_ta_ban_than', 'kinh_nghiem_lam_viec', 'hoc_van', 'du_an']:
        value = parsed_content.get(section, [])
        if isinstance(value, list):
            parts.extend([str(item) for item in value if item])
        elif value:
            parts.append(str(value))
    
    # Add skills
    skills = parsed_content.get("ky_nang", [])
    if skills:
        parts.extend([str(skill) for skill in skills if skill])
    
    # Join and clean up
    text = ' '.join(parts).strip()
    
    # Fallback if no meaningful content
    if not text or len(text) < 10:
        return f"CV for {parsed_content.get('full_name', 'candidate')} - {parsed_content.get('mo_ta_ban_than', 'Professional CV')}"
    
    return text

def detect_language_from_texts(jd_text: str, cv_text: str) -> str:
    try:
        lang_jd = detect(jd_text)
        lang_cv = detect(cv_text)
        # Ưu tiên tiếng Việt nếu cả 2 là 'vi', ngược lại dùng 'en'
        if lang_jd == 'vi' and lang_cv == 'vi':
            return 'vi'
        return 'en'
    except Exception:
        return 'en'  # fallback


def build_reasoning_prompt(cv_text: str, jd_text: str, sim: dict, lang: str) -> str:
    def fmt(score):
        return f"{score:.4f}" if isinstance(score, (int, float)) else "N/A"

    if lang == "vi":
        prompt = f"""
Bạn là một chuyên gia tuyển dụng có kiến thức sâu rộng về đánh giá hồ sơ ứng viên. Dưới đây là nội dung CV và mô tả công việc (JD), cùng với một số điểm số thể hiện mức độ tương đồng giữa các phần chính (Kỹ năng, Kinh nghiệm, Học vấn, Tổng thể) được tính bằng công thức cosine similarity.
Điểm số tương đồng này chỉ để tham khảo và không phải là yếu tố quyết định duy nhất trong việc đánh giá ứng viên. Có thể quyết định dựa trên nội dung cụ thể của CV và JD. Nên đưa ra dẫn chứng cụ thể từ nội dung CV và JD để hỗ trợ đánh giá.
Hãy thực hiện các bước sau:
1. 🔹 **Điểm phù hợp**: Dựa trên nội dung CV và JD, hãy nêu rõ phần nào phù hợp với nhau, đặc biệt là những phần có điểm số tương đồng cao.
2. ⚠️ **Thiếu sót**: (Với những phần có điểm số tương đồng thấp) Hãy chỉ ra các thông tin thiếu, chưa khớp hoặc chưa làm nổi bật trong CV.
3. ✅ **Đề xuất cải thiện**: Gợi ý các bổ sung hoặc chỉnh sửa cụ thể mà ứng viên nên thực hiện để tăng khả năng phù hợp.


Điểm tương đồng cosine:
- Tổng thể: {fmt(sim['overall'])}
- Kỹ năng: {fmt(sim['skills'])}
- Kinh nghiệm: {fmt(sim['experience'])}
- Học vấn: {fmt(sim['education'])}

=== CV ===
{cv_text}

=== Mô tả công việc ===
{jd_text}

Chú ý: Luôn phản hồi hoàn toàn bằng tiếng Việt mượt mà. Và nội dung phản hồi phải bao gồm tất cả các phần đã nêu ở trên, không được bỏ sót phần nào. Trả về dạng văn bản rõ ràng, mạch lạc và dễ hiểu, có thể sử dụng các ký hiệu như 🔹, ⚠️, ✅ để phân biệt các phần khác nhau.
"""
    else:
        prompt = f"""You are a senior recruitment specialist with deep expertise in evaluating candidates. Below is a candidate's CV and a Job Description (JD), along with similarity scores (calculated using cosine similarity) that reflect alignment in key areas: skills, experience, education, and overall.
the similarity scores are for reference only and not the sole deciding factor in candidate evaluation. Decisions should be based on the specific content of the CV and JD, with concrete evidence from both to support the assessment.
Please perform the following analysis:
1. 🔹 **Matching Points**: Identify which parts of the CV align well with the JD, especially those with high similarity scores.
2. ⚠️ **Gaps**: (For sections with low similarity) Specify what is missing or underrepresented in the CV.
3. ✅ **Improvement Suggestions**: Provide specific recommendations for how the candidate can enhance their fit for the role.

Cosine Similarity Scores:
- Overall: {fmt(sim['overall'])}
- Skills: {fmt(sim['skills'])}
- Experience: {fmt(sim['experience'])}
- Education: {fmt(sim['education'])}

=== CV ===
{cv_text}

=== Job Description ===
{jd_text}

Note: Always reply in English. Responses must include all the sections mentioned above, without omitting any part. respond in clear, coherent text, using symbols like 🔹, ⚠️, ✅ to differentiate the sections.
"""
    return prompt


def call_groq_reasoning(prompt: str, lang: str) -> dict:
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    if lang == "vi":
        system_prompt = (
            """Bạn là một chuyên gia tuyển dụng có kiến thức sâu rộng về đánh giá hồ sơ ứng viên.
                       """)
    else:
        system_prompt = (
            """You are a recruitment expert with deep knowledge in evaluating candidate resumes."""
            
        )

    chat_completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
    )

    content = chat_completion.choices[0].message.content.strip()

    return content