import os

TEST_ENV = "test"


def set_test_mode():
    os.environ["ENV"] = TEST_ENV


def is_test_mode() -> bool:
    return os.environ.get("ENV") == TEST_ENV
