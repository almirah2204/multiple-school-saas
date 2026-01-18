const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireRole } = require('../middleware/authMiddleware');

router.get('/', async (req, res, next) => {
  try {
    const schoolId = req.user ? (req.user.role === 'super_admin' ? req.query.school_id : req.user.schoolId) : req.query.school_id;
    const r = await db.query('SELECT * FROM noticeboard WHERE school_id = $1 ORDER BY created_at DESC', [schoolId]);
    res.json(r.rows);
  } catch (err) { next(err); }
});

router.post('/', requireRole('teacher', 'school_admin', 'super_admin'), async (req, res, next) => {
  try {
    const { title, body } = req.body;
    const schoolId = req.user.role === 'super_admin' ? req.body.school_id : req.user.schoolId;
    const r = await db.query('INSERT INTO noticeboard (title, body, school_id, created_at) VALUES ($1,$2,$3,now()) RETURNING *', [title, body, schoolId]);
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', requireRole('teacher', 'school_admin', 'super_admin'), async (req, res, next) => {
  try {
    const { title, body } = req.body;
    const rec = await db.query('SELECT school_id FROM noticeboard WHERE id = $1', [req.params.id]);
    if (!rec.rows.length) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'super_admin' && rec.rows[0].school_id !== req.user.schoolId) return res.status(403).json({ error: 'Forbidden' });
    await db.query('UPDATE noticeboard SET title=$1, body=$2 WHERE id=$3', [title, body, req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/:id', requireRole('teacher', 'school_admin', 'super_admin'), async (req, res, next) => {
  try {
    const rec = await db.query('SELECT school_id FROM noticeboard WHERE id = $1', [req.params.id]);
    if (!rec.rows.length) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'super_admin' && rec.rows[0].school_id !== req.user.schoolId) return res.status(403).json({ error: 'Forbidden' });
    await db.query('DELETE FROM noticeboard WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;