import bcrypt from "bcryptjs";
import pool from "../db.js";

const serverError = (res, error) => {
  console.error(error);
  return res.status(500).json({ success: false, message: "Server error" });
};

export async function getProfile(req, res) {
  try {
    const { rows } = await pool.query("SELECT id, name, email, phone FROM users WHERE id = $1", [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    serverError(res, error);
  }
}

export async function updateProfile(req, res) {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = req.body.phone ? String(req.body.phone).trim() : null;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Nama dan email wajib diisi" });
    }

    const dipakai = await pool.query("SELECT id FROM users WHERE email = $1 AND id <> $2", [email, req.user.id]);
    if (dipakai.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Email sudah dipakai akun lain" });
    }

    const { rows } = await pool.query(
      "UPDATE users SET name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING id, name, email, phone",
      [name, email, phone, req.user.id],
    );
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    serverError(res, error);
  }
}

export async function updatePassword(req, res) {
  try {
    // Frontend mengirim password_lama / password_baru
    const lama = String(req.body.password_lama ?? req.body.oldPassword ?? "");
    const baru = String(req.body.password_baru ?? req.body.newPassword ?? "");

    if (baru.length < 6) {
      return res.status(400).json({ success: false, message: "Password baru minimal 6 karakter" });
    }

    const { rows } = await pool.query("SELECT password FROM users WHERE id = $1", [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "User tidak ditemukan" });

    const cocok = await bcrypt.compare(lama, rows[0].password);
    if (!cocok) return res.status(400).json({ success: false, message: "Password lama salah" });

    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [await bcrypt.hash(baru, 10), req.user.id]);
    res.json({ success: true, message: "Password updated" });
  } catch (error) {
    serverError(res, error);
  }
}
