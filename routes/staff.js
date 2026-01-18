const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireRole } = require('../middleware/authMiddleware');

router.get('/', requireRole('super_admin', 'school_admin'), async (req, res, next) => {
  try {
    const schoolId = req.user.role === 'super_admin' ? req.query.school_id : req.user.schoolId;
    const r = await db.query('SELECT * FROM staff WHERE school_id = $1', [schoolId]);
    res.json(r.rows);
  } catch (err) { next(err); }
});

router.post('/', requireRole('super_admin', 'school_admin'), async (req, res, next) => {
  try {
    const schoolId = req.user.role === 'super_admin' ? req.body.school_id : req.user.schoolId;
    const { name, role } = req.body;
    const r = await db.query('INSERT INTO staff (name, role_title, school_id, created_at) VALUES ($1,$2,$3,now()) RETURNING *', [name, role, schoolId]);
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;