const pool = require("../config/db");

// GET dashboard summary
const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user?.id || 1;

    // total income
    const incomeResult = await pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total_income
       FROM transactions
       WHERE user_id=$1 AND type='income'`,
      [userId],
    );

    // total expense
    const expenseResult = await pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total_expense
       FROM transactions
       WHERE user_id=$1 AND type='expense'`,
      [userId],
    );

    // recent transactions
    const recentResult = await pool.query(
      `SELECT * FROM transactions
       WHERE user_id=$1
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId],
    );

    // category summary
    const categoryResult = await pool.query(
      `SELECT category, SUM(amount) as total
       FROM transactions
       WHERE user_id=$1 AND type='expense'
       GROUP BY category`,
      [userId],
    );

    res.json({
      success: true,
      data: {
        totalIncome: Number(incomeResult.rows[0].total_income),
        totalExpense: Number(expenseResult.rows[0].total_expense),
        recentTransactions: recentResult.rows,
        categories: categoryResult.rows,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    });
  }
};

module.exports = {
  getDashboardSummary,
};
