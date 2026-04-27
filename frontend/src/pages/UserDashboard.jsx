// src/pages/UserDashboard.jsx
// CHANGES: Added GlobalSearchBar at the top of the dashboard (both guest + authenticated views)
// It searches across ALL resources without requiring navigation into any category first.

import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FileText, BookOpen, FileArchive, Video, User,
  Download, Lock, ShieldCheck, Eye, EyeOff,
} from "lucide-react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import api, { getCurrentUser, getLibrary } from "../Api";
import { useAuth } from "../hooks/useAuth";
import GlobalSearchBar from "../components/GlobalSearchBar"; // ← NEW

const getExtensionFromContentType = (contentType, filename) => {
  if (!contentType) {
    const ext = filename?.split(".").pop();
    return ext && ext.length <= 5 ? `.${ext}` : ".pdf";
  }
  if (contentType.includes("pdf"))                                              return ".pdf";
  if (contentType.includes("spreadsheetml") || contentType.includes("excel"))  return ".xlsx";
  if (contentType.includes("ms-excel"))                                         return ".xls";
  if (contentType.includes("csv"))                                              return ".csv";
  if (contentType.includes("wordprocessingml") || contentType.includes("msword")) return ".docx";
  if (contentType.includes("presentationml") || contentType.includes("powerpoint")) return ".pptx";
  if (contentType.includes("jpeg") || contentType.includes("jpg"))             return ".jpg";
  if (contentType.includes("png"))                                              return ".png";
  return ".pdf";
};

