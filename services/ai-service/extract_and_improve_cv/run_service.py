#!/usr/bin/env python3
"""
Script to run the CV improvement service with proper error handling
"""
import os
import sys
import uvicorn
from main import app

def check_environment():
    """Check if required environment variables are set"""
    required_vars = ["GROQ_API_KEY"]
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        print("Please set these variables in your .env file or environment")
        return False
    
    print("✅ All required environment variables are set")
    return True

def check_dependencies():
    """Check if required dependencies are available"""
    try:
        import fastapi
        import pdfplumber
        import groq
        import pdf2image
        import motor
        print("✅ All required dependencies are available")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please install requirements: pip install -r requirements.txt")
        return False

def main():
    print("🚀 Starting CV Improvement Service...")
    print("=" * 50)
    
    # Check environment and dependencies
    if not check_environment():
        sys.exit(1)
        
    if not check_dependencies():
        sys.exit(1)
    
    # Create upload directory if it doesn't exist
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    print(f"✅ Upload directory ready: {upload_dir}")
    
    # Get configuration from environment
    host = os.getenv("SERVICE_HOST", "0.0.0.0")
    port = int(os.getenv("SERVICE_PORT", 8003))
    
    print(f"🌐 Starting server at http://{host}:{port}")
    print("📋 Available endpoints:")
    print("  - GET  /health")
    print("  - POST /extract-cv")
    print("  - POST /improve-cv")
    print("  - POST /feedback")
    print("=" * 50)
    
    try:
        uvicorn.run(
            app, 
            host=host, 
            port=port,
            log_level="info",
            access_log=True
        )
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
