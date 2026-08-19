// models/User.js
//
// Stores registered users. The password field NEVER holds plain text --
// authController hashes it with bcrypt before this document is saved.
// The toJSON transform strips the password hash out of every API response,
// so it can never accidentally leak even if a route forgets to select it out.

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email.']
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [6, 'Password must be at least 6 characters.']
    }
  },
  {
    timestamps: true, // adds createdAt (and updatedAt)
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password; // never send the hash back to the client
        delete ret.__v;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

module.exports = mongoose.model('User', userSchema);
