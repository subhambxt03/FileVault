def test_register_and_login(client):
    r = client.post("/auth/register", json={"name": "Ada", "email": "ada@example.com", "password": "supersecret"})
    assert r.status_code == 201
    token = r.json()["access_token"]
    assert token

    r2 = client.post("/auth/login", json={"email": "ada@example.com", "password": "supersecret"})
    assert r2.status_code == 200
    assert r2.json()["user"]["email"] == "ada@example.com"

    r3 = client.post("/auth/login", json={"email": "ada@example.com", "password": "wrong"})
    assert r3.status_code == 401


def test_duplicate_email(client):
    client.post("/auth/register", json={"name": "A", "email": "dup@example.com", "password": "password1"})
    r = client.post("/auth/register", json={"name": "B", "email": "dup@example.com", "password": "password1"})
    assert r.status_code == 400