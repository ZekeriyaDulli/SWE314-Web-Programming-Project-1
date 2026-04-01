from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict, model_validator


# ── AUTH ─────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    first_name: str = Field(min_length=2, max_length=50)
    last_name: str = Field(min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    confirm_password: str

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ChangePassword(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=6, max_length=128)
    confirm_new_password: str

    @model_validator(mode="after")
    def passwords_match(self):
        if self.new_password != self.confirm_new_password:
            raise ValueError("New passwords do not match.")
        return self


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: int
    first_name: str
    last_name: str
    email: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── SHOWS ─────────────────────────────────────────────────────────────────────

class ShowCreate(BaseModel):
    imdb_id: str = Field(min_length=3, max_length=20, pattern=r"^tt\d+$")


class ShowUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)
    release_year: Optional[int] = Field(default=None, ge=1888, le=2030)
    duration_minutes: Optional[int] = Field(default=None, ge=0)
    imdb_rating: Optional[Decimal] = Field(default=None, ge=Decimal("0.0"), le=Decimal("10.0"))
    plot: Optional[str] = None
    poster_url: Optional[str] = Field(default=None, max_length=500)


class ShowResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    show_id: int
    imdb_id: str
    show_type: str = "movie"
    title: Optional[str] = None
    release_year: Optional[int] = None
    duration_minutes: Optional[int] = None
    total_seasons: Optional[int] = None
    imdb_rating: Optional[Decimal] = None
    imdb_votes: Optional[int] = None
    plot: Optional[str] = None
    poster_url: Optional[str] = None
    trailer_url: Optional[str] = None
    added_at: Optional[datetime] = None
    platform_avg: Optional[float] = None
    rating_count: Optional[int] = None
    is_watched: bool = False


class GenreResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    genre_id: int
    name: str


class DirectorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    director_id: int
    full_name: str


class ActorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    actor_id: int
    full_name: str


class EpisodeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    episode_id: int
    episode_number: int
    title: str
    air_date: Optional[date] = None
    imdb_rating: Optional[Decimal] = None
    imdb_id: Optional[str] = None


class SeasonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    season_id: int
    season_number: int
    episode_count: int
    episodes: list[EpisodeResponse] = []


class ShowDetailResponse(ShowResponse):
    genres: list[GenreResponse] = []
    directors: list[DirectorResponse] = []
    actors: list[ActorResponse] = []
    tags: list["TagResponse"] = []
    ratings: list["RatingResponse"] = []
    seasons: list[SeasonResponse] = []
    is_watched: bool = False


# ── WATCHLISTS ───────────────────────────────────────────────────────────────

class WatchlistCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)


class WatchlistUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = None


class WatchlistResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    watchlist_id: int
    user_id: int
    name: str
    description: Optional[str] = None
    created_at: date
    items_count: int = 0


class WatchlistItemCreate(BaseModel):
    show_id: int = Field(gt=0)


class WatchlistWithShowsResponse(WatchlistResponse):
    shows: list[ShowResponse] = []


# ── RATINGS ──────────────────────────────────────────────────────────────────

class RatingCreate(BaseModel):
    show_id: int = Field(gt=0)
    rating: int = Field(ge=1, le=10)
    review_text: Optional[str] = Field(default=None, max_length=2000)


class RatingUpdate(BaseModel):
    rating: Optional[int] = Field(default=None, ge=1, le=10)
    review_text: Optional[str] = None


class RatingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    rating_id: int
    user_id: int
    show_id: int
    rating: int
    review_text: Optional[str] = None
    rated_at: datetime
    first_name: Optional[str] = None
    last_name: Optional[str] = None


# ── WATCH HISTORY ─────────────────────────────────────────────────────────────

class HistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    show_id: int
    imdb_id: Optional[str] = None
    watched_at: datetime
    title: Optional[str] = None
    release_year: Optional[int] = None
    poster_url: Optional[str] = None
    imdb_rating: Optional[Decimal] = None
    user_rating: Optional[int] = None
    review_text: Optional[str] = None


# ── TAGS ─────────────────────────────────────────────────────────────────────

class TagCreate(BaseModel):
    name: str = Field(min_length=2, max_length=50)


class TagResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    tag_id: int
    name: str


class ShowTagCreate(BaseModel):
    tag_id: int = Field(gt=0)


# ── COLLECTIONS ──────────────────────────────────────────────────────────────

class CollectionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=1000)


class CollectionUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = None


class CollectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    collection_id: int
    name: str
    description: Optional[str] = None
    created_by_user_id: int
    created_at: datetime
    shows_count: int = 0


class CollectionShowAdd(BaseModel):
    show_id: int = Field(gt=0)
    display_order: int = Field(default=0, ge=0)


# ── ADMIN / EXTERNAL ─────────────────────────────────────────────────────────

class SyncStatusResponse(BaseModel):
    status: str  # idle | running | complete | error
    current: int
    total: int
    message: str
    progress_percentage: float


class FilterParams(BaseModel):
    genre_id: Optional[int] = None
    min_year: Optional[int] = Field(default=None, ge=1888, le=2030)
    max_year: Optional[int] = Field(default=None, ge=1888, le=2030)
    min_rating: Optional[Decimal] = Field(default=None, ge=Decimal("0.0"), le=Decimal("10.0"))
    search: Optional[str] = Field(default=None, max_length=200)
    show_type: Optional[str] = Field(default=None, pattern=r"^(movie|series)$")

    @model_validator(mode="after")
    def check_year_range(self):
        if self.min_year and self.max_year and self.min_year > self.max_year:
            self.min_year, self.max_year = self.max_year, self.min_year
        return self
