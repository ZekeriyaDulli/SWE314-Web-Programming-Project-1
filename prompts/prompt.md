Build a full-stack Movie Archive web application called "Movie Archive" from scratch. The application allows users to browse, rate, and track movies and TV series. Administrators upload IMDb ID lists and trigger a background sync with the OMDb external API to enrich every title with metadata, posters, cast, and episode data. Build the project phase-by-phase as described below.

---

## Phase 1 — MySQL Database Schema

1. Create a MySQL database named `movie_archive`. Run all SQL files in order using MySQL Workbench or the MySQL CLI.

2. Create the following 16 tables with the exact column definitions shown:
   - `users` — `user_id INT PK AUTO_INCREMENT`, `first_name VARCHAR(50) NOT NULL`, `last_name VARCHAR(50) NOT NULL`, `email VARCHAR(100) UNIQUE NOT NULL`, `password_hash VARCHAR(255) NOT NULL`, `created_at DATETIME DEFAULT CURRENT_TIMESTAMP`
   - `shows` — `show_id INT PK AUTO_INCREMENT`, `imdb_id VARCHAR(20) UNIQUE NOT NULL`, `show_type ENUM('movie','series') DEFAULT 'movie'`, `title VARCHAR(200)`, `release_year INT`, `duration_minutes INT`, `total_seasons INT`, `imdb_rating DECIMAL(3,1)`, `plot TEXT`, `poster_url VARCHAR(500)`, `trailer_url VARCHAR(20)`, `added_at DATETIME DEFAULT CURRENT_TIMESTAMP`
   - `genres` — `genre_id INT PK AUTO_INCREMENT`, `name VARCHAR(50) UNIQUE NOT NULL`
   - `show_genres` — composite PK `(show_id, genre_id)`, FK to both tables *(many-to-many)*
   - `actors` — `actor_id INT PK AUTO_INCREMENT`, `full_name VARCHAR(100) UNIQUE NOT NULL`
   - `show_actors` — composite PK `(show_id, actor_id)` *(many-to-many)*
   - `directors` — `director_id INT PK AUTO_INCREMENT`, `full_name VARCHAR(100) UNIQUE NOT NULL`
   - `show_directors` — composite PK `(show_id, director_id)` *(many-to-many)*
   - `seasons` — `season_id INT PK AUTO_INCREMENT`, `show_id FK`, `season_number INT`, `episode_count INT`, UNIQUE `(show_id, season_number)`
   - `episodes` — `episode_id INT PK AUTO_INCREMENT`, `season_id FK`, `episode_number INT`, `title VARCHAR(200) NOT NULL`, `air_date DATE`, `imdb_rating DECIMAL(3,1)`, `imdb_id VARCHAR(20)`, UNIQUE `(season_id, episode_number)`
   - `watchlists` — `watchlist_id INT PK AUTO_INCREMENT`, `user_id FK`, `name VARCHAR(100) NOT NULL`, `description VARCHAR(500)`, `created_at DATE DEFAULT (CURDATE())`
   - `watchlist_items` — composite PK `(watchlist_id, show_id)` *(many-to-many)*
   - `ratings` — `rating_id INT PK AUTO_INCREMENT`, `user_id FK`, `show_id FK`, `rating INT CHECK (rating BETWEEN 1 AND 10)`, `review_text VARCHAR(2000)`, `rated_at DATETIME DEFAULT CURRENT_TIMESTAMP`, UNIQUE `(user_id, show_id)`
   - `watch_history` — `history_id INT PK AUTO_INCREMENT`, `user_id FK`, `show_id FK`, `watched_at DATETIME DEFAULT CURRENT_TIMESTAMP`, UNIQUE `(user_id, show_id)`
   - `tags` — `tag_id INT PK AUTO_INCREMENT`, `name VARCHAR(50) UNIQUE NOT NULL`
   - `show_tags` — composite PK `(show_id, tag_id)` *(many-to-many)*

