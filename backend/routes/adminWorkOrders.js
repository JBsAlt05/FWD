const express = require('express');
const router = express.Router();
const db = require('../db');

function requireRole(wanted) {
  return (req, res, next) => {
    if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });

    const u = req.session.user || {};
    const role = String(u.role || u.role_name || '').toLowerCase();
    const need = String(wanted).toLowerCase();

    if (!role) return res.status(403).json({ message: 'Forbidden (missing role in session)' });
    if (role !== need) return res.status(403).json({ message: 'Forbidden' });

    next();
  };
}

// Must match dispatcher status system EXACT
const allowedStatuses = new Set([
  'Assigned',
  'Secured',
  'Awaiting Approval',
  'Awaiting Advice',
  'Onsite',
  'Job Done',
  'Needs Proposal',
  'Approved Scheduled',
  'Approved Pending',
  'Return Trip Needed',
  'Parts Needed',
  'Parts Ordered',
  'Billed For Incurred',
  'Ready To Invoice',
  'Invoiced',
  'Recall',
  'Paid',
  'Canceled'
]);

function normalizeStatus(s) {
  return (s && String(s).trim()) ? String(s).trim() : 'Assigned';
}

function isYMD(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.trim());
}

function toNullIfEmpty(v) {
  if (typeof v === 'undefined') return null;
  if (v === null) return null;
  if (typeof v === 'string' && v.trim() === '') return null;
  return v;
}

function cleanWoNumber(v) {
  return (v ?? '').toString().trim();
}

function validateWoNumber(wo) {
  if (!wo) return 'work_order_number is required';
  if (wo.length > 50) return 'work_order_number is too long (max 50)';
  return null;
}

// =========================================================
// POST /admin/work-orders
// =========================================================
router.post('/', requireRole('admin'), (req, res) => {
  const body = req.body || {};

  const work_order_number = cleanWoNumber(body.work_order_number);
  const woErr = validateWoNumber(work_order_number);
  if (woErr) return res.status(400).json({ message: woErr });

  const store_id = Number(body.store_id);
  const address_line = (body.address_line ?? '').toString().trim();

  const assigned_dispatcher = Number(body.assigned_dispatcher);
  const city = toNullIfEmpty(body.city);
  const state = toNullIfEmpty(body.state);
  const zip_code = toNullIfEmpty(body.zip_code);
  const description = toNullIfEmpty(body.description);

  const nteRaw = toNullIfEmpty(body.nte);
  const nte = (nteRaw === null) ? null : Number(nteRaw);

  const eta_dateRaw = toNullIfEmpty(body.eta_date);
  const eta_date = (eta_dateRaw && typeof eta_dateRaw === 'string') ? eta_dateRaw.trim() : null;

  const status = normalizeStatus(body.current_status);

  if (!store_id || !Number.isFinite(store_id)) {
    return res.status(400).json({ message: 'store_id is required and must be a number' });
  }
  if (!address_line) {
    return res.status(400).json({ message: 'address_line is required' });
  }
  if (!assigned_dispatcher || !Number.isFinite(assigned_dispatcher)) {
    return res.status(400).json({ message: 'assigned_dispatcher is required and must be a number' });
  }
  if (!allowedStatuses.has(status)) {
    return res.status(400).json({ message: 'Invalid status value', allowed: Array.from(allowedStatuses) });
  }
  if (nte !== null && !Number.isFinite(nte)) {
    return res.status(400).json({ message: 'nte must be a number or null' });
  }
  if (eta_date !== null && !isYMD(eta_date)) {
    return res.status(400).json({ message: 'eta_date must be YYYY-MM-DD or null' });
  }

  const sql = `
    INSERT INTO work_orders
      (work_order_number, store_id, address_line, city, state, zip_code, description, assigned_dispatcher, nte, eta_date, current_status)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      work_order_number,
      store_id,
      address_line,
      city,
      state,
      zip_code,
      description,
      assigned_dispatcher,
      nte,
      eta_date,
      status
    ],
    (err, result) => {
      if (err) {
        console.error('ADMIN CREATE WO ERROR:', err);

        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ message: 'Work order number already exists' });
        }

        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
          return res.status(400).json({ message: 'Invalid store_id (store does not exist)' });
        }

        return res.status(500).json({
          message: 'Database error creating work order',
          error: err.code || err.message
        });
      }

      res.status(201).json({
        message: 'Work order created',
        work_order_id: result.insertId,
        work_order_number
      });
    }
  );
});

// =========================================================
// GET /admin/work-orders
// =========================================================
router.get('/', requireRole('admin'), (req, res) => {
  const sql = `
    SELECT
      wo.work_order_id,
      wo.work_order_number,
      wo.current_status,
      wo.nte,
      DATE_FORMAT(wo.eta_date, '%Y-%m-%d') AS eta_date,
      wo.description,
      wo.address_line,
      wo.city,
      wo.state,
      wo.zip_code,
      wo.store_id,
      wo.assigned_dispatcher,

      s.store_name,
      c.client_id,
      c.client_name,

      u.full_name AS dispatcher_name
    FROM work_orders wo
    LEFT JOIN stores s ON s.store_id = wo.store_id
    LEFT JOIN clients c ON c.client_id = s.client_id
    LEFT JOIN users u ON u.user_id = wo.assigned_dispatcher
    ORDER BY wo.work_order_id DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error('ADMIN LIST ERROR:', err);
      return res.status(500).json({ message: 'Database error', error: err.code || err.message });
    }
    res.json(rows);
  });
});

