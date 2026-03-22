# Movie Archive

A full-stack movie database and social platform built with FastAPI, React + Vite, and MySQL.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + SQLModel + PyMySQL |
| Frontend | React 18 + Vite + Bootstrap 5 |
| Database | MySQL (16 tables, 33 stored procedures) |
| Auth | JWT Bearer tokens (python-jose + passlib/bcrypt) |
| External API | OMDb API via httpx.AsyncClient |

## Features

- Browse and filter movies by genre, year, rating, and search term
- Rate and review movies (1–10 scale)
- Track watch history
- Create and manage personal watchlists
- Tag movies with community labels
- Curated editorial collections
- Admin: CSV movie import, OMDb metadata sync

## Getting Started

### Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # fill in your MySQL credentials
uvicorn main:app --reload  # runs on http://localhost:8000
```

API docs available at: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev    # runs on http://localhost:5173
```

### Database Setup

1. Import the original schema: run `DB_Project_Enhanced/1- Movie_Archive_DB.sql`
2. Insert sample data: run `DB_Project_Enhanced/2- Insertions.sql`
3. Create stored procedures: run `DB_Project_Enhanced/3- Procedures.sql`
4. Apply schema additions: run `db/4- Schema_Additions.sql`

## Screenshots

![Home Page](screenshots/home_page.png)
![Movie Detail](screenshots/show_detail.png)
![Login](screenshots/login.png)
![Register](screenshots/register.png)
![Watchlists](screenshots/watchlists.png)
![Watchlist Detail](screenshots/watchlist_detail.png)
![Watch History](screenshots/history.png)
![Admin Upload](screenshots/admin_upload.png)
![Admin Sync](screenshots/admin_sync.png)

## Project Structure

```
movie_archive/
├── backend/                # FastAPI backend
│   ├── main.py             # App entry point, CORS, routers
│   ├── config.py           # Settings (env vars)
│   ├── database.py         # SQLModel engine + session
│   ├── models.py           # 16 SQLModel table classes
│   ├── schemas.py          # Pydantic Create/Update/Response schemas
│   ├── services.py         # Fat service layer (all business logic)
│   ├── dependencies.py     # Auth dependencies (get_current_user, require_admin)
│   └── routers/            # Thin route handlers (3–5 lines each)
├── frontend/               # React + Vite SPA
│   └── src/
│       ├── api/client.js   # Axios instance with JWT interceptors
│       ├── context/        # AuthContext (global auth state)
│       ├── components/     # Reusable UI components
│       └── pages/          # One file per page
├── db/                     # Schema additions SQL
├── responsibilities/       # Per-student responsibility files
└── screenshots/            # UI screenshots
```
