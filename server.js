require('dotenv').config();

const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { pool, initDatabase } = require('./lib/db');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_SECRET = process.env.ADMIN_SECRET;
if (!ADMIN_SECRET) {
  throw new Error('ADMIN_SECRET environment variable is required.');
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

app.post('/api/create-checkout-session', require('./api/create-checkout-session'));
app.get('/api/verify-session', require('./api/verify-session'));
app.post('/api/find-booking', require('./api/find-booking'));

function requireAdmin(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : req.headers['x-admin-token'];

  if (token !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized. Use the admin password.' });
  }

  next();
}

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS now');
    res.json({ ok: true, time: result.rows[0].now, database: 'connected' });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Database connection failed.' });
  }
});

app.post('/api/admin/login', (req, res) => {
  const password = String(req.body.password || '').trim();

  if (!password || password !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Incorrect admin password.' });
  }

  res.json({ ok: true, token: ADMIN_SECRET, message: 'Authorized' });
});

app.get('/api/admin/summary', requireAdmin, async (req, res) => {
  try {
    const summary = await pool.query(`
      SELECT
        COUNT(*)::int AS total_bookings,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0)::int AS pending,
        COALESCE(SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END), 0)::int AS confirmed,
        COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0)::int AS cancelled,
        COALESCE(SUM(CASE WHEN status = 'confirmed' THEN total_amount ELSE 0 END), 0)::numeric AS confirmed_revenue
      FROM hotel_bookings;
    `);

    const upcoming = await pool.query(`
      SELECT COUNT(*)::int AS upcoming
      FROM hotel_bookings
      WHERE check_in >= CURRENT_DATE AND status IN ('pending', 'confirmed');
    `);

    res.json({
      ...summary.rows[0],
      upcoming: upcoming.rows[0]?.upcoming || 0,
    });
  } catch (error) {
    console.error('admin summary error:', error);
    res.status(500).json({ error: 'Could not load booking summary.' });
  }
});

app.get('/api/admin/bookings', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM hotel_bookings
      ORDER BY created_at DESC
      LIMIT 200;
    `);
    res.json({ bookings: result.rows });
  } catch (error) {
    console.error('admin bookings error:', error);
    res.status(500).json({ error: 'Could not load bookings.' });
  }
});

app.post('/api/admin/bookings', requireAdmin, async (req, res) => {
  const { guestName, email, roomType, roomLabel, checkIn, checkOut, guests, totalAmount, status = 'pending', notes = '' } = req.body || {};

  if (!guestName || !email || !roomType || !roomLabel || !checkIn || !checkOut) {
    return res.status(400).json({ error: 'Missing required booking details.' });
  }

  try {
    const result = await pool.query(
      `
        INSERT INTO hotel_bookings (
          guest_name, email, room_type, room_label, check_in, check_out, guests, total_amount, status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
      `,
      [guestName.trim(), email.trim(), roomType, roomLabel, checkIn, checkOut, Number(guests || 1), Number(totalAmount || 0), status, notes]
    );

    res.status(201).json({ booking: result.rows[0] });
  } catch (error) {
    console.error('create admin booking error:', error);
    res.status(500).json({ error: 'Could not create booking.' });
  }
});

app.patch('/api/admin/bookings/:id/status', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};

  if (!status) {
    return res.status(400).json({ error: 'A status is required.' });
  }

  try {
    const result = await pool.query(
      `UPDATE hotel_bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;`,
      [status, id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    res.json({ booking: result.rows[0] });
  } catch (error) {
    console.error('update booking status error:', error);
    res.status(500).json({ error: 'Could not update booking status.' });
  }
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
