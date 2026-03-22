# Responsibilities — [Mohammed Hamad's Student Number]

## Role: Frontend & API Integration Developer

### Contributions

- Implemented `WatchlistsPage.jsx` — list, create, and delete watchlists with inline form and confirmation modal
- Implemented `WatchlistDetailPage.jsx` — view and remove shows from a watchlist
- Implemented `HistoryPage.jsx` — watch history timeline with per-movie rating display and stats summary
- Implemented `AdminUploadPage.jsx` — CSV file upload with per-row error reporting
- Implemented `AdminSyncPage.jsx` — OMDb sync trigger with live progress bar polling (`setInterval` + `useRef` cleanup)
- Wrote `LoginPage.jsx` and `RegisterPage.jsx` with client-side validation and auto-login on register
- Ported the dark cinematic CSS theme from the original Jinja2 app into React inline styles and Bootstrap classes

### Key Technical Decisions

- Admin pages guard against non-admin access by checking `isAdmin` from `AuthContext` and redirecting immediately
- `AdminSyncPage` uses `useRef` to hold the polling interval ID, ensuring proper cleanup on component unmount (no memory leaks)
- Delete/remove confirmations use React state modals instead of Bootstrap JS — avoids direct DOM manipulation in a React context
- All `useEffect` data fetches include `.catch()` handlers that set error state displayed by `ErrorBanner`
