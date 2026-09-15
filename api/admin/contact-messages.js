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

    if (req.method === 'PATCH') {
      const id = Number(req.query?.id || req.body?.id);
      const status = String(req.body?.status || '');
      if (!Number.isInteger(id) || !['new', 'read', 'replied', 'archived'].includes(status)) {
        return res.status(400).json({ error: 'Invalid message update.' });
      }

      try {
        const result = await pool.query(
          `UPDATE hotel_contact_messages SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;`,
          [status, id]
        );
        if (!result.rowCount) return res.status(404).json({ error: 'Message not found.' });
        return res.status(200).json({ message: result.rows[0] });
      } catch (error) {
        console.error('admin contact message status error:', error);
        return res.status(500).json({ error: 'Could not update message.' });
      }
    }

    res.setHeader('Allow', 'GET, PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  });
};