// =========================================================
// GET /admin/work-orders/by-number/:woNumber
// =========================================================
router.get('/by-number/:woNumber', requireRole('admin'), (req, res) => {
  const woNumber = cleanWoNumber(req.params.woNumber);
  const woErr = validateWoNumber(woNumber);
  if (woErr) return res.status(400).json({ message: woErr });

  const sql = `
    SELECT
      wo.work_order_id,
      wo.work_order_number,
      wo.current_status,
      wo.nte,
      DATE_FORMAT(wo.eta_date, '%Y-%m-%d') AS eta_date,
      wo.description,
      wo.address_line,
      wo.city,
      wo.state,
      wo.zip_code,
      wo.store_id,
      wo.assigned_dispatcher,

      s.store_name,
      c.client_id,
      c.client_name,

      u.full_name AS dispatcher_name
    FROM work_orders wo
    LEFT JOIN stores s ON s.store_id = wo.store_id
    LEFT JOIN clients c ON c.client_id = s.client_id
    LEFT JOIN users u ON u.user_id = wo.assigned_dispatcher
    WHERE wo.work_order_number = ?
    LIMIT 1
  `;

  db.query(sql, [woNumber], (err, rows) => {
    if (err) {
      console.error('ADMIN GET BY NUMBER ERROR:', err);
      return res.status(500).json({ message: 'Database error', error: err.code || err.message });
    }
    if (!rows.length) return res.status(404).json({ message: 'Work order not found' });
    res.json(rows[0]);
  });
});

// =========================================================
// PUT /admin/work-orders/by-number/:woNumber
// =========================================================
router.put('/by-number/:woNumber', requireRole('admin'), (req, res) => {
  const woNumber = cleanWoNumber(req.params.woNumber);
  const woErr = validateWoNumber(woNumber);
  if (woErr) return res.status(400).json({ message: woErr });

  const body = req.body || {};

  const new_work_order_number = cleanWoNumber(body.work_order_number ?? woNumber);
  const newWoErr = validateWoNumber(new_work_order_number);
  if (newWoErr) return res.status(400).json({ message: newWoErr });

  const store_id = Number(body.store_id);
  const address_line = (body.address_line ?? '').toString().trim();

  const assigned_dispatcher = Number(body.assigned_dispatcher);
  const city = toNullIfEmpty(body.city);
  const state = toNullIfEmpty(body.state);
  const zip_code = toNullIfEmpty(body.zip_code);
  const description = toNullIfEmpty(body.description);

  const nteRaw = toNullIfEmpty(body.nte);
  const nte = (nteRaw === null) ? null : Number(nteRaw);

  const eta_dateRaw = toNullIfEmpty(body.eta_date);
  const eta_date = (eta_dateRaw && typeof eta_dateRaw === 'string') ? eta_dateRaw.trim() : null;

  const status = normalizeStatus(body.current_status);

  if (!store_id || !Number.isFinite(store_id)) {
    return res.status(400).json({ message: 'store_id is required and must be a number' });
  }
  if (!address_line) {
    return res.status(400).json({ message: 'address_line is required' });
  }
  if (!assigned_dispatcher || !Number.isFinite(assigned_dispatcher)) {
    return res.status(400).json({ message: 'assigned_dispatcher is required and must be a number' });
  }
  if (!allowedStatuses.has(status)) {
    return res.status(400).json({ message: 'Invalid status value', allowed: Array.from(allowedStatuses) });
  }
  if (nte !== null && !Number.isFinite(nte)) {
    return res.status(400).json({ message: 'nte must be a number or null' });
  }
  if (eta_date !== null && !isYMD(eta_date)) {
    return res.status(400).json({ message: 'eta_date must be YYYY-MM-DD or null' });
  }

  const sql = `
    UPDATE work_orders
    SET
      work_order_number = ?,
      store_id = ?,
      address_line = ?,
      city = ?,
      state = ?,
      zip_code = ?,
      description = ?,
      assigned_dispatcher = ?,
      nte = ?,
      eta_date = ?,
      current_status = ?
    WHERE work_order_number = ?
    LIMIT 1
  `;

  db.query(
    sql,
    [
      new_work_order_number,
      store_id,
      address_line,
      city,
      state,
      zip_code,
      description,
      assigned_dispatcher,
      nte,
      eta_date,
      status,
      woNumber
    ],
    (err, result) => {
      if (err) {
        console.error('ADMIN UPDATE BY NUMBER ERROR:', err);

        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ message: 'Work order number already exists' });
        }
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
          return res.status(400).json({ message: 'Invalid store_id (store does not exist)' });
        }

        return res.status(500).json({ message: 'Database error', error: err.code || err.message });
      }
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Work order not found' });

      res.json({ message: 'Updated', work_order_number: new_work_order_number });
    }
  );
});

