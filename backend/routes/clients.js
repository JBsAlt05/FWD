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

// Optional: only allow admin to access these lists
// If you want ALL logged-in roles to see them, keep requireLogin only.
function requireAdmin(req, res, next) {
  const u = req.session.user || {};
  const role = String(u.role || u.role_name || '').toLowerCase();
  if (role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  next();
}

// ✅ Decide your policy here:
// - If admin pages only: use requireAdmin
// - If other roles can use these dropdowns too: use requireLogin
const GUARD = requireLogin;

// ---------------------------------------------------------
// GET /clients
// Returns all clients (client_id, client_name)
// ---------------------------------------------------------
router.get('/', GUARD, (req, res) => {
  const sql = `
    SELECT client_id, client_name
    FROM clients
    ORDER BY client_name ASC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error('CLIENTS LIST ERROR:', err);
      return res.status(500).json({ message: 'Database error', error: err.code || err.message });
    }
    res.json(rows);
  });
});

// ---------------------------------------------------------
// GET /clients/:id
// One client
// ---------------------------------------------------------
router.get('/:id', GUARD, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: 'Invalid client id' });

  const sql = `
    SELECT client_id, client_name
    FROM clients
    WHERE client_id = ?
    LIMIT 1
  `;

  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error('CLIENT GET ERROR:', err);
      return res.status(500).json({ message: 'Database error', error: err.code || err.message });
    }
    if (!rows.length) return res.status(404).json({ message: 'Client not found' });
    res.json(rows[0]);
  });
});

// ---------------------------------------------------------
// GET /clients/:id/stores
// Returns stores for a client (store_id, store_name, client_id)
// ---------------------------------------------------------
router.get('/:id/stores', GUARD, (req, res) => {
  const clientId = Number(req.params.id);
  if (!Number.isInteger(clientId) || clientId <= 0) return res.status(400).json({ message: 'Invalid client id' });

  const sql = `
    SELECT store_id, client_id, store_name
    FROM stores
    WHERE client_id = ?
    ORDER BY store_name ASC
  `;

  db.query(sql, [clientId], (err, rows) => {
    if (err) {
      console.error('CLIENT STORES ERROR:', err);
      return res.status(500).json({ message: 'Database error', error: err.code || err.message });
    }
    res.json(rows);
  });
});

module.exports = router;