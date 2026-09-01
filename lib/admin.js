function getAdminToken(req) {
  const auth = req.headers && req.headers.authorization ? req.headers.authorization : '';
  const bearerToken = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const customToken = req.headers && req.headers['x-admin-token'] ? req.headers['x-admin-token'] : '';
  return bearerToken || customToken || '';
}

function requireAdmin(req, res, next) {
  const expectedToken = process.env.ADMIN_SECRET;
  const suppliedToken = getAdminToken(req);

  if (!suppliedToken || suppliedToken !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized. Use the admin password.' });
  }

  return next();
}

module.exports = { requireAdmin };
