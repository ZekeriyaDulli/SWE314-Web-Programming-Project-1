from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session

from config import settings
from database import get_session
from services import decode_access_token, get_user_by_id

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> dict:
    payload = decode_access_token(token)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Authentication failed. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return get_user_by_id(user_id, session)


def get_optional_user(
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)),
    session: Session = Depends(get_session),
):
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        user_id = payload.get("user_id")
        return get_user_by_id(user_id, session) if user_id else None
    except HTTPException:
        return None


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user["user_id"] != settings.admin_user_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this resource.",
        )
    return current_user
