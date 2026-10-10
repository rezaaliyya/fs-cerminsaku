import pool from "../db.js";

const serverError = (res, error, message) => {
  console.error(error);
  return res.status(500).json({ success: false, message });
};

export async function getDreamGoals(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM dream_goals WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id],
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    serverError(res, error, "Failed to fetch goals");
  }
}

export async function createDreamGoal(req, res) {
  try {
    const { emoji, nama, target, terkumpul, deadline, catatan, warna } = req.body;
    if (!nama || !(Number(target) > 0)) {
      return res.status(400).json({ success: false, message: "Nama dan target wajib diisi" });
    }

    const { rows } = await pool.query(
      `INSERT INTO dream_goals (user_id, nama, emoji, warna, target, terkumpul, deadline, catatan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user.id, nama, emoji, warna, Number(target), Number(terkumpul) || 0, deadline || null, catatan],
    );
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    serverError(res, error, "Failed to create goal");
  }
}

export async function updateDreamGoal(req, res) {
  try {
    const { emoji, nama, target, terkumpul, deadline, catatan, warna } = req.body;
    const { rows } = await pool.query(
      `UPDATE dream_goals
       SET nama = $1, emoji = $2, warna = $3, target = $4, terkumpul = $5, deadline = $6, catatan = $7
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [nama, emoji, warna, Number(target), Number(terkumpul) || 0, deadline || null, catatan, req.params.id, req.user.id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Goal tidak ditemukan" });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    serverError(res, error, "Failed to update goal");
  }
}

export async function deleteDreamGoal(req, res) {
  try {
    await pool.query("DELETE FROM dream_goals WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
    res.json({ success: true, message: "Goal deleted" });
  } catch (error) {
    serverError(res, error, "Failed to delete goal");
  }
}

export async function markAchieved(req, res) {
  try {
    const { rows } = await pool.query(
      `UPDATE dream_goals
       SET tercapai = true, tanggal_tercapai = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.user.id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Goal tidak ditemukan" });
    }
    res.json({ success: true, message: "Goal berhasil ditandai selesai", data: rows[0] });
  } catch (error) {
    serverError(res, error, "Gagal menandai goal");
  }
}
