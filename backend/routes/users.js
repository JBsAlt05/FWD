const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /users/dispatchers
 */
router.get('/dispatchers', (req, res) => {
  const sql = `
    SELECT u.user_id, u.full_name, u.email
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    WHERE r.role_name = 'dispatcher'
    ORDER BY u.full_name
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('DISPATCHERS LIST ERROR:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});

module.exports = router;
