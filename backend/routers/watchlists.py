from fastapi import APIRouter, Depends
from sqlmodel import Session

from database import get_session
from dependencies import get_current_user
from schemas import WatchlistCreate, WatchlistItemCreate, WatchlistResponse, WatchlistUpdate, WatchlistWithShowsResponse
import services

router = APIRouter(prefix="/watchlists", tags=["watchlists"])


@router.get("", response_model=list[WatchlistResponse])
def list_watchlists(session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    return services.get_user_watchlists(current_user["user_id"], session)


@router.post("", response_model=WatchlistResponse, status_code=201)
def create_watchlist(data: WatchlistCreate, session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    return services.create_watchlist(current_user["user_id"], data, session)


@router.get("/{watchlist_id}", response_model=WatchlistWithShowsResponse)
def get_watchlist(watchlist_id: int, session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    return services.get_watchlist_detail(watchlist_id, current_user["user_id"], session)


@router.put("/{watchlist_id}", response_model=WatchlistResponse)
def update_watchlist(watchlist_id: int, data: WatchlistUpdate, session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    return services.update_watchlist(watchlist_id, current_user["user_id"], data, session)


@router.delete("/{watchlist_id}", status_code=204)
def delete_watchlist(watchlist_id: int, session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    services.delete_watchlist(watchlist_id, current_user["user_id"], session)


@router.post("/{watchlist_id}/shows", status_code=201)
def add_to_watchlist(watchlist_id: int, data: WatchlistItemCreate, session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    services.add_to_watchlist(watchlist_id, data.show_id, current_user["user_id"], session)
    return {"detail": f"Show {data.show_id} added to watchlist {watchlist_id}."}


@router.delete("/{watchlist_id}/shows/{show_id}", status_code=204)
def remove_from_watchlist(watchlist_id: int, show_id: int, session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    services.remove_from_watchlist(watchlist_id, show_id, current_user["user_id"], session)
