from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlmodel import Session
import httpx

from config import settings
from database import get_session
from dependencies import require_admin
from schemas import SyncStatusResponse
import services

# Public poster proxy — no auth required
poster_router = APIRouter(tags=["posters"])

# Admin routes
router = APIRouter(prefix="/admin", tags=["admin"])


def get_http_client() -> httpx.AsyncClient:
    import main
    return main.http_client


@poster_router.get("/poster/{imdb_id}")
async def proxy_poster(imdb_id: str, client: httpx.AsyncClient = Depends(get_http_client)):
    """Proxy the high-res OMDb poster image so the API key is never exposed to the browser."""
    r = await client.get(
        "https://img.omdbapi.com/",
        params={"apikey": settings.omdb_api_key, "i": imdb_id, "h": "3000"},
        timeout=8.0,
    )
    if r.status_code != 200 or not r.headers.get("Content-Type", "").startswith("image/"):
        raise HTTPException(status_code=404, detail="Poster not available.")
    return StreamingResponse(
        content=r.aiter_bytes(),
        media_type=r.headers["Content-Type"],
        headers={"Cache-Control": "public, max-age=604800"},  # cache 7 days
    )


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
        raise HTTPException(status_code=400, detail="A sync is already in progress. Check /admin/sync/status.")
    background_tasks.add_task(services.run_full_sync, session, client)
    return {"detail": "Sync started. Poll GET /admin/sync/status for progress."}


@router.post("/sync/start-missing", status_code=202)
async def start_sync_missing(
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    client: httpx.AsyncClient = Depends(get_http_client),
    _=Depends(require_admin),
):
    status = services.get_sync_status()
    if status.status == "running":
        raise HTTPException(status_code=400, detail="A sync is already in progress. Check /admin/sync/status.")
    background_tasks.add_task(services.run_full_sync, session, client, True)
    return {"detail": "Missing-only sync started. Poll GET /admin/sync/status for progress."}


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
        raise HTTPException(status_code=400, detail="Only .csv files are accepted.")
    content = await file.read()
    return services.process_csv_upload(content, session)
