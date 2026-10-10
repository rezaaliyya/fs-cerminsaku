// Membuat tabel di database: `npm run db:setup` (butuh DATABASE_URL di file .env)
import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pool from "../server/db.js";

const dir = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(dir, "../db/schema.sql"), "utf8");

try {
  await pool.query(sql);
  console.log("Tabel users, transactions, dan dream_goals siap dipakai.");
} catch (err) {
  console.error("Gagal membuat tabel:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
