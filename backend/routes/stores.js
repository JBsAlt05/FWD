const express = require('express');
const router = express.Router();
const db = require('../db');

// ---- auth helpers ----
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Not logged in' });
  }
  next();
}

// Optional: only allow admin
function requireAdmin(req, res, next) {
  const u = req.session.user || {};
  const role = String(u.role || u.role_name || '').toLowerCase();
  if (role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  next();
}

// ✅ Decide your policy here:
const GUARD = requireLogin;

// ---------------------------------------------------------
// GET /stores
// Optional query: ?client_id=123
// Returns store_id, client_id, store_name (+ client_name)
// ---------------------------------------------------------
router.get('/', GUARD, (req, res) => {
  const clientId = req.query.client_id ? Number(req.query.client_id) : null;

  if (req.query.client_id && (!Number.isInteger(clientId) || clientId <= 0)) {
    return res.status(400).json({ message: 'Invalid client_id' });
  }

  const sql = `
    SELECT
      s.store_id,
      s.client_id,
      s.store_name,
      c.client_name
    FROM stores s
    JOIN clients c ON c.client_id = s.client_id
    ${clientId ? 'WHERE s.client_id = ?' : ''}
    ORDER BY s.store_name ASC
  `;

  db.query(sql, clientId ? [clientId] : [], (err, rows) => {
    if (err) {
      console.error('STORES LIST ERROR:', err);
      return res.status(500).json({ message: 'Database error', error: err.code || err.message });
    }
    res.json(rows);
  });
});

// ---------------------------------------------------------
// GET /stores/:id
// One store (+ client_name)
// ---------------------------------------------------------
router.get('/:id', GUARD, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: 'Invalid store id' });

  const sql = `
    SELECT
      s.store_id,
      s.client_id,
      s.store_name,
      c.client_name
    FROM stores s
    JOIN clients c ON c.client_id = s.client_id
    WHERE s.store_id = ?
    LIMIT 1
  `;

  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error('STORE GET ERROR:', err);
      return res.status(500).json({ message: 'Database error', error: err.code || err.message });
    }
    if (!rows.length) return res.status(404).json({ message: 'Store not found' });
    res.json(rows[0]);
  });
});

module.exports = router;