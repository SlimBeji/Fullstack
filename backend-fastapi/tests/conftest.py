import os

import pytest
from fastapi.testclient import TestClient

from api.app import create_app
from config import settings


@pytest.fixture(autouse=True)
def set_env_test():
    os.environ["ENV"] = "test"
    settings.ENV = "test"


@pytest.fixture
def client():
    app = create_app()
    with TestClient(app) as client:
        yield client
