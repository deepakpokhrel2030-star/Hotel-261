const { findValidSession } = require('./admin-auth');

function getAdminToken(req) {
  const auth = req.headers && req.headers.authorization ? req.headers.authorization : '';
  const bearerToken = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const customToken = req.headers && req.headers['x-admin-token'] ? req.headers['x-admin-token'] : '';
  return bearerToken || customToken || '';
}

async function requireAdmin(req, res, next) {
  const token = getAdminToken(req);
  const session = await findValidSession(token);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized. Please sign in again.' });
  }

  req.adminEmail = session.email;
  return next();
}

module.exports = { requireAdmin, getAdminToken };
