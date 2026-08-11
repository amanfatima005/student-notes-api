// models/Note.js
//
// Mongoose schema for a student note. This replaces the plain JSON objects
// we used to read/write from notes.json in Version 2.
//
// Two validation layers exist in this project now:
//   1. middleware/validateNote.js -- checks the request BEFORE it reaches
//      the database (fast fail, custom business rules like duplicate titles).
//   2. This schema -- Mongoose/MongoDB's own validation, which runs no
//      matter how the data got here (API, script, admin tool, etc.).

const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true,
      unique: true
    },
    subject: {
      type: String,
      required: [true, 'Subject is required.'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required.'],
      trim: true,
      maxlength: [500, 'Description is too long (max 500 characters).']
    },
    tags: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true, // automatically adds & manages createdAt and updatedAt
    toJSON: {
      virtuals: true, // include the `id` virtual (string version of _id)
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

module.exports = mongoose.model('Note', noteSchema);
