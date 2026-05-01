const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { run, get } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { required, isEmail, isValidRole } = require('../utils/validators');

const router = express.Router();

function makeToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'dev-secret-change-me',
    { expiresIn: '1d' }
  );
}

router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password, role = 'Member' } = req.body;

    if (!required(name) || !required(email) || !required(password)) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ message: 'Enter a valid email address' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (!isValidRole(role)) {
      return res.status(400).json({ message: 'Role must be Admin or Member' });
    }

    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await run(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), passwordHash, role]
    );

    const user = await get('SELECT id, name, email, role FROM users WHERE id = ?', [result.id]);
    res.status(201).json({ token: makeToken(user), user });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!required(email) || !required(password)) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    res.json({ token: makeToken(safeUser), user: safeUser });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await get('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
