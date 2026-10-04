def _token_and_job(client):
    r = client.post("/auth/register", json={"name": "U", "email": "jobs@example.com", "password": "password1"})
    token = r.json()["access_token"]
    files = {"file": ("notes.txt", b"hello world hello", "text/plain")}
    upload = client.post("/files/upload", files=files, headers={"Authorization": f"Bearer {token}"})
    return token, upload.json()["id"]


def test_job_list_and_status(client):
    token, jid = _token_and_job(client)
    r = client.get("/jobs", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["total"] >= 1

    r2 = client.get(f"/jobs/{jid}/status", headers={"Authorization": f"Bearer {token}"})
    assert r2.json()["status"] == "QUEUED"


def test_user_cannot_access_other_users_job(client):
    token_a, jid = _token_and_job(client)

    r = client.post("/auth/register", json={"name": "B", "email": "b@example.com", "password": "password1"})
    token_b = r.json()["access_token"]

    r2 = client.get(f"/jobs/{jid}", headers={"Authorization": f"Bearer {token_b}"})
    assert r2.status_code == 404