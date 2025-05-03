// backend/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import { captureOrder } from './paypal.js';    // optional: PayPal capture verification
import { appendRow }  from './submit.js';      // Google-Sheets helper

// __dirname workaround for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// allow require() for JSON imports
const require = createRequire(import.meta.url);
const shows  = require('./data/shows.json');

const app = express();

// ─── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// serve your audio files
app.use('/audio', express.static(path.join(__dirname, 'data')));

// ─── API ENDPOINTS ──────────────────────────────────────────────────────────────

// GET /api/random-show
// Returns a random TV show from our list
app.get('/api/random-show', (req, res) => {
  const idx = Math.floor(Math.random() * shows.length);
  res.json({ show: shows[idx] });
});

// POST /api/submit
// Appends [ timestamp, team, show ] to your Google Sheet
app.post('/api/submit', async (req, res) => {
  const { team, show } = req.body || {};
  if (!team || !show) {
    return res.status(400).json({ error: 'team and show required' });
  }
  try {
    await appendRow(team.trim(), show);
    res.json({ ok: true });
  } catch (err) {
    console.error('Sheets append error:', err);
    res.status(500).json({ error: 'sheet append failed' });
  }
});

// POST /api/paypal/capture
// Verifies a PayPal order ID (optional)
app.post('/api/paypal/capture', async (req, res) => {
  const { orderID } = req.body || {};
  if (!orderID) {
    return res.status(400).json({ error: 'orderID required' });
  }
  try {
    await captureOrder(orderID);
    res.json({ ok: true });
  } catch (err) {
    console.error('PayPal capture error:', err);
    res.status(500).json({ error: 'capture_failed' });
  }
});

// ─── SERVE REACT FRONTEND ───────────────────────────────────────────────────────
// Serve the static build files
app.use(express.static(path.join(__dirname, '../frontend/build')));

// For any other route, serve index.html so React Router can handle it
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// ─── START SERVER ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
http.createServer(app).listen(PORT, () => {
  console.log(`Backend API listening on http://localhost:${PORT}`);
});
