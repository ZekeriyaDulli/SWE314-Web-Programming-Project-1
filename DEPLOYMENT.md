# Deployment Guide

Free-tier stack: **Railway** (MySQL + FastAPI backend) · **Vercel** (React frontend)

---

## 1 — Deploy MySQL on Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy MySQL**.
2. Once provisioned, open the MySQL service → **Variables** tab → copy `DATABASE_URL`.
3. Open the **Query** tab (or connect with an external client using the provided credentials).
4. Run the SQL setup files **in order**:
   - `db/1- Schema.sql` — **skip the first 3 lines** (`CREATE DATABASE`, `USE`, etc.) — Railway already created the DB.
   - `db/2- Stored_Procedures.sql`
   - `db/3- Data.sql`
   - `db/4- Schema_Additions.sql`

---

## 2 — Deploy FastAPI Backend on Railway

1. In the same Railway project → **New Service** → **GitHub Repo** → select this repo.
2. Set **Root Directory** to `backend`.
3. Railway auto-detects `railway.toml` and uses nixpacks.
4. Add the following **Environment Variables** in the service settings:

| Variable | Value |
|---|---|
| `DATABASE_URL` | (paste from MySQL service, step 1) |
| `SECRET_KEY` | any long random string |
| `OMDB_API_KEY` | `c9d9cd73` |
| `ADMIN_USER_ID` | `8` |
| `FRONTEND_URL` | your Vercel URL (add after step 3, e.g. `https://movie-archive.vercel.app`) |

5. Deploy. After a successful deploy, copy the **public domain** Railway assigned (e.g. `https://movie-archive-api.up.railway.app`).

---

## 3 — Deploy React Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import this GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Add **Environment Variable**:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://<your-railway-backend-domain>` (no trailing slash) |

4. Deploy. Copy the Vercel URL (e.g. `https://movie-archive.vercel.app`).
5. Go back to Railway backend service → update `FRONTEND_URL` to the Vercel URL → redeploy.

---

## Notes

- The backend `railway.toml` start command uses `$PORT` — Railway injects this automatically.
- `vercel.json` rewrites all routes to `/index.html` so React Router page refreshes work.
- In development, `VITE_API_URL` is not set so `client.js` falls back to `/api` (Vite proxy).
- Railway free tier includes 500 hours/month and 1 GB MySQL storage.
