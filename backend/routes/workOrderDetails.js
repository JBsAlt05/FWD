const express = require('express');
const router = express.Router();
const db = require('../db');

const path = require('path');
const fs = require('fs');
const multer = require('multer');

// -------------------- Auth helpers --------------------
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Not logged in' });
  }
  next();
}

function requireDispatcher(req, res, next) {
  const u = req.session.user || {};
  const role = String(u.role || u.role_name || '').toLowerCase();
  if (role && role !== 'dispatcher') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}

// -------------------- Multer (uploads) --------------------
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const woId = req.params.id;
    const fileType = String(req.body.file_type || 'document').trim();

    const allowed = new Set(['before', 'after', 'signoff', 'document']);
    const safeType = allowed.has(fileType) ? fileType : 'document';

    const dest = path.join(__dirname, '..', 'uploads', 'work-orders', String(woId), safeType);
    ensureDir(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ext && ext.length <= 10 ? ext : '';
    cb(null, `${Date.now()}_${Math.floor(Math.random() * 1e9)}${safeExt}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 }
});

// -------------------- Status list (EXACT) --------------------
const allowedStatuses = new Set([
  'Assigned','Secured','Awaiting Approval','Awaiting Advice','Onsite','Job Done',
  'Needs Proposal','Approved Scheduled','Approved Pending','Return Trip Needed',
  'Parts Needed','Parts Ordered','Billed For Incurred','Ready To Invoice',
  'Invoiced','Recall','Paid','Canceled'
]);

// =========================================================
// Helpers
// =========================================================
function cleanWoNumber(v) {
  return (v ?? '').toString().trim();
}
function validateWoNumber(wo) {
  if (!wo) return 'work order number is required';
  if (wo.length > 50) return 'work order number too long (max 50)';
  return null;
}

// =========================================================
// GET /work-orders/:id/details  (existing)
// =========================================================
router.get('/:id/details', requireLogin, requireDispatcher, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid work order id' });
  }

  const woSql = `
    SELECT
      wo.work_order_id,
      wo.work_order_number,
      wo.current_status,
      wo.description,
      wo.address_line,
      wo.city,
      wo.state,
      wo.zip_code,
      s.store_id,
      s.store_name,
      c.client_id,
      c.client_name,
      wo.nte AS nte_amount,
      DATE_FORMAT(wo.eta_date, '%Y-%m-%d') AS eta_date
    FROM work_orders wo
    JOIN stores s ON s.store_id = wo.store_id
    JOIN clients c ON c.client_id = s.client_id
    WHERE wo.work_order_id = ?
    LIMIT 1
  `;

  db.query(woSql, [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (!results.length) return res.status(404).json({ message: 'Work order not found' });

    const wo = results[0];

    const notesSql = `
      SELECT n.note_id, n.note_text, n.user_id, u.full_name
      FROM notes n
      LEFT JOIN users u ON u.user_id = n.user_id
      WHERE n.work_order_id = ?
      ORDER BY n.note_id DESC
      LIMIT 50
    `;

    db.query(notesSql, [id], (e2, notes) => {
      if (e2) return res.status(500).json({ message: 'Notes query error', error: e2 });
      res.json({ workOrder: wo, notes });
    });
  });
});

// =========================================================
// ✅ NEW: GET /work-orders/by-number/:woNumber/details
// =========================================================
router.get('/by-number/:woNumber/details', requireLogin, requireDispatcher, (req, res) => {
  const woNumber = cleanWoNumber(req.params.woNumber);
  const errMsg = validateWoNumber(woNumber);
  if (errMsg) return res.status(400).json({ message: errMsg });

  const woSql = `
    SELECT
      wo.work_order_id,
      wo.work_order_number,
      wo.current_status,
      wo.description,
      wo.address_line,
      wo.city,
      wo.state,
      wo.zip_code,
      s.store_id,
      s.store_name,
      c.client_id,
      c.client_name,
      wo.nte AS nte_amount,
      DATE_FORMAT(wo.eta_date, '%Y-%m-%d') AS eta_date
    FROM work_orders wo
    JOIN stores s ON s.store_id = wo.store_id
    JOIN clients c ON c.client_id = s.client_id
    WHERE wo.work_order_number = ?
    LIMIT 1
  `;

  db.query(woSql, [woNumber], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (!results.length) return res.status(404).json({ message: 'Work order not found' });

    const wo = results[0];

    const notesSql = `
      SELECT n.note_id, n.note_text, n.user_id, u.full_name
      FROM notes n
      LEFT JOIN users u ON u.user_id = n.user_id
      WHERE n.work_order_id = ?
      ORDER BY n.note_id DESC
      LIMIT 50
    `;

    db.query(notesSql, [wo.work_order_id], (e2, notes) => {
      if (e2) return res.status(500).json({ message: 'Notes query error', error: e2 });
      res.json({ workOrder: wo, notes });
    });
  });
});

// =========================================================
// POST /work-orders/:id/notes  (existing)
// =========================================================
router.post('/:id/notes', requireLogin, requireDispatcher, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid work order id' });
  }

  const note = String(req.body.note || '').trim();
  if (!note) return res.status(400).json({ message: 'Note is required' });

  const userId = req.session.user.user_id;
  if (!userId) {
    return res.status(400).json({ message: 'Session missing user_id. Fix auth session user.' });
  }

  const sql = `
    INSERT INTO notes (work_order_id, user_id, note_text)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [id, userId, note], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.status(201).json({ message: 'Note added', note_id: result.insertId });
  });
});

