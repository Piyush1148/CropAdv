# 🌱 Crop Advisory System - Backend API

Professional FastAPI backend for ML-powered crop recommendations with Firebase integration.

## 🚀 Features

- **🤖 ML Model Integration** - Serve your trained crop recommendation model
- **🔥 Firebase Integration** - Firestore database and Firebase Authentication
- **🌤️ Weather API Integration** - Real-time weather data for recommendations
- **💬 AI Chat Assistant** - Agricultural advisory chatbot (expandable)
- **📊 Professional API** - RESTful API with auto-generated documentation
- **🔒 Security** - JWT authentication and CORS protection

## 📁 Project Structure

```
crop_advisory_backend/
├── app/
│   ├── api/          # API endpoints
│   │   ├── auth.py   # Firebase authentication
│   │   ├── crops.py  # ML crop recommendations
│   │   ├── weather.py# Weather data integration
│   │   ├── chat.py   # AI assistant chat
│   │   └── health.py # Health check endpoints
│   ├── config/       # Configuration management
│   ├── models/       # Pydantic data models
│   ├── services/     # Business logic services
│   └── utils/        # Utility functions
├── ml_models/        # Your trained ML models
├── main.py          # FastAPI application entry point
├── requirements.txt # Python dependencies
└── .env.example     # Environment variables template
```

## 🛠️ Quick Setup

### Windows:
```cmd
# Run the setup script
setup.bat

# Or manual setup:
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

### Linux/Mac:
```bash
# Run the setup script
chmod +x setup.sh
./setup.sh

# Or manual setup:
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

## ⚙️ Configuration

1. **Edit `.env` file** with your actual values:
```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# API Keys
OPENWEATHER_API_KEY=your-weather-api-key

# ML Model Paths
MODEL_PATH=./ml_models/your_model.joblib
SCALER_PATH=./ml_models/your_scaler.joblib
```

2. **Add your trained ML model** to `ml_models/` directory:
   - `crop_recommendation_model.joblib` - Your trained model
   - `feature_scaler.joblib` - Feature scaler (if used)

3. **Firebase Setup**:
   - Download Firebase service account key
   - Update Firebase configuration in `.env`

## 🏃‍♂️ Running the Application

```bash
# Activate virtual environment
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# Start the server
python main.py

# Server will start at: http://localhost:8000
# API Documentation: http://localhost:8000/api/docs
```

## 📡 API Endpoints

### Health Check
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system metrics

### Authentication
- `POST /api/auth/verify-token` - Verify Firebase ID token
- `GET /api/auth/profile/{uid}` - Get user profile
- `POST /api/auth/profile/{uid}` - Update user profile

### Crop Recommendations
- `POST /api/crops/recommend` - Get ML-powered crop recommendations
- `GET /api/crops/list` - List supported crops

### Weather Data
- `GET /api/weather/current/{location}` - Current weather
- `GET /api/weather/forecast/{location}` - Weather forecast

### AI Chat Assistant
- `POST /api/chat/send` - Send message to AI assistant
- `GET /api/chat/history/{user_id}` - Get chat history

## 🔗 Connecting to React Frontend

Your React frontend should make API calls to:
```javascript
const API_BASE_URL = 'http://localhost:8000/api';

// Example: Get crop recommendations
const response = await fetch(`${API_BASE_URL}/crops/recommend`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${firebaseIdToken}`
  },
  body: JSON.stringify({
    nitrogen: 90,
    phosphorous: 42,
    potassium: 43,
    temperature: 20.879744,
    humidity: 82.002744,
    ph: 6.502985,
    rainfall: 202.935536
  })
});
```

## 📚 ML Model Requirements

Your trained model should:
1. **Accept 7 features**: [N, P, K, temperature, humidity, pH, rainfall]
2. **Output**: Crop class predictions with probabilities
3. **Format**: Saved as `.joblib` or `.pkl` file
4. **Scaler**: Feature scaler (optional but recommended)

## 🧪 Testing the API

### Using curl:
```bash
# Health check
curl http://localhost:8000/api/health

# Get crop recommendations
curl -X POST http://localhost:8000/api/crops/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "nitrogen": 90,
    "phosphorous": 42, 
    "potassium": 43,
    "temperature": 20.88,
    "humidity": 82.00,
    "ph": 6.50,
    "rainfall": 202.94
  }'
```

### Using Python:
```python
import requests

# Test crop recommendation
response = requests.post('http://localhost:8000/api/crops/recommend', json={
    "nitrogen": 90,
    "phosphorous": 42,
    "potassium": 43, 
    "temperature": 20.88,
    "humidity": 82.00,
    "ph": 6.50,
    "rainfall": 202.94
})

print(response.json())
```

## 🔧 Development

### Add new endpoints:
1. Create new router in `app/api/`
2. Define Pydantic models in `app/models/`
3. Add business logic in `app/services/`
4. Include router in `main.py`

### Environment Variables:
- All configuration is in `app/config/settings.py`
- Uses Pydantic Settings for type validation
- Supports `.env` file and environment variables

## 🚀 Deployment

### Local Development:
```bash
python main.py
```

### Production (Railway/Render):
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Docker:
```dockerfile
FROM python:3.9
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📋 Next Steps

1. **Test the API** - Run and verify all endpoints work
2. **Add your ML model** - Replace mock data with real predictions  
3. **Configure Firebase** - Set up Firestore and authentication
4. **Connect frontend** - Update React app to use this API
5. **Add external APIs** - Weather and soil data integration
6. **Deploy** - Host on Railway, Render, or your preferred platform

## 🔍 Troubleshooting

### Common Issues:

**Import errors**: Make sure virtual environment is activated and dependencies installed
```bash
pip install -r requirements.txt
```

**Firebase errors**: Check your `.env` configuration and service account key

**ML model not loading**: Verify model path in `.env` and file exists in `ml_models/`

**CORS errors**: Check `ALLOWED_ORIGINS` in `.env` matches your React app URL

---

**🌱 Your backend is ready to power intelligent crop recommendations!**