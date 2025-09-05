// src/pages/PastPapers.jsx

import React, { useEffect, useMemo, useState } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { ArrowLeft, Wallet, Download, Search, X, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api, { getPastPapers, initiateWalletDeposit, initiateOneTimePurchase, walletPurchase } from "../Api";

// ---------- Pricing ----------
const PRICING = {
  paperWithMS: 15,
  subjectAllGrades: 120,
};

// ---------- Component ----------
export default function PastPapers() {
  const navigate = useNavigate();

  const [walletBalance, setWalletBalance] = useState(() => {
    const saved = localStorage.getItem("walletBalance");
    return saved ? Number(saved) : 500;
  });
  useEffect(() => localStorage.setItem("walletBalance", String(walletBalance)), [walletBalance]);

  const [showWallet, setShowWallet] = useState(false);
  const [walletPhone, setWalletPhone] = useState("");
  const [topUpAmount, setTopUpAmount] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [mpesaPhone, setMpesaPhone] = useState("");

  const [pastPapersData, setPastPapersData] = useState({});

  // Fetch past papers from backend
  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const res = await getPastPapers();
        setPastPapersData(res.data);
      } catch (e) {
        console.error("Failed to fetch past papers:", e);
        alert("Failed to fetch past papers. Try again later.");
      }
    };
    fetchPapers();
  }, []);

  // Particles
  const particlesInit = async (engine) => { await loadSlim(engine); };
  const particleOptions = {
    background: { color: { value: "#0B1220" } },
    fpsLimit: 60,
    particles: {
      number: { value: 55, density: { enable: true, area: 800 } },
      color: { value: ["#FDE047", "#22D3EE", "#A78BFA"] },
      opacity: { value: 0.25 },
      size: { value: { min: 1, max: 3 } },
      move: { enable: true, speed: 0.6, outModes: { default: "out" } },
      links: { enable: true, distance: 130, opacity: 0.2 },
    },
    detectRetina: true,
  };

  // Flatten for search
  const allItems = useMemo(() => {
    const out = [];
    Object.keys(pastPapersData).forEach((level) => {
      Object.keys(pastPapersData[level]).forEach((grade) => {
        const bucket = pastPapersData[level][grade];
        if (level === "University") {
          (bucket || []).forEach((paper) => out.push({ level, grade, paper }));
        } else {
          if (bucket?.subjects) {
            Object.keys(bucket.subjects).forEach((subject) => {
              (bucket.subjects[subject].exams || []).forEach((paper) => {
                out.push({ level, grade, subject, paper });
              });
            });   
          }
        }
      });
    });
    return out;
  }, [pastPapersData]);

  const filteredItems = searchQuery.trim()
    ? allItems.filter((i) =>
      (i.paper && i.paper.toLowerCase().includes(searchQuery.trim().toLowerCase())) ||
      (i.subject && i.subject.toLowerCase().includes(searchQuery.trim().toLowerCase())) ||
      i.grade.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      i.level.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
    : [];

  const currentPapers = useMemo(() => {
    if (!selectedLevel || !selectedGrade) return [];
    if (selectedLevel === "University") {
      return (pastPapersData[selectedLevel][selectedGrade] || []).map((e) => ({ paper: e, isModule: true }));
    }
    const bucket = pastPapersData[selectedLevel][selectedGrade];
    if (!bucket?.subjects) return [];
    const paperList = [];
    Object.keys(bucket.subjects).forEach((subject) => {
      (bucket.subjects[subject].exams || []).forEach((paper) => {
        paperList.push({ subject, paper });
      });
    });
    return paperList;
  }, [selectedLevel, selectedGrade, pastPapersData]);

  // Wallet top-up
  const handleTopUp = async (amount) => {
    if (!amount || amount <= 0) return alert("Enter a valid amount.");
    if (!/^(?:254|\+254|0)?7\d{8}$/.test(walletPhone.replace(/\s+/g, "")))
      return alert("Enter a valid Safaricom phone (e.g., 2547XXXXXXXX).");
    try {
      const { data } = await initiateWalletDeposit({ phone: walletPhone, amount });
      alert("M-Pesa STK Push sent. Complete payment on your phone.");
      const poll = async () => {
        try {
          const res = await api.get(`payments/wallet/status/${data.transaction_id}/`);
          if (res.data.status === "success") {
            setWalletBalance((b) => b + Number(amount));
            setTopUpAmount("");
            alert("Top-up successful ✅");
            setShowWallet(false);
          } else if (res.data.status === "pending") {
            setTimeout(poll, 3000);
          } else {
            alert(`Top-up failed/cancelled: ${res.data.status}`);
          }
        } catch {
          setTimeout(poll, 3000);
        }
      };
      setTimeout(poll, 3000);
    } catch (e) {
      console.error(e);
      alert("Failed to initiate M-Pesa top-up. Try again.");
    }
  };

  // Wallet purchase
  const payViaWallet = async (price, paperTitle) => {
    if (walletBalance < price) {
      alert("Insufficient wallet balance. Top up via M-Pesa in your wallet.");
      return false;
    }
    try {
      const res = await walletPurchase({ paper: paperTitle, price });
      if (res.data.success) {
        setWalletBalance((b) => b - price);
        alert(`Payment successful! KES ${price} deducted from wallet.`);
        // Trigger download
        const blob = await api.get(`resources/past-papers/download/${res.data.file_id}/`, { responseType: "blob" });
        const url = window.URL.createObjectURL(new Blob([blob.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", paperTitle + ".pdf");
        document.body.appendChild(link);
        link.click();
        link.remove();
        return true;
      } else alert("Payment failed. Try again.");
    } catch (e) {
      console.error(e);
      alert("Payment failed. Try again.");
    }
  };

  // M-Pesa purchase
  const payViaMpesa = async (price, paperTitle) => {
    if (!/^(?:254|\+254|0)?7\d{8}$/.test(mpesaPhone.replace(/\s+/g, "")))
      return alert("Enter a valid Safaricom phone (e.g., 2547XXXXXXXX).");
    try {
      const res = await initiateOneTimePurchase({ phone: mpesaPhone, price, paper: paperTitle });
      alert("M-Pesa STK Push sent. Complete payment on your phone.");
      const poll = async () => {
        try {
          const statusRes = await api.get(`payments/mpesa/status/${res.data.transaction_id}/`);
          if (statusRes.data.status === "success") {
            alert("Payment confirmed ✅ Download starting...");
            const blob = await api.get(`resources/past-papers/download/${statusRes.data.file_id}/`, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([blob.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", paperTitle + ".pdf");
            document.body.appendChild(link);
            link.click();
            link.remove();
            setPaymentModal(null);
          } else if (statusRes.data.status === "pending") {
            setTimeout(poll, 3000);
          } else alert("Payment failed/cancelled. Try again.");
        } catch {
          setTimeout(poll, 3000);
        }
      };
      setTimeout(poll, 3000);
    } catch (e) {
      console.error(e);
      alert("Failed to initiate M-Pesa payment. Try again.");
    }
  };

  const openPurchase = (title, meta = {}) => setPaymentModal({ title, meta });

  return (
    <div className="min-h-screen relative text-white">
      {/* Particles background */}
      <Particles id="tsparticles" init={particlesInit} options={particleOptions} className="absolute inset-0 -z-10" />

      {/* Top bar */}
      <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <button
          onClick={() => {
            if (selectedGrade) setSelectedGrade(null);
            else if (selectedLevel) setSelectedLevel(null);
            else navigate("/user-dashboard");
          }}
          className="inline-flex items-center gap-2 hover:text-cyan-300 font-bold text-yellow-300"
        >
          <ArrowLeft size={20} /> Back
        </button>

        <div className="flex-1 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-3 ring-1 ring-white/15">
            <Search className="shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search past papers, subjects, grades, majors…"
              className="w-full bg-transparent outline-none placeholder-yellow-300/80 text-white font-extrabold"
            />
          </div>
        </div>

        <button
          onClick={() => setShowWallet(true)}
          className="flex items-center gap-2 bg-yellow-400 text-black font-extrabold px-4 py-2 rounded-full hover:bg-yellow-300"
          title="Open wallet / Top up (M-Pesa)"
        >
          <Wallet size={18} /> {walletBalance} KES
        </button>
      </div>

      {/* Search results */}
      {searchQuery && (
        <div className="px-6 pb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => (
              <div
                key={`${item.level}-${item.grade}-${item.subject}-${item.paper}-${idx}`}
                className="bg-gradient-to-br from-fuchsia-700 to-indigo-800 p-6 rounded-2xl shadow-lg hover:scale-[1.02] transition relative overflow-hidden"
              >
                <h3 className="text-lg font-extrabold text-yellow-300 mb-1">{item.paper}</h3>
                <p className="text-sm mb-4 font-bold text-white/90">
                  {item.level} • {item.grade} {item.subject && `• ${item.subject}`}
                </p>
                <button
                  onClick={() => openPurchase(item.paper, { level: item.level, grade: item.grade })}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded font-extrabold"
                >
                  <Download size={18} /> Buy & Download
                </button>
              </div>
            ))
          ) : (
            <p className="px-2 font-extrabold text-yellow-300">No matches found.</p>
          )}
        </div>
      )}

      {/* Level selection */}
      {!searchQuery && !selectedLevel && (
        <div className="px-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pb-12">
          {Object.keys(pastPapersData).map((level) => (
            <div
              key={level}
              onClick={() => setSelectedLevel(level)}
              className="bg-gradient-to-br from-cyan-700 to-teal-700 p-6 rounded-2xl shadow-lg hover:scale-[1.02] cursor-pointer transition"
            >
              <h3 className="text-2xl font-extrabold text-white">{level}</h3>
            </div>
          ))}
        </div>
      )}

      {/* Grade selection */}
      {!searchQuery && selectedLevel && !selectedGrade && (
        <div className="px-6 pb-12">
          <p className="mb-3 font-extrabold text-yellow-300">Select a grade/form/major</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Object.keys(pastPapersData[selectedLevel]).map((grade) => (
              <div
                key={grade}
                onClick={() => setSelectedGrade(grade)}
                className="bg-gradient-to-br from-violet-700 to-rose-700 p-6 rounded-2xl shadow-lg hover:scale-[1.02] cursor-pointer transition"
              >
                <h3 className="text-xl font-extrabold">{grade}</h3>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Papers list */}
      {!searchQuery && selectedLevel && selectedGrade && (
        <div className="px-6 pb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {currentPapers.map(({ paper, subject }, idx) => (
            <div key={`${paper}-${idx}`} className="bg-white/10 p-6 rounded-2xl flex flex-col gap-4">
              <h3 className="text-lg font-extrabold text-yellow-300">{paper}</h3>
              {subject && <p className="text-sm font-bold text-white/80">{subject}</p>}
              <Row
                label="Buy & Download"
                price={PRICING.paperWithMS}
                onWallet={() => payViaWallet(PRICING.paperWithMS, paper)}
                onMpesa={() => openPurchase(paper)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Wallet Top-Up Modal */}
      {showWallet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-gray-900 p-6 rounded-2xl max-w-sm w-full">
            <h3 className="text-xl font-extrabold mb-4 text-yellow-300">Wallet Top-Up</h3>
            <input
              type="text"
              placeholder="Enter phone (2547XXXXXXXX)"
              value={walletPhone}
              onChange={(e) => setWalletPhone(e.target.value)}
              className="w-full mb-3 px-4 py-2 rounded bg-white/10 text-white font-extrabold outline-none"
            />
            <input
              type="number"
              placeholder="Amount (KES)"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              className="w-full mb-3 px-4 py-2 rounded bg-white/10 text-white font-extrabold outline-none"
            />
            <div className="flex gap-3">
              <button onClick={() => handleTopUp(topUpAmount)} className="flex-1 bg-yellow-400 text-black rounded font-extrabold py-2 hover:bg-yellow-300">
                Top Up
              </button>
              <button onClick={() => setShowWallet(false)} className="flex-1 bg-white/10 text-white rounded font-extrabold py-2 hover:bg-white/20">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* M-Pesa Purchase Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-gray-900 p-6 rounded-2xl max-w-sm w-full">
            <h3 className="text-xl font-extrabold mb-4 text-yellow-300">Purchase {paymentModal.title}</h3>
            <input
              type="text"
              placeholder="Enter phone (2547XXXXXXXX)"
              value={mpesaPhone}
              onChange={(e) => setMpesaPhone(e.target.value)}
              className="w-full mb-3 px-4 py-2 rounded bg-white/10 text-white font-extrabold outline-none"
            />
            <div className="flex gap-3">
              <button onClick={() => payViaMpesa(PRICING.paperWithMS, paymentModal.title)} className="flex-1 bg-yellow-400 text-black rounded font-extrabold py-2 hover:bg-yellow-300">
                Pay KES {PRICING.paperWithMS}
              </button>
              <button onClick={() => setPaymentModal(null)} className="flex-1 bg-white/10 text-white rounded font-extrabold py-2 hover:bg-white/20">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Row component for wallet/M-Pesa buttons
function Row({ label, price, onWallet, onMpesa }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
      <span className="text-sm font-extrabold text-white">{label}</span>
      <div className="flex gap-2">
        <button onClick={onWallet} className="p-2 bg-blue-600 rounded hover:bg-blue-700 font-extrabold">
          Wallet: KES {price}
        </button>
        <button onClick={onMpesa} className="p-2 bg-yellow-400 text-black rounded hover:bg-yellow-300 font-extrabold">
          M-Pesa: KES {price}
        </button>
      </div>
    </div>
  );
}
