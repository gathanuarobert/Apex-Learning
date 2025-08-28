// src/pages/PastPapers.jsx

import React, { useEffect, useMemo, useState } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import pastPapersData from "./pastPapersData";
import { ArrowLeft, Wallet, Download, Search, X, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom"; // <-- Import useNavigate

// ---------- Pricing ----------
const PRICING = {
  paperWithMS: 15,
  subjectAllGrades: 120,
};

// ---------- M-Pesa helpers (mocked) ----------
async function stkPush({ phone, amount, accountRef, description }) {
  console.log(`STK Push initiated for KES ${amount} to ${phone}`);
  return { CheckoutRequestID: "mock_checkout_id" };
}

async function queryStk({ checkoutRequestID }) {
  console.log(`Querying status for ${checkoutRequestID}`);
  // Simulate a successful payment after a few seconds
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ resultCode: "0", resultDesc: "Success", amount: 15 });
    }, 3500);
  });
}

// ---------- Component ----------
export default function PastPapers() {
  // Use the navigate hook
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

  // Search flatten across all levels
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
  }, []);

  const filteredItems = searchQuery.trim()
    ? allItems.filter((i) =>
      (i.paper && i.paper.toLowerCase().includes(searchQuery.trim().toLowerCase())) ||
      (i.subject && i.subject.toLowerCase().includes(searchQuery.trim().toLowerCase())) ||
      i.grade.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      i.level.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
    : [];

  // Subject/Paper list for selection
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
  }, [selectedLevel, selectedGrade]);

  // Wallet top-up via M-Pesa
  const handleTopUp = async (amount) => {
    if (!amount || amount <= 0) return alert("Enter a valid amount.");
    if (!/^(?:254|\+254|0)?7\d{8}$/.test(walletPhone.replace(/\s+/g, "")))
      return alert("Enter a valid Safaricom phone (e.g., 2547XXXXXXXX).");

    try {
      let msisdn = walletPhone.replace(/\s+/g, "");
      if (msisdn.startsWith("+")) msisdn = msisdn.slice(1);
      if (msisdn.startsWith("0")) msisdn = "254" + msisdn.slice(1);
      if (msisdn.startsWith("7")) msisdn = "254" + msisdn;

      const { CheckoutRequestID } = await stkPush({
        phone: msisdn,
        amount: Number(amount),
        accountRef: "WALLET_TOPUP",
        description: "Apex Wallet Top-up",
      });

      alert("M-Pesa STK Push sent. Complete payment on your phone.");
      const start = Date.now();
      const poll = async () => {
        const { resultCode, resultDesc, amount: paid } = await queryStk({ checkoutRequestID: CheckoutRequestID });
        if (resultCode === "0") {
          setWalletBalance((b) => b + Number(paid || amount));
          setTopUpAmount("");
          alert("Top-up successful ✅");
          setShowWallet(false);
        } else if (Date.now() - start < 60000 && resultCode === "1") {
          setTimeout(poll, 3000);
        } else {
          alert(`Top-up failed/cancelled: ${resultDesc || "Try again."}`);
        }
      };
      setTimeout(poll, 3500);
    } catch (e) {
      console.error(e);
      alert("Failed to initiate M-Pesa top-up. Check connection and try again.");
    }
  };

  // Purchasing
  const payViaWallet = (price) => {
    if (walletBalance < price) {
      alert("Insufficient wallet balance. Top up via M-Pesa in your wallet.");
      return false;
    }
    setWalletBalance((b) => b - price);
    alert(`Payment successful! KES ${price} deducted from wallet.`);
    return true;
  };

  const payViaMpesa = async (price, paperTitle) => {
    if (!/^(?:254|\+254|0)?7\d{8}$/.test(mpesaPhone.replace(/\s+/g, "")))
      return alert("Enter a valid Safaricom phone (e.g., 2547XXXXXXXX).");

    try {
      let msisdn = mpesaPhone.replace(/\s+/g, "");
      if (msisdn.startsWith("+")) msisdn = msisdn.slice(1);
      if (msisdn.startsWith("0")) msisdn = "254" + msisdn.slice(1);
      if (msisdn.startsWith("7")) msisdn = "254" + msisdn;

      const { CheckoutRequestID } = await stkPush({
        phone: msisdn,
        amount: Number(price),
        accountRef: "PAPER_PURCHASE",
        description: `Purchase: ${paperTitle}`,
      });

      alert("M-Pesa STK Push sent. Complete payment on your phone.");
      const start = Date.now();
      const poll = async () => {
        const { resultCode, resultDesc } = await queryStk({ checkoutRequestID: CheckoutRequestID });
        if (resultCode === "0") {
          alert("Payment confirmed ✅ Download starting...");
          setPaymentModal(null);
        } else if (Date.now() - start < 60000 && resultCode === "1") {
          setTimeout(poll, 3000);
        } else {
          alert(`Payment failed/cancelled: ${resultDesc || "Try again."}`);
        }
      };
      setTimeout(poll, 3500);
    } catch (e) {
      console.error(e);
      alert("Failed to initiate M-Pesa payment. Try again.");
    }
  };

  const openPurchase = (title, meta = {}) => setPaymentModal({ title, meta });

  // UI
  return (
    <div className="min-h-screen relative text-white">
      {/* Interactive background */}
      <Particles id="tsparticles" init={particlesInit} options={particleOptions} className="absolute inset-0 -z-10" />

      {/* Top bar */}
      <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Updated Back button logic */}
        <button
          onClick={() => {
            if (selectedGrade) setSelectedGrade(null);
            else if (selectedLevel) setSelectedLevel(null);
            else navigate("/user-dashboard"); // <-- Redirect to dashboard
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

        {/* Wallet chip */}
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

      {/* Grade/Form/Major selection */}
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

      {/* Subjects/Past Papers list */}
      {!searchQuery && selectedLevel && selectedGrade && (
        <div className="px-6 pb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {currentPapers.map(({ subject, paper }, i) => (
            <div
              key={`${subject}-${paper}-${i}`}
              className="bg-gradient-to-br from-emerald-700 to-lime-700 p-6 rounded-2xl shadow-lg hover:scale-[1.02] transition relative overflow-hidden"
            >
              <h3 className="text-lg font-extrabold text-white mb-3">{paper}</h3>
              {subject && <p className="text-sm mb-4 font-bold text-white/90">{subject}</p>}
              <button
                onClick={() => openPurchase(paper, { level: selectedLevel, grade: selectedGrade, subject })}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded font-extrabold"
              >
                <Download size={18} /> Buy & Download
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Wallet / Top Up (M-Pesa) */}
      {showWallet && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0f172a] text-white p-6 rounded-2xl shadow-2xl w-[420px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-yellow-300">Wallet</h2>
              <button onClick={() => setShowWallet(false)} className="hover:text-red-300">
                <X size={18} />
              </button>
            </div>
            <div className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-3 mb-4">
              <div className="flex items-center gap-2 font-bold">
                <Wallet size={18} />
                <span className="opacity-90">Balance</span>
              </div>
              <div className="text-2xl font-extrabold text-yellow-300">{walletBalance} KES</div>
            </div>
            <label className="text-sm font-extrabold text-yellow-300">M-Pesa Phone (e.g., 2547XXXXXXXX)</label>
            <input
              value={walletPhone}
              onChange={(e) => setWalletPhone(e.target.value)}
              placeholder="2547XXXXXXXX"
              className="w-full p-2 rounded mt-1 mb-3 text-black font-bold"
            />
            <label className="text-sm font-extrabold text-yellow-300">Top-up Amount (KES)</label>
            <div className="flex gap-2 mt-1 mb-3">
              <input
                type="number"
                min={1}
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="flex-1 p-2 rounded text-black font-bold"
                placeholder="Enter amount"
              />
              <button
                onClick={() => handleTopUp(Number(topUpAmount || 0))}
                className="bg-yellow-400 text-black font-extrabold px-4 rounded hover:bg-yellow-300"
              >
                Top Up
              </button>
            </div>
            <p className="text-sm opacity-80 mb-2 font-bold">Quick add</p>
            <div className="flex gap-2">
              {[100, 200, 500].map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleTopUp(amt)}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-xl font-extrabold"
                >
                  <Plus size={16} /> {amt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal (tiers) */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0f172a] text-white p-6 rounded-2xl shadow-2xl w-[560px]">
            <h2 className="text-lg font-extrabold mb-1 text-yellow-300">Purchase: {paymentModal.title}</h2>
            <p className="text-sm mb-4 font-bold text-white/90">
              {paymentModal?.meta?.level && `${paymentModal.meta.level} • `}
              {paymentModal?.meta?.grade} {paymentModal?.meta?.subject && `• ${paymentModal.meta.subject}`}
            </p>

            <div className="space-y-2 mb-4">
              <Row
                label="Single Past Paper"
                price={PRICING.paperWithMS}
                onWallet={() => {
                  if (payViaWallet(PRICING.paperWithMS)) setPaymentModal(null);
                }}
                onMpesa={() => payViaMpesa(PRICING.paperWithMS, paymentModal.title)}
              />
              <Row
                label="All Past Papers per Subject for the entire grade"
                price={PRICING.subjectAllGrades}
                onWallet={() => {
                  if (payViaWallet(PRICING.subjectAllGrades)) setPaymentModal(null);
                }}
                onMpesa={() => payViaMpesa(PRICING.subjectAllGrades, paymentModal.title)}
              />
            </div>

            <div className="mt-4">
              <label className="text-xs font-extrabold text-yellow-300">M-Pesa Phone (for direct pay)</label>
              <input
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                placeholder="2547XXXXXXXX"
                className="w-full p-2 rounded mt-1 text-black font-bold"
              />
            </div>

            <button
              onClick={() => setPaymentModal(null)}
              className="mt-5 w-full p-2 bg-red-500 rounded hover:bg-red-600 font-extrabold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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