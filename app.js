const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const schoolsRoutes = require('./routes/schools');
/* ... other route imports ... */
const stripeRoutes = require('./routes/stripe');

const { verifyJWT } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 4000;

// allow credentials for cookies
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(cookieParser());
// need raw body for stripe webhook route; set verify to save rawBody
app.use(bodyParser.json({
  verify: (req, res, buf) => { req.rawBody = buf; }
}));

// public auth routes (login will set cookies)
app.use('/auth', authRoutes);

// stripe webhook uses raw body
app.use('/stripe', stripeRoutes);

// protected routes require verifyJWT (reads cookie or header)
app.use('/schools', verifyJWT, schoolsRoutes);
/* ... other protected routes ... */

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});