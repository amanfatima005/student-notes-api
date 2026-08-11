// utils/fileHandler.js
//
// Same idea as Version 1's fileManager.js -- Express just sits on top of
// this. Uses core `fs` (promises API), `path`, and `JSON` to persist notes
// to a local notes.json file. Nothing here is Express-specific.

const fs = require('fs').promises;
const path = require('path');

const NOTES_FILE = path.join(__dirname, '..', 'notes.json');

/**
 * Make sure notes.json exists. If missing, create it with an empty array.
 */
async function ensureFileExists() {
  try {
    await fs.access(NOTES_FILE);
  } catch (err) {
    await fs.writeFile(NOTES_FILE, '[]', 'utf-8');
  }
}

/**
 * Read all notes from notes.json.
 * Returns [] if the file is missing, empty, or corrupted -- the API should
 * never crash just because of a bad/missing data file.
 */
async function readNotes() {
  await ensureFileExists();
  try {
    const raw = await fs.readFile(NOTES_FILE, 'utf-8');
    if (!raw.trim()) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('⚠️  notes.json is unreadable or corrupted. Returning empty list.');
    return [];
  }
}

/**
 * Overwrite notes.json with the given array of notes.
 */
async function writeNotes(notes) {
  await fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2), 'utf-8');
}

/**
 * Work out the next numeric id: (max existing id) + 1, or 1 if there are no notes yet.
 */
function getNextId(notes) {
  if (!notes.length) return 1;
  const maxId = notes.reduce((max, note) => (note.id > max ? note.id : max), 0);
  return maxId + 1;
}

module.exports = {
  readNotes,
  writeNotes,
  getNextId
};
