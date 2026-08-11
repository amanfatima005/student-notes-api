// controllers/notesController.js
//
// Same route handler shapes as Version 2, but every read/write now goes
// through Mongoose to MongoDB instead of fileHandler.readNotes()/writeNotes().
// All errors are passed to next(err) so the centralized errorHandler
// middleware can turn them into consistent JSON responses (invalid ObjectId,
// Mongoose validation errors, duplicate key errors, etc).

const Note = require('../models/Note');
const { escapeRegex } = require('../utils/helpers');

/**
 * GET /api/notes
 */
async function getAllNotes(req, res, next) {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
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
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }
    res.status(200).json(note);
  } catch (err) {
    next(err); // invalid ObjectId format lands here as a CastError
  }
}

/**
 * POST /api/notes
 * (validateNote middleware has already checked the body before this runs)
 */
async function addNote(req, res, next) {
  try {
    const { title, subject, description, tags } = req.body;

    const note = await Note.create({
      title: title.trim(),
      subject: subject.trim(),
      description: description.trim(),
      tags: Array.isArray(tags) ? tags : []
    });

    res.status(201).json(note);
  } catch (err) {
    next(err); // Mongoose validation errors / duplicate key errors land here
  }
}

/**
 * PUT /api/notes/:id
 * (validateNote middleware has already checked the body before this runs)
 */
async function updateNote(req, res, next) {
  try {
    const { title, subject, description, tags } = req.body;

    const updates = {
      title: title.trim(),
      subject: subject.trim(),
      description: description.trim()
    };
    if (Array.isArray(tags)) updates.tags = tags;

    const note = await Note.findByIdAndUpdate(req.params.id, updates, {
      new: true,           // return the updated document, not the old one
      runValidators: true  // re-run schema validation on update
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }

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
    const note = await Note.findByIdAndDelete(req.params.id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    res.status(200).json({ message: 'Note deleted successfully.', note });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/notes/search?title=node
 * GET /api/notes/search?subject=backend
 * GET /api/notes/search?tag=react
 * (all performed as a real MongoDB query, not in-memory filtering)
 */
async function searchNotes(req, res, next) {
  try {
    const { title, subject, tag } = req.query;

    if (!title && !subject && !tag) {
      return res.status(400).json({ error: 'Provide a title, subject, or tag query parameter to search.' });
    }

    const filter = {};
    if (title) filter.title = { $regex: escapeRegex(title), $options: 'i' };
    if (subject) filter.subject = { $regex: escapeRegex(subject), $options: 'i' };
    if (tag) filter.tags = { $regex: escapeRegex(tag), $options: 'i' };

    const notes = await Note.find(filter);
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
    const totalNotes = await Note.countDocuments();

    if (totalNotes === 0) {
      return res.status(200).json({
        totalNotes: 0,
        subjects: 0,
        latestNote: null,
        mostUsedTag: null
      });
    }

    const subjectList = await Note.distinct('subject');
    const latest = await Note.findOne().sort({ createdAt: -1 });

    // Bonus: most-used tag calculated with a MongoDB aggregation pipeline
    const topTagResult = await Note.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    res.status(200).json({
      totalNotes,
      subjects: subjectList.length,
      latestNote: latest ? latest.title : null,
      mostUsedTag: topTagResult.length ? topTagResult[0]._id : null
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
