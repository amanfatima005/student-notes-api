# Student Notes Management REST API

Version 3 of the Student Notes Manager — a MongoDB-backed REST API built
with **Express.js** and **Mongoose**.

Evolution so far:
- **Version 1** — Node.js CLI (`readline` + `fs`)
- **Version 2** — Express REST API, data in a local `notes.json` file
- **Version 3 (this version)** — Express REST API, data in **MongoDB** via Mongoose

## Project Overview

This API lets you manage student study notes over HTTP: create, read,
update, delete, search, and view statistics. All data now lives in a real
MongoDB database instead of a flat JSON file, giving proper querying,
schema validation, and an `_id` per note. It's built with a modular
architecture (routes / controllers / middleware / models / config / utils)
and is meant to be tested with **Postman**.

## Technologies

- Node.js
- Express.js
- MongoDB
- Mongoose
- Postman
- Git/GitHub

## Features

- Home route to confirm the API is running
- Full CRUD for notes (Create, Read, Update, Delete), backed by MongoDB
- Search notes by title, subject, or tag — performed as a real MongoDB query
- Statistics endpoint (total notes, unique subjects, latest note, most used
  tag — most-used tag calculated with a MongoDB aggregation pipeline)
- Request logging middleware (method, path, timestamp on every request)
- Two-layer validation: request-level middleware **and** Mongoose schema
  validation
- Centralized error handling (invalid MongoDB IDs, validation errors,
  duplicate titles, database connection failures) — all return consistent JSON
- A small browser UI (served at `/app`) wired up to this API

## Folder Structure

```
student-notes-api/
│── package.json
│── server.js
│── README.md
│── .gitignore
│── .env            (not committed — your local MongoDB URI)
│── .env.example    (safe template, committed)
│
├── config/
│      db.js
│
├── models/
│      Note.js
│
├── routes/
│      notesRoutes.js
│
├── controllers/
│      notesController.js
│
├── middleware/
│      logger.js
│      validateNote.js
│      errorHandler.js
│
├── utils/
│      helpers.js
│
├── public/           (browser UI, served at /app)
│
└── screenshots/
```

## Installation

```bash
git clone <your-repo-url>
cd student-notes-api
npm install
```

### Configure your database (local MongoDB)

1. Install MongoDB Community Server: https://www.mongodb.com/try/download/community
   - During setup, choose to install it as a **Windows Service** (it will then
     start automatically in the background — you don't need to launch it manually).
2. Confirm it's running:
   ```powershell
   mongosh
   ```
   If this opens a `test>` prompt, MongoDB is running locally. Type `exit` to leave.
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. `.env` already points at your local database — no changes needed:
   ```
   MONGO_URI=mongodb://127.0.0.1:27017/student_notes_db
   PORT=5000
   ```
   You don't need to create `student_notes_db` manually — MongoDB creates it
   automatically the first time a note is saved.

`.env` is git-ignored — **never commit real credentials**, even for a local
setup (helps you avoid mistakes later when you switch to MongoDB Atlas).

## How to Run

```bash
npm start
```

The server loads environment variables, connects to MongoDB, and **only
starts listening once the connection succeeds**. If the connection fails,
you'll see a clear error message instead of the app silently accepting
requests it can't actually serve.

The API runs at **http://localhost:5000** by default. The browser UI is at
**http://localhost:5000/app**.

## API Documentation

| Method | Endpoint                            | Purpose                          |
|--------|---------------------------------------|-----------------------------------|
| GET    | `/`                                    | Health check / home route         |
| GET    | `/api/notes`                           | Get all notes                     |
| GET    | `/api/notes/:id`                       | Get one note by MongoDB `_id`     |
| POST   | `/api/notes`                           | Create a note                     |
| PUT    | `/api/notes/:id`                       | Update a note                     |
| DELETE | `/api/notes/:id`                       | Delete a note                     |
| GET    | `/api/notes/search?title=node`         | Search notes by title             |
| GET    | `/api/notes/search?subject=backend`    | Search notes by subject           |
| GET    | `/api/notes/search?tag=react`          | Search notes by tag               |
| GET    | `/api/notes/stats`                     | Get statistics                    |

### Add / Update Note — request body

```json
{
  "title": "React Hooks",
  "subject": "Web Development",
  "description": "Understanding useState and useEffect",
  "tags": ["react", "hooks"]
}
```

### Validation errors

```json
{ "error": "Title already exists" }
```

Other errors returned the same way: `"Title is required."`,
`"Subject is required."`, `"Description is required."`,
`"Description is too long (max 500 characters)."`,
`"Invalid note ID."` (bad MongoDB ObjectId), `"Note not found."`

### Statistics response shape

```json
{
  "totalNotes": 12,
  "subjects": 4,
  "latestNote": "MongoDB Basics",
  "mostUsedTag": "react"
}
```

## Screenshots

Postman screenshots covering CRUD, search, statistics, and error cases
(invalid ID, missing required field, non-existent note) are in the
`screenshots/` folder.

## Future Improvements

- Add authentication (JWT) so notes are scoped per student
- Add pagination on `GET /api/notes`
- Add automated tests (Jest + Supertest)
- Rate limiting with a library like `express-rate-limit`
- Connect a full React frontend instead of the small static UI

