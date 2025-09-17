"""
Shared configuration for all AI services
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration (shared)
class DatabaseConfig:
    USER = os.getenv("POSTGRES_USER") or os.getenv("DB_USER", "postgres")
    PASSWORD = os.getenv("POSTGRES_PASSWORD") or os.getenv("DB_PASSWORD", "postgres")
    HOST = os.getenv("POSTGRES_HOST") or os.getenv("DB_HOST", "localhost")
    PORT = os.getenv("POSTGRES_PORT") or os.getenv("DB_PORT", "5432")
    NAME = os.getenv("POSTGRES_DB") or os.getenv("DB_NAME", "userdb")
    
    @classmethod
    def get_url(cls):
        """Get database URL string"""
        return f"postgresql://{cls.USER}:{cls.PASSWORD}@{cls.HOST}:{cls.PORT}/{cls.NAME}"

# AI API configuration (shared)
class AIConfig:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    
    # Model settings
    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
    EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", "384"))
    
    @classmethod
    def has_groq_key(cls):
        """Check if Groq API key is available"""
        return cls.GROQ_API_KEY and cls.GROQ_API_KEY != "your_groq_api_key_here"
    
    @classmethod
    def has_openai_key(cls):
        """Check if OpenAI API key is available"""
        return cls.OPENAI_API_KEY and cls.OPENAI_API_KEY != "your_openai_api_key_here"

# Service configuration (shared)
class ServiceConfig:
    HOST = os.getenv("SERVICE_HOST", "0.0.0.0")
    LOG_LEVEL = os.getenv("LOG_LEVEL", "info")
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    
    # Service-specific ports
    JD_CV_MATCHING_PORT = int(os.getenv("JD_CV_MATCHING_PORT", "8001"))
    QUESTION_GENERATION_PORT = int(os.getenv("QUESTION_GENERATION_PORT", "8002"))
    CV_EXTRACTION_PORT = int(os.getenv("CV_EXTRACTION_PORT", "8003"))

# Health check response (shared)
def get_health_response(service_name: str):
    """Standard health check response"""
    return {
        "status": "healthy",
        "service": service_name,
        "database": DatabaseConfig.get_url().replace(DatabaseConfig.PASSWORD, "***"),
        "ai_keys": {
            "groq": "configured" if AIConfig.has_groq_key() else "missing",
            "openai": "configured" if AIConfig.has_openai_key() else "missing"
        }
    } 