3. Write at minimum 27 stored procedures covering all major operations. Each procedure must be called by the service layer via `sqlalchemy.text("CALL sp_name(:p)")`. Required procedures include:
   - `sp_get_all_shows(p_genre_id, p_min_year, p_max_year, p_min_rating, p_search)` — filtered show list with platform average rating and rating count via LEFT JOINs; all filter params nullable
   - `sp_get_show_detail(p_show_id, p_user_id)` — single show row including `is_watched` flag derived from `watch_history`
   - `sp_add_show(p_imdb_id, OUT p_show_id)` — INSERT IGNORE on `imdb_id`; return new or existing `show_id` via OUT param
   - `sp_get_all_genres()` — full genres list
   - `sp_register_user(p_first_name, p_last_name, p_email, p_password_hash, OUT p_user_id)` — insert user, OUT param returns new id
   - `sp_get_user_by_email(p_email)` — single user row for login
   - `sp_create_watchlist(p_user_id, p_name, p_description, OUT p_watchlist_id)`
   - `sp_get_user_watchlists(p_user_id)` — list with `items_count` computed via subquery
   - `sp_get_watchlist_detail(p_watchlist_id, p_user_id)` — watchlist row + all shows in it
   - `sp_add_to_watchlist(p_watchlist_id, p_show_id)` — INSERT IGNORE
   - `sp_remove_from_watchlist(p_watchlist_id, p_show_id)`
   - `sp_delete_watchlist(p_watchlist_id, p_user_id)`
   - `sp_upsert_rating(p_user_id, p_show_id, p_rating, p_review_text)` — INSERT … ON DUPLICATE KEY UPDATE; also INSERT IGNORE into `watch_history`
   - `sp_get_show_ratings(p_show_id)` — all ratings for a show joined to `users` for first/last name
   - `sp_mark_watched(p_user_id, p_show_id)` — INSERT IGNORE into `watch_history`
   - `sp_get_watch_history(p_user_id)` — history joined to `shows` and left-joined to `ratings` for user rating
   - `sp_get_show_genres(p_show_id)`, `sp_get_show_actors(p_show_id)`, `sp_get_show_directors(p_show_id)`, `sp_get_show_tags(p_show_id)`, `sp_get_show_seasons(p_show_id)` — detail sub-queries
   - `sp_create_tag(p_name, OUT p_tag_id)`, `sp_get_all_tags()`, `sp_add_tag_to_show(p_show_id, p_tag_id)`, `sp_remove_tag_from_show(p_show_id, p_tag_id)`
   - `sp_update_watchlist(p_watchlist_id, p_user_id, p_name, p_description)`

---

## Phase 2 — Backend Project Structure

1. Create a directory called `backend/`. Inside it create these files:
   - `main.py` — FastAPI application entry point
   - `models.py` — SQLModel table classes (one per DB table)
   - `schemas.py` — all Pydantic request/response schemas
   - `services.py` — all business logic and stored procedure calls
   - `database.py` — engine, session factory, `get_session` dependency
   - `config.py` — `pydantic_settings.BaseSettings` reading from `.env`
   - `dependencies.py` — `get_current_user`, `get_optional_user`, `require_admin`
   - `routers/` — one file per resource group (see Phase 3)
   - `requirements.txt`
   - `.env.example`

2. Python dependencies (`requirements.txt`):
   - `fastapi`, `uvicorn[standard]`, `sqlmodel`, `pymysql`, `pydantic[email]`, `pydantic-settings`, `python-jose[cryptography]`, `passlib[bcrypt]`, `httpx`, `python-multipart`

3. Database configuration (`database.py`):
   - Build the MySQL connection string from individual env vars: `mysql+pymysql://{user}:{password}@{host}:{port}/{name}`
   - If a `DATABASE_URL` env var is set (Railway deployment), use it directly and override the individual fields
   - Create engine with `pool_pre_ping=True`
   - `get_session()` yields a `Session` for dependency injection

4. Settings (`config.py`):
   - Fields: `db_host`, `db_user`, `db_password`, `db_name`, `db_port`, `database_url: Optional[str]`, `secret_key`, `algorithm` (default `"HS256"`), `access_token_expire_minutes` (default `1440`), `omdb_api_key`, `admin_user_id` (default `1`), `frontend_url` (default `"http://localhost:5173"`)
   - `class Config: env_file = ".env"`

---

## Phase 3 — SQLModel Models and Pydantic Schemas

