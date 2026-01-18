const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireRole } = require('../middleware/authMiddleware');

// POST record
router.post('/', requireRole('teacher', 'school_admin', 'super_admin'), async (req, res, next) => {
  try {
    const { student_id, status, date } = req.body;
    const schoolId = req.user.schoolId;
    const r = await db.query('INSERT INTO attendance (student_id, status, date, school_id, created_at) VALUES ($1,$2,$3,$4,now()) RETURNING *', [student_id, status, date, schoolId]);
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

// GET list
router.get('/', requireRole('teacher', 'school_admin', 'parent', 'student', 'super_admin'), async (req, res, next) => {
  try {
    const schoolId = req.user.role === 'super_admin' ? req.query.school_id : req.user.schoolId;
    const r = await db.query('SELECT * FROM attendance WHERE school_id = $1 ORDER BY date DESC LIMIT 500', [schoolId]);
    res.json(r.rows);
  } catch (err) { next(err); }
});

// PUT update
router.put('/:id', requireRole('teacher', 'school_admin', 'super_admin'), async (req, res, next) => {
  try {
    const { status, date } = req.body;
    // ensure record belongs to user's school unless super_admin
    const rec = await db.query('SELECT school_id FROM attendance WHERE id = $1', [req.params.id]);
    if (!rec.rows.length) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'super_admin' && rec.rows[0].school_id !== req.user.schoolId) return res.status(403).json({ error: 'Forbidden' });

    await db.query('UPDATE attendance SET status=$1, date=$2 WHERE id=$3', [status, date, req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// DELETE
router.delete('/:id', requireRole('teacher', 'school_admin', 'super_admin'), async (req, res, next) => {
  try {
    const rec = await db.query('SELECT school_id FROM attendance WHERE id = $1', [req.params.id]);
    if (!rec.rows.length) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'super_admin' && rec.rows[0].school_id !== req.user.schoolId) return res.status(403).json({ error: 'Forbidden' });
    await db.query('DELETE FROM attendance WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;