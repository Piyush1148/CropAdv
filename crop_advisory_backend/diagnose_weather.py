"""
Advanced Weather Router Diagnostic
Check FastAPI internal route registration
"""

import requests
import json

def diagnose_routes():
    print("🔍 Advanced Weather Router Diagnostic")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    
    # 1. Check if server is running
    try:
        response = requests.get(f"{base_url}/", timeout=5)
        print(f"✅ Server Status: {response.status_code}")
        print(f"📄 Root Response: {response.json()}")
    except Exception as e:
        print(f"❌ Server Error: {e}")
        return
    
    # 2. Check existing API health
    try:
        response = requests.get(f"{base_url}/api/health", timeout=5)
        print(f"✅ Existing API Health: {response.status_code}")
        if response.status_code == 200:
            print(f"📊 Health Data: {response.json()}")
    except Exception as e:
        print(f"❌ Existing API Error: {e}")
    
    # 3. Check OpenAPI schema for weather routes
    try:
        response = requests.get(f"{base_url}/openapi.json", timeout=5)
        if response.status_code == 200:
            openapi = response.json()
            paths = openapi.get("paths", {})
            
            print(f"\n📋 Total OpenAPI Paths: {len(paths)}")
            
            weather_paths = [path for path in paths.keys() if "weather-enhanced" in path]
            print(f"🌤️  Weather-Enhanced Paths Found: {len(weather_paths)}")
            
            for path in weather_paths:
                methods = list(paths[path].keys())
                print(f"   📍 {path} - Methods: {methods}")
            
            if not weather_paths:
                print("❌ No weather-enhanced paths found in OpenAPI schema!")
                print("🔍 This indicates the routes are not properly registered")
                
                # Show first 10 paths for comparison
                print(f"\n📋 Sample paths registered:")
                for i, path in enumerate(list(paths.keys())[:10]):
                    methods = list(paths[path].keys())
                    print(f"   {i+1}. {path} - {methods}")
                    
        else:
            print(f"❌ OpenAPI Schema Error: {response.status_code}")
    except Exception as e:
        print(f"❌ OpenAPI Error: {e}")
    
    # 4. Direct weather endpoint tests
    weather_endpoints = [
        "/weather-enhanced/health",
        "/weather-enhanced/current?lat=28.6139&lon=77.2090"
    ]
    
    print(f"\n🧪 Direct Weather Endpoint Tests:")
    for endpoint in weather_endpoints:
        try:
            url = f"{base_url}{endpoint}"
            response = requests.get(url, timeout=5)
            print(f"   {response.status_code} - {endpoint}")
            
            if response.status_code != 200:
                print(f"      📄 Error: {response.text[:100]}")
        except Exception as e:
            print(f"   ❌ - {endpoint} - Error: {str(e)[:50]}")

if __name__ == "__main__":
    diagnose_routes()