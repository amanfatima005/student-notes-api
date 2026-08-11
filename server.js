// server.js
// Entry point. Loads environment variables, connects to MongoDB, and only
// starts accepting requests once that connection succeeds.

require('dotenv').config();

const path = require('path');
const express = require('express');

const connectDB = require('./config/db');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const notesRoutes = require('./routes/notesRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ---- Global middleware ----
app.use(express.json());   // parse JSON request bodies
app.use(logger);           // log every request (method, path, timestamp)

// ---- Home route (required by the assignment spec - keep this exact JSON) ----
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Student Notes API is running...' });
});

// ---- Frontend (browser UI, wired up to this MongoDB-backed API) ----
// Served under /app so it doesn't clash with the required JSON home route.
app.use('/app', express.static(path.join(__dirname, 'public')));

// ---- Notes routes ----
app.use('/api/notes', notesRoutes);

// ---- 404 handler (unknown routes) ----
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ---- Centralized error handler (must be the LAST app.use) ----
app.use(errorHandler);

// ---- Connect to MongoDB, THEN start listening ----
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Student Notes API running at http://localhost:${PORT}`);
    console.log(`🖥️  Frontend UI available at http://localhost:${PORT}/app`);
  });
});
