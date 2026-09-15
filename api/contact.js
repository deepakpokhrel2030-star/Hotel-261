const { pool } = require('../backend/lib/db');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const phone = String(body.phone || '').trim();
  const subject = String(body.subject || '').trim();
  const message = String(body.message || '').trim();

  if (body.website) return res.status(200).json({ ok: true });
  if (!name || name.length > 120) return res.status(400).json({ error: 'Please enter your name.' });
  if (!EMAIL_RE.test(email) || email.length > 200) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (phone.length > 50) return res.status(400).json({ error: 'Please check your phone number.' });
  if (subject.length > 160) return res.status(400).json({ error: 'Please keep the subject shorter.' });
  if (message.length < 10 || message.length > 5000) return res.status(400).json({ error: 'Please enter a message between 10 and 5,000 characters.' });

  try {
    const result = await pool.query(
      `INSERT INTO hotel_contact_messages (name, email, phone, subject, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at;`,
      [name, email, phone || null, subject || null, message]
    );

    return res.status(201).json({ ok: true, messageId: result.rows[0].id });
  } catch (error) {
    console.error('contact message error:', error);
    return res.status(500).json({ error: 'We could not send your message. Please email reception@hotel261.com.' });
  }
};
