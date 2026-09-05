const { pool } = require('../../backend/lib/db');
const { requireAdmin } = require('../../backend/lib/admin');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return requireAdmin(req, res, async () => {
    try {
      const summary = await pool.query(`
        SELECT
          COUNT(*)::int AS total_bookings,
          COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0)::int AS pending,
          COALESCE(SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END), 0)::int AS confirmed,
          COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0)::int AS cancelled,
          COALESCE(SUM(CASE WHEN status = 'confirmed' THEN total_amount ELSE 0 END), 0)::numeric AS confirmed_revenue
        FROM hotel_bookings;
      `);

      const upcoming = await pool.query(`
        SELECT COUNT(*)::int AS upcoming
        FROM hotel_bookings
        WHERE check_in >= CURRENT_DATE AND status IN ('pending', 'confirmed');
      `);

      return res.status(200).json({
        ...summary.rows[0],
        upcoming: upcoming.rows[0]?.upcoming || 0,
      });
    } catch (error) {
      console.error('admin summary error:', error);
      return res.status(500).json({ error: 'Could not load booking summary.' });
    }
  });
};
