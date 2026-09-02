const { Pool, types } = require('pg');

// Return DATE columns (OID 1082) as the raw 'YYYY-MM-DD' string instead of a
// JS Date. node-pg's default parser builds that Date at local midnight, and
// formatting it back out with toISOString() converts to UTC — which rolls
// the date back a day in any timezone ahead of UTC (e.g. BST). Dates in this
// app are always calendar dates, never a specific instant, so a plain string
// is both simpler and correct.
types.setTypeParser(1082, (value) => value);

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

  // Added after the initial launch, for the adults/children/rooms occupancy
  // picker — existing rows default to 1 room (how every prior booking worked).
  await pool.query(`
    ALTER TABLE hotel_bookings ADD COLUMN IF NOT EXISTS rooms INTEGER NOT NULL DEFAULT 1;
  `);

  // Added for the multi-room-type cart: one booking can now cover several
  // room types at once, so the per-item detail (type, quantity, price) lives
  // here as JSON. NULL for bookings made before this existed or via the admin
  // dashboard's quick-add form — those are always a single room type, and the
  // flat room_type/room_label/rooms columns above already describe them fully.
  await pool.query(`
    ALTER TABLE hotel_bookings ADD COLUMN IF NOT EXISTS items JSONB;
  `);

  // Added so guests can look up a booking by phone number as well as email
  // on the Check Booking page. NULL for bookings made before this existed —
  // those can still be found by email.
  await pool.query(`
    ALTER TABLE hotel_bookings ADD COLUMN IF NOT EXISTS phone TEXT;
  `);

  return true;
}

module.exports = { pool, initDatabase };
