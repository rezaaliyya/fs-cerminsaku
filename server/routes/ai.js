import { Router } from "express";
import auth from "../middleware/auth.js";

const router = Router();
router.use(auth);

const MODEL = () => process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

// Panggil Claude lalu ambil objek JSON dari jawabannya
async function tanyaClaude({ system, user, maxTokens = 600 }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY belum diisi");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL(),
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
    signal: AbortSignal.timeout(25000),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Terjadi kesalahan pada API Claude");
  }

  const raw = (data.content || []).map((c) => c.text ?? "").join("");
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Jawaban AI bukan JSON");
  return JSON.parse(match[0]);
}

// POST /api/ai/predict  -> model ML kategori (opsional, lewat AI_SERVICE_URL)
router.post("/predict", async (req, res) => {
  const base = process.env.AI_SERVICE_URL;
  if (!base || base.includes("localhost")) {
    return res.status(503).json({ message: "AI service belum dikonfigurasi" });
  }

  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`AI service error (${response.status})`);
    res.json(await response.json());
  } catch (err) {
    console.error("AI predict error:", err.message);
    res.status(503).json({ message: "AI service tidak tersedia saat ini" });
  }
});

// POST /api/ai/dashboard-insight
router.post("/dashboard-insight", async (req, res) => {
  try {
    const { netSurplus, totalInflow, totalOutflow, budgetPercentage } = req.body;
    const hasil = await tanyaClaude({
      maxTokens: 500,
      system: `Kamu adalah AI financial assistant bernama CerminSaku.
Tugasmu memberikan ringkasan status keuangan pengguna di halaman utama (Dashboard).
Bicara dengan santai, suportif, dan kekinian seperti teman untuk Gen Z.

FORMAT WAJIB JSON (tanpa markdown):
{
  "headline": "Satu emoji dan sapaan ringkas (max 6 kata)",
  "insight": "2 kalimat evaluasi cashflow menyeluruh dan 1 saran langkah selanjutnya"
}`,
      user: `Data Dashboard Hari Ini:
- Sisa Uang (Net Surplus): Rp${netSurplus}
- Pemasukan: Rp${totalInflow}
- Pengeluaran: Rp${totalOutflow}
- Budget Terpakai: ${budgetPercentage}%

Berikan rangkuman kondisi keuanganku hari ini.`,
    });
    res.json(hasil);
  } catch (err) {
    console.error("AI dashboard insight error:", err.message);
    res.status(503).json({ message: "Gagal mengambil insight Dashboard" });
  }
});

// POST /api/ai/savings-insight
router.post("/savings-insight", async (req, res) => {
  try {
    const { totalGoalAktif, totalTarget, totalTerkumpul, progressKeseluruhan, goalTercapai, goals } = req.body;
    const hasil = await tanyaClaude({
      maxTokens: 800,
      system: `Kamu adalah asisten keuangan pribadi bernama CerminSaku.
Bicara dalam Bahasa Indonesia yang ramah, ringkas, dan memotivasi.
Berikan insight tentang progress tabungan impian pengguna.
Format respons HANYA JSON murni tanpa markdown:
{
  "headline": "Ringkasan singkat 1 kalimat",
  "highlights": ["poin 1", "poin 2", "poin 3"],
  "suggestion": "1 saran konkret untuk mempercepat tabungan"
}`,
      user: `Data dream savings saya:\n${JSON.stringify(
        { totalGoalAktif, totalTarget, totalTerkumpul, progressKeseluruhan, goalTercapai, goals },
        null,
        2,
      )}\n\nBerikan insight dan motivasi.`,
    });
    res.json(hasil);
  } catch (err) {
    console.error("AI savings insight error:", err.message);
    res.status(503).json({ message: "Gagal mengambil insight AI" });
  }
});

// POST /api/ai/transaction-insight
router.post("/transaction-insight", async (req, res) => {
  try {
    const { totalInflow, totalOutflow, monthlyLimit, topCategory } = req.body;
    const hasil = await tanyaClaude({
      maxTokens: 500,
      system: `Kamu adalah AI financial assistant bernama CerminSaku.
Tugasmu menganalisis cashflow pengguna berdasarkan total pemasukan, total pengeluaran, budget limit, dan kategori pengeluaran terbesar.
Gunakan bahasa Indonesia yang santai, friendly, seperti teman Gen Z. Berikan insight singkat dan berguna.

FORMAT WAJIB JSON (tanpa markdown):
{
  "headline": "emoji + judul singkat",
  "insight": "2 kalimat insight dan saran"
}`,
      user: `Data keuangan saya:

Pemasukan: Rp${totalInflow}
Pengeluaran: Rp${totalOutflow}
Budget Bulanan: Rp${monthlyLimit}
Kategori Dominan: ${topCategory || "Tidak ada"}

Berikan insight keuangan.`,
    });
    res.json(hasil);
  } catch (err) {
    console.error("AI transaction insight error:", err.message);
    res.status(503).json({ message: "Gagal mengambil insight AI" });
  }
});

export default router;
