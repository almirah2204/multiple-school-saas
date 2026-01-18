const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireRole } = require('../middleware/authMiddleware');

// GET /users - super admin sees all, school admin sees own school users
router.get('/', requireRole('super_admin', 'school_admin'), async (req, res, next) => {
  try {
    if (req.user.role === 'super_admin') {
      const all = await db.query('SELECT id, email, name, role, school_id, created_at FROM users ORDER BY id DESC');
      return res.json(all.rows);
    } else {
      const result = await db.query('SELECT id, email, name, role, school_id, created_at FROM users WHERE school_id = $1', [req.user.schoolId]);
      return res.json(result.rows);
    }
  } catch (err) { next(err); }
});

// POST /users - create user within the school (super_admin or school_admin)
router.post('/', requireRole('super_admin', 'school_admin'), async (req, res, next) => {
  try {
    const { email, name, role, password } = req.body;
    const schoolId = req.user.role === 'super_admin' ? req.body.school_id : req.user.schoolId;
    if (!schoolId) return res.status(400).json({ error: 'school_id required' });
    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length) return res.status(400).json({ error: 'Email exists' });
    const bcrypt = require('bcrypt');
    const hashed = await bcrypt.hash(password || 'changeme123', 10);
    const result = await db.query(
      'INSERT INTO users (email, password_hash, name, role, school_id, created_at) VALUES ($1,$2,$3,$4,$5,now()) RETURNING id, email, name, role, school_id',
      [email, hashed, name, role || 'teacher', schoolId]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// PUT /users/:id - update user metadata
router.put('/:id', requireRole('super_admin', 'school_admin'), async (req, res, next) => {
  try {
    const { name, role } = req.body;
    const target = await db.query('SELECT school_id FROM users WHERE id = $1', [req.params.id]);
    if (!target.rows.length) return res.status(404).json({ error: 'Not found' });
    const targetSchool = target.rows[0].school_id;
    if (req.user.role === 'school_admin' && req.user.schoolId !== targetSchool) return res.status(403).json({ error: 'Forbidden' });
    await db.query('UPDATE users SET name=$1, role=$2 WHERE id=$3', [name, role, req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// DELETE /users/:id
router.delete('/:id', requireRole('super_admin', 'school_admin'), async (req, res, next) => {
  try {
    const target = await db.query('SELECT school_id FROM users WHERE id = $1', [req.params.id]);
    if (!target.rows.length) return res.status(404).json({ error: 'Not found' });
    if (req.user.role === 'school_admin' && req.user.schoolId !== target.rows[0].school_id) return res.status(403).json({ error: 'Forbidden' });
    await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;