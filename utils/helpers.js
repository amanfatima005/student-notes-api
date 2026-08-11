// utils/helpers.js
//
// Small shared helpers used by both the controller (search) and the
// validation middleware (duplicate title check).

/**
 * Escape special regex characters so user input can be safely used inside
 * a MongoDB $regex query without breaking or being abused as a regex.
 */
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { escapeRegex };
