const bcrypt = require('bcryptjs');
const { pool } = require('../../lib/db');
const { parseCookies } = require('../../lib/cookies');
const { createChallenge, sendChallengeEmail, createSession, findTrustedDevice } = require('../../lib/admin-auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const { rows } = await pool.query('SELECT * FROM admin_users WHERE email = $1', [email]);
  const user = rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  // A device that already completed 2FA within the last 45 days skips
  // straight to a session; anything else (new browser, or a remembered one
  // past its 45-day window) has to prove itself with a fresh emailed code.
  const cookies = parseCookies(req);
  const trusted = await findTrustedDevice(user.email, cookies.admin_device);

  if (trusted) {
    const session = await createSession(user.email);
    return res.status(200).json({ ok: true, needsCode: false, token: session.token });
  }

  const { code, challengeToken } = await createChallenge(user.email, 'login');
  await sendChallengeEmail(user.email, code, 'login');

  return res.status(200).json({ ok: true, needsCode: true, challengeToken });
};
