def _token(client, email="u1@example.com"):
    r = client.post("/auth/register", json={"name": "U", "email": email, "password": "password1"})
    return r.json()["access_token"]


def test_upload_valid_image(client):
    token = _token(client)
    files = {"file": ("pic.png", b"\x89PNG\r\n\x1a\n" + b"0" * 100, "image/png")}
    r = client.post("/files/upload", files=files, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 201, r.text
    assert r.json()["status"] == "QUEUED"


def test_upload_unsupported_type(client):
    token = _token(client)
    files = {"file": ("evil.exe", b"binary", "application/octet-stream")}
    r = client.post("/files/upload", files=files, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 400


def test_upload_too_large(client):
    token = _token(client)
    big = b"0" * (10 * 1024 * 1024 + 10)
    files = {"file": ("big.txt", big, "text/plain")}
    r = client.post("/files/upload", files=files, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 413


def test_upload_requires_auth(client):
    files = {"file": ("a.txt", b"hello", "text/plain")}
    r = client.post("/files/upload", files=files)
    assert r.status_code == 401