const { pool } = require('../../../../backend/lib/db');
const { requireAdmin } = require('../../../../backend/lib/admin');

module.exports = async (req, res) => {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return requireAdmin(req, res, async () => {
    const { id } = req.query || {};
    const { status } = req.body || {};

    if (!status) {
      return res.status(400).json({ error: 'A status is required.' });
    }

    try {
      const result = await pool.query(
        `UPDATE hotel_bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;`,
        [status, id]
      );

      if (!result.rows[0]) {
        return res.status(404).json({ error: 'Booking not found.' });
      }

      return res.status(200).json({ booking: result.rows[0] });
    } catch (error) {
      console.error('update booking status error:', error);
      return res.status(500).json({ error: 'Could not update booking status.' });
    }
  });
};
