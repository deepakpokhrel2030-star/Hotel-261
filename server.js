require('dotenv').config();

const express = require('express');
const path = require('path');
const { pool, initDatabase } = require('./lib/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

app.post('/api/create-checkout-session', require('./api/create-checkout-session'));
app.get('/api/verify-session', require('./api/verify-session'));
app.post('/api/find-booking', require('./api/find-booking'));

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS now');
    res.json({ ok: true, time: result.rows[0].now, database: 'connected' });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Database connection failed.' });
  }
});

app.post('/api/admin/login', require('./api/admin/login'));
app.post('/api/admin/verify-2fa', require('./api/admin/verify-2fa'));
app.post('/api/admin/request-password-reset', require('./api/admin/request-password-reset'));
app.post('/api/admin/reset-password', require('./api/admin/reset-password'));
app.post('/api/admin/logout', require('./api/admin/logout'));
app.get('/api/admin/summary', require('./api/admin/summary'));
app.all('/api/admin/bookings', require('./api/admin/bookings'));
app.patch('/api/admin/bookings/:id/status', (req, res) => {
  req.query = { ...req.query, id: req.params.id };
  return require('./api/admin/bookings/[id]/status')(req, res);
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

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
