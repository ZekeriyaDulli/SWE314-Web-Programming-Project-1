"""
Fat service layer — all business logic lives here.
Routes are thin (3-5 lines).

READ operations use direct SQL (avoids PyMySQL "Commands out of sync" with stored procs).
WRITE operations still use stored procedures where they contain business logic.
"""
import asyncio
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional

import bcrypt
import httpx
from fastapi import HTTPException
from jose import JWTError, jwt
from sqlalchemy import text
from sqlmodel import Session

from config import settings
from schemas import (
    FilterParams,
    RatingCreate,
    RatingUpdate,
    ShowTagCreate,
    SyncStatusResponse,
    UserCreate,
    UserLogin,
    WatchlistCreate,
    WatchlistUpdate,
)

# ── Crypto ────────────────────────────────────────────────────────────────────

def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: int, full_name: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"user_id": user_id, "full_name": full_name, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Token is invalid or has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── Auth ──────────────────────────────────────────────────────────────────────

def register_user(data: UserCreate, session: Session) -> dict:
    password_hash = _hash_password(data.password)
    # Direct INSERT — bypasses OUT-param issues with sp_create_user
    try:
        session.execute(
            text("""
                INSERT INTO users (first_name, last_name, email, password_hash, created_at)
                VALUES (:fn, :ln, :email, :pw, NOW())
            """),
            {
                "fn": data.first_name.strip(),
                "ln": data.last_name.strip(),
                "email": data.email.lower().strip(),
                "pw": password_hash,
            },
        )
        session.commit()
    except Exception as e:
        session.rollback()
        msg = str(e)
        if "Duplicate entry" in msg or "Email already exists" in msg:
            raise HTTPException(
                status_code=409,
                detail="An account with this email already exists. Please log in.",
            )
        raise HTTPException(status_code=500, detail="Registration failed. Please try again.")

    user = _get_user_by_email(data.email.lower(), session)
    if not user:
        raise HTTPException(status_code=500, detail="Registration failed. Please try again.")
    token = create_access_token(user["user_id"], f"{user['first_name']} {user['last_name']}")
    return {"token": token, "user": dict(user)}


def login_user(data: UserLogin, session: Session) -> dict:
    user = _get_user_by_email(data.email.lower(), session)
    if not user or not _verify_password(data.password, user["password_hash"]):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password combination.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(user["user_id"], f"{user['first_name']} {user['last_name']}")
    return {"token": token, "user": dict(user)}


def _get_user_by_email(email: str, session: Session) -> Optional[dict]:
    result = session.execute(
        text("SELECT user_id, first_name, last_name, email, password_hash, created_at FROM users WHERE email = :email"),
        {"email": email},
    )
    row = result.mappings().fetchone()
    return dict(row) if row else None


def get_user_by_id(user_id: int, session: Session) -> dict:
    result = session.execute(
        text("SELECT user_id, first_name, last_name, email, created_at FROM users WHERE user_id = :uid"),
        {"uid": user_id},
    )
    row = result.mappings().fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found.")
    return dict(row)


# ── Shows ─────────────────────────────────────────────────────────────────────

_SHOWS_SELECT = """
    SELECT
        s.show_id, s.imdb_id, s.show_type, s.title, s.release_year, s.duration_minutes,
        s.total_seasons, s.plot, s.imdb_rating, s.imdb_votes, s.poster_url, s.trailer_url, s.added_at,
        GROUP_CONCAT(DISTINCT a.full_name SEPARATOR ', ') AS actors,
        GROUP_CONCAT(DISTINCT d.full_name SEPARATOR ', ') AS directors,
        ROUND(AVG(ur.rating), 2) AS platform_avg,
        COUNT(DISTINCT ur.user_id) AS rating_count
    FROM shows s
    LEFT JOIN user_ratings ur ON ur.show_id = s.show_id
    LEFT JOIN show_genres sg ON sg.show_id = s.show_id
    LEFT JOIN show_actors sa ON sa.show_id = s.show_id
    LEFT JOIN actors a ON a.actor_id = sa.actor_id
    LEFT JOIN show_directors sd ON sd.show_id = s.show_id
    LEFT JOIN directors d ON d.director_id = sd.director_id
"""


def get_shows(filters: FilterParams, session: Session, user_id: Optional[int] = None) -> list[dict]:
    conditions = []
    params: dict = {}

    if filters.genre_id:
        conditions.append("sg.genre_id = :genre_id")
        params["genre_id"] = filters.genre_id
    if filters.min_year:
        conditions.append("s.release_year >= :min_year")
        params["min_year"] = filters.min_year
    if filters.max_year:
        conditions.append("s.release_year <= :max_year")
        params["max_year"] = filters.max_year
    if filters.min_rating:
        conditions.append("s.imdb_rating >= :min_rating")
        params["min_rating"] = filters.min_rating
    if filters.search:
        conditions.append("(s.title LIKE :search OR a.full_name LIKE :search OR d.full_name LIKE :search)")
        params["search"] = f"%{filters.search}%"
    if filters.show_type:
        conditions.append("s.show_type = :show_type")
        params["show_type"] = filters.show_type

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    params["uid"] = user_id or 0
    sql = f"""
        SELECT
            s.show_id, s.imdb_id, s.show_type, s.title, s.release_year, s.duration_minutes,
            s.total_seasons, s.plot, s.imdb_rating, s.imdb_votes, s.poster_url, s.trailer_url, s.added_at,
            GROUP_CONCAT(DISTINCT a.full_name SEPARATOR ', ') AS actors,
            GROUP_CONCAT(DISTINCT d.full_name SEPARATOR ', ') AS directors,
            ROUND(AVG(ur.rating), 2) AS platform_avg,
            COUNT(DISTINCT ur.user_id) AS rating_count,
            MAX(CASE WHEN wh.show_id IS NOT NULL THEN 1 ELSE 0 END) AS is_watched
        FROM shows s
        LEFT JOIN user_ratings ur ON ur.show_id = s.show_id
        LEFT JOIN show_genres sg ON sg.show_id = s.show_id
        LEFT JOIN show_actors sa ON sa.show_id = s.show_id
        LEFT JOIN actors a ON a.actor_id = sa.actor_id
        LEFT JOIN show_directors sd ON sd.show_id = s.show_id
        LEFT JOIN directors d ON d.director_id = sd.director_id
        LEFT JOIN watch_history wh ON wh.show_id = s.show_id AND wh.user_id = :uid
        {where}
        GROUP BY s.show_id
        ORDER BY s.release_year DESC, s.imdb_rating DESC
        LIMIT 100
    """
    result = session.execute(text(sql), params)
    rows = [dict(r) for r in result.mappings().all()]
    for row in rows:
        row["is_watched"] = bool(row.get("is_watched", 0))
    return rows


