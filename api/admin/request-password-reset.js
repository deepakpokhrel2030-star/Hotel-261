const { pool } = require('../../lib/db');
const { randomToken } = require('../../lib/crypto-helpers');
const { createChallenge, sendChallengeEmail } = require('../../lib/admin-auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const email = String(body.email || '').trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const { rows } = await pool.query('SELECT email FROM admin_users WHERE email = $1', [email]);

  let challengeToken;
  if (rows[0]) {
    const created = await createChallenge(email, 'reset');
    challengeToken = created.challengeToken;
    await sendChallengeEmail(email, created.code, 'reset');
  } else {
    // Don't let a missing account show up as a different response shape —
    // hand back a token that will just never match a real challenge.
    challengeToken = randomToken(24);
  }

  return res.status(200).json({ ok: true, challengeToken, message: 'If that email is registered, a code has been sent.' });
};
