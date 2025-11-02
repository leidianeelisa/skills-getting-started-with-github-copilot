import uuid

from fastapi.testclient import TestClient

from src.app import app, activities


client = TestClient(app)


def generate_email():
    return f"test-{uuid.uuid4().hex[:8]}@example.com"


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert "participants" in data["Chess Club"]


def test_signup_and_get_updates():
    email = generate_email()
    activity = "Chess Club"

    # Ensure clean state
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert f"Signed up {email}" in resp.json()["message"]

    # Verify via GET
    resp2 = client.get("/activities")
    assert resp2.status_code == 200
    assert email in resp2.json()[activity]["participants"]

    # Cleanup
    client.delete(f"/activities/{activity}/signup?email={email}")


def test_duplicate_signup_returns_400():
    email = generate_email()
    activity = "Chess Club"

    # Ensure clean
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    resp1 = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp1.status_code == 200

    # Duplicate signup should fail
    resp2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp2.status_code == 400

    # Cleanup
    client.delete(f"/activities/{activity}/signup?email={email}")


def test_unregister_not_signed_returns_400():
    email = generate_email()
    activity = "Chess Club"

    # Ensure not present
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    resp = client.delete(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 400
