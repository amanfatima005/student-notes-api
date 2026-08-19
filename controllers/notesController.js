// controllers/notesController.js
//
// Week 5: every function here is scoped to the logged-in user
// (authMiddleware has already set req.user.id before any of this runs).
//
// For getNoteById / updateNote / deleteNote, the query filters by BOTH
// _id AND user in a single step. If the note exists but belongs to someone
// else, that query simply finds nothing -- so it returns the same 404 as a
// note that doesn't exist at all. This is intentional: a user shouldn't be
// able to tell "not yours" apart from "doesn't exist" just by poking at IDs.

const Note = require('../models/Note');
const { escapeRegex } = require('../utils/helpers');

/**
 * GET /api/notes
 */
async function getAllNotes(req, res, next) {
  try {
    const notes = await Note.find({ user: req.user.id }).sort({ createdAt: -1 });
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
    const note = await Note.findOne({ _id: req.params.id, user: req.user.id });
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
      tags: Array.isArray(tags) ? tags : [],
      user: req.user.id
    });

    res.status(201).json(note);
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
    const { title, subject, description, tags } = req.body;

    const updates = {
      title: title.trim(),
      subject: subject.trim(),
      description: description.trim()
    };
    if (Array.isArray(tags)) updates.tags = tags;

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      updates,
      { new: true, runValidators: true }
    );

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
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user.id });

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
 */
async function searchNotes(req, res, next) {
  try {
    const { title, subject, tag } = req.query;

    if (!title && !subject && !tag) {
      return res.status(400).json({ error: 'Provide a title, subject, or tag query parameter to search.' });
    }

    const filter = { user: req.user.id };
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
    const userFilter = { user: req.user.id };
    const totalNotes = await Note.countDocuments(userFilter);

    if (totalNotes === 0) {
      return res.status(200).json({
        totalNotes: 0,
        subjects: 0,
        latestNote: null,
        mostUsedTag: null
      });
    }

    const subjectList = await Note.distinct('subject', userFilter);
    const latest = await Note.findOne(userFilter).sort({ createdAt: -1 });

    // Bonus: most-used tag calculated with a MongoDB aggregation pipeline
    const topTagResult = await Note.aggregate([
      { $match: { user: latest.user } },
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