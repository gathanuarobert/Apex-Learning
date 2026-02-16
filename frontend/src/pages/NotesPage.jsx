// src/pages/NotesPage.jsx
import React, { useEffect, useState } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { ArrowLeft, Download, Search, X, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../Api";

export default function NotesPage() {
  const navigate = useNavigate();
  
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentModal, setPaymentModal] = useState(null);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);

  // Fetch notes from backend
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const [notesRes, walletRes] = await Promise.all([
          api.get("resources/notes/"),
          api.get("payments/wallet/").catch(() => ({ data: { balance: 0 } }))
        ]);
        setNotes(notesRes.data || []);
        setWalletBalance(walletRes.data?.balance || 0);
      } catch (error) {
        console.error("Error fetching notes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  // Filter notes based on search
  const filteredNotes = notes.filter(note =>
    note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Payment handlers
  const handleWalletPurchase = async (note) => {
    if (walletBalance < parseFloat(note.price)) {
      alert("Insufficient wallet balance. Please top up your wallet.");
      return;
    }

    try {
      const response = await api.post("payments/wallet/purchase/", {
        resource_type: "note",
        resource_id: note.id
      });

      if (response.data.success) {
        alert("Purchase successful!");
        setWalletBalance(prev => prev - parseFloat(note.price));
        handleDownload(note);
        setPaymentModal(null);
      }
    } catch (error) {
      console.error("Wallet purchase error:", error);
      alert(error.response?.data?.error || "Purchase failed. Please try again.");
    }
  };

  const handleMpesaPurchase = async (note) => {
    if (!mpesaPhone) {
      alert("Please enter your M-Pesa phone number.");
      return;
    }

    try {
      const response = await api.post("payments/purchase/resource/initiate/", {
        resource_type: "note",
        resource_id: note.id,
        phone_number: mpesaPhone
      });

      alert("M-Pesa STK Push sent! Please complete payment on your phone.");
      setPaymentModal(null);
    } catch (error) {
      console.error("M-Pesa purchase error:", error);
      alert(error.response?.data?.error || "Payment initiation failed. Please try again.");
    }
  };

  const handleDownload = async (note) => {
    try {
      const response = await api.get(`resources/notes/${note.id}/download/`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${note.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert(error.response?.data?.detail || "Download failed. Please try again.");
    }
  };

  const particlesInit = async (engine) => {
    await loadSlim(engine);
  };

  return (
    <div className="relative w-full min-h-screen text-white overflow-y-auto bg-slate-950">
      {/* Background Particles */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        className="absolute inset-0 -z-10"
        options={{
          background: { color: "#0f172a" },
          fpsLimit: 120,
          particles: {
            color: { value: "#ffffff" },
            move: { enable: true, speed: 1 },
            number: { value: 60 },
            opacity: { value: 0.3 },
            size: { value: { min: 1, max: 3 } },
          },
        }}
      />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => navigate("/user-dashboard")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft size={18} /> Back
            </button>

            <div className="flex-1 max-w-md">
              <div className="flex items-center gap-3 bg-slate-800 rounded-lg px-4 py-2">
                <Search size={18} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  className="w-full bg-transparent focus:outline-none text-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={() => navigate("/wallet")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-black font-semibold transition-colors"
            >
              <Wallet size={18} /> KSh {walletBalance.toFixed(2)}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Available Notes</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            <p className="mt-4 text-slate-400">Loading notes...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">
              {searchQuery ? "No notes found matching your search." : "No notes available yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-cyan-500 transition-all hover:shadow-lg hover:shadow-cyan-500/20"
              >
                <h2 className="text-xl font-bold mb-2 text-cyan-400">{note.title}</h2>
                <p className="text-slate-400 text-sm mb-4 line-clamp-3">{note.content}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-yellow-400">
                    KSh {parseFloat(note.price || 0).toFixed(2)}
                  </span>
                  {parseFloat(note.price) === 0 && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">FREE</span>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (parseFloat(note.price) === 0) {
                      handleDownload(note);
                    } else {
                      setPaymentModal(note);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors font-semibold"
                >
                  <Download size={18} />
                  {parseFloat(note.price) === 0 ? "Download Free" : "Purchase & Download"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Purchase Note</h2>
              <button onClick={() => setPaymentModal(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-cyan-400">{paymentModal.title}</h3>
              <p className="text-2xl font-bold text-yellow-400 mt-2">
                KSh {parseFloat(paymentModal.price).toFixed(2)}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleWalletPurchase(paymentModal)}
                className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                Pay with Wallet (KSh {walletBalance.toFixed(2)})
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-900 text-slate-400">OR</span>
                </div>
              </div>

              <input
                type="tel"
                placeholder="M-Pesa Phone (254XXXXXXXXX)"
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-cyan-500 focus:outline-none"
              />

              <button
                onClick={() => handleMpesaPurchase(paymentModal)}
                className="w-full bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                Pay with M-Pesa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}