1. Models (`models.py`):
   - Create one `SQLModel` class per table with `table=True`
   - Do NOT define relationships or back-populates — the service layer uses raw SQL via stored procedures
   - All primary keys: `Optional[int] = Field(default=None, primary_key=True)`
   - Keep models as pure data containers; no business logic

2. Schemas (`schemas.py`) — strict separation from models:
   - `UserCreate`: `first_name: str = Field(min_length=2, max_length=50)`, `last_name`, `email: EmailStr`, `password: str = Field(min_length=6, max_length=128)`, `confirm_password: str`; add `@model_validator(mode="after")` that raises `ValueError("Passwords do not match.")` when they differ
   - `UserLogin`: `email: EmailStr`, `password: str`
   - `UserResponse`: `model_config = ConfigDict(from_attributes=True)`; fields `user_id`, `first_name`, `last_name`, `email`, `created_at`
   - `TokenResponse`: `access_token: str`, `token_type: str = "bearer"`, `user: UserResponse`
   - `ShowCreate`: `imdb_id: str = Field(min_length=3, max_length=20, pattern=r"^tt\d+$")`
   - `ShowResponse`: all show columns; add `platform_avg: Optional[float]` and `rating_count: Optional[int]` for computed fields from the stored procedure
   - `ShowDetailResponse(ShowResponse)`: extends with `genres`, `directors`, `actors`, `tags`, `ratings`, `seasons` lists and `is_watched: bool = False`
   - `RatingCreate`: `show_id: int = Field(gt=0)`, `rating: int = Field(ge=1, le=10)`, `review_text: Optional[str] = Field(default=None, max_length=2000)`
   - `WatchlistCreate`: `name: str = Field(min_length=1, max_length=100)`, `description: Optional[str] = Field(default=None, max_length=500)`
   - `FilterParams`: `genre_id`, `min_year: Optional[int] = Field(ge=1888, le=2030)`, `max_year`, `min_rating: Optional[Decimal]`, `search: Optional[str] = Field(max_length=200)`; add `@model_validator` that swaps `min_year`/`max_year` if inverted
   - `SyncStatusResponse`: `status: str` (one of `idle | running | complete | error`), `current: int`, `total: int`, `message: str`, `progress_percentage: float`
   - Add remaining schemas for `HistoryResponse`, `TagCreate`, `TagResponse`, `CollectionCreate`, `CollectionResponse`, `WatchlistWithShowsResponse`, etc.

---

## Phase 4 — Service Layer

1. Create `services.py`. All database access must go through this file. Routes must never access the session directly except to pass it to a service function.

2. Stored procedure call patterns:
   - Result-set procedure:
     ```python
     result = session.execute(text("CALL sp_name(:p)"), {"p": val})
     rows = result.mappings().all()
     ```
   - OUT param procedure:
     ```python
     session.execute(text("CALL sp_name(:p, @out)"), {"p": val})
     row = session.execute(text("SELECT @out")).fetchone()
     session.commit()
     ```

3. Implement the following service functions (flat functions, not classes):

   - `get_shows(filters: FilterParams, session) -> list[dict]`:
     * Call `sp_get_all_shows` with all filter params (pass `None` for unset fields)
     * Return `result.mappings().all()`

   - `get_show_detail(show_id: int, user_id: Optional[int], session) -> dict`:
     * Call `sp_get_show_detail`; if result is empty raise `HTTPException(status_code=404, detail=f"Show with id {show_id} not found")`
     * Call `sp_get_show_genres`, `sp_get_show_actors`, `sp_get_show_directors`, `sp_get_show_tags`, `sp_get_show_seasons` to build the full detail dict
     * For each season row, call `sp_get_season_episodes(season_id)` to attach episodes

   - `add_show(imdb_id: str, session) -> int`:
     * Call `sp_add_show` with OUT param; return the new `show_id`

   - `register_user(data: UserCreate, session) -> UserResponse`:
     * Hash password with `passlib CryptContext(schemes=["bcrypt"])`
     * Call `sp_register_user` with OUT param
     * If the OUT param returns `None` (duplicate email), raise `HTTPException(status_code=409, detail="An account with this email already exists.")`

   - `login_user(data: UserLogin, session) -> TokenResponse`:
     * Call `sp_get_user_by_email`; if no result raise `HTTPException(status_code=401, detail="Invalid email or password.")`
     * Verify password with `passlib`; raise same 401 on mismatch
     * Create JWT with `python-jose`; return `TokenResponse`

   - `upsert_rating(user_id, data: RatingCreate, session)`:
     * Call `sp_upsert_rating`; the procedure handles INSERT … ON DUPLICATE KEY UPDATE automatically

   - `get_watchlists(user_id, session)`, `create_watchlist(user_id, data, session)`, `get_watchlist_detail(watchlist_id, user_id, session)`:
     * `get_watchlist_detail` must raise `HTTPException(status_code=404, ...)` if the watchlist does not belong to the user

   - `process_csv_upload(content: bytes, session) -> dict`:
     * Decode bytes; split lines; strip whitespace
     * Skip header row if present; skip blank lines
     * For each IMDb ID matching `^tt\d+$`, call `sp_add_show`
     * Return `{"imported": N, "skipped": M, "total": N+M}`
     * If no valid IDs found, raise `HTTPException(status_code=400, detail="No valid IMDb IDs found in file.")`

