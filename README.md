# Student Notes Management REST API

Version 4 of the Student Notes Manager — a MongoDB-backed REST API, secured
with **JWT authentication**, so every student only ever sees their own notes.

Evolution so far:
- **Version 1** — Node.js CLI (`readline` + `fs`)
- **Version 2** — Express REST API, data in a local `notes.json` file
- **Version 3** — Express REST API, data in **MongoDB** via Mongoose
- **Version 4 (this version)** — Authentication (bcrypt + JWT) and
  per-user authorization on top of Version 3

## Project Overview

This API lets students register an account, log in, and manage their own
study notes over HTTP — create, read, update, delete, search, and view
statistics. Passwords are never stored as plain text (hashed with bcrypt),
every request to the notes endpoints requires a valid JWT, and every note
belongs to exactly one user — nobody can read, edit, or delete another
student's notes, even if they know the note's ID.

## Technologies

- Node.js
- Express.js
- MongoDB
- Mongoose
- bcryptjs (password hashing)
- jsonwebtoken (JWT auth)
- Postman
- Git/GitHub

## Features

- User registration and login with hashed passwords (bcrypt)
- JWT-based authentication — a token is issued on login and required on
  every notes request afterward
- `GET /api/auth/me` — returns the currently logged-in user (used by the
  frontend to know who's signed in)
- Every note is linked to the user who created it; all reads, updates,
  deletes, search, and statistics are automatically scoped to that user
- A user cannot access, edit, or delete another user's note by ID —
  attempting to returns the same `404` as a note that doesn't exist,
  so IDs can't be used to probe for other people's data
- Full CRUD for notes, search by title/subject/tag, and a statistics
  endpoint (all carried over from Version 3, now user-scoped)
- Request logging middleware (method, path, timestamp on every request)
- Two-layer validation: request-level middleware **and** Mongoose schema
  validation
- Centralized error handling (invalid MongoDB IDs, validation errors,
  duplicate titles/emails, auth failures, database connection failures)

## Folder Structure

```
student-notes-api/
│── package.json
│── server.js
│── README.md
│── .gitignore
│── .env            (not committed — your local MongoDB URI + JWT secret)
│── .env.example    (safe template, committed)
│
├── config/
│      db.js
│
├── models/
│      Note.js
│      User.js
│
├── routes/
│      notesRoutes.js
│      authRoutes.js
│
├── controllers/
│      notesController.js
│      authController.js
│
├── middleware/
│      logger.js
│      validateNote.js
│      errorHandler.js
│      authMiddleware.js
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

### Configure your environment

1. Make sure MongoDB is running locally (see Version 3's setup notes if
   you haven't installed it yet).
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Fill in your own `JWT_SECRET` — a long, random, unguessable string.
   Generate one with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
   ```
   MONGO_URI=mongodb://127.0.0.1:27017/student_notes_db
   PORT=5000
   JWT_SECRET=<paste your generated secret here>
   ```

`.env` is git-ignored — **never commit your database URI or JWT secret.**
Never use a weak secret like `JWT_SECRET=12345`.

## How to Run

```bash
npm start
```

The API runs at **http://localhost:5000**. The browser UI is at
**http://localhost:5000/app**.

## How Authentication Works

```
Register  ->  password hashed with bcrypt  ->  user saved in MongoDB
Login     ->  password compared with bcrypt  ->  JWT issued
Request   ->  JWT sent as "Authorization: Bearer <token>"
          ->  authMiddleware verifies it and reads the user's id
          ->  controller only touches that user's notes
```

**Why bcrypt instead of storing the password directly:** bcrypt hashing is
one-way and salted — you can check whether a password is correct
(`bcrypt.compare`) without ever being able to reverse the hash back into
the original password. If the database were ever leaked, an attacker would
get a list of hashes, not a list of real passwords.

## API Documentation

### Auth routes

| Method | Endpoint             | Auth required | Purpose                        |
|--------|------------------------|:--:|----------------------------------|
| POST   | `/api/auth/register`   | No | Create a new user account        |
| POST   | `/api/auth/login`      | No | Log in, receive a JWT            |
| GET    | `/api/auth/me`         | Yes | Get the currently logged-in user |

**Register — request body**
```json
{
  "name": "Aman",
  "email": "aman@example.com",
  "password": "password123"
}
```

**Login — request body**
```json
{
  "email": "aman@example.com",
  "password": "password123"
}
```

**Login — response**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOi...",
  "user": { "id": "64...", "name": "Aman", "email": "aman@example.com" }
}
```

For every request below, add this header with the token from login/register:
```
Authorization: Bearer <token>
```

### Notes routes (all require a valid JWT)

| Method | Endpoint                            | Purpose                          |
|--------|---------------------------------------|-----------------------------------|
| GET    | `/api/notes`                           | Get all of *your* notes           |
| GET    | `/api/notes/:id`                       | Get one of *your* notes by `_id`  |
| POST   | `/api/notes`                           | Create a note (owned by you)      |
| PUT    | `/api/notes/:id`                       | Update *your* note                |
| DELETE | `/api/notes/:id`                       | Delete *your* note                |
| GET    | `/api/notes/search?title=node`         | Search *your* notes by title      |
| GET    | `/api/notes/search?subject=backend`    | Search *your* notes by subject    |
| GET    | `/api/notes/search?tag=react`          | Search *your* notes by tag        |
| GET    | `/api/notes/stats`                     | Get statistics for *your* notes   |

### Common errors

```json
{ "error": "Access denied. No token provided." }
{ "error": "Invalid or expired token." }
{ "error": "Email already registered." }
{ "error": "Invalid email or password." }
{ "error": "Title already exists" }
{ "error": "Note not found." }
```

## Screenshots

Postman screenshots covering registration, login, `GET /me`, full CRUD,
search, statistics, and the security tests (no token, invalid token, and
two-user isolation) are in the `screenshots/` folder.

## Future Improvements

- Refresh tokens / shorter-lived access tokens
- Rate limiting on `/api/auth/login` to slow down brute-force attempts
- Email verification on registration
- Add pagination on `GET /api/notes`
- Add automated tests (Jest + Supertest)
- Connect a full React frontend instead of the small static UI