def get_trending(session: Session, user_id: Optional[int] = None) -> list[dict]:
    """Trending = admin-tagged Trending (tag_id 9) first, then highest-rated from past 2 years.
    Returns both movies and series so the frontend can toggle without reloading."""
    params: dict = {"uid": user_id or 0, "cutoff_year": datetime.now().year - 2}
    sql = """
        SELECT
            s.show_id, s.imdb_id, s.show_type, s.title, s.release_year, s.duration_minutes,
            s.total_seasons, s.plot, s.imdb_rating, s.imdb_votes, s.poster_url, s.trailer_url, s.added_at,
            ROUND(AVG(ur.rating), 2) AS platform_avg,
            COUNT(DISTINCT ur.user_id) AS rating_count,
            MAX(CASE WHEN wh.show_id IS NOT NULL THEN 1 ELSE 0 END) AS is_watched,
            MAX(CASE WHEN st.tag_id = 9 THEN 1 ELSE 0 END) AS is_trending_tag
        FROM shows s
        LEFT JOIN user_ratings ur ON ur.show_id = s.show_id
        LEFT JOIN watch_history wh ON wh.show_id = s.show_id AND wh.user_id = :uid
        LEFT JOIN show_tags st ON st.show_id = s.show_id
        WHERE s.imdb_rating IS NOT NULL
          AND (st.tag_id = 9 OR s.release_year >= :cutoff_year)
        GROUP BY s.show_id
        ORDER BY is_trending_tag DESC, s.release_year DESC, s.imdb_rating DESC
    """
    result = session.execute(text(sql), params)
    rows = [dict(r) for r in result.mappings().all()]
    movies = []
    series = []
    for row in rows:
        row["is_watched"] = bool(row.get("is_watched", 0))
        del row["is_trending_tag"]
        if row["show_type"] == "movie" and len(movies) < 12:
            movies.append(row)
        elif row["show_type"] == "series" and len(series) < 12:
            series.append(row)
        if len(movies) >= 12 and len(series) >= 12:
            break
    return {"movies": movies, "series": series}


def get_latest(show_type: str, session: Session, user_id: Optional[int] = None) -> list[dict]:
    """Latest = most recently produced shows of the given type."""
    params: dict = {"uid": user_id or 0, "show_type": show_type}
    sql = """
        SELECT
            s.show_id, s.imdb_id, s.show_type, s.title, s.release_year, s.duration_minutes,
            s.total_seasons, s.plot, s.imdb_rating, s.imdb_votes, s.poster_url, s.trailer_url, s.added_at,
            ROUND(AVG(ur.rating), 2) AS platform_avg,
            COUNT(DISTINCT ur.user_id) AS rating_count,
            MAX(CASE WHEN wh.show_id IS NOT NULL THEN 1 ELSE 0 END) AS is_watched
        FROM shows s
        LEFT JOIN user_ratings ur ON ur.show_id = s.show_id
        LEFT JOIN watch_history wh ON wh.show_id = s.show_id AND wh.user_id = :uid
        WHERE s.show_type = :show_type
        GROUP BY s.show_id
        ORDER BY GREATEST(COALESCE(s.latest_air_date, '1900-01-01'), DATE(CONCAT(COALESCE(s.release_year, 1900), '-01-01'))) DESC, s.imdb_rating DESC
        LIMIT 12
    """
    result = session.execute(text(sql), params)
    rows = [dict(r) for r in result.mappings().all()]
    for row in rows:
        row["is_watched"] = bool(row.get("is_watched", 0))
    return rows


def get_search_suggestions(query: str, session: Session) -> list[dict]:
    """Return up to 5 title matches for autocomplete."""
    sql = """
        SELECT s.show_id, s.title, s.show_type, s.release_year, s.poster_url, s.imdb_rating
        FROM shows s
        WHERE s.title LIKE :q
        ORDER BY s.imdb_rating DESC
        LIMIT 5
    """
    result = session.execute(text(sql), {"q": f"%{query}%"})
    return [dict(r) for r in result.mappings().all()]


def get_show_detail(show_id: int, user_id: Optional[int], session: Session) -> dict:
    # Core show + aggregates
    result = session.execute(
        text(f"""
            {_SHOWS_SELECT}
            WHERE s.show_id = :sid
            GROUP BY s.show_id, s.imdb_id, s.title, s.release_year, s.duration_minutes,
                     s.plot, s.imdb_rating, s.imdb_votes, s.poster_url, s.trailer_url, s.added_at
        """),
        {"sid": show_id},
    )
    show = result.mappings().fetchone()
    if not show:
        raise HTTPException(status_code=404, detail="Movie not found.")
    show = dict(show)

    # Genres
    genres_result = session.execute(
        text("SELECT g.genre_id, g.name FROM genres g JOIN show_genres sg ON g.genre_id = sg.genre_id WHERE sg.show_id = :sid"),
        {"sid": show_id},
    )
    show["genres"] = [dict(r) for r in genres_result.mappings().all()]

    # Directors
    directors_result = session.execute(
        text("SELECT d.director_id, d.full_name FROM directors d JOIN show_directors sd ON d.director_id = sd.director_id WHERE sd.show_id = :sid"),
        {"sid": show_id},
    )
    show["directors"] = [dict(r) for r in directors_result.mappings().all()]

    # Actors
    actors_result = session.execute(
        text("SELECT a.actor_id, a.full_name FROM actors a JOIN show_actors sa ON a.actor_id = sa.actor_id WHERE sa.show_id = :sid"),
        {"sid": show_id},
    )
    show["actors"] = [dict(r) for r in actors_result.mappings().all()]

    # Tags
    show["tags"] = get_show_tags(show_id, session)

    # Seasons (only for series)
    show["seasons"] = get_seasons(show_id, session) if show.get("show_type") == "series" else []

    # Ratings with user info
    ratings_result = session.execute(
        text("""
            SELECT r.rating_id, r.user_id, r.show_id, r.rating, r.review_text, r.rated_at,
                   u.first_name, u.last_name
            FROM user_ratings r
            JOIN users u ON u.user_id = r.user_id
            WHERE r.show_id = :sid
            ORDER BY r.rated_at DESC
        """),
        {"sid": show_id},
    )
    show["ratings"] = [dict(r) for r in ratings_result.mappings().all()]

    # Is watched
    show["is_watched"] = check_if_watched(user_id, show_id, session) if user_id else False

    return show


