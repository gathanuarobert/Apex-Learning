// src/components/AppLayout.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Wallet,
  User,
  Download,
  FileText,
  BookOpen,
  FileArchive,
  Video,
  LogOut,
  X,
  History,
  Plus,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";
import api from "../Api";
import NewsModal from "./NewsModal";
import { AuthModal } from "./AuthModal";
import { GuestBanner } from "./GuestBanner";
import { useAuth } from "../hooks/useAuth";

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [walletOpen, setWalletOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { isGuest, isLoading, setUser, setIsGuest, refetchAuth } = useAuth();

  const openAuthModal = () => setShowAuthModal(true);

  const allNavItems = [
    { icon: Home, label: "Dashboard", route: "/user-dashboard" },
    { icon: FileText, label: "Notes", route: "/notes" },
    { icon: BookOpen, label: "National Past Papers", route: "/exams" },
    { icon: FileArchive, label: "Past Papers", route: "/past-papers" },
    { icon: Video, label: "News", route: "/news" },
    {
      icon: Download,
      label: "Library",
      route: "/user-dashboard",
      tab: "downloads",
    },
    {
      icon: User,
      label: "Account",
      route: "/user-dashboard",
      tab: "credentials",
    },
  ];

  const mobileMainItems = allNavItems.slice(0, 4);
  const moreSheetItems = [
    ...allNavItems.slice(4),
    { icon: Wallet, label: "Wallet", isWallet: true },
    { icon: LogOut, label: "Log out", isLogout: true },
  ];

  // ─── Wallet — only fetch once auth is resolved and user is not a guest ────
  const fetchWalletData = async () => {
    if (isGuest || isLoading) return;
    try {
      const [wRes, tRes] = await Promise.all([
        api.get("payments/wallet/"),
        api.get("payments/transactions/"),
      ]);
      setWalletBalance(parseFloat(wRes.data.balance || 0));
      setTransactions((tRes.data || []).reverse());
    } catch {
      setWalletBalance(0);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      fetchWalletData();
      const interval = setInterval(fetchWalletData, 30000);
      return () => clearInterval(interval);
    }
  }, [isGuest, isLoading]);

  const handleNavClick = (item) => {
    if (item.isLogout) {
      localStorage.clear();
      setUser(null);
      setIsGuest(true);
      navigate("/login");
      return;
    }
    if (item.isWallet) {
      if (isGuest) {
        openAuthModal();
        return;
      }
      setMoreOpen(false);
      setWalletOpen(true);
      return;
    }
    const dest = item.tab ? `${item.route}?tab=${item.tab}` : item.route;
    navigate(dest);
    setMoreOpen(false);
  };

  const currentTab = new URLSearchParams(location.search).get("tab");

  const isActive = (item) => {
    if (item.isLogout || item.isWallet) return false;
    if (item.tab)
      return location.pathname === item.route && currentTab === item.tab;
    if (item.route === "/user-dashboard")
      return location.pathname === item.route && !currentTab;
    return location.pathname === item.route;
  };

  const handleTopUp = async () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    if (isGuest) {
      setWalletOpen(false);
      openAuthModal();
      return;
    }
    setTopUpLoading(true);
    try {
      const res = await api.post("payments/wallet/deposit/initiate/", {
        amount: topUpAmount,
      });
      window.location.href = res.data.redirect_url;
    } catch (err) {
      alert(err.response?.data?.error || "Top-up failed.");
    } finally {
      setTopUpLoading(false);
    }
  };

  // ─── Block render until auth resolves — prevents guest/auth flash ─────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex text-slate-200 bg-[#0f172a] font-sans">
      {/* ════ SIDEBAR ════ */}
      <aside
        className={`hidden md:flex fixed top-0 left-0 bottom-0 z-40 flex-col bg-[#0f172a] border-r border-white/5 transition-all duration-300 ${sidebarOpen ? "w-64" : "w-20"}`}
      >
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && (
            <span className="text-xl font-bold tracking-tight text-white uppercase">
              Apex
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors ml-auto text-slate-400"
          >
            {sidebarOpen ? <X size={18} /> : <MoreHorizontal size={18} />}
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {allNavItems.map((item, idx) => {
            const active = isActive(item);
            return (
              <button
                key={idx}
                onClick={() => handleNavClick(item)}
                className={`flex items-center w-full p-3.5 rounded-xl transition-all ${active ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
              >
                <item.icon size={20} />
                {sidebarOpen && (
                  <span className="ml-3 font-bold text-sm tracking-wide">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <button
            onClick={() => {
              if (isGuest) {
                openAuthModal();
                return;
              }
              setWalletOpen(true);
            }}
            className="flex items-center gap-3 w-full p-3 bg-emerald-500/10 rounded-xl text-emerald-400 hover:bg-emerald-500/15 transition-all"
          >
            <Wallet size={18} />
            {sidebarOpen && (
              <span className="text-sm font-bold truncate">
                {isGuest
                  ? "Sign in for wallet"
                  : `KSh ${walletBalance?.toFixed(2) || "0.00"}`}
              </span>
            )}
          </button>
          <button
            onClick={() => handleNavClick({ isLogout: true })}
            className="flex items-center gap-3 w-full p-3 text-slate-500 hover:text-rose-400 transition-all"
          >
            <LogOut size={18} />
            {sidebarOpen && (
              <span className="text-sm font-medium">
                {isGuest ? "Sign in" : "Logout"}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ════ MAIN CONTENT ════ */}
      <main
        className={`flex-1 transition-all duration-300 ${sidebarOpen ? "md:ml-64" : "md:ml-20"} pt-16 md:pt-0 pb-20 md:pb-0`}
      >
        <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 bg-[#0f172a]/90 backdrop-blur-md border-b border-white/5">
          <span className="font-bold text-white uppercase tracking-wider">
            Apex
          </span>
          <button
            onClick={() => {
              if (isGuest) {
                openAuthModal();
                return;
              }
              setWalletOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 px-4 py-1.5 rounded-full text-xs font-bold text-white"
          >
            <Wallet size={14} />
            {isGuest ? "Sign in" : `KSh ${walletBalance?.toFixed(0) ?? "0"}`}
          </button>
        </header>

        <div className="p-4 md:p-10">
          <GuestBanner onSignIn={openAuthModal} />
          {React.isValidElement(children)
            ? React.cloneElement(children, { openAuthModal })
            : children}
        </div>
      </main>

      {/* ════ WALLET MODAL ════ */}
      {walletOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6"
          onClick={() => setWalletOpen(false)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div
            className="relative bg-[#1e293b] w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 pb-4 flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  Wallet Details
                </p>
                <h2 className="text-3xl font-black text-white leading-none">
                  My Balance
                </h2>
              </div>
              <button
                onClick={() => setWalletOpen(false)}
                className="p-3 bg-white/5 text-slate-400 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-8 pt-4 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
                  <div className="bg-[#0f172a] border border-white/5 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-blue-500/20 transition-all" />
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                      Available Credits
                    </p>
                    <p className="text-4xl font-black text-white mb-1">
                      KSh {walletBalance?.toFixed(2)}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-emerald-400">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Active Account
                      </span>
                    </div>
                  </div>
                  {showTopUp ? (
                    <div className="p-6 bg-[#0f172a] border border-white/5 rounded-[2rem] space-y-4 animate-in fade-in slide-in-from-top-4">
                      <input
                        type="number"
                        placeholder="Amount (KSh)"
                        className="w-full bg-[#1e293b] border border-white/10 p-4 rounded-xl focus:border-blue-500 outline-none text-white font-bold text-lg"
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleTopUp}
                          disabled={topUpLoading}
                          className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 text-sm"
                        >
                          {topUpLoading ? "Loading..." : "Proceed"}
                        </button>
                        <button
                          onClick={() => setShowTopUp(false)}
                          className="flex-1 py-4 bg-white/5 text-slate-400 rounded-xl font-bold text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowTopUp(true)}
                      className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.5rem] font-black text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-3"
                    >
                      <Plus size={20} strokeWidth={3} /> Top Up Wallet
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2">
                    <History size={14} /> Recent Activity
                  </div>
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {transactions.length > 0 ? (
                      transactions.map((tx, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 bg-[#0f172a] border border-white/5 rounded-2xl hover:border-white/10 transition-all"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">
                              {tx.transaction_type === "deposit"
                                ? "Deposit"
                                : "Purchase"}
                            </p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                              {new Date(tx.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span
                            className={`font-black text-sm whitespace-nowrap ml-4 ${tx.transaction_type === "deposit" ? "text-emerald-400" : "text-rose-400"}`}
                          >
                            {tx.transaction_type === "deposit" ? "+" : "-"}{" "}
                            {parseFloat(tx.amount).toFixed(0)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-slate-600 text-xs py-10">
                        No transactions found
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ MOBILE BOTTOM NAV ════ */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-40 flex items-center justify-around bg-[#0f172a] border border-white/5 rounded-2xl p-2 shadow-2xl">
        {mobileMainItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleNavClick(item)}
            className={`flex flex-col items-center gap-1 flex-1 py-2 transition-colors ${isActive(item) ? "text-blue-400" : "text-slate-500"}`}
          >
            <item.icon size={20} />
            <span className="text-[9px] font-bold uppercase tracking-widest">
              {item.label}
            </span>
          </button>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className={`flex flex-col items-center gap-1 flex-1 py-2 transition-colors ${moreOpen ? "text-blue-400" : "text-slate-500"}`}
        >
          <MoreHorizontal size={20} />
          <span className="text-[9px] font-bold uppercase tracking-widest">
            More
          </span>
        </button>
      </nav>

      {/* ════ MORE SHEET ════ */}
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-[90] flex items-end"
          onClick={() => setMoreOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full bg-[#1e293b] border-t border-white/10 rounded-t-3xl shadow-2xl pb-8 animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <span className="text-sm font-black uppercase tracking-widest text-slate-400">
                Menu
              </span>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-2 bg-white/5 rounded-full text-slate-400 hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-4 pt-3 space-y-1">
              {moreSheetItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleNavClick(item)}
                  className={`flex items-center gap-4 w-full px-4 py-4 rounded-2xl transition-all ${
                    item.isLogout
                      ? "text-rose-400 hover:bg-rose-500/10"
                      : item.isWallet
                        ? "text-emerald-400 hover:bg-emerald-500/10"
                        : isActive(item)
                          ? "bg-blue-600 text-white"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-bold text-sm">{item.label}</span>
                  {item.isWallet && (
                    <span className="ml-auto text-xs font-black text-emerald-400">
                      {isGuest
                        ? "Sign in"
                        : `KSh ${walletBalance?.toFixed(2) || "0.00"}`}
                    </span>
                  )}
                  {!item.isWallet && !item.isLogout && (
                    <ChevronRight
                      size={16}
                      className="ml-auto text-slate-600"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <NewsModal />

      <AuthModal
        show={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          await refetchAuth();
          setShowAuthModal(false);
        }}
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
}
