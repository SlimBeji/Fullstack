from typing import Annotated

from lib.pydantic import FieldMeta

# username
username_meta = FieldMeta(
    description="The user email (We use username here because of OAuth spec)",
    examples=["mslimbeji@gmail.com"],
)
username_annot = Annotated[str, username_meta.info]


# access_token
access_token_meta = FieldMeta(
    description="A generated web token. The 'Bearer ' prefix needs to be added for authentication",
    examples=[
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODIyNDVhOWY2YTU5ZjVlNjM2Y2NmYjEiLCJlbWFpbCI6ImJlamkuc2xpbUB5YWhvby5mciIsImlhdCI6MTc0NzMzNjUxMCwiZXhwIjoxNzQ3MzQwMTEwfQ.C4DCJKvGWhpHClpqmxHyxKLPYDOZDUlr-LA_2IflTXM"
    ],
)
access_token_annot = Annotated[str, access_token_meta.info]


# expires_in
expires_in_meta = FieldMeta(
    description="The UNIX timestamp the token expires at", examples=[1751879562]
)
expires_in_annot = Annotated[int, expires_in_meta.info]
