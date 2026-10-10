import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import "../style/transaction.css";

import {
  Search,
  ChevronDown,
  Brain,
  Utensils,
  Bus,
  Wallet,
  Clapperboard,
  Home,
  Plane,
  ShoppingBag,
  FileText,
  Heart,
  GraduationCap,
  MoreHorizontal,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  X,
  TrendingUp,
  SlidersHorizontal,
  PieChart,
  Settings2,
  Check,
  AlertOctagon,
  ArrowRight,
  BookOpen,
  MousePointerClick,
  HelpCircle,
  Trash2,
  Edit2,
  Calendar,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

const apiClient = axios.create({
  baseURL: "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function Transaction() {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Semua Kategori");
  const [searchQuery, setSearchQuery] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    amount: "",
    type: "expense",
    date: new Date().toISOString().split("T")[0],
  });

  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [openLimitModal, setOpenLimitModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [transactions, setTransactions] = useState([]);

  const [hasSetBudget, setHasSetBudget] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showBudgetWarning, setShowBudgetWarning] = useState(false);

  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState("success");

  const [aiHeadline, setAiHeadline] = useState("⏳ Menganalisis...");
  const [aiInsight, setAiInsight] = useState(
    "AI sedang membaca pola keuanganmu...",
  );
  const [aiLoading, setAiLoading] = useState(false);

  const [monthlyLimit, setMonthlyLimit] = useState(() => {
    const user = JSON.parse(localStorage.getItem("userData"));
    if (!user?.id) return 0;
    const savedLimit = localStorage.getItem(
      `cerminsaku_budget_limit_${user.id}`,
    );
    return savedLimit ? Number(savedLimit) : 0;
  });
  const [tempLimit, setTempLimit] = useState(monthlyLimit);

  useEffect(() => {
    fetchTransactions();
    const user = JSON.parse(localStorage.getItem("userData"));
    const hasSeenGuide = localStorage.getItem(
      `cerminsaku_guide_seen_${user?.id}`,
    );

    if (!hasSeenGuide) {
      setShowGuide(true);
      localStorage.setItem(`cerminsaku_guide_seen_${user?.id}`, "true");
    }

    if (monthlyLimit > 0) setHasSetBudget(true);
    else setHasSetBudget(false);
  }, [monthlyLimit]);

  const fetchTransactions = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("userData"));
      if (!user?.id) return;

      const response = await apiClient.get(
        `/api/transactions?userId=${user.id}`,
      );
      if (response.data.success) {
        setTransactions(response.data.data);
      }
    } catch (error) {
      console.error("Gagal ambil data:", error);
    }
  };

  useEffect(() => {
    const autoPredict = async () => {
      try {
        if (!formData.amount || !formData.date) return;
        const response = await apiClient.post("/api/ai/predict", {
          date: formData.date,
          amount_rupiah: Number(formData.amount),
          transaction_type: formData.type === "income" ? "Income" : "Expense",
          top_k: 3,
        });

        const data = response.data;
        const categoryMap = {
          Food: "Makan dan Minuman",
          FoodAndDrinks: "Makan dan Minuman",
          Entertainment: "Hiburan",
          Transportation: "Transportasi",
          Shopping: "Belanja",
          Salary: "Gaji/ Pemasukan",
          Income: "Gaji/ Pemasukan",
          Health: "Kesehatan",
          Education: "Pendidikan",
          Utilities: "Lainnya",
          Others: "Lainnya",
        };
        const kategori = categoryMap[data.predicted_category] || "Lainnya";
        setFormData((prev) => ({ ...prev, category: kategori }));
      } catch (err) {
        console.log("AI OFF", err);
      }
    };
    autoPredict();
  }, [formData.amount, formData.date, formData.type]);

  const triggerToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3500);
  };

  const confirmDelete = (id) => {
    setItemToDelete(id);
    setDeleteModal(true);
  };

  const executeDelete = async () => {
    if (itemToDelete) {
      try {
        const user = JSON.parse(localStorage.getItem("userData"));
        await apiClient.delete(
          `/api/transactions/${itemToDelete}?userId=${user.id}`,
        );
        setDeleteModal(false);
        setItemToDelete(null);
        fetchTransactions();
        triggerToast("Data transaksi berhasil dihapus dari sistem.", "success");
      } catch (error) {
        triggerToast("Gagal menghapus transaksi.", "danger");
      }
    }
  };

  const handleSubmit = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("userData"));
      let predictedCategory = formData.category;

      try {
        const aiResponse = await apiClient.post("/api/ai/predict", {
          date: formData.date,
          amount_rupiah: Number(formData.amount),
          transaction_type: formData.type === "income" ? "Income" : "Expense",
          top_k: 3,
        });
        const aiData = aiResponse.data;

        if (!formData.category || formData.category === "") {
          const categoryMap = {
            Food: "Makan dan Minuman",
            FoodAndDrinks: "Makan dan Minuman",
            Entertainment: "Hiburan",
            Transportation: "Transportasi",
            Shopping: "Belanja",
            Salary: "Gaji/ Pemasukan",
            Income: "Gaji/ Pemasukan",
            Health: "Kesehatan",
            Education: "Pendidikan",
            Utilities: "Lainnya",
            Rent: "Lainnya",
            Bills: "Lainnya",
            Others: "Lainnya",
          };
          predictedCategory =
            categoryMap[aiData.predicted_category] || "Lainnya";
        }
      } catch (aiError) {
        console.log("AI tidak aktif:", aiError);
      }

      const payload = {
        ...formData,
        category: predictedCategory,
        user_id: user.id,
      };

      if (editingId) {
        await apiClient.put(`/api/transactions/${editingId}`, payload);
      } else {
        await apiClient.post("/api/transactions", payload);
      }

      setOpenModal(false);
      setEditingId(null);
      setFormData({
        title: "",
        category: "",
        amount: "",
        type: "expense",
        date: new Date().toISOString().split("T")[0],
      });

      await fetchTransactions();
      triggerToast("Pencatatan arus kas berhasil disimpan.", "success");
    } catch (error) {
      console.error(error);
      triggerToast("Terjadi kesalahan koneksi ke server.", "danger");
    }
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setFormData(item);
    setOpenModal(true);
  };

  const handleTriggerCreateTransaction = () => {
    if (!hasSetBudget) {
      setShowBudgetWarning(true);
    } else {
      setEditingId(null);
      setFormData({
        title: "",
        category: "",
        amount: "",
        type: "expense",
        date: new Date().toISOString().split("T")[0],
      });
      setOpenModal(true);
    }
  };

  const totalInflow = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalOutflow = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
  const budgetPercentage =
    monthlyLimit > 0
      ? Math.min(Math.round((totalOutflow / monthlyLimit) * 100), 100)
      : 0;
  const remainingBudget = monthlyLimit - totalOutflow;

  const fetchAIInsight = async () => {
    try {
      setAiLoading(true);
      const expenseTransactions = transactions.filter(
        (t) => t.type === "expense",
      );
      const categoryTotals = {};

      expenseTransactions.forEach((item) => {
        const cat = item.category || "Lainnya";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(item.amount);
      });

      const topCategory = Object.entries(categoryTotals).sort(
        (a, b) => b[1] - a[1],
      )[0]?.[0];

      const response = await apiClient.post("/api/ai/transaction-insight", {
        totalInflow,
        totalOutflow,
        monthlyLimit,
        topCategory,
      });

      const data = response.data;
      setAiHeadline(data.headline);
      setAiInsight(data.insight);
    } catch (err) {
      console.log("AI Error:", err);
      setAiHeadline( "AI Tidak Aktif");
      setAiInsight("Insight belum tersedia.");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (transactions.length > 0) {
      fetchAIInsight();
    }
  }, [totalInflow, totalOutflow, monthlyLimit, transactions]);

  const iconDictionary = {
    "Makan dan Minuman": <Utensils size={18} />,
    Transportasi: <Bus size={18} />,
    Hiburan: <Clapperboard size={18} />,
    Belanja: <ShoppingBag size={18} />,
    Investasi: <TrendingUp size={18} />,
    "Gaji/ Pemasukan": <Wallet size={18} />,
    Kesehatan: <Heart size={18} />,
    Pendidikan: <GraduationCap size={18} />,
    Lainnya: <MoreHorizontal size={18} />,
  };

  const categories = [
    { name: "Semua Kategori", icon: <MoreHorizontal size={14} /> },
    { name: "Makan dan Minuman", icon: <Utensils size={14} /> },
    { name: "Investasi", icon: <TrendingUp size={14} /> },
    { name: "Transportasi", icon: <Bus size={14} /> },
    { name: "Hiburan", icon: <Clapperboard size={14} /> },
    { name: "Belanja", icon: <ShoppingBag size={14} /> },
    { name: "Gaji/ Pemasukan", icon: <FileText size={14} /> },
    { name: "Kesehatan", icon: <Heart size={14} /> },
    { name: "Pendidikan", icon: <GraduationCap size={14} /> },
    { name: "Lainnya", icon: <HelpCircle size={14} /> },
  ];

  const filteredTransactions = transactions.filter((item) => {
    const matchesTab = activeTab === "all" || item.type === activeTab;
    const matchesCategory =
      selectedCategory === "Semua Kategori" ||
      item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesCategory && matchesSearch;
  });

  return (
    <div className="dashboard">
      <Sidebar activePage="transactions" />

      <div className={`premium-toast ${showToast ? "show" : ""} ${toastType}`}>
        <div className="toast-content">
          <div className="toast-icon-wrapper">
            {toastType === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}
          </div>
          <div className="toast-text-group">
            <span className="toast-title">
              {toastType === "success" ? "Informasi Sistem" : "Peringatan"}
            </span>
            <span className="toast-desc">{toastMessage}</span>
          </div>
        </div>
        <div className="toast-progress-bar"></div>
      </div>

      <div className="viewport-content-wrapper">
        <div className="ambient-blur-sphere sphere-one"></div>
        <div className="ambient-blur-sphere sphere-two"></div>

        <div className="viewport-container">
          <header className="glass-action-header">
            <div className="brand-intel">
              <h1>Arus Kas</h1>
              <p>Catat pembukuan kas masuk dan keluar secara terstruktur.</p>
            </div>
            <div className="header-utilities">
              <button
                className="utility-secondary-btn"
                onClick={() => setShowGuide(true)}
              >
                <BookOpen size={14} />
                <span>Panduan</span>
              </button>
              <button
                className="utility-secondary-btn"
                onClick={() => {
                  setTempLimit(monthlyLimit);
                  setOpenLimitModal(true);
                }}
              >
                <Settings2 size={14} />
                <span>Atur Budget</span>
              </button>
              <button
                className="neon-emerald-btn"
                onClick={handleTriggerCreateTransaction}
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Catat Transaksi</span>
              </button>
            </div>
          </header>

          <div className="bento-asymmetric-workspace">
            <div className="intel-core-column">
              <div className="aurora-mesh-card">
                <div className="mesh-overlay-glow"></div>
                <div className="card-inner-content">
                  <div className="card-top-meta">
                    <span className="system-tag">NET SURPLUS PORTFOLIO</span>
                    <div className="badge-trend">
                      <TrendingUp size={12} />
                      <span>
                        {totalInflow > 0
                          ? `${((totalInflow - totalOutflow) / totalInflow) * 100 > 0 ? "+" : ""}${(((totalInflow - totalOutflow) / totalInflow) * 100).toFixed(1)}%`
                          : "0%"}
                      </span>
                    </div>
                  </div>
                  <h2>
                    Rp {(totalInflow - totalOutflow).toLocaleString("id-ID")}
                  </h2>
                  <div className="card-bottom-meta">
                    <p>
                      Dana bersih aktif sisa alokasi alur kas masuk dikurangi
                      beban transaksi keluar.
                    </p>
                  </div>
                </div>
              </div>

              <div className="twin-bento-grid">
                <div className="bento-subcard inflow">
                  <div className="subcard-header">
                    <div className="icon-circle">
                      <ArrowDownLeft size={14} />
                    </div>
                    <span className="subcard-title">Inflow</span>
                  </div>
                  <h3>Rp {totalInflow.toLocaleString("id-ID")}</h3>
                  <span className="subcard-footer">
                    Total Pendapatan (All Time)
                  </span>
                </div>
                <div className="bento-subcard outflow">
                  <div className="subcard-header">
                    <div className="icon-circle">
                      <ArrowUpRight size={14} />
                    </div>
                    <span className="subcard-title">Outflow</span>
                  </div>
                  <h3>Rp {totalOutflow.toLocaleString("id-ID")}</h3>
                  <span className="subcard-footer">
                    Total Pengeluaran (All Time)
                  </span>
                </div>
              </div>

              <div className="budget-limit-panel memanjang-panel-style">
                <div className="budget-panel-header">
                  <div className="budget-label">
                    <PieChart size={15} className="budget-icon" />
                    <h5>Limit Pengeluaran Bulanan</h5>
                  </div>
                  <div className="budget-actions-hub">
                    <span className="budget-percentage">
                      {budgetPercentage}% Terpakai
                    </span>
                    <button
                      className="adjust-budget-trigger"
                      onClick={() => {
                        setTempLimit(monthlyLimit);
                        setOpenLimitModal(true);
                      }}
                    >
                      <Settings2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${budgetPercentage}%`,
                      background:
                        budgetPercentage >= 80 ? "#E11D48" : "#0E4834",
                    }}
                  ></div>
                </div>
                <div className="budget-panel-footer">
                  <span>
                    {remainingBudget >= 0 ? "Sisa kuota: " : "Defisit: "}
                    <strong>
                      Rp {Math.abs(remainingBudget).toLocaleString("id-ID")}
                    </strong>
                  </span>
                  <span>Batas: Rp {monthlyLimit.toLocaleString("id-ID")}</span>
                </div>
              </div>

              <div className="ai-insight-card">
                <div className="ai-insight-header">
                  <Brain size={18} />
                  <span>Insight AI CerminSaku</span>
                </div>
                <h4>{aiLoading ? "Menganalisis..." : aiHeadline}</h4>
                <p>
                  {aiLoading
                    ? "AI sedang membaca pola transaksi..."
                    : aiInsight}
                </p>
              </div>
            </div>

            <div className="ledger-panel-column">
              <div className="master-ledger-shell">
                <div className="ledger-control-center">
                  <div className="minimal-search-input-box">
                    <Search size={14} />
                    <input
                      type="text"
                      placeholder="Cari entitas transaksi..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="context-dropdown-anchor">
                    <button
                      className={`glass-filter-btn ${openDropdown ? "dropdown-active" : ""}`}
                      onClick={() => setOpenDropdown(!openDropdown)}
                    >
                      <SlidersHorizontal size={13} />
                      <span className="filter-text-truncate">
                        {selectedCategory}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`chevron-rotate-tweak ${openDropdown ? "rotate" : ""}`}
                      />
                    </button>
                    {openDropdown && (
                      <>
                        <div
                          className="dropdown-overlay-shutter"
                          onClick={() => setOpenDropdown(false)}
                        ></div>
                        <div className="context-blur-dropdown">
                          {categories.map((item, index) => (
                            <div
                              key={index}
                              className={`blur-dropdown-item ${selectedCategory === item.name ? "selected" : ""}`}
                              onClick={() => {
                                setSelectedCategory(item.name);
                                setOpenDropdown(false);
                              }}
                            >
                              <div className="item-core">
                                {item.icon}
                                <span>{item.name}</span>
                              </div>
                              {selectedCategory === item.name && (
                                <span className="dot-marker-check">
                                  <Check size={12} strokeWidth={3} />
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="ios-segmented-tabs">
                  <button
                    className={activeTab === "all" ? "active" : ""}
                    onClick={() => setActiveTab("all")}
                  >
                    Semua
                  </button>
                  <button
                    className={activeTab === "income" ? "active" : ""}
                    onClick={() => setActiveTab("income")}
                  >
                    Pemasukan
                  </button>
                  <button
                    className={activeTab === "expense" ? "active" : ""}
                    onClick={() => setActiveTab("expense")}
                  >
                    Pengeluaran
                  </button>
                </div>

                <div className="premium-stream-list">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((item, index) => (
                      <div className="stream-row-item" key={index}>
                        <div className="stream-row-left">
                          <div className={`stream-icon-frame ${item.type}`}>
                            {iconDictionary[item.category] || (
                              <HelpCircle size={16} />
                            )}
                          </div>
                          <div className="stream-row-info">
                            <h4>{item.title}</h4>
                            <span>{item.category}</span>
                          </div>
                        </div>
                        <div className="stream-row-right">
                          <div className="stream-time-amount">
                            <span className="stream-time">{item.date}</span>
                            <h3 className={`stream-amount ${item.type}`}>
                              {item.type === "expense"
                                ? `-Rp ${Number(item.amount).toLocaleString("id-ID")}`
                                : `+Rp ${Number(item.amount).toLocaleString("id-ID")}`}
                            </h3>
                          </div>
                          <div className="action-buttons">
                            <button
                              className="edit-btn"
                              onClick={() => openEditModal(item)}
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => confirmDelete(item.id)}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="stream-empty-state">
                      <MoreHorizontal
                        size={24}
                        style={{ color: "#94A3B8", marginBottom: "8px" }}
                      />
                      <p>Pencarian transaksi tidak ditemukan.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showGuide && (
        <div className="sheet-backdrop-blur">
          <div className="sheet-modal-body guide-modal-size">
            <div className="sheet-header">
              <div className="guide-title-hub">
                <BookOpen size={18} className="guide-main-icon" />
                <h2>Panduan Penggunaan Menu</h2>
              </div>
              <button
                className="sheet-close-circle"
                onClick={() => setShowGuide(false)}
              >
                <X size={15} />
              </button>
            </div>
            <p className="modal-description-text">
              Selamat datang di menu pembukuan kas CerminSaku! Ikuti langkah
              praktis berikut untuk memulai pelacakan dana Anda:
            </p>
            <div className="onboarding-steps-list">
              <div className="step-guide-card">
                <div className="step-number-tag">1</div>
                <div className="step-info-meta">
                  <h4>Atur Batas Anggaran (Limit)</h4>
                  <p>
                    Langkah awal wajib menentukan batas kuota pengeluaran
                    bulanan.
                  </p>
                </div>
              </div>
              <div className="step-guide-card">
                <div className="step-number-tag">2</div>
                <div className="step-info-meta">
                  <h4>Pencatatan Transaksi Baru</h4>
                  <p>
                    Klik tombol "Catat Transaksi" untuk memasukkan riwayat kas.
                  </p>
                </div>
              </div>
            </div>
            <div className="sheet-action-footer" style={{ marginTop: "24px" }}>
              <button
                className="sheet-btn-commit full-width-guide-btn"
                onClick={() => setShowGuide(false)}
              >
                <MousePointerClick size={14} />
                <span>Saya Paham, Mulai Eksplorasi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="sheet-backdrop-blur">
          <div className="sheet-modal-body warning-budget-modal-size">
            <div
              className="popup-icon-octagon-warning-wrapper"
              style={{ background: "#FFF1F2", color: "#E11D48" }}
            >
              <Trash2 size={26} />
            </div>
            <div className="popup-text-content">
              <h3>Yakin Hapus Transaksi?</h3>
              <p>Data transaksi ini akan dihapus permanen.</p>
            </div>
            <div
              className="sheet-action-footer"
              style={{
                marginTop: "24px",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              <button
                className="sheet-btn-cancel"
                onClick={() => setDeleteModal(false)}
              >
                Batal
              </button>
              <button
                className="sheet-btn-commit"
                style={{ background: "#E11D48", width: "auto" }}
                onClick={executeDelete}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {showBudgetWarning && (
        <div className="sheet-backdrop-blur">
          <div className="sheet-modal-body warning-budget-modal-size">
            <div className="popup-icon-octagon-warning-wrapper">
              <AlertOctagon size={26} />
            </div>
            <div className="popup-text-content">
              <h3>Batas Anggaran Belum Diatur</h3>
              <p>
                Anda wajib mengonfigurasi limit anggaran pengeluaran kas bulan
                ini terlebih dahulu!
              </p>
            </div>
            <div
              className="sheet-action-footer"
              style={{ marginTop: "24px", justifyContent: "center" }}
            >
              <button
                className="sheet-btn-commit full-width-guide-btn"
                onClick={() => {
                  setShowBudgetWarning(false);
                  setTempLimit(monthlyLimit);
                  setOpenLimitModal(true);
                }}
              >
                <span>Atur Limit Budget Sekarang</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {openModal && (
        <div className="sheet-backdrop-blur">
          <div className="sheet-modal-body">
            <div className="sheet-header">
              <h2>{editingId ? "Edit Transaksi" : "Transaksi Baru"}</h2>
              <button
                className="sheet-close-circle"
                onClick={() => setOpenModal(false)}
              >
                <X size={15} />
              </button>
            </div>
            <div className="ios-segmented-tabs sheet-toggle-margin">
              <button
                className={formData.type === "expense" ? "active" : ""}
                onClick={() => setFormData({ ...formData, type: "expense" })}
              >
                Pengeluaran
              </button>
              <button
                className={formData.type === "income" ? "active" : ""}
                onClick={() => setFormData({ ...formData, type: "income" })}
              >
                Pemasukan
              </button>
            </div>

            <div className="sheet-form-inputs">
              {/* AI CARD */}
              <div
                onClick={async () => {
                  if (!formData.amount || !formData.date) {
                    triggerToast(
                      "Harap isi Nominal dan Tanggal terlebih dahulu!",
                      "danger",
                    );
                    return;
                  }

                  try {
                    const response = await apiClient.post("/api/ai/predict", {
                      date: formData.date,
                      amount_rupiah: Number(formData.amount),
                      transaction_type:
                        formData.type === "income" ? "Income" : "Expense",
                      top_k: 3,
                    });

                    const data = response.data;
                    const categoryMap = {
                      Food: "Makan dan Minuman",
                      FoodAndDrinks: "Makan dan Minuman",
                      Entertainment: "Hiburan",
                      Transportation: "Transportasi",
                      Shopping: "Belanja",
                      Salary: "Gaji/ Pemasukan",
                      Income: "Gaji/ Pemasukan",
                      Health: "Kesehatan",
                      Education: "Pendidikan",
                      Utilities: "Lainnya",
                      Rent: "Lainnya",
                      Bills: "Lainnya",
                      Others: "Lainnya",
                    };

                    const kategori =
                      categoryMap[data.predicted_category] || "Lainnya";
                    setFormData((prev) => ({ ...prev, category: kategori }));
                    triggerToast(
                      `AI Memilih: ${kategori} (${data.confidence || "Akurat"})`,
                      "success",
                    );
                  } catch (err) {
                    console.log("AI OFF", err);
                    triggerToast(
                      "AI Service tidak tersedia saat ini",
                      "danger",
                    );
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "20px",
                  borderRadius: "22px",
                  border: "1px solid rgba(139,92,246,.22)",
                  background: "rgba(139,92,246,.08)",
                  marginBottom: "20px",
                  cursor: "pointer",
                }}
              >
                <Brain size={26} color="#7C3AED" />
                <div>
                  <h4
                    style={{ margin: 0, color: "#6D28D9", fontWeight: "700" }}
                  >
                    Prediksi dengan AI
                  </h4>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "13px",
                      color: "#8B5CF6",
                    }}
                  >
                    Klik untuk prediksi kategori otomatis
                  </p>
                </div>
              </div>

              <div className="sheet-input-field">
                <label>Deskripsi Transaksi</label>
                <input
                  type="text"
                  placeholder="Kopi Sore, Gaji Project"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>
              <div className="sheet-input-row">
                <div className="sheet-input-field">
                  <label>Nominal (Rp)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                  />
                </div>
                <div className="sheet-input-field">
                  <label>Tanggal</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="sheet-input-field">
                <label>Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  <option value="" disabled>
                    Pilih klasifikasi kategori...
                  </option>
                  <option value="Makan dan Minuman">Makan dan Minuman</option>
                  <option value="Transportasi">Transportasi</option>
                  <option value="Investasi">Investasi</option>
                  <option value="Hiburan">Hiburan</option>
                  <option value="Belanja">Belanja</option>
                  <option value="Gaji/ Pemasukan">Gaji/ Pemasukan</option>
                  <option value="Kesehatan">Kesehatan</option>
                  <option value="Pendidikan">Pendidikan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>
            <div className="sheet-action-footer">
              <button
                className="sheet-btn-cancel"
                onClick={() => setOpenModal(false)}
              >
                Batal
              </button>
              <button className="sheet-btn-commit" onClick={handleSubmit}>
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {openLimitModal && (
        <div className="sheet-backdrop-blur">
          <div className="sheet-modal-body limit-modal-size">
            <div className="sheet-header">
              <h2>Atur Batas Anggaran</h2>
              <button
                className="sheet-close-circle"
                onClick={() => setOpenLimitModal(false)}
              >
                <X size={15} />
              </button>
            </div>
            <div className="sheet-form-inputs">
              <div className="sheet-input-field">
                <label>Batas Pengeluaran Bulan Ini (Rp)</label>
                <input
                  type="number"
                  value={tempLimit}
                  onChange={(e) => setTempLimit(Number(e.target.value))}
                  placeholder="5000000"
                />
              </div>
            </div>
            <div className="sheet-action-footer" style={{ marginTop: "24px" }}>
              <button
                className="sheet-btn-cancel"
                onClick={() => setOpenLimitModal(false)}
              >
                Batal
              </button>
              <button
                className="sheet-btn-commit"
                onClick={() => {
                  setMonthlyLimit(tempLimit);
                  setHasSetBudget(true);
                  const user = JSON.parse(localStorage.getItem("userData"));
                  localStorage.setItem(
                    `cerminsaku_budget_limit_${user.id}`,
                    tempLimit,
                  );
                  setOpenLimitModal(false);
                  triggerToast(
                    "Batas anggaran berhasil diperbarui.",
                    "success",
                  );
                }}
              >
                Simpan Batasan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
