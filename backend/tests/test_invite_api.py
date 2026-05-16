import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://cardcraft-73.preview.emergentagent.com").rstrip("/")


@pytest.fixture
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# Health
def test_health(s):
    r = s.get(f"{BASE_URL}/api/health", timeout=20)
    assert r.status_code == 200
    j = r.json()
    assert j.get("status") == "ok"
    assert j.get("llm_key_configured") is True


# AI suggest-text
def test_suggest_text(s):
    payload = {
        "category": "birthday",
        "event_name": "Maya turns 10",
        "host": "Patel Family",
        "date": "Mar 14",
        "location": "Riverside",
        "tone": "playful",
    }
    r = s.post(f"{BASE_URL}/api/ai/suggest-text", json=payload, timeout=60)
    assert r.status_code == 200, r.text
    j = r.json()
    assert isinstance(j.get("title"), str) and len(j["title"].strip()) > 0
    assert isinstance(j.get("message"), str) and len(j["message"].strip()) > 0


# AI generate-background (slow)
def test_generate_background(s):
    payload = {"prompt": "soft pastel florals", "category": "baby_shower"}
    r = s.post(f"{BASE_URL}/api/ai/generate-background", json=payload, timeout=120)
    assert r.status_code == 200, r.text
    j = r.json()
    assert isinstance(j.get("image_base64"), str) and len(j["image_base64"]) > 100
    assert isinstance(j.get("mime_type"), str) and j["mime_type"].startswith("image/")
