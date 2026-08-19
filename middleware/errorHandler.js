// middleware/errorHandler.js
//
// Centralized error handler. Every controller passes errors to next(err)
// instead of handling them individually, so all error responses stay
// consistent and in one place.

function errorHandler(err, req, res, next) {
  console.error('💥 Error:', err.message);

  // Invalid MongoDB ObjectId (e.g. GET /api/notes/abc123)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ error: 'Invalid ID.' });
  }

  // Mongoose schema validation errors (the safety-net layer below validateNote.js / User schema)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: messages.join(' ') });
  }

  // Duplicate key error -- works for both the Note title index and the
  // User email index, since it reads whichever field actually collided.
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).find(key => key !== 'user') || 'Field';
    const label = field.charAt(0).toUpperCase() + field.slice(1);
    return res.status(400).json({ error: `${label} already exists.` });
  }

  // Anything else -> generic 500
  res.status(500).json({ error: 'Something went wrong on the server.' });
}

module.exports = errorHandler;
