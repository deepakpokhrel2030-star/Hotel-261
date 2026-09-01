const Stripe = require('stripe');
const { pool } = require('../lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Payments are not configured.' });
  }

  const { session_id } = req.query || {};
  if (!session_id || !/^cs_/.test(session_id)) {
    return res.status(400).json({ error: 'Missing or invalid session id.' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      await pool.query(
        `UPDATE hotel_bookings SET status = 'cancelled', updated_at = NOW() WHERE stripe_session_id = $1;`,
        [session_id]
      );
      return res.status(200).json({ paid: false });
    }

    const updated = await pool.query(
      `UPDATE hotel_bookings SET status = 'confirmed', updated_at = NOW() WHERE stripe_session_id = $1 RETURNING *;`,
      [session_id]
    );
    const booking = updated.rows[0];

    return res.status(200).json({
      paid: true,
      bookingRef: booking ? booking.id : null,
      amountTotal: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details ? session.customer_details.email : null,
      roomLabel: booking ? booking.room_label : (session.metadata && session.metadata.roomSummary),
      items: booking ? booking.items : null,
      checkIn: booking ? booking.check_in : (session.metadata && session.metadata.checkIn),
      checkOut: booking ? booking.check_out : (session.metadata && session.metadata.checkOut),
      nights: session.metadata ? session.metadata.nights : null,
      guests: booking ? booking.guests : (session.metadata && session.metadata.guests),
      rooms: booking ? booking.rooms : (session.metadata && session.metadata.rooms),
      guestName: session.metadata ? session.metadata.guestName : null,
    });
  } catch (err) {
    console.error('verify-session error:', err);
    return res.status(500).json({ error: 'Could not verify this booking.' });
  }
};
