// routes/notesRoutes.js
//
// IMPORTANT: /search and /stats must be declared BEFORE /:id.
// Otherwise Express would treat "search" or "stats" as an :id value
// and route them to getNoteById instead.

const express = require('express');
const router = express.Router();

const notesController = require('../controllers/notesController');
const validateNote = require('../middleware/validateNote');

// Specific routes first
router.get('/search', notesController.searchNotes);
router.get('/stats', notesController.getStats);

// Collection routes
router.get('/', notesController.getAllNotes);
router.post('/', validateNote, notesController.addNote);

// Single-resource routes (must come after /search and /stats)
router.get('/:id', notesController.getNoteById);
router.put('/:id', validateNote, notesController.updateNote);
router.delete('/:id', notesController.deleteNote);

module.exports = router;