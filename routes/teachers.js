const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireRole } = require('../middleware/authMiddleware');

router.get('/', requireRole('super_admin', 'school_admin', 'teacher'), async (req, res, next) => {
  try {
    const schoolId = req.user.role === 'super_admin' ? req.query.school_id : req.user.schoolId;
    const result = await db.query('SELECT * FROM teachers WHERE school_id = $1 ORDER BY id DESC', [schoolId]);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/', requireRole('super_admin', 'school_admin'), async (req, res, next) => {
  try {
    const schoolId = req.user.role === 'super_admin' ? req.body.school_id : req.user.schoolId;
    const { name, subject, email } = req.body;
    const result = await db.query('INSERT INTO teachers (name, subject, email, school_id, created_at) VALUES ($1,$2,$3,$4,now()) RETURNING *', [name, subject, email, schoolId]);
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;