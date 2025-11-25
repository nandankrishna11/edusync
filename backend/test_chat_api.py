"""
Test Chat API endpoint directly
"""
import requests
import json

# Login as student first
login_url = "http://localhost:8000/api/auth/login"
login_data = {
    "user_id": "4KV22CS090",
    "password": "password123"
}

print("1. Logging in as student...")
response = requests.post(login_url, json=login_data)
if response.status_code == 200:
    token = response.json()["access_token"]
    print(f"   ✓ Login successful, token: {token[:20]}...")
else:
    print(f"   ✗ Login failed: {response.status_code}")
    print(response.text)
    exit(1)

# Test ask endpoint
print("\n2. Testing /api/rag/ask endpoint...")
ask_url = "http://localhost:8000/api/rag/ask"
headers = {
    "Authorization": f"Bearer {token}"
}
data = {
    "query": "what is cloud computing",
    "subject_codes": ["BCS501"]
}

response = requests.post(ask_url, headers=headers, data=data)
print(f"   Status: {response.status_code}")

if response.status_code == 200:
    result = response.json()
    print(f"   ✓ Request successful")
    print(f"\n   Session ID: {result.get('session_id')}")
    print(f"   Answer: {result.get('answer', '')[:200]}...")
    print(f"   Summary: {result.get('summary', 'N/A')}")
    print(f"   Sources: {len(result.get('sources', []))}")
    
    if result.get('sources'):
        print(f"\n   First source:")
        source = result['sources'][0]
        print(f"   - Textbook ID: {source.get('textbook_id')}")
        print(f"   - Page: {source.get('page')}")
        print(f"   - Relevance: {source.get('relevance')}%")
else:
    print(f"   ✗ Request failed")
    print(f"   Response: {response.text}")