4. OMDb sync — implement `run_full_sync(session, client, missing_only: bool = False)`:
   - Protect with `asyncio.Lock()` stored in module-level `_sync_lock`
   - Track progress in module-level `_sync_state` dict: `{"status": "idle", "current": 0, "total": 0, "message": "", "progress_percentage": 0.0}`
   - If `missing_only=True`, query: `SELECT … FROM shows WHERE title IS NULL OR imdb_rating IS NULL OR poster_url IS NULL OR trailer_url IS NULL`; otherwise query all shows
   - For each show, call `fetch_omdb_movie(imdb_id, client)` then `_apply_omdb_data(show, data, session)`
   - If `poster_url` is missing, call `_fetch_omdb_poster(imdb_id, client)`; save as `/poster/{imdb_id}` (proxy path, not raw OMDb URL)
   - If `trailer_url` is missing, call `_fetch_youtube_trailer(title, year, client)`; store only the 11-character video ID
   - For TV series (`data["Type"] == "series"`), call `_sync_tv_seasons(show_id, imdb_id, total_seasons, client, session)`; upsert each season and episode with `ON DUPLICATE KEY UPDATE`
   - Wrap each show in `try/except`; on exception call `session.rollback()` and continue — one bad show must not abort the sync
   - On completion set `_sync_state["status"] = "complete"`; on top-level exception set `"error"`

5. YouTube trailer scraping (`_fetch_youtube_trailer(title, year, client)`):
   - Do NOT use the YouTube Data API (quota is 100 searches/day at 100 units each)
   - GET `https://www.youtube.com/results?search_query={title} ({year}) official trailer`
   - Set `Accept-Language: en-US,en;q=0.9` header and `timeout=8.0`
   - Extract the first match of `"videoRenderer":{"videoId":"([a-zA-Z0-9_-]{11})"` — this renderer is exclusive to organic results and will not match ads
   - Return the 11-character video ID, or `None` if no match

---

## Phase 5 — FastAPI Routing Layer

Thin routes: every route body must be 3–5 lines — inject the session, call the service, return the result. No business logic, no direct DB queries inside routes.

1. `main.py`:
   - Create `app = FastAPI(title="Movie Archive API", version="1.0.0")`
   - Use `@asynccontextmanager` lifespan to create and close a shared `httpx.AsyncClient(timeout=httpx.Timeout(5.0))` stored as `main.http_client`
   - Add `CORSMiddleware` with `allow_origins=[settings.frontend_url]`, `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]`
   - Include routers: `/shows`, `/users`, `/ratings`, `/watchlists`, `/history`, `/tags`, `/collections`, `/admin`

