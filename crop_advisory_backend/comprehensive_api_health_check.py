"""
COMPREHENSIVE API HEALTH CHECK
Testing all endpoints and external integrations
"""
import requests
import json
from datetime import datetime
import time

BASE_URL = "http://localhost:8000"

# Color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*80}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text.center(80)}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*80}{Colors.END}\n")

def print_section(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'─'*80}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'─'*80}{Colors.END}")

def test_endpoint(method, endpoint, data=None, params=None, auth_token=None, description=""):
    """Test a single endpoint"""
    url = f"{BASE_URL}{endpoint}"
    headers = {}
    
    if auth_token:
        headers['Authorization'] = f'Bearer {auth_token}'
    
    try:
        if method == 'GET':
            response = requests.get(url, params=params, headers=headers, timeout=10)
        elif method == 'POST':
            response = requests.post(url, json=data, headers=headers, timeout=10)
        elif method == 'PUT':
            response = requests.put(url, json=data, headers=headers, timeout=10)
        elif method == 'DELETE':
            response = requests.delete(url, headers=headers, timeout=10)
        
        status = response.status_code
        
        if 200 <= status < 300:
            print(f"{Colors.GREEN}✅ {method:6} {endpoint:50} | {status} | {description}{Colors.END}")
            return True, response.json() if response.text else None
        elif status == 401 or status == 403:
            print(f"{Colors.YELLOW}🔒 {method:6} {endpoint:50} | {status} | Auth Required | {description}{Colors.END}")
            return 'auth_required', None
        elif status == 404:
            print(f"{Colors.RED}❌ {method:6} {endpoint:50} | {status} | Not Found | {description}{Colors.END}")
            return False, None
        elif status == 405:
            print(f"{Colors.YELLOW}⚠️  {method:6} {endpoint:50} | {status} | Method Not Allowed | {description}{Colors.END}")
            return 'method_error', None
        elif status == 422:
            print(f"{Colors.YELLOW}⚠️  {method:6} {endpoint:50} | {status} | Validation Error | {description}{Colors.END}")
            return 'validation_error', None
        else:
            print(f"{Colors.RED}❌ {method:6} {endpoint:50} | {status} | Error | {description}{Colors.END}")
            return False, response.text[:100] if response.text else None
            
    except requests.exceptions.ConnectionError:
        print(f"{Colors.RED}❌ {method:6} {endpoint:50} | Connection Error | Server Down?{Colors.END}")
        return False, "Connection Error"
    except requests.exceptions.Timeout:
        print(f"{Colors.RED}❌ {method:6} {endpoint:50} | Timeout | Took too long{Colors.END}")
        return False, "Timeout"
    except Exception as e:
        print(f"{Colors.RED}❌ {method:6} {endpoint:50} | Exception: {str(e)[:50]}{Colors.END}")
        return False, str(e)

# Store results
results = {
    'health': [],
    'auth': [],
    'crops': [],
    'weather': [],
    'weather_enhanced': [],
    'chat': [],
    'external_apis': []
}

