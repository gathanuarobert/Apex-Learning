// src/pages/PastPapersPage.jsx
import React, { useEffect, useState } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { ArrowLeft, Download, Search, X, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../Api";

export default function PastPapersPage() {
  const navigate = useNavigate();
  
  const [pastPapers, setPastPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentModal, setPaymentModal] = useState(null);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);

  // Fetch past papers from backend
  useEffect(() => {
    const fetchPastPapers = async () => {
      try {
        const [papersRes, walletRes] = await Promise.all([
          api.get("resources/past-papers/"),
          api.get("payments/wallet/").catch(() => ({ data: { balance: 0 } }))
        ]);
        setPastPapers(papersRes.data || []);
        setWalletBalance(walletRes.data?.balance || 0);
      } catch (error) {
        console.error("Error fetching past papers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPastPapers();
  }, []);

  // Filter past papers based on search
  const filteredPapers = pastPapers.filter(paper =>
    paper.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.year?.toString().includes(searchQuery)
  );

  // Payment handlers
  const handleWalletPurchase = async (paper) => {
    if (walletBalance < parseFloat(paper.price)) {
      alert("Insufficient wallet balance. Please top up your wallet.");
      return;
    }

    try {
      const response = await api.post("payments/wallet/purchase/", {
        resource_type: "pastpaper",
        resource_id: paper.id
      });

      if (response.data.success) {
        alert("Purchase successful!");
        setWalletBalance(prev => prev - parseFloat(paper.price));
        handleDownload(paper);
        setPaymentModal(null);
      }
    } catch (error) {
      console.error("Wallet purchase error:", error);
      alert(error.response?.data?.error || "Purchase failed. Please try again.");
    }
  };

  const handleMpesaPurchase = async (paper) => {
    if (!mpesaPhone) {
      alert("Please enter your M-Pesa phone number.");
      return;
    }

    try {
      const response = await api.post("payments/purchase/resource/initiate/", {
        resource_type: "pastpaper",
        resource_id: paper.id,
        phone_number: mpesaPhone
      });

      alert("M-Pesa STK Push sent! Please complete payment on your phone.");
      setPaymentModal(null);
    } catch (error) {
      console.error("M-Pesa purchase error:", error);
      alert(error.response?.data?.error || "Payment initiation failed. Please try again.");
    }
  };

  const handleDownload = async (paper) => {
    try {
      const response = await api.get(`resources/past-papers/${paper.id}/download/`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${paper.title}_${paper.year}.pdf`);
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
          background: { color: "#0B1220" },
          fpsLimit: 60,
          particles: {
            number: { value: 55 },
            color: { value: ["#FDE047", "#22D3EE", "#A78BFA"] },
            opacity: { value: 0.25 },
            size: { value: { min: 1, max: 3 } },
            move: { enable: true, speed: 0.6 },
            links: { enable: true, distance: 130, opacity: 0.2 },
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
                  placeholder="Search past papers..."
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
        <h1 className="text-3xl font-bold mb-6">Past Papers</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            <p className="mt-4 text-slate-400">Loading past papers...</p>
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">
              {searchQuery ? "No past papers found matching your search." : "No past papers available yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPapers.map((paper) => (
              <div
                key={paper.id}
                className="bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-pink-500 transition-all hover:shadow-lg hover:shadow-pink-500/20"
              >
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-bold text-pink-400 flex-1">{paper.title}</h2>
                  <span className="text-sm font-bold bg-pink-500/20 text-pink-400 px-3 py-1 rounded-full ml-2">
                    {paper.year}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-yellow-400">
                    KSh {parseFloat(paper.price || 0).toFixed(2)}
                  </span>
                  {parseFloat(paper.price) === 0 && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">FREE</span>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (parseFloat(paper.price) === 0) {
                      handleDownload(paper);
                    } else {
                      setPaymentModal(paper);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-pink-600 hover:bg-pink-700 transition-colors font-semibold"
                >
                  <Download size={18} />
                  {parseFloat(paper.price) === 0 ? "Download Free" : "Purchase & Download"}
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
              <h2 className="text-xl font-bold">Purchase Past Paper</h2>
              <button onClick={() => setPaymentModal(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-pink-400">{paymentModal.title}</h3>
              <p className="text-sm text-slate-400 mt-1">Year: {paymentModal.year}</p>
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
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-pink-500 focus:outline-none"
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