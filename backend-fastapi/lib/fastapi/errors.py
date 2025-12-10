from http import HTTPStatus


class ApiError(Exception):
    def __init__(
        self, code: HTTPStatus, message: str = "", details: dict | None = None
    ) -> None:
        self.code = code
        self.message = message or "An unknown error occured"
        self.details = details or {}