2. Create the following router files in `routers/`:

   - `shows.py` — prefix `/shows`:
     * `GET /` — query params map to `FilterParams`; call `services.get_shows`; return `list[ShowResponse]`
     * `GET /genres` — return all genres
     * `GET /{show_id}` — call `services.get_show_detail(show_id, optional_user.user_id)`; return `ShowDetailResponse`
     * `POST /` — admin only; call `services.add_show`; return `201 Created`

   - `users.py` — prefix `/users`:
     * `POST /register` — call `services.register_user`; return `TokenResponse` with `status_code=201`
     * `POST /login` — call `services.login_user`; return `TokenResponse`
     * `GET /me` — requires auth; return current user from token

   - `ratings.py` — prefix `/ratings`:
     * `POST /` — requires auth; call `services.upsert_rating`; return `201`
     * `PUT /{rating_id}` — requires auth; call `services.update_rating`; return updated rating
     * `DELETE /{rating_id}` — requires auth; return `204 No Content`

   - `watchlists.py` — prefix `/watchlists`:
     * `GET /` — requires auth; return user's watchlists
     * `POST /` — requires auth; return `201`
     * `GET /{watchlist_id}` — requires auth; raise `404` if not found or not owned by user
     * `PUT /{watchlist_id}` — requires auth
     * `DELETE /{watchlist_id}` — requires auth; return `204`
     * `POST /{watchlist_id}/items` — requires auth; add show to watchlist; return `201`
     * `DELETE /{watchlist_id}/items/{show_id}` — requires auth; return `204`

   - `history.py` — prefix `/history`:
     * `GET /` — requires auth; return watch history
     * `POST /` — requires auth; mark show as watched; return `201`

   - `tags.py` — prefix `/tags`:
     * `GET /` — public; return all tags
     * `POST /` — admin only; create tag; return `201`
     * `POST /shows/{show_id}` — admin only; add tag to show; return `201`
     * `DELETE /shows/{show_id}/{tag_id}` — admin only; return `204`

   - `external.py` — two sub-routers:
     * **Poster proxy** (no auth): `GET /poster/{imdb_id}` — fetch hi-res image from `https://img.omdbapi.com/?apikey={key}&i={imdb_id}&h=3000`; stream via `StreamingResponse`; if status is not 200 or Content-Type is not `image/*`, raise `404`; set `Cache-Control: public, max-age=604800`
     * **Admin sync** (admin auth): `POST /admin/sync/start` — if already running raise `HTTPException(400)`; add `run_full_sync(session, client)` as background task; return `202`
     * `POST /admin/sync/start-missing` — same as above but passes `missing_only=True`
     * `GET /admin/sync/status` — return `SyncStatusResponse` from `_sync_state`
     * `POST /admin/upload-csv` — accept `UploadFile`; reject non-`.csv` files with `400`; call `services.process_csv_upload`

3. Dependencies (`dependencies.py`):
   - `get_current_user(token: str = Depends(oauth2_scheme), session = Depends(get_session)) -> UserResponse`:
     * Decode JWT with `python-jose`; raise `HTTPException(status_code=401, detail="Could not validate credentials.")` on any failure
     * Fetch user by `user_id` from token; raise `401` if not found
   - `get_optional_user` — same but returns `None` instead of raising when no token
   - `require_admin` — calls `get_current_user`; raises `HTTPException(status_code=403, detail="Admin access required.")` if `user.user_id != settings.admin_user_id`

4. HTTP status code reference — routes must return these exact codes:
   - `201` — resource created (register, add show, create watchlist, add rating, mark watched)
   - `202` — sync started (background task accepted)
   - `204` — resource deleted (delete watchlist, remove rating, remove watchlist item)
   - `400` — bad request (sync already running, invalid CSV)
   - `401` — invalid/expired token, wrong credentials
   - `403` — not admin
   - `404` — show/watchlist/rating not found
   - `409` — duplicate email on register, duplicate rating (handled by `ON DUPLICATE KEY UPDATE` so upsert never 409s)
   - `422` — Pydantic validation failure (automatic)
   - `502` — OMDb returned a non-200 response
   - `503` — OMDb network error (`httpx.RequestError`)
   - `504` — OMDb request timed out (`httpx.TimeoutException`)

---

## Phase 6 — React + Vite Frontend

1. Create a `frontend/` directory. Initialise with:
   ```
   npm create vite@latest frontend -- --template react
   cd frontend && npm install
   npm install axios react-router-dom bootstrap
   ```

