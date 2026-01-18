const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';
const ACCESS_EXPIRES_IN = process.env.ACCESS_EXPIRES_IN || '15m'; // short-lived
const REFRESH_EXPIRES_DAYS = parseInt(process.env.REFRESH_EXPIRES_DAYS || '7', 10);

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}

function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function createRefreshToken(userId) {
  const token = uuidv4() + '-' + Math.random().toString(36).slice(2);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS);
  await db.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at, created_at, revoked) VALUES ($1,$2,$3,now(),false)',
    [userId, token, expiresAt]
  );
  return { token, expiresAt };
}

async function revokeRefreshToken(token) {
  await db.query('UPDATE refresh_tokens SET revoked = true WHERE token = $1', [token]);
}

async function findRefreshToken(token) {
  const res = await db.query('SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = false LIMIT 1', [token]);
  return res.rows[0];
}

module.exports = {
  hashPassword,
  comparePassword,
  signAccessToken,
  verifyAccessToken,
  createRefreshToken,
  revokeRefreshToken,
  findRefreshToken
};