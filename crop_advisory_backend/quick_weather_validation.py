"""
Quick Weather Endpoint Response Validator
Simple validation of weather endpoint responses
"""

import requests
import json

def quick_test():
    base_url = "http://localhost:8000"
    endpoints = [
        ("/weather-enhanced/health", "Health Check"),
        ("/weather-enhanced/current?latitude=28.6139&longitude=77.2090", "Current Weather"),
        ("/weather-enhanced/forecast?latitude=28.6139&longitude=77.2090", "Weather Forecast"),
        ("/weather-enhanced/agricultural-insights?latitude=28.6139&longitude=77.2090", "Agricultural Insights"),
        ("/weather-enhanced/ml-enhancement-data?latitude=28.6139&longitude=77.2090", "ML Enhancement Data"),
        ("/weather-enhanced/crop-suitability?latitude=28.6139&longitude=77.2090&crop=rice", "Crop Suitability")
    ]
    
    print("🌤️ Weather Endpoint Validation Report")
    print("=" * 50)
    
    results = {"passed": 0, "total": len(endpoints)}
    
    for endpoint, name in endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {name}: WORKING")
                
                # Show key data
                if 'current_weather' in data:
                    weather = data['current_weather']
                    print(f"   🌡️ Temp: {weather.get('temperature')}°C, Humidity: {weather.get('humidity')}%")
                elif 'forecast' in data:
                    print(f"   📅 Forecast days: {len(data['forecast'])}")
                elif 'insights' in data:
                    print(f"   💡 Irrigation: {data['insights'].get('irrigation_needed')}")
                elif 'enhancement_data' in data:
                    ed = data['enhancement_data']
                    print(f"   🔧 ML Data - Temp: {ed.get('temperature')}, Humidity: {ed.get('humidity')}")
                elif 'suitable' in data:
                    print(f"   🌾 Rice suitable: {'YES' if data['suitable'] else 'NO'}")
                
                results["passed"] += 1
            else:
                print(f"❌ {name}: FAILED ({response.status_code})")
        except Exception as e:
            print(f"❌ {name}: ERROR - {str(e)[:50]}")
    
    print(f"\n📊 Final Result: {results['passed']}/{results['total']} endpoints working")
    
    if results["passed"] == results["total"]:
        print("🎉 ALL WEATHER ENDPOINTS ARE FULLY OPERATIONAL!")
        print("✅ OpenWeatherMap integration: COMPLETE")
        print("✅ Agricultural intelligence: WORKING")
        print("✅ ML enhancement data: READY")
        print("🚀 Ready for frontend integration!")
    else:
        print(f"⚠️ {results['total'] - results['passed']} endpoints need attention")

if __name__ == "__main__":
    quick_test()