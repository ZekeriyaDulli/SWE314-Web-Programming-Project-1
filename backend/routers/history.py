from fastapi import APIRouter, Depends
from sqlmodel import Session

from database import get_session
from dependencies import get_current_user
from schemas import HistoryResponse
import services

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=list[HistoryResponse])
def get_history(session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    return services.get_watch_history(current_user["user_id"], session)


@router.post("/{show_id}", status_code=201)
def mark_watched(show_id: int, session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    services.mark_watched(current_user["user_id"], show_id, session)
    return {"detail": f"Show {show_id} marked as watched."}
