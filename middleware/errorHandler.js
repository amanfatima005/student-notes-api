// middleware/errorHandler.js
//
// Centralized error handler. Every controller passes errors to next(err)
// instead of handling them individually, so all error responses stay
// consistent and in one place.

function errorHandler(err, req, res, next) {
  console.error('💥 Error:', err.message);

  // Invalid MongoDB ObjectId (e.g. GET /api/notes/abc123)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ error: 'Invalid note ID.' });
  }

  // Mongoose schema validation errors (the safety-net layer below validateNote.js)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: messages.join(' ') });
  }

  // Duplicate key error (title has a unique index at the schema level too)
  if (err.code === 11000) {
    return res.status(400).json({ error: 'Title already exists' });
  }

  // Anything else -> generic 500
  res.status(500).json({ error: 'Something went wrong on the server.' });
}

module.exports = errorHandler;
