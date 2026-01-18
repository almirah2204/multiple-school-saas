const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireRole } = require('../middleware/authMiddleware');

router.post('/', requireRole('teacher', 'school_admin'), async (req, res, next) => {
  try {
    const { student_id, subject, marks, term } = req.body;
    const schoolId = req.user.role === 'super_admin' ? req.body.school_id : req.user.schoolId;
    const r = await db.query('INSERT INTO results (student_id, subject, marks, term, school_id, created_at) VALUES ($1,$2,$3,$4,$5,now()) RETURNING *', [student_id, subject, marks, term, schoolId]);
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

router.get('/', requireRole('teacher', 'school_admin', 'student', 'parent', 'super_admin'), async (req, res, next) => {
  try {
    const schoolId = req.user.role === 'super_admin' ? req.query.school_id : req.user.schoolId;
    const r = await db.query('SELECT * FROM results WHERE school_id = $1 ORDER BY created_at DESC', [schoolId]);
    res.json(r.rows);
  } catch (err) { next(err); }
});

router.put('/:id', requireRole('teacher', 'school_admin'), async (req, res, next) => {
  try {
    const { subject, marks, term } = req.body;
    const rec = await db.query('SELECT school_id FROM results WHERE id = $1', [req.params.id]);
    if (!rec.rows.length) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'super_admin' && rec.rows[0].school_id !== req.user.schoolId) return res.status(403).json({ error: 'Forbidden' });
    await db.query('UPDATE results SET subject=$1, marks=$2, term=$3 WHERE id=$4', [subject, marks, term, req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/:id', requireRole('teacher', 'school_admin'), async (req, res, next) => {
  try {
    const rec = await db.query('SELECT school_id FROM results WHERE id = $1', [req.params.id]);
    if (!rec.rows.length) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'super_admin' && rec.rows[0].school_id !== req.user.schoolId) return res.status(403).json({ error: 'Forbidden' });
    await db.query('DELETE FROM results WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;