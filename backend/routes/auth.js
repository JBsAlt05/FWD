const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * POST /auth/login
 * Body: { email, password }
 * NOTE: Plain-text password comparison (demo only).
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const sql = `
    SELECT 
      u.user_id,
      u.full_name,
      u.email,
      u.password_hash,
      r.role_name
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    WHERE u.email = ?
    LIMIT 1
  `;

  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error('LOGIN SQL ERROR:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = results[0];

    // Compare plain-text password with the stored value (password_hash used as password)
    if (password !== user.password_hash) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    req.session.user = {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      role: user.role_name
    };

    return res.json({ message: 'Login successful', user: req.session.user });
  });
});

router.get('/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });
  res.json({ user: req.session.user });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logged out' }));
});

module.exports = router;
