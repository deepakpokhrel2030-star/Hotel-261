const { pool } = require('../lib/db');

// Compares phone numbers by their last 9 digits — matches the same logic in
// find-booking.js, so a guest who could find their booking can also cancel it.
function phonesMatch(a, b) {
  const digitsA = String(a || '').replace(/\D/g, '').slice(-9);
  const digitsB = String(b || '').replace(/\D/g, '').slice(-9);
  return digitsA.length === 9 && digitsA === digitsB;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, phone, reference } = req.body || {};
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPhone = String(phone || '').trim();
  const refMatch = String(reference || '').trim().match(/(\d+)\s*$/);
  const bookingId = refMatch ? parseInt(refMatch[1], 10) : NaN;

  if (!cleanEmail && !cleanPhone) {
    return res.status(400).json({ error: 'Please enter the email address or phone number used at checkout.' });
  }
  if (!bookingId) {
    return res.status(400).json({ error: 'Please enter your booking reference, e.g. H261-000123.' });
  }

  try {
    const result = await pool.query(
      `SELECT id, email, phone, status, check_in FROM hotel_bookings WHERE id = $1;`,
      [bookingId]
    );
    const booking = result.rows[0];
    const emailOk = cleanEmail && booking && String(booking.email || '').trim().toLowerCase() === cleanEmail;
    const phoneOk = cleanPhone && booking && phonesMatch(booking.phone, cleanPhone);

    if (!booking || !(emailOk || phoneOk)) {
      return res.status(404).json({ error: "We couldn't find a booking with that reference and email or phone number." });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'This booking is already cancelled.' });
    }
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ error: 'Only a confirmed booking can be cancelled this way. Please call us on 020 8743 4411.' });
    }

    const msPerHour = 60 * 60 * 1000;
    const hoursUntilCheckIn = (new Date(booking.check_in + 'T14:00:00Z').getTime() - Date.now()) / msPerHour;
    if (hoursUntilCheckIn < 48) {
      return res.status(400).json({ error: "This booking is within 48 hours of check-in, so it's past our free cancellation window. Please call us on 020 8743 4411 to discuss your options." });
    }

    await pool.query(
      `UPDATE hotel_bookings SET status = 'cancelled', updated_at = NOW() WHERE id = $1;`,
      [bookingId]
    );

    return res.status(200).json({ cancelled: true });
  } catch (err) {
    console.error('cancel-booking error:', err);
    return res.status(500).json({ error: 'Something went wrong cancelling your booking. Please call us on 020 8743 4411.' });
  }
};
