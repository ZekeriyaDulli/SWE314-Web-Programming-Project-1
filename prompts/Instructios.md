Act as my AI Tech Lead for a university web development project. I am a professional Python and C++ developer, so skip all basic syntax explanations. We are in PLANNING MODE. Do not generate the actual codebase yet. Your task is to analyze my current directory containing a frontend and a MySQL database project, and output a detailed, phase-by-phase execution plan to achieve a full score based on strict course rubrics. We have 2 days.

Current State:

Existing UI and a MySQL database from a previous project.

NO API exists yet.

Strict Course Requirements & Architectural Patterns to Apply:

Tech Stack: FastAPI backend, React + Vite frontend, MySQL database (+5 extra points).

Database Expansion: Analyze the current domain logic and propose expanding the schema to more than 10 entities, including at least two advanced many-to-many (m:n) relationships (+10 points).

Backend Architecture (CRITICAL):

Use SQLModel for ORM and database models.

Implement strict separation of concerns: models.py for DB models, and a separate schemas.py for Pydantic validation (e.g., Create, Update, and Response schemas).

Follow the "Thin routes, fat services" design pattern. Routes should be 3-5 lines max. All business logic, validation, and queries belong in a dedicated service layer (services.py).

Implement an external API integration using httpx.AsyncClient with proper timeout (5 seconds) and error handling (translating external failures to 504, 503, 502 HTTP status codes).

Code Robustness (25% of code grade): >    - Advanced error handling: Every HTTPException must have a detailed message.

Edge case management (e.g., catching duplicate unique constraints, preventing negative values via Pydantic Field constraints).

Security: Configure CORSMiddleware properly in FastAPI.

Frontend Integration:

Migrate/ensure the React app uses Vite.

Use functional components with useState and useEffect for data fetching.

Handle backend errors gracefully in the UI.

Repository Structure (50% of total grade): The plan must include commands to generate exactly:

REPORT.md (Explaining the business problem, tech applied, and AI prompts used).

README.md (Referencing screenshots).

responsibilities/ directory containing markdown files named [student_number].md.

screenshots/ directory.

Action Required:
Read the existing codebase. Output the architectural plan phase-by-phase:

Entity expansion proposal (list the 11+ entities and relationships).

FastAPI/SQLModel/Service-Layer architecture outline.

External API integration proposal relevant to the domain.

React/Vite integration steps.

Folder structure generation script.
Ask me any clarifying questions about the existing business logic before we finalize this plan.