2. Design system — Glassmorphism dark theme. Apply these CSS rules globally and to every card/panel:
   - Page background: `background: radial-gradient(ellipse at 20% 50%, rgba(120,40,200,0.18) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(201,68,85,0.15) 0%, transparent 55%), #0d0d0d` (fixed attachment)
   - Glass card: `background: rgba(255,255,255,0.05); backdrop-filter: blur(16px) saturate(180%); border: 1px solid rgba(255,255,255,0.10); border-radius: 16px; box-shadow: 0 4px 30px rgba(0,0,0,0.3)`
   - Accent colour: crimson `#c94455` / deep red `#81262E`
   - Muted text: `rgba(255,255,255,0.5)`
   - Inputs: `background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; color: #fff`
   - Accent button: `background: linear-gradient(135deg, #c94455, #81262E); border: none; border-radius: 10px; color: #fff; font-weight: 600`
   - Ghost button: `background: transparent; border: 1px solid rgba(255,255,255,0.18); color: rgba(255,255,255,0.75)`

3. API client (`src/api/client.js`):
   - Create an Axios instance with `baseURL` from `import.meta.env.VITE_API_URL`
   - Add a request interceptor that reads `localStorage.getItem('token')` and sets `Authorization: Bearer {token}` if present
   - Add a response interceptor that clears the token and redirects to `/login` on `401`

4. Auth context (`src/context/AuthContext.jsx`):
   - Expose `user`, `token`, `isLoggedIn`, `isAdmin`, `login(tokenData)`, `logout()`
   - `login()` stores the token and user in `localStorage`; `logout()` clears both
   - `isAdmin` is `true` when `user?.user_id === ADMIN_USER_ID` (hardcode the admin user id)
   - Wrap the app in `<AuthContext.Provider>` in `App.jsx`

5. Create the following 9 pages in `src/pages/`:

   - `HomePage.jsx`:
     * On mount, fetch `/shows/genres` and `/shows` (no filters)
     * Filter state: `genre_id`, `min_year`, `max_year`, `min_rating`, `search` — submit to `GET /shows` with non-empty params only
     * Type filter (All / Movies / Series) — client-side filter on `show_type`, not a server param
     * Mobile layout: type pills always visible; five filter fields hidden behind a "⚙ Filters" toggle button (`filtersOpen` state, default `false`); desktop always shows filters using Bootstrap `d-none d-md-flex`
     * Results grid: `row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5`

   - `ShowDetailPage.jsx`:
     * Fetch `/shows/{show_id}` on mount; if 404 redirect to `/`
     * Display: poster (via `/poster/{imdb_id}`), title, year, type badge, duration, IMDb rating (gold stars), platform rating, plot, genres chips, directors, cast accordion, tags
     * If `show.trailer_url` is set, render a "▶ Watch Trailer" button (crimson gradient); clicking it sets `showTrailer` state to `true`
     * Trailer modal: `position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.92)`; 16:9 YouTube iframe with `src={https://www.youtube.com/embed/${show.trailer_url}?autoplay=1&rel=0}`; clicking the overlay closes it
     * For TV series, render a collapsible Bootstrap accordion per season showing episode number, title, air date, IMDb rating
     * If authenticated, show rating form (1–10 star picker + textarea); on submit call `POST /ratings`
     * Show all existing ratings below the form

   - `LoginPage.jsx` and `RegisterPage.jsx`:
     * Centred glass card, 400 px max-width
     * Client-side: check for empty fields before submitting; `RegisterPage` compares passwords before calling API
     * On success, call `AuthContext.login()` and navigate to `/`
     * Show inline error banner on API error

   - `WatchlistsPage.jsx`:
     * Fetch `GET /watchlists`; display cards with name, description, item count
     * "New Watchlist" button opens an inline form; submit calls `POST /watchlists`
     * Delete button calls `DELETE /watchlists/{id}`

   - `WatchlistDetailPage.jsx`:
     * Fetch `GET /watchlists/{id}`; show show cards; each card has a remove button calling `DELETE /watchlists/{id}/items/{show_id}`

   - `WatchHistoryPage.jsx`:
     * Fetch `GET /history`; display cards with poster, title, year, watched date, user rating

   - `AdminUploadPage.jsx`:
     * File input restricted to `.csv`; `POST /admin/upload-csv` with `multipart/form-data`
     * Show result: `{imported} imported, {skipped} skipped`

   - `AdminSyncPage.jsx`:
     * Two buttons:
       - **▶ Full Sync** (crimson) — calls `POST /admin/sync/start`
       - **⚡ Sync Missing Only** (amber: `background: rgba(251,191,36,0.12); border: 1px solid rgba(251,191,36,0.35); color: #fbbf24`) — calls `POST /admin/sync/start-missing`
     * On click, set status to `running` and start `setInterval` polling `GET /admin/sync/status` every 2 seconds
     * Display: progress bar (`width: {pct}%; background: linear-gradient(90deg, #c94455, #81262E)`), `current/total · pct%` label, status badge (green = complete, red = error)
     * Stop polling when status is `complete` or `error`; clean up interval in `useEffect` return