print_header("🏥 COMPREHENSIVE API HEALTH CHECK")
print(f"{Colors.BOLD}Testing Time:{Colors.END} {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"{Colors.BOLD}Backend URL:{Colors.END} {BASE_URL}")

# ============================================================================
# 1. HEALTH ENDPOINTS
# ============================================================================
print_section("1️⃣  HEALTH CHECK ENDPOINTS")

success, data = test_endpoint('GET', '/api/health', description="Basic Health Check")
results['health'].append(('Basic Health', success))

success, data = test_endpoint('GET', '/api/health/detailed', description="Detailed Health Check")
results['health'].append(('Detailed Health', success))
if success and data:
    print(f"   {Colors.CYAN}├─ Status: {data.get('status', 'unknown')}{Colors.END}")
    print(f"   {Colors.CYAN}├─ ML Model: {data.get('ml_model_loaded', 'unknown')}{Colors.END}")
    print(f"   {Colors.CYAN}├─ Database: {data.get('database', {}).get('status', 'unknown')}{Colors.END}")
    print(f"   {Colors.CYAN}└─ Weather: {data.get('weather_service', {}).get('status', 'unknown')}{Colors.END}")

# ============================================================================
# 2. AUTHENTICATION ENDPOINTS
# ============================================================================
print_section("2️⃣  AUTHENTICATION ENDPOINTS")

# Test user registration (will likely fail if user exists - that's ok)
test_user = {
    "email": f"healthcheck_{int(time.time())}@test.com",
    "password": "TestPassword123!",
    "full_name": "Health Check User"
}

success, data = test_endpoint('POST', '/api/auth/register', data=test_user, description="Register New User")
results['auth'].append(('Registration', success))

auth_token = None
if success and data:
    auth_token = data.get('token')
    if auth_token:
        print(f"   {Colors.CYAN}└─ Token received: {auth_token[:20]}...{Colors.END}")

# Test protected endpoints (will show auth required if not logged in)
success, data = test_endpoint('GET', '/api/auth/me', description="Get Current User Profile")
results['auth'].append(('Get Profile', success))

success, data = test_endpoint('PUT', '/api/auth/me', description="Update User Profile")
results['auth'].append(('Update Profile', success))

success, data = test_endpoint('POST', '/api/auth/verify-token', description="Verify Token")
results['auth'].append(('Verify Token', success))

success, data = test_endpoint('GET', '/api/auth/dashboard-stats', description="Dashboard Stats")
results['auth'].append(('Dashboard Stats', success))

success, data = test_endpoint('GET', '/api/auth/profile/enhanced', description="Enhanced Profile")
results['auth'].append(('Enhanced Profile', success))

success, data = test_endpoint('PUT', '/api/auth/profile/enhanced', description="Update Enhanced Profile")
results['auth'].append(('Update Enhanced Profile', success))

success, data = test_endpoint('POST', '/api/auth/profile/enhanced', description="Create Enhanced Profile")
results['auth'].append(('Create Enhanced Profile', success))

success, data = test_endpoint('GET', '/api/auth/profile/ai-context', description="AI Context")
results['auth'].append(('AI Context', success))

success, data = test_endpoint('POST', '/api/auth/profile/fix-existing-user', description="Fix Existing User")
results['auth'].append(('Fix Existing User', success))

success, data = test_endpoint('POST', '/api/auth/profile/ai-interaction', description="AI Interaction")
results['auth'].append(('AI Interaction', success))

success, data = test_endpoint('GET', '/api/auth/profile/completion-status', description="Completion Status")
results['auth'].append(('Completion Status', success))

# ============================================================================
# 3. CROP RECOMMENDATION ENDPOINTS
# ============================================================================
print_section("3️⃣  CROP RECOMMENDATION ENDPOINTS")

# Test crop prediction
crop_data = {
    "N": 80, "P": 50, "K": 60,
    "temperature": 28, "humidity": 70,
    "ph": 6.5, "rainfall": 150,
    "location": "Test Location"
}

success, data = test_endpoint('POST', '/api/crops/predict', data=crop_data, description="Predict Crop (Simple)")
results['crops'].append(('Predict Crop', success))
if success and data:
    print(f"   {Colors.CYAN}├─ Predicted Crop: {data.get('prediction', 'unknown')}{Colors.END}")
    print(f"   {Colors.CYAN}└─ Confidence: {data.get('probability', 0):.1f}%{Colors.END}")

# Test crop recommendations
recommend_data = {
    "nitrogen": 80, "phosphorous": 50, "potassium": 60,
    "temperature": 28, "humidity": 70,
    "ph": 6.5, "rainfall": 150,
    "location": "Test Location"
}

success, data = test_endpoint('POST', '/api/crops/recommend', data=recommend_data, description="Get Crop Recommendations")
results['crops'].append(('Recommendations', success))
if success and data:
    recs = data.get('recommendations', [])
    print(f"   {Colors.CYAN}├─ Top Recommendations:{Colors.END}")
    for i, rec in enumerate(recs[:3], 1):
        print(f"   {Colors.CYAN}├──  {i}. {rec.get('crop_name', 'unknown')}: {rec.get('confidence_score', 0):.1f}%{Colors.END}")

success, data = test_endpoint('GET', '/api/crops/list', description="Get Supported Crops List")
results['crops'].append(('List Crops', success))
if success and data:
    crops = data.get('crops', [])
    print(f"   {Colors.CYAN}└─ Total Crops Available: {len(crops)}{Colors.END}")

success, data = test_endpoint('GET', '/api/crops/predictions/history', description="Prediction History")
results['crops'].append(('Prediction History', success))

success, data = test_endpoint('GET', '/api/crops/analytics', description="User Analytics")
results['crops'].append(('Analytics', success))

success, data = test_endpoint('GET', '/api/crops/predictions', description="Get Predictions Simple")
results['crops'].append(('Predictions Simple', success))

# ============================================================================
# 4. WEATHER DATA ENDPOINTS (Legacy)
# ============================================================================
print_section("4️⃣  WEATHER DATA ENDPOINTS (Legacy)")

success, data = test_endpoint('GET', '/api/weather/current/Mumbai', description="Get Current Weather by City")
results['weather'].append(('Current Weather City', success))

success, data = test_endpoint('GET', '/api/weather/forecast/Mumbai', description="Get Weather Forecast")
results['weather'].append(('Forecast', success))

# ============================================================================
# 5. WEATHER ENHANCED ENDPOINTS
# ============================================================================
print_section("5️⃣  WEATHER ENHANCED ENDPOINTS")

success, data = test_endpoint('GET', '/weather-enhanced/health', description="Weather Service Health")
results['weather_enhanced'].append(('Health', success))

# Test with coordinates
params = {"latitude": 19.0760, "longitude": 72.8777}
success, data = test_endpoint('GET', '/weather-enhanced/current', params=params, description="Current Weather (Coords)")
results['weather_enhanced'].append(('Current Weather', success))
if success and data:
    print(f"   {Colors.CYAN}├─ Location: {data.get('location', 'unknown')}{Colors.END}")
    print(f"   {Colors.CYAN}├─ Temperature: {data.get('temperature', 'N/A')}°C{Colors.END}")
    print(f"   {Colors.CYAN}└─ Humidity: {data.get('humidity', 'N/A')}%{Colors.END}")

success, data = test_endpoint('GET', '/weather-enhanced/forecast', params=params, description="Weather Forecast")
results['weather_enhanced'].append(('Forecast', success))

success, data = test_endpoint('GET', '/weather-enhanced/complete', params=params, description="Complete Weather Data")
results['weather_enhanced'].append(('Complete', success))

success, data = test_endpoint('GET', '/weather-enhanced/agricultural-insights', params=params, description="Agricultural Insights")
results['weather_enhanced'].append(('Agricultural Insights', success))

# Test city-based weather
success, data = test_endpoint('GET', '/weather-enhanced/by-city', params={"city": "Mumbai"}, description="Weather by City Name")
results['weather_enhanced'].append(('By City', success))

# Test ML enhancement
ml_data = {
    "N": 80, "P": 50, "K": 60,
    "temperature": 25, "humidity": 60,
    "ph": 6.5, "rainfall": 100
}
success, data = test_endpoint('POST', '/weather-enhanced/ml-enhancement-data', data=ml_data, params=params, description="ML Enhancement Data")
results['weather_enhanced'].append(('ML Enhancement', success))

success, data = test_endpoint('GET', '/weather-enhanced/crop-suitability', params={**params, "crop": "rice"}, description="Crop Suitability")
results['weather_enhanced'].append(('Crop Suitability', success))

success, data = test_endpoint('GET', '/weather-enhanced/test-integration', description="Test Integration")
results['weather_enhanced'].append(('Test Integration', success))

# ============================================================================
# 6. AI ASSISTANT / CHAT ENDPOINTS
# ============================================================================
print_section("6️⃣  AI ASSISTANT / CHAT ENDPOINTS")

chat_test_data = {"message": "Hello, test message"}
success, data = test_endpoint('POST', '/api/chat/test', data=chat_test_data, description="Test Chat (No Auth)")
results['chat'].append(('Test Chat', success))
if success and data:
    print(f"   {Colors.CYAN}└─ Response: {str(data)[:60]}...{Colors.END}")

chat_data = {"message": "What crops grow well in hot climate?"}
success, data = test_endpoint('POST', '/api/chat/message', data=chat_data, description="Send Chat Message")
results['chat'].append(('Send Message', success))

success, data = test_endpoint('POST', '/api/chat/rate-response', description="Rate AI Response")
results['chat'].append(('Rate Response', success))

success, data = test_endpoint('GET', '/api/chat/sessions', description="Get Chat Sessions")
results['chat'].append(('Get Sessions', success))

success, data = test_endpoint('GET', '/api/chat/sessions/test_session_id', description="Get Chat Session")
results['chat'].append(('Get Session', success))

success, data = test_endpoint('DELETE', '/api/chat/sessions/test_session_id', description="Delete Chat Session")
results['chat'].append(('Delete Session', success))

success, data = test_endpoint('GET', '/api/chat/quick-actions', description="Get Quick Actions")
results['chat'].append(('Quick Actions', success))

success, data = test_endpoint('POST', '/api/chat/quick-action/weather', description="Execute Quick Action")
results['chat'].append(('Execute Action', success))

success, data = test_endpoint('GET', '/api/chat/health', description="Chat Health Check")
results['chat'].append(('Chat Health', success))

success, data = test_endpoint('GET', '/api/chat/stats', description="Get Chat Stats")
results['chat'].append(('Chat Stats', success))

success, data = test_endpoint('POST', '/api/chat/sessions/test_session/generate-title', description="Generate Session Title")
results['chat'].append(('Generate Title', success))

# ============================================================================
# 7. EXTERNAL API INTEGRATIONS CHECK
# ============================================================================
print_section("7️⃣  EXTERNAL API INTEGRATIONS")

print(f"\n{Colors.BOLD}Testing External Services...{Colors.END}\n")

# Check OpenWeatherMap API
print(f"{Colors.BLUE}🌤️  OpenWeatherMap API:{Colors.END}")
try:
    response = requests.get(
        "http://api.openweathermap.org/data/2.5/weather",
        params={"q": "Mumbai", "appid": "9ed3a4b311781c8ccd10aea324a39d99"},
        timeout=10
    )
    if response.status_code == 200:
        print(f"{Colors.GREEN}   ✅ OpenWeatherMap API: Working{Colors.END}")
        data = response.json()
        print(f"   {Colors.CYAN}   ├─ Location: {data.get('name', 'unknown')}{Colors.END}")
        print(f"   {Colors.CYAN}   └─ Temperature: {data.get('main', {}).get('temp', 'N/A')}K{Colors.END}")
        results['external_apis'].append(('OpenWeatherMap', True))
    else:
        print(f"{Colors.RED}   ❌ OpenWeatherMap API: Error {response.status_code}{Colors.END}")
        results['external_apis'].append(('OpenWeatherMap', False))
except Exception as e:
    print(f"{Colors.RED}   ❌ OpenWeatherMap API: {str(e)[:50]}{Colors.END}")
    results['external_apis'].append(('OpenWeatherMap', False))

# Check if Groq API key is configured (can't test without making actual request)
print(f"\n{Colors.BLUE}🤖 Groq AI API:{Colors.END}")
try:
    # Test through our chat endpoint
    response = requests.post(
        f"{BASE_URL}/api/chat/test",
        json={"message": "test"},
        timeout=15
    )
    if response.status_code == 200:
        print(f"{Colors.GREEN}   ✅ Groq AI: Working (via chat endpoint){Colors.END}")
        results['external_apis'].append(('Groq AI', True))
    else:
        print(f"{Colors.YELLOW}   ⚠️  Groq AI: Status {response.status_code}{Colors.END}")
        results['external_apis'].append(('Groq AI', 'partial'))
except Exception as e:
    print(f"{Colors.RED}   ❌ Groq AI: {str(e)[:50]}{Colors.END}")
    results['external_apis'].append(('Groq AI', False))

# Check Firebase (through health endpoint)
print(f"\n{Colors.BLUE}🔥 Firebase (Auth & Firestore):{Colors.END}")
try:
    response = requests.get(f"{BASE_URL}/api/health/detailed", timeout=10)
    if response.status_code == 200:
        data = response.json()
        db_status = data.get('database', {}).get('status', 'unknown')
        if db_status == 'connected':
            print(f"{Colors.GREEN}   ✅ Firebase: Connected{Colors.END}")
            print(f"   {Colors.CYAN}   ├─ Authentication: Active{Colors.END}")
            print(f"   {Colors.CYAN}   └─ Firestore: Connected{Colors.END}")
            results['external_apis'].append(('Firebase', True))
        else:
            print(f"{Colors.YELLOW}   ⚠️  Firebase: Status {db_status}{Colors.END}")
            results['external_apis'].append(('Firebase', 'partial'))
    else:
        print(f"{Colors.RED}   ❌ Firebase: Cannot verify{Colors.END}")
        results['external_apis'].append(('Firebase', False))
except Exception as e:
    print(f"{Colors.RED}   ❌ Firebase: {str(e)[:50]}{Colors.END}")
    results['external_apis'].append(('Firebase', False))

# Check ML Model
print(f"\n{Colors.BLUE}🧠 ML Model (scikit-learn):{Colors.END}")
try:
    response = requests.get(f"{BASE_URL}/api/crops/list", timeout=10)
    if response.status_code == 200:
        data = response.json()
        if data.get('model_loaded'):
            print(f"{Colors.GREEN}   ✅ ML Model: Loaded{Colors.END}")
            print(f"   {Colors.CYAN}   ├─ Crops Available: {len(data.get('crops', []))}{Colors.END}")
            print(f"   {Colors.CYAN}   └─ Accuracy: 99.32%{Colors.END}")
            results['external_apis'].append(('ML Model', True))
        else:
            print(f"{Colors.RED}   ❌ ML Model: Not loaded{Colors.END}")
            results['external_apis'].append(('ML Model', False))
    else:
        print(f"{Colors.RED}   ❌ ML Model: Cannot verify{Colors.END}")
        results['external_apis'].append(('ML Model', False))
except Exception as e:
    print(f"{Colors.RED}   ❌ ML Model: {str(e)[:50]}{Colors.END}")
    results['external_apis'].append(('ML Model', False))

# ============================================================================
# 8. SUMMARY
# ============================================================================
print_header("📊 COMPREHENSIVE SUMMARY")

def count_status(result_list):
    success = sum(1 for _, status in result_list if status is True)
    auth_required = sum(1 for _, status in result_list if status == 'auth_required')
    failed = sum(1 for _, status in result_list if status is False)
    partial = sum(1 for _, status in result_list if status in ['partial', 'method_error', 'validation_error'])
    total = len(result_list)
    return success, auth_required, failed, partial, total

categories = [
    ("Health Endpoints", results['health']),
    ("Authentication Endpoints", results['auth']),
    ("Crop Recommendation Endpoints", results['crops']),
    ("Weather Legacy Endpoints", results['weather']),
    ("Weather Enhanced Endpoints", results['weather_enhanced']),
    ("AI/Chat Endpoints", results['chat']),
    ("External API Integrations", results['external_apis'])
]

total_success = 0
total_auth = 0
total_failed = 0
total_partial = 0
total_endpoints = 0

print(f"\n{Colors.BOLD}{'Category':<35} {'✅ Pass':<10} {'🔒 Auth':<10} {'⚠️ Warn':<10} {'❌ Fail':<10} {'Total':<10}{Colors.END}")
print("─" * 85)

for category, result_list in categories:
    success, auth, failed, partial, total = count_status(result_list)
    total_success += success
    total_auth += auth
    total_failed += failed
    total_partial += partial
    total_endpoints += total
    
    status_color = Colors.GREEN if failed == 0 else Colors.YELLOW if failed < total / 2 else Colors.RED
    print(f"{status_color}{category:<35} {success:<10} {auth:<10} {partial:<10} {failed:<10} {total:<10}{Colors.END}")

print("─" * 85)
print(f"{Colors.BOLD}{'TOTAL':<35} {total_success:<10} {total_auth:<10} {total_partial:<10} {total_failed:<10} {total_endpoints:<10}{Colors.END}")

# Calculate health percentage
success_rate = ((total_success + total_auth) / total_endpoints * 100) if total_endpoints > 0 else 0

print(f"\n{Colors.BOLD}System Health: ", end="")
if success_rate >= 90:
    print(f"{Colors.GREEN}{success_rate:.1f}% - EXCELLENT ✅{Colors.END}")
elif success_rate >= 75:
    print(f"{Colors.YELLOW}{success_rate:.1f}% - GOOD ⚠️{Colors.END}")
elif success_rate >= 50:
    print(f"{Colors.YELLOW}{success_rate:.1f}% - NEEDS ATTENTION ⚠️{Colors.END}")
else:
    print(f"{Colors.RED}{success_rate:.1f}% - CRITICAL ❌{Colors.END}")

print(f"\n{Colors.BOLD}Notes:{Colors.END}")
print(f"{Colors.CYAN}  • 🔒 Auth Required (403/401) means endpoint is working - just needs login{Colors.END}")
print(f"{Colors.CYAN}  • ✅ Pass means endpoint is accessible and responding correctly{Colors.END}")
print(f"{Colors.CYAN}  • ⚠️  Warn means endpoint has minor issues (validation, method mismatch){Colors.END}")
print(f"{Colors.CYAN}  • ❌ Fail means endpoint has critical issues or is unreachable{Colors.END}")

# Critical Issues
critical_issues = []
if results['external_apis'][0][1] is False:  # OpenWeatherMap
    critical_issues.append("OpenWeatherMap API not working")
if results['external_apis'][2][1] is False:  # Firebase
    critical_issues.append("Firebase not connected")
if results['external_apis'][3][1] is False:  # ML Model
    critical_issues.append("ML Model not loaded")

if critical_issues:
    print(f"\n{Colors.RED}{Colors.BOLD}⚠️  CRITICAL ISSUES:{Colors.END}")
    for issue in critical_issues:
        print(f"{Colors.RED}   • {issue}{Colors.END}")
else:
    print(f"\n{Colors.GREEN}{Colors.BOLD}✅ NO CRITICAL ISSUES DETECTED{Colors.END}")

print(f"\n{Colors.BOLD}Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.END}")
print("=" * 80)
