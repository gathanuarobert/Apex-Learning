// src/pages/Notes.jsx
import React, { useEffect, useMemo, useState } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import notesData from "./notesData";
import { ArrowLeft, Wallet, Download, Search, X, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom"; // Import useNavigate

// ---------- Pricing (from your spec) ----------
const PRICING = {
  perSubjectPerGrade: 50, // Per form/grade per subject
  topical: 20, // Topically
  subjectAllGrades: 150, // All forms/grades per subject
  allSubjectsAllGrades: 300, // All subjects for all forms/grades
  examWithMS: 20, // One exam with marking scheme
  otherTeachingMaterial: 50, // Any other teaching material
};

// ---------- M-Pesa helpers ----------
async function stkPush({ phone, amount, accountRef, description }) {
  // Calls your backend for real M-Pesa STK Push
  const res = await fetch("/api/mpesa/stkpush", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, amount, accountRef, description }),
  });
  if (!res.ok) throw new Error("Failed to initiate STK Push");
  return res.json(); // { CheckoutRequestID, MerchantRequestID }
}

async function queryStk({ checkoutRequestID }) {
  const res = await fetch("/api/mpesa/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ checkoutRequestID }),
  });
  if (!res.ok) throw new Error("Failed to query STK status");
  return res.json(); // { resultCode, resultDesc, mpesaReceipt, amount }
}

