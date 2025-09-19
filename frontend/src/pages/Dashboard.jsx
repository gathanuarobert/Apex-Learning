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
import { FaBars, FaTimes } from "react-icons/fa";
import api, { getCurrentUser } from "../Api"; // <-- integrated API

export default function AdminDashboard() {
  const navigate = useNavigate();

  // -------- State Management --------
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [users, setUsers] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [userHistory, setUserHistory] = useState([]);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [chartData, setChartData] = useState([]);

  const tickRef = useRef(8);

  // -------- Derived stats --------
  const totalRevenue = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "deposit")
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const totalDownloads = useMemo(
    () => uploadHistory.filter((h) => h.action === "downloaded").length,
    [uploadHistory]
  );

  // -------- Fetch data from backend --------
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [usersRes, uploadsRes, transactionsRes] = await Promise.all([
          api.get("users/"),
          api.get("resources/library/my-downloads/"),
          api.get("payments/transactions/"),
        ]);

        setUsers(usersRes.data);
        setUploads(uploadsRes.data);
        setTransactions(transactionsRes.data);

        // History logs
        const userEvents = usersRes.data.map((u) => ({
          id: u.id,
          user: u.name,
          action: "joined",
          timestamp: u.joined,
        }));
        const uploadEvents = uploadsRes.data.map((u) => ({
          id: u.id,
          file: u.name,
          action: "uploaded",
          timestamp: u.date,
        }));
        setUserHistory(userEvents);
        setUploadHistory(uploadEvents);

        // Chart data
        const labels = ["W-7","W-6","W-5","W-4","W-3","W-2","W-1","Now"];
        let usersCount = usersRes.data.length;
        let revenue = transactionsRes.data.reduce(
          (sum, t) => sum + (t.type === "deposit" ? t.amount : 0),
          0
        );
        let downloads = uploadEvents.length;
        setChartData(
          labels.map((name, i) => {
            usersCount += Math.round((Math.sin(i) + 1) * 5);
            revenue += Math.round((Math.cos(i / 2) + 1) * 100);
            downloads += Math.round((Math.sin(i / 1.5) + 1) * 3);
            return { name, users: usersCount, revenue, downloads };
          })
        );
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  // -------- Real-time simulator (optional, keeps your original effect) --------
  useEffect(() => {
    const chartTimer = setInterval(() => {
      tickRef.current += 1;
      const nextLabel = `+${tickRef.current}m`;
      const last = chartData[chartData.length - 1] || { users: 0, revenue: 0, downloads: 0 };
      const next = {
        name: nextLabel,
        users: Math.max(
          0,
          last.users + Math.round((Math.sin(tickRef.current / 2) + 0.3) * 18)
        ),
        revenue: Math.max(
          0,
          last.revenue + Math.round((Math.cos(tickRef.current / 3) + 0.6) * 400)
        ),
        downloads: Math.max(
          0,
          last.downloads + Math.round((Math.sin(tickRef.current / 1.8) + 0.5) * 22)
        ),
      };
      setChartData((prev) => [...prev.slice(-11), next]);
    }, 6000);

    return () => clearInterval(chartTimer);
  }, [chartData]);

  // -------- Handlers remain the same --------
  const deleteUser = (id) => {
    const userToDelete = users.find((u) => u.id === id);
    if (!userToDelete) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setUserHistory((prev) => [
      ...prev,
      {
        id: Date.now(),
        user: userToDelete.name,
        action: "deleted",
        timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      },
    ]);
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
    setUploads((prev) => [...prev, newUpload]);
    setUploadHistory((prev) => [
      ...prev,
      { id: Date.now(), file: newUpload.name, action: "uploaded", timestamp: now },
    ]);
  };

  const deleteUpload = (id) => {
    const uploadToDelete = uploads.find((u) => u.id === id);
    if (!uploadToDelete) return;
    setUploads((prev) => prev.filter((u) => u.id !== id));
    setUploadHistory((prev) => [
      ...prev,
      {
        id: Date.now(),
        file: uploadToDelete.name,
        action: "deleted",
        timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      },
    ]);
  };

  // -------- Particles background and UI remain unchanged --------
  const particlesInit = async (engine) => {
    await loadSlim(engine);
  };
  const particlesOptions = {
    background: { color: "#0f172a" },
    fpsLimit: 60,
    interactivity: {
      events: { onHover: { enable: true, mode: "repulse" }, resize: true },
      modes: { repulse: { distance: 100, duration: 0.4 } },
    },
    particles: {
      color: { value: "#38bdf8" },
      move: { enable: true, speed: 1.5 },
      number: { value: 60, density: { enable: true, area: 800 } },
      opacity: { value: 0.35 },
      size: { value: { min: 1, max: 4 } },
    },
  };

  return (
    <div className="relative min-h-screen text-slate-100 font-sans">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={particlesOptions}
        className="absolute inset-0 -z-20"
      />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
        <div className="absolute -top-24 -left-24 h-80 w-80 bg-fuchsia-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 bg-cyan-500 rounded-full blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 h-full bg-[#0b1220]/80 backdrop-blur-md border-r border-slate-800 p-6 transition-all duration-300 ease-in-out z-50 ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          {isSidebarCollapsed ? <FaBars size={24} /> : <FaTimes size={24} />}
        </button>
        <div className={`flex items-center mb-8 ${isSidebarCollapsed ? "justify-center" : ""}`}>
          <h2
            className={`text-2xl font-extrabold tracking-wide text-cyan-400 transition-opacity duration-300 ${
              isSidebarCollapsed ? "opacity-0" : "opacity-100"
            }`}
          >
            APEXLHUB
          </h2>
        </div>
        <nav className="space-y-3">
          <TabButton
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
            icon={<FaFileInvoiceDollar />}
            label="Overview"
            isCollapsed={isSidebarCollapsed}
          />
          <TabButton
            active={activeTab === "transactions"}
            onClick={() => setActiveTab("transactions")}
            icon={<FaDollarSign />}
            label="Transactions"
            isCollapsed={isSidebarCollapsed}
          />
          <TabButton
            active={activeTab === "history"}
            onClick={() => setActiveTab("history")}
            icon={<FaHistory />}
            label="History Logs"
            isCollapsed={isSidebarCollapsed}
          />
          <TabButton
            active={activeTab === "manageUsers"}
            onClick={() => setActiveTab("manageUsers")}
            icon={<FaUsers />}
            label="Manage Users"
            isCollapsed={isSidebarCollapsed}
          />
          <TabButton
            active={activeTab === "manageUploads"}
            onClick={() => setActiveTab("manageUploads")}
            icon={<FaUpload />}
            label="Manage Uploads"
            isCollapsed={isSidebarCollapsed}
          />
          <button
            onClick={() => navigate("/login")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-300 transition-colors mt-6 ${
              isSidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <AiOutlineLogout /> <span className={`${isSidebarCollapsed ? "hidden" : ""}`}>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`p-8 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "ml-20" : "ml-64"}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total Users" value={users.length} subtitle="Total active users" />
          <StatCard title="Total Revenue" value={`KSh ${totalRevenue.toLocaleString()}`} subtitle="Sum of all deposits" />
          <StatCard title="Total Downloads" value={totalDownloads} subtitle="Total content downloads" />
        </div>

        {/* Tabs content */}
        {activeTab === "overview" && (
          <section className="bg-[#101a2b]/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-slate-200">Performance Overview</h3>
            <div className="w-full h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f472b6" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2a44" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: "#0b1220", border: "none", borderRadius: 12 }} labelStyle={{ color: "#cbd5e1" }} />
                  <Legend wrapperStyle={{ color: "#cbd5e1" }} />
                  <Area type="monotone" dataKey="users" stroke="#60a5fa" fill="url(#colorUsers)" />
                  <Area type="monotone" dataKey="revenue" stroke="#34d399" fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="downloads" stroke="#f472b6" fill="url(#colorDownloads)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {activeTab === "transactions" && (
          <section className="bg-[#101a2b]/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-slate-200">Transactions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-300">
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">User</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-2">{t.id}</td>
                      <td className="px-4 py-2">{t.user}</td>
                      <td className="px-4 py-2">{t.type}</td>
                      <td className="px-4 py-2">KSh {t.amount.toLocaleString()}</td>
                      <td className="px-4 py-2">{t.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "history" && (
          <section className="bg-[#101a2b]/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-slate-200">History Logs</h3>
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-300">
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">Entity</th>
                    <th className="px-4 py-2">Action</th>
                    <th className="px-4 py-2">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {[...userHistory, ...uploadHistory].map((h) => (
                    <tr key={h.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-2">{h.id}</td>
                      <td className="px-4 py-2">{h.user || h.file}</td>
                      <td className="px-4 py-2">{h.action}</td>
                      <td className="px-4 py-2">{h.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "manageUsers" && (
          <section className="bg-[#101a2b]/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-slate-200">Manage Users</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-300">
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Joined</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-2">{u.id}</td>
                      <td className="px-4 py-2">{u.name}</td>
                      <td className="px-4 py-2">{u.email}</td>
                      <td className="px-4 py-2">{u.joined}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          Delete
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
            <h3 className="text-xl font-semibold mb-4 text-slate-200">Manage Uploads</h3>
            <input
              type="file"
              onChange={handleUpload}
              className="mb-4 p-2 rounded bg-slate-800 text-slate-200 cursor-pointer"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-300">
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">File Name</th>
                    <th className="px-4 py-2">Size</th>
                    <th className="px-4 py-2">Uploader</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {uploads.map((u) => (
                    <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-2">{u.id}</td>
                      <td className="px-4 py-2">{u.name}</td>
                      <td className="px-4 py-2">{u.size}</td>
                      <td className="px-4 py-2">{u.uploader}</td>
                      <td className="px-4 py-2">{u.date}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => deleteUpload(u.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          Delete
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

// -------- Helper Components --------
function TabButton({ active, onClick, icon, label, isCollapsed }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
        active ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:bg-slate-700/30"
      } ${isCollapsed ? "justify-center" : ""}`}
    >
      {icon} <span className={`${isCollapsed ? "hidden" : ""}`}>{label}</span>
    </button>
  );
}

function StatCard({ title, value, subtitle }) {
  return (
    <div className="bg-[#101a2b]/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <h4 className="text-slate-300 font-medium">{title}</h4>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
    </div>
  );
}
