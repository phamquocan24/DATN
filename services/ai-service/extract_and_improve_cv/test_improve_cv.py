#!/usr/bin/env python3
"""
Test script for improve-cv API endpoint
"""
import requests
import os

def test_improve_cv():
    """Test improve-cv endpoint with CV_PQAn.pdf"""
    
    print("🧪 Testing improve-cv API endpoint...")
    print("=" * 50)
    
    # Check if CV file exists
    cv_file = "CV_PQAn.pdf"
    if not os.path.exists(cv_file):
        print(f"❌ CV file not found: {cv_file}")
        return False
    
    print(f"✅ CV file found: {cv_file}")
    
    # Test parameters
    url = "http://localhost:8003/improve-cv"
    data = {
        'cong_ty_ung_tuyen': 'CMC Global',
        'vi_tri_ung_tuyen': 'Senior DevOps Engineer',
        'linh_vuc': 'DevOps'
    }
    
    print("📋 Test parameters:")
    for key, value in data.items():
        print(f"  - {key}: {value}")
    print(f"  - CV File: {cv_file}")
    print()
    
    try:
        print("🚀 Sending request to API...")
        
        # Open and send file
        with open(cv_file, 'rb') as f:
            files = {'cv': (cv_file, f, 'application/pdf')}
            response = requests.post(url, data=data, files=files, timeout=120)
        
        print("✅ Request completed!")
        print(f"Status Code: {response.status_code}")
        print(f"Content Type: {response.headers.get('content-type', 'Unknown')}")
        print()
        
        if response.status_code == 200:
            print("📄 Response:")
            print("-" * 50)
            print(response.text)
            print("-" * 50)
            return True
        else:
            print("❌ Request failed!")
            print(f"Error Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Request timeout! The API took too long to respond.")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ Connection error! Make sure the service is running on localhost:8003")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_health():
    """Test health endpoint first"""
    try:
        response = requests.get("http://localhost:8003/health", timeout=5)
        if response.status_code == 200:
            print("✅ Service is healthy")
            return True
        else:
            print(f"⚠️  Service health check returned: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Service is not accessible: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Checking service health...")
    if not test_health():
        print("\n💡 Make sure to start the service first:")
        print("   python run_service.py")
        exit(1)
    
    print()
    success = test_improve_cv()
    
    if success:
        print("\n🎉 Test completed successfully!")
    else:
        print("\n❌ Test failed!")
        exit(1)