// ---------- Component ----------
export default function Notes() {
  const navigate = useNavigate(); // Initialize useNavigate hook

  const [walletBalance, setWalletBalance] = useState(() => {
    const saved = localStorage.getItem("walletBalance");
    return saved ? Number(saved) : 500;
  });
  useEffect(() => localStorage.setItem("walletBalance", String(walletBalance)), [walletBalance]);

  const [showWallet, setShowWallet] = useState(false);
  const [walletPhone, setWalletPhone] = useState("");
  const [topUpAmount, setTopUpAmount] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(null); // "CBC" | "8-4-4" | "University"
  const [selectedGrade, setSelectedGrade] = useState(null); // Grade/Form/Year/Major
  const [paymentModal, setPaymentModal] = useState(null); // { title, meta }
  const [mpesaPhone, setMpesaPhone] = useState("");

  // Particles (subtle, professional)
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

  // ---------- Search flatten across all levels ----------
  const allItems = useMemo(() => {
    const out = [];
    Object.keys(notesData).forEach((level) => {
      Object.keys(notesData[level]).forEach((grade) => {
        const bucket = notesData[level][grade];
        if (level === "University") {
          // majors -> modules array
          (bucket || []).forEach((module) => out.push({ level, grade, subject: module }));
        } else {
          if (bucket?.subjects) {
            Object.keys(bucket.subjects).forEach((subject) => {
              out.push({ level, grade, subject });
            });
          }
        }
      });
    });
    return out;
  }, []);
  const filteredItems = searchQuery.trim()
    ? allItems.filter((i) =>
      i.subject.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      i.grade.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      i.level.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
    : [];

  // ---------- Subject/module list for selection ----------
  const currentSubjects = useMemo(() => {
    if (!selectedLevel || !selectedGrade) return [];
    if (selectedLevel === "University") {
      return (notesData[selectedLevel][selectedGrade] || []).map((m) => ({ subject: m, isModule: true }));
    }
    const bucket = notesData[selectedLevel][selectedGrade];
    if (!bucket?.subjects) return [];
    return Object.keys(bucket.subjects).map((s) => ({ subject: s, isModule: false }));
  }, [selectedLevel, selectedGrade]);

  // ---------- Wallet top-up via M-Pesa ----------
  const handleTopUp = async (amount) => {
    if (!amount || amount <= 0) return alert("Enter a valid amount.");
    if (!/^(?:254|\+254|0)?7\d{8}$/.test(walletPhone.replace(/\s+/g, "")))
      return alert("Enter a valid Safaricom phone (e.g., 2547XXXXXXXX).");

    try {
      // Normalize to 254 format
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
      // Poll for confirmation (up to ~60s)
      const start = Date.now();
      const poll = async () => {
        const { resultCode, resultDesc, amount: paid } = await queryStk({ checkoutRequestID: CheckoutRequestID });
        if (resultCode === "0") {
          setWalletBalance((b) => b + Number(paid || amount));
          setTopUpAmount("");
          alert("Top-up successful ✅");
          setShowWallet(false);
        } else if (Date.now() - start < 60000 && resultCode === "1") {
          // "1" here treated as "still pending" per our backend; adjust as needed
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

  // ---------- Purchasing ----------
  const payViaWallet = (price) => {
    if (walletBalance < price) {
      alert("Insufficient wallet balance. Top up via M-Pesa in your wallet.");
      return false;
    }
    setWalletBalance((b) => b - price);
    alert(`Payment successful! KES ${price} deducted from wallet.`);
    return true;
  };

  const payViaMpesa = async (price, noteTitle) => {
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
        accountRef: "NOTES_PURCHASE",
        description: `Purchase: ${noteTitle}`,
      });

      alert("M-Pesa STK Push sent. Complete payment on your phone.");
      const start = Date.now();
      const poll = async () => {
        const { resultCode, resultDesc } = await queryStk({ checkoutRequestID: CheckoutRequestID });
        if (resultCode === "0") {
          alert("Payment confirmed ✅ Download starting...");
          setPaymentModal(null);
          // TODO: trigger actual file download here
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

  // ---------- UI ----------
  return (
    <div className="min-h-screen relative text-white">
      {/* Interactive background */}
      <Particles id="tsparticles" init={particlesInit} options={particleOptions} className="absolute inset-0 -z-10" />

      {/* Top bar */}
      <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <button
          onClick={() => {
            if (selectedGrade) setSelectedGrade(null);
            else if (selectedLevel) setSelectedLevel(null);
            else navigate(-1); // Use navigate(-1) for back button behavior
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
              placeholder="Search subjects, modules, grades, majors…"
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
                key={`${item.level}-${item.grade}-${item.subject}-${idx}`}
                className="bg-gradient-to-br from-fuchsia-700 to-indigo-800 p-6 rounded-2xl shadow-lg hover:scale-[1.02] transition relative overflow-hidden"
              >
                <h3 className="text-lg font-extrabold text-yellow-300 mb-1">{item.subject}</h3>
                <p className="text-sm mb-4 font-bold text-white/90">
                  {item.level} • {item.grade}
                </p>
                <button
                  onClick={() => openPurchase(item.subject, { level: item.level, grade: item.grade })}
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
          {Object.keys(notesData).map((level) => (
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
            {Object.keys(notesData[selectedLevel]).map((grade) => (
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

      {/* Subjects/Modules list */}
      {!searchQuery && selectedLevel && selectedGrade && (
        <div className="px-6 pb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {currentSubjects.map(({ subject }, i) => (
            <div
              key={`${subject}-${i}`}
              className="bg-gradient-to-br from-emerald-700 to-lime-700 p-6 rounded-2xl shadow-lg hover:scale-[1.02] transition relative overflow-hidden"
            >
              <h3 className="text-lg font-extrabold text-white mb-3">{subject}</h3>
              <button
                onClick={() => openPurchase(subject, { level: selectedLevel, grade: selectedGrade })}
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
              {paymentModal?.meta?.grade}
            </p>

            <div className="space-y-2 mb-4">
              <Row
                label="Per form/grade per subject"
                price={PRICING.perSubjectPerGrade}
                onWallet={() => {
                  if (payViaWallet(PRICING.perSubjectPerGrade)) setPaymentModal(null);
                }}
                onMpesa={() => payViaMpesa(PRICING.perSubjectPerGrade, paymentModal.title)}
              />
              <Row
                label="Topically"
                price={PRICING.topical}
                onWallet={() => {
                  if (payViaWallet(PRICING.topical)) setPaymentModal(null);
                }}
                onMpesa={() => payViaMpesa(PRICING.topical, paymentModal.title)}
              />
              <Row
                label="Package: all notes for all forms/grades per subject"
                price={PRICING.subjectAllGrades}
                onWallet={() => {
                  if (payViaWallet(PRICING.subjectAllGrades)) setPaymentModal(null);
                }}
                onMpesa={() => payViaMpesa(PRICING.subjectAllGrades, paymentModal.title)}
              />
              <Row
                label="Package: all notes for all subjects for all forms/grades"
                price={PRICING.allSubjectsAllGrades}
                onWallet={() => {
                  if (payViaWallet(PRICING.allSubjectsAllGrades)) setPaymentModal(null);
                }}
                onMpesa={() => payViaMpesa(PRICING.allSubjectsAllGrades, paymentModal.title)}
              />
            </div>

            <div className="border-t border-white/10 my-3" />

            <div className="space-y-2">
              <Row
                label="Exam (with marking scheme)"
                price={PRICING.examWithMS}
                onWallet={() => {
                  if (payViaWallet(PRICING.examWithMS)) setPaymentModal(null);
                }}
                onMpesa={() => payViaMpesa(PRICING.examWithMS, paymentModal.title)}
              />
              <Row
                label="Any other teaching material"
                price={PRICING.otherTeachingMaterial}
                onWallet={() => {
                  if (payViaWallet(PRICING.otherTeachingMaterial)) setPaymentModal(null);
                }}
                onMpesa={() => payViaMpesa(PRICING.otherTeachingMaterial, paymentModal.title)}
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