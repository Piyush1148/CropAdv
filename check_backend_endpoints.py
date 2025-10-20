"""
Quick Backend Endpoint Checker
Tests if new endpoints are loaded
"""

import requests
import json

BACKEND_URL = "http://localhost:8000"

def test_endpoints():
    """Test all auth endpoints"""
    print("=" * 60)
    print("BACKEND ENDPOINT CHECKER")
    print("=" * 60)
    
    # Test 1: Check if backend is running
    print("\n1️⃣ Testing if backend is running...")
    try:
        response = requests.get(f"{BACKEND_URL}/")
        print(f"   ✅ Backend is running! Status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Backend NOT running! Error: {e}")
        print("   👉 Start backend first: uvicorn app.main:app --reload --port 8000")
        return
    
    # Test 2: Check if public endpoint exists
    print("\n2️⃣ Testing /setup-profile-public endpoint...")
    try:
        # Send a test request (will fail validation but that's ok - we just want to see if endpoint exists)
        response = requests.post(
            f"{BACKEND_URL}/api/auth/setup-profile-public",
            json={"test": "data"}
        )
        if response.status_code == 422:  # Validation error means endpoint exists!
            print("   ✅ Endpoint EXISTS! (Got expected validation error)")
            print(f"   📝 Response: {response.json()}")
        elif response.status_code == 404:
            print("   ❌ Endpoint NOT FOUND!")
            print("   👉 Backend needs RESTART to load new endpoints!")
        else:
            print(f"   ⚠️ Unexpected status: {response.status_code}")
            print(f"   📝 Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: Check docs
    print("\n3️⃣ Checking API documentation...")
    try:
        response = requests.get(f"{BACKEND_URL}/docs")
        if response.status_code == 200:
            print("   ✅ API docs available at: http://localhost:8000/docs")
            print("   👉 Open in browser to see all endpoints")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print("\n" + "=" * 60)
    print("SUMMARY:")
    print("- If endpoint NOT FOUND: RESTART backend server!")
    print("- If validation error: Endpoint is ready! Use create_profile_manual.py")
    print("- Open http://localhost:8000/docs to see all endpoints")
    print("=" * 60)

if __name__ == "__main__":
    test_endpoints()
