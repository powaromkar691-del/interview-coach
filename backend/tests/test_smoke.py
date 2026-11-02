"""Smoke tests for the Interview Coach API — hit the live uvicorn process."""


def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "Hello World"


def test_protected_route_requires_auth(client):
    assert client.get("/dashboard").status_code == 401


def test_interview_create_requires_auth(client):
    response = client.post(
        "/interviews",
        json={"role": "Software Engineer", "interview_type": "technical", "difficulty": "easy", "num_questions": 3},
    )
    assert response.status_code == 401


def test_status_rejects_bad_body(client):
    assert client.post("/status", json={"nope": True}).status_code == 422


def test_topics_public(client):
    response = client.get("/topics")
    assert response.status_code == 200
    assert len(response.json()["topics"]) == 9


def test_auth_rejects_invalid_token(client):
    response = client.get("/dashboard", headers={"Authorization": "Bearer not-a-valid-token"})
    assert response.status_code == 401