def get_all_genres(session: Session) -> list[dict]:
    result = session.execute(text("SELECT genre_id, name FROM genres ORDER BY name"))
    return [dict(r) for r in result.mappings().all()]


# ── Ratings ───────────────────────────────────────────────────────────────────

def rate_show(user_id: int, data: RatingCreate, session: Session) -> dict:
    try:
        # Use stored proc — INSERT only, no result set returned, safe with PyMySQL
        session.execute(
            text("CALL sp_rate_show(:uid, :sid, :rating, :review)"),
            {"uid": user_id, "sid": data.show_id, "rating": data.rating, "review": data.review_text or ""},
        )
        session.commit()
    except Exception as e:
        session.rollback()
        msg = str(e)
        if "Duplicate entry" in msg or "already rated" in msg.lower():
            raise HTTPException(
                status_code=409,
                detail="You have already rated this movie.",
            )
        raise HTTPException(status_code=500, detail="Failed to submit rating. Please try again.")

    result = session.execute(
        text("""
            SELECT r.rating_id, r.user_id, r.show_id, r.rating, r.review_text, r.rated_at,
                   u.first_name, u.last_name
            FROM user_ratings r JOIN users u ON u.user_id = r.user_id
            WHERE r.user_id = :uid AND r.show_id = :sid
        """),
        {"uid": user_id, "sid": data.show_id},
    )
    row = result.mappings().fetchone()
    return dict(row) if row else {}


def update_rating(user_id: int, show_id: int, data: RatingUpdate, session: Session) -> dict:
    result = session.execute(
        text("SELECT rating_id, rating, review_text FROM user_ratings WHERE user_id = :uid AND show_id = :sid"),
        {"uid": user_id, "sid": show_id},
    )
    existing = result.mappings().fetchone()
    if not existing:
        raise HTTPException(
            status_code=404,
            detail="You haven't rated this movie yet.",
        )

    new_rating = data.rating if data.rating is not None else existing["rating"]
    new_review = data.review_text if data.review_text is not None else existing["review_text"]

    session.execute(
        text("UPDATE user_ratings SET rating = :rating, review_text = :review, rated_at = NOW() WHERE user_id = :uid AND show_id = :sid"),
        {"rating": new_rating, "review": new_review, "uid": user_id, "sid": show_id},
    )
    session.commit()

    result = session.execute(
        text("""
            SELECT r.rating_id, r.user_id, r.show_id, r.rating, r.review_text, r.rated_at,
                   u.first_name, u.last_name
            FROM user_ratings r JOIN users u ON u.user_id = r.user_id
            WHERE r.user_id = :uid AND r.show_id = :sid
        """),
        {"uid": user_id, "sid": show_id},
    )
    return dict(result.mappings().fetchone())


def delete_rating(user_id: int, show_id: int, session: Session) -> None:
    result = session.execute(
        text("SELECT rating_id FROM user_ratings WHERE user_id = :uid AND show_id = :sid"),
        {"uid": user_id, "sid": show_id},
    )
    if not result.fetchone():
        raise HTTPException(status_code=404, detail="You haven't rated this movie yet.")
    session.execute(
        text("DELETE FROM user_ratings WHERE user_id = :uid AND show_id = :sid"),
        {"uid": user_id, "sid": show_id},
    )
    session.commit()


# ── Watch History ─────────────────────────────────────────────────────────────

def mark_watched(user_id: int, show_id: int, session: Session) -> None:
    # sp_mark_as_watched is INSERT IGNORE — no result set, safe
    session.execute(
        text("CALL sp_mark_as_watched(:uid, :sid)"), {"uid": user_id, "sid": show_id}
    )
    session.commit()


def unmark_watched(user_id: int, show_id: int, session: Session) -> None:
    has_rating = session.execute(
        text("SELECT rating_id FROM user_ratings WHERE user_id = :uid AND show_id = :sid"),
        {"uid": user_id, "sid": show_id},
    ).fetchone()
    if has_rating:
        raise HTTPException(
            status_code=409,
            detail="Cannot remove from watch history while a rating exists. Delete your rating first.",
        )
    session.execute(
        text("DELETE FROM watch_history WHERE user_id = :uid AND show_id = :sid"),
        {"uid": user_id, "sid": show_id},
    )
    session.commit()


def get_watch_history(user_id: int, session: Session) -> list[dict]:
    result = session.execute(
        text("""
            SELECT
                wh.user_id,
                wh.show_id,
                s.imdb_id,
                MIN(wh.watched_at) AS watched_at,
                s.title,
                s.release_year,
                s.poster_url,
                s.imdb_rating,
                ur.rating AS user_rating,
                ur.review_text
            FROM watch_history wh
            JOIN shows s ON s.show_id = wh.show_id
            LEFT JOIN user_ratings ur ON ur.user_id = wh.user_id AND ur.show_id = wh.show_id
            WHERE wh.user_id = :uid
            GROUP BY wh.user_id, wh.show_id, s.imdb_id, s.title, s.release_year, s.poster_url,
                     s.imdb_rating, ur.rating, ur.review_text
            ORDER BY watched_at DESC
        """),
        {"uid": user_id},
    )
    return [dict(r) for r in result.mappings().all()]