6. Create the following components in `src/components/`:

   - `Navbar.jsx`:
     * Must use `className="navbar navbar-expand-lg navbar-dark"` on the `<nav>` element — Bootstrap collapse will not work without these classes
     * Hamburger: `data-bs-toggle="collapse"` / `data-bs-target="#navMenu"`
     * When logged out: Login + Register buttons
     * When logged in: user dropdown (My Watchlists, Watch History, Logout) and, if admin, an amber Admin dropdown (Upload CSV, Sync OMDb)

   - `MovieCard.jsx`:
     * Poster rendered via `<PosterImage imdbId={show.imdb_id} />`
     * Hover overlay: title, year, type badge, IMDb rating, "Add to Watchlist" button (authenticated only)
     * Clicking the card body navigates to `/shows/{show_id}`

   - `PosterImage.jsx`:
     * `src={/poster/${imdbId}}`; on `onError`, hide the image and show a placeholder div

   - `ErrorBanner.jsx`:
     * Red glass banner; `onDismiss` callback; render nothing when `message` is null

7. React Router v6 routes (`src/App.jsx`):
   ```
   /              → HomePage
   /shows/:id     → ShowDetailPage
   /login         → LoginPage
   /register      → RegisterPage
   /watchlists    → WatchlistsPage (protected)
   /watchlists/:id→ WatchlistDetailPage (protected)
   /history       → WatchHistoryPage (protected)
   /admin/upload  → AdminUploadPage (admin only)
   /admin/sync    → AdminSyncPage (admin only)
   ```
   Protected routes redirect to `/login`; admin routes redirect to `/` for non-admins.

---

## Phase 7 — Repository Structure and Documentation

1. The final repository root must contain exactly this structure:
   ```
   movie_archive/
   ├── backend/
   │   ├── routers/
   │   ├── main.py
   │   ├── models.py
   │   ├── schemas.py
   │   ├── services.py
   │   ├── database.py
   │   ├── config.py
   │   ├── dependencies.py
   │   └── requirements.txt
   ├── frontend/
   │   ├── src/
   │   │   ├── api/client.js
   │   │   ├── components/
   │   │   ├── context/AuthContext.jsx
   │   │   └── pages/
   │   ├── index.html
   │   └── package.json
   ├── db/
   │   ├── 1- Movie_Archive_DB.sql
   │   ├── 2- Stored_Procedures.sql
   │   └── 3- Sample_Data.sql
   │   
   │   
   ├── screenshots/
   ├── responsibilities/
   │   ├── 2309115377.md
   │   ├── 2309111082.md
   │   ├── 2309115105.md
   │   ├── 220911757.md
   │   └── 2509111065.md
   ├── REPORT.md
   └── README.md
   ```

2. Each file in `responsibilities/` must follow this format:
   ```markdown
   # [Full Name] — Student ID: [XXXXXXX]

   ## Role
   [Role title]

   ## Responsibilities
   - [bullet list of what this student built]
   ```

3. `README.md` must include:
   - Project description and tech stack table
   - How to run locally (backend: `uvicorn main:app --reload`; frontend: `npm run dev`; DB: run SQL files 1→5 in order)
   - Environment variables table (all keys from `config.py`)
   - Live deployment URLs (if deployed)

4. `REPORT.md` must cover:
   - Overview and business problem
   - Project structure tree
   - How to run
   - Deployment section (Railway for backend, Vercel for frontend)
   - Features section with screenshots
   - One section per course week covering the technical concepts demonstrated:
     * Week 1 — HTML/CSS fundamentals
     * Week 2 — Database design and FastAPI basics
     * Week 3 — Production APIs, external integrations, stored procedures
     * Week 4 — React + Vite, component architecture, state management, mobile responsiveness

