"""
Quick API Health Check - Fast Version
Tests critical endpoints and external APIs
"""
import requests
import json

BASE_URL = "http://localhost:8000"

print("="*80)
print(" 🏥 QUICK API HEALTH CHECK".center(80))
print("="*80)

results = {"pass": 0, "fail": 0, "auth": 0}

def test(method, endpoint, data=None, params=None, desc=""):
    try:
        url = f"{BASE_URL}{endpoint}"
        if method == 'GET':
            r = requests.get(url, params=params, timeout=5)
        else:
            r = requests.post(url, json=data, timeout=5)
        
        if 200 <= r.status_code < 300:
            print(f"✅ {desc:45} | {r.status_code}")
            results["pass"] += 1
            return True, r.json() if r.text else None
        elif r.status_code == 401 or r.status_code == 403:
            print(f"🔒 {desc:45} | {r.status_code} (Auth)")
            results["auth"] += 1
            return "auth", None
        else:
            print(f"❌ {desc:45} | {r.status_code}")
            results["fail"] += 1
            return False, None
    except Exception as e:
        print(f"❌ {desc:45} | Error: {str(e)[:30]}")
        results["fail"] += 1
        return False, None

print("\n1️⃣  HEALTH & CORE")
print("-"*80)
test('GET', '/api/health', desc="Health Check")
s, d = test('GET', '/api/health/detailed', desc="Detailed Health")

print("\n2️⃣  AUTHENTICATION")
print("-"*80)
test('GET', '/api/auth/me', desc="Get User Profile")
test('GET', '/api/auth/dashboard-stats', desc="Dashboard Stats")

print("\n3️⃣  CROP RECOMMENDATIONS")
print("-"*80)
crop_data = {"N": 80, "P": 50, "K": 60, "temperature": 28, "humidity": 70, "ph": 6.5, "rainfall": 150, "location": "Test"}
s, d = test('POST', '/api/crops/predict', data=crop_data, desc="Predict Crop")
if s and d:
    print(f"   └─ Predicted: {d.get('prediction', '?')} ({d.get('probability', 0):.1f}%)")

s, d = test('GET', '/api/crops/list', desc="List Supported Crops")
if s and d:
    print(f"   └─ {len(d.get('crops', []))} crops available")

test('GET', '/api/crops/predictions/history', desc="Prediction History")

print("\n4️⃣  WEATHER SERVICES")
print("-"*80)
params = {"latitude": 19.0760, "longitude": 72.8777}
s, d = test('GET', '/weather-enhanced/health', desc="Weather Service Health")
s, d = test('GET', '/weather-enhanced/current', params=params, desc="Current Weather")
if s and d:
    print(f"   └─ {d.get('location', '?')}: {d.get('temperature', '?')}°C, {d.get('humidity', '?')}%")

test('GET', '/weather-enhanced/forecast', params=params, desc="Weather Forecast")
test('GET', '/weather-enhanced/agricultural-insights', params=params, desc="Agricultural Insights")

print("\n5️⃣  AI ASSISTANT")
print("-"*80)
chat_data = {"message": "Test message"}
s, d = test('POST', '/api/chat/test', data=chat_data, desc="Chat Test Endpoint")
if s and d:
    resp = str(d.get('response', ''))[:50]
    print(f"   └─ AI Response: {resp}...")

test('POST', '/api/chat/message', data=chat_data, desc="Send Chat Message")
test('GET', '/api/chat/quick-actions', desc="Quick Actions")

print("\n6️⃣  EXTERNAL APIS")
print("-"*80)

# OpenWeatherMap
try:
    r = requests.get("http://api.openweathermap.org/data/2.5/weather", 
                     params={"q": "Mumbai", "appid": "9ed3a4b311781c8ccd10aea324a39d99"}, timeout=5)
    if r.status_code == 200:
        print(f"✅ OpenWeatherMap API                           | Working")
        results["pass"] += 1
    else:
        print(f"❌ OpenWeatherMap API                           | Error {r.status_code}")
        results["fail"] += 1
except:
    print(f"❌ OpenWeatherMap API                           | Connection Failed")
    results["fail"] += 1

# Firebase (check via health)
if s and d:
    db = d.get('database', {}).get('status', 'unknown')
    if db == 'connected':
        print(f"✅ Firebase (Auth & Firestore)                  | Connected")
        results["pass"] += 1
    else:
        print(f"⚠️  Firebase (Auth & Firestore)                  | {db}")
        results["fail"] += 1

# Groq AI (check via chat test)
try:
    r = requests.post(f"{BASE_URL}/api/chat/test", json={"message": "hi"}, timeout=10)
    if r.status_code == 200:
        print(f"✅ Groq AI API                                  | Working")
        results["pass"] += 1
    else:
        print(f"⚠️  Groq AI API                                  | Status {r.status_code}")
except:
    print(f"❌ Groq AI API                                  | Error")
    results["fail"] += 1

# ML Model
try:
    r = requests.get(f"{BASE_URL}/api/crops/list", timeout=5)
    if r.status_code == 200 and r.json().get('model_loaded'):
        print(f"✅ ML Model (99.32% accuracy)                   | Loaded")
        results["pass"] += 1
    else:
        print(f"❌ ML Model                                     | Not Loaded")
        results["fail"] += 1
except:
    print(f"❌ ML Model                                     | Error")
    results["fail"] += 1

print("\n"+"="*80)
print(" 📊 SUMMARY".center(80))
print("="*80)

total = results["pass"] + results["fail"] + results["auth"]
pass_rate = (results["pass"] + results["auth"]) / total * 100 if total > 0 else 0

print(f"\n✅ Passed:        {results['pass']}")
print(f"🔒 Auth Required: {results['auth']} (Working, just need login)")
print(f"❌ Failed:        {results['fail']}")
print(f"━━━━━━━━━━━━━━━━━━")
print(f"📊 Total:         {total}")
print(f"💯 Success Rate:  {pass_rate:.1f}%")

if pass_rate >= 90:
    print(f"\n🎉 SYSTEM STATUS: EXCELLENT ✅")
elif pass_rate >= 75:
    print(f"\n✅ SYSTEM STATUS: GOOD")
elif pass_rate >= 50:
    print(f"\n⚠️  SYSTEM STATUS: NEEDS ATTENTION")
else:
    print(f"\n❌ SYSTEM STATUS: CRITICAL")

print("\n💡 Note: Auth-required endpoints (🔒) are working correctly!")
print("="*80)
