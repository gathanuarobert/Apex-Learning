// src/pages/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  FaUsers,
  FaFileInvoiceDollar,
  FaUpload,
  FaHistory,
  FaTrash,
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
import api from "../Api";
import UploadResourceModal from "../components/UploadResourceModal";

export default function AdminDashboard() {
  const navigate = useNavigate();

  // -------- State Management --------
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState({ notes: [], exams: [], pastpapers: [], news: [] });
  const [transactions, setTransactions] = useState([]);
  const [userHistory, setUserHistory] = useState([]);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // -------- Derived stats --------
  const totalRevenue = useMemo(
    () =>
      transactions
        .filter((t) => t.transaction_type === "deposit")
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
    [transactions]
  );

  const totalDownloads = useMemo(
    () => transactions.filter((t) => t.transaction_type === "purchase").length,
    [transactions]
  );

  const allUploads = useMemo(() => {
    return [
      ...resources.notes.map(n => ({ ...n, type: 'Note' })),
      ...resources.exams.map(e => ({ ...e, type: 'Exam' })),
      ...resources.pastpapers.map(p => ({ ...p, type: 'Past Paper' })),
      ...resources.news.map(n => ({ ...n, type: 'News' })),
    ];
  }, [resources]);

  // -------- Helper function to build chart from real data --------
  function buildChartDataFromRealData(users, transactions) {
    const now = new Date();
    const weeks = [];
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      
      const weekTransactions = transactions.filter(t => {
        const tDate = new Date(t.created_at);
        return tDate >= weekStart && tDate < weekEnd;
      });
      
      const weekRevenue = weekTransactions
        .filter(t => t.transaction_type === "deposit")
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
      const weekDownloads = weekTransactions
        .filter(t => t.transaction_type === "purchase")
        .length;
      
      const weekUsers = users.filter(u => {
        const joinDate = new Date(u.date_joined);
        return joinDate >= weekStart && joinDate < weekEnd;
      }).length;
      
      weeks.push({
        name: i === 0 ? "Now" : `W-${i}`,
        users: weekUsers,
        revenue: Math.round(weekRevenue),
        downloads: weekDownloads,
      });
    }
    
    if (weeks.every(w => w.users === 0 && w.revenue === 0 && w.downloads === 0)) {
      return [{
        name: "Now",
        users: users.length,
        revenue: 0,
        downloads: 0
      }];
    }
    
    return weeks;
  }

  // -------- Fetch data from backend --------
  const fetchDashboardData = async () => {
    try {
      const [usersRes, transactionsRes, resourcesRes] = await Promise.all([
        api.get("users/"),
        api.get("payments/admin/transactions/"),
        api.get("resources/admin/all/"),
      ]);

      setUsers(usersRes.data || []);
      setTransactions(transactionsRes.data || []);
      setResources(resourcesRes.data || { notes: [], exams: [], pastpapers: [], news: [] });

      const chartData = buildChartDataFromRealData(
        usersRes.data || [],
        transactionsRes.data || []
      );
      setChartData(chartData);

      const userEvents = (usersRes.data || []).map((u) => ({
        id: u.id,
        user: u.email || u.username || "Unknown",
        action: "joined",
        timestamp: u.date_joined || new Date().toISOString(),
      }));
      setUserHistory(userEvents);

      // Build upload history from resources
      const allResources = [
        ...(resourcesRes.data.notes || []).map(r => ({ ...r, type: 'Note' })),
        ...(resourcesRes.data.exams || []).map(r => ({ ...r, type: 'Exam' })),
        ...(resourcesRes.data.pastpapers || []).map(r => ({ ...r, type: 'Past Paper' })),
        ...(resourcesRes.data.news || []).map(r => ({ ...r, type: 'News' })),
      ];

      const uploadEvents = allResources.map(r => ({
        id: r.id,
        file: r.title || r.headline || "Untitled",
        action: "uploaded",
        timestamp: r.created_at || r.published_at || new Date().toISOString(),
      }));
      setUploadHistory(uploadEvents);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setUsers([]);
      setTransactions([]);
      setResources({ notes: [], exams: [], pastpapers: [], news: [] });
      setChartData([]);
      setUserHistory([]);
      setUploadHistory([]);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // -------- Handlers --------
  const deleteUser = async (id) => {
    const userToDelete = users.find((u) => u.id === id);
    if (!userToDelete) return;

    if (!confirm(`Are you sure you want to delete ${userToDelete.email || userToDelete.username}?`)) {
      return;
    }

    try {
      await api.delete(`users/${id}/`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setUserHistory((prev) => [
        ...prev,
        {
          id: Date.now(),
          user: userToDelete.email || userToDelete.username,
          action: "deleted",
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const deleteResource = async (resource) => {
    if (!confirm(`Are you sure you want to delete "${resource.title || resource.headline}"?`)) {
      return;
    }

    try {
      const endpoints = {
        'Note': 'resources/notes/',
        'Exam': 'resources/exams/',
        'Past Paper': 'resources/past-papers/',
        'News': 'resources/news/',
      };

      await api.delete(`${endpoints[resource.type]}${resource.id}/`);
      
      // Refresh data
      fetchDashboardData();
      
      setUploadHistory((prev) => [
        ...prev,
        {
          id: Date.now(),
          file: resource.title || resource.headline,
          action: "deleted",
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Error deleting resource:", error);
      alert("Failed to delete resource");
    }
  };

  const handleUploadSuccess = () => {
    fetchDashboardData(); // Refresh all data after successful upload
  };

  // -------- Particles background --------
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

      {/* Upload Modal */}
      <UploadResourceModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

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
                      <td className="px-4 py-2 text-xs">{String(t.id).slice(0, 8)}...</td>
                      <td className="px-4 py-2">{t.user || "Unknown"}</td>
                      <td className="px-4 py-2">{t.transaction_type}</td>
                      <td className="px-4 py-2">KSh {parseFloat(t.amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-2">{new Date(t.created_at).toLocaleString()}</td>
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
                    <th className="px-4 py-2">Entity</th>
                    <th className="px-4 py-2">Action</th>
                    <th className="px-4 py-2">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {[...userHistory, ...uploadHistory]
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .map((h, idx) => (
                    <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-2">{h.user || h.file}</td>
                      <td className="px-4 py-2">{h.action}</td>
                      <td className="px-4 py-2">{new Date(h.timestamp).toLocaleString()}</td>
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
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Role</th>
                    <th className="px-4 py-2">Joined</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-2">{u.id}</td>
                      <td className="px-4 py-2">{u.email || u.username}</td>
                      <td className="px-4 py-2">{u.role || "user"}</td>
                      <td className="px-4 py-2">{new Date(u.date_joined).toLocaleDateString()}</td>
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-slate-200">Manage Uploads</h3>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors flex items-center gap-2"
              >
                <FaUpload /> Upload Resource
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-300">
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">Title</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Price</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allUploads.map((resource) => (
                    <tr key={`${resource.type}-${resource.id}`} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-2 text-xs">{String(resource.id).slice(0, 8)}...</td>
                      <td className="px-4 py-2">{resource.title || resource.headline || "Untitled"}</td>
                      <td className="px-4 py-2">{resource.type}</td>
                      <td className="px-4 py-2">KSh {parseFloat(resource.price || 0).toLocaleString()}</td>
                      <td className="px-4 py-2">{new Date(resource.created_at || resource.published_at).toLocaleDateString()}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => deleteResource(resource)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <FaTrash />
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