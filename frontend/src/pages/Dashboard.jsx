// src/pages/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  FaUsers, FaFileInvoiceDollar, FaUpload, FaHistory,
  FaTrash, FaDollarSign, FaNewspaper, FaBars, FaTimes, FaEdit,
  FaCreditCard,
} from "react-icons/fa";
import { AiOutlineLogout } from "react-icons/ai";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useNavigate } from "react-router-dom";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { Layers } from "lucide-react";
import api from "../Api";
import UploadResourceModal from "../components/UploadResourceModal";
import BulkUploadModal from "../components/BulkUploadModal";
import PaymentSettingsPanel from "../components/PaymentSettingsPanel";
import NewsComposer from "../components/NewsComposer";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [activeTab,        setActiveTab]        = useState("overview");
  const [isSidebarOpen,    setIsSidebarOpen]    = useState(true);
  const [users,            setUsers]            = useState([]);
  // ── Manage Uploads: paginated per resource type instead of loading
  // every Note/Exam/PastPaper/News row at once (client will be adding a
  // lot of content over time, so this needs to scale) ──────────────────
  const RESOURCE_TYPES = [
    { key: "note",      label: "Note" },
    { key: "exam",      label: "Exam" },
    { key: "pastpaper", label: "Past Paper" },
  ];
  const [resourceType,      setResourceType]      = useState("note");
  const [resourceSearch,    setResourceSearch]    = useState("");
  const [uploads,           setUploads]           = useState({ results: [], count: 0, next: null, page: 1 });
  const [uploadsLoading,    setUploadsLoading]    = useState(false);
  const [uploadsLoadingMore,setUploadsLoadingMore]= useState(false);
  const [resourceCounts,    setResourceCounts]    = useState({ note: 0, exam: 0, pastpaper: 0, news: 0 });
  const [transactions,     setTransactions]     = useState([]);
  const [userHistory,      setUserHistory]      = useState([]);
  const [uploadHistory,    setUploadHistory]    = useState([]);
  const [chartData,        setChartData]        = useState([]);
  const [isUploadModalOpen,setIsUploadModalOpen]= useState(false);
  const [isBulkModalOpen,  setIsBulkModalOpen]  = useState(false);
  const [editingResource,  setEditingResource]  = useState(null);

  // ── Derived values ───────────────────────────────────────────────────────
  const totalRevenue = useMemo(
    () => transactions
      .filter((t) => t.transaction_type === "deposit")
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
    [transactions]
  );

  const totalDownloads = useMemo(
    () => transactions.filter((t) => t.transaction_type === "purchase" || t.transaction_type === "download").length,
    [transactions]
  );

  const allUploads = uploads.results; // kept as an alias so the table markup below barely changes

  const mobileNavItems = [
    { icon: FaFileInvoiceDollar, label: "overview",      onClick: () => setActiveTab("overview") },
    { icon: FaDollarSign,        label: "transactions",  onClick: () => setActiveTab("transactions") },
    { icon: FaUsers,             label: "users",         onClick: () => setActiveTab("manageUsers") },
    { icon: FaUpload,            label: "uploads",       onClick: () => setActiveTab("manageUploads") },
    { icon: FaNewspaper,         label: "news",          onClick: () => setActiveTab("newsComposer") },
    { icon: FaCreditCard, label: "paymentSettings", onClick: () => setActiveTab("paymentSettings") },
  ];

  // ── Chart builder ────────────────────────────────────────────────────────
  function buildChartDataFromRealData(users, transactions) {
    const now = new Date();
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const weekTx = transactions.filter((t) => {
        const d = new Date(t.created_at);
        return d >= weekStart && d < weekEnd;
      });
      const weekRevenue   = weekTx.filter((t) => t.transaction_type === "deposit").reduce((s, t) => s + parseFloat(t.amount || 0), 0);
      const weekDownloads = weekTx.filter((t) => t.transaction_type === "purchase" || t.transaction_type === "download").length;
      const weekUsers     = users.filter((u) => {
        const d = new Date(u.date_joined);
        return d >= weekStart && d < weekEnd;
      }).length;
      weeks.push({ name: i === 0 ? "Now" : `W-${i}`, users: weekUsers, revenue: Math.round(weekRevenue), downloads: weekDownloads });
    }
    if (weeks.reduce((s, w) => s + w.users, 0) === 0 && users.length > 0) {
      const rev  = transactions.filter((t) => t.transaction_type === "deposit").reduce((s, t) => s + parseFloat(t.amount || 0), 0);
      const dl   = transactions.filter((t) => t.transaction_type === "purchase" || t.transaction_type === "download").length;
      return [{ name: "All Time", users: users.length, revenue: Math.round(rev), downloads: dl }];
    }
    return weeks;
  }

  // ── Data fetching ────────────────────────────────────────────────────────
  const ADMIN_RESOURCES_URL = "resources/notes/admin/all/"; // same admin/all endpoint, resource_type param picks which model

  const fetchUploads = async (type = resourceType, search = resourceSearch, page = 1, append = false) => {
    if (append) setUploadsLoadingMore(true); else setUploadsLoading(true);
    try {
      const res = await api.get(ADMIN_RESOURCES_URL, {
        params: { resource_type: type, search: search || undefined, page },
        headers: { "Cache-Control": "no-cache" },
      });
      const label = RESOURCE_TYPES.find((t) => t.key === type)?.label || type;
      const tagged = (res.data.results || []).map((r) => ({ ...r, type: label }));
      setUploads((prev) => ({
        results: append ? [...prev.results, ...tagged] : tagged,
        count: res.data.count,
        next: res.data.next,
        page,
      }));
      if (res.data.counts) setResourceCounts(res.data.counts);
    } catch (err) {
      console.error("Error fetching uploads:", err);
      if (!append) setUploads({ results: [], count: 0, next: null, page: 1 });
    } finally {
      if (append) setUploadsLoadingMore(false); else setUploadsLoading(false);
    }
  };

  const loadMoreUploads = () => {
    if (!uploads.next || uploadsLoadingMore) return;
    fetchUploads(resourceType, resourceSearch, uploads.page + 1, true);
  };

  // Re-fetch uploads whenever the type filter or search box changes
  // (search is debounced so fast typing doesn't fire a request per keystroke)
  useEffect(() => {
    const t = setTimeout(
      () => fetchUploads(resourceType, resourceSearch, 1, false),
      resourceSearch ? 300 : 0,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceType, resourceSearch]);

  // Recent-activity feed ("Recent Uploads") — a handful of the newest items
  // per type instead of the entire catalog, combined and re-sorted by date.
  // NewsPost is included via its own dedicated endpoint (resources/admin/news/)
  // rather than RESOURCE_TYPES, since news no longer lives in the generic
  // Note/Exam/PastPaper admin/all endpoint.
  const fetchRecentUploadsActivity = async () => {
    try {
      const settled = await Promise.allSettled([
        ...RESOURCE_TYPES.map((t) =>
          api.get(ADMIN_RESOURCES_URL, { params: { resource_type: t.key, page_size: 5 } }),
        ),
        api.get("resources/admin/news/", { params: { page_size: 5 } }),
      ]);
      const combined = [];
      settled.forEach((r) => {
        if (r.status === "fulfilled") {
          const rows = r.value.data.results || r.value.data || []; // paginated resources vs plain-array NewsPost
          rows.forEach((item) => combined.push({
            id: item.id,
            file: item.title || item.headline || "Untitled",
            action: "uploaded",
            timestamp: item.created_at || item.published_at || new Date().toISOString(),
          }));
        }
      });
      combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setUploadHistory(combined.slice(0, 10));
    } catch { setUploadHistory([]); }
  };

  const fetchDashboardData = async () => {
    try {
      const [usersRes, txRes] = await Promise.all([
        api.get("users/"),
        api.get("payments/admin/transactions/"),
      ]);
      setUsers(usersRes.data || []);
      setTransactions(txRes.data || []);
      setChartData(buildChartDataFromRealData(usersRes.data || [], txRes.data || []));
      setUserHistory((usersRes.data || []).map((u) => ({
        id: u.id,
        user: u.email || u.username || "Unknown",
        action: "joined",
        timestamp: u.date_joined || new Date().toISOString(),
      })));
      // Uploads list refetches itself via the resourceType/resourceSearch effect
      fetchUploads(resourceType, resourceSearch, 1, false);
      fetchRecentUploadsActivity();
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setUsers([]); setTransactions([]);
      setChartData([]); setUserHistory([]); setUploadHistory([]);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  // ── Actions ──────────────────────────────────────────────────────────────
  const deleteUser = async (id) => {
    const u = users.find((u) => u.id === id);
    if (!u) return;
    if (!confirm(`Delete ${u.email || u.username}?`)) return;
    try {
      await api.delete(`users/${id}/`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setUserHistory((prev) => [...prev, { id: Date.now(), user: u.email || u.username, action: "deleted", timestamp: new Date().toISOString() }]);
    } catch { alert("Failed to delete user"); }
  };

  const deleteResource = async (resource) => {
    if (!confirm(`Delete "${resource.title || resource.headline}"?`)) return;
    try {
      const ep = { Note: "resources/notes/", Exam: "resources/exams/", "Past Paper": "resources/past-papers/" };
      await api.delete(`${ep[resource.type]}${resource.id}/`);
      setUploads((prev) => ({
        ...prev,
        results: prev.results.filter((r) => r.id !== resource.id),
        count: Math.max(0, prev.count - 1),
      }));
      if (resource.type === "News") setNewsList((prev) => prev.filter((n) => n.id !== resource.id));
      setUploadHistory((prev) => [...prev, { id: Date.now(), file: resource.title || resource.headline, action: "deleted", timestamp: new Date().toISOString() }]);
    } catch { alert("Failed to delete resource"); }
  };

  const openEditModal   = (resource) => { setEditingResource(resource); setIsUploadModalOpen(true); };
  const handleUploadSuccess = () => { fetchDashboardData(); setEditingResource(null); };
  const handleBulkSuccess   = () => { fetchDashboardData(); setIsBulkModalOpen(false); };

  // ── Particles ────────────────────────────────────────────────────────────
  const particlesInit    = async (engine) => { await loadSlim(engine); };
  const particlesOptions = {
    background: { color: "#0f172a" }, fpsLimit: 60,
    particles: {
      color: { value: ["#38bdf8", "#a78bfa", "#f472b6", "#22c55e"] },
      move: { enable: true, speed: 1 },
      number: { value: 90, density: { enable: true, area: 800 } },
      opacity: { value: 0.5 },
      size: { value: { min: 3, max: 7 } },
    },
  };

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen flex text-white bg-gray-900 overflow-hidden">
      <Particles id="admin-particles" init={particlesInit} options={particlesOptions} className="absolute inset-0 -z-10" />

      {/* Single upload / edit modal */}
      <UploadResourceModal
        isOpen={isUploadModalOpen}
        onClose={() => { setIsUploadModalOpen(false); setEditingResource(null); }}
        onSuccess={handleUploadSuccess}
        editResource={editingResource}
        onOpenBulk={() => setIsBulkModalOpen(true)}
      />

      {/* Bulk upload modal */}
      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={handleBulkSuccess}
      />

      {/* ── DESKTOP SIDEBAR ──────────────────────────────────────────────── */}
      <aside className={`hidden md:flex fixed top-0 left-0 h-full bg-gradient-to-b from-gray-800/80 via-gray-900/80 to-gray-800/80 backdrop-blur-md border-r border-gray-700 shadow-lg z-20 flex-col transform transition-all duration-300 ${isSidebarOpen ? "w-64" : "w-20"}`}>
        <div className="p-4 flex items-center justify-between border-b border-gray-700 sticky top-0 bg-gradient-to-b from-gray-800/90 to-gray-900/90 z-10">
          <h1 className={`text-lg font-bold tracking-wide transition-all duration-300 ${isSidebarOpen ? "block" : "hidden"}`}>APEXLHUB</h1>
          <button className="text-white p-1 hover:bg-gray-700 rounded transition" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
        <nav className="mt-6 flex flex-col gap-2 px-2">
          <TabButton active={activeTab === "overview"}      onClick={() => setActiveTab("overview")}      icon={<FaFileInvoiceDollar />} label="Overview"       isCollapsed={!isSidebarOpen} />
          <TabButton active={activeTab === "transactions"}  onClick={() => setActiveTab("transactions")}  icon={<FaDollarSign />}        label="Transactions"   isCollapsed={!isSidebarOpen} />
          <TabButton active={activeTab === "paymentSettings"} onClick={() => setActiveTab("paymentSettings")} icon={<FaCreditCard />} label="Payment Settings" isCollapsed={!isSidebarOpen} />
          <TabButton active={activeTab === "history"}       onClick={() => setActiveTab("history")}       icon={<FaHistory />}           label="History Logs"   isCollapsed={!isSidebarOpen} />
          <TabButton active={activeTab === "manageUsers"}   onClick={() => setActiveTab("manageUsers")}   icon={<FaUsers />}             label="Manage Users"   isCollapsed={!isSidebarOpen} />
          <TabButton active={activeTab === "manageUploads"} onClick={() => setActiveTab("manageUploads")} icon={<FaUpload />}            label="Manage Uploads" isCollapsed={!isSidebarOpen} />
          <TabButton active={activeTab === "newsComposer"}  onClick={() => setActiveTab("newsComposer")}  icon={<FaNewspaper />}         label="Post News"      isCollapsed={!isSidebarOpen} />
          <button
            onClick={() => navigate("/login")}
            className={`flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-red-500/20 text-red-300 transition mt-4 ${!isSidebarOpen ? "justify-center" : ""}`}
          >
            <AiOutlineLogout size={20} />
            <span className={!isSidebarOpen ? "hidden" : ""}>Logout</span>
          </button>
        </nav>
      </aside>

      {/* ── MOBILE TOP BAR ───────────────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gray-900/90 backdrop-blur-md border-b border-gray-700/60 shadow-lg">
        <h1 className="text-base font-bold tracking-wide text-white">APEXLHUB Admin</h1>
        <button onClick={() => navigate("/login")} className="text-red-400 hover:text-red-300 p-2">
          <AiOutlineLogout size={20} />
        </button>
      </header>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main className={`flex-1 overflow-y-auto max-h-screen transition-all duration-300 ${isSidebarOpen ? "md:ml-64" : "md:ml-20"} pt-16 pb-24 md:pt-6 md:pb-6 px-4 md:px-6`}>

        {/* Stat cards — always visible */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <StatCard title="Total Users"     value={users.length}                          subtitle="Active users" />
          <StatCard title="Total Revenue"   value={`KSh ${totalRevenue.toLocaleString()}`} subtitle="Sum of deposits" />
          <StatCard title="Total Downloads" value={totalDownloads}                         subtitle="Content downloads" />
        </div>

        {/* ── Overview ─────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <section className="bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl p-4 md:p-6 shadow-xl">
            <h3 className="text-lg md:text-xl font-semibold mb-4">Performance Overview</h3>
            {chartData.length > 0 ? (
              <div className="w-full h-[300px] md:h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsers"     x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#60a5fa" stopOpacity={0.9}/><stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/></linearGradient>
                      <linearGradient id="colorRevenue"   x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.9}/><stop offset="95%" stopColor="#34d399" stopOpacity={0}/></linearGradient>
                      <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f472b6" stopOpacity={0.9}/><stop offset="95%" stopColor="#f472b6" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: "12px" }} />
                    <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                    <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: 12, fontSize: "12px" }} />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Area type="monotone" dataKey="users"     stroke="#60a5fa" fill="url(#colorUsers)"     name="Users" />
                    <Area type="monotone" dataKey="revenue"   stroke="#34d399" fill="url(#colorRevenue)"   name="Revenue (KSh)" />
                    <Area type="monotone" dataKey="downloads" stroke="#f472b6" fill="url(#colorDownloads)" name="Downloads" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Loading chart data...</p>
            )}
          </section>
        )}

        {/* ── Transactions ─────────────────────────────────────────────── */}
        {activeTab === "transactions" && (
          <section className="bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl p-4 md:p-6 shadow-xl">
            <h3 className="text-lg md:text-xl font-semibold mb-4">Transactions</h3>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-2 md:px-4 py-2 text-xs md:text-sm">ID</th>
                    <th className="px-2 md:px-4 py-2 text-xs md:text-sm">User</th>
                    <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Type</th>
                    <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Amount</th>
                    <th className="px-2 md:px-4 py-2 text-xs md:text-sm hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-gray-800 hover:bg-gray-700/30 text-xs md:text-sm">
                      <td className="px-2 md:px-4 py-2">{String(t.id).slice(0, 6)}…</td>
                      <td className="px-2 md:px-4 py-2 truncate max-w-[100px]">{t.user || "Unknown"}</td>
                      <td className="px-2 md:px-4 py-2">{t.transaction_type}</td>
                      <td className="px-2 md:px-4 py-2">KSh {parseFloat(t.amount || 0).toFixed(0)}</td>
                      <td className="px-2 md:px-4 py-2 hidden md:table-cell">{new Date(t.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "paymentSettings" && <PaymentSettingsPanel />}

        {/* ── History ──────────────────────────────────────────────────── */}
        {activeTab === "history" && (
          <section className="bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl p-4 md:p-6 shadow-xl">
            <h3 className="text-lg md:text-xl font-semibold mb-4">History Logs</h3>
            <div className="overflow-x-auto -mx-4 md:mx-0 max-h-[60vh]">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-gray-800">
                  <tr className="border-b border-gray-700">
                    <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Entity</th>
                    <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Action</th>
                    <th className="px-2 md:px-4 py-2 text-xs md:text-sm hidden md:table-cell">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {[...userHistory, ...uploadHistory]
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .map((h, idx) => (
                      <tr key={idx} className="border-b border-gray-800 hover:bg-gray-700/30 text-xs md:text-sm">
                        <td className="px-2 md:px-4 py-2 truncate max-w-[150px]">{h.user || h.file}</td>
                        <td className="px-2 md:px-4 py-2">{h.action}</td>
                        <td className="px-2 md:px-4 py-2 hidden md:table-cell">{new Date(h.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── Manage Users ─────────────────────────────────────────────── */}
        {activeTab === "manageUsers" && (
          <section className="bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl p-4 md:p-6 shadow-xl">
            <h3 className="text-lg md:text-xl font-semibold mb-4">Manage Users</h3>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Email</th>
                    <th className="px-2 md:px-4 py-2 text-xs md:text-sm hidden md:table-cell">Role</th>
                    <th className="px-2 md:px-4 py-2 text-xs md:text-sm hidden md:table-cell">Joined</th>
                    <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-700/30 text-xs md:text-sm">
                      <td className="px-2 md:px-4 py-2 truncate max-w-[150px]">{u.email || u.username}</td>
                      <td className="px-2 md:px-4 py-2 hidden md:table-cell">{u.role || "user"}</td>
                      <td className="px-2 md:px-4 py-2 hidden md:table-cell">{new Date(u.date_joined).toLocaleDateString()}</td>
                      <td className="px-2 md:px-4 py-2">
                        <button onClick={() => deleteUser(u.id)} className="text-red-400 hover:text-red-300 text-xs md:text-sm transition-colors">
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

        {/* ── Manage Uploads ───────────────────────────────────────────── */}
        {activeTab === "manageUploads" && (
          <section className="bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl p-4 md:p-6 shadow-xl">
            {/* Header row with both buttons */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
              <h3 className="text-lg md:text-xl font-semibold">Manage Uploads</h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                {/* Single upload */}
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-semibold transition-colors"
                >
                  <FaUpload size={13} /> Upload Resource
                </button>
                {/* Bulk upload */}
                <button
                  onClick={() => setIsBulkModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm font-semibold transition-colors border border-blue-500/30"
                >
                  <Layers size={14} /> Bulk Upload
                </button>
              </div>
            </div>

            {/* Type filter + search — needed now that the table is paginated per type */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex flex-wrap gap-2">
                {RESOURCE_TYPES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setResourceType(t.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border
                      ${resourceType === t.key
                        ? "bg-cyan-600 border-cyan-500 text-white"
                        : "bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-700"}`}
                  >
                    {t.label}s{typeof resourceCounts[t.key] === "number" ? ` (${resourceCounts[t.key]})` : ""}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
                placeholder={`Search ${resourceType}s by title…`}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Title</th>
                    <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Type</th>
                    <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Price</th>
                    <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadsLoading ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-500 text-sm">Loading…</td></tr>
                  ) : allUploads.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-500 text-sm">No resources found.</td></tr>
                  ) : allUploads.map((resource) => (
                    <tr key={`${resource.type}-${resource.id}`} className="border-b border-gray-800 hover:bg-gray-700/30 text-xs md:text-sm">
                      <td className="px-2 md:px-4 py-2 truncate max-w-[150px]">{resource.title || resource.headline || "Untitled"}</td>
                      <td className="px-2 md:px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold
                          ${resource.type === "Note"       ? "bg-cyan-500/10 text-cyan-400" :
                            resource.type === "Exam"       ? "bg-amber-500/10 text-amber-400" :
                            resource.type === "Past Paper" ? "bg-purple-500/10 text-purple-400" :
                            "bg-emerald-500/10 text-emerald-400"}`}>
                          {resource.type}
                        </span>
                      </td>
                      <td className="px-2 md:px-4 py-2">KSh {parseFloat(resource.price || 0).toFixed(0)}</td>
                      <td className="px-2 md:px-4 py-2">
                        <div className="flex items-center gap-3">
                          <button onClick={() => openEditModal(resource)} className="text-blue-400 hover:text-blue-300 transition-colors" title="Edit">
                            <FaEdit size={13} />
                          </button>
                          <button onClick={() => deleteResource(resource)} className="text-red-400 hover:text-red-300 transition-colors" title="Delete">
                            <FaTrash size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {uploads.next && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={loadMoreUploads}
                  disabled={uploadsLoadingMore}
                  className="px-5 py-2 rounded-lg bg-gray-700/70 border border-gray-600 text-gray-200 text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                  {uploadsLoadingMore ? "Loading…" : "Load More"}
                </button>
              </div>
            )}
          </section>
        )}

        {/* ── News Composer ─────────────────────────────────────────────── */}
        {activeTab === "newsComposer" && <NewsComposer />}
      </main>

      {/* ── MOBILE BOTTOM NAV ────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around bg-gray-900/95 backdrop-blur-md border-t border-gray-700/60 shadow-2xl px-2 py-2 safe-area-bottom">
        {mobileNavItems.map((item, idx) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.label;
          return (
            <button
              key={idx}
              onClick={item.onClick}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all active:scale-90 ${isActive ? "text-white bg-gray-700/70" : "text-gray-400 hover:text-gray-200"}`}
            >
              <IconComponent size={20} />
              <span className={`text-[10px] font-medium capitalize leading-none ${isActive ? "text-white" : ""}`}>{item.label}</span>
              {isActive && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />}
            </button>
          );
        })}
      </nav>
      <style>{`.safe-area-bottom { padding-bottom: env(safe-area-inset-bottom, 8px); }`}</style>
    </div>
  );
}

// ── Helper components ────────────────────────────────────────────────────────

function TabButton({ active, onClick, icon, label, isCollapsed }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition ${active ? "bg-cyan-500/20 text-cyan-400 shadow-lg" : "text-gray-300 hover:bg-gray-700/50"} ${isCollapsed ? "justify-center" : ""}`}
    >
      {React.cloneElement(icon, { size: 20 })}
      <span className={isCollapsed ? "hidden" : ""}>{label}</span>
    </button>
  );
}

function StatCard({ title, value, subtitle }) {
  return (
    <div className="bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl p-4 md:p-6 shadow-xl">
      <h4 className="text-gray-300 font-medium text-xs md:text-sm">{title}</h4>
      <p className="text-2xl md:text-3xl font-bold text-white my-1 md:my-2">{value}</p>
      <p className="text-gray-500 text-[10px] md:text-xs">{subtitle}</p>
    </div>
  );
}