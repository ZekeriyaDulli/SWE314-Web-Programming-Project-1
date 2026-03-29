from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, String, UniqueConstraint


class User(SQLModel, table=True):
    __tablename__ = "users"
    user_id: Optional[int] = Field(default=None, primary_key=True)
    first_name: str = Field(max_length=50)
    last_name: str = Field(max_length=50)
    email: str = Field(sa_column=Column(String(50), unique=True, nullable=False))
    password_hash: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Show(SQLModel, table=True):
    __tablename__ = "shows"
    show_id: Optional[int] = Field(default=None, primary_key=True)
    imdb_id: str = Field(sa_column=Column(String(20), unique=True, nullable=False))
    show_type: str = Field(default="movie", max_length=10)
    title: Optional[str] = Field(default=None, max_length=200)
    release_year: Optional[int] = Field(default=1900)
    duration_minutes: Optional[int] = Field(default=0)
    total_seasons: Optional[int] = Field(default=None)
    imdb_rating: Optional[Decimal] = Field(default=Decimal("0.0"))
    imdb_votes: Optional[int] = Field(default=None)
    plot: Optional[str] = None
    poster_url: Optional[str] = Field(default=None, max_length=500)
    added_at: Optional[datetime] = None


class Genre(SQLModel, table=True):
    __tablename__ = "genres"
    genre_id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(sa_column=Column(String(50), unique=True, nullable=False))


class ShowGenre(SQLModel, table=True):
    __tablename__ = "show_genres"
    show_id: int = Field(foreign_key="shows.show_id", primary_key=True)
    genre_id: int = Field(foreign_key="genres.genre_id", primary_key=True)


class Director(SQLModel, table=True):
    __tablename__ = "directors"
    director_id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str = Field(max_length=100)


class ShowDirector(SQLModel, table=True):
    __tablename__ = "show_directors"
    show_id: int = Field(foreign_key="shows.show_id", primary_key=True)
    director_id: int = Field(foreign_key="directors.director_id", primary_key=True)


class Actor(SQLModel, table=True):
    __tablename__ = "actors"
    actor_id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str = Field(max_length=100)


class ShowActor(SQLModel, table=True):
    __tablename__ = "show_actors"
    show_id: int = Field(foreign_key="shows.show_id", primary_key=True)
    actor_id: int = Field(foreign_key="actors.actor_id", primary_key=True)


class Watchlist(SQLModel, table=True):
    __tablename__ = "watchlists"
    watchlist_id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.user_id")
    name: str = Field(max_length=100)
    description: Optional[str] = None
    created_at: date = Field(default_factory=date.today)


class WatchlistItem(SQLModel, table=True):
    __tablename__ = "watchlist_items"
    watchlist_id: int = Field(foreign_key="watchlists.watchlist_id", primary_key=True)
    show_id: int = Field(foreign_key="shows.show_id", primary_key=True)
    added_at: datetime = Field(default_factory=datetime.utcnow)


class UserRating(SQLModel, table=True):
    __tablename__ = "user_ratings"
    __table_args__ = (UniqueConstraint("user_id", "show_id", name="uq_user_show_rating"),)
    rating_id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.user_id")
    show_id: int = Field(foreign_key="shows.show_id")
    rating: int = Field(ge=1, le=10)
    review_text: Optional[str] = None
    rated_at: datetime = Field(default_factory=datetime.utcnow)


class WatchHistory(SQLModel, table=True):
    __tablename__ = "watch_history"
    history_id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.user_id")
    show_id: int = Field(foreign_key="shows.show_id")
    watched_at: datetime = Field(default_factory=datetime.utcnow)


# ── TV SHOW ENTITIES ─────────────────────────────────────────────────────────

class Season(SQLModel, table=True):
    __tablename__ = "seasons"
    __table_args__ = (UniqueConstraint("show_id", "season_number", name="uq_show_season"),)
    season_id: Optional[int] = Field(default=None, primary_key=True)
    show_id: int = Field(foreign_key="shows.show_id")
    season_number: int
    episode_count: int = Field(default=0)


class Episode(SQLModel, table=True):
    __tablename__ = "episodes"
    __table_args__ = (UniqueConstraint("season_id", "episode_number", name="uq_season_episode"),)
    episode_id: Optional[int] = Field(default=None, primary_key=True)
    season_id: int = Field(foreign_key="seasons.season_id")
    episode_number: int
    title: str = Field(default="TBA", max_length=500)
    air_date: Optional[date] = None
    imdb_rating: Optional[Decimal] = None
    imdb_id: Optional[str] = Field(default=None, max_length=20)


# ── NEW ENTITIES ─────────────────────────────────────────────────────────────

class Tag(SQLModel, table=True):
    __tablename__ = "tags"
    tag_id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(sa_column=Column(String(50), unique=True, nullable=False))


class ShowTag(SQLModel, table=True):
    """Advanced M:N — show × tag × user (who applied it), with timestamp payload."""
    __tablename__ = "show_tags"
    show_id: int = Field(foreign_key="shows.show_id", primary_key=True)
    tag_id: int = Field(foreign_key="tags.tag_id", primary_key=True)
    tagged_by_user_id: int = Field(foreign_key="users.user_id", primary_key=True)
    tagged_at: datetime = Field(default_factory=datetime.utcnow)


class Collection(SQLModel, table=True):
    __tablename__ = "collections"
    collection_id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    description: Optional[str] = None
    created_by_user_id: int = Field(foreign_key="users.user_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CollectionShow(SQLModel, table=True):
    """Advanced M:N — collection × show with ordinal payload (display_order)."""
    __tablename__ = "collection_shows"
    collection_id: int = Field(foreign_key="collections.collection_id", primary_key=True)
    show_id: int = Field(foreign_key="shows.show_id", primary_key=True)
    display_order: int = Field(default=0, ge=0)
    added_at: datetime = Field(default_factory=datetime.utcnow)
