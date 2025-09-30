"""
Debug Weather Router
Check what routes are actually registered
"""

from app.api import weather_enhanced
from fastapi import FastAPI

# Create test app
test_app = FastAPI()
test_app.include_router(weather_enhanced.router, prefix="/weather-enhanced")

print("🔍 Debugging Weather Router")
print("=" * 40)

print(f"📊 Total routes in router: {len(weather_enhanced.router.routes)}")

print("\n📋 Route Details:")
for i, route in enumerate(weather_enhanced.router.routes, 1):
    if hasattr(route, 'path') and hasattr(route, 'methods'):
        print(f"{i}. {list(route.methods)} {route.path}")
    else:
        print(f"{i}. {type(route)} - {route}")

print(f"\n🌐 Test App Total Routes: {len(test_app.routes)}")

print("\n📋 Test App Routes (with prefix):")
for i, route in enumerate(test_app.routes, 1):
    if hasattr(route, 'path') and hasattr(route, 'methods'):
        print(f"{i}. {list(route.methods)} {route.path}")
    else:
        print(f"{i}. {type(route)} - {route}")

# Test a specific route function
print("\n🧪 Testing health route function directly:")
try:
    import asyncio
    
    async def test_health():
        from app.api.weather_enhanced import weather_service_health
        result = await weather_service_health()
        return result
    
    result = asyncio.run(test_health())
    print(f"✅ Health function result: {result}")
    
except Exception as e:
    print(f"❌ Health function error: {e}")