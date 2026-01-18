const express = require('express');
const router = express.Router();
const db = require('../db');
const { hashPassword, comparePassword, signAccessToken, createRefreshToken, revokeRefreshToken, findRefreshToken } = require('../auth');
const { validateSignup, validateLogin } = require('../utils/validators');
const { requireRole } = require('../middleware/authMiddleware');

// cookie options
const isProd = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  // maxAge not set here for access token (short lived). Refresh token cookie will have maxAge
};

// helper to set access and refresh cookies
async function setTokensOnResponse(res, user) {
  const accessToken = signAccessToken({ id: user.id, role: user.role, schoolId: user.school_id });
  const refresh = await createRefreshToken(user.id);
  // access token cookie (short-lived)
  res.cookie('access_token', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000 // 15 minutes
  });
  // refresh token cookie (long-lived)
  res.cookie('refresh_token', refresh.token, {
    ...cookieOptions,
    maxAge: Math.max(1, (process.env.REFRESH_EXPIRES_DAYS ? parseInt(process.env.REFRESH_EXPIRES_DAYS, 10) : 7)) * 24 * 60 * 60 * 1000
  });
}

// POST /auth/signup
router.post('/signup', async (req, res, next) => {
  try {
    const { error } = validateSignup(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password, name, role, school_name } = req.body;
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(400).json({ error: 'Email already exists' });

    let schoolId = null;
    if (role === 'school_admin') {
      if (!school_name) return res.status(400).json({ error: 'school_name is required for school_admin signup' });
      const schoolRes = await db.query('INSERT INTO schools (name, created_at) VALUES ($1, now()) RETURNING id', [school_name]);
      schoolId = schoolRes.rows[0].id;
      const planRes = await db.query('SELECT id FROM plans WHERE slug = $1 LIMIT 1', ['free_trial']);
      const planId = planRes.rows[0] ? planRes.rows[0].id : null;
      if (planId) {
        await db.query('INSERT INTO subscriptions (school_id, plan_id, status, starts_at) VALUES ($1,$2,$3,now())', [schoolId, planId, 'active']);
      }
    }

    const hashed = await hashPassword(password);
    const userRes = await db.query(
      'INSERT INTO users (email, password_hash, name, role, school_id, created_at) VALUES ($1,$2,$3,$4,$5,now()) RETURNING id, email, role, school_id, name',
      [email, hashed, name, role || 'student', schoolId]
    );
    const user = userRes.rows[0];

    await setTokensOnResponse(res, user);
    // return minimal user info (avoid sending tokens in body)
    res.json({ user: { id: user.id, email: user.email, role: user.role, schoolId: user.school_id, name: user.name } });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { error } = validateLogin(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password } = req.body;
    const result = await db.query('SELECT id, email, password_hash, role, school_id, name FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const valid = await comparePassword(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    await setTokensOnResponse(res, user);
    res.json({ user: { id: user.id, email: user.email, role: user.role, schoolId: user.school_id, name: user.name } });
  } catch (err) {
    next(err);
  }
});

// POST /auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies['refresh_token'];
    if (!token) return res.status(401).json({ error: 'No refresh token' });

    const row = await findRefreshToken(token);
    if (!row) return res.status(401).json({ error: 'Invalid refresh token' });
    if (new Date(row.expires_at) < new Date()) return res.status(401).json({ error: 'Refresh token expired' });

    // fetch user
    const userRes = await db.query('SELECT id, email, role, school_id, name FROM users WHERE id = $1 LIMIT 1', [row.user_id]);
    if (!userRes.rows.length) return res.status(401).json({ error: 'User not found' });
    const user = userRes.rows[0];

    // revoke old refresh token and issue a new one
    await revokeRefreshToken(token);
    await setTokensOnResponse(res, user);

    res.json({ user: { id: user.id, email: user.email, role: user.role, schoolId: user.school_id, name: user.name } });
  } catch (err) {
    next(err);
  }
});

// POST /auth/logout
router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies['refresh_token'];
    if (token) {
      await revokeRefreshToken(token);
    }
    // clear cookies
    res.clearCookie('access_token', { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax' });
    res.clearCookie('refresh_token', { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /auth/me
router.get('/me', async (req, res, next) => {
  try {
    // try to read access_token cookie
    const access = req.cookies['access_token'] || null;
    if (!access) return res.status(401).json({ error: 'Unauthenticated' });

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(access, process.env.JWT_SECRET || 'change_me');
    const userRes = await db.query('SELECT id, email, role, school_id, name FROM users WHERE id = $1 LIMIT 1', [decoded.id]);
    if (!userRes.rows.length) return res.status(401).json({ error: 'Unauthenticated' });
    const user = userRes.rows[0];
    res.json({ user: { id: user.id, email: user.email, role: user.role, schoolId: user.school_id, name: user.name } });
  } catch (err) {
    // on token expiry or invalid token, return 401
    return res.status(401).json({ error: 'Unauthenticated' });
  }
});

module.exports = router;