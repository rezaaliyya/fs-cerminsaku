import pool from "../db.js";

export async function getDashboardSummary(req, res) {
  try {
    const userId = req.user.id;

    const [totals, recent, categories] = await Promise.all([
      pool.query(
        `SELECT
           COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0)  AS income,
           COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS expense
         FROM transactions WHERE user_id = $1`,
        [userId],
      ),
      pool.query(
        `SELECT id, title, category, amount, type, date, created_at
         FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
        [userId],
      ),
      pool.query(
        `SELECT category, SUM(amount) AS total
         FROM transactions WHERE user_id = $1 AND type = 'expense' GROUP BY category`,
        [userId],
      ),
    ]);

    res.json({
      success: true,
      data: {
        totalIncome: Number(totals.rows[0].income),
        totalExpense: Number(totals.rows[0].expense),
        recentTransactions: recent.rows,
        categories: categories.rows,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to load dashboard" });
  }
}
