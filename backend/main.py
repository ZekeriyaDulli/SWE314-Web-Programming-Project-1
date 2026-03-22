from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import external, history, ratings, shows, tags, watchlists, users

# Module-level client shared across the app lifetime
http_client: httpx.AsyncClient | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client
    http_client = httpx.AsyncClient(timeout=httpx.Timeout(5.0))
    yield
    await http_client.aclose()


app = FastAPI(
    title="Movie Archive API",
    description="FastAPI backend for the Movie Archive web application.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],   # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(users.router)
app.include_router(shows.router)
app.include_router(ratings.router)
app.include_router(history.router)
app.include_router(watchlists.router)
app.include_router(tags.router)
app.include_router(external.router)


@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok", "message": "Movie Archive API is running."}
