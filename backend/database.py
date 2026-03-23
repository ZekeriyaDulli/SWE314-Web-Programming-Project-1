from sqlmodel import create_engine, Session
from config import settings

if settings.database_url:
    # Railway / production: convert mysql:// → mysql+pymysql://
    _url = settings.database_url
    if _url.startswith("mysql://"):
        _url = "mysql+pymysql://" + _url[len("mysql://"):]
    DATABASE_URL = _url
else:
    DATABASE_URL = (
        f"mysql+pymysql://{settings.db_user}:{settings.db_password}"
        f"@{settings.db_host}:{settings.db_port}/{settings.db_name}"
    )

engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)


def get_session():
    with Session(engine) as session:
        yield session
