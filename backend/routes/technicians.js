const express = require('express');
const router = express.Router();
const db = require('../db');

// Simple auth guard (session)
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Not logged in' });
  }
  next();
}

// Allow dispatcher/admin (you can expand later)
function requireDispatcherOrAdmin(req, res, next) {
  const role = (req.session.user.role || '').toLowerCase();
  if (role !== 'dispatcher' && role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}

/**
 * GET /technicians
 * Returns all technicians
 */
router.get('/', requireLogin, requireDispatcherOrAdmin, (req, res) => {
  const sql = `
    SELECT technician_id, full_name, trade, phone, city, state, payment_info
    FROM technicians
    ORDER BY technician_id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('GET /technicians error:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }
    res.json(results);
  });
});

/**
 * POST /technicians
 * Body: { full_name, trade, phone, city, state, payment_info }
 */
router.post('/', requireLogin, requireDispatcherOrAdmin, (req, res) => {
  const {
    full_name,
    trade = null,
    phone = null,
    city = null,
    state = null,
    payment_info = null
  } = req.body;

  if (!full_name || !String(full_name).trim()) {
    return res.status(400).json({ message: 'full_name is required' });
  }

  const sql = `
    INSERT INTO technicians (full_name, trade, phone, city, state, payment_info)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [String(full_name).trim(), trade, phone, city, state, payment_info],
    (err, result) => {
      if (err) {
        console.error('POST /technicians error:', err);
        return res.status(500).json({ message: 'Database error', error: err });
      }
      res.status(201).json({ message: 'Technician created', technician_id: result.insertId });
    }
  );
});

/**
 * PUT /technicians/:id
 * Body: { full_name, trade, phone, city, state, payment_info }
 */
router.put('/:id', requireLogin, requireDispatcherOrAdmin, (req, res) => {
  const techId = Number(req.params.id);
  if (!Number.isInteger(techId) || techId <= 0) {
    return res.status(400).json({ message: 'Invalid technician id' });
  }

  const {
    full_name,
    trade = null,
    phone = null,
    city = null,
    state = null,
    payment_info = null
  } = req.body;

  if (!full_name || !String(full_name).trim()) {
    return res.status(400).json({ message: 'full_name is required' });
  }

  const sql = `
    UPDATE technicians
    SET full_name = ?, trade = ?, phone = ?, city = ?, state = ?, payment_info = ?
    WHERE technician_id = ?
    LIMIT 1
  `;

  db.query(
    sql,
    [String(full_name).trim(), trade, phone, city, state, payment_info, techId],
    (err, result) => {
      if (err) {
        console.error('PUT /technicians/:id error:', err);
        return res.status(500).json({ message: 'Database error', error: err });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Technician not found' });
      }

      res.json({ message: 'Technician updated' });
    }
  );
});

module.exports = router;
