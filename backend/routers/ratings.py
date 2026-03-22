from fastapi import APIRouter, Depends
from sqlmodel import Session

from database import get_session
from dependencies import get_current_user
from schemas import RatingCreate, RatingResponse, RatingUpdate
import services

router = APIRouter(prefix="/ratings", tags=["ratings"])


@router.post("", response_model=RatingResponse, status_code=201)
def create_rating(data: RatingCreate, session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    return services.rate_show(current_user["user_id"], data, session)


@router.put("/{show_id}", response_model=RatingResponse)
def update_rating(show_id: int, data: RatingUpdate, session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    return services.update_rating(current_user["user_id"], show_id, data, session)


@router.delete("/{show_id}", status_code=204)
def delete_rating(show_id: int, session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    services.delete_rating(current_user["user_id"], show_id, session)
