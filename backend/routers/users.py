from fastapi import APIRouter, Depends
from sqlmodel import Session

from database import get_session
from dependencies import get_current_user
from schemas import TokenResponse, UserCreate, UserLogin, UserResponse
import services

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: UserCreate, session: Session = Depends(get_session)):
    result = services.register_user(data, session)
    return TokenResponse(access_token=result["token"], user=UserResponse(**result["user"]))


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, session: Session = Depends(get_session)):
    result = services.login_user(data, session)
    return TokenResponse(access_token=result["token"], user=UserResponse(**result["user"]))


@router.get("/me", response_model=UserResponse)
def me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)