// =========================================================
// BACKWARD COMPATIBILITY (by internal id)
// =========================================================
router.get('/:id', requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: 'Invalid work order id' });

  const sql = `
    SELECT
      wo.work_order_id,
      wo.work_order_number,
      wo.current_status,
      wo.nte,
      DATE_FORMAT(wo.eta_date, '%Y-%m-%d') AS eta_date,
      wo.description,
      wo.address_line,
      wo.city,
      wo.state,
      wo.zip_code,
      wo.store_id,
      wo.assigned_dispatcher,

      s.store_name,
      c.client_id,
      c.client_name,

      u.full_name AS dispatcher_name
    FROM work_orders wo
    LEFT JOIN stores s ON s.store_id = wo.store_id
    LEFT JOIN clients c ON c.client_id = s.client_id
    LEFT JOIN users u ON u.user_id = wo.assigned_dispatcher
    WHERE wo.work_order_id = ?
    LIMIT 1
  `;

  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error('ADMIN GET ONE ERROR:', err);
      return res.status(500).json({ message: 'Database error', error: err.code || err.message });
    }
    if (!rows.length) return res.status(404).json({ message: 'Work order not found' });
    res.json(rows[0]);
  });
});

router.put('/:id', requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: 'Invalid work order id' });

  const body = req.body || {};

  const work_order_number = cleanWoNumber(body.work_order_number);
  const woErr = validateWoNumber(work_order_number);
  if (woErr) return res.status(400).json({ message: woErr });

  const store_id = Number(body.store_id);
  const address_line = (body.address_line ?? '').toString().trim();

  const assigned_dispatcher = Number(body.assigned_dispatcher);
  const city = toNullIfEmpty(body.city);
  const state = toNullIfEmpty(body.state);
  const zip_code = toNullIfEmpty(body.zip_code);
  const description = toNullIfEmpty(body.description);

  const nteRaw = toNullIfEmpty(body.nte);
  const nte = (nteRaw === null) ? null : Number(nteRaw);

  const eta_dateRaw = toNullIfEmpty(body.eta_date);
  const eta_date = (eta_dateRaw && typeof eta_dateRaw === 'string') ? eta_dateRaw.trim() : null;

  const status = normalizeStatus(body.current_status);

  if (!store_id || !Number.isFinite(store_id)) {
    return res.status(400).json({ message: 'store_id is required and must be a number' });
  }
  if (!address_line) {
    return res.status(400).json({ message: 'address_line is required' });
  }
  if (!assigned_dispatcher || !Number.isFinite(assigned_dispatcher)) {
    return res.status(400).json({ message: 'assigned_dispatcher is required and must be a number' });
  }
  if (!allowedStatuses.has(status)) {
    return res.status(400).json({ message: 'Invalid status value', allowed: Array.from(allowedStatuses) });
  }
  if (nte !== null && !Number.isFinite(nte)) {
    return res.status(400).json({ message: 'nte must be a number or null' });
  }
  if (eta_date !== null && !isYMD(eta_date)) {
    return res.status(400).json({ message: 'eta_date must be YYYY-MM-DD or null' });
  }

  const sql = `
    UPDATE work_orders
    SET
      work_order_number = ?,
      store_id = ?,
      address_line = ?,
      city = ?,
      state = ?,
      zip_code = ?,
      description = ?,
      assigned_dispatcher = ?,
      nte = ?,
      eta_date = ?,
      current_status = ?
    WHERE work_order_id = ?
    LIMIT 1
  `;

  db.query(
    sql,
    [
      work_order_number,
      store_id,
      address_line,
      city,
      state,
      zip_code,
      description,
      assigned_dispatcher,
      nte,
      eta_date,
      status,
      id
    ],
    (err, result) => {
      if (err) {
        console.error('ADMIN UPDATE ERROR:', err);
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Work order number already exists' });
        if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'Invalid store_id (store does not exist)' });

        return res.status(500).json({ message: 'Database error', error: err.code || err.message });
      }
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Work order not found' });
      res.json({ message: 'Updated', work_order_id: id, work_order_number });
    }
  );
});

module.exports = router;