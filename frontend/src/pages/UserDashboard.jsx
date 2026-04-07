// src/pages/UserDashboard.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  FileText,
  BookOpen,
  FileArchive,
  Video,
  History,
  Plus,
  User,
  Download,
  LogOut,
  X,
  Home,
} from "lucide-react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import api, { getCurrentUser, getLibrary } from "../Api";
import { useLocation } from "react-router-dom";

export default function UserDashboard() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [walletOpen, setWalletOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txSearch, setTxSearch] = useState("");

  // Top-up state — no phone number needed anymore
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [prevTab, setPrevTab] = useState("dashboard");
  const [downloads, setDownloads] = useState([]);
  const [dlSearch, setDlSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const cards = [
    { title: "Notes", icon: <FileText size={36} />, color: "from-blue-500 to-blue-700", route: "/notes" },
    { title: "Exams", icon: <BookOpen size={36} />, color: "from-purple-500 to-purple-700", route: "/exams" },
    { title: "Past Papers", icon: <FileArchive size={36} />, color: "from-pink-500 to-pink-700", route: "/past-papers" },
    { title: "News", icon: <Video size={36} />, color: "from-green-500 to-green-700", route: "/news" },
  ];

  const cardRefs = useRef(cards.map(() => React.createRef()));

  const openWallet = () => {
    setPrevTab(activeTab);
    setWalletOpen(true);
  };

  const closeWallet = () => {
    setWalletOpen(false);
  };

  const navItems = [
    { icon: Home, label: "dashboard", onClick: () => setActiveTab("dashboard") },
    { icon: Wallet, label: "wallet", onClick: openWallet },
    { icon: User, label: "credentials", onClick: () => setActiveTab("credentials") },
    { icon: Download, label: "library", onClick: () => setActiveTab("downloads") },
    ...cards.map((card) => ({
      icon: () => card.icon,
      label: card.title.toLowerCase(),
      onClick: () => navigate(card.route),
    })),
    {
      icon: LogOut, label: "logout", onClick: () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        navigate("/login");
      }
    },
  ];

  const mobileNavItems = [
    { icon: Home, label: "dashboard", onClick: () => setActiveTab("dashboard") },
    { icon: User, label: "credentials", onClick: () => setActiveTab("credentials") },
    { icon: Download, label: "library", onClick: () => setActiveTab("downloads") },
    { icon: Wallet, label: "wallet", onClick: openWallet },
    {
      icon: LogOut, label: "logout", onClick: () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        navigate("/login");
      }
    },
  ];

  const navRefs = useRef([]);
  const indicatorRef = useRef(null);

  useEffect(() => {
    const activeIndex = navItems.findIndex(item => item.label === activeTab);
    const activeElement = navRefs.current[activeIndex];
    if (activeElement && indicatorRef.current) {
      indicatorRef.current.style.top = activeElement.offsetTop + "px";
      indicatorRef.current.style.height = activeElement.offsetHeight + "px";
    }
  }, [activeTab, sidebarOpen]);

  const particlesInit = async (engine) => { await loadSlim(engine); };

  const handleMouseMove = (e, cardRef) => {
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * 10;
    const rotateY = ((x - centerX) / centerX) * 10;
    card.style.transform = `rotateX(${-rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
  };

  const handleMouseLeave = (cardRef) => {
    cardRef.current.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
  };

  const fetchWalletBalance = async () => {
    try {
      const res = await api.get("payments/wallet/");
      setWalletBalance(parseFloat(res.data.balance || 0));
    } catch (err) {
      console.error("Failed to fetch wallet balance:", err);
      setWalletBalance(0);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get("payments/transactions/");
      const mapped = (res.data || []).map(tx => ({
        id: tx.id,
        date: new Date(tx.created_at).toLocaleDateString(),
        description: tx.transaction_type === "deposit" ? "Wallet Top-up" : `Purchase - ${tx.resource_type || "Resource"}`,
        amount: tx.transaction_type === "deposit"
          ? `+KSh ${parseFloat(tx.amount).toFixed(2)}`
          : `-KSh ${parseFloat(tx.amount).toFixed(2)}`,
        type: tx.transaction_type,
      }));
      setTransactions(mapped.reverse());
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      setTransactions([]);
    }
  };

  const fetchLibrary = async () => {
    try {
      const res = await getLibrary();
      const mapped = (res.data || []).map(item => ({
        id: item.transaction_id,
        date: new Date(item.purchased_on).toLocaleDateString(),
        item: item.title || "Unknown Resource",
        type: item.resource_type || "Resource",
        download_url: item.download_url,
        resource_id: item.resource_id,
        resource_type: item.resource_type,
      }));
      setDownloads(mapped);
    } catch (err) {
      console.error("Failed to fetch library:", err);
      setDownloads([]);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const res = await getCurrentUser();
      setCurrentUser(res.data);
    } catch (err) {
      console.error("Failed to fetch user info:", err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchWalletBalance(),
      fetchTransactions(),
      fetchLibrary(),
      fetchUserInfo(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      fetchWalletBalance();
      fetchTransactions();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // ---------------------- WALLET TOP-UP (Pesapal) ----------------------
  const handleTopUp = async () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setTopUpLoading(true);
    try {
      const res = await api.post("payments/wallet/deposit/initiate/", {
        amount: topUpAmount,
      });
      // Redirect to Pesapal checkout
      window.location.href = res.data.redirect_url;
    } catch (err) {
      console.error("Top-up failed:", err);
      alert(err.response?.data?.error || "Top-up failed. Please try again.");
    } finally {
      setTopUpLoading(false);
    }
  };

  // ---------------------- DOWNLOAD RESOURCE ----------------------
  const handleDownload = async (item) => {
    try {
      const typeMap = {
        "Note": "notes",
        "Exam": "exams",
        "PastPaper": "past-papers",
      };
      const endpoint = typeMap[item.resource_type] || "notes";

      const downloadingToast = document.createElement('div');
      downloadingToast.className = 'fixed top-20 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-slide-in';
      downloadingToast.innerHTML = '<svg class="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Downloading...';
      document.body.appendChild(downloadingToast);

      const response = await api.get(`resources/${endpoint}/${item.resource_id}/download/`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentType = response.headers['content-type'];
      let extension = 'pdf';
      if (contentType) {
        if (contentType.includes('pdf')) extension = 'pdf';
        else if (contentType.includes('word')) extension = 'docx';
        else if (contentType.includes('doc')) extension = 'doc';
      }

      link.setAttribute('download', `${item.item}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      downloadingToast.remove();
      const successToast = document.createElement('div');
      successToast.className = 'fixed top-20 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
      successToast.textContent = '✓ Download complete!';
      document.body.appendChild(successToast);
      setTimeout(() => successToast.remove(), 3000);

    } catch (err) {
      console.error("Download failed:", err);
      document.querySelectorAll('.fixed.top-20.right-4').forEach(el => el.remove());

      const errorMsg = err.response?.status === 402
        ? "Payment required. This resource is not free."
        : err.response?.data?.detail || "Download failed. Please try again.";

      const errorToast = document.createElement('div');
      errorToast.className = 'fixed top-20 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
      errorToast.textContent = `✗ ${errorMsg}`;
      document.body.appendChild(errorToast);
      setTimeout(() => errorToast.remove(), 5000);
    }
  };

  const filteredTransactions = transactions.filter(tx =>
    tx.date?.includes(txSearch) ||
    tx.description?.toLowerCase().includes(txSearch.toLowerCase()) ||
    tx.amount?.includes(txSearch)
  );

  const filteredDownloads = downloads.filter(dl =>
    dl.date?.includes(dlSearch) ||
    dl.item?.toLowerCase().includes(dlSearch.toLowerCase()) ||
    dl.type?.toLowerCase().includes(dlSearch.toLowerCase())
  );

  const visibleTab = activeTab;

  const location = useLocation();

