// backend/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import { captureOrder } from './paypal.js';
import { appendRow }  from './submit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);
const shows     = require('./data/shows.json');

const app = express();

app.use(cors());
app.use(express.json());

// serve audio files
app.use('/audio', express.static(path.join(__dirname, 'data')));

// ── API ROUTES ────────────────────────────────────────────────────

app.get('/api/random-show', (req, res) => {
  const idx = Math.floor(Math.random() * shows.length);
  res.json({ show: shows[idx] });
});

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

// ── SERVE REACT FRONTEND ───────────────────────────────────────────

// 1️⃣ Serve the static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/build')));

// 2️⃣ Fallback for any other requests — no path pattern, so no path-to-regexp parsing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// ── START SERVER ───────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
http.createServer(app).listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
