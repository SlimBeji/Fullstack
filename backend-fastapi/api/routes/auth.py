from fastapi import APIRouter, Depends

from models.crud import crud_user
from models.schemas import EncodedTokenSchema, SigninForm, SignupForm

auth_router = APIRouter(prefix="/api/auth", tags=["Auth"])


@auth_router.post(
    "/signup", summary="User registration", response_model=EncodedTokenSchema
)
async def signup(form: SignupForm = Depends()):
    return await crud_user.signup(form)


@auth_router.post(
    "/signin", summary="User authentication", response_model=EncodedTokenSchema
)
async def signin(form: SigninForm = Depends()):
    return await crud_user.signin(form)
