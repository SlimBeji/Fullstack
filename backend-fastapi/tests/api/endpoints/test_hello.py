from fastapi.testclient import TestClient


def test_hello_world(client: TestClient):
    resp = client.get("/api/hello-world")
    j = resp.json()
    assert resp.status_code == 200
    assert j == dict(message="Hello World!")
