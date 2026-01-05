const express = require('express');
const router = express.Router();
const db = require('../db');

function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });
    if (req.session.user.role !== role) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

/**
 * GET /team-leader/work-orders
 * Team Leader sees ALL work orders + can filter everything.
 * Query params (optional):
 *  - status
 *  - dispatcher_id
 *  - store_id
 *  - client_id
 *  - q (search in description/address/store/client)
 */
router.get('/', requireRole('team_leader'), (req, res) => {
  const { status, dispatcher_id, store_id, client_id, q } = req.query;

  const where = [];
  const params = [];

  if (status) {
    where.push('wo.current_status = ?');
    params.push(status);
  }
  if (dispatcher_id) {
    where.push('wo.assigned_dispatcher = ?');
    params.push(Number(dispatcher_id));
  }
  if (store_id) {
    where.push('wo.store_id = ?');
    params.push(Number(store_id));
  }
  if (client_id) {
    where.push('c.client_id = ?');
    params.push(Number(client_id));
  }
  if (q) {
    where.push(`(
      wo.description LIKE ? OR
      wo.address_line LIKE ? OR
      s.store_name LIKE ? OR
      c.client_name LIKE ?
    )`);
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sql = `
    SELECT 
      wo.work_order_id,
      wo.current_status,
      wo.description,
      wo.address_line,
      wo.city,
      wo.state,
      wo.zip_code,
      wo.store_id,
      wo.assigned_dispatcher,
      u.full_name AS dispatcher_name,
      s.store_name,
      c.client_name,
      c.client_id
    FROM work_orders wo
    LEFT JOIN users u ON wo.assigned_dispatcher = u.user_id
    JOIN stores s ON wo.store_id = s.store_id
    JOIN clients c ON s.client_id = c.client_id
    ${whereSql}
    ORDER BY wo.work_order_id DESC
  `;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('TEAM LEADER LIST ERROR:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});

module.exports = router;
