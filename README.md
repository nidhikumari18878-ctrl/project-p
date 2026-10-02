# Placement Tracker

An Express + MongoDB + EJS placement management app with application tracking, opportunity discovery and AI-powered PDF resume analysis.

## Features

- JWT-based authentication with secure HTTP-only cookies
- MongoDB-backed application CRM (create, search, filter, status update, delete)
- Dashboard with real database statistics and recent applications
- Opportunity search by company, role, location, type and skill
- Optional JSearch/RapidAPI job import
- PDF resume upload with Gemini AI ATS-style analysis
- Profile editing
- Responsive dark UI with animations and reduced-motion support

## Local setup

1. Install Node.js 18+.
2. Run `npm install`.
3. Create a `.env` file from `.env.example`.
4. Add a MongoDB connection string and JWT/session secrets.
5. Add `GEMINI_API_KEY` if you want resume analysis.
6. Add `RAPIDAPI_KEY` only if you want job importing.
7. Run `npm start`.

The app uses `PORT` when supplied, otherwise `5000`.

## Environment variables

- `MONGODB_URI` — MongoDB connection string (required)
- `JWT_KEY` — JWT signing secret (required)
- `EXPRESS_SESSION_SECRET` — Express session secret
- `GEMINI_API_KEY` — Gemini API key for resume analysis
- `GEMINI_MODEL` — optional Gemini model override
- `RAPIDAPI_KEY` — optional JSearch/RapidAPI key
- `NODE_ENV` — set to `production` in production
- `PORT` — optional server port

## GitHub / deployment notes

- Do not commit `.env`, uploaded resumes, or secrets.
- Use the platform's environment-variable settings for production secrets.
- The `/health` endpoint returns a simple JSON health response.
