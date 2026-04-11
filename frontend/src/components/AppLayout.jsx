// src/components/AppLayout.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home, Wallet, User, Download, FileText, BookOpen,
  FileArchive, Video, LogOut, X, History, Plus,
  MoreHorizontal, ChevronRight
} from "lucide-react";
import api from "../Api";

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [walletOpen, setWalletOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txSearch, setTxSearch] = useState("");
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);

  // All nav items
  const allNavItems = [
    { icon: Home, label: "Dashboard", route: "/user-dashboard" },
    { icon: FileText, label: "Notes", route: "/notes" },
    { icon: BookOpen, label: "Exams", route: "/exams" },
    { icon: FileArchive, label: "Past Papers", route: "/past-papers" },
    { icon: Video, label: "News", route: "/news" },
    { icon: Download, label: "Library", route: "/user-dashboard", tab: "downloads" },
    { icon: User, label: "Account", route: "/user-dashboard", tab: "credentials" },
    { icon: LogOut, label: "Logout", route: null, isLogout: true },
  ];

  // Mobile bottom nav — show 4 main + "More"
  const mobileMainItems = [
    { icon: Home, label: "Home", route: "/user-dashboard" },
    { icon: FileText, label: "Notes", route: "/notes" },
    { icon: BookOpen, label: "Exams", route: "/exams" },
    { icon: FileArchive, label: "Papers", route: "/past-papers" },
  ];

  const mobileMoreItems = [
    { icon: Video, label: "News", route: "/news" },
    { icon: Download, label: "Library", route: "/user-dashboard", tab: "downloads" },
    { icon: User, label: "Account", route: "/user-dashboard", tab: "credentials" },
    { icon: Wallet, label: "Wallet", isWallet: true },
    { icon: LogOut, label: "Logout", isLogout: true },
  ];

  const fetchWalletBalance = async () => {
    try {
      const res = await api.get("payments/wallet/");
      setWalletBalance(parseFloat(res.data.balance || 0));
    } catch {
      setWalletBalance(0);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get("payments/transactions/");
      const mapped = (res.data || []).map(tx => ({
        id: tx.id,
        date: new Date(tx.created_at).toLocaleDateString(),
        description: tx.transaction_type === "deposit"
          ? "Wallet Top-up"
          : `Purchase - ${tx.resource_type || "Resource"}`,
        amount: tx.transaction_type === "deposit"
          ? `+KSh ${parseFloat(tx.amount).toFixed(2)}`
          : `-KSh ${parseFloat(tx.amount).toFixed(2)}`,
        type: tx.transaction_type,
      }));
      setTransactions(mapped.reverse());
    } catch {
      setTransactions([]);
    }
  };

  useEffect(() => {
    fetchWalletBalance();
    fetchTransactions();
    const interval = setInterval(() => {
      fetchWalletBalance();
      fetchTransactions();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleTopUp = async () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    setTopUpLoading(true);
    try {
      const res = await api.post("payments/wallet/deposit/initiate/", { amount: topUpAmount });
      window.location.href = res.data.redirect_url;
    } catch (err) {
      alert(err.response?.data?.error || "Top-up failed.");
    } finally {
      setTopUpLoading(false);
    }
  };

  const handleNavClick = (item) => {
    if (item.isLogout) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      navigate("/login");
      return;
    }
    if (item.isWallet) {
      setMoreOpen(false);
      setWalletOpen(true);
      return;
    }
    if (item.tab) {
      navigate(item.route, { state: { activeTab: item.tab } });
    } else {
      navigate(item.route);
    }
    setMoreOpen(false);
  };

  const isActive = (item) => {
    if (item.tab || item.isLogout || item.isWallet) return false;
    return location.pathname === item.route;
  };

  const filteredTransactions = transactions.filter(tx =>
    tx.description?.toLowerCase().includes(txSearch.toLowerCase()) ||
    tx.amount?.includes(txSearch)
  );

  return (
    <div className="relative min-h-screen flex text-white bg-gray-900">

      {/* ══════════════ DESKTOP SIDEBAR ══════════════ */}
      <aside className={`
        hidden md:flex fixed top-0 left-0 h-full z-20 flex-col
        bg-gradient-to-b from-gray-800/80 via-gray-900/80 to-gray-800/80
        backdrop-blur-md border-r border-gray-700 shadow-lg
        transition-all duration-300
        ${sidebarOpen ? "w-64" : "w-20"}
      `}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-700 shrink-0">
          {sidebarOpen && (
            <h1 className="text-lg font-bold tracking-wide truncate">Apex Learning</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white p-1.5 hover:bg-gray-700 rounded-lg transition ml-auto"
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 mt-4 flex flex-col gap-1 px-2 overflow-y-auto">
          {allNavItems.filter(i => !i.isLogout).map((item, idx) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <div key={idx} className="group relative">
                <button
                  onClick={() => handleNavClick(item)}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg w-full transition-all
                    ${active
                      ? "bg-blue-600/30 border border-blue-500/40 text-white shadow"
                      : "hover:bg-gray-700/50 text-gray-300 hover:text-white"
                    }
                  `}
                >
                  <Icon size={20} className={active ? "text-blue-400" : "text-gray-400"} />
                  {sidebarOpen && (
                    <span className={`text-sm font-medium ${active ? "text-white" : ""}`}>
                      {item.label}
                    </span>
                  )}
                  {sidebarOpen && active && (
                    <ChevronRight size={14} className="ml-auto text-blue-400" />
                  )}
                </button>
                {/* Tooltip when collapsed */}
                {!sidebarOpen && (
                  <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-all shadow-xl z-50 whitespace-nowrap pointer-events-none">
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        {/* Wallet balance in sidebar */}
        <div className="px-2 pb-2 shrink-0">
          <button
            onClick={() => setWalletOpen(true)}
            className={`flex items-center gap-3 p-3 rounded-lg w-full bg-green-600/20 border border-green-500/30 hover:bg-green-600/30 transition`}
          >
            <Wallet size={20} className="text-green-400 shrink-0" />
            {sidebarOpen && (
              <div className="flex flex-col items-start min-w-0">
                <span className="text-xs text-green-300">Wallet</span>
                <span className="text-sm font-bold text-green-400 truncate">
                  {walletBalance === null ? "..." : `KSh ${parseFloat(walletBalance).toFixed(2)}`}
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Logout */}
        <div className="px-2 pb-4 shrink-0">
          <button
            onClick={() => handleNavClick({ isLogout: true })}
            className="flex items-center gap-3 p-3 rounded-lg w-full hover:bg-red-900/30 transition text-red-400 hover:text-red-300"
          >
            <LogOut size={20} className="shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ══════════════ MOBILE TOP BAR ══════════════ */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gray-900/95 backdrop-blur-md border-b border-gray-700/60 shadow-lg">
        <h1 className="text-base font-bold tracking-wide">Apex Learning</h1>
        <button
          onClick={() => setWalletOpen(true)}
          className="flex items-center gap-1.5 bg-green-600/90 hover:bg-green-500 px-3 py-1.5 rounded-full text-sm font-semibold shadow transition active:scale-95"
        >
          <Wallet size={15} />
          <span>{walletBalance === null ? "..." : `KSh ${parseFloat(walletBalance).toFixed(2)}`}</span>
        </button>
      </header>

      {/* ══════════════ DESKTOP WALLET BUTTON (top right) ══════════════ */}
      <button
        onClick={() => setWalletOpen(true)}
        className="hidden md:flex fixed top-4 right-4 items-center gap-2 bg-green-500 hover:bg-green-600 px-3 py-2 rounded-full shadow-lg z-30 transition hover:scale-105"
      >
        <Wallet size={18} />
        <span className="text-sm font-semibold">
          {walletBalance === null ? "..." : `KSh ${parseFloat(walletBalance).toFixed(2)}`}
        </span>
      </button>

      {/* ══════════════ MAIN CONTENT ══════════════ */}
      <main className={`
        flex-1 min-h-screen transition-all duration-300
        ${sidebarOpen ? "md:ml-64" : "md:ml-20"}
        pt-14 pb-20 md:pt-0 md:pb-0
      `}>
        {children}
      </main>

      {/* ══════════════ MOBILE BOTTOM NAV ══════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around bg-gray-900/95 backdrop-blur-md border-t border-gray-700/60 shadow-2xl px-1 py-1"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 6px)" }}>
        {mobileMainItems.map((item, idx) => {
          const Icon = item.icon;
          const active = location.pathname === item.route;
          return (
            <button
              key={idx}
              onClick={() => navigate(item.route)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all active:scale-90 flex-1 ${active ? "text-white bg-gray-700/70" : "text-gray-400 hover:text-gray-200"}`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all active:scale-90 flex-1 text-gray-400 hover:text-gray-200"
        >
          <MoreHorizontal size={20} />
          <span className="text-[10px] font-medium leading-none">More</span>
        </button>
      </nav>

      {/* ══════════════ MOBILE "MORE" MODAL ══════════════ */}
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="w-full bg-gray-900 border-t border-gray-700 rounded-t-3xl p-5"
            onClick={e => e.stopPropagation()}
            style={{ animation: "slideUp 0.3s cubic-bezier(0.32,0.72,0,1) forwards" }}
          >
            {/* Handle */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-gray-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">More Options</h3>
            <div className="grid grid-cols-3 gap-3">
              {mobileMoreItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleNavClick(item)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition active:scale-95 ${
                      item.isLogout
                        ? "bg-red-900/30 border border-red-800/40 text-red-400"
                        : item.isWallet
                          ? "bg-green-900/30 border border-green-800/40 text-green-400"
                          : "bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700"
                    }`}
                  >
                    <Icon size={22} />
                    <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ WALLET MODAL ══════════════ */}
      {walletOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setWalletOpen(false); }}
        >
          <div
            className="bg-gray-900 border border-gray-700 shadow-2xl w-full overflow-y-auto rounded-t-3xl max-h-[90vh] md:rounded-2xl md:max-w-md"
            style={{ animation: "slideUp 0.32s cubic-bezier(0.32,0.72,0,1) forwards" }}
          >
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-600" />
            </div>
            <div className="p-5 md:p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Wallet size={20} /> My Wallet
                </h2>
                <button onClick={() => setWalletOpen(false)} className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-gray-700 transition">
                  <X size={20} />
                </button>
              </div>

              {/* Balance card */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-5 mb-5 text-center">
                <p className="text-sm text-green-100 mb-1">Available Balance</p>
                <p className="text-4xl font-bold">
                  {walletBalance === null ? "Loading..." : `KSh ${parseFloat(walletBalance).toFixed(2)}`}
                </p>
                <button onClick={fetchWalletBalance} className="mt-2 text-xs text-green-200 hover:text-white underline">
                  Refresh balance
                </button>
              </div>

              {/* Top up */}
              {showTopUp ? (
                <div className="bg-gray-800 rounded-xl p-4 mb-5 space-y-3">
                  <h3 className="font-semibold text-cyan-400">Top Up via Pesapal</h3>
                  <input
                    type="number" placeholder="Amount (KSh)" value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)} min="1"
                    className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:outline-none text-sm"
                  />
                  <p className="text-xs text-slate-400">You'll be redirected to Pesapal to complete payment.</p>
                  <div className="flex gap-2">
                    <button onClick={handleTopUp} disabled={topUpLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700 p-3 rounded-lg font-semibold transition disabled:opacity-50 text-sm active:scale-95">
                      {topUpLoading ? "Redirecting..." : "Proceed to Payment"}
                    </button>
                    <button onClick={() => setShowTopUp(false)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 p-3 rounded-lg text-sm active:scale-95">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowTopUp(true)}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 w-full p-3 rounded-xl mb-5 font-semibold text-sm active:scale-95">
                  <Plus size={18} /> Top Up Wallet
                </button>
              )}

              {/* Transactions */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-300">
                  <History size={16} /> Transaction History
                </h3>
                <input
                  type="text" placeholder="Search transactions..." value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  className="mb-3 w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-sm"
                />
                {filteredTransactions.length === 0 ? (
                  <p className="text-slate-500 text-center py-6 text-sm">No transactions yet.</p>
                ) : (
                  <ul className="space-y-2 max-h-52 overflow-y-auto">
                    {filteredTransactions.map((tx, idx) => (
                      <li key={idx} className="bg-gray-800 border border-gray-700/60 p-3 rounded-xl flex justify-between items-center hover:bg-gray-750 transition">
                        <div>
                          <p className="text-sm font-medium">{tx.description}</p>
                          <p className="text-xs text-slate-500">{tx.date}</p>
                        </div>
                        <span className={`font-bold text-sm ${tx.type === "deposit" ? "text-green-400" : "text-red-400"}`}>
                          {tx.amount}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .animate-slide-in { animation: slideIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}