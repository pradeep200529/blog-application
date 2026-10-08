# Fieldnotes Blog

A small full-stack blog application. The frontend is plain HTML, CSS, and JavaScript; the REST API uses Node.js, Express, and SQLite.

## Requirements

- Node.js 22.13 or newer
- Python 3 (for the local static frontend server)

## Run locally

Open two terminals in the repository folder.

In the first terminal, set up and start the API:

```powershell
Set-Location backend
Copy-Item .env.example .env
```

Generate a secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` and put its output in `backend/.env` as the value of `JWT_SECRET`. Keep that value private. Leave `CLIENT_ORIGIN=http://localhost:5173` in the file, then run:

```powershell
npm install
npm run dev
```

In the second terminal, from the repository folder, serve the frontend:

```powershell
python -m http.server 5173
```

Open `http://localhost:5173`. Keep both terminals running while using the app. SQLite creates `backend/data/blog.sqlite` automatically.

## Features

- Register and log in with an email and password
- Browse public blog posts
- Create posts while authenticated
- Password hashing, expiring JWTs, request validation, and CORS configuration

## API

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/health` | Public |
| `POST` | `/api/auth/register` | Public |
| `POST` | `/api/auth/login` | Public |
| `GET` | `/api/blogs` | Public |
| `GET` | `/api/blogs/:id` | Public |
| `POST` | `/api/blogs` | Bearer token required |

## Tests

From the `backend` folder, run:

```powershell
npm test
```