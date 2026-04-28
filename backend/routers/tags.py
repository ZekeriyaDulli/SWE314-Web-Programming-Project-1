from fastapi import APIRouter, Depends
from sqlmodel import Session

from database import get_session
from dependencies import require_admin
from schemas import ShowTagCreate, TagCreate, TagResponse
import services

router = APIRouter(tags=["tags"])


@router.get("/tags", response_model=list[TagResponse])
def list_tags(session: Session = Depends(get_session)):
    return services.get_all_tags(session)


@router.post("/tags", response_model=TagResponse, status_code=201)
def create_tag(data: TagCreate, session: Session = Depends(get_session), admin: dict = Depends(require_admin)):
    return services.create_tag(data.name, session)


@router.post("/shows/{show_id}/tags", response_model=TagResponse, status_code=201)
def tag_show(show_id: int, data: ShowTagCreate, session: Session = Depends(get_session), admin: dict = Depends(require_admin)):
    return services.add_tag_to_show(show_id, data, admin["user_id"], session)


@router.delete("/shows/{show_id}/tags/{tag_id}", status_code=204)
def remove_tag(show_id: int, tag_id: int, session: Session = Depends(get_session), admin: dict = Depends(require_admin)):
    services.remove_tag_from_show(show_id, tag_id, session)


@router.get("/shows/{show_id}/tags", response_model=list[TagResponse])
def get_show_tags(show_id: int, session: Session = Depends(get_session)):
    return services.get_show_tags(show_id, session)
