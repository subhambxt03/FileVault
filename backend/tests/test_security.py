def test_unauthorized_upload(client):
    files = {"file": ("a.txt", b"hi", "text/plain")}
    assert client.post("/files/upload", files=files).status_code == 401


def test_authenticated_me(client):
    r = client.post("/auth/register", json={"name": "Sec", "email": "sec@example.com", "password": "password1"})
    token = r.json()["access_token"]
    r2 = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 200
    assert r2.json()["email"] == "sec@example.com"