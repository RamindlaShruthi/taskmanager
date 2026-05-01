const express = require('express');
const { all } = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const users = await all('SELECT id, name, email, role, created_at FROM users ORDER BY name');
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.get('/members', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const users = await all(
      "SELECT id, name, email, role FROM users WHERE role = 'Member' ORDER BY name"
    );
    res.json(users);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
