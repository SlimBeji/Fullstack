from models.schemas import UserReadSchema


def create_token(user: UserReadSchema) -> str:
    return f"__TOKEN_FOR_USER_{user.email}__"
