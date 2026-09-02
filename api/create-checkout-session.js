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
    const {
      items, checkIn, checkOut, guests, name, email, phone, specialRequests,
      address, city, postcode, country, arrivalTime, bookingFor, mainGuestName, travelPurpose, companyName, vatNumber,
    } = req.body || {};

    if (!Array.isArray(items) || items.length === 0 || items.length > 7) {
      return res.status(400).json({ error: 'Please choose at least one room.' });
    }

    if (!checkIn || !checkOut || !/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) {
      return res.status(400).json({ error: 'Please choose valid check-in and check-out dates.' });
    }

    const today = new Date().toISOString().slice(0, 10);
    if (checkIn < today) return res.status(400).json({ error: 'Check-in date can\'t be in the past.' });

    const nights = nightsBetween(checkIn, checkOut);
    if (nights < 1 || nights > 30) return res.status(400).json({ error: 'Stay must be between 1 and 30 nights.' });

    // Re-derive every line from the authoritative ROOMS table — never trust a
    // price or label the client sent.
    let totalRooms = 0;
    let totalCapacity = 0;
    const cart = [];
    for (const raw of items) {
      const room = ROOMS[raw && raw.roomType];
      if (!room) return res.status(400).json({ error: 'Please choose a valid room type.' });
      const quantity = Math.min(4, Math.max(1, parseInt(raw.quantity, 10) || 0));
      if (!quantity) return res.status(400).json({ error: 'Please choose how many of each room you need.' });
      totalRooms += quantity;
      totalCapacity += room.maxGuests * quantity;
      const nightlyPrice = room.price;
      const lineTotal = nightlyPrice * nights * quantity;
      cart.push({ roomType: raw.roomType, roomLabel: room.label, quantity, nightlyPrice, lineTotal });
    }
    if (totalRooms > 10) return res.status(400).json({ error: 'For 10 or more rooms, please call us on 020 8743 4411.' });

    const guestCount = parseInt(guests, 10) || 1;
    if (guestCount < 1 || guestCount > totalCapacity) {
      return res.status(400).json({ error: `Your selected rooms sleep up to ${totalCapacity} guest(s) — please add another room or reduce your party size.` });
    }

    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Please enter your full name.' });
    if (!phone || !String(phone).trim()) return res.status(400).json({ error: 'Please enter a phone number.' });
    if (!address || !String(address).trim()) return res.status(400).json({ error: 'Please enter your address.' });
    if (!city || !String(city).trim()) return res.status(400).json({ error: 'Please enter your city.' });
    if (bookingFor === 'someone_else' && (!mainGuestName || !String(mainGuestName).trim())) {
      return res.status(400).json({ error: "Please enter the main guest's name." });
    }

    const totalPounds = cart.reduce((sum, item) => sum + item.lineTotal, 0);
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const origin = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email || undefined,
      line_items: cart.map((item) => ({
        price_data: {
          currency: 'gbp',
          unit_amount: Math.round(item.nightlyPrice * nights * 100),
          product_data: {
            name: `Hotel 261 — ${item.roomLabel}`,
            description: `${nights} night${nights > 1 ? 's' : ''} · ${checkIn} to ${checkOut}${item.quantity > 1 ? ` · ${item.quantity} rooms` : ''}`,
          },
        },
        quantity: item.quantity,
      })),
      custom_fields: [
        { key: 'guest_name', label: { type: 'custom', custom: 'Full name' }, type: 'text', text: { default_value: String(name).slice(0, 200) } },
        { key: 'check_in', label: { type: 'custom', custom: 'Check-in' }, type: 'text', text: { default_value: checkIn } },
        { key: 'check_out', label: { type: 'custom', custom: 'Check-out' }, type: 'text', text: { default_value: checkOut } },
      ],
      metadata: {
        roomSummary: cart.map((i) => `${i.roomLabel} ×${i.quantity}`).join(', ').slice(0, 400),
        checkIn,
        checkOut,
        nights: String(nights),
        guests: String(guestCount),
        rooms: String(totalRooms),
        guestName: String(name).slice(0, 200),
        guestPhone: String(phone).slice(0, 60),
        specialRequests: String(specialRequests || '').slice(0, 500),
      },
      success_url: `${origin}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/book?cancelled=1`,
    });

    const addressLine = [String(address).trim(), String(city).trim(), postcode && String(postcode).trim(), country && String(country).trim()]
      .filter(Boolean).join(', ');
    const notesParts = [`Phone: ${String(phone).trim()}`, `Address: ${addressLine}`];
    if (arrivalTime) notesParts.push(`Estimated arrival: ${String(arrivalTime).slice(0, 40)}`);
    if (bookingFor === 'someone_else') notesParts.push(`Booking is for someone else — main guest: ${String(mainGuestName).trim().slice(0, 200)}`);
    if (travelPurpose === 'yes') {
      let businessLine = 'Travelling for work';
      if (companyName && String(companyName).trim()) businessLine += ` — ${String(companyName).trim().slice(0, 200)}`;
      if (vatNumber && String(vatNumber).trim()) businessLine += ` (VAT: ${String(vatNumber).trim().slice(0, 40)})`;
      notesParts.push(businessLine);
    }
    if (specialRequests && String(specialRequests).trim()) notesParts.push(`Special requests: ${String(specialRequests).trim().slice(0, 500)}`);

    const roomType = cart.length === 1 ? cart[0].roomType : 'multiple';
    const roomLabel = cart.map((i) => `${i.roomLabel} ×${i.quantity}`).join(', ');

    await pool.query(
      `INSERT INTO hotel_bookings (
        guest_name, email, phone, room_type, room_label, check_in, check_out, guests, rooms, total_amount, status, stripe_session_id, notes, items
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11, $12, $13);`,
      [String(name).trim(), String(email || '').trim(), String(phone || '').trim(), roomType, roomLabel, checkIn, checkOut, guestCount, totalRooms, Number(totalPounds.toFixed(2)), session.id, notesParts.join(' | '), JSON.stringify(cart)]
    );

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session error:', err);
    return res.status(500).json({ error: 'Something went wrong starting your booking. Please try again or call us on 020 8743 4411.' });
  }
};
