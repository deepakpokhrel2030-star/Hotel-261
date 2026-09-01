const Stripe = require('stripe');
const { pool } = require('../lib/db');

// Authoritative room prices (GBP per night). Never trust a price sent by the client.
const ROOMS = {
  single:   { label: 'Single Room',                 price: 54,  maxGuests: 1 },
  twin:     { label: 'Twin Room',                    price: 75,  maxGuests: 2 },
  double12: { label: 'Double Room (1–2 Adults)',      price: 75,  maxGuests: 2 },
  double:   { label: 'Double Room',                   price: 80,  maxGuests: 2 },
  triple:   { label: 'Triple Room',                   price: 95,  maxGuests: 3 },
  quad:     { label: 'Quadruple Room',                price: 120, maxGuests: 4 },
  family:   { label: 'Family Room',                   price: 120, maxGuests: 5 },
};

function nightsBetween(checkIn, checkOut) {
  const msPerNight = 24 * 60 * 60 * 1000;
  const a = new Date(checkIn + 'T00:00:00Z').getTime();
  const b = new Date(checkOut + 'T00:00:00Z').getTime();
  return Math.round((b - a) / msPerNight);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Payments are not configured yet. Please call the hotel to book: 020 8743 4411.' });
  }

  try {
    const { roomType, checkIn, checkOut, guests, name, email, phone, specialRequests } = req.body || {};

    const room = ROOMS[roomType];
    if (!room) return res.status(400).json({ error: 'Please choose a valid room type.' });

    if (!checkIn || !checkOut || !/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) {
      return res.status(400).json({ error: 'Please choose valid check-in and check-out dates.' });
    }

    const today = new Date().toISOString().slice(0, 10);
    if (checkIn < today) return res.status(400).json({ error: 'Check-in date can\'t be in the past.' });

    const nights = nightsBetween(checkIn, checkOut);
    if (nights < 1 || nights > 30) return res.status(400).json({ error: 'Stay must be between 1 and 30 nights.' });

    const guestCount = parseInt(guests, 10) || 1;
    if (guestCount < 1 || guestCount > room.maxGuests) {
      return res.status(400).json({ error: `${room.label} sleeps up to ${room.maxGuests} guest(s).` });
    }

    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Please enter your full name.' });
    if (!phone || !String(phone).trim()) return res.status(400).json({ error: 'Please enter a phone number.' });

    const totalPounds = room.price * nights;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const origin = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            unit_amount: Math.round(totalPounds * 100),
            product_data: {
              name: `Hotel 261 — ${room.label}`,
              description: `${nights} night${nights > 1 ? 's' : ''} · ${checkIn} to ${checkOut} · ${guestCount} guest${guestCount > 1 ? 's' : ''}`,
            },
          },
          quantity: 1,
        },
      ],
      custom_fields: [
        { key: 'guest_name', label: { type: 'custom', custom: 'Full name' }, type: 'text', text: { default_value: String(name).slice(0, 200) } },
        { key: 'check_in', label: { type: 'custom', custom: 'Check-in' }, type: 'text', text: { default_value: checkIn } },
        { key: 'check_out', label: { type: 'custom', custom: 'Check-out' }, type: 'text', text: { default_value: checkOut } },
      ],
      metadata: {
        roomType,
        roomLabel: room.label,
        checkIn,
        checkOut,
        nights: String(nights),
        guests: String(guestCount),
        guestName: String(name).slice(0, 200),
        guestPhone: String(phone).slice(0, 60),
        specialRequests: String(specialRequests || '').slice(0, 500),
      },
      success_url: `${origin}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/book?cancelled=1`,
    });

    const notesParts = [`Phone: ${String(phone).trim()}`];
    if (specialRequests && String(specialRequests).trim()) notesParts.push(`Special requests: ${String(specialRequests).trim().slice(0, 500)}`);

    await pool.query(
      `INSERT INTO hotel_bookings (
        guest_name, email, room_type, room_label, check_in, check_out, guests, total_amount, status, stripe_session_id, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10);`,
      [String(name).trim(), String(email || '').trim(), roomType, room.label, checkIn, checkOut, guestCount, Number(totalPounds.toFixed(2)), session.id, notesParts.join(' | ')]
    );

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session error:', err);
    return res.status(500).json({ error: 'Something went wrong starting your booking. Please try again or call us on 020 8743 4411.' });
  }
};
