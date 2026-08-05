// middleware/validateNote.js
//
// Validates the request body for POST /api/notes and PUT /api/notes/:id.
// Runs BEFORE the controller, so the controller can assume the body is clean.

const fileHandler = require('../utils/fileHandler');

const MAX_DESCRIPTION_LENGTH = 500;

async function validateNote(req, res, next) {
  const { title, subject, description } = req.body;

  // 1. Empty title
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Title is required.' });
  }

  // 2. Empty subject
  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    return res.status(400).json({ error: 'Subject is required.' });
  }

  // 3. Description length
  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    return res.status(400).json({
      error: `Description is too long (max ${MAX_DESCRIPTION_LENGTH} characters).`
    });
  }

  // 4. Duplicate title check (case-insensitive)
  // On update (PUT /api/notes/:id), the note being edited is excluded from
  // the duplicate check so saving a note without changing its title still works.
  try {
    const notes = await fileHandler.readNotes();
    const currentId = req.params.id ? Number(req.params.id) : null;

    const isDuplicate = notes.some(note => {
      const sameTitle = note.title.trim().toLowerCase() === title.trim().toLowerCase();
      const isSameNote = currentId !== null && note.id === currentId;
      return sameTitle && !isSameNote;
    });

    if (isDuplicate) {
      return res.status(400).json({ error: 'Title already exists' });
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = validateNote;
