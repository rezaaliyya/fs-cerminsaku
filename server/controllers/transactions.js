import pool from "../db.js";

const KOLOM = "id, title, category, amount, type, date, created_at";
const TIPE = ["income", "expense"];

const serverError = (res, error, message) => {
  console.error(error);
  return res.status(500).json({ success: false, message });
};

export async function getTransactions(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT ${KOLOM} FROM transactions WHERE user_id = $1 ORDER BY id DESC`,
      [req.user.id],
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    serverError(res, error, "Terjadi kesalahan server");
  }
}

export async function createTransaction(req, res) {
  try {
    const { title, category, amount, type, date } = req.body;
    const nominal = Number(amount);

    if (!TIPE.includes(type) || !Number.isFinite(nominal) || nominal <= 0 || !date) {
      return res.status(400).json({ success: false, message: "Data transaksi tidak valid" });
    }

    const { rows } = await pool.query(
      `INSERT INTO transactions (user_id, title, category, amount, type, date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${KOLOM}`,
      [req.user.id, String(title || "Tanpa judul"), category || null, nominal, type, String(date)],
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    serverError(res, error, "Gagal menyimpan data");
  }
}

export async function updateTransaction(req, res) {
  try {
    const { title, category, amount, type, date } = req.body;
    const nominal = Number(amount);

    if (!TIPE.includes(type) || !Number.isFinite(nominal) || nominal <= 0 || !date) {
      return res.status(400).json({ success: false, message: "Data transaksi tidak valid" });
    }

    const { rowCount } = await pool.query(
      `UPDATE transactions
       SET title = $1, category = $2, amount = $3, type = $4, date = $5
       WHERE id = $6 AND user_id = $7`,
      [String(title || "Tanpa judul"), category || null, nominal, type, String(date), req.params.id, req.user.id],
    );
    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan" });
    }
    res.json({ success: true, message: "Transaksi berhasil diupdate!" });
  } catch (error) {
    serverError(res, error, "Gagal mengupdate data");
  }
}

export async function deleteTransaction(req, res) {
  try {
    await pool.query("DELETE FROM transactions WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
    res.json({ success: true, message: "Transaksi berhasil dihapus!" });
  } catch (error) {
    serverError(res, error, "Gagal menghapus data");
  }
}

export async function getSummary(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT
         COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0)  AS income,
         COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS expense
       FROM transactions WHERE user_id = $1`,
      [req.user.id],
    );
    const income = Number(rows[0].income);
    const expense = Number(rows[0].expense);
    res.json({ success: true, totalIncome: income, totalExpense: expense, netSurplus: income - expense });
  } catch (error) {
    serverError(res, error, "Gagal ambil summary");
  }
}
