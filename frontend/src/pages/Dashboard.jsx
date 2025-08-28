// src/pages/AdminDashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FaUsers,
  FaFileInvoiceDollar,
  FaUpload,
  FaHistory,
  FaTrash,
  FaPlus,
  FaDollarSign,
  FaArrowCircleDown,
} from "react-icons/fa";
import { AiOutlineLogout } from "react-icons/ai";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

// Import icons for sidebar control
import { FaBars, FaTimes } from "react-icons/fa";

export default function AdminDashboard() {
  const navigate = useNavigate();

  // -------- State Management --------
  const [activeTab, setActiveTab] = useState("overview"); // overview | transactions | history | manageUsers | manageUploads
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // New state for sidebar
  const [users, setUsers] = useState([
    { id: 1, name: "John Doe", email: "john@example.com", joined: "2025-07-20" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", joined: "2025-07-28" },
    { id: 3, name: "Mark Lee", email: "mark@example.com", joined: "2025-08-01" },
  ]);
  const [uploads, setUploads] = useState([
    { id: 1, name: "KCSE English 2024.pdf", size: "1.2 MB", uploader: "Admin", date: "2025-08-20 10:30" },
    { id: 2, name: "Grade 7 Science Notes.docx", size: "520 KB", uploader: "Admin", date: "2025-08-21 14:45" },
  ]);
  const [transactions, setTransactions] = useState([
    { id: 1, user: "John Doe", type: "deposit", amount: 1200, date: "2025-08-12 09:15" },
    { id: 2, user: "Jane Smith", type: "purchase", amount: 800, item: "KCSE 2024 Math.pdf", date: "2025-08-12 11:03" },
  ]);

  // -------- History Logs --------
  const [userHistory, setUserHistory] = useState([
    { id: 1, user: "John Doe", action: "joined", timestamp: "2025-07-20 08:00" },
    { id: 2, user: "Jane Smith", action: "joined", timestamp: "2025-07-28 15:20" },
  ]);
  const [uploadHistory, setUploadHistory] = useState([
    { id: 1, file: "KCSE English 2024.pdf", action: "uploaded", timestamp: "2025-08-20 10:30" },
    { id: 2, file: "KCSE English 2024.pdf", user: "Jane Smith", action: "downloaded", timestamp: "2025-08-22 11:00" },
  ]);

  // -------- Comparative chart data --------
  const [chartData, setChartData] = useState(() => {
    const labels = ["W-7", "W-6", "W-5", "W-4", "W-3", "W-2", "W-1", "Now"];
    let usersCount = 180;
    let revenue = 9000;
    let downloads = 400;
    return labels.map((name, i) => {
      usersCount += Math.round((Math.sin(i) + 1) * 20 + 10);
      revenue += Math.round((Math.cos(i / 2) + 1) * 600 + 400);
      downloads += Math.round((Math.sin(i / 1.5) + 1) * 25 + 15);
      return { name, users: usersCount, revenue, downloads };
    });
  });

  // -------- Derived stats --------
  const totalRevenue = useMemo(
    () => transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );
  const totalDownloads = useMemo(
    () => uploadHistory.filter(h => h.action === 'downloaded').length,
    [uploadHistory]
  );

  // -------- Real-time simulators (for demonstration) --------
  const tickRef = useRef(8);
  useEffect(() => {
    const chartTimer = setInterval(() => {
      tickRef.current += 1;
      const nextLabel = `+${tickRef.current}m`;
      const last = chartData[chartData.length - 1];
      const next = {
        name: nextLabel,
        users: Math.max(0, last.users + Math.round((Math.sin(tickRef.current / 2) + 0.3) * 18 + (Math.random() * 10 - 3))),
        revenue: Math.max(0, last.revenue + Math.round((Math.cos(tickRef.current / 3) + 0.6) * 400 + (Math.random() * 300 - 50))),
        downloads: Math.max(0, last.downloads + Math.round((Math.sin(tickRef.current / 1.8) + 0.5) * 22 + (Math.random() * 12 - 4))),
      };
      setChartData((prev) => [...prev.slice(-11), next]);
    }, 6000);

    const txTimer = setInterval(() => {
      const user = users[Math.floor(Math.random() * users.length)];
      if (!user) return;
      const now = new Date().toISOString().slice(0, 16).replace("T", " ");

      if (Math.random() > 0.5) { // Simulate a deposit
        const amount = Math.max(100, Math.round(Math.random() * 2000));
        setTransactions((prev) => [...prev, { id: Date.now(), user: user.name, type: "deposit", amount, date: now }]);
      } else { // Simulate a purchase/download
        const item = uploads[Math.floor(Math.random() * uploads.length)];
        if (!item) return;
        const amount = Math.max(50, Math.round(Math.random() * 500));
        setTransactions((prev) => [...prev, { id: Date.now(), user: user.name, type: "purchase", amount, item: item.name, date: now }]);
        setUploadHistory((prev) => [...prev, { id: Date.now(), user: user.name, file: item.name, action: "downloaded", timestamp: now }]);
      }
    }, 8000);

    return () => {
      clearInterval(chartTimer);
      clearInterval(txTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, uploads, chartData]);

  // -------- Handlers --------
  const deleteUser = (id) => {
    const userToDelete = users.find(u => u.id === id);
    if (!userToDelete) return;
    setUsers(prev => prev.filter(u => u.id !== id));
    setUserHistory(prev => [...prev, { id: Date.now(), user: userToDelete.name, action: "deleted", timestamp: new Date().toISOString().slice(0, 16).replace("T", " ") }]);
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    const newUpload = {
      id: Date.now(),
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      uploader: "Admin",
      date: now,
    };
    setUploads(prev => [...prev, newUpload]);
    setUploadHistory(prev => [...prev, { id: Date.now(), file: newUpload.name, action: "uploaded", timestamp: now }]);
  };

  const deleteUpload = (id) => {
    const uploadToDelete = uploads.find(u => u.id === id);
    if (!uploadToDelete) return;
    setUploads(prev => prev.filter(u => u.id !== id));
    setUploadHistory(prev => [...prev, { id: Date.now(), file: uploadToDelete.name, action: "deleted", timestamp: new Date().toISOString().slice(0, 16).replace("T", " ") }]);
  };

  // -------- Particles background --------
  const particlesInit = async (engine) => { await loadSlim(engine); };
  const particlesOptions = {
    background: { color: "#0f172a" },
    fpsLimit: 60,
    interactivity: { events: { onHover: { enable: true, mode: "repulse" }, resize: true }, modes: { repulse: { distance: 100, duration: 0.4 } } },
    particles: { color: { value: "#38bdf8" }, move: { enable: true, speed: 1.5 }, number: { value: 60, density: { enable: true, area: 800 } }, opacity: { value: 0.35 }, size: { value: { min: 1, max: 4 } } },
  };

  return (
    <div className="relative min-h-screen text-slate-100 font-sans">
      <Particles id="tsparticles" init={particlesInit} options={particlesOptions} className="absolute inset-0 -z-20" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
        <div className="absolute -top-24 -left-24 h-80 w-80 bg-fuchsia-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 bg-cyan-500 rounded-full blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
      </div>

      {/* Sidebar */}
      <aside className={`fixed top-0 h-full bg-[#0b1220]/80 backdrop-blur-md border-r border-slate-800 p-6 transition-all duration-300 ease-in-out z-50 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          {isSidebarCollapsed ? <FaBars size={24} /> : <FaTimes size={24} />}
        </button>
        <div className={`flex items-center mb-8 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          <h2 className={`text-2xl font-extrabold tracking-wide text-cyan-400 transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
            APEXLHUB
          </h2>
        </div>
        <nav className="space-y-3">
          <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={<FaFileInvoiceDollar />} label="Overview" isCollapsed={isSidebarCollapsed} />
          <TabButton active={activeTab === "transactions"} onClick={() => setActiveTab("transactions")} icon={<FaDollarSign />} label="Transactions" isCollapsed={isSidebarCollapsed} />
          <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")} icon={<FaHistory />} label="History Logs" isCollapsed={isSidebarCollapsed} />
          <TabButton active={activeTab === "manageUsers"} onClick={() => setActiveTab("manageUsers")} icon={<FaUsers />} label="Manage Users" isCollapsed={isSidebarCollapsed} />
          <TabButton active={activeTab === "manageUploads"} onClick={() => setActiveTab("manageUploads")} icon={<FaUpload />} label="Manage Uploads" isCollapsed={isSidebarCollapsed} />
          <button onClick={() => navigate("/login")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-300 transition-colors mt-6 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <AiOutlineLogout /> <span className={`${isSidebarCollapsed ? 'hidden' : ''}`}>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`p-8 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total Users" value={users.length} subtitle="Total active users" />
          <StatCard title="Total Revenue" value={`KSh ${totalRevenue.toLocaleString()}`} subtitle="Sum of all deposits" />
          <StatCard title="Total Downloads" value={totalDownloads} subtitle="Total content downloads" />
        </div>

        {activeTab === "overview" && (
          <section className="bg-[#101a2b]/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-slate-200">Performance Overview</h3>
            <div className="w-full h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.9} /><stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.9} /><stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f472b6" stopOpacity={0.9} /><stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2a44" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: "#0b1220", border: "none", borderRadius: 12 }} labelStyle={{ color: "#cbd5e1" }} />
                  <Legend wrapperStyle={{ color: "#cbd5e1" }} />
                  <Area type="monotone" dataKey="users" name="Users" stroke="#60a5fa" strokeWidth={3} fill="url(#colorUsers)" animationDuration={1500} />
                  <Area type="monotone" dataKey="revenue" name="Revenue (KSh)" stroke="#34d399" strokeWidth={3} fill="url(#colorRevenue)" animationDuration={1500} />
                  <Area type="monotone" dataKey="downloads" name="Downloads" stroke="#f472b6" strokeWidth={3} fill="url(#colorDownloads)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}
        
        {activeTab === "transactions" && (
          <section className="bg-[#101a2b]/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-slate-200">Transaction History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-300 border-b border-slate-700">
                    <th className="p-3">User</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Amount (KSh)</th>
                    <th className="p-3">Item</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice().reverse().map((t) => (
                    <tr key={t.id} className="border-b border-slate-800 hover:bg-white/5 transition-colors">
                      <td className="p-3">{t.user}</td>
                      <td className={`p-3 font-semibold ${t.type === 'deposit' ? 'text-emerald-400' : 'text-pink-300'}`}>{t.type}</td>
                      <td className="p-3">{t.amount.toLocaleString()}</td>
                      <td className="p-3 text-slate-400">{t.item || '-'}</td>
                      <td className="p-3">{t.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "history" && (
          <section className="bg-[#101a2b]/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-slate-200">Detailed History Logs</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <HistoryCard title="User Events" history={userHistory} />
              <HistoryCard title="Uploads & Downloads" history={uploadHistory} />
            </div>
          </section>
        )}

        {activeTab === "manageUsers" && (
          <section className="bg-[#101a2b]/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-200">Manage Users</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-300 border-b border-slate-700">
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Joined</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-800 hover:bg-white/5 transition-colors">
                      <td className="p-3">{u.name}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">{u.joined}</td>
                      <td className="p-3">
                        <button onClick={() => deleteUser(u.id)} className="text-rose-400 hover:text-rose-300 flex items-center gap-2">
                          <FaTrash /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "manageUploads" && (
          <section className="bg-[#101a2b]/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-200">Manage Uploads</h3>
              <label htmlFor="file-upload" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center gap-2 cursor-pointer">
                <FaPlus /> Add Upload
                <input id="file-upload" type="file" onChange={handleUpload} className="hidden" />
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-300 border-b border-slate-700">
                    <th className="p-3">File Name</th>
                    <th className="p-3">Size</th>
                    <th className="p-3">Uploaded On</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {uploads.map((u) => (
                    <tr key={u.id} className="border-b border-slate-800 hover:bg-white/5 transition-colors">
                      <td className="p-3">{u.name}</td>
                      <td className="p-3">{u.size}</td>
                      <td className="p-3">{u.date}</td>
                      <td className="p-3">
                        <button onClick={() => deleteUpload(u.id)} className="text-rose-400 hover:text-rose-300 flex items-center gap-2">
                          <FaTrash /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// ---------- Small UI Components ----------
function StatCard({ title, value, subtitle }) {
  return (
    <div className="bg-[#101a2b]/70 border border-slate-800 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-shadow">
      <p className="text-sm text-slate-300">{title}</p>
      <p className="text-2xl font-extrabold mt-1 text-cyan-400">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, isCollapsed }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
        active ? "bg-cyan-500/20 text-cyan-300" : "hover:bg-white/10"
      } ${isCollapsed ? 'justify-center' : ''}`}
    >
      {icon}
      <span className={`${isCollapsed ? 'hidden' : ''}`}>{label}</span>
    </button>
  );
}

function HistoryCard({ title, history }) {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-slate-800 shadow-lg">
      <h4 className="text-lg font-semibold mb-3 text-slate-200">{title}</h4>
      <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {history.slice().reverse().map((item, index) => (
          <li key={item.id || index} className="text-sm text-slate-300 border-b border-slate-700 pb-2 last:border-b-0">
            <p className="font-medium text-white">{item.user || item.file} <span className="text-cyan-300">{item.action}</span></p>
            <p className="text-xs text-slate-400">{item.timestamp}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}