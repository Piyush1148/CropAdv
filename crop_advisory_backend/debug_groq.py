#!/usr/bin/env python3
"""
Quick GROQ Test - Debug the initialization issue
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_groq_init():
    """Test GROQ initialization with different methods"""
    
    api_key = os.getenv("GROQ_API_KEY")
    print(f"API Key loaded: {'Yes' if api_key else 'No'}")
    
    if not api_key:
        print("❌ No GROQ API key found")
        return
    
    try:
        from groq import Groq
        print("✅ GROQ module imported successfully")
        
        # Test basic initialization
        print("🔧 Testing basic initialization...")
        client = Groq(api_key=api_key)
        print("✅ GROQ client initialized successfully!")
        
        # Test a simple API call
        print("🔧 Testing API call...")
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": "Hello"}],
            model="llama-3.1-8b-instant",
            max_tokens=50
        )
        print(f"✅ API call successful: {response.choices[0].message.content}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_groq_init()