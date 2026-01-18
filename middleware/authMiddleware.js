const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';

async function verifyJWT(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];
    if (!token && req.cookies && req.cookies.access_token) token = req.cookies.access_token;
    if (!token) return res.status(401).json({ error: 'Missing token' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await db.query('SELECT id, email, role, school_id FROM users WHERE id = $1', [decoded.id]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'User not found' });
    const user = result.rows[0];
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.school_id
    };
    const headerSchool = req.headers['x-school-id'];
    if (headerSchool && headerSchool !== String(req.user.schoolId) && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'School context mismatch' });
    }
    next();
  } catch (err) {
    console.error('verifyJWT error', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (allowedRoles.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'Forbidden: insufficient role' });
  };
}

module.exports = { verifyJWT, requireRole };