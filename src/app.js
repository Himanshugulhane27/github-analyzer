require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const profileRoutes = require('./routes/profileRoutes');
const pool = require('./config/db');

const app = express();

// --------------- Middleware ---------------

// Security headers
app.set('trust proxy', 1);
app.use(helmet());

// CORS — allow all origins
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Rate limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use(limiter);

// --------------- Routes ---------------

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// API routes
app.use('/api', profileRoutes);

// --------------- Global Error Handler ---------------

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[GlobalErrorHandler]', err.stack || err.message);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
  });
});

// --------------- Start Server ---------------

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`🚀 GitHub Profile Analyzer API running on port ${PORT}`);

  // Verify DB connectivity on startup
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL database connected successfully');
    connection.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    console.error(
      '   Make sure your .env is configured and the database is running.'
    );
  }
});

module.exports = app;
