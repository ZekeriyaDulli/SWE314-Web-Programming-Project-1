from fastapi import APIRouter, Depends
from sqlmodel import Session

from database import get_session
from dependencies import get_current_user
from schemas import ChangePassword, TokenResponse, UserCreate, UserLogin, UserResponse
import services

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: UserCreate, session: Session = Depends(get_session)):
    result = services.register_user(data, session)
    return TokenResponse(access_token=result["token"])


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, session: Session = Depends(get_session)):
    result = services.login_user(data, session)
    return TokenResponse(access_token=result["token"])


@router.get("/me", response_model=UserResponse)
def me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)


@router.post("/change-password", status_code=200)
def change_password(
    data: ChangePassword,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    services.change_password(current_user["user_id"], data.current_password, data.new_password, session)
    return {"detail": "Password changed successfully."}
