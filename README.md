# Student Quiz Platform

A full-stack app: students sign up, log in, take physics/math quizzes, and their
scores are recorded and viewable in a history page.

## Stack
- Backend: Node.js + Express + SQLite (via Node's built-in `node:sqlite` module — no native compilation needed), JWT auth
- Frontend: React (Vite) + React Router

**Node version requirement:** `node:sqlite` needs **Node.js 22.5 or newer**. Check with `node --version`.
If you're on an older Node, install [nvm](https://github.com/coreybutson/nvm-windows) (Windows) or update Node directly.

## Project structure
```
quiz-platform/
  backend/     # Express API + SQLite database
  frontend/    # React app
```

## 1. Run the backend

```bash
cd backend
npm install
npm start
```

This starts the API on `http://localhost:4000`. On first run it creates
`quiz.db` (SQLite file) and seeds it with 5 physics + 5 math questions.

Test it's alive:
```bash
curl http://localhost:4000/api/health
```

## 2. Run the frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

This starts the app on `http://localhost:5173`. Open that in your browser.

## 3. Try it out
1. Go to `/signup`, create a username + password
2. You'll land on the dashboard — pick Physics or Mathematics
3. Answer all questions, submit — see your score
4. Click "History" to see all past attempts

## How it works
- Passwords are hashed with bcrypt before being stored — never stored in plain text
- Login returns a JWT token, stored in the browser's localStorage, sent as
  `Authorization: Bearer <token>` on every request
- Questions are stored in SQLite (`questions` table) — the correct answer is
  never sent to the frontend until after you submit
- Scoring happens entirely server-side (comparing submitted answers to the
  stored correct answers), so it can't be tampered with client-side
- Every submission is saved to a `results` table tied to the user

## Troubleshooting
- **`Cannot find module 'node:sqlite'`** — your Node version is too old. Upgrade to 22.5+.
- **`ExperimentalWarning: SQLite is an experimental feature`** — this is just a warning, not an error. Safe to ignore.
- **Port 4000 or 5173 already in use** — stop whatever else is using it, or change the port in `backend/server.js` (`PORT`) / `frontend/vite.config.js` (`server.port`).

## Next steps to extend it
- Add an admin role that can add/edit/delete questions through the UI
  (right now questions are seeded in `backend/db.js`)
- Add more subjects/difficulty levels
- Add a timer per test
- Add pagination/filtering to the history page
- Deploy: backend to Render/Railway/Fly.io, frontend to Vercel/Netlify,
  swap SQLite for a hosted Postgres if you expect concurrent writes at scale
