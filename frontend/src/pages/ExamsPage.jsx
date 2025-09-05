// src/pages/Notes.jsx
import React, { useEffect, useMemo, useState } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import notesData from "./notesData";
import { ArrowLeft, Wallet, Download, Search, X, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ---- Import API ----
import { initiateMpesaPayment } from "../Api"; // Adjust path if needed

export default function Notes() {
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

  const allItems = useMemo(() => {
    const out = [];
    Object.keys(notesData).forEach((level) => {
      Object.keys(notesData[level]).forEach((grade) => {
        const bucket = notesData[level][grade];
        if (level === "University") {
          (bucket || []).forEach((note) => out.push({ level, grade, note }));
        } else {
          if (bucket?.subjects) {
            Object.keys(bucket.subjects).forEach((subject) => {
              (bucket.subjects[subject].notes || []).forEach((note) => {
                out.push({ level, grade, subject, note });
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
      (i.note && i.note.toLowerCase().includes(searchQuery.trim().toLowerCase())) ||
      (i.subject && i.subject.toLowerCase().includes(searchQuery.trim().toLowerCase())) ||
      i.grade.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      i.level.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
    : [];

  const currentNotes = useMemo(() => {
    if (!selectedLevel || !selectedGrade) return [];
    if (selectedLevel === "University") {
      return (notesData[selectedLevel][selectedGrade] || []).map((n) => ({ note: n }));
    }
    const bucket = notesData[selectedLevel][selectedGrade];
    if (!bucket?.subjects) return [];
    const noteList = [];
    Object.keys(bucket.subjects).forEach((subject) => {
      (bucket.subjects[subject].notes || []).forEach((note) => {
        noteList.push({ subject, note });
      });
    });
    return noteList;
  }, [selectedLevel, selectedGrade]);

  // Wallet top-up
  const handleTopUp = async (amount) => {
    if (!amount || amount <= 0) return alert("Enter a valid amount.");
    if (!/^(?:254|\+254|0)?7\d{8}$/.test(walletPhone.replace(/\s+/g, "")))
      return alert("Enter a valid Safaricom phone (e.g., 2547XXXXXXXX).");

    try {
      let msisdn = walletPhone.replace(/\s+/g, "");
      if (msisdn.startsWith("+")) msisdn = msisdn.slice(1);
      if (msisdn.startsWith("0")) msisdn = "254" + msisdn.slice(1);
      if (msisdn.startsWith("7")) msisdn = "254" + msisdn;

      await initiateMpesaPayment(msisdn, Number(amount), "Wallet Top-up");
      alert("M-Pesa STK Push sent. Complete payment on your phone.");
      setWalletBalance((b) => b + Number(amount));
      setTopUpAmount("");
      setShowWallet(false);
    } catch (e) {
      console.error(e);
      alert("Failed to initiate M-Pesa top-up. Try again.");
    }
  };

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

      await initiateMpesaPayment(msisdn, Number(20), noteTitle); // default 20 KES per note
      alert("Payment STK Push sent. Complete payment on your phone.");
      setPaymentModal(null);
    } catch (e) {
      console.error(e);
      alert("Failed to initiate M-Pesa payment. Try again.");
    }
  };

  const openPurchase = (title, meta = {}) => setPaymentModal({ title, meta });

  return (
    <div className="min-h-screen relative text-white">
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
              placeholder="Search notes, subjects, grades, majors…"
              className="w-full bg-transparent outline-none placeholder-yellow-300/80 text-white font-extrabold"
            />
          </div>
        </div>

        <button
          onClick={() => setShowWallet(true)}
          className="flex items-center gap-2 bg-yellow-400 text-black font-extrabold px-4 py-2 rounded-full hover:bg-yellow-300"
        >
          <Wallet size={18} /> {walletBalance} KES
        </button>
      </div>

      {/* Render search results or current notes */}
      {searchQuery ? (
        <div className="px-6 pb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => (
              <div
                key={`${item.level}-${item.grade}-${item.subject}-${item.note}-${idx}`}
                className="bg-gradient-to-br from-fuchsia-700 to-indigo-800 p-6 rounded-2xl shadow-lg hover:scale-[1.02] transition relative overflow-hidden"
              >
                <h3 className="text-lg font-extrabold text-yellow-300 mb-1">{item.note}</h3>
                <p className="text-sm mb-4 font-bold text-white/90">
                  {item.level} • {item.grade} {item.subject && `• ${item.subject}`}
                </p>
                <button
                  onClick={() => openPurchase(item.note, { level: item.level, grade: item.grade })}
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
      ) : (
        <div className="px-6 pb-12">
          {/* Level selection */}
          {!selectedLevel && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
          {selectedLevel && !selectedGrade && (
            <div>
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

          {/* Notes list */}
          {selectedLevel && selectedGrade && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {currentNotes.map(({ subject, note }, i) => (
                <div
                  key={`${subject}-${note}-${i}`}
                  className="bg-gradient-to-br from-emerald-700 to-lime-700 p-6 rounded-2xl shadow-lg hover:scale-[1.02] transition relative overflow-hidden"
                >
                  <h3 className="text-lg font-extrabold text-white mb-3">{note}</h3>
                  {subject && <p className="text-sm mb-4 font-bold text-white/90">{subject}</p>}
                  <button
                    onClick={() => openPurchase(note, { level: selectedLevel, grade: selectedGrade, subject })}
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded font-extrabold"
                  >
                    <Download size={18} /> Buy & Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
