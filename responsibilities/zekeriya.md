# Responsibilities — [Your Student Number]

## Role: Backend Developer

### Contributions

- Designed and implemented the FastAPI backend architecture
- Wrote `models.py` — all 16 SQLModel table classes mapping to the MySQL schema
- Wrote `schemas.py` — all Pydantic Create/Update/Response schemas with field constraints
- Wrote `services.py` — fat service layer with all business logic, stored procedure calls, and error handling
- Wrote all 8 router files under `routers/` (thin route handlers, 3–5 lines each)
- Implemented JWT authentication (`dependencies.py`) with `get_current_user` and `require_admin` dependencies
- Configured CORSMiddleware in `main.py` with proper origins for the Vite dev server
- Implemented OMDb external API integration via `httpx.AsyncClient` with 5-second timeout and 504/503/502 error handling
- Implemented admin sync background task with `asyncio.Lock`-protected state
- Implemented CSV upload processing with per-row error reporting
- Designed and wrote SQL schema additions (`db/4- Schema_Additions.sql`) for the 4 new entities

### Key Technical Decisions

- **SQLModel over pure SQLAlchemy**: Single class definition serves as both ORM and Pydantic base
- **Stored procedure preservation**: All 27 original procedures are called via `sqlalchemy.text()` — no logic duplication
- **JWT over sessions**: Stateless auth suits the React SPA architecture; tokens expire after 24 hours
- **PyMySQL driver**: Pure-Python, no native library dependencies, fully compatible with SQLAlchemy 2.x
