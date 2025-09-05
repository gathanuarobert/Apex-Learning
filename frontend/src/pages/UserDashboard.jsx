// src/pages/UserDashboard.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
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
} from "lucide-react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import Api, { getCurrentUser, getLibrary } from "../Api"; // import API

export default function UserDashboard() {
  const navigate = useNavigate();

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Wallet modal
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(500);
  const [transactions, setTransactions] = useState([]);
  const [txSearch, setTxSearch] = useState("");

  // Tabs
  const [activeTab, setActiveTab] = useState("dashboard");
  const [downloads, setDownloads] = useState([]);
  const [dlSearch, setDlSearch] = useState("");

  // Cards
  const cards = [
    { title: "Notes", icon: <FileText size={36} />, color: "from-blue-500 to-blue-700", route: "/notes" },
    { title: "Exams", icon: <BookOpen size={36} />, color: "from-green-500 to-green-700", route: "/exams" },
    { title: "Past Papers", icon: <FileArchive size={36} />, color: "from-purple-500 to-purple-700", route: "/past-papers" },
    { title: "Revision", icon: <Video size={36} />, color: "from-pink-500 to-pink-700", route: "/revision" },
  ];

  // Refs for card tilts
  const cardRefs = useRef(cards.map(() => React.createRef()));

  // Sidebar navigation
  const navItems = [
    { icon: Wallet, label: "Wallet", onClick: () => { setWalletOpen(true); setActiveTab("wallet"); } },
    { icon: User, label: "Credentials", onClick: () => setActiveTab("credentials") },
    { icon: Download, label: "Library", onClick: () => setActiveTab("downloads") },
    ...cards.map((card) => ({
      icon: () => card.icon,
      label: card.title.toLowerCase(),
      onClick: () => { navigate(card.route); setActiveTab(card.title.toLowerCase()); },
    })),
    { icon: LogOut, label: "logout", onClick: () => { alert("Logging out..."); navigate("/login"); } },
  ];

  const navRefs = useRef([]);
  const indicatorRef = useRef(null);

  // Handle sidebar indicator
  useEffect(() => {
    const activeIndex = navItems.findIndex(item => item.label === activeTab);
    const activeElement = navRefs.current[activeIndex];
    if(activeElement && indicatorRef.current){
      indicatorRef.current.style.top = activeElement.offsetTop + "px";
      indicatorRef.current.style.height = activeElement.offsetHeight + "px";
    }
  }, [activeTab, sidebarOpen]);

  // Particles
  const particlesInit = async (engine) => { await loadSlim(engine); };

  // Card tilt handlers
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
  const handleMouseLeave = (cardRef) => { cardRef.current.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)"; };

  // Filters
  const filteredTransactions = transactions.filter(tx =>
    tx.date.includes(txSearch) || tx.description.toLowerCase().includes(txSearch.toLowerCase()) || tx.amount.includes(txSearch)
  );
  const filteredDownloads = downloads.filter(dl =>
    dl.date.includes(dlSearch) || dl.item.toLowerCase().includes(dlSearch.toLowerCase()) || dl.type.toLowerCase().includes(dlSearch.toLowerCase())
  );

  // ---------------------- LIVE DATA FETCH ----------------------
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token"); // assuming token stored here
      const userRes = await getCurrentUser(token);
      if(userRes.data.wallet) setWalletBalance(userRes.data.wallet.balance || 0);
      if(userRes.data.transactions) setTransactions(userRes.data.transactions.reverse());
      
      const libraryRes = await getLibrary();
      if(libraryRes.data) setDownloads(libraryRes.data.reverse());
    } catch(err) {
      console.error("Failed to fetch user data:", err);
    }
  };

  useEffect(() => {
    fetchUserData(); // fetch once on mount
    const interval = setInterval(fetchUserData, 300000); // refresh every 300s
    return () => clearInterval(interval);
  }, []);

  // --------------------------------------------------------------

  return (
    <div className="relative min-h-screen flex text-white bg-gray-900 overflow-hidden">
      {/* Particles */}
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

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-gray-800/80 via-gray-900/80 to-gray-800/80 backdrop-blur-md border-r border-gray-700 shadow-lg z-20 transform transition-all duration-300 ${
          sidebarOpen ? "translate-x-0 w-64" : "w-20"
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-700 sticky top-0 bg-gradient-to-b from-gray-800/90 via-gray-900/90 to-gray-800/90 z-10">
          <h1 className={`text-lg font-bold tracking-wide transition-all duration-300 ${sidebarOpen ? "block" : "hidden"}`}>Apex Learning</h1>
          <button className="text-white p-1 hover:bg-gray-700 rounded transition" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        <div ref={indicatorRef} className="absolute left-0 w-1 bg-gradient-to-b from-blue-400 to-purple-500 rounded transition-all duration-300"></div>

        <nav className="mt-6 flex flex-col gap-2 relative px-2">
          {navItems.map((item, idx) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.label;
            return (
              <div key={idx} ref={el => navRefs.current[idx] = el} className="group relative">
                <button
                  className={`flex items-center gap-4 p-3 rounded-lg w-full transition-all transform hover:scale-105 ${
                    isActive ? "bg-gray-700/60 shadow-lg animate-pulse" : "hover:bg-gray-700/50"
                  }`}
                  onClick={item.onClick}
                >
                  <IconComponent size={20} className={`${isActive ? "text-white" : "text-gray-300"} transition-all duration-300 group-hover:animate-bounce`} />
                  {sidebarOpen && <span className={`${isActive ? "text-white font-semibold" : "text-gray-300"} transition`}>{item.label}</span>}
                </button>
                {!sidebarOpen && (
                  <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-800/90 px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg z-50">
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Mobile menu */}
      <button onClick={() => setSidebarOpen(true)} className="fixed top-4 left-4 p-2 bg-gray-700 rounded-full shadow-md md:hidden z-30">
        <Menu size={20} />
      </button>

      {/* Wallet Button */}
      <button
        onClick={() => { setWalletOpen(true); setActiveTab("wallet"); }}
        className="fixed top-4 right-4 p-2 bg-green-500 hover:bg-green-600 rounded-full shadow-lg z-30 flex items-center gap-2 transition-transform transform hover:scale-110 hover:shadow-2xl"
      >
        <Wallet size={18} /> {walletBalance} KES
      </button>

      {/* Main Content */}
      <main className={`flex-1 p-6 overflow-y-auto max-h-screen transition-all duration-300 ${sidebarOpen ? "md:ml-64" : "md:ml-20"}`}>
        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div className={`grid gap-6 ${sidebarOpen ? "sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2" : "sm:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1"}`}>
            {cards.map((card, idx) => (
              <div
                key={idx}
                ref={cardRefs.current[idx]}
                className={`bg-gradient-to-br ${card.color} p-10 rounded-2xl shadow-2xl cursor-pointer transform transition duration-500 relative overflow-hidden animate-float`}
                onClick={() => navigate(card.route)}
                onMouseMove={(e) => handleMouseMove(e, cardRefs.current[idx])}
                onMouseLeave={() => handleMouseLeave(cardRefs.current[idx])}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-20 transition"></div>
                <div className="mb-4">{card.icon}</div>
                <h3 className="text-2xl font-semibold shimmer">{card.title}</h3>
              </div>
            ))}
          </div>
        )}

        {/* Credentials */}
        {activeTab === "credentials" && (
          <div className="max-w-xl mx-auto bg-gray-800 p-6 rounded-xl shadow-lg transition-opacity duration-500 hover:shadow-2xl hover:scale-105">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><User /> Credentials</h2>
            <form className="space-y-4">
              <div>
                <label className="block mb-1">Email</label>
                <input type="email" className="w-full p-2 rounded bg-gray-700 text-white" placeholder="user@example.com" />
              </div>
              <div>
                <label className="block mb-1">Password</label>
                <input type="password" className="w-full p-2 rounded bg-gray-700 text-white" placeholder="••••••••" />
              </div>
              <button type="submit" className="bg-blue-500 hover:bg-blue-600 w-full p-2 rounded transition hover:scale-105">Update Credentials</button>
            </form>
          </div>
        )}

        {/* Downloads */}
        {activeTab === "downloads" && (
          <div className="max-w-3xl mx-auto bg-gray-800 p-6 rounded-xl shadow-lg transition-opacity duration-500">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Download /> Download History</h2>
            <input
              type="text"
              placeholder="Search downloads..."
              value={dlSearch}
              onChange={(e) => setDlSearch(e.target.value)}
              className="mb-4 w-full p-2 rounded bg-gray-700 text-white placeholder-gray-400"
            />
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {filteredDownloads.map((dl, idx) => (
                <li key={idx} className="bg-gray-700 p-3 rounded flex justify-between hover:bg-gray-600 transition-transform transform hover:scale-105">
                  <span>{dl.date} - {dl.item}</span>
                  <span className="text-green-400">{dl.type}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {/* Wallet Modal */}
      {walletOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl shadow-xl w-96 max-h-[90vh] overflow-y-auto transform scale-90 animate-[scaleUp_0.3s_ease-in-out] hover:scale-105 transition-shadow shadow-2xl">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Wallet /> Wallet</h2>
            <p className="mb-4">💰 Balance: <span className="font-bold">KES {walletBalance}</span></p>
            <button
              onClick={() => alert("Top-up logic via Mpesa API")}
              className="flex items-center gap-2 bg-green-500 w-full p-2 rounded hover:bg-green-600 mb-4 transition-transform transform hover:scale-105 hover:shadow-xl"
            >
              <Plus size={18} /> Top Up
            </button>

            <input
              type="text"
              placeholder="Search transactions..."
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              className="mb-4 w-full p-2 rounded bg-gray-700 text-white placeholder-gray-400"
            />

            <h3 className="text-md font-semibold mb-2 flex items-center gap-2"><History size={18} /> Transaction History</h3>
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {filteredTransactions.map((tx, idx) => (
                <li key={idx} className="bg-gray-700 p-2 rounded flex justify-between hover:bg-gray-600 transition-transform transform hover:scale-105">
                  <span>{tx.date} - {tx.description}</span>
                  <span className={tx.amount.startsWith("+") ? "text-green-400" : "text-red-400"}>
                    {tx.amount}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => setWalletOpen(false)}
              className="mt-4 w-full p-2 bg-red-500 rounded hover:bg-red-600 transition-transform transform hover:scale-105"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleUp { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-6px); } 100% { transform: translateY(0px); } }
        .animate-float { animation: float 3s ease-in-out infinite; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .shimmer { background: linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.2) 100%); background-size: 200% 100%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shimmer 2.5s infinite; }
        @keyframes slideIn { 0% { opacity: 0; transform: translateX(-30px); } 100% { opacity: 1; transform: translateX(0); } }
        .animate-slideIn { animation: slideIn 0.5s ease-out; }
      `}</style>
    </div>
  );
}
