#!/usr/bin/env python3
"""
Simple runner for JD-CV Matching Service
Run this from the jd-cv-matching directory
"""

import uvicorn
import os
import sys

if __name__ == "__main__":
    # Ensure we're in the right directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    print("🚀 Starting JD-CV Matching Service")
    print(f"📁 Working directory: {script_dir}")
    print("📊 Service will be available at: http://localhost:8001")
    print("📖 API documentation at: http://localhost:8001/docs")
    print("💚 Health check at: http://localhost:8001/health")
    print("-" * 50)
    
    try:
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8001,
            reload=True
        )
    except KeyboardInterrupt:
        print("\n🛑 Service stopped by user")
    except Exception as e:
        print(f"❌ Error starting service: {e}")
        sys.exit(1)
