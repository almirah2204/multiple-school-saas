const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireRole } = require('../middleware/authMiddleware');

// Common pattern: limit to school scope
router.get('/', requireRole('super_admin', 'school_admin', 'teacher', 'parent', 'student'), async (req, res, next) => {
  try {
    const schoolId = req.user.role === 'super_admin' ? req.query.school_id : req.user.schoolId;
    const result = await db.query('SELECT * FROM students WHERE school_id = $1 ORDER BY id DESC', [schoolId]);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/', requireRole('super_admin', 'school_admin', 'teacher'), async (req, res, next) => {
  try {
    const schoolId = req.user.role === 'super_admin' ? req.body.school_id : req.user.schoolId;
    const { name, roll_no, class_name, parent_contact } = req.body;
    const result = await db.query(
      'INSERT INTO students (name, roll_no, class_name, parent_contact, school_id, created_at) VALUES ($1,$2,$3,$4,$5,now()) RETURNING *',
      [name, roll_no, class_name, parent_contact, schoolId]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', requireRole('super_admin', 'school_admin', 'teacher'), async (req, res, next) => {
  try {
    const { name, roll_no, class_name, parent_contact } = req.body;
    await db.query('UPDATE students SET name=$1, roll_no=$2, class_name=$3, parent_contact=$4 WHERE id=$5', [name, roll_no, class_name, parent_contact, req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/:id', requireRole('super_admin', 'school_admin'), async (req, res, next) => {
  try {
    await db.query('DELETE FROM students WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;