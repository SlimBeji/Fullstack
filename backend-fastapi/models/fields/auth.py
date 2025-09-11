from typing import Annotated

from models.fields.base import FieldMeta


class AuthFields:
    username = FieldMeta(
        description="The user email (We use username here because of OAuth spec)",
        examples=["mslimbeji@gmail.com"],
    )
    access_token = FieldMeta(
        description="A generated web token. The 'Bearer ' prefix needs to be added for authentication",
        examples=[
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODIyNDVhOWY2YTU5ZjVlNjM2Y2NmYjEiLCJlbWFpbCI6ImJlamkuc2xpbUB5YWhvby5mciIsImlhdCI6MTc0NzMzNjUxMCwiZXhwIjoxNzQ3MzQwMTEwfQ.C4DCJKvGWhpHClpqmxHyxKLPYDOZDUlr-LA_2IflTXM"
        ],
    )
    expires_in = FieldMeta(
        description="The UNIX timestamp the token expires at", examples=[1751879562]
    )


class AuthAnnotations:
    username = Annotated[str, AuthFields.username.info]
    access_token = Annotated[str, AuthFields.access_token.info]
    expires_in = Annotated[int, AuthFields.expires_in.info]
