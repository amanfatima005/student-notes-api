# Student Notes Management REST API

Version 2 of the Student Notes Manager — a backend REST API built with
**Express.js**, evolved from the Version 1 Node.js CLI (`readline` + `fs`).

## Project Overview

This API lets you manage student study notes over HTTP: create, read,
update, delete, search, and view statistics. It's built with a modular
architecture (routes / controllers / middleware / utils) and is meant to be
tested with **Postman**.

Notes are persisted to a local `notes.json` file — no database required.

## Features

- Home route to confirm the API is running
- Full CRUD for notes (Create, Read, Update, Delete)
- Search notes by title, subject, or tag (query parameters)
- Statistics endpoint (total notes, unique subjects, latest note, most used tag)
- Request logging middleware (method, path, timestamp on every request)
- Validation middleware (empty title/subject, description length, duplicate titles)
- Centralized error handling and consistent JSON responses

## Folder Structure

```
student-notes-api/
│── package.json
│── server.js
│── notes.json
│── README.md
│── .gitignore
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
│
├── utils/
│      fileHandler.js
│
└── screenshots/
```

## Installation

```bash
git clone <your-repo-url>
cd student-notes-api
npm install
```

## How to Run

```bash
npm start
```

The API runs at **http://localhost:5000** by default (set a `PORT`
environment variable to change it).

## API Endpoints

| Method | Endpoint                          | Description                          |
|--------|------------------------------------|---------------------------------------|
| GET    | `/`                                 | Health check / home route             |
| GET    | `/api/notes`                        | Get all notes                         |
| GET    | `/api/notes/:id`                    | Get a single note by id               |
| POST   | `/api/notes`                        | Add a new note                        |
| PUT    | `/api/notes/:id`                    | Update an existing note               |
| DELETE | `/api/notes/:id`                    | Delete a note                         |
| GET    | `/api/notes/search?title=node`      | Search notes by title                 |
| GET    | `/api/notes/search?subject=backend` | Search notes by subject               |
| GET    | `/api/notes/stats`                  | Get statistics about all notes        |

### Add Note — request body

```json
{
  "title": "Node JS",
  "subject": "Backend",
  "description": "Learning modules",
  "tags": ["node", "backend"]
}
```

### Validation errors

```json
{ "error": "Title already exists" }
```

Other validation errors returned the same way: `"Title is required."`,
`"Subject is required."`, `"Description is too long (max 500 characters)."`

### Statistics response shape

```json
{
  "totalNotes": 15,
  "subjects": 4,
  "latestNote": "Node JS",
  "mostUsedTag": "react"
}
```

## Screenshots

Postman screenshots for GET, POST, PUT, DELETE, Search, and a validation
error are in the `screenshots/` folder.

## Future Improvements

- Move from `notes.json` to a real database (MongoDB / PostgreSQL)
- Add authentication (JWT) so notes are scoped per student
- Add pagination on `GET /api/notes`
- Add automated tests (Jest + Supertest)
- Rate limiting and request validation with a library like `express-validator`
- Convert `fileHandler.js` operations into a proper repository/service layer
