"""
Manual Profile Creation Script
Run this to create a profile for your existing test user
"""

import requests
import json

# Your test user's information
USER_DATA = {
    "uid": "YOUR_USER_UID_HERE",  # Replace with your actual Firebase UID
    "full_name": "Test Farmer",
    "email": "test@example.com",
    "phone_number": "+91 9876543210",
    "location": "Mumbai, Maharashtra",
    "farm_size": 5.5,
    "soil_type": "Clay Loam",
    "irrigation_type": "Drip Irrigation"
}

# Backend URL
BACKEND_URL = "http://localhost:8000"

def create_profile():
    """Create profile using public endpoint"""
    try:
        print(f"🔵 Creating profile for user: {USER_DATA['uid']}")
        print(f"📝 Data: {json.dumps(USER_DATA, indent=2)}")
        
        response = requests.post(
            f"{BACKEND_URL}/api/auth/setup-profile-public",
            json=USER_DATA,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print("✅ ✅ ✅ Profile created successfully!")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ Failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    print("=" * 60)
    print("MANUAL PROFILE CREATION SCRIPT")
    print("=" * 60)
    
    if USER_DATA["uid"] == "YOUR_USER_UID_HERE":
        print("\n❌ ERROR: Please edit this file and replace YOUR_USER_UID_HERE")
        print("   with your actual Firebase user UID")
        print("\n📍 To find your UID:")
        print("   1. Login to your app")
        print("   2. Open browser console (F12)")
        print("   3. Type: firebase.auth().currentUser.uid")
        print("   4. Copy the UID and paste it in this file")
    else:
        create_profile()
