// controllers/notesController.js
//
// Each function is an Express route handler: (req, res, next) -> sends a response.
// Uses fileHandler for all reads/writes to notes.json.

const fileHandler = require('../utils/fileHandler');

/**
 * GET /api/notes
 */
async function getAllNotes(req, res, next) {
  try {
    const notes = await fileHandler.readNotes();
    res.status(200).json(notes);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/notes/:id
 */
async function getNoteById(req, res, next) {
  try {
    const id = Number(req.params.id);
    const notes = await fileHandler.readNotes();
    const note = notes.find(n => n.id === id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    res.status(200).json(note);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/notes
 * (validateNote middleware has already checked the body before this runs)
 */
async function addNote(req, res, next) {
  try {
    const { title, subject, description, tags } = req.body;
    const notes = await fileHandler.readNotes();

    const newNote = {
      id: fileHandler.getNextId(notes),
      title: title.trim(),
      subject: subject.trim(),
      description: description ? description.trim() : '',
      tags: Array.isArray(tags) ? tags : [],
      createdAt: new Date().toISOString()
    };

    notes.push(newNote);
    await fileHandler.writeNotes(notes);

    res.status(201).json(newNote);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/notes/:id
 * (validateNote middleware has already checked the body before this runs)
 */
async function updateNote(req, res, next) {
  try {
    const id = Number(req.params.id);
    const notes = await fileHandler.readNotes();
    const note = notes.find(n => n.id === id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    const { title, subject, description, tags } = req.body;

    note.title = title.trim();
    note.subject = subject.trim();
    note.description = description ? description.trim() : '';
    note.tags = Array.isArray(tags) ? tags : note.tags;
    note.updatedAt = new Date().toISOString();

    await fileHandler.writeNotes(notes);
    res.status(200).json(note);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/notes/:id
 */
async function deleteNote(req, res, next) {
  try {
    const id = Number(req.params.id);
    const notes = await fileHandler.readNotes();
    const index = notes.findIndex(n => n.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    const [deleted] = notes.splice(index, 1);
    await fileHandler.writeNotes(notes);

    res.status(200).json({ message: 'Note deleted successfully.', note: deleted });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/notes/search?title=node
 * GET /api/notes/search?subject=backend
 * (both can be combined - both filters apply if both are present)
 */
async function searchNotes(req, res, next) {
  try {
    const { title, subject, tag } = req.query;

    if (!title && !subject && !tag) {
      return res.status(400).json({ error: 'Provide a title, subject, or tag query parameter to search.' });
    }

    let notes = await fileHandler.readNotes();

    if (title) {
      notes = notes.filter(n => n.title.toLowerCase().includes(String(title).toLowerCase()));
    }
    if (subject) {
      notes = notes.filter(n => n.subject.toLowerCase().includes(String(subject).toLowerCase()));
    }
    if (tag) {
      notes = notes.filter(n => (n.tags || []).some(t => t.toLowerCase().includes(String(tag).toLowerCase())));
    }

    res.status(200).json(notes);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/notes/stats
 */
async function getStats(req, res, next) {
  try {
    const notes = await fileHandler.readNotes();

    if (notes.length === 0) {
      return res.status(200).json({
        totalNotes: 0,
        subjects: 0,
        latestNote: null,
        mostUsedTag: null
      });
    }

    const uniqueSubjects = new Set(notes.map(n => n.subject));

    const tagFreq = {};
    notes.forEach(note => {
      (note.tags || []).forEach(tag => {
        tagFreq[tag] = (tagFreq[tag] || 0) + 1;
      });
    });

    let mostUsedTag = null;
    let maxCount = 0;
    Object.entries(tagFreq).forEach(([tag, count]) => {
      if (count > maxCount) {
        mostUsedTag = tag;
        maxCount = count;
      }
    });

    const latestNote = notes.reduce((latest, note) =>
      new Date(note.createdAt) > new Date(latest.createdAt) ? note : latest
    , notes[0]);

    res.status(200).json({
      totalNotes: notes.length,
      subjects: uniqueSubjects.size,
      latestNote: latestNote.title,
      mostUsedTag
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllNotes,
  getNoteById,
  addNote,
  updateNote,
  deleteNote,
  searchNotes,
  getStats
};
