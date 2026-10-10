import express from "express";
import cors from "cors";
import pool from "./db.js";

import authRoutes from "./routes/auth.js";
import transactionRoutes from "./routes/transactions.js";
import savingRoutes from "./routes/savings.js";
import profileRoutes from "./routes/profile.js";
import dashboardRoutes from "./routes/dashboard.js";
import aiRoutes from "./routes/ai.js";

const app = express();

// CORS hanya perlu jika frontend ada di domain lain.
if (process.env.CORS_ORIGIN) {
  app.use(cors({ origin: process.env.CORS_ORIGIN.split(",").map((s) => s.trim()) }));
}
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/savings", savingRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);

// Cek cepat apakah API & database hidup: buka /api/health
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "OK", database: "terhubung" });
  } catch (err) {
    console.error("Health check gagal:", err.message);
    res.status(500).json({ status: "ERROR", database: "gagal terhubung", detail: err.message });
  }
});

app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "Endpoint tidak ditemukan" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
});

export default app;
