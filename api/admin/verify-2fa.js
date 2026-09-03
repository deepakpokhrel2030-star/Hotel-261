const { serializeCookie } = require('../../lib/cookies');
const { verifyChallenge, createSession, trustDevice, DEVICE_TTL_DAYS } = require('../../lib/admin-auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const challengeToken = String(body.challengeToken || '');
  const code = String(body.code || '').trim();
  const remember = Boolean(body.remember);

  if (!challengeToken || !code) {
    return res.status(400).json({ error: 'A verification code is required.' });
  }

  const result = await verifyChallenge(challengeToken, code, 'login');
  if (!result.ok) {
    return res.status(401).json({ error: result.error });
  }

  const session = await createSession(result.email);

  if (remember) {
    const device = await trustDevice(result.email);
    res.setHeader('Set-Cookie', serializeCookie('admin_device', device.token, {
      maxAgeSeconds: DEVICE_TTL_DAYS * 86400,
    }));
  }

  return res.status(200).json({ ok: true, token: session.token });
};
