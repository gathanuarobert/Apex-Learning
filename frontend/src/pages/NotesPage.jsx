// src/pages/Notes.jsx
import React, { useEffect, useMemo, useState } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import notesData from "./notesData";
import { ArrowLeft, Wallet, Download, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getNotes,
  walletPurchase,
  initiateOneTimePurchase,
  mpesaCallback,
  initiateMpesaPayment, // <-- integrated
} from "../Api";

export default function Notes() {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentModal, setPaymentModal] = useState(null);
  const [walletPhone, setWalletPhone] = useState("");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const navigate = useNavigate();

  // ---------------- PRICING ----------------
  const PRICING = {
    perSubjectPerGrade: 20,
    topicalPerSubject: 150,
    allSubjectsPerGrade: 250,
    fullGrade: 1000,
  };

  // ---------------- PARTICLES ----------------
  const particlesInit = async (engine) => {
    await loadSlim(engine);
  };

  // ---------------- FILTERED DATA ----------------
  const filteredLevels = useMemo(() => {
    if (!searchQuery) return Object.keys(notesData);
    return Object.keys(notesData).filter((level) =>
      level.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const filteredSubjects = useMemo(() => {
    if (!selectedLevel) return [];
    if (!searchQuery) return Object.keys(notesData[selectedLevel]);
    return Object.keys(notesData[selectedLevel]).filter((subject) =>
      subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [selectedLevel, searchQuery]);

  const filteredTopics = useMemo(() => {
    if (!selectedLevel || !selectedSubject) return [];
    if (!searchQuery) return notesData[selectedLevel][selectedSubject];
    return notesData[selectedLevel][selectedSubject].filter((topic) =>
      topic.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [selectedLevel, selectedSubject, searchQuery]);

  // ---------------- PAYMENT + DOWNLOAD ----------------
  const downloadNote = (fileName) => {
    const blob = new Blob(
      ["This is a placeholder for: " + fileName],
      { type: "application/pdf" }
    );
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName + ".pdf";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const payWithWallet = async (amount, fileName, meta = {}) => {
    try {
      await walletPurchase({
        amount,
        description: "Purchase Notes",
        phone: walletPhone,
      });
      alert("Wallet payment successful!");
      downloadNote(fileName);
    } catch (err) {
      console.error(err);
      alert("Wallet payment failed.");
    }
  };

  const payViaMpesa = async (amount, fileName, meta = {}) => {
    try {
      // Use the unified M-Pesa STK Push function
      await initiateMpesaPayment(mpesaPhone, amount, fileName);
      alert("M-Pesa payment successful!");
      downloadNote(fileName);
    } catch (err) {
      console.error(err);
      alert("M-Pesa payment failed.");
    }
  };

  // ---------------- RENDER ----------------
  return (
    <div className="relative w-full h-screen text-white overflow-y-auto">
      {/* Background Particles */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          background: { color: "#0f172a" },
          fpsLimit: 120,
          interactivity: {
            events: { onClick: { enable: true, mode: "push" }, resize: true },
          },
          particles: {
            color: { value: "#ffffff" },
            move: { enable: true, speed: 1 },
            number: { value: 60 },
            opacity: { value: 0.3 },
            shape: { type: "circle" },
            size: { value: { min: 1, max: 3 } },
          },
        }}
      />

      {/* Header */}
      <div className="absolute top-4 left-4 flex items-center gap-3">
        <button
          onClick={() => {
            if (selectedSubject) setSelectedSubject(null);
            else if (selectedLevel) setSelectedLevel(null);
            else navigate(-1);
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <input
          type="text"
          placeholder="Search..."
          className="px-3 py-2 rounded-lg bg-gray-800 focus:outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Levels */}
      {!selectedLevel && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 px-6">
          {filteredLevels.map((level, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-gray-900 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setSelectedLevel(level)}
            >
              <h2 className="text-xl font-bold">{level}</h2>
            </div>
          ))}
        </div>
      )}

      {/* Subjects */}
      {selectedLevel && !selectedSubject && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 px-6">
          {filteredSubjects.map((subject, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-gray-900 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setSelectedSubject(subject)}
            >
              <h2 className="text-xl font-bold">{subject}</h2>
            </div>
          ))}
        </div>
      )}

      {/* Topics */}
      {selectedSubject && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20 px-6">
          {filteredTopics.map((topic, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-gray-900 flex flex-col gap-3"
            >
              <h2 className="text-lg font-bold">{topic}</h2>
              <button
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                onClick={() =>
                  setPaymentModal({
                    title: topic,
                    meta: { subject: selectedSubject, level: selectedLevel },
                  })
                }
              >
                <Download size={18} /> Download
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gray-900 p-6 rounded-2xl max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2"
              onClick={() => setPaymentModal(null)}
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-4">
              Choose Payment Method for "{paymentModal.title}"
            </h2>

            <div className="space-y-4">
              {/* Wallet Options */}
              <button
                onClick={() =>
                  payWithWallet(
                    PRICING.perSubjectPerGrade,
                    paymentModal.title,
                    paymentModal.meta
                  )
                }
                className="w-full bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded-lg"
              >
                Wallet – Per Subject (KES {PRICING.perSubjectPerGrade})
              </button>
              <button
                onClick={() =>
                  payWithWallet(
                    PRICING.topicalPerSubject,
                    `${paymentModal.meta.subject} – Topical Bundle`,
                    paymentModal.meta
                  )
                }
                className="w-full bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded-lg"
              >
                Wallet – Topical per Subject (KES {PRICING.topicalPerSubject})
              </button>
              <button
                onClick={() =>
                  payWithWallet(
                    PRICING.allSubjectsPerGrade,
                    `${paymentModal.meta.level} – All Subjects Bundle`,
                    paymentModal.meta
                  )
                }
                className="w-full bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded-lg"
              >
                Wallet – All Subjects (KES {PRICING.allSubjectsPerGrade})
              </button>
              <button
                onClick={() =>
                  payWithWallet(
                    PRICING.fullGrade,
                    `${paymentModal.meta.level} – Full Grade Bundle`,
                    paymentModal.meta
                  )
                }
                className="w-full bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded-lg"
              >
                Wallet – Full Grade (KES {PRICING.fullGrade})
              </button>

              {/* M-Pesa Options */}
              <input
                type="text"
                placeholder="M-Pesa Phone (2547XXXXXXXX)"
                className="w-full mb-2 px-3 py-2 rounded bg-gray-800 focus:outline-none"
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
              />

              <button
                onClick={() =>
                  payViaMpesa(
                    PRICING.perSubjectPerGrade,
                    paymentModal.title,
                    paymentModal.meta
                  )
                }
                className="w-full bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg"
              >
                M-Pesa – Per Subject (KES {PRICING.perSubjectPerGrade})
              </button>
              <button
                onClick={() =>
                  payViaMpesa(
                    PRICING.topicalPerSubject,
                    `${paymentModal.meta.subject} – Topical Bundle`,
                    paymentModal.meta
                  )
                }
                className="w-full bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg"
              >
                M-Pesa – Topical per Subject (KES {PRICING.topicalPerSubject})
              </button>
              <button
                onClick={() =>
                  payViaMpesa(
                    PRICING.allSubjectsPerGrade,
                    `${paymentModal.meta.level} – All Subjects Bundle`,
                    paymentModal.meta
                  )
                }
                className="w-full bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg"
              >
                M-Pesa – All Subjects (KES {PRICING.allSubjectsPerGrade})
              </button>
              <button
                onClick={() =>
                  payViaMpesa(
                    PRICING.fullGrade,
                    `${paymentModal.meta.level} – Full Grade Bundle`,
                    paymentModal.meta
                  )
                }
                className="w-full bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg"
              >
                M-Pesa – Full Grade (KES {PRICING.fullGrade})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
