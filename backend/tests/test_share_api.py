import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://cardcraft-73.preview.emergentagent.com").rstrip("/")


@pytest.fixture
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ---------- Health smoke ----------
def test_health(s):
    r = s.get(f"{BASE_URL}/api/health", timeout=20)
    assert r.status_code == 200
    j = r.json()
    assert j.get("status") == "ok"
    assert j.get("llm_key_configured") is True
    assert j.get("stripe_configured") is True


# ---------- Share: POST creates record, GET returns payload ----------
def test_share_post_creates_and_returns_url(s):
    payload = {
        "invite_id": "agent_test_share_001",
        "payload": {"title": "Hello", "message": "Test", "category": "birthday"},
    }
    r = s.post(f"{BASE_URL}/api/invites/share", json=payload, timeout=20)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j.get("share_id") == "agent_test_share_001"
    url = j.get("url", "")
    assert isinstance(url, str) and "/editor?id=" in url, f"bad url: {url}"


def test_share_get_returns_payload(s):
    # Depends on previous post (idempotent upsert)
    r = s.get(f"{BASE_URL}/api/invites/share/agent_test_share_001", timeout=20)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j.get("invite_id") == "agent_test_share_001"
    payload = j.get("payload") or {}
    assert payload.get("title") == "Hello"
    assert payload.get("message") == "Test"
    assert payload.get("category") == "birthday"


def test_share_get_404_for_missing(s):
    r = s.get(f"{BASE_URL}/api/invites/share/does_not_exist_xyz", timeout=20)
    assert r.status_code == 404, r.text


# ---------- Share: upsert overwrites payload ----------
def test_share_upsert_overwrites(s):
    sid = "TEST_share_upsert_zz"
    s.post(
        f"{BASE_URL}/api/invites/share",
        json={"invite_id": sid, "payload": {"title": "v1"}},
        timeout=20,
    )
    r2 = s.post(
        f"{BASE_URL}/api/invites/share",
        json={"invite_id": sid, "payload": {"title": "v2"}},
        timeout=20,
    )
    assert r2.status_code == 200
    g = s.get(f"{BASE_URL}/api/invites/share/{sid}", timeout=20)
    assert g.status_code == 200
    assert g.json().get("payload", {}).get("title") == "v2"
