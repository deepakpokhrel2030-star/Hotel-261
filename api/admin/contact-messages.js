const { pool } = require('../../backend/lib/db');
const { requireAdmin } = require('../../backend/lib/admin');

module.exports = async (req, res) => {
  return requireAdmin(req, res, async () => {
    if (req.method === 'GET') {
      try {
        const result = await pool.query(`
          SELECT id, name, email, phone, subject, message, status, created_at, updated_at
          FROM hotel_contact_messages
          ORDER BY created_at DESC
          LIMIT 200;
        `);
        return res.status(200).json({ messages: result.rows });
      } catch (error) {
        console.error('admin contact messages error:', error);
        return res.status(500).json({ error: 'Could not load contact messages.' });
      }
    }

    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  });
};
