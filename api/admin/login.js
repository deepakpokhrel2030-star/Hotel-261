const { pool } = require('../../lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const password = String(body.password || '').trim();
  const expected = process.env.ADMIN_SECRET;

  if (!password || password !== expected) {
    return res.status(401).json({ error: 'Incorrect admin password.' });
  }

  return res.status(200).json({ ok: true, token: expected, message: 'Authorized' });
};
