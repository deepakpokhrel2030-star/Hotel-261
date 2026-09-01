const { pool } = require('../lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, reference } = req.body || {};
  const cleanEmail = String(email || '').trim().toLowerCase();
  // References look like "H261-000123" — take the trailing run of digits, not
  // every digit in the string, so the "261" in the brand prefix isn't swept in too.
  const refMatch = String(reference || '').trim().match(/(\d+)\s*$/);
  const bookingId = refMatch ? parseInt(refMatch[1], 10) : NaN;

  if (!cleanEmail) {
    return res.status(400).json({ error: 'Please enter the email address used at checkout.' });
  }
  if (!bookingId) {
    return res.status(400).json({ error: 'Please enter your booking reference, e.g. H261-000123.' });
  }

  try {
    const result = await pool.query(
      `SELECT id, guest_name, room_label, check_in, check_out, guests, rooms, total_amount, status, created_at
       FROM hotel_bookings WHERE id = $1 AND LOWER(email) = $2;`,
      [bookingId, cleanEmail]
    );
    const booking = result.rows[0];

    if (!booking) {
      return res.status(404).json({ error: "We couldn't find a booking with that email and reference. Double-check both and try again, or call us on 020 8743 4411." });
    }

    return res.status(200).json({
      bookingRef: booking.id,
      guestName: booking.guest_name,
      roomLabel: booking.room_label,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      guests: booking.guests,
      rooms: booking.rooms,
      totalAmount: booking.total_amount,
      status: booking.status,
    });
  } catch (err) {
    console.error('find-booking error:', err);
    return res.status(500).json({ error: 'Something went wrong looking up your booking. Please call us on 020 8743 4411.' });
  }
};