// =========================================================
// ✅ NEW: POST /work-orders/by-number/:woNumber/notes
// =========================================================
router.post('/by-number/:woNumber/notes', requireLogin, requireDispatcher, (req, res) => {
  const woNumber = cleanWoNumber(req.params.woNumber);
  const errMsg = validateWoNumber(woNumber);
  if (errMsg) return res.status(400).json({ message: errMsg });

  const note = String(req.body.note || '').trim();
  if (!note) return res.status(400).json({ message: 'Note is required' });

  const userId = req.session.user.user_id;
  if (!userId) return res.status(400).json({ message: 'Session missing user_id' });

  db.query(
    `SELECT work_order_id FROM work_orders WHERE work_order_number = ? LIMIT 1`,
    [woNumber],
    (e1, rows) => {
      if (e1) return res.status(500).json({ message: 'Database error', error: e1 });
      if (!rows.length) return res.status(404).json({ message: 'Work order not found' });

      const id = rows[0].work_order_id;

      const sql = `INSERT INTO notes (work_order_id, user_id, note_text) VALUES (?, ?, ?)`;
      db.query(sql, [id, userId, note], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ message: 'Note added', note_id: result.insertId });
      });
    }
  );
});

// =========================================================
// PUT /work-orders/:id/status  (existing)
// =========================================================
router.put('/:id/status', requireLogin, requireDispatcher, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid work order id' });
  }

  const status = String(req.body.status || '').trim();
  if (!status) return res.status(400).json({ message: 'Status is required' });

  if (!allowedStatuses.has(status)) {
    return res.status(400).json({
      message: 'Invalid status value',
      allowed: Array.from(allowedStatuses)
    });
  }

  const sql = `
    UPDATE work_orders
    SET current_status = ?
    WHERE work_order_id = ?
    LIMIT 1
  `;

  db.query(sql, [status, id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Work order not found' });

    res.json({ message: 'Status updated', work_order_id: id, current_status: status });
  });
});

// =========================================================
// ✅ NEW: PUT /work-orders/by-number/:woNumber/status
// =========================================================
router.put('/by-number/:woNumber/status', requireLogin, requireDispatcher, (req, res) => {
  const woNumber = cleanWoNumber(req.params.woNumber);
  const errMsg = validateWoNumber(woNumber);
  if (errMsg) return res.status(400).json({ message: errMsg });

  const status = String(req.body.status || '').trim();
  if (!status) return res.status(400).json({ message: 'Status is required' });

  if (!allowedStatuses.has(status)) {
    return res.status(400).json({ message: 'Invalid status value', allowed: Array.from(allowedStatuses) });
  }

  const sql = `
    UPDATE work_orders
    SET current_status = ?
    WHERE work_order_number = ?
    LIMIT 1
  `;

  db.query(sql, [status, woNumber], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Work order not found' });

    res.json({ message: 'Status updated', work_order_number: woNumber, current_status: status });
  });
});

// =========================================================
// POST /work-orders/:id/files  (existing)
// =========================================================
router.post('/:id/files', requireLogin, requireDispatcher, upload.single('file'), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid work order id' });
  }

  const fileType = String(req.body.file_type || '').trim();
  const allowed = new Set(['before', 'after', 'signoff', 'document']);
  if (!allowed.has(fileType)) return res.status(400).json({ message: 'Invalid file_type' });

  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const relPath = path
    .join('work-orders', String(id), fileType, req.file.filename)
    .replaceAll('\\', '/');

  const sql = `
    INSERT INTO files (work_order_id, file_name, file_type, file_data)
    VALUES (?, ?, ?, NULL)
  `;

  db.query(sql, [id, relPath, fileType], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });

    res.status(201).json({
      message: 'File uploaded',
      file_id: result.insertId,
      file_type: fileType,
      file_name: relPath,
      url: `/uploads/${relPath}`
    });
  });
});

// =========================================================
// GET /work-orders/:id/files  (existing)
// =========================================================
router.get('/:id/files', requireLogin, requireDispatcher, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid work order id' });
  }

  const sql = `
    SELECT file_id, file_name, file_type
    FROM files
    WHERE work_order_id = ?
    ORDER BY file_id DESC
  `;

  db.query(sql, [id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });

    const out = { before: [], after: [], signoff: [] };

    for (const r of rows) {
      const t = String(r.file_type || '').trim();
      if (!out[t]) continue;

      out[t].push({
        file_id: r.file_id,
        file_type: t,
        file_name: r.file_name,
        url: `/uploads/${r.file_name}`
      });
    }

    res.json(out);
  });
});

// =========================================================
// ✅ NEW: GET /work-orders/by-number/:woNumber/files
// =========================================================
router.get('/by-number/:woNumber/files', requireLogin, requireDispatcher, (req, res) => {
  const woNumber = cleanWoNumber(req.params.woNumber);
  const errMsg = validateWoNumber(woNumber);
  if (errMsg) return res.status(400).json({ message: errMsg });

  db.query(
    `SELECT work_order_id FROM work_orders WHERE work_order_number = ? LIMIT 1`,
    [woNumber],
    (e1, rows) => {
      if (e1) return res.status(500).json({ message: 'Database error', error: e1 });
      if (!rows.length) return res.status(404).json({ message: 'Work order not found' });

      const id = rows[0].work_order_id;

      const sql = `
        SELECT file_id, file_name, file_type
        FROM files
        WHERE work_order_id = ?
        ORDER BY file_id DESC
      `;

      db.query(sql, [id], (err, files) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });

        const out = { before: [], after: [], signoff: [] };

        for (const r of files) {
          const t = String(r.file_type || '').trim();
          if (!out[t]) continue;

          out[t].push({
            file_id: r.file_id,
            file_type: t,
            file_name: r.file_name,
            url: `/uploads/${r.file_name}`
          });
        }

        res.json(out);
      });
    }
  );
});

module.exports = router;