def get_seasons(show_id: int, session: Session) -> list[dict]:
    seasons_result = session.execute(
        text("SELECT season_id, show_id, season_number, episode_count FROM seasons WHERE show_id = :sid ORDER BY season_number"),
        {"sid": show_id},
    )
    seasons = [dict(r) for r in seasons_result.mappings().all()]
    for season in seasons:
        eps_result = session.execute(
            text("""
                SELECT episode_id, episode_number, title, air_date, imdb_rating, imdb_id
                FROM episodes WHERE season_id = :sid ORDER BY episode_number
            """),
            {"sid": season["season_id"]},
        )
        season["episodes"] = [dict(r) for r in eps_result.mappings().all()]
    return seasons


def check_if_watched(user_id: int, show_id: int, session: Session) -> bool:
    result = session.execute(
        text("SELECT COUNT(*) AS cnt FROM watch_history WHERE user_id = :uid AND show_id = :sid"),
        {"uid": user_id, "sid": show_id},
    )
    row = result.fetchone()
    return bool(row and row[0] > 0)


# ── Watchlists ────────────────────────────────────────────────────────────────

def get_user_watchlists(user_id: int, session: Session) -> list[dict]:
    result = session.execute(
        text("""
            SELECT w.watchlist_id, w.user_id, w.name, w.description, w.created_at,
                   COUNT(wi.show_id) AS items_count
            FROM watchlists w
            LEFT JOIN watchlist_items wi ON wi.watchlist_id = w.watchlist_id
            WHERE w.user_id = :uid
            GROUP BY w.watchlist_id, w.user_id, w.name, w.description, w.created_at
            ORDER BY w.created_at DESC
        """),
        {"uid": user_id},
    )
    return [dict(r) for r in result.mappings().all()]


def create_watchlist(user_id: int, data: WatchlistCreate, session: Session) -> dict:
    try:
        session.execute(
            text("CALL sp_create_watchlist(:uid, :name, :desc, @wid)"),
            {"uid": user_id, "name": data.name.strip(), "desc": data.description or ""},
        )
        row = session.execute(text("SELECT @wid")).fetchone()
        session.commit()
        watchlist_id = row[0]
    except Exception as e:
        session.rollback()
        msg = str(e)
        if "already exists" in msg.lower() or "Duplicate entry" in msg:
            raise HTTPException(
                status_code=409,
                detail="A watchlist with this name already exists.",
            )
        raise HTTPException(status_code=500, detail="Failed to create watchlist. Please try again.")

    result = session.execute(
        text("""
            SELECT w.watchlist_id, w.user_id, w.name, w.description, w.created_at,
                   COUNT(wi.show_id) AS items_count
            FROM watchlists w
            LEFT JOIN watchlist_items wi ON wi.watchlist_id = w.watchlist_id
            WHERE w.watchlist_id = :wid
            GROUP BY w.watchlist_id, w.user_id, w.name, w.description, w.created_at
        """),
        {"wid": watchlist_id},
    )
    return dict(result.mappings().fetchone())


def update_watchlist(watchlist_id: int, user_id: int, data: WatchlistUpdate, session: Session) -> dict:
    check = session.execute(
        text("SELECT watchlist_id FROM watchlists WHERE watchlist_id = :wid AND user_id = :uid"),
        {"wid": watchlist_id, "uid": user_id},
    )
    if not check.fetchone():
        raise HTTPException(status_code=403, detail="Watchlist not found or access denied.")
    updates = []
    params: dict = {"wid": watchlist_id}
    if data.name is not None:
        updates.append("name = :name")
        params["name"] = data.name.strip()
    if data.description is not None:
        updates.append("description = :desc")
        params["desc"] = data.description
    if updates:
        session.execute(text(f"UPDATE watchlists SET {', '.join(updates)} WHERE watchlist_id = :wid"), params)
        session.commit()
    result = session.execute(
        text("""
            SELECT w.watchlist_id, w.user_id, w.name, w.description, w.created_at,
                   COUNT(wi.show_id) AS items_count
            FROM watchlists w
            LEFT JOIN watchlist_items wi ON wi.watchlist_id = w.watchlist_id
            WHERE w.watchlist_id = :wid
            GROUP BY w.watchlist_id, w.user_id, w.name, w.description, w.created_at
        """),
        {"wid": watchlist_id},
    )
    return dict(result.mappings().fetchone())


def get_watchlist_detail(watchlist_id: int, user_id: int, session: Session) -> dict:
    result = session.execute(
        text("""
            SELECT w.watchlist_id, w.user_id, w.name, w.description, w.created_at,
                   COUNT(wi.show_id) AS items_count
            FROM watchlists w
            LEFT JOIN watchlist_items wi ON wi.watchlist_id = w.watchlist_id
            WHERE w.watchlist_id = :wid AND w.user_id = :uid
            GROUP BY w.watchlist_id, w.user_id, w.name, w.description, w.created_at
        """),
        {"wid": watchlist_id, "uid": user_id},
    )
    watchlist = result.mappings().fetchone()
    if not watchlist:
        raise HTTPException(
            status_code=403,
            detail="Watchlist not found or access denied.",
        )

    shows_result = session.execute(
        text("""
            SELECT s.show_id, s.imdb_id, s.show_type, s.title, s.release_year,
                s.duration_minutes, s.total_seasons, s.imdb_rating, s.imdb_votes,
                s.poster_url, s.trailer_url, s.added_at,
                ROUND(AVG(ur.rating), 2) AS platform_avg,
                COUNT(DISTINCT ur.user_id) AS rating_count,
                MAX(CASE WHEN wh.show_id IS NOT NULL THEN 1 ELSE 0 END) AS is_watched,
                GROUP_CONCAT(DISTINCT g.genre_id ORDER BY g.name SEPARATOR ',') AS genre_ids,
                GROUP_CONCAT(DISTINCT g.name ORDER BY g.name SEPARATOR ',') AS genre_names,
                wi.added_at AS watchlist_added_at
            FROM watchlist_items wi
            JOIN shows s ON s.show_id = wi.show_id
            LEFT JOIN user_ratings ur ON ur.show_id = s.show_id
            LEFT JOIN watch_history wh ON wh.show_id = s.show_id AND wh.user_id = :uid
            LEFT JOIN show_genres sg ON sg.show_id = s.show_id
            LEFT JOIN genres g ON g.genre_id = sg.genre_id
            WHERE wi.watchlist_id = :wid
            GROUP BY s.show_id, wi.added_at
            ORDER BY wi.added_at DESC
        """),
        {"wid": watchlist_id, "uid": user_id},
    )
    shows = [dict(r) for r in shows_result.mappings().all()]
    for row in shows:
        row["is_watched"] = bool(row.get("is_watched", 0))
    return {**dict(watchlist), "shows": shows}