5. `screenshots/` must contain PNG screenshots of every major page and interaction. Minimum required:
   - `01_home_browse.png`, `02_home_logged_in.png`, `03_home_filters.png`
   - `04_login_page.png`, `05_login_validation_empty.png`, `06_login_wrong_credentials.png`
   - `07_register_page.png`, `08_navbar_user_dropdown.png`, `09_navbar_admin_dropdown.png`
   - `10_register_passwords_mismatch.png`, `11_show_card_add_to_watchlist.png`
   - `16_show_detail.png`, `17_show_tv-show_detail.png`
   - `18_rating_validation_empty.png`, `19_rating_validation_range.png`, `20_rating_duplicate_error.png`
   - `21_watchlists_page.png`, `22_watchlist_detail.png`, `23_watchlist_create_validation.png`
   - `24_admin_upload_page.png`, `25_admin_upload_result.png`
   - `27_admin_sync_running.png`, `28_admin_sync_complete.png`
   - `30_watch_history.png`, `34_protected_route_redirect_to_login.png`
   - `35_swagger_overview.png`, `36_swagger_endpoint_expanded.png`, `37_swagger_try_it_out.png`
   - `38_show_detail_trailer_button.png`, `39_trailer_modal.png`

---

## Architectural Principles

These rules apply to every file in the project. Violating them constitutes an incomplete implementation:

- **Thin routes:** Every route body is 3–5 lines — parse the request, call one service function, return the result. No `session.execute()` calls inside route functions.
- **Fat services:** All business logic, uniqueness checks, permission checks, and database queries live in `services.py`. Routes are ignorant of SQL.
- **Dependency injection:** The session is always obtained via `Depends(get_session)`. Never instantiate a `Session` manually inside a route or service.
- **Schema/model separation:** `models.py` reflects the database schema. `schemas.py` defines what the API accepts and returns. They are never the same class.
- **Idempotent sync:** Running the full sync multiple times must produce identical results. Use `INSERT IGNORE` for entity tables and `ON DUPLICATE KEY UPDATE` for episode/season upserts.
- **Secret isolation:** The OMDb API key is never sent to the browser. All poster images are served via the `/poster/{imdb_id}` proxy endpoint.
- **Error isolation:** One failing show during sync must not abort the loop. Wrap each iteration in `try/except Exception: session.rollback()`.
- **Type hints:** Every function in `services.py`, `dependencies.py`, and all routers must have complete parameter and return type annotations.
- **Clear error messages:** Every `HTTPException` must include a `detail` string that tells the client exactly what went wrong.

---

EXPECTED RESULT:
- FastAPI backend running on `localhost:8000` with interactive docs at `/docs` showing all endpoints grouped by tag
- React frontend running on `localhost:5173`; dark glassmorphism UI; no CORS errors in the browser console
- Anonymous users can browse, search, filter, and view show details including the trailer modal
- Authenticated users can rate shows, build watchlists, and view their watch history
- Admin user can upload CSVs, run a full sync or a missing-only sync, and see a real-time progress bar
- All 5 SQL files execute cleanly in order against a fresh MySQL `movie_archive` database
- The repository contains `REPORT.md`, `README.md`, `screenshots/`, and `responsibilities/` files ready for submission

IMPORTANT NOTES:
- Use functional React components and hooks only — no class components
- Bootstrap 5 is loaded globally; use Bootstrap utility classes for layout and responsiveness
- The `navbar-expand-lg` and `navbar-dark` classes on `<nav>` are required for the hamburger collapse to function
- Do not use the YouTube Data API for trailer fetching — scrape `youtube.com/results` and target the `videoRenderer` JSON key in the page source
- Store only the 11-character YouTube video ID in `trailer_url`, not a full URL
- The poster proxy must set `Cache-Control: public, max-age=604800` to avoid re-fetching images on every page load
- All `asyncio` sync state (`_sync_state`, `_sync_lock`) must be module-level globals in `services.py` — they must persist across HTTP requests for the polling pattern to work
