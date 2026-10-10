const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

//POST /api/ai/predict
router.post("/predict", auth, async (req, res) => {
  try {
    const AI_URL = process.env.AI_SERVICE_URL;

    if (!AI_URL || AI_URL.includes("localhost")) {
      return res
        .status(503)
        .json({ message: "AI service belum dikonfigurasi" });
    }

    const response = await fetch(`${AI_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) throw new Error("AI service error");

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("AI predict error:", err.message);
    res.status(503).json({ message: "AI service tidak tersedia saat ini" });
  }
});

//POST /api/ai/dashboard-insight
// Analisis ringkasan finansial (Dashboard) via Claude API
router.post("/dashboard-insight", auth, async (req, res) => {
  try {
    const { netSurplus, totalInflow, totalOutflow, budgetPercentage } =
      req.body;

    const response = await fetch("(https://api.anthropic.com/v1/messages)", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 500,
        system: `Kamu adalah AI financial assistant bernama CerminSaku.
Tugasmu memberikan ringkasan status keuangan pengguna di halaman utama (Dashboard).
Bicara dengan santai, suportif, dan kekinian seperti teman untuk Gen Z.

FORMAT WAJIB JSON (Tanpa format markdown tambahan):
{
  "headline": "Satu emoji dan sapaan ringkas (max 6 kata)",
  "insight": "2 kalimat evaluasi cashflow menyeluruh dan 1 saran langkah selanjutnya"
}`,
        messages: [
          {
            role: "user",
            content: `
Data Dashboard Hari Ini:
- Sisa Uang (Net Surplus): Rp${netSurplus}
- Pemasukan: Rp${totalInflow}
- Pengeluaran: Rp${totalOutflow}
- Budget Terpakai: ${budgetPercentage}%

Berikan rangkuman kondisi keuanganku hari ini.
            `,
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data.error?.message || "Terjadi kesalahan pada API Claude",
      );
    }

    const raw = data.content?.map((c) => c.text ?? "").join("") ?? "";

    const clean = raw.replace(/```json|```/gi, "").trim();

    res.json(JSON.parse(clean));
  } catch (err) {
    console.error("AI dashboard insight error:", err.message);
    res.status(503).json({ message: "Gagal mengambil insight Dashboard" });
  }
});

// POST /api/ai/savings-insight
// Analisis motivasi Dream Savings via Claude API
router.post("/savings-insight", auth, async (req, res) => {
  try {
    const {
      totalGoalAktif,
      totalTarget,
      totalTerkumpul,
      progressKeseluruhan,
      goalTercapai,
      goals,
    } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `Kamu adalah asisten keuangan pribadi bernama CerminSaku.
Bicara dalam Bahasa Indonesia yang ramah, ringkas, dan memotivasi.
Berikan insight tentang progress tabungan impian pengguna.
Format respons HANYA JSON murni tanpa markdown:
{
  "headline": "Ringkasan singkat 1 kalimat",
  "highlights": ["poin 1", "poin 2", "poin 3"],
  "suggestion": "1 saran konkret untuk mempercepat tabungan"
}`,
        messages: [
          {
            role: "user",
            content: `Data dream savings saya:\n${JSON.stringify(
              {
                totalGoalAktif,
                totalTarget,
                totalTerkumpul,
                progressKeseluruhan,
                goalTercapai,
                goals,
              },
              null,
              2,
            )}\n\nBerikan insight dan motivasi.`,
          },
        ],
      }),
    });

    const data = await response.json();
    const raw = data.content?.map((c) => c.text ?? "").join("") ?? "";
    const clean = raw.replace(/```json|```/g, "").trim();

    res.json(JSON.parse(clean));
  } catch (err) {
    console.error("AI savings insight error:", err.message);
    res.status(503).json({ message: "Gagal mengambil insight AI" });
  }
});

// Analisis arus kas bulanan via Claude API
//POST /api/ai/transaction-insight
router.post("/transaction-insight", auth, async (req, res) => {
  try {
    const { totalInflow, totalOutflow, monthlyLimit, topCategory } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        "x-api-key": process.env.ANTHROPIC_API_KEY,

        "anthropic-version": "2023-06-01",
      },

      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",

        max_tokens: 500,

        system: `
Kamu adalah AI financial assistant bernama CerminSaku.

Tugasmu menganalisis cashflow pengguna berdasarkan:
- total pemasukan
- total pengeluaran
- budget limit
- kategori pengeluaran terbesar

Gunakan bahasa Indonesia yang santai, friendly, seperti teman Gen Z.

Berikan insight singkat dan berguna.

FORMAT WAJIB JSON:
{
 "headline":
 "emoji + judul singkat",

 "insight":
 "2 kalimat insight dan saran"
}
          `,

        messages: [
          {
            role: "user",

            content: `
Data keuangan saya:

Pemasukan:
Rp${totalInflow}

Pengeluaran:
Rp${totalOutflow}

Budget Bulanan:
Rp${monthlyLimit}

Kategori Dominan:
${topCategory || "Tidak ada"}

Berikan insight keuangan.
              `,
          },
        ],
      }),
    });

    const data = await response.json();

    const raw = data.content?.map((c) => c.text ?? "").join("") ?? "";

    const clean = raw.replace(/```json|```/g, "").trim();

    res.json(JSON.parse(clean));
  } catch (err) {
    console.error("AI transaction insight error:", err.message);

    res.status(503).json({
      message: "Gagal mengambil insight AI",
    });
  }
});

module.exports = router;
