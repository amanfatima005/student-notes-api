// middleware/validateNote.js
//
// Request-level validation for POST /api/notes and PUT /api/notes/:id.
// This runs BEFORE Mongoose ever sees the data -- it's the first of the two
// validation layers described in the README (Express middleware, then
// Mongoose schema validation as a safety net).

const Note = require('../models/Note');
const { escapeRegex } = require('../utils/helpers');

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

  // 3. Empty description
  if (!description || typeof description !== 'string' || !description.trim()) {
    return res.status(400).json({ error: 'Description is required.' });
  }

  // 4. Description length
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return res.status(400).json({
      error: `Description is too long (max ${MAX_DESCRIPTION_LENGTH} characters).`
    });
  }

  // 5. Duplicate title check (case-insensitive), performed as a real query.
  // On update (PUT /api/notes/:id), the note being edited is excluded so
  // saving a note without changing its title still works.
  try {
    const currentId = req.params.id || null;

    const duplicate = await Note.findOne({
      title: { $regex: `^${escapeRegex(title.trim())}$`, $options: 'i' },
      ...(currentId ? { _id: { $ne: currentId } } : {})
    });

    if (duplicate) {
      return res.status(400).json({ error: 'Title already exists' });
    }

    next();
  } catch (err) {
    next(err); // e.g. an invalid :id format on PUT
  }
}

module.exports = validateNote;
