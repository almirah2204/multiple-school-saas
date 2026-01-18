const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireRole } = require('../middleware/authMiddleware');

// GET /schools - Super Admin sees all, School Admin sees own
router.get('/', requireRole('super_admin', 'school_admin'), async (req, res, next) => {
  try {
    if (req.user.role === 'super_admin') {
      const all = await db.query('SELECT * FROM schools ORDER BY id DESC');
      return res.json(all.rows);
    } else {
      const one = await db.query('SELECT * FROM schools WHERE id = $1', [req.user.schoolId]);
      return res.json(one.rows[0]);
    }
  } catch (err) { next(err); }
});

// PUT /schools/:id - update (super_admin or school_admin for own)
router.put('/:id', requireRole('super_admin', 'school_admin'), async (req, res, next) => {
  try {
    const id = req.params.id;
    if (req.user.role === 'school_admin' && String(req.user.schoolId) !== id) {
      return res.status(403).json({ error: 'Cannot edit other schools' });
    }
    const { name, settings } = req.body;
    await db.query('UPDATE schools SET name = $1, settings = $2, updated_at = now() WHERE id = $3', [name, settings || {}, id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /schools - create (super_admin)
router.post('/', requireRole('super_admin'), async (req, res, next) => {
  try {
    const { name } = req.body;
    const result = await db.query('INSERT INTO schools (name, created_at) VALUES ($1, now()) RETURNING *', [name]);
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /schools/:id
router.delete('/:id', requireRole('super_admin'), async (req, res, next) => {
  try {
    await db.query('DELETE FROM schools WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;