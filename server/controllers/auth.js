import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { randomInt } from "node:crypto";
import pool from "../db.js";

const OTP_MENIT = 5;

const normalizeEmail = (e) => String(e || "").trim().toLowerCase();
const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const buatOtp = () => String(randomInt(0, 1000000)).padStart(6, "0");
const otpKedaluwarsa = () => new Date(Date.now() + OTP_MENIT * 60 * 1000);

let transporter;
function getTransporter() {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    throw new Error("MAIL_USER / MAIL_PASS belum diisi di environment variables");
  }
  if (!transporter) {
    const port = Number(process.env.MAIL_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });
  }
  return transporter;
}

async function kirimOtp({ to, subject, judul, sapaan, otp }) {
  await getTransporter().sendMail({
    from: `"CerminSaku" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family:Arial;padding:24px;background:#f8fafc;">
        <h2 style="color:#0E4834;">${judul}</h2>
        ${sapaan ? `<p>${sapaan}</p>` : ""}
        <p>Gunakan kode OTP berikut:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#10B981;margin:24px 0;">${otp}</div>
        <p>OTP berlaku selama <b>${OTP_MENIT} menit</b>.</p>
      </div>`,
  });
}

const serverError = (res, error, pesan = "Terjadi kesalahan server") => {
  console.error(error);
  return res.status(500).json({ success: false, message: pesan });
};

// 1. REGISTER + KIRIM OTP
export async function register(req, res) {
  try {
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Nama, email, dan password wajib diisi!" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password minimal 6 karakter!" });
    }

    const exist = await pool.query("SELECT id, is_verified FROM users WHERE email = $1", [email]);
    if (exist.rows[0]?.is_verified) {
      return res.status(400).json({ success: false, message: "Email sudah terdaftar!" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const otp = buatOtp();
    const expired = otpKedaluwarsa();

    if (exist.rows.length > 0) {
      // Pernah daftar tapi belum verifikasi: perbarui data & kirim OTP baru
      await pool.query(
        "UPDATE users SET name=$1, password=$2, otp=$3, otp_expired_at=$4 WHERE email=$5",
        [name, hashed, otp, expired, email],
      );
    } else {
      await pool.query(
        `INSERT INTO users (name, email, password, otp, otp_expired_at, is_verified)
         VALUES ($1, $2, $3, $4, $5, false)`,
        [name, email, hashed, otp, expired],
      );
    }

    try {
      await kirimOtp({
        to: email,
        subject: "Verifikasi OTP CerminSaku",
        judul: "Verifikasi Akun CerminSaku",
        sapaan: `Halo ${escapeHtml(name)},`,
        otp,
      });
    } catch (mailErr) {
      console.error("Gagal kirim email:", mailErr.message);
      return res.status(500).json({
        success: false,
        message: "Gagal mengirim email OTP. Periksa konfigurasi email server.",
      });
    }

    res.status(200).json({ success: true, message: "OTP berhasil dikirim!", email });
  } catch (error) {
    serverError(res, error);
  }
}

// 2. VERIFIKASI OTP REGISTER
export async function verifyOtp(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "");

    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = rows[0];
    if (!user) return res.status(400).json({ success: false, message: "User tidak ditemukan" });

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ success: false, message: "OTP salah!" });
    }
    if (new Date() > new Date(user.otp_expired_at)) {
      return res.status(400).json({ success: false, message: "OTP sudah expired!" });
    }

    await pool.query(
      "UPDATE users SET is_verified = true, otp = null, otp_expired_at = null WHERE email = $1",
      [email],
    );
    res.status(200).json({ success: true, message: "Email berhasil diverifikasi!" });
  } catch (error) {
    serverError(res, error);
  }
}

// 3. LOGIN
export async function login(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = rows[0];
    if (!user) return res.status(400).json({ success: false, message: "Akun tidak ditemukan!" });
    if (!user.is_verified) {
      return res.status(400).json({ success: false, message: "Verifikasi email terlebih dahulu!" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ success: false, message: "Password salah!" });

    if (!process.env.JWT_SECRET) {
      return serverError(res, new Error("JWT_SECRET belum diisi"));
    }
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      success: true,
      message: "Login berhasil!",
      token,
      data: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    serverError(res, error);
  }
}

// 4. LUPA PASSWORD: KIRIM OTP
export async function sendResetOtp(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const { rows } = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: "Email tidak ditemukan!" });
    }

    const otp = buatOtp();
    await pool.query("UPDATE users SET otp = $1, otp_expired_at = $2 WHERE email = $3", [
      otp,
      otpKedaluwarsa(),
      email,
    ]);

    try {
      await kirimOtp({ to: email, subject: "Reset Password CerminSaku", judul: "Reset Password", otp });
    } catch (mailErr) {
      console.error("Gagal kirim email:", mailErr.message);
      return res.status(500).json({
        success: false,
        message: "Gagal mengirim email OTP. Periksa konfigurasi email server.",
      });
    }

    res.status(200).json({ success: true, message: "OTP berhasil dikirim!" });
  } catch (error) {
    serverError(res, error);
  }
}

// 5. LUPA PASSWORD: CEK OTP
export async function verifyResetOtp(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "");

    const { rows } = await pool.query("SELECT otp, otp_expired_at FROM users WHERE email = $1", [email]);
    const user = rows[0];
    if (!user) return res.status(400).json({ success: false, message: "User tidak ditemukan!" });

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ success: false, message: "OTP salah!" });
    }
    if (new Date() > new Date(user.otp_expired_at)) {
      return res.status(400).json({ success: false, message: "OTP expired!" });
    }

    res.status(200).json({ success: true, message: "OTP valid!" });
  } catch (error) {
    serverError(res, error);
  }
}

// 6. LUPA PASSWORD: SET PASSWORD BARU (OTP wajib dikirim ulang agar tidak bisa dilewati)
export async function resetPassword(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "");
    const newPassword = String(req.body.newPassword || "");

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password minimal 6 karakter!" });
    }

    const { rows } = await pool.query("SELECT otp, otp_expired_at FROM users WHERE email = $1", [email]);
    const user = rows[0];
    if (!user) return res.status(400).json({ success: false, message: "Email tidak ditemukan!" });

    if (!user.otp || user.otp !== otp || new Date() > new Date(user.otp_expired_at)) {
      return res.status(400).json({
        success: false,
        message: "Sesi reset tidak valid atau sudah expired. Ulangi dari Lupa Password.",
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password = $1, otp = null, otp_expired_at = null WHERE email = $2",
      [hashed, email],
    );
    res.status(200).json({ success: true, message: "Password berhasil diperbarui!" });
  } catch (error) {
    serverError(res, error);
  }
}
