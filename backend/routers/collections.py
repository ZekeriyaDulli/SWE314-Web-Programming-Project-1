from fastapi import APIRouter, Depends
from sqlmodel import Session

from database import get_session
from dependencies import get_current_user
from schemas import CollectionCreate, CollectionResponse, CollectionShowAdd, ShowResponse
import services

router = APIRouter(prefix="/collections", tags=["collections"])


@router.get("", response_model=list[CollectionResponse])
def list_collections(session: Session = Depends(get_session)):
    return services.get_all_collections(session)


@router.post("", response_model=CollectionResponse, status_code=201)
def create_collection(data: CollectionCreate, session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    return services.create_collection(current_user["user_id"], data, session)


@router.get("/{collection_id}/shows", response_model=list[ShowResponse])
def collection_shows(collection_id: int, session: Session = Depends(get_session)):
    return services.get_collection_shows(collection_id, session)


@router.post("/{collection_id}/shows", status_code=201)
def add_to_collection(collection_id: int, data: CollectionShowAdd, session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    services.add_show_to_collection(collection_id, data, current_user["user_id"], session)
    return {"detail": f"Show {data.show_id} added to collection {collection_id}."}


@router.delete("/{collection_id}/shows/{show_id}", status_code=204)
def remove_from_collection(collection_id: int, show_id: int, session: Session = Depends(get_session), current_user: dict = Depends(get_current_user)):
    services.remove_show_from_collection(collection_id, show_id, current_user["user_id"], session)