useEffect(() => {
  if (location.state?.refreshWallet) {
    fetchWalletBalance();
    fetchTransactions();
    // Clear state so it doesn't re-trigger
    navigate(location.pathname, { replace: true, state: {} });
  }
  if (location.state?.refreshLibrary) {
    fetchLibrary();
    fetchWalletBalance();
    fetchTransactions();
    setActiveTab("downloads");
    // Clear state so it doesn't re-trigger
    navigate(location.pathname, { replace: true, state: {} });
  }
}, [location.state]);

  return (
    <div className="relative min-h-screen flex text-white bg-gray-900 overflow-hidden">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          background: { color: { value: "#0f172a" } },
          fpsLimit: 60,
          particles: {
            number: { value: 90, density: { enable: true, area: 800 } },
            color: { value: ["#38bdf8", "#a78bfa", "#f472b6", "#22c55e"] },
            shape: { type: "circle" },
            opacity: { value: 0.5 },
            size: { value: { min: 3, max: 7 } },
            move: { enable: true, speed: 1, outModes: "out", random: true },
          },
        }}
        className="absolute inset-0 -z-10"
      />

      {/* ======================== DESKTOP SIDEBAR ======================== */}
      <aside
        className={`hidden md:flex fixed top-0 left-0 h-full bg-gradient-to-b from-gray-800/80 via-gray-900/80 to-gray-800/80 backdrop-blur-md border-r border-gray-700 shadow-lg z-20 flex-col transform transition-all duration-300 ${sidebarOpen ? "w-64" : "w-20"}`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-700 sticky top-0 bg-gradient-to-b from-gray-800/90 to-gray-900/90 z-10">
          <h1 className={`text-lg font-bold tracking-wide transition-all duration-300 ${sidebarOpen ? "block" : "hidden"}`}>
            Apex Learning
          </h1>
          <button
            className="text-white p-1 hover:bg-gray-700 rounded transition"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        <div ref={indicatorRef} className="absolute left-0 w-1 bg-gradient-to-b from-blue-400 to-purple-500 rounded transition-all duration-300" />

        <nav className="mt-6 flex flex-col gap-2 relative px-2">
          {navItems.map((item, idx) => {
            const IconComponent = item.icon;
            const isActive = visibleTab === item.label;
            return (
              <div key={idx} ref={el => navRefs.current[idx] = el} className="group relative">
                <button
                  className={`flex items-center gap-4 p-3 rounded-lg w-full transition-all transform hover:scale-105 ${isActive ? "bg-gray-700/60 shadow-lg" : "hover:bg-gray-700/50"}`}
                  onClick={item.onClick}
                >
                  <IconComponent size={20} className={`${isActive ? "text-white" : "text-gray-300"} transition-all duration-300`} />
                  {sidebarOpen && (
                    <span className={`${isActive ? "text-white font-semibold" : "text-gray-300"} capitalize transition`}>
                      {item.label}
                    </span>
                  )}
                </button>
                {!sidebarOpen && (
                  <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-800/90 px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg z-50 capitalize">
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ======================== MOBILE TOP BAR ======================== */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gray-900/90 backdrop-blur-md border-b border-gray-700/60 shadow-lg">
        <h1 className="text-base font-bold tracking-wide text-white">Apex Learning</h1>
        <button
          onClick={openWallet}
          className="flex items-center gap-1.5 bg-green-600/90 hover:bg-green-500 px-3 py-1.5 rounded-full text-sm font-semibold shadow transition-all active:scale-95"
        >
          <Wallet size={15} />
          {walletBalance === null ? (
            <span className="text-xs">...</span>
          ) : (
            <span>KSh {parseFloat(walletBalance).toFixed(2)}</span>
          )}
        </button>
      </header>

      {/* ======================== DESKTOP WALLET BUTTON ======================== */}
      <button
        onClick={openWallet}
        className="hidden md:flex fixed top-4 right-4 p-2 bg-green-500 hover:bg-green-600 rounded-full shadow-lg z-30 items-center gap-2 transition-transform transform hover:scale-110"
      >
        <Wallet size={18} />
        {walletBalance === null ? (
          <span className="text-xs">Loading...</span>
        ) : (
          <span>KSh {parseFloat(walletBalance).toFixed(2)}</span>
        )}
      </button>

      {/* ======================== MAIN CONTENT ======================== */}
      <main
        className={`
          flex-1 overflow-y-auto max-h-screen transition-all duration-300
          md:ml-20
          ${sidebarOpen ? "md:ml-64" : "md:ml-20"}
          pt-16 pb-24 md:pt-6 md:pb-6 px-4 md:px-6
        `}
      >
        {visibleTab === "dashboard" && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Welcome back{currentUser ? `, ${currentUser.email?.split("@")[0]}` : ""}! 👋
              </h2>
              <p className="text-slate-400 mt-1 text-sm md:text-base">What would you like to study today?</p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-2">
              {cards.map((card, idx) => (
                <div
                  key={idx}
                  ref={cardRefs.current[idx]}
                  className={`bg-gradient-to-br ${card.color} p-6 md:p-10 rounded-2xl shadow-2xl cursor-pointer transform transition duration-300 md:duration-500 relative overflow-hidden active:scale-95 md:active:scale-100`}
                  onClick={() => navigate(card.route)}
                  onMouseMove={(e) => handleMouseMove(e, cardRefs.current[idx])}
                  onMouseLeave={() => handleMouseLeave(cardRefs.current[idx])}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-20 transition" />
                  <div className="mb-3 md:mb-4 [&>svg]:w-7 [&>svg]:h-7 md:[&>svg]:w-9 md:[&>svg]:h-9">{card.icon}</div>
                  <h3 className="text-lg md:text-2xl font-semibold">{card.title}</h3>
                </div>
              ))}
            </div>
          </div>
        )}

        {visibleTab === "credentials" && (
          <div className="max-w-xl mx-auto bg-gray-800 p-5 md:p-6 rounded-xl shadow-lg">
            <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
              <User size={20} /> My Account
            </h2>
            {currentUser ? (
              <div className="space-y-3">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-slate-400 text-sm">Email</p>
                  <p className="text-white font-semibold break-all">{currentUser.email}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-slate-400 text-sm">Role</p>
                  <p className="text-white font-semibold capitalize">{currentUser.role || "User"}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-slate-400 text-sm">Member Since</p>
                  <p className="text-white font-semibold">
                    {currentUser.date_joined ? new Date(currentUser.date_joined).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-slate-400">Loading user info...</p>
            )}
          </div>
        )}

        {visibleTab === "downloads" && (
          <div className="max-w-3xl mx-auto bg-gray-800 p-5 md:p-6 rounded-xl shadow-lg">
            <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
              <Download size={20} /> My Library
            </h2>
            <input
              type="text"
              placeholder="Search downloads..."
              value={dlSearch}
              onChange={(e) => setDlSearch(e.target.value)}
              className="mb-4 w-full p-2.5 rounded bg-gray-700 text-white placeholder-gray-400 text-sm"
            />
            {filteredDownloads.length === 0 ? (
              <p className="text-slate-400 text-center py-8 text-sm">
                No downloads yet. Purchase resources to access them here.
              </p>
            ) : (
              <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
                {filteredDownloads.map((dl, idx) => (
                  <li key={idx} className="bg-gray-700 p-3 rounded flex justify-between items-center hover:bg-gray-600 transition">
                    <div className="min-w-0 mr-3">
                      <p className="font-semibold text-sm truncate">{dl.item}</p>
                      <p className="text-xs text-slate-400">{dl.date} • {dl.type}</p>
                    </div>
                    <button
                      onClick={() => handleDownload(dl)}
                      className="flex-shrink-0 flex items-center gap-1 bg-cyan-600 hover:bg-cyan-700 px-3 py-1.5 rounded text-sm transition active:scale-95"
                    >
                      <Download size={13} /> Download
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>

      {/* ======================== MOBILE BOTTOM NAV ======================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around bg-gray-900/95 backdrop-blur-md border-t border-gray-700/60 shadow-2xl px-2 py-2 safe-area-bottom">
        {mobileNavItems.map((item, idx) => {
          const IconComponent = item.icon;
          const isActive = visibleTab === item.label;
          const isLogout = item.label === "logout";
          return (
            <button
              key={idx}
              onClick={item.onClick}
              className={`
                flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all active:scale-90
                ${isActive
                  ? "text-white bg-gray-700/70"
                  : isLogout
                    ? "text-red-400/80 hover:text-red-400"
                    : "text-gray-400 hover:text-gray-200"
                }
              `}
            >
              <IconComponent size={20} />
              <span className={`text-[10px] font-medium capitalize leading-none ${isActive ? "text-white" : ""}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-gradient-to-r from-blue-400 to-purple-500" />
              )}
            </button>
          );
        })}
      </nav>

      {/* ======================== WALLET MODAL ======================== */}
      {walletOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeWallet(); }}
        >
          <div className="
            bg-gray-900 border border-gray-700 shadow-2xl w-full overflow-y-auto
            rounded-t-3xl max-h-[90vh] md:rounded-2xl md:max-w-md md:max-h-[90vh]
            animate-slide-up md:animate-none
          ">
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-600" />
            </div>

            <div className="p-5 md:p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Wallet size={20} /> My Wallet
                </h2>
                <button
                  onClick={closeWallet}
                  className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-gray-700 transition active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Balance */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-5 mb-5 text-center">
                <p className="text-sm text-green-100 mb-1">Available Balance</p>
                <p className="text-4xl font-bold text-white">
                  {walletBalance === null ? (
                    <span className="text-2xl">Loading...</span>
                  ) : (
                    `KSh ${parseFloat(walletBalance).toFixed(2)}`
                  )}
                </p>
                <button
                  onClick={fetchWalletBalance}
                  className="mt-2 text-xs text-green-200 hover:text-white underline"
                >
                  Refresh balance
                </button>
              </div>

              {/* Top Up Section */}
              {showTopUp ? (
                <div className="bg-gray-800 rounded-xl p-4 mb-5 space-y-3">
                  <h3 className="font-semibold text-cyan-400">Top Up via Pesapal</h3>
                  <input
                    type="number"
                    placeholder="Amount (KSh)"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    min="1"
                    className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 focus:outline-none text-sm"
                  />
                  <p className="text-xs text-slate-400">
                    You'll be redirected to Pesapal to complete payment via M-Pesa, card, or other methods.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleTopUp}
                      disabled={topUpLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700 p-3 rounded-lg font-semibold transition disabled:opacity-50 text-sm active:scale-95"
                    >
                      {topUpLoading ? "Redirecting..." : "Proceed to Payment"}
                    </button>
                    <button
                      onClick={() => setShowTopUp(false)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition text-sm active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowTopUp(true)}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 w-full p-3 rounded-xl mb-5 transition font-semibold text-sm active:scale-95"
                >
                  <Plus size={18} /> Top Up Wallet
                </button>
              )}

              {/* Transaction History */}
              <div>
                <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
                  <History size={18} /> Transaction History
                </h3>
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  className="mb-3 w-full p-2.5 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 text-sm"
                />
                {filteredTransactions.length === 0 ? (
                  <p className="text-slate-400 text-center py-4 text-sm">No transactions yet.</p>
                ) : (
                  <ul className="space-y-2 max-h-52 overflow-y-auto">
                    {filteredTransactions.map((tx, idx) => (
                      <li key={idx} className="bg-gray-800 border border-gray-700 p-3 rounded-lg flex justify-between items-center hover:bg-gray-700 transition">
                        <div>
                          <p className="text-sm font-semibold">{tx.description}</p>
                          <p className="text-xs text-slate-400">{tx.date}</p>
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
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }

        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .animate-slide-up { animation: slideUp 0.32s cubic-bezier(0.32, 0.72, 0, 1) forwards; }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .animate-slide-in { animation: slideIn 0.3s ease-out forwards; }

        .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom, 8px); }
      `}</style>
    </div>
  );
}