const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required.');
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('neon.tech') || connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
});

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hotel_bookings (
      id SERIAL PRIMARY KEY,
      guest_name TEXT NOT NULL,
      email TEXT NOT NULL,
      room_type TEXT NOT NULL,
      room_label TEXT NOT NULL,
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      guests INTEGER NOT NULL DEFAULT 1,
      total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      stripe_session_id TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_hotel_bookings_check_in ON hotel_bookings(check_in);
    CREATE INDEX IF NOT EXISTS idx_hotel_bookings_status ON hotel_bookings(status);
  `);

  return true;
}

module.exports = { pool, initDatabase };
