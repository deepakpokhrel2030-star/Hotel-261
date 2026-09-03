const bcrypt = require('bcryptjs');
const { pool } = require('../../lib/db');
const { verifyChallenge, invalidateDevicesAndSessions } = require('../../lib/admin-auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const challengeToken = String(body.challengeToken || '');
  const code = String(body.code || '').trim();
  const newPassword = String(body.newPassword || '');

  if (!challengeToken || !code || !newPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  const result = await verifyChallenge(challengeToken, code, 'reset');
  if (!result.ok) {
    return res.status(401).json({ error: result.error });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE email = $2', [passwordHash, result.email]);

  // A password reset should force every device — trusted or not — to sign
  // in again from scratch.
  await invalidateDevicesAndSessions(result.email);

  return res.status(200).json({ ok: true, message: 'Password updated. Please sign in again.' });
};
