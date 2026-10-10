import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import "../style/dashboard.css";

import {
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Plus,
  X,
  AlertCircle,
  Utensils,
  Bus,
  Clapperboard,
  Heart,
  ChevronDown,
  Check,
  Brain,
} from "lucide-react";

const BACKEND_URL = "http://localhost:3000";

const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const fmt = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

const ICON_MAP = {
  "Makan & Minuman": <Utensils size={16} />,
  Transportasi: <Bus size={16} />,
  Hiburan: <Clapperboard size={16} />,
  Kesehatan: <Heart size={16} />,
  "Gaji / Pemasukan": <Wallet size={16} />,
  "Food & Drink": <Utensils size={16} />,
  Transportation: <Bus size={16} />,
  Entertainment: <Clapperboard size={16} />,
};

const WARNA_KAT = [
  "#F59E0B",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#EF4444",
  "#10B981",
];

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("userData"));
  } catch {
    return null;
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const user = getUser();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [txType, setTxType] = useState("expense");
  const [hoveredBar, setHoveredBar] = useState(null);

  const [summary, setSummary] = useState({
    total_income: 0,
    total_expense: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [savings, setSavings] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [years, setYears] = useState([new Date().getFullYear()]);

  // State form modal
  const [form, setForm] = useState({
    judul: "",
    jumlah: "",
    tipe: "expense",
    tanggal: new Date().toISOString().slice(0, 10),
    kategori: "",
    catatan: "",
  });

  // State AI
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHasil, setAiHasil] = useState(null);
  const [aiError, setAiError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dashboardInsight, setDashboardInsight] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // ── Fetch data dari backend (Murni Axios) ────────────────
  const fetchSemua = useCallback(async () => {
    try {
      const [sumRes, txListRes, savListRes] = await Promise.all([
        apiClient.get(`/api/transactions/summary?userId=${user?.id}`),
        apiClient.get(`/api/transactions?userId=${user?.id}`),
        apiClient.get("/api/savings"),
      ]);

      const sum = sumRes.data;
      const txData = txListRes.data.data || [];
      const savData = savListRes.data.data || [];

      setSummary(sum);
      setTransactions(txData);
      setSavings(savData);

      buatChartData(txData, selectedYear);
      buatKategori(txData);

      const daftarTahun = [
        ...new Set(txData.map((tx) => new Date(tx.tanggal).getFullYear())),
      ].sort((a, b) => b - a);

      if (!daftarTahun.includes(new Date().getFullYear())) {
        daftarTahun.unshift(new Date().getFullYear());
      }

      setYears(daftarTahun);
    } catch (err) {
      if (err.response?.status === 401 || err.message.includes("401")) {
        navigate("/login");
      }
    }
  }, [selectedYear, navigate]);

  useEffect(() => {
    fetchSemua();
  }, [fetchSemua]);

  function buatChartData(txList, yr) {
    const BULAN = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const map = {};
    BULAN.forEach((lb, i) => {
      map[i] = { label: lb, income: 0, expense: 0 };
    });

    txList.forEach((tx) => {
      const d = new Date(tx.date);
      if (d.getFullYear() !== yr) return;
      const m = d.getMonth();
      if (tx.type === "income") map[m].income += Number(tx.amount || 0);
      if (tx.type === "expense") map[m].expense += Number(tx.amount || 0);
    });

    const batas = yr < new Date().getFullYear() ? 11 : new Date().getMonth();
    setChartData(Object.values(map).slice(0, batas + 1));
  }

  function buatKategori(txList) {
    const map = {};
    txList.forEach((tx) => {
      if (tx.type !== "expense") return;
      const cat = tx.category || "Lainnya";
      map[cat] = (map[cat] || 0) + Number(tx.amount);
    });

    const total = Object.values(map).reduce((s, v) => s + v, 0) || 1;
    setCategories(
      Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([name, amount], i) => ({
          name,
          icon:
            name === "Makan & Minuman"
              ? "🍜"
              : name === "Transportasi"
                ? "🚌"
                : name === "Hiburan"
                  ? "🎬"
                  : name === "Belanja"
                    ? "🛍️"
                    : name === "Kesehatan"
                      ? "💊"
                      : "📦",
          amount,
          color: WARNA_KAT[i % WARNA_KAT.length],
          pct: Math.round((amount / total) * 100),
        })),
    );
  }

  useEffect(() => {
    if (transactions.length > 0) buatChartData(transactions, selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setYearDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSimpan = async () => {
    if (!form.judul || !form.jumlah || !form.tanggal) return;
    setSaving(true);
    try {
      await apiClient.post("/api/transactions", {
        ...form,
        jumlah: Number(form.jumlah),
      });
      setOpenModal(false);
      setAiHasil(null);
      setForm({
        judul: "",
        jumlah: "",
        tipe: "expense",
        tanggal: new Date().toISOString().slice(0, 10),
        kategori: "",
        catatan: "",
      });
      fetchSemua();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAI = async () => {
    if (!form.jumlah || !form.tanggal) return;
    setAiLoading(true);
    setAiHasil(null);
    setAiError("");
    try {
      const res = await apiClient.post("/api/ai/predict", {
        date: form.tanggal,
        amount_rupiah: Number(form.jumlah),
        transaction_type: form.tipe === "income" ? "Income" : "Expense",
        top_k: 3,
      });

      const data = res.data;
      setAiHasil(data);
      if (data.predicted_category)
        setForm((f) => ({ ...f, kategori: data.predicted_category }));
    } catch {
      setAiError("AI tidak tersedia. Pastikan Colab sedang jalan.");
    } finally {
      setAiLoading(false);
    }
  };

  const generateDashboardInsight = async () => {
    setDashboardLoading(true);
    try {
      const response = await apiClient.post("/api/ai/dashboard-insight", {
        netSurplus,
        totalInflow: totalIncome,
        totalOutflow: totalExpense,
        budgetPercentage:
          totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0,
      });

      setDashboardInsight(response.data);
    } catch (err) {
      console.log("Dashboard AI Error:", err);
      setDashboardInsight({
        headline: " AI Tidak Aktif",
        insight: "Insight dashboard belum tersedia.",
      });
    } finally {
      setDashboardLoading(false);
    }
  };

  const totalIncome = parseFloat(summary?.totalIncome ?? 0);
  const totalExpense = parseFloat(summary?.totalExpense ?? 0);
  const netSurplus = totalIncome - totalExpense;

  useEffect(() => {
    if (totalIncome > 0 || totalExpense > 0) {
      generateDashboardInsight();
    }
  }, [totalIncome, totalExpense]);

  const bars =
    chartData.length > 0 ? chartData : [{ label: "-", income: 0, expense: 0 }];
  const maxVal = Math.max(...bars.map((b) => Math.max(b.income, b.expense)), 1);

  return (
    <div className="dashboard">
      <Sidebar activePage="dashboard" />

      <div className="viewport-content-wrapper">
        <div className="ambient-blur-sphere sphere-one" />

        <div className="viewport-container">
          <header className="glass-action-header">
            <div className="brand-intel">
              <div className="greeting-hero">
                Halo, {user?.name?.split(" ")[0] || "Pengguna"}!
              </div>
              <h1 className="header-main-title">
                Yuk, kelola keuanganmu
                <br />
                dengan bijak hari ini!
              </h1>
            </div>
          </header>

          <div className="stat-cards-row three-col">
            <div className="stat-plain-card">
              <div className="stat-card-header">
                <div className="stat-icon-pill income">
                  <ArrowDownLeft size={16} />
                </div>
              </div>
              <h3>{fmt(totalIncome)}</h3>
              <div className="stat-card-label">Total Pemasukan</div>
            </div>

            <div className="stat-plain-card">
              <div className="stat-card-header">
                <div className="stat-icon-pill expense">
                  <ArrowUpRight size={16} />
                </div>
              </div>
              <h3>{fmt(totalExpense)}</h3>
              <div className="stat-card-label">Total Pengeluaran</div>
            </div>

            <div className="stat-plain-card highlight">
              <div className="stat-card-header">
                <div className="stat-icon-pill surplus">
                  <TrendingUp size={16} />
                </div>
              </div>
              <h3 className="surplus-value">{fmt(netSurplus)}</h3>
              <div className="stat-card-label">Total Saldo Bersih</div>
            </div>
          </div>

          <div className="dashboard-main-row">
            <div className="chart-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <h4>Arus Kas</h4>
                  <p>Perbandingan pemasukan & pengeluaran</p>
                </div>

                <div className="year-dropdown-wrapper" ref={dropdownRef}>
                  <button
                    className="year-dropdown-trigger"
                    onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
                  >
                    <span>{selectedYear}</span>
                    <ChevronDown
                      size={14}
                      style={{
                        transform: yearDropdownOpen
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    />
                  </button>

                  {yearDropdownOpen && (
                    <div className="year-dropdown-menu">
                      {years.map((yr) => (
                        <button
                          key={yr}
                          className={`year-dropdown-item ${selectedYear === yr ? "selected" : ""}`}
                          onClick={() => {
                            setSelectedYear(yr);
                            setYearDropdownOpen(false);
                          }}
                        >
                          <span>{yr}</span>
                          {selectedYear === yr && <Check size={13} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="chart-summary-row">
                <div className="chart-summary-item">
                  <span className="cs-dot income" />
                  <div>
                    <div className="cs-label">
                      Total Pemasukan {selectedYear}
                    </div>
                    <div className="cs-value income">
                      {fmt(bars.reduce((s, b) => s + b.income, 0))}
                    </div>
                  </div>
                </div>
                <div className="chart-summary-item">
                  <span className="cs-dot expense" />
                  <div>
                    <div className="cs-label">
                      Total Pengeluaran {selectedYear}
                    </div>
                    <div className="cs-value expense">
                      {fmt(bars.reduce((s, b) => s + b.expense, 0))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bar-chart-area">
                {bars.map((col, i) => (
                  <div
                    key={i}
                    className="bar-chart-col"
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {hoveredBar === i && (
                      <div className="bar-tooltip">
                        <div className="tooltip-label">
                          {col.label} {selectedYear}
                        </div>
                        <div className="tooltip-row">
                          <span className="tt-dot" />
                          <span>
                            Pemasukan: <b>{fmt(col.income)}</b>
                          </span>
                        </div>
                        <div className="tooltip-row">
                          <span className="tt-dot expense" />
                          <span>
                            Pengeluaran: <b>{fmt(col.expense)}</b>
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="bar-pair">
                      <div
                        className="bar-stack income-bar"
                        style={{ height: `${(col.income / maxVal) * 100}%` }}
                      />
                      <div
                        className="bar-stack expense-bar"
                        style={{ height: `${(col.expense / maxVal) * 100}%` }}
                      />
                    </div>
                    <span className="bar-col-label">{col.label}</span>
                  </div>
                ))}
              </div>
              <div className="chart-legend">
                <div className="legend-dot">
                  <div className="dot income" />
                  Pemasukan
                </div>
                <div className="legend-dot">
                  <div className="dot expense" />
                  Pengeluaran
                </div>
              </div>
            </div>

            <div className="category-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <h4>Kategori Pengeluaran</h4>
                  <p>Pengeluaran bulan ini</p>
                </div>
              </div>
              <div className="category-list">
                {categories.length === 0 ? (
                  <p
                    style={{
                      padding: "20px",
                      color: "#94a3b8",
                      textAlign: "center",
                    }}
                  >
                    Belum ada pengeluaran
                  </p>
                ) : (
                  categories.map((cat, i) => (
                    <div key={i} className="category-item">
                      <div className="category-item-header">
                        <div className="category-name">
                          <div
                            className="cat-icon"
                            style={{ background: cat.color + "15" }}
                          >
                            {cat.icon}
                          </div>
                          {cat.name}
                        </div>
                        <span className="category-amount">
                          {fmt(cat.amount)}
                        </span>
                      </div>
                      <div className="category-bar-bg">
                        <div
                          className="category-bar-fill"
                          style={{
                            width: `${cat.pct}%`,
                            background: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-bottom-row">
            <div className="recent-tx-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <h4>Transaksi Terbaru</h4>
                  <p>5 aktivitas terakhir</p>
                </div>
                <button
                  className="see-all-link"
                  onClick={() => navigate("/Transactions")}
                >
                  Lihat Semua
                </button>
              </div>
              <div className="tx-stream">
                {transactions.length === 0 ? (
                  <p
                    style={{
                      padding: "20px",
                      color: "#94a3b8",
                      textAlign: "center",
                    }}
                  >
                    Belum ada transaksi
                  </p>
                ) : (
                  transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="tx-row">
                      <div className="tx-row-left">
                        <div className={`tx-icon-frame ${tx.type}`}>
                          {ICON_MAP[tx.category] || <Wallet size={16} />}
                        </div>
                        <div className="tx-info">
                          <h4>{tx.title}</h4>
                          <span>{tx.category || "Lainnya"}</span>
                        </div>
                      </div>
                      <div className="tx-row-right">
                        <div className="tx-time">
                          {new Date(tx.date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}
                        </div>
                        <div className={`tx-amount ${tx.type}`}>
                          {tx.type === "expense"
                            ? `-${fmt(tx.amount)}`
                            : `+${fmt(tx.amount)}`}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="savings-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <h4>Dream Savings</h4>
                  <p>Progress impianmu saat ini</p>
                </div>
                <button
                  className="see-all-link"
                  onClick={() => navigate("/savings")}
                >
                  Lihat Semua
                </button>
              </div>
              <div className="savings-list">
                {savings.length === 0 ? (
                  <p
                    style={{
                      padding: "20px",
                      color: "#94a3b8",
                      textAlign: "center",
                    }}
                  >
                    Belum ada savings goal
                  </p>
                ) : (
                  savings.slice(0, 3).map((goal, i) => {
                    const pct = Math.min(
                      Math.round(
                        (Number(goal.terkumpul) / Number(goal.target)) * 100,
                      ),
                      100,
                    );
                    return (
                      <div key={i} className="saving-item">
                        <div className="saving-item-top">
                          <div className="saving-name">
                            <span className="saving-emoji">
                              {goal.emoji || "🎯"}
                            </span>
                            <div>
                              <h5>{goal.nama}</h5>
                              <p>
                                {fmt(goal.terkumpul)} dari {fmt(goal.target)}
                              </p>
                            </div>
                          </div>
                          <span className="saving-pct">{pct}%</span>
                        </div>
                        <div className="saving-progress-bg">
                          <div
                            className="saving-progress-fill"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="insight-banner">
            <div className="insight-spark" />
            <div className="insight-content">
              <div className="insight-title-row">
                <AlertCircle size={14} />
                <h5>Insight Finansial CerminSaku</h5>
              </div>
              {dashboardLoading ? (
                <p>AI sedang menganalisis kondisi keuanganmu...</p>
              ) : dashboardInsight ? (
                <>
                  <h5 style={{ marginBottom: "6px" }}>
                    {dashboardInsight?.headline}
                  </h5>
                  <p>{dashboardInsight?.insight}</p>
                </>
              ) : (
                <p>Belum ada insight AI.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
