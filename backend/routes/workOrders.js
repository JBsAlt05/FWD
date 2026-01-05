const express = require('express');
const router = express.Router();
const db = require('../db');

// Admin creates work order (dispatcher is REQUIRED)
router.post('/', (req, res) => {
  const {
    store_id,
    address_line,
    city,
    state,
    zip_code,
    description,
    assigned_dispatcher
  } = req.body;

  if (!store_id || !address_line) {
    return res.status(400).json({ message: 'store_id and address_line are required' });
  }

  // ✅ MUST assign dispatcher on creation
  if (!assigned_dispatcher) {
    return res.status(400).json({ message: 'assigned_dispatcher is required' });
  }

  const sql = `
    INSERT INTO work_orders
      (store_id, address_line, city, state, zip_code, description, assigned_dispatcher, current_status)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const status = 'Assigned';

  db.query(
    sql,
    [
      store_id,
      address_line,
      city ?? null,
      state ?? null,
      zip_code ?? null,
      description ?? null,
      Number(assigned_dispatcher),
      status
    ],
    (err, result) => {
      if (err) {
        console.error('CREATE WO ERROR:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      res.status(201).json({
        message: 'Work order created',
        work_order_id: result.insertId,
        current_status: status
      });
    }
  );
});

module.exports = router;
