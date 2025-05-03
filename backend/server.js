/*  server.js  */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { captureOrder } from './paypal.js';  // optional: for PayPal verify
import { appendRow }  from './submit.js';    // Google‑Sheet helper

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);
const shows     = require('./data/shows.json');

/* 1️⃣  create the app first */
const app = express();
app.use(cors());
app.use(express.json());

/* 2️⃣  now attach endpoints */
app.get('/api/random-show', (req, res) => {
  const idx = Math.floor(Math.random() * shows.length);
  res.json({ show: shows[idx] });
});

app.use('/audio', express.static(path.join(__dirname, 'data')));

app.post('/api/submit', async (req, res) => {
  const { team, show } = req.body || {};
  if (!team || !show) return res.status(400).json({ error: 'team and show required' });
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
  try {
    await captureOrder(orderID);  // optional, verify PayPal payment
    res.json({ ok: true });
  } catch (err) {
    console.error('PayPal capture error:', err);
    res.status(500).json({ error: 'capture_failed' });
  }
});

import express from 'express';
import path from 'path';
// … your existing imports & app setup …

// 1. Tell Express to serve the React build:
app.use(express.static(path.join(__dirname, '../frontend/build')));

// 2. For any route it doesn’t recognize, send back index.html:
app.get('/*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../frontend', 'build', 'index.html'));
});

// 3. Finally start your server on process.env.PORT (fallback 3001)
const PORT = process.env.PORT || 3001;
http.createServer(app).listen(PORT, () => 
  console.log(`Listening on port ${PORT}`));


/* 3️⃣  start the server */
http.createServer(app).listen(3001, () =>
  console.log('Backend API listening on http://localhost:3001')
);
