// src/pages/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  FaUsers, FaFileInvoiceDollar, FaUpload, FaHistory,
  FaTrash, FaDollarSign, FaNewspaper, FaBars, FaTimes, FaEdit,
} from "react-icons/fa";
import { AiOutlineLogout } from "react-icons/ai";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useNavigate } from "react-router-dom";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import api from "../Api";
import UploadResourceModal from "../components/UploadResourceModal";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState({ notes: [], exams: [], pastpapers: [], news: [] });
  const [transactions, setTransactions] = useState([]);
  const [userHistory, setUserHistory] = useState([]);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [newsHeadline, setNewsHeadline] = useState("");
  const [newsBody, setNewsBody] = useState("");
  const [newsImage, setNewsImage] = useState(null);
  const [newsCategory, setNewsCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [postingNews, setPostingNews] = useState(false);

  const totalRevenue = useMemo(
    () => transactions.filter((t) => t.transaction_type === "deposit").reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
    [transactions]
  );

  const totalDownloads = useMemo(
    () => transactions.filter((t) => t.transaction_type === "purchase" || t.transaction_type === "download").length,
    [transactions]
  );

  const allUploads = useMemo(() => ([
    ...resources.notes.map((n) => ({ ...n, type: "Note" })),
    ...resources.exams.map((e) => ({ ...e, type: "Exam" })),
    ...resources.pastpapers.map((p) => ({ ...p, type: "Past Paper" })),
    ...resources.news.map((n) => ({ ...n, type: "News" })),
  ]), [resources]);

  const mobileNavItems = [
    { icon: FaFileInvoiceDollar, label: "overview", onClick: () => setActiveTab("overview") },
    { icon: FaDollarSign, label: "transactions", onClick: () => setActiveTab("transactions") },
    { icon: FaUsers, label: "users", onClick: () => setActiveTab("manageUsers") },
    { icon: FaUpload, label: "uploads", onClick: () => setActiveTab("manageUploads") },
    { icon: FaNewspaper, label: "news", onClick: () => setActiveTab("newsComposer") },
  ];

  function buildChartDataFromRealData(users, transactions) {
    const now = new Date();
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const weekTransactions = transactions.filter((t) => { const tDate = new Date(t.created_at); return tDate >= weekStart && tDate < weekEnd; });
      const weekRevenue = weekTransactions.filter((t) => t.transaction_type === "deposit").reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      const weekDownloads = weekTransactions.filter((t) => t.transaction_type === "purchase" || t.transaction_type === "download").length;
      const weekUsers = users.filter((u) => { const joinDate = new Date(u.date_joined); return joinDate >= weekStart && joinDate < weekEnd; }).length;
      weeks.push({ name: i === 0 ? "Now" : `W-${i}`, users: weekUsers, revenue: Math.round(weekRevenue), downloads: weekDownloads });
    }
    const totalWeeklyUsers = weeks.reduce((sum, w) => sum + w.users, 0);
    if (totalWeeklyUsers === 0 && users.length > 0) {
      const totalRevenue = transactions.filter((t) => t.transaction_type === "deposit").reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      const totalDownloads = transactions.filter((t) => t.transaction_type === "purchase" || t.transaction_type === "download").length;
      return [{ name: "All Time", users: users.length, revenue: Math.round(totalRevenue), downloads: totalDownloads }];
    }
    return weeks;
  }

  const fetchDashboardData = async () => {
    try {
      const [usersRes, transactionsRes, resourcesRes, categoriesRes] = await Promise.all([
        api.get("users/"),
        api.get("payments/admin/transactions/"),
        api.get("resources/notes/admin/all/", { headers: { "Cache-Control": "no-cache" } }),
        api.get("resources/news-categories/"),
      ]);
      setUsers(usersRes.data || []);
      setTransactions(transactionsRes.data || []);
      setResources(resourcesRes.data || { notes: [], exams: [], pastpapers: [], news: [] });
      setCategories(categoriesRes.data || []);
      setChartData(buildChartDataFromRealData(usersRes.data || [], transactionsRes.data || []));
      setUserHistory((usersRes.data || []).map((u) => ({ id: u.id, user: u.email || u.username || "Unknown", action: "joined", timestamp: u.date_joined || new Date().toISOString() })));
      const allResources = [
        ...(resourcesRes.data.notes || []).map((r) => ({ ...r, type: "Note" })),
        ...(resourcesRes.data.exams || []).map((r) => ({ ...r, type: "Exam" })),
        ...(resourcesRes.data.pastpapers || []).map((r) => ({ ...r, type: "Past Paper" })),
        ...(resourcesRes.data.news || []).map((r) => ({ ...r, type: "News" })),
      ];
      setUploadHistory(allResources.map((r) => ({ id: r.id, file: r.title || r.headline || "Untitled", action: "uploaded", timestamp: r.created_at || r.published_at || new Date().toISOString() })));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setUsers([]); setTransactions([]); setResources({ notes: [], exams: [], pastpapers: [], news: [] });
      setCategories([]); setChartData([]); setUserHistory([]); setUploadHistory([]);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const deleteUser = async (id) => {
    const userToDelete = users.find((u) => u.id === id);
    if (!userToDelete) return;
    if (!confirm(`Are you sure you want to delete ${userToDelete.email || userToDelete.username}?`)) return;
    try {
      await api.delete(`users/${id}/`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setUserHistory((prev) => [...prev, { id: Date.now(), user: userToDelete.email || userToDelete.username, action: "deleted", timestamp: new Date().toISOString() }]);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const deleteResource = async (resource) => {
    if (!confirm(`Are you sure you want to delete "${resource.title || resource.headline}"?`)) return;
    try {
      const endpoints = { Note: "resources/notes/", Exam: "resources/exams/", "Past Paper": "resources/past-papers/", News: "resources/news/" };
      await api.delete(`${endpoints[resource.type]}${resource.id}/`);
      // Update state directly — no refetch needed
      setResources((prev) => ({
        notes: resource.type === "Note" ? prev.notes.filter((r) => r.id !== resource.id) : prev.notes,
        exams: resource.type === "Exam" ? prev.exams.filter((r) => r.id !== resource.id) : prev.exams,
        pastpapers: resource.type === "Past Paper" ? prev.pastpapers.filter((r) => r.id !== resource.id) : prev.pastpapers,
        news: resource.type === "News" ? prev.news.filter((r) => r.id !== resource.id) : prev.news,
      }));
      setUploadHistory((prev) => [...prev, { id: Date.now(), file: resource.title || resource.headline, action: "deleted", timestamp: new Date().toISOString() }]);
    } catch (error) {
      console.error("Error deleting resource:", error);
      alert("Failed to delete resource");
    }
  };

  const openEditModal = (resource) => { setEditingResource(resource); setIsUploadModalOpen(true); };
  const handleUploadSuccess = () => { fetchDashboardData(); setEditingResource(null); };

  const handlePostNews = async (e) => {
    e.preventDefault();
    if (!newsHeadline || !newsBody) { alert("Headline and body are required."); return; }
    setPostingNews(true);
    try {
      const formData = new FormData();
      formData.append("title", newsHeadline);
      formData.append("body", newsBody);
      if (newsCategory) formData.append("category_id", newsCategory);
      if (newsImage) formData.append("file", newsImage);
      await api.post("resources/admin/news/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      alert("News posted successfully!");
      setNewsHeadline(""); setNewsBody(""); setNewsImage(null); setNewsCategory("");
      fetchDashboardData();
    } catch (error) {
      console.error("Error posting news:", error);
      alert("Failed to post news. Try again.");
    } finally {
      setPostingNews(false);
    }
  };

  const particlesInit = async (engine) => { await loadSlim(engine); };
  const particlesOptions = {
    background: { color: "#0f172a" }, fpsLimit: 60,
    particles: { color: { value: ["#38bdf8", "#a78bfa", "#f472b6", "#22c55e"] }, move: { enable: true, speed: 1 }, number: { value: 90, density: { enable: true, area: 800 } }, opacity: { value: 0.5 }, size: { value: { min: 3, max: 7 } } },
  };

  return (
    <div className="relative min-h-screen flex text-white bg-gray-900 overflow-hidden">
      <Particles id="admin-particles" init={particlesInit} options={particlesOptions} className="absolute inset-0 -z-10" />
      <UploadResourceModal isOpen={isUploadModalOpen} onClose={() => { setIsUploadModalOpen(false); setEditingResource(null); }} onSuccess={handleUploadSuccess} editResource={editingResource} />

      {/* DESKTOP SIDEBAR */}
      <aside className={`hidden md:flex fixed top-0 left-0 h-full bg-gradient-to-b from-gray-800/80 via-gray-900/80 to-gray-800/80 backdrop-blur-md border-r border-gray-700 shadow-lg z-20 flex-col transform transition-all duration-300 ${isSidebarOpen ? "w-64" : "w-20"}`}>
        <div className="p-4 flex items-center justify-between border-b border-gray-700 sticky top-0 bg-gradient-to-b from-gray-800/90 to-gray-900/90 z-10">
          <h1 className={`text-lg font-bold tracking-wide transition-all duration-300 ${isSidebarOpen ? "block" : "hidden"}`}>APEXLHUB</h1>
          <button className="text-white p-1 hover:bg-gray-700 rounded transition" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>{isSidebarOpen ? <FaTimes /> : <FaBars />}</button>
        </div>
        <nav className="mt-6 flex flex-col gap-2 px-2">
          <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={<FaFileInvoiceDollar />} label="Overview" isCollapsed={!isSidebarOpen} />
          <TabButton active={activeTab === "transactions"} onClick={() => setActiveTab("transactions")} icon={<FaDollarSign />} label="Transactions" isCollapsed={!isSidebarOpen} />
          <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")} icon={<FaHistory />} label="History Logs" isCollapsed={!isSidebarOpen} />
          <TabButton active={activeTab === "manageUsers"} onClick={() => setActiveTab("manageUsers")} icon={<FaUsers />} label="Manage Users" isCollapsed={!isSidebarOpen} />
          <TabButton active={activeTab === "manageUploads"} onClick={() => setActiveTab("manageUploads")} icon={<FaUpload />} label="Manage Uploads" isCollapsed={!isSidebarOpen} />
          <TabButton active={activeTab === "newsComposer"} onClick={() => setActiveTab("newsComposer")} icon={<FaNewspaper />} label="Post News" isCollapsed={!isSidebarOpen} />
          <button onClick={() => navigate("/login")} className={`flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-red-500/20 text-red-300 transition mt-4 ${!isSidebarOpen ? "justify-center" : ""}`}>
            <AiOutlineLogout size={20} /> <span className={`${!isSidebarOpen ? "hidden" : ""}`}>Logout</span>
          </button>
        </nav>
      </aside>

      {/* MOBILE TOP BAR */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gray-900/90 backdrop-blur-md border-b border-gray-700/60 shadow-lg">
        <h1 className="text-base font-bold tracking-wide text-white">APEXLHUB Admin</h1>
        <button onClick={() => navigate("/login")} className="text-red-400 hover:text-red-300 p-2"><AiOutlineLogout size={20} /></button>
      </header>

      {/* MAIN CONTENT */}
      <main className={`flex-1 overflow-y-auto max-h-screen transition-all duration-300 ${isSidebarOpen ? "md:ml-64" : "md:ml-20"} pt-16 pb-24 md:pt-6 md:pb-6 px-4 md:px-6`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <StatCard title="Total Users" value={users.length} subtitle="Active users" />
          <StatCard title="Total Revenue" value={`KSh ${totalRevenue.toLocaleString()}`} subtitle="Sum of deposits" />
          <StatCard title="Total Downloads" value={totalDownloads} subtitle="Content downloads" />
        </div>

        {activeTab === "overview" && (
          <section className="bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl p-4 md:p-6 shadow-xl">
            <h3 className="text-lg md:text-xl font-semibold mb-4">Performance Overview</h3>
            {chartData.length > 0 ? (
              <div className="w-full h-[300px] md:h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#60a5fa" stopOpacity={0.9}/><stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/></linearGradient>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.9}/><stop offset="95%" stopColor="#34d399" stopOpacity={0}/></linearGradient>
                      <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f472b6" stopOpacity={0.9}/><stop offset="95%" stopColor="#f472b6" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: "12px" }} />
                    <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                    <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: 12, fontSize: "12px" }} />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Area type="monotone" dataKey="users" stroke="#60a5fa" fill="url(#colorUsers)" name="Users" />
                    <Area type="monotone" dataKey="revenue" stroke="#34d399" fill="url(#colorRevenue)" name="Revenue (KSh)" />
                    <Area type="monotone" dataKey="downloads" stroke="#f472b6" fill="url(#colorDownloads)" name="Downloads" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (<p className="text-gray-500 text-center py-8">Loading chart data...</p>)}
          </section>
        )}

        {activeTab === "transactions" && (
          <section className="bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl p-4 md:p-6 shadow-xl">
            <h3 className="text-lg md:text-xl font-semibold mb-4">Transactions</h3>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-gray-700">
                  <th className="px-2 md:px-4 py-2 text-xs md:text-sm">ID</th>
                  <th className="px-2 md:px-4 py-2 text-xs md:text-sm">User</th>
                  <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Type</th>
                  <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Amount</th>
                  <th className="px-2 md:px-4 py-2 text-xs md:text-sm hidden md:table-cell">Date</th>
                </tr></thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-gray-800 hover:bg-gray-700/30 text-xs md:text-sm">
                      <td className="px-2 md:px-4 py-2">{String(t.id).slice(0, 6)}...</td>
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

        {activeTab === "history" && (
          <section className="bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl p-4 md:p-6 shadow-xl">
            <h3 className="text-lg md:text-xl font-semibold mb-4">History Logs</h3>
            <div className="overflow-x-auto -mx-4 md:mx-0 max-h-[60vh]">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-gray-800"><tr className="border-b border-gray-700">
                  <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Entity</th>
                  <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Action</th>
                  <th className="px-2 md:px-4 py-2 text-xs md:text-sm hidden md:table-cell">Timestamp</th>
                </tr></thead>
                <tbody>
                  {[...userHistory, ...uploadHistory].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((h, idx) => (
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

        {activeTab === "manageUsers" && (
          <section className="bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl p-4 md:p-6 shadow-xl">
            <h3 className="text-lg md:text-xl font-semibold mb-4">Manage Users</h3>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-gray-700">
                  <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Email</th>
                  <th className="px-2 md:px-4 py-2 text-xs md:text-sm hidden md:table-cell">Role</th>
                  <th className="px-2 md:px-4 py-2 text-xs md:text-sm hidden md:table-cell">Joined</th>
                  <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Action</th>
                </tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-700/30 text-xs md:text-sm">
                      <td className="px-2 md:px-4 py-2 truncate max-w-[150px]">{u.email || u.username}</td>
                      <td className="px-2 md:px-4 py-2 hidden md:table-cell">{u.role || "user"}</td>
                      <td className="px-2 md:px-4 py-2 hidden md:table-cell">{new Date(u.date_joined).toLocaleDateString()}</td>
                      <td className="px-2 md:px-4 py-2"><button onClick={() => deleteUser(u.id)} className="text-red-400 hover:text-red-600 text-xs md:text-sm">Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "manageUploads" && (
          <section className="bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl p-4 md:p-6 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
              <h3 className="text-lg md:text-xl font-semibold">Manage Uploads</h3>
              <button onClick={() => setIsUploadModalOpen(true)} className="w-full md:w-auto px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg flex items-center justify-center gap-2 text-sm">
                <FaUpload /> Upload Resource
              </button>
            </div>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-gray-700">
                  <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Title</th>
                  <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Type</th>
                  <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Price</th>
                  <th className="px-2 md:px-4 py-2 text-xs md:text-sm">Actions</th>
                </tr></thead>
                <tbody>
                  {allUploads.map((resource) => (
                    <tr key={`${resource.type}-${resource.id}`} className="border-b border-gray-800 hover:bg-gray-700/30 text-xs md:text-sm">
                      <td className="px-2 md:px-4 py-2 truncate max-w-[150px]">{resource.title || resource.headline || "Untitled"}</td>
                      <td className="px-2 md:px-4 py-2">{resource.type}</td>
                      <td className="px-2 md:px-4 py-2">KSh {parseFloat(resource.price || 0).toFixed(0)}</td>
                      <td className="px-2 md:px-4 py-2">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditModal(resource)} className="text-blue-400 hover:text-blue-600" title="Edit"><FaEdit size={14} /></button>
                          <button onClick={() => deleteResource(resource)} className="text-red-400 hover:text-red-600" title="Delete"><FaTrash size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "newsComposer" && (
          <section className="bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl p-4 md:p-6 shadow-xl">
            <h3 className="text-lg md:text-xl font-semibold mb-4">Post News</h3>
            <form onSubmit={handlePostNews} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Headline *</label>
                <input type="text" value={newsHeadline} onChange={(e) => setNewsHeadline(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 md:px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" placeholder="Breaking: New policy announced..." required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Body *</label>
                <textarea value={newsBody} onChange={(e) => setNewsBody(e.target.value)} rows={6} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 md:px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 resize-none" placeholder="Write the full news article here..." required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Category</label>
                  <select value={newsCategory} onChange={(e) => setNewsCategory(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 md:px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500">
                    <option value="">Select category (optional)</option>
                    {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Featured Image</label>
                  <input type="file" onChange={(e) => setNewsImage(e.target.files[0])} accept="image/*" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 md:px-4 py-2 text-gray-400 text-sm focus:outline-none focus:border-cyan-500" />
                </div>
              </div>
              <button type="submit" disabled={postingNews} className="w-full md:w-auto px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {postingNews ? "Posting..." : "Post News"}
              </button>
            </form>
            <div className="mt-8">
              <h4 className="text-base md:text-lg font-semibold mb-4">Recent News</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {resources.news.length === 0 ? (
                  <p className="text-gray-500 text-sm">No news posted yet.</p>
                ) : (
                  resources.news.map((news) => (
                    <div key={news.id} className="bg-gray-700/50 p-3 md:p-4 rounded-lg border border-gray-600">
                      <h5 className="font-bold text-white mb-1 text-sm md:text-base">{news.headline}</h5>
                      <p className="text-xs md:text-sm text-gray-300 mb-2 line-clamp-2">{news.body}</p>
                      <span className="text-xs text-gray-500">{new Date(news.published_at).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around bg-gray-900/95 backdrop-blur-md border-t border-gray-700/60 shadow-2xl px-2 py-2 safe-area-bottom">
        {mobileNavItems.map((item, idx) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.label;
          return (
            <button key={idx} onClick={item.onClick} className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all active:scale-90 ${isActive ? "text-white bg-gray-700/70" : "text-gray-400 hover:text-gray-200"}`}>
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

function TabButton({ active, onClick, icon, label, isCollapsed }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 px-3 py-3 rounded-lg transition ${active ? "bg-cyan-500/20 text-cyan-400 shadow-lg" : "text-gray-300 hover:bg-gray-700/50"} ${isCollapsed ? "justify-center" : ""}`}>
      {React.cloneElement(icon, { size: 20 })} <span className={`${isCollapsed ? "hidden" : ""}`}>{label}</span>
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