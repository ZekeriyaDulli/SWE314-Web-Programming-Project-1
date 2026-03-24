# Responsibilities — [Kutay's Student Number]

## Role: Frontend & API Integration Developer

### Contributions

- Set up the React + Vite project scaffold with Bootstrap 5
- Configured `vite.config.js` proxy to route `/api/*` requests to the FastAPI backend
- Built `src/api/client.js` — Axios instance with JWT request interceptor and 401 response interceptor
- Built `AuthContext.jsx` — global authentication state with `login()`, `logout()`, `isAdmin` helpers
- Implemented `HomePage.jsx` with dynamic filter bar (genre, year range, rating, search) and movie grid
- Implemented `ShowDetailPage.jsx` with rating form, watchlist selector, and mark-as-watched functionality
- Built reusable components: `Navbar.jsx`, `MovieCard.jsx`, `ErrorBanner.jsx`
- Wired all routes in `App.jsx` with React Router v6

### Key Technical Decisions

- Vite dev proxy eliminates CORS issues during development — the browser always talks to `localhost:5173`
- JWT stored in `localStorage` (not `sessionStorage`) so the session persists across browser tabs and refreshes
- `get_optional_user` dependency allows unauthenticated users to browse shows while still displaying personalized data (is_watched, watchlists) when logged in
