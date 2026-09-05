const { getAdminToken } = require('../../backend/lib/admin');
const { deleteSession } = require('../../backend/lib/admin-auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await deleteSession(getAdminToken(req));
  return res.status(200).json({ ok: true });
};
