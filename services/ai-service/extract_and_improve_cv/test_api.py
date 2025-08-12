#!/usr/bin/env python3
"""
Test script for CV improvement API
"""
import requests
import os
from pathlib import Path

def test_health_endpoint():
    """Test health check endpoint"""
    try:
        response = requests.get("http://localhost:8003/health")
        print(f"Health check status: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"Health check failed: {response.text}")
            return False
    except Exception as e:
        print(f"Error testing health endpoint: {e}")
        return False

def test_improve_cv_endpoint():
    """Test improve-cv endpoint with sample data"""
    try:
        # Sample data for testing
        data = {
            'cong_ty_ung_tuyen': 'ABC Company',
            'vi_tri_ung_tuyen': 'Software Developer',
            'linh_vuc': 'Information Technology'
        }
        
        # Create a dummy PDF file for testing
        dummy_pdf_path = "test_cv.pdf"
        if not os.path.exists(dummy_pdf_path):
            print("Warning: No test PDF file found. Please create a sample PDF file named 'test_cv.pdf'")
            return False
            
        files = {
            'cv': ('test_cv.pdf', open(dummy_pdf_path, 'rb'), 'application/pdf')
        }
        
        response = requests.post("http://localhost:8003/improve-cv", data=data, files=files)
        print(f"Improve CV status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ API is working correctly!")
            print(f"Response type: {response.headers.get('content-type')}")
            return True
        else:
            print(f"❌ API failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"Error testing improve-cv endpoint: {e}")
        return False
    finally:
        # Close file if it was opened
        try:
            files['cv'][1].close()
        except:
            pass

def main():
    print("Testing CV Improvement API...")
    print("=" * 50)
    
    # Test health endpoint first
    if not test_health_endpoint():
        print("❌ Service is not running or health check failed")
        return
    
    # Test improve-cv endpoint
    test_improve_cv_endpoint()

if __name__ == "__main__":
    main()
