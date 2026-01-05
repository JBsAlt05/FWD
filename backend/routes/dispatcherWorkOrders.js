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

/**
 * GET /dispatcher/work-orders
 * Dispatcher sees ONLY work orders assigned to them.
 */
router.get('/', requireRole('dispatcher'), (req, res) => {
  const dispatcherId = req.session.user.user_id;

  const sql = `
    SELECT 
      wo.work_order_id,
      wo.work_order_number,
      wo.current_status,
      wo.nte AS nte_amount,
      DATE_FORMAT(wo.eta_date, '%Y-%m-%d') AS eta_date,
      wo.description,
      wo.address_line,
      wo.city,
      wo.state,
      wo.zip_code,
      wo.store_id,
      wo.assigned_dispatcher,
      s.store_name,
      c.client_name
    FROM work_orders wo
    JOIN stores s ON wo.store_id = s.store_id
    JOIN clients c ON s.client_id = c.client_id
    WHERE wo.assigned_dispatcher = ?
    ORDER BY wo.work_order_id DESC
  `;

  db.query(sql, [dispatcherId], (err, results) => {
    if (err) {
      console.error('DISPATCHER LIST ERROR:', err);
      return res.status(500).json({ message: 'Database error', error: err.code || err.message });
    }
    res.json(results);
  });
});

module.exports = router;