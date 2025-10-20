"""Ultra Fast API Check"""
import requests

BASE = "http://localhost:8000"
results = []

tests = [
    ("GET", "/api/health", None, "Health"),
    ("GET", "/api/crops/list", None, "Crops List"),
    ("POST", "/api/crops/predict", {"N":80,"P":50,"K":60,"temperature":28,"humidity":70,"ph":6.5,"rainfall":150,"location":"Test"}, "Predict"),
    ("GET", "/weather-enhanced/current?latitude=19&longitude=72", None, "Weather"),
    ("POST", "/api/chat/test", {"message":"hi"}, "AI Chat"),
]

print("\n🔍 RAPID API CHECK\n")

for method, endpoint, data, name in tests:
    try:
        url = BASE + endpoint
        r = requests.post(url, json=data, timeout=5) if method == "POST" else requests.get(url, timeout=5)
        status = "✅" if 200 <= r.status_code < 300 else "🔒" if r.status_code in [401,403] else "❌"
        print(f"{status} {name:20} | {r.status_code}")
        results.append(r.status_code < 400 or r.status_code in [401,403])
    except Exception as e:
        print(f"❌ {name:20} | Error")
        results.append(False)

print(f"\n📊 {sum(results)}/{len(results)} Working | {sum(results)/len(results)*100:.0f}% Success\n")
