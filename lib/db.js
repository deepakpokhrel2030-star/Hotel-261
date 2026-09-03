const { Pool, types } = require('pg');
const bcrypt = require('bcryptjs');

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

  // Admin auth: password-protected + emailed 2FA codes + remembered devices.
  // The password now lives here (hashed), not in an env var, so it can
  // actually be changed via the "forgot password" flow.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_login_challenges (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      purpose TEXT NOT NULL CHECK (purpose IN ('login', 'reset')),
      challenge_token_hash TEXT NOT NULL UNIQUE,
      attempts INTEGER NOT NULL DEFAULT 0,
      expires_at TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      session_token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_trusted_devices (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      device_token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // One-time bootstrap: seed the admin account from the legacy ADMIN_SECRET
  // env var the first time this table is empty, so existing deployments
  // don't lose access when this ships. After this, the password is only
  // ever changed via the reset-password flow, not by editing the env var.
  const { rows: existingAdmins } = await pool.query('SELECT COUNT(*)::int AS count FROM admin_users');
  if (existingAdmins[0].count === 0) {
    if (!process.env.ADMIN_SECRET) {
      throw new Error('ADMIN_SECRET environment variable is required to create the initial admin account.');
    }
    const passwordHash = await bcrypt.hash(process.env.ADMIN_SECRET, 10);
    await pool.query(
      `INSERT INTO admin_users (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING`,
      ['reception@hotel261.com', passwordHash]
    );
  }

  // Light housekeeping so these tables don't grow forever.
  await pool.query(`DELETE FROM admin_login_challenges WHERE expires_at < NOW() - INTERVAL '1 day'`);
  await pool.query(`DELETE FROM admin_sessions WHERE expires_at < NOW()`);
  await pool.query(`DELETE FROM admin_trusted_devices WHERE expires_at < NOW()`);

  return true;
}

module.exports = { pool, initDatabase };
