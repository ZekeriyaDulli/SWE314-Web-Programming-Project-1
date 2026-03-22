from fastapi import APIRouter, BackgroundTasks, Depends, UploadFile, File
from sqlmodel import Session
import httpx

from database import get_session
from dependencies import require_admin
from schemas import SyncStatusResponse
import services

router = APIRouter(prefix="/admin", tags=["admin"])


def get_http_client() -> httpx.AsyncClient:
    import main
    return main.http_client


@router.get("/omdb/search")
async def omdb_search(imdb_id: str, client: httpx.AsyncClient = Depends(get_http_client), _=Depends(require_admin)):
    return await services.fetch_omdb_movie(imdb_id, client)


@router.post("/sync/start", status_code=202)
async def start_sync(
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    client: httpx.AsyncClient = Depends(get_http_client),
    _=Depends(require_admin),
):
    status = services.get_sync_status()
    if status.status == "running":
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="A sync is already in progress. Check /admin/sync/status.")
    background_tasks.add_task(services.run_full_sync, session, client)
    return {"detail": "Sync started. Poll GET /admin/sync/status for progress."}


@router.get("/sync/status", response_model=SyncStatusResponse)
def sync_status(_=Depends(require_admin)):
    return services.get_sync_status()


@router.post("/upload-csv")
async def upload_csv(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    _=Depends(require_admin),
):
    if not file.filename.endswith(".csv"):
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Only .csv files are accepted.")
    content = await file.read()
    return services.process_csv_upload(content, session)
