const { pool } = require('../../backend/lib/db');
const { requireAdmin } = require('../../backend/lib/admin');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return requireAdmin(req, res, async () => {
      try {
        const result = await pool.query(`
          SELECT *
          FROM hotel_bookings
          ORDER BY created_at DESC
          LIMIT 200;
        `);
        return res.status(200).json({ bookings: result.rows });
      } catch (error) {
        console.error('admin bookings error:', error);
        return res.status(500).json({ error: 'Could not load bookings.' });
      }
    });
  }

  if (req.method === 'POST') {
    return requireAdmin(req, res, async () => {
      const body = req.body || {};
      const { guestName, email, roomType, roomLabel, checkIn, checkOut, guests, totalAmount, status = 'pending', notes = '' } = body;

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
          [String(guestName).trim(), String(email).trim(), roomType, roomLabel, checkIn, checkOut, Number(guests || 1), Number(totalAmount || 0), status, notes]
        );

        return res.status(201).json({ booking: result.rows[0] });
      } catch (error) {
        console.error('create admin booking error:', error);
        return res.status(500).json({ error: 'Could not create booking.' });
      }
    });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
};
