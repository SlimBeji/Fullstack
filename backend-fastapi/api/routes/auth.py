from fastapi import APIRouter, Depends

from models.cruds import CrudsUser
from models.schemas import EncodedTokenSchema, SigninForm, SignupForm

from ..middlewares import get_cruds_user

auth_router = APIRouter(prefix="/api/auth", tags=["Auth"])


@auth_router.post(
    "/signup", summary="User registration", response_model=EncodedTokenSchema
)
async def signup(
    cruds: CrudsUser = Depends(get_cruds_user), form: SignupForm = Depends()
):
    return await cruds.signup(form)


@auth_router.post(
    "/signin", summary="User authentication", response_model=EncodedTokenSchema
)
async def signin(
    cruds: CrudsUser = Depends(get_cruds_user), form: SigninForm = Depends()
):
    return await cruds.signin(form)
