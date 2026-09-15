const { pool } = require('../../../backend/lib/db');
const { requireAdmin } = require('../../../backend/lib/admin');

module.exports = async (req, res) => {
  return requireAdmin(req, res, async () => {
    if (req.method !== 'PATCH') {
      res.setHeader('Allow', 'PATCH');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const id = Number(req.query?.id);
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
  });
};
