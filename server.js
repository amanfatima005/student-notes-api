// server.js
// Entry point. Express sits on top of the same Node.js core concepts
// (fs, path, JSON, require/modules) used in Version 1 -- it just gives us
// routing, middleware, and JSON handling out of the box instead of writing
// them by hand with the raw `http` module.

const express = require('express');
const logger = require('./middleware/logger');
const notesRoutes = require('./routes/notesRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ---- Global middleware ----
app.use(express.json());   // parse JSON request bodies
app.use(logger);           // log every request (method, path, timestamp)

// ---- Home route ----
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Student Notes API is running...' });
});

// ---- Notes routes ----
app.use('/api/notes', notesRoutes);

// ---- 404 handler (unknown routes) ----
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ---- Centralized error handler ----
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('💥 Unexpected error:', err.message);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
  console.log(`✅ Student Notes API running at http://localhost:${PORT}`);
});
