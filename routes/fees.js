const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireRole } = require('../middleware/authMiddleware');

router.get('/', requireRole('super_admin', 'school_admin', 'parent', 'student'), async (req, res, next) => {
  try {
    const schoolId = req.user.role === 'super_admin' ? req.query.school_id : req.user.schoolId;
    const r = await db.query('SELECT * FROM fees WHERE school_id = $1', [schoolId]);
    res.json(r.rows);
  } catch (err) { next(err); }
});

router.post('/', requireRole('super_admin', 'school_admin'), async (req, res, next) => {
  try {
    const { student_id, amount, due_date } = req.body;
    const schoolId = req.user.role === 'super_admin' ? req.body.school_id : req.user.schoolId;
    const r = await db.query('INSERT INTO fees (student_id, amount, due_date, school_id, status, created_at) VALUES ($1,$2,$3,$4,$5,now()) RETURNING *', [student_id, amount, due_date, schoolId, 'unpaid']);
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', requireRole('super_admin', 'school_admin'), async (req, res, next) => {
  try {
    const { amount, due_date, status } = req.body;
    const rec = await db.query('SELECT school_id FROM fees WHERE id = $1', [req.params.id]);
    if (!rec.rows.length) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'super_admin' && rec.rows[0].school_id !== req.user.schoolId) return res.status(403).json({ error: 'Forbidden' });
    await db.query('UPDATE fees SET amount=$1, due_date=$2, status=$3 WHERE id=$4', [amount, due_date, status, req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/:id', requireRole('super_admin', 'school_admin'), async (req, res, next) => {
  try {
    const rec = await db.query('SELECT school_id FROM fees WHERE id = $1', [req.params.id]);
    if (!rec.rows.length) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'super_admin' && rec.rows[0].school_id !== req.user.schoolId) return res.status(403).json({ error: 'Forbidden' });
    await db.query('DELETE FROM fees WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;