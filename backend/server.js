require('dotenv').config();

const express = require('express');
const path = require('path');
const { pool, initDatabase } = require('./lib/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

// Mirrors vercel.json's per-folder rewrites for the frontend assets, and
// keeps the rest of the repo (server.js, package.json, .env, etc.) from
// being served as static files the way a single blanket static root would.
app.use('/css', express.static(path.join(FRONTEND_DIR, 'css')));
app.use('/js', express.static(path.join(FRONTEND_DIR, 'js')));
app.use('/images', express.static(path.join(FRONTEND_DIR, 'images')));
app.use('/i18n', express.static(path.join(FRONTEND_DIR, 'i18n')));
app.get('/robots.txt', (req, res) => res.sendFile(path.join(FRONTEND_DIR, 'robots.txt')));
app.get('/sitemap.xml', (req, res) => res.sendFile(path.join(FRONTEND_DIR, 'sitemap.xml')));

// api/ has to stay at the project root (Vercel only auto-detects serverless
// functions there, not inside backend/), so it's reached via ../api from here.
app.post('/api/create-checkout-session', require('../api/create-checkout-session'));
app.get('/api/verify-session', require('../api/verify-session'));
app.post('/api/find-booking', require('../api/find-booking'));

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS now');
    res.json({ ok: true, time: result.rows[0].now, database: 'connected' });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Database connection failed.' });
  }
});

app.post('/api/admin/login', require('../api/admin/login'));
app.post('/api/admin/verify-2fa', require('../api/admin/verify-2fa'));
app.post('/api/admin/request-password-reset', require('../api/admin/request-password-reset'));
app.post('/api/admin/reset-password', require('../api/admin/reset-password'));
app.post('/api/admin/logout', require('../api/admin/logout'));
app.get('/api/admin/summary', require('../api/admin/summary'));
app.all('/api/admin/bookings', require('../api/admin/bookings'));
app.patch('/api/admin/bookings/:id/status', (req, res) => {
  req.query = { ...req.query, id: req.params.id };
  return require('../api/admin/bookings/[id]/status')(req, res);
});

// Mirrors vercel.json's rewrites, so clean URLs work the same in local dev as in production.
const CLEAN_URL_PAGES = {
  '/': 'index.html',
  '/admin': 'admin.html',
  '/about': 'about.html',
  '/rooms': 'rooms.html',
  '/gallery': 'gallery.html',
  '/amenities': 'amenities.html',
  '/reviews': 'reviews.html',
  '/location': 'location.html',
  '/book': 'book.html',
  '/booking-success': 'booking-success.html',
  '/check-booking': 'check-booking.html',
};

for (const [route, file] of Object.entries(CLEAN_URL_PAGES)) {
  app.get(route, (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'pages', file));
  });
}

app.get('/health', (req, res) => {
  res.json({ ok: true, server: 'running' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Hotel 261 backend running on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
