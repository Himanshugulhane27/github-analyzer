require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const profileRoutes = require('./routes/profileRoutes');
const pool = require('./config/db');

const app = express();

// ================= Middleware =================

// Trust Railway proxy
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});

app.use(limiter);

// ================= Routes =================

// Landing Page
app.get('/', (_req, res) => {
  res.status(200).json({
    project: 'GitHub Profile Analyzer API',
    status: 'Running',
    version: '1.0.0',
    description:
      'REST API for analyzing GitHub profiles and storing insights.',
    endpoints: {
      health: 'GET /health',
      analyze: 'POST /api/analyze/:username',
      profiles: 'GET /api/profiles',
      profile: 'GET /api/profiles/:username',
      delete: 'DELETE /api/profiles/:username',
    },
  });
});

// Health Check
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
  });
});

// API Routes
app.use('/api', profileRoutes);

// ================= Global Error Handler =================

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[GlobalErrorHandler]', err.stack || err.message);

  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// ================= Start Server =================

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`🚀 GitHub Profile Analyzer API running on port ${PORT}`);

  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL database connected successfully');
    connection.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    console.error(
      'Make sure your environment variables are configured correctly.'
    );
  }
});

module.exports = app;