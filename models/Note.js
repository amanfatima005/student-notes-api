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
//
// Week 5: every note now belongs to a user. Title uniqueness is scoped per
// user (via the compound index below) instead of being globally unique --
// two different students can both have a note called "React Hooks".

const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true
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
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
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

// A title only needs to be unique within one user's own notes.
noteSchema.index({ user: 1, title: 1 }, { unique: true });

module.exports = mongoose.model('Note', noteSchema);