export default function UserDashboard({ openAuthModal }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { isGuest, user: authUser, isLoading } = useAuth();

  const [currentUser, setCurrentUser] = useState(null);
  const [downloads, setDownloads]     = useState([]);
  const [dlSearch, setDlSearch]       = useState("");
  const [loading, setLoading]         = useState(true);

  const currentTab = new URLSearchParams(location.search).get("tab");
  const activeTab  = currentTab || "dashboard";

  const [editingProfile, setEditingProfile]   = useState(false);
  const [editName, setEditName]               = useState("");
  const [editEmail, setEditEmail]             = useState("");
  const [savingProfile, setSavingProfile]     = useState(false);
  const [profileError, setProfileError]       = useState("");
  const [profileSuccess, setProfileSuccess]   = useState("");

  const [currentPassword, setCurrentPassword]   = useState("");
  const [newPassword, setNewPassword]           = useState("");
  const [confirmPassword, setConfirmPassword]   = useState("");
  const [showCurrentPw, setShowCurrentPw]       = useState(false);
  const [showNewPw, setShowNewPw]               = useState(false);
  const [showConfirmPw, setShowConfirmPw]       = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError]       = useState("");
  const [passwordSuccess, setPasswordSuccess]   = useState("");

  const cards = [
    { title: "Notes",       icon: <FileText />,    color: "from-blue-600/80 to-blue-800/90",       route: "/notes" },
    { title: "Exams",       icon: <BookOpen />,    color: "from-purple-600/80 to-purple-800/90",   route: "/exams" },
    { title: "Past Papers", icon: <FileArchive />, color: "from-pink-600/80 to-pink-800/90",       route: "/past-papers" },
    { title: "News",        icon: <Video />,       color: "from-emerald-600/80 to-emerald-800/90", route: "/news" },
  ];

  const cardRefs      = useRef(cards.map(() => React.createRef()));
  const particlesInit = async (engine) => { await loadSlim(engine); };

  const handleMouseMove = (e, cardRef) => {
    const card = cardRef.current;
    if (!card) return;
    const rect    = card.getBoundingClientRect();
    const x       = e.clientX - rect.left;
    const y       = e.clientY - rect.top;
    const rotateX = ((y - rect.height / 2) / rect.height) * 12;
    const rotateY = ((x - rect.width  / 2) / rect.width)  * -12;
    card.style.transform  = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    card.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.15) 0%, transparent 80%)`;
  };

  const handleMouseLeave = (cardRef) => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform  = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    card.style.background = "";
  };

  const fetchLibrary = async () => {
    if (isGuest) { setDownloads([]); return; }
    try {
      const res    = await getLibrary();
      const mapped = (res.data || [])
        .filter((item) => {
          const title     = item.title || "";
          const isDeleted = !item.resource_id || title === "" ||
            title.toLowerCase() === "resource deleted" ||
            title.toLowerCase() === "deleted" ||
            title.toLowerCase() === "unknown resource";
          return !isDeleted;
        })
        .map((item) => ({
          id:            item.transaction_id,
          date:          new Date(item.purchased_on).toLocaleDateString(),
          item:          item.title,
          type:          item.resource_type || "Resource",
          download_url:  item.download_url,
          resource_id:   item.resource_id,
          resource_type: item.resource_type,
        }));
      setDownloads(mapped);
    } catch (err) {
      console.error("Failed to fetch library:", err);
      setDownloads([]);
    }
  };

  const fetchUserInfo = async () => {
    if (isGuest) { setCurrentUser(null); return; }
    try {
      const res = await getCurrentUser();
      setCurrentUser(res.data);
    } catch (err) {
      console.error("Failed to fetch user info:", err);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileError(""); setProfileSuccess("");
    try {
      const res = await api.patch("users/me/update/", { name: editName, email: editEmail });
      setCurrentUser(res.data);
      setEditingProfile(false);
      setProfileSuccess("Profile updated successfully!");
      setTimeout(() => setProfileSuccess(""), 3000);
    } catch (err) {
      setProfileError(err.response?.data?.error || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(""); setPasswordSuccess("");
    if (!currentPassword || !newPassword || !confirmPassword) { setPasswordError("All fields are required."); return; }
    if (newPassword !== confirmPassword) { setPasswordError("New passwords do not match."); return; }
    if (newPassword.length < 8) { setPasswordError("Password must be at least 8 characters."); return; }
    setChangingPassword(true);
    try {
      await api.post("users/me/change-password/", { current_password: currentPassword, new_password: newPassword, confirm_password: confirmPassword });
      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setShowCurrentPw(false); setShowNewPw(false); setShowConfirmPw(false);
      setTimeout(() => setPasswordSuccess(""), 3000);
    } catch (err) {
      setPasswordError(err.response?.data?.error || "Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;
    const fetchAllData = async () => {
      setLoading(true);
      await Promise.all([fetchLibrary(), fetchUserInfo()]);
      setLoading(false);
    };
    fetchAllData();
  }, [isGuest, isLoading]);

  useEffect(() => {
    if (location.state?.refreshLibrary) {
      fetchLibrary();
      navigate(location.pathname + "?tab=downloads", { replace: true, state: {} });
    }
  }, [location.state]);

  const handleDownload = async (item) => {
    if (isGuest) { openAuthModal?.(); return; }
    try {
      const typeMap  = { Note: "notes", Exam: "exams", PastPaper: "past-papers" };
      const endpoint = typeMap[item.resource_type] || "notes";

      const toast = document.createElement("div");
      toast.className = "fixed top-20 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-slide-in";
      toast.innerHTML = "...Downloading...";
      document.body.appendChild(toast);

      const response = await api.get(`resources/${endpoint}/${item.resource_id}/download/`, { responseType: "blob", timeout: 120000 });
      const contentType = response.headers["content-type"];
      const extension   = getExtensionFromContentType(contentType, item.item);
      const url  = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `${item.item}${extension}`);
      document.body.appendChild(link);
      link.click(); link.remove();
      window.URL.revokeObjectURL(url);
      toast.remove();

      const successToast = document.createElement("div");
      successToast.className = "fixed top-20 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-slide-in";
      successToast.textContent = "✓ Download complete!";
      document.body.appendChild(successToast);
      setTimeout(() => successToast.remove(), 3000);
    } catch (err) {
      console.error("Download failed:", err);
      document.querySelectorAll(".fixed.top-20.right-4").forEach((el) => el.remove());
      const errorMsg =
        err.response?.status === 402 ? "Payment required for this resource."
        : err.response?.status === 401 ? "Please sign in to download."
        : err.response?.data?.detail   || "Something went wrong.";
      const errorToast = document.createElement("div");
      errorToast.className = "fixed top-20 right-4 bg-rose-600/90 backdrop-blur-md text-white px-5 py-3 rounded-xl shadow-2xl z-50 animate-slide-in border border-rose-400/30";
      errorToast.textContent = `✗ ${errorMsg}`;
      document.body.appendChild(errorToast);
      setTimeout(() => errorToast.remove(), 5000);
    }
  };

  const filteredDownloads = downloads.filter(
    (dl) =>
      dl.date?.includes(dlSearch) ||
      dl.item?.toLowerCase().includes(dlSearch.toLowerCase()) ||
      dl.type?.toLowerCase().includes(dlSearch.toLowerCase()),
  );

  const PasswordField = ({ placeholder, value, onChange, show, onToggle, focusColor = "focus:border-blue-500" }) => (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full bg-slate-900/50 border border-slate-700 ${focusColor} text-white rounded-xl px-4 py-3.5 pr-12 text-sm transition-all outline-none placeholder:text-slate-500`}
      />
      <button type="button" onClick={onToggle} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1" tabIndex={-1}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );

  // ─── Guest dashboard ──────────────────────────────────────────────────────
  const GuestDashboard = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          Welcome, Guest! 👋
        </h2>
        <p className="text-slate-400 mt-2 text-base md:text-lg">
          Browse our resources below. Sign in to download or purchase.
        </p>
      </div>

      {/* ── GLOBAL SEARCH (Guest) ── */}
      <div className="mb-8">
        <GlobalSearchBar
          placeholder="Search notes, exams, past papers…"
          accentColor="focus:border-blue-500/50"
          iconColor="group-focus-within:text-blue-400"
          className="w-full md:max-w-xl"
        />
        <p className="text-slate-600 text-xs mt-2 ml-1">
          Search across all resources without opening any category
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div
            key={idx}
            ref={cardRefs.current[idx]}
            className={`relative group bg-gradient-to-br ${card.color} p-8 rounded-3xl shadow-xl transition-all duration-300 ease-out cursor-pointer overflow-hidden border border-white/10 flex flex-col items-start justify-end min-h-[180px] active:scale-95`}
            onClick={() => navigate(card.route)}
            onMouseMove={(e)  => handleMouseMove(e, cardRefs.current[idx])}
            onMouseLeave={() => handleMouseLeave(cardRefs.current[idx])}
          >
            <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-500 [&>svg]:w-12 [&>svg]:h-12">{card.icon}</div>
            <div className="relative z-10">
              <div className="p-3 bg-white/20 rounded-2xl mb-4 backdrop-blur-md inline-block [&>svg]:w-6 [&>svg]:h-6">{card.icon}</div>
              <h3 className="text-xl font-bold text-white tracking-wide">{card.title}</h3>
              <p className="text-white/70 text-sm mt-1">Browse resources →</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 bg-slate-800/40 border border-slate-700/50 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold text-white">Ready to download?</h3>
          <p className="text-slate-400 text-sm mt-1">Create a free account to access downloads, track your library, and more.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button onClick={() => navigate("/login")}    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all">Sign in</button>
          <button onClick={() => navigate("/register")} className="px-6 py-3 border border-slate-600 hover:border-blue-500/50 text-slate-300 hover:text-white rounded-xl font-bold text-sm transition-all">Create account</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen text-slate-100 bg-[#0f172a] font-sans selection:bg-blue-500/30">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          background: { color: { value: "transparent" } },
          fpsLimit: 60,
          particles: {
            number: { value: 60, density: { enable: true, area: 800 } },
            color:  { value: ["#38bdf8", "#818cf8", "#34d399"] },
            shape:  { type: "circle" },
            opacity: { value: 0.3, random: true },
            size:   { value: { min: 1, max: 4 } },
            move:   { enable: true, speed: 0.8, direction: "none", outModes: "out" },
          },
        }}
        className="absolute inset-0 -z-10 pointer-events-none"
      />

      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

          {isGuest && <GuestDashboard />}

          {/* ── Authenticated: dashboard ── */}
          {!isGuest && activeTab === "dashboard" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                    Welcome back{currentUser ? `, ${currentUser.email?.split("@")[0]}` : ""}! 👋
                  </h2>
                  <p className="text-slate-400 mt-2 text-base md:text-lg">
                    Access your study resources and track your progress.
                  </p>
                </div>

                {/* ── GLOBAL SEARCH (Authenticated) ── */}
                <GlobalSearchBar
                  placeholder="Search all resources…"
                  accentColor="focus:border-blue-500/50"
                  iconColor="group-focus-within:text-blue-400"
                  className="w-full md:w-80"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => (
                  <div
                    key={idx}
                    ref={cardRefs.current[idx]}
                    className={`relative group bg-gradient-to-br ${card.color} p-8 rounded-3xl shadow-xl transition-all duration-300 ease-out cursor-pointer overflow-hidden border border-white/10 flex flex-col items-start justify-end min-h-[180px] active:scale-95`}
                    onClick={() => navigate(card.route)}
                    onMouseMove={(e)  => handleMouseMove(e, cardRefs.current[idx])}
                    onMouseLeave={() => handleMouseLeave(cardRefs.current[idx])}
                  >
                    <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-500 [&>svg]:w-12 [&>svg]:h-12">{card.icon}</div>
                    <div className="relative z-10">
                      <div className="p-3 bg-white/20 rounded-2xl mb-4 backdrop-blur-md inline-block [&>svg]:w-6 [&>svg]:h-6">{card.icon}</div>
                      <h3 className="text-xl font-bold text-white tracking-wide">{card.title}</h3>
                      <p className="text-white/70 text-sm mt-1">Explore resources →</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Authenticated: credentials ── */}
          {!isGuest && activeTab === "credentials" && (
            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-500">
              {/* Profile card */}
              <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-6 md:p-8 rounded-3xl shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-400"><User size={24} /></div>
                  <h2 className="text-2xl font-bold">Profile Details</h2>
                </div>
                {currentUser ? (
                  <div className="space-y-5">
                    <div>
                      <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider ml-1 mb-1.5 block">Full Name</label>
                      {editingProfile
                        ? <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-slate-900/50 border border-slate-600 focus:border-blue-500 text-white rounded-xl px-4 py-3 text-sm transition-all outline-none" />
                        : <div className="bg-slate-900/30 border border-transparent px-4 py-3 rounded-xl text-white font-medium">{currentUser.name || "Not specified"}</div>
                      }
                    </div>
                    <div>
                      <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider ml-1 mb-1.5 block">Email Address</label>
                      {editingProfile
                        ? <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full bg-slate-900/50 border border-slate-600 focus:border-blue-500 text-white rounded-xl px-4 py-3 text-sm transition-all outline-none" />
                        : <div className="bg-slate-900/30 px-4 py-3 rounded-xl text-white font-medium break-all">{currentUser.email}</div>
                      }
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider ml-1 mb-1.5 block">User Role</label>
                        <div className="bg-slate-900/30 px-4 py-3 rounded-xl text-blue-400 font-bold capitalize text-sm inline-flex items-center gap-2"><ShieldCheck size={14} /> {currentUser.role || "Student"}</div>
                      </div>
                      <div>
                        <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider ml-1 mb-1.5 block">Joined</label>
                        <div className="bg-slate-900/30 px-4 py-3 rounded-xl text-slate-300 font-medium text-sm">{currentUser.date_joined ? new Date(currentUser.date_joined).toLocaleDateString() : "---"}</div>
                      </div>
                    </div>
                    <div className="pt-4">
                      {editingProfile ? (
                        <div className="flex gap-3">
                          <button onClick={handleSaveProfile} disabled={savingProfile} className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded-xl text-sm font-bold transition shadow-lg shadow-blue-900/20 disabled:opacity-50">{savingProfile ? "Saving..." : "Update Profile"}</button>
                          <button onClick={() => { setEditingProfile(false); setProfileError(""); }} className="px-6 bg-slate-700 hover:bg-slate-600 py-3 rounded-xl text-sm font-bold transition">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingProfile(true); setEditName(currentUser.name || ""); setEditEmail(currentUser.email || ""); }} className="w-full border border-slate-600 hover:border-blue-500/50 hover:bg-blue-500/5 py-3 rounded-xl text-sm font-bold transition-all text-slate-300 hover:text-white">Edit Profile Information</button>
                      )}
                      {profileError   && <p className="text-rose-400 text-xs mt-3 ml-1">⚠ {profileError}</p>}
                      {profileSuccess && <p className="text-emerald-400 text-xs mt-3 ml-1">✓ {profileSuccess}</p>}
                    </div>
                  </div>
                ) : (
                  <div className="animate-pulse space-y-4">
                    <div className="h-12 bg-slate-700/50 rounded-xl w-full" />
                    <div className="h-12 bg-slate-700/50 rounded-xl w-full" />
                  </div>
                )}
              </div>

              {/* Security card */}
              <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-6 md:p-8 rounded-3xl shadow-2xl flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400"><Lock size={24} /></div>
                  <h2 className="text-2xl font-bold">Security</h2>
                </div>
                <div className="space-y-4 flex-1">
                  <PasswordField placeholder="Current Password"     value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} show={showCurrentPw} onToggle={() => setShowCurrentPw(v => !v)} focusColor="focus:border-amber-500/50" />
                  <PasswordField placeholder="New Password"         value={newPassword}     onChange={(e) => setNewPassword(e.target.value)}     show={showNewPw}     onToggle={() => setShowNewPw(v => !v)} />
                  <PasswordField placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} show={showConfirmPw} onToggle={() => setShowConfirmPw(v => !v)} />
                  {passwordError   && <p className="text-rose-400 text-xs mt-2 ml-1">⚠ {passwordError}</p>}
                  {passwordSuccess && <p className="text-emerald-400 text-xs mt-2 ml-1">✓ {passwordSuccess}</p>}
                </div>
                <button onClick={handleChangePassword} disabled={changingPassword} className="mt-6 w-full bg-white text-slate-900 hover:bg-slate-200 py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-xl">
                  {changingPassword ? "Updating Security..." : "Change Password"}
                </button>
              </div>
            </div>
          )}

          {/* ── Authenticated: library ── */}
          {!isGuest && activeTab === "downloads" && (
            <div className="max-w-4xl mx-auto bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-6 md:p-10 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-500/20 rounded-2xl text-cyan-400"><Download size={28} /></div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">My Library</h2>
                    <p className="text-slate-400 text-sm">Offline access to your materials</p>
                  </div>
                </div>
                <div className="relative group w-full md:w-72">
                  <Download className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                  <input type="text" placeholder="Filter resources..." value={dlSearch} onChange={(e) => setDlSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700 focus:border-cyan-500/50 text-white placeholder-slate-500 text-sm outline-none transition-all shadow-inner" />
                </div>
              </div>

              {filteredDownloads.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/20 rounded-2xl border border-dashed border-slate-700">
                  <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600"><Download size={32} /></div>
                  <p className="text-slate-400 font-medium">No resources found in your library.</p>
                  <button onClick={() => navigate("/notes")} className="text-cyan-400 text-sm mt-2 hover:underline">Browse the shop</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredDownloads.map((dl, idx) => (
                    <div key={idx} className="group bg-slate-900/40 border border-slate-700/50 p-4 rounded-2xl flex justify-between items-center hover:bg-slate-700/40 hover:border-slate-600 transition-all duration-300">
                      <div className="min-w-0 flex items-center gap-4">
                        <div className="p-2.5 bg-slate-800 rounded-lg text-slate-400 group-hover:text-cyan-400 transition-colors">
                          {dl.type === "Note" ? <FileText size={20} /> : <FileArchive size={20} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-200 truncate group-hover:text-white transition-colors">{dl.item}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-500/80 bg-cyan-500/10 px-1.5 py-0.5 rounded">{dl.type}</span>
                            <span className="text-xs text-slate-500 font-medium">{dl.date}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleDownload(dl)} className="ml-4 flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-cyan-900/20 active:scale-95 whitespace-nowrap">
                        <Download size={16} />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
}