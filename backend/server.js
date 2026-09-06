require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { connectDB } = require('./config/db');
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB (with graceful fallback)
connectDB();

// Enable CORS for frontend development
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve frontend build if exists
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist', 'frontend', 'browser');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 M-PESA Backend server running on http://localhost:${PORT} and http://192.168.100.40:${PORT}`);
});

// Only run local self-signed HTTPS server when running locally (not on Render/cloud)
if (!process.env.RENDER && process.env.NODE_ENV !== 'production') {
  try {
    const https = require('https');
    const selfsigned = require('selfsigned');
    const pems = selfsigned.generate(
      [
        { name: 'commonName', value: '192.168.100.40' },
        { name: 'organizationName', value: 'Safaricom M-PESA' }
      ],
      { days: 365, keySize: 2048 }
    );
    const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
    const httpsServer = https.createServer({ key: pems.private, cert: pems.cert }, app);
    httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
      console.log(`🔒 Local HTTPS server running on https://localhost:${HTTPS_PORT} and https://192.168.100.40:${HTTPS_PORT}`);
    });
  } catch (e) {
    console.warn('HTTPS server initialization skipped:', e.message);
  }
}