def delete_watchlist(watchlist_id: int, user_id: int, session: Session) -> None:
    check = session.execute(
        text("SELECT watchlist_id FROM watchlists WHERE watchlist_id = :wid AND user_id = :uid"),
        {"wid": watchlist_id, "uid": user_id},
    )
    if not check.fetchone():
        raise HTTPException(
            status_code=403, detail="Watchlist not found or access denied.",
        )
    try:
        session.execute(
            text("CALL sp_delete_watchlist(:wid, :uid)"), {"wid": watchlist_id, "uid": user_id}
        )
        session.commit()
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete watchlist. Please try again.")


def add_to_watchlist(watchlist_id: int, show_id: int, user_id: int, session: Session) -> None:
    check = session.execute(
        text("SELECT watchlist_id FROM watchlists WHERE watchlist_id = :wid AND user_id = :uid"),
        {"wid": watchlist_id, "uid": user_id},
    )
    if not check.fetchone():
        raise HTTPException(
            status_code=403, detail="Watchlist not found or access denied.",
        )
    # sp_add_to_watchlist is INSERT IF NOT EXISTS — no result set, safe
    session.execute(
        text("CALL sp_add_to_watchlist(:wid, :sid)"), {"wid": watchlist_id, "sid": show_id}
    )
    session.commit()


def remove_from_watchlist(watchlist_id: int, show_id: int, user_id: int, session: Session) -> None:
    check = session.execute(
        text("SELECT watchlist_id FROM watchlists WHERE watchlist_id = :wid AND user_id = :uid"),
        {"wid": watchlist_id, "uid": user_id},
    )
    if not check.fetchone():
        raise HTTPException(
            status_code=403, detail="Watchlist not found or access denied.",
        )
    session.execute(
        text("CALL sp_remove_from_watchlist(:wid, :sid)"), {"wid": watchlist_id, "sid": show_id}
    )
    session.commit()


# ── Tags ──────────────────────────────────────────────────────────────────────

def get_all_tags(session: Session) -> list[dict]:
    result = session.execute(text("SELECT tag_id, name FROM tags ORDER BY name"))
    return [dict(r) for r in result.mappings().all()]


def create_tag(name: str, session: Session) -> dict:
    try:
        session.execute(text("INSERT INTO tags (name) VALUES (:name)"), {"name": name.strip()})
        session.commit()
    except Exception as e:
        session.rollback()
        if "Duplicate entry" in str(e):
            raise HTTPException(status_code=409, detail="A tag with this name already exists.")
        raise HTTPException(status_code=500, detail="Failed to create tag. Please try again.")
    result = session.execute(text("SELECT tag_id, name FROM tags WHERE name = :name"), {"name": name.strip()})
    return dict(result.mappings().fetchone())


def get_show_tags(show_id: int, session: Session) -> list[dict]:
    result = session.execute(
        text("""
            SELECT t.tag_id, t.name
            FROM tags t
            JOIN show_tags st ON st.tag_id = t.tag_id
            WHERE st.show_id = :sid
            ORDER BY st.tagged_at DESC
        """),
        {"sid": show_id},
    )
    return [dict(r) for r in result.mappings().all()]


def add_tag_to_show(show_id: int, data: ShowTagCreate, user_id: int, session: Session) -> dict:
    tag_check = session.execute(
        text("SELECT tag_id, name FROM tags WHERE tag_id = :tid"), {"tid": data.tag_id}
    )
    tag = tag_check.mappings().fetchone()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found.")
    try:
        session.execute(
            text("INSERT INTO show_tags (show_id, tag_id, tagged_by_user_id, tagged_at) VALUES (:sid, :tid, :uid, NOW())"),
            {"sid": show_id, "tid": data.tag_id, "uid": user_id},
        )
        session.commit()
    except Exception as e:
        session.rollback()
        if "Duplicate entry" in str(e):
            raise HTTPException(
                status_code=409,
                detail="You have already applied this tag to this movie.",
            )
        raise HTTPException(status_code=500, detail="Failed to add tag. Please try again.")
    return dict(tag)


# ── External API (OMDb) ───────────────────────────────────────────────────────

OMDB_API_URL = "http://www.omdbapi.com/"
OMDB_POSTER_API_URL = "https://img.omdbapi.com/"


async def fetch_omdb_movie(imdb_id: str, client: httpx.AsyncClient) -> dict:
    try:
        response = await client.get(
            OMDB_API_URL,
            params={"apikey": settings.omdb_api_key, "i": imdb_id, "plot": "full"},
            timeout=5.0,
        )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail=f"OMDb API timed out after 5 seconds while fetching imdb_id='{imdb_id}'. Try again later.",
        )
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Cannot reach OMDb API (connection refused). The service may be down.",
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Bad gateway: upstream OMDb API request failed — {exc}",
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"OMDb API returned HTTP {response.status_code} for imdb_id='{imdb_id}'.",
        )
    data = response.json()
    if data.get("Response") == "False":
        raise HTTPException(
            status_code=404,
            detail=f"OMDb has no record for imdb_id='{imdb_id}'. Error: {data.get('Error', 'Unknown')}",
        )
    return data


async def _fetch_youtube_trailer(title: str, year: Optional[int], client: httpx.AsyncClient) -> Optional[str]:
    """
    Scrape YouTube search results for a trailer video ID.
    Targets 'videoRenderer' — YouTube's data structure for organic search
    results only. Ads and promoted content use different renderer names
    ('promotedSparklesWebRenderer', 'searchPyvRenderer') so they are
    naturally skipped, giving the actual first search result.
    """
    import re
    year_str = f"({year})" if year else ""
    query = f"{title} {year_str} official trailer"
    try:
        r = await client.get(
            "https://www.youtube.com/results",
            params={"search_query": query},
            headers={"Accept-Language": "en-US,en;q=0.9"},
            timeout=8.0,
        )
        # "videoRenderer":{"videoId":"..."} is exclusively used for
        # organic video search results — first match = top result
        match = re.search(
            r'"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})"',
            r.text,
        )
        if match:
            return match.group(1)
    except Exception:
        pass
    return None


async def _fetch_omdb_poster(imdb_id: str, client: httpx.AsyncClient) -> Optional[str]:
    try:
        r = await client.get(
            OMDB_POSTER_API_URL,
            params={"apikey": settings.omdb_api_key, "i": imdb_id, "h": "3000"},
            timeout=5.0,
        )
        if r.status_code == 200 and r.headers.get("Content-Type", "").startswith("image/"):
            return str(r.url)
    except Exception:
        pass
    return None


# ── TV Season Sync ────────────────────────────────────────────────────────────

async def _sync_tv_seasons(
    show_id: int, imdb_id: str, total_seasons: int,
    client: httpx.AsyncClient, session: Session,
) -> None:
    from datetime import date as date_type
    for season_num in range(1, total_seasons + 1):
        try:
            r = await client.get(
                OMDB_API_URL,
                params={"apikey": settings.omdb_api_key, "i": imdb_id, "Season": season_num},
                timeout=5.0,
            )
            if r.status_code != 200:
                continue
            data = r.json()
            if data.get("Response") == "False":
                break
            episodes_raw = data.get("Episodes", [])
            today = date_type.today()

            # Parse episodes, keeping only those that have already aired
            aired_episodes = []
            for ep in episodes_raw:
                try:
                    ep_num = int(ep.get("Episode", 0))
                    if ep_num == 0:
                        continue
                    title = ep.get("Title") or "TBA"
                    air_date = None
                    air_str = ep.get("Released", "N/A")
                    if air_str and air_str != "N/A":
                        from datetime import datetime as dt
                        for fmt in ("%Y-%m-%d", "%d %b %Y"):
                            try:
                                air_date = dt.strptime(air_str, fmt).date()
                                break
                            except ValueError:
                                continue
                    # Skip episodes that haven't aired yet
                    if air_date is None or air_date > today:
                        continue
                    rating = None
                    rating_str = ep.get("imdbRating", "N/A")
                    if rating_str and rating_str != "N/A":
                        try:
                            rating = Decimal(rating_str)
                        except Exception:
                            pass
                    ep_imdb_id = ep.get("imdbID") or None
                    aired_episodes.append({
                        "ep_num": ep_num, "title": title, "air_date": air_date,
                        "rating": rating, "imdb_id": ep_imdb_id,
                    })
                except Exception:
                    pass

            # Skip entire season if no episodes have aired
            if not aired_episodes:
                continue

            # Upsert season row with actual aired episode count
            session.execute(
                text("""
                    INSERT INTO seasons (show_id, season_number, episode_count)
                    VALUES (:sid, :snum, :ecnt)
                    ON DUPLICATE KEY UPDATE episode_count = :ecnt
                """),
                {"sid": show_id, "snum": season_num, "ecnt": len(aired_episodes)},
            )
            session.commit()
            season_row = session.execute(
                text("SELECT season_id FROM seasons WHERE show_id = :sid AND season_number = :snum"),
                {"sid": show_id, "snum": season_num},
            ).fetchone()
            if not season_row:
                continue
            season_id = season_row[0]
            # Upsert aired episodes
            for ep in aired_episodes:
                try:
                    session.execute(
                        text("""
                            INSERT INTO episodes (season_id, episode_number, title, air_date, imdb_rating, imdb_id)
                            VALUES (:sid, :enum, :title, :adate, :rating, :imdb_id)
                            ON DUPLICATE KEY UPDATE
                                title = :title, air_date = :adate, imdb_rating = :rating
                        """),
                        {"sid": season_id, "enum": ep["ep_num"], "title": ep["title"],
                         "adate": ep["air_date"], "rating": ep["rating"], "imdb_id": ep["imdb_id"]},
                    )
                except Exception:
                    pass
            session.commit()
        except Exception:
            pass

    # Update latest_air_date on the show
    try:
        session.execute(
            text("""
                UPDATE shows SET latest_air_date = (
                    SELECT MAX(e.air_date) FROM episodes e
                    JOIN seasons se ON se.season_id = e.season_id
                    WHERE se.show_id = :sid
                ) WHERE show_id = :sid
            """),
            {"sid": show_id},
        )
        session.commit()
    except Exception:
        pass


def cleanup_unaired_episodes(session: Session) -> dict:
    """Delete episodes that haven't aired yet and seasons left empty after cleanup."""
    from datetime import date as date_type
    today = date_type.today()

    # Delete episodes with no air_date or air_date in the future
    ep_result = session.execute(
        text("DELETE FROM episodes WHERE air_date IS NULL OR air_date > :today"),
        {"today": today},
    )
    deleted_episodes = ep_result.rowcount

    # Delete seasons that now have zero episodes
    season_result = session.execute(
        text("""
            DELETE s FROM seasons s
            LEFT JOIN episodes e ON e.season_id = s.season_id
            WHERE e.episode_id IS NULL
        """),
    )
    deleted_seasons = season_result.rowcount

    # Update episode_count on remaining seasons
    session.execute(
        text("""
            UPDATE seasons s
            SET s.episode_count = (SELECT COUNT(*) FROM episodes e WHERE e.season_id = s.season_id)
        """),
    )

    session.commit()
    return {
        "detail": f"Removed {deleted_episodes} unaired episodes and {deleted_seasons} empty seasons.",
        "deleted_episodes": deleted_episodes,
        "deleted_seasons": deleted_seasons,
    }


# ── Sync State ────────────────────────────────────────────────────────────────

_sync_state: dict = {
    "status": "idle", "current": 0, "total": 0, "message": "", "progress_percentage": 0.0,
}
_sync_lock = asyncio.Lock()


def get_sync_status() -> SyncStatusResponse:
    return SyncStatusResponse(**_sync_state)


async def run_full_sync(session: Session, client: httpx.AsyncClient, missing_only: bool = False, force: bool = False) -> None:
    async with _sync_lock:
        if _sync_state["status"] == "running":
            return
        _sync_state.update({"status": "running", "current": 0, "total": 0, "message": "Initializing..."})

    try:
        if missing_only:
            sql = text(
                "SELECT show_id, imdb_id, title, release_year, duration_minutes, plot, imdb_rating, poster_url, trailer_url "
                "FROM shows "
                "WHERE title IS NULL OR imdb_rating IS NULL OR poster_url IS NULL OR trailer_url IS NULL"
            )
        else:
            if force:
                sql = text("SELECT show_id, imdb_id, title, release_year, duration_minutes, plot, imdb_rating, poster_url, trailer_url FROM shows")
            else:
                sql = text(
                    "SELECT show_id, imdb_id, title, release_year, duration_minutes, plot, imdb_rating, poster_url, trailer_url "
                    "FROM shows WHERE sync_status != 1"
                )
        result = session.execute(sql)
        shows = [dict(r) for r in result.mappings().all()]
        total = len(shows)
        _sync_state.update({"total": total, "message": f"Found {total} shows to sync."})

        for index, show in enumerate(shows):
            _sync_state["current"] = index + 1
            _sync_state["message"] = f"Syncing: {show.get('title', show['imdb_id'])}"
            _sync_state["progress_percentage"] = round((index + 1) / total * 100, 1) if total else 0
            try:
                data = await fetch_omdb_movie(show["imdb_id"], client)
                _apply_omdb_data(show, data, session)
                # Try high-res poster first; save as proxy path to avoid exposing API key
                if not show.get("poster_url"):
                    hi_res = await _fetch_omdb_poster(show["imdb_id"], client)
                    if hi_res:
                        poster_url = f"/poster/{show['imdb_id']}"
                    else:
                        p = data.get("Poster", "")
                        poster_url = p if p and p != "N/A" else None
                    if poster_url:
                        session.execute(
                            text("UPDATE shows SET poster_url = :url WHERE show_id = :sid"),
                            {"url": poster_url, "sid": show["show_id"]},
                        )
                        session.commit()
                # Fetch YouTube trailer if not already set
                if not show.get("trailer_url"):
                    video_id = await _fetch_youtube_trailer(
                        show.get("title") or data.get("Title", ""),
                        show.get("release_year"),
                        client,
                    )
                    if video_id:
                        session.execute(
                            text("UPDATE shows SET trailer_url = :vid WHERE show_id = :sid"),
                            {"vid": video_id, "sid": show["show_id"]},
                        )
                        session.commit()
                # Sync seasons/episodes for TV series
                if data.get("Type", "").lower() == "series":
                    ts_str = data.get("totalSeasons", "0")
                    try:
                        total_seasons = int(ts_str)
                    except (ValueError, TypeError):
                        total_seasons = 0
                    if total_seasons > 0:
                        await _sync_tv_seasons(show["show_id"], show["imdb_id"], total_seasons, client, session)
                # Mark show as synced
                session.execute(
                    text("UPDATE shows SET sync_status = 1 WHERE show_id = :sid"),
                    {"sid": show["show_id"]},
                )
                session.commit()
            except Exception:
                session.rollback()  # don't let one bad show poison the session

        _sync_state.update({"status": "complete", "message": "Sync completed successfully!"})

    except Exception as exc:
        _sync_state.update({"status": "error", "message": "Sync encountered an unexpected error. Some shows may not have been updated."})


def _apply_omdb_data(show: dict, api_data: dict, session: Session) -> None:
    show_id = show["show_id"]
    updates: list[tuple] = []

    raw_runtime = api_data.get("Runtime", "")
    if raw_runtime and raw_runtime != "N/A":
        try:
            minutes = int(raw_runtime.split()[0])
            if minutes != show.get("duration_minutes"):
                updates.append(("duration_minutes", minutes))
        except ValueError:
            pass

    raw_votes = api_data.get("imdbVotes", "")
    if raw_votes and raw_votes != "N/A":
        try:
            votes = int(raw_votes.replace(",", ""))
            if votes != show.get("imdb_votes"):
                updates.append(("imdb_votes", votes))
        except ValueError:
            pass

    for api_key, db_col in [("Title", "title"), ("Plot", "plot"), ("imdbRating", "imdb_rating")]:
        val = api_data.get(api_key)
        if val and val != "N/A" and str(val) != str(show.get(db_col)):
            updates.append((db_col, val))

    # Year can be "2011" or "2011–2019" for series — always use the start year
    raw_year = api_data.get("Year", "")
    if raw_year and raw_year != "N/A":
        try:
            start_year = int(str(raw_year).split("–")[0].split("-")[0].strip())
            if start_year != show.get("release_year"):
                updates.append(("release_year", start_year))
        except (ValueError, IndexError):
            pass

    # show_type: 'movie' or 'series'
    show_type = api_data.get("Type", "movie").lower()
    if show_type not in ("movie", "series"):
        show_type = "movie"
    updates.append(("show_type", show_type))

    # total_seasons for series
    if show_type == "series":
        ts_str = api_data.get("totalSeasons", "")
        if ts_str and ts_str != "N/A":
            try:
                updates.append(("total_seasons", int(ts_str)))
            except ValueError:
                pass

    for col, val in updates:
        session.execute(text(f"UPDATE shows SET {col} = :val WHERE show_id = :sid"), {"val": val, "sid": show_id})

    # Genres — use INSERT IGNORE instead of stored proc
    genre_str = api_data.get("Genre", "")
    if genre_str and genre_str != "N/A":
        for genre in [g.strip() for g in genre_str.split(",") if g.strip()]:
            session.execute(text("INSERT IGNORE INTO genres (name) VALUES (:name)"), {"name": genre})
            row = session.execute(text("SELECT genre_id FROM genres WHERE name = :name"), {"name": genre}).fetchone()
            gid = row[0]
            session.execute(text("INSERT IGNORE INTO show_genres (show_id, genre_id) VALUES (:sid, :gid)"), {"sid": show_id, "gid": gid})

    # Actors
    actor_str = api_data.get("Actors", "")
    if actor_str and actor_str != "N/A":
        for actor in [a.strip() for a in actor_str.split(",") if a.strip()]:
            session.execute(text("INSERT IGNORE INTO actors (full_name) VALUES (:name)"), {"name": actor})
            row = session.execute(text("SELECT actor_id FROM actors WHERE full_name = :name"), {"name": actor}).fetchone()
            aid = row[0]
            session.execute(text("INSERT IGNORE INTO show_actors (show_id, actor_id) VALUES (:sid, :aid)"), {"sid": show_id, "aid": aid})

    # Directors
    director_str = api_data.get("Director", "")
    if director_str and director_str != "N/A":
        for director in [d.strip() for d in director_str.split(",") if d.strip()]:
            session.execute(text("INSERT IGNORE INTO directors (full_name) VALUES (:name)"), {"name": director})
            row = session.execute(text("SELECT director_id FROM directors WHERE full_name = :name"), {"name": director}).fetchone()
            did = row[0]
            session.execute(text("INSERT IGNORE INTO show_directors (show_id, director_id) VALUES (:sid, :did)"), {"sid": show_id, "did": did})

    session.commit()


# ── CSV Upload ────────────────────────────────────────────────────────────────

def delete_show(show_id: int, session: Session) -> None:
    """Delete a show and all related data (episodes, seasons, junction tables)."""
    # 1. Get season IDs for this show
    season_rows = session.execute(
        text("SELECT season_id FROM seasons WHERE show_id = :sid"), {"sid": show_id}
    ).fetchall()
    season_ids = [r[0] for r in season_rows]

    # 2. Delete episodes (FK → seasons)
    if season_ids:
        placeholders = ",".join(str(sid) for sid in season_ids)
        session.execute(text(f"DELETE FROM episodes WHERE season_id IN ({placeholders})"))

    # 3. Delete seasons
    session.execute(text("DELETE FROM seasons WHERE show_id = :sid"), {"sid": show_id})

    # 4. Delete junction table rows
    # Query existing tables once so we skip any that haven't been created yet
    existing = {
        r[0] for r in session.execute(text("SHOW TABLES")).fetchall()
    }
    for tbl in ("show_genres", "show_directors", "show_actors", "show_tags",
                "watchlist_items", "user_ratings", "watch_history"):
        if tbl in existing:
            session.execute(text(f"DELETE FROM {tbl} WHERE show_id = :sid"), {"sid": show_id})

    # 5. Delete the show itself
    result = session.execute(text("DELETE FROM shows WHERE show_id = :sid"), {"sid": show_id})
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Show not found.")
    session.commit()


def add_single_show(imdb_id: str, session: Session) -> dict:
    """Add a single show by IMDb ID using the same stored procedure as CSV upload."""
    try:
        session.execute(
            text("CALL sp_insert_show_if_not_exists(:imdb_id, @was_inserted)"),
            {"imdb_id": imdb_id},
        )
        was_inserted = session.execute(text("SELECT @was_inserted")).fetchone()[0]
        session.commit()
        if was_inserted == 1:
            return {"detail": f"Show {imdb_id} added successfully.", "inserted": True}
        return {"detail": f"Show {imdb_id} already exists.", "inserted": False}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to add show: {e}")


def change_password(user_id: int, current_password: str, new_password: str, session: Session) -> None:
    row = session.execute(
        text("SELECT password_hash FROM users WHERE user_id = :uid"),
        {"uid": user_id},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found.")
    if not _verify_password(current_password, row[0]):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    new_hash = _hash_password(new_password)
    session.execute(
        text("UPDATE users SET password_hash = :h WHERE user_id = :uid"),
        {"h": new_hash, "uid": user_id},
    )
    session.commit()


def process_csv_upload(file_bytes: bytes, session: Session) -> dict:
    import csv
    from io import StringIO

    inserted = 0
    skipped = 0
    errors: list[str] = []

    try:
        content = file_bytes.decode("utf-8-sig")
        reader = csv.reader(StringIO(content))
        for row in reader:
            if not row:
                continue
            imdb_id = row[0].strip()
            if not imdb_id.startswith("tt"):
                errors.append(f"Skipped invalid imdb_id: '{imdb_id}'")
                continue
            try:
                session.execute(
                    text("CALL sp_insert_show_if_not_exists(:imdb_id, @was_inserted)"),
                    {"imdb_id": imdb_id},
                )
                was_inserted = session.execute(text("SELECT @was_inserted")).fetchone()[0]
                session.commit()
                if was_inserted == 1:
                    inserted += 1
                else:
                    skipped += 1
            except Exception as e:
                session.rollback()
                errors.append(f"Error for '{imdb_id}': {e}")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Failed to parse CSV file. Please check the format and try again.")

    return {"inserted": inserted, "skipped": skipped, "errors": errors}
