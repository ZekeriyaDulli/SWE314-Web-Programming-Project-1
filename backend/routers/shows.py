from typing import Optional
from fastapi import APIRouter, Depends, Query
from decimal import Decimal
from sqlmodel import Session

from database import get_session
from dependencies import get_current_user, get_optional_user
from schemas import FilterParams, GenreResponse, SeasonResponse, ShowDetailResponse, ShowResponse
import services

router = APIRouter(prefix="/shows", tags=["shows"])


@router.get("", response_model=list[ShowResponse])
def list_shows(
    genre_id: Optional[int] = Query(None),
    min_year: Optional[int] = Query(None, ge=1888),
    max_year: Optional[int] = Query(None, le=2030),
    min_rating: Optional[Decimal] = Query(None),
    search: Optional[str] = Query(None, max_length=200),
    show_type: Optional[str] = Query(None, pattern=r"^(movie|series)$"),
    session: Session = Depends(get_session),
    current_user: Optional[dict] = Depends(get_optional_user),
):
    user_id = current_user["user_id"] if current_user else None
    filters = FilterParams(genre_id=genre_id, min_year=min_year, max_year=max_year, min_rating=min_rating, search=search, show_type=show_type)
    return services.get_shows(filters, session, user_id)


@router.get("/genres", response_model=list[GenreResponse])
def list_genres(session: Session = Depends(get_session)):
    return services.get_all_genres(session)


@router.get("/trending")
def trending(
    session: Session = Depends(get_session),
    current_user: Optional[dict] = Depends(get_optional_user),
):
    user_id = current_user["user_id"] if current_user else None
    return services.get_trending(session, user_id)


@router.get("/latest", response_model=list[ShowResponse])
def latest(
    show_type: str = Query("movie", pattern=r"^(movie|series)$"),
    session: Session = Depends(get_session),
    current_user: Optional[dict] = Depends(get_optional_user),
):
    user_id = current_user["user_id"] if current_user else None
    return services.get_latest(show_type, session, user_id)


@router.get("/suggestions")
def suggestions(
    q: str = Query(..., min_length=2, max_length=200),
    session: Session = Depends(get_session),
):
    return services.get_search_suggestions(q, session)


@router.get("/{show_id}", response_model=ShowDetailResponse)
def show_detail(
    show_id: int,
    session: Session = Depends(get_session),
    current_user: Optional[dict] = Depends(get_optional_user),
):
    user_id = current_user["user_id"] if current_user else None
    return services.get_show_detail(show_id, user_id, session)


@router.get("/{show_id}/seasons", response_model=list[SeasonResponse])
def show_seasons(show_id: int, session: Session = Depends(get_session)):
    return services.get_seasons(show_id, session)
