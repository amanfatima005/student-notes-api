// config/db.js
//
// Handles the MongoDB connection. server.js waits for connectDB() to
// resolve before it starts listening -- so the app never accepts requests
// with a dead database underneath it.

const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ MONGO_URI is not set. Add it to your .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
