//
// Handles registration, login, and the "who am I" endpoint.
//
// Password flow (this is the part worth understanding, not just running):
//   Register:  plain password -> bcrypt.hash()  -> hash stored in MongoDB
//   Login:     plain password -> bcrypt.compare(password, storedHash)
//
// bcrypt hashes are one-way and salted, so even if the database leaks, the
// original passwords can't be recovered from what's stored -- unlike saving
// req.body.password directly, which would expose every user's real password
// the moment the database is compromised.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const SALT_ROUNDS = 10;

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

/**
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Please provide a valid email.' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    // password123 -> bcrypt.hash() -> $2b$10$........ -> stored in MongoDB
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Same error for "no such user" and "wrong password" -- don't reveal
    // which one it was, or you've just told an attacker which emails are registered.
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // stored bcrypt hash <- bcrypt.compare() <- plain password from the request
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * (authMiddleware has already verified the token and set req.user.id)
 */
async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe };
