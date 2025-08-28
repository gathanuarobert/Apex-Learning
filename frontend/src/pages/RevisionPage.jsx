// src/pages/RevisionPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import { ArrowLeft, Wallet, Download, Search, X, Plus, Trash2, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ---------- Pricing (from your spec) ----------
const PRICING = {
  perSubjectPerGrade: 50,
  topical: 20,
  subjectAllGrades: 150,
  allSubjectsAllGrades: 300,
  examWithMS: 20,
  otherTeachingMaterial: 50,
};

// ---------- M-Pesa helpers (mocked for frontend) ----------
async function stkPush({ phone, amount, accountRef, description }) {
  console.log(`Mock STK Push: Phone=${phone}, Amount=${amount}, Ref=${accountRef}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        CheckoutRequestID: `mock_req_${Date.now()}`,
        MerchantRequestID: `mock_merch_${Date.now()}`,
      });
    }, 1000);
  });
}

async function queryStk({ checkoutRequestID }) {
  console.log(`Mock STK Query for ID: ${checkoutRequestID}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        resultCode: "0",
        resultDesc: "Success",
        mpesaReceipt: `mock_receipt_${Date.now()}`,
        amount: 50,
      });
    }, 2000);
  });
}

// ---------- Component ----------
export default function RevisionPage() {
  const navigate = useNavigate();

  const [materials, setMaterials] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newMaterial, setNewMaterial] = useState({ title: '', url: '', type: 'video', price: 50 });
  const [showAddForm, setShowAddForm] = useState(false);

  const [walletBalance, setWalletBalance] = useState(() => {
    const saved = localStorage.getItem("walletBalance");
    return saved ? Number(saved) : 500;
  });
  useEffect(() => localStorage.setItem("walletBalance", String(walletBalance)), [walletBalance]);

  const [paidMaterials, setPaidMaterials] = useState(() => {
    try {
      const saved = localStorage.getItem("paidRevisionMaterials");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem("paidRevisionMaterials", JSON.stringify(Array.from(paidMaterials)));
  }, [paidMaterials]);

  const [showWallet, setShowWallet] = useState(false);
  const [walletPhone, setWalletPhone] = useState("");
  const [topUpAmount, setTopUpAmount] = useState("");
  const [paymentModal, setPaymentModal] = useState(null);
  const [mpesaPhone, setMpesaPhone] = useState("");
  
  // Mock user state: In a real app, this would come from an auth context or API
  const [user, setUser] = useState({
    username: 'JaneDoe',
    isAdmin: true, // Set to true for admin, false for regular user
  });

  // Particles background configuration
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

  // Simulate fetching data from a backend
  useEffect(() => {
    const mockData = [
      { id: 1, title: "Algebra Basics Explained", type: "video", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", price: 0, date: "2025-08-15" },
      { id: 2, title: "Newton's Laws Summary", type: "link", url: "https://example.com/newton-laws.pdf", price: 150, date: "2025-08-14" },
      { id: 3, title: "Photosynthesis Process", type: "screenshot", url: "https://i.imgur.com/2s4R5lD.png", price: 100, date: "2025-08-13" },
      { id: 4, title: "Calculus in 5 Minutes", type: "video", url: "https://www.youtube.com/watch?v=xfXg_W3F2QY", price: 0, date: "2025-08-12" },
      { id: 5, title: "Periodic Table Cheat Sheet", type: "screenshot", url: "https://i.imgur.com/8aB8qLp.png", price: 120, date: "2025-08-11" },
      { id: 6, title: "HTML/CSS Fundamentals", type: "video", url: "https://www.youtube.com/watch?v=G3e-cpL7bLg", price: 0, date: "2025-08-10" },
    ];
    setMaterials(mockData);
  }, []);

  const filteredMaterials = useMemo(() => {
    let filtered = materials;
    if (activeTab !== 'all') {
      filtered = filtered.filter(mat => mat.type === activeTab);
    }
    if (searchTerm) {
      filtered = filtered.filter(mat =>
        mat.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  }, [materials, activeTab, searchTerm]);

  const handleAddMaterial = (e) => {
    e.preventDefault();
    if (!newMaterial.title || !newMaterial.url) return;
    const newMat = {
      ...newMaterial,
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
    };
    setMaterials(prev => [newMat, ...prev]);
    setNewMaterial({ title: '', url: '', type: 'video', price: 50 });
    setShowAddForm(false);
  };

  const handleDeleteMaterial = (id) => {
    setMaterials(prev => prev.filter(mat => mat.id !== id));
  };
  
  const handleDownload = (material) => {
    if (material.price === 0 || paidMaterials.has(material.url)) {
      window.open(material.url, '_blank');
      return;
    }
    openPurchase(material);
  };

  // ---------- Wallet top-up via M-Pesa ----------
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
        const { resultCode, amount: paid } = await queryStk({ checkoutRequestID: CheckoutRequestID });
        if (resultCode === "0") {
          setWalletBalance((b) => b + Number(paid || amount));
          setTopUpAmount("");
          alert("Top-up successful ✅");
          setShowWallet(false);
        } else if (Date.now() - start < 60000 && resultCode === "1") {
          setTimeout(poll, 3000);
        } else {
          alert(`Top-up failed/cancelled.`);
        }
      };
      setTimeout(poll, 3500);
    } catch (e) {
      console.error(e);
      alert("Failed to initiate M-Pesa top-up. Check connection and try again.");
    }
  };

  const payViaWallet = (price, material) => {
    if (walletBalance < price) {
      alert("Insufficient wallet balance. Top up via M-Pesa in your wallet.");
      return false;
    }
    setWalletBalance((b) => b - price);
    setPaidMaterials(prev => new Set(prev).add(material.url));
    alert(`Payment successful! KES ${price} deducted from wallet. You can now download the material.`);
    return true;
  };

  const payViaMpesa = async (price, material) => {
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
        accountRef: "REVISION_PURCHASE",
        description: `Purchase: ${material.title}`,
      });

      alert("M-Pesa STK Push sent. Complete payment on your phone.");
      const start = Date.now();
      const poll = async () => {
        const { resultCode } = await queryStk({ checkoutRequestID: CheckoutRequestID });
        if (resultCode === "0") {
          setPaidMaterials(prev => new Set(prev).add(material.url));
          alert("Payment confirmed ✅ Download starting...");
          window.open(material.url, '_blank');
          setPaymentModal(null);
        } else if (Date.now() - start < 60000 && resultCode === "1") {
          setTimeout(poll, 3000);
        } else {
          alert(`Payment failed/cancelled.`);
        }
      };
      setTimeout(poll, 3500);
    } catch (e) {
      console.error(e);
      alert("Failed to initiate M-Pesa payment. Try again.");
    }
  };
  const openPurchase = (material) => setPaymentModal(material);

  // ---------- UI ----------
  return (
    <div className="min-h-screen relative text-white">
      <Particles id="tsparticles" init={particlesInit} options={particleOptions} className="absolute inset-0 -z-10" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
        <div className="absolute -top-24 -left-24 h-80 w-80 bg-fuchsia-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 bg-cyan-500 rounded-full blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
      </div>

      <div className="relative container mx-auto p-6 z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 hover:text-cyan-300 font-bold text-yellow-300"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <div className="flex-1 max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-3 ring-1 ring-white/15">
              <Search className="shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search materials..."
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

        <h1 className="text-4xl font-extrabold text-center text-cyan-400 mb-6">Other Revision Materials</h1>

        {/* Admin Section: Add New Material */}
        {user.isAdmin && (
          <div className="mb-8 p-6 bg-slate-800/70 backdrop-blur-sm rounded-xl border border-slate-700">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-full p-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 mb-4"
            >
              <Plus size={20} /> {showAddForm ? 'Hide Form' : 'Add New Material'}
            </button>
            {showAddForm && (
              <form onSubmit={handleAddMaterial} className="flex flex-col md:flex-row gap-4 flex-wrap">
                <input
                  type="text"
                  placeholder="Title"
                  value={newMaterial.title}
                  onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                  className="w-full md:flex-1 px-4 py-2 rounded-lg bg-slate-700/50 text-slate-200 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <input
                  type="url"
                  placeholder="URL"
                  value={newMaterial.url}
                  onChange={(e) => setNewMaterial({ ...newMaterial, url: e.target.value })}
                  className="w-full md:flex-1 px-4 py-2 rounded-lg bg-slate-700/50 text-slate-200 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <input
                  type="number"
                  placeholder="Price (KES)"
                  value={newMaterial.price}
                  onChange={(e) => setNewMaterial({ ...newMaterial, price: Number(e.target.value) })}
                  className="w-full md:flex-1 px-4 py-2 rounded-lg bg-slate-700/50 text-slate-200 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <select
                  value={newMaterial.type}
                  onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value })}
                  className="w-full md:w-auto px-4 py-2 rounded-lg bg-slate-700/50 text-slate-200 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="video">Video</option>
                  <option value="link">Link</option>
                  <option value="screenshot">Screenshot</option>
                </select>
                <button
                  type="submit"
                  className="w-full md:w-auto px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <UploadCloud size={18} /> Add
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tabs for filtering content */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <TabButton label="All Materials" type="all" activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton label="Videos" type="video" activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton label="Links" type="link" activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton label="Screenshots" type="screenshot" activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Display Materials */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.length > 0 ? (
            filteredMaterials.map(material => (
              <MaterialCard
                key={material.id}
                material={material}
                onDownload={handleDownload}
                onDelete={handleDeleteMaterial}
                isAdmin={user.isAdmin}
                isPaid={paidMaterials.has(material.url)}
              />
            ))
          ) : (
            <div className="md:col-span-2 lg:col-span-3 text-center text-slate-500 p-8 rounded-xl bg-slate-800/70 border border-slate-700">
              No materials found.
            </div>
          )}
        </div>
      </div>

      {/* Wallet / Top Up (M-Pesa) Modal */}
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
                Type: {paymentModal.type}
            </p>
            <div className="space-y-2">
              <Row
                label="Buy This Material"
                price={paymentModal.price || PRICING.otherTeachingMaterial}
                onWallet={() => {
                  const price = paymentModal.price || PRICING.otherTeachingMaterial;
                  if (payViaWallet(price, paymentModal)) setPaymentModal(null);
                }}
                onMpesa={() => {
                  const price = paymentModal.price || PRICING.otherTeachingMaterial;
                  payViaMpesa(price, paymentModal);
                }}
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

// Helper components
const TabButton = ({ label, type, activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(type)}
    className={`px-6 py-2 rounded-full font-semibold transition-all ${
      activeTab === type
        ? 'bg-fuchsia-600 text-white shadow-lg'
        : 'bg-white/10 text-white/60 hover:bg-white/20'
    }`}
  >
    {label}
  </button>
);

const MaterialCard = ({ material, onDownload, onDelete, isAdmin, isPaid }) => (
  <div className="bg-gradient-to-br from-cyan-700 to-teal-700 p-6 rounded-2xl shadow-lg hover:scale-[1.02] transition relative overflow-hidden">
    <h3 className="text-lg font-extrabold text-white mb-1">{material.title}</h3>
    <p className="text-sm mb-4 font-bold text-white/90">
      Type: {material.type} • {material.price === 0 ? 'Free' : `KES ${material.price}`}
    </p>
    
    <div className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded font-extrabold cursor-pointer" onClick={() => onDownload(material)}>
        {material.price === 0 || isPaid ? (
            <>
                <Download size={18} /> Download
            </>
        ) : (
            <>
                <Plus size={18} /> Buy & Download
            </>
        )}
    </div>

    {isAdmin && (
      <button
        onClick={() => onDelete(material.id)}
        className="absolute top-4 right-4 text-white/60 hover:text-red-400 transition"
        title="Delete Material"
      >
        <Trash2 size={20} />
      </button>
    )}
  </div>
);

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