const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireRole } = require('../middleware/authMiddleware');

router.get('/', requireRole('super_admin', 'school_admin', 'teacher', 'student', 'parent'), async (req, res, next) => {
  try {
    const schoolId = req.user.role === 'super_admin' ? req.query.school_id : req.user.schoolId;
    const r = await db.query('SELECT * FROM timetable WHERE school_id = $1', [schoolId]);
    res.json(r.rows);
  } catch (err) { next(err); }
});

router.post('/', requireRole('super_admin', 'school_admin'), async (req, res, next) => {
  try {
    const { day, slot, subject, teacher_id } = req.body;
    const schoolId = req.user.role === 'super_admin' ? req.body.school_id : req.user.schoolId;
    const r = await db.query('INSERT INTO timetable (day, slot, subject, teacher_id, school_id, created_at) VALUES ($1,$2,$3,$4,$5,now()) RETURNING *', [day, slot, subject, teacher_id, schoolId]);
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', requireRole('super_admin', 'school_admin'), async (req, res, next) => {
  try {
    const { day, slot, subject, teacher_id } = req.body;
    const rec = await db.query('SELECT school_id FROM timetable WHERE id = $1', [req.params.id]);
    if (!rec.rows.length) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'super_admin' && rec.rows[0].school_id !== req.user.schoolId) return res.status(403).json({ error: 'Forbidden' });
    await db.query('UPDATE timetable SET day=$1, slot=$2, subject=$3, teacher_id=$4 WHERE id=$5', [day, slot, subject, teacher_id, req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/:id', requireRole('super_admin', 'school_admin'), async (req, res, next) => {
  try {
    const rec = await db.query('SELECT school_id FROM timetable WHERE id = $1', [req.params.id]);
    if (!rec.rows.length) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'super_admin' && rec.rows[0].school_id !== req.user.schoolId) return res.status(403).json({ error: 'Forbidden' });
    await db.query('DELETE FROM timetable WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;