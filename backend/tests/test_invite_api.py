import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://cardcraft-73.preview.emergentagent.com").rstrip("/")


@pytest.fixture
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ---------- Health ----------
def test_health(s):
    r = s.get(f"{BASE_URL}/api/health", timeout=20)
    assert r.status_code == 200
    j = r.json()
    assert j.get("status") == "ok"
    assert j.get("llm_key_configured") is True
    assert j.get("stripe_configured") is True


# ---------- AI: suggest-text ----------
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


# ---------- AI: generate-background (slow) ----------
def test_generate_background(s):
    payload = {"prompt": "soft pastel florals", "category": "baby_shower"}
    r = s.post(f"{BASE_URL}/api/ai/generate-background", json=payload, timeout=120)
    assert r.status_code == 200, r.text
    j = r.json()
    assert isinstance(j.get("image_base64"), str) and len(j["image_base64"]) > 100
    assert isinstance(j.get("mime_type"), str) and j["mime_type"].startswith("image/")


# ---------- Payments: status before any session is unpaid ----------
def test_payment_status_initial_unpaid(s):
    invite_id = "TEST_inv_status_only_unique_xyz"
    r = s.get(f"{BASE_URL}/api/payments/status/{invite_id}", timeout=20)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j.get("invite_id") == invite_id
    assert j.get("paid") is False
    assert j.get("status") in ("unpaid", "pending")


# ---------- Payments: create checkout session returns checkout_url + cs_ session_id ----------
def test_create_checkout_session(s):
    invite_id = "test_inv_1"
    payload = {
        "invite_id": invite_id,
        "success_url": f"{BASE_URL}/preview/{invite_id}",
        "cancel_url": f"{BASE_URL}/preview/{invite_id}",
    }
    r = s.post(
        f"{BASE_URL}/api/payments/create-checkout-session", json=payload, timeout=60
    )
    assert r.status_code == 200, r.text
    j = r.json()
    url = j.get("checkout_url", "")
    sid = j.get("session_id", "")
    assert isinstance(url, str) and url.startswith("https://"), f"bad url: {url}"
    # checkout providers commonly return checkout.stripe.com or a proxied checkout host
    assert "checkout" in url.lower() or "stripe" in url.lower(), (
        f"unexpected checkout url host: {url}"
    )
    assert isinstance(sid, str) and sid.startswith("cs_"), f"bad session id: {sid}"


# ---------- Payments: status after session creation reflects pending (not paid) ----------
def test_payment_status_after_session(s):
    invite_id = "test_inv_1"
    r = s.get(f"{BASE_URL}/api/payments/status/{invite_id}", timeout=20)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j.get("invite_id") == invite_id
    assert j.get("paid") is False
    # We just created a session in the previous test, so status should be pending
    assert j.get("status") in ("pending", "unpaid")
