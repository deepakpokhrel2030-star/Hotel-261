const { pool } = require('../lib/db');

// Compares phone numbers by their last 9 digits so "07911 123456",
// "+44 7911 123456" and "447911123456" are all recognised as the same
// number regardless of spacing or country-code formatting.
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
  // References look like "H261-000123" — take the trailing run of digits, not
  // every digit in the string, so the "261" in the brand prefix isn't swept in too.
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
      `SELECT id, guest_name, email, phone, room_label, check_in, check_out, guests, rooms, total_amount, status, items, created_at
       FROM hotel_bookings WHERE id = $1;`,
      [bookingId]
    );
    const booking = result.rows[0];
    const emailOk = cleanEmail && booking && String(booking.email || '').trim().toLowerCase() === cleanEmail;
    const phoneOk = cleanPhone && booking && phonesMatch(booking.phone, cleanPhone);

    if (!booking || !(emailOk || phoneOk)) {
      return res.status(404).json({ error: "We couldn't find a booking with that reference and email or phone number. Double-check them and try again, or call us on 020 8743 4411." });
    }

    return res.status(200).json({
      bookingRef: booking.id,
      guestName: booking.guest_name,
      roomLabel: booking.room_label,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      guests: booking.guests,
      rooms: booking.rooms,
      items: booking.items,
      totalAmount: booking.total_amount,
      status: booking.status,
    });
  } catch (err) {
    console.error('find-booking error:', err);
    return res.status(500).json({ error: 'Something went wrong looking up your booking. Please call us on 020 8743 4411.' });
  }
};
