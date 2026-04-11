// src/pages/UserDashboard.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FileText, BookOpen, FileArchive, Video, User, Download } from "lucide-react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import api, { getCurrentUser, getLibrary } from "../Api";

export default function UserDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [downloads, setDownloads] = useState([]);
  const [dlSearch, setDlSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Profile editing state
const [editingProfile, setEditingProfile] = useState(false);
const [editName, setEditName] = useState("");
const [editEmail, setEditEmail] = useState("");
const [savingProfile, setSavingProfile] = useState(false);
const [profileError, setProfileError] = useState("");
const [profileSuccess, setProfileSuccess] = useState("");

// Password change state
const [currentPassword, setCurrentPassword] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [changingPassword, setChangingPassword] = useState(false);
const [passwordError, setPasswordError] = useState("");
const [passwordSuccess, setPasswordSuccess] = useState("");

  const cards = [
    { title: "Notes", icon: <FileText size={36} />, color: "from-blue-500 to-blue-700", route: "/notes" },
    { title: "Exams", icon: <BookOpen size={36} />, color: "from-purple-500 to-purple-700", route: "/exams" },
    { title: "Past Papers", icon: <FileArchive size={36} />, color: "from-pink-500 to-pink-700", route: "/past-papers" },
    { title: "News", icon: <Video size={36} />, color: "from-green-500 to-green-700", route: "/news" },
  ];

  const cardRefs = useRef(cards.map(() => React.createRef()));
  const particlesInit = async (engine) => { await loadSlim(engine); };

  const handleMouseMove = (e, cardRef) => {
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const rotateX = ((e.clientY - rect.top - rect.height / 2) / rect.height) * 10;
    const rotateY = ((e.clientX - rect.left - rect.width / 2) / rect.width) * 10;
    card.style.transform = `rotateX(${-rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
  };

  const handleMouseLeave = (cardRef) => {
    cardRef.current.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
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

  const handleSaveProfile = async () => {
  setSavingProfile(true);
  setProfileError("");
  setProfileSuccess("");
  try {
    const res = await api.patch("users/me/update/", {
      name: editName,
      email: editEmail,
    });
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
  setPasswordError("");
  setPasswordSuccess("");

  if (!currentPassword || !newPassword || !confirmPassword) {
    setPasswordError("All fields are required.");
    return;
  }
  if (newPassword !== confirmPassword) {
    setPasswordError("New passwords do not match.");
    return;
  }
  if (newPassword.length < 8) {
    setPasswordError("Password must be at least 8 characters.");
    return;
  }

  setChangingPassword(true);
  try {
    await api.post("users/me/change-password/", {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    setPasswordSuccess("Password changed successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordSuccess(""), 3000);
  } catch (err) {
    setPasswordError(err.response?.data?.error || "Failed to change password.");
  } finally {
    setChangingPassword(false);
  }
};

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      await Promise.all([fetchLibrary(), fetchUserInfo()]);
      setLoading(false);
    };
    fetchAllData();
  }, []);

  // Handle navigation state from AppLayout
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      navigate(location.pathname, { replace: true, state: {} });
    }
    if (location.state?.refreshLibrary) {
      fetchLibrary();
      setActiveTab("downloads");
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const handleDownload = async (item) => {
    try {
      const typeMap = { "Note": "notes", "Exam": "exams", "PastPaper": "past-papers" };
      const endpoint = typeMap[item.resource_type] || "notes";

      const toast = document.createElement('div');
      toast.className = 'fixed top-20 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-slide-in';
      toast.innerHTML = '<svg class="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Downloading...';
      document.body.appendChild(toast);

      const response = await api.get(`resources/${endpoint}/${item.resource_id}/download/`, {
        responseType: 'blob',
        timeout: 120000,
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const contentType = response.headers['content-type'];
      let extension = 'pdf';
      if (contentType?.includes('word')) extension = 'docx';
      else if (contentType?.includes('doc')) extension = 'doc';
      link.setAttribute('download', `${item.item}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.remove();

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

  const filteredDownloads = downloads.filter(dl =>
    dl.date?.includes(dlSearch) ||
    dl.item?.toLowerCase().includes(dlSearch.toLowerCase()) ||
    dl.type?.toLowerCase().includes(dlSearch.toLowerCase())
  );

  return (
    <div className="relative min-h-screen text-white bg-gray-900">
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

      <div className="px-4 md:px-6 py-6">

        {activeTab === "dashboard" && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold">
                Welcome back{currentUser ? `, ${currentUser.email?.split("@")[0]}` : ""}! 👋
              </h2>
              <p className="text-slate-400 mt-1 text-sm md:text-base">
                What would you like to study today?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              {cards.map((card, idx) => (
                <div
                  key={idx}
                  ref={cardRefs.current[idx]}
                  className={`bg-gradient-to-br ${card.color} p-6 md:p-10 rounded-2xl shadow-2xl cursor-pointer transform transition duration-300 relative overflow-hidden active:scale-95`}
                  onClick={() => navigate(card.route)}
                  onMouseMove={(e) => handleMouseMove(e, cardRefs.current[idx])}
                  onMouseLeave={() => handleMouseLeave(cardRefs.current[idx])}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-20 transition" />
                  <div className="mb-3 md:mb-4 [&>svg]:w-7 [&>svg]:h-7 md:[&>svg]:w-9 md:[&>svg]:h-9">
                    {card.icon}
                  </div>
                  <h3 className="text-lg md:text-2xl font-semibold">{card.title}</h3>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "credentials" && (
  <div className="max-w-xl mx-auto space-y-4">

    {/* Profile Info */}
    <div className="bg-gray-800 p-5 md:p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <User size={20} /> My Account
      </h2>

      {currentUser ? (
        <div className="space-y-3">
          {/* Editable name */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-slate-400 text-xs mb-1">Full Name</p>
            {editingProfile ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-white font-semibold">{currentUser.name || "Not set"}</p>
            )}
          </div>

          {/* Editable email */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-slate-400 text-xs mb-1">Email</p>
            {editingProfile ? (
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-white font-semibold break-all">{currentUser.email}</p>
            )}
          </div>

          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-slate-400 text-xs mb-1">Role</p>
            <p className="text-white font-semibold capitalize">{currentUser.role || "User"}</p>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-slate-400 text-xs mb-1">Member Since</p>
            <p className="text-white font-semibold">
              {currentUser.date_joined ? new Date(currentUser.date_joined).toLocaleDateString() : "N/A"}
            </p>
          </div>

          {/* Edit / Save buttons */}
          {editingProfile ? (
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="flex-1 bg-blue-600 hover:bg-blue-500 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50"
              >
                {savingProfile ? "Saving…" : "Save Changes"}
              </button>
              <button
                onClick={() => { setEditingProfile(false); setProfileError(""); }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-2.5 rounded-lg text-sm font-semibold transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setEditingProfile(true); setEditName(currentUser.name || ""); setEditEmail(currentUser.email || ""); }}
              className="w-full bg-gray-700 hover:bg-gray-600 py-2.5 rounded-lg text-sm font-semibold transition"
            >
              ✏️ Edit Profile
            </button>
          )}

          {profileError && <p className="text-red-400 text-xs mt-1">{profileError}</p>}
          {profileSuccess && <p className="text-green-400 text-xs mt-1">{profileSuccess}</p>}
        </div>
      ) : (
        <p className="text-slate-400">Loading user info...</p>
      )}
    </div>

    {/* Change Password */}
    <div className="bg-gray-800 p-5 md:p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">🔒 Change Password</h2>
      <div className="space-y-3">
        <input
          type="password"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full bg-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
        />
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full bg-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full bg-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
        />
        {passwordError && <p className="text-red-400 text-xs">{passwordError}</p>}
        {passwordSuccess && <p className="text-green-400 text-xs">{passwordSuccess}</p>}
        <button
          onClick={handleChangePassword}
          disabled={changingPassword}
          className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50"
        >
          {changingPassword ? "Changing…" : "Change Password"}
        </button>
      </div>
    </div>

  </div>
)}

        {activeTab === "downloads" && (
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

      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slideIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}