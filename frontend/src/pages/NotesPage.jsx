// src/pages/NotesPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import {
  ArrowLeft, Search, X, Download, FileText, ChevronRight,
  Loader2, BookOpen, CreditCard, Smartphone,
} from "lucide-react";
import { getNotes, walletPurchase, initiateOneTimePurchase } from "../Api";
import api from "../Api"; // still needed for the download blob request

const GRADS = [
  "from-cyan-600/80 to-blue-700/90",
  "from-blue-600/80 to-indigo-700/90",
  "from-teal-600/80 to-emerald-700/90",
  "from-sky-600/80 to-blue-800/90",
];

const getExtensionFromContentType = (contentType, filename) => {
  if (!contentType) {
    const ext = filename?.split('.').pop();
    return ext && ext.length <= 5 ? `.${ext}` : '.pdf';
  }
  if (contentType.includes('pdf')) return '.pdf';
  if (contentType.includes('spreadsheetml') || contentType.includes('excel')) return '.xlsx';
  if (contentType.includes('ms-excel')) return '.xls';
  if (contentType.includes('csv')) return '.csv';
  if (contentType.includes('wordprocessingml') || contentType.includes('msword')) return '.docx';
  if (contentType.includes('presentationml') || contentType.includes('powerpoint')) return '.pptx';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';
  if (contentType.includes('png')) return '.png';
  return '.pdf';
};

export default function NotesPage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [curriculum, setCurriculum] = useState(null);
  const [grade, setGrade] = useState(null);
  const [subject, setSubject] = useState(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);

  // Separate loading states for each payment method
  const [payingWallet, setPayingWallet] = useState(false);
  const [payingPesapal, setPayingPesapal] = useState(false);

  const refs = useRef({});
  const getRef = (k) => {
    if (!refs.current[k]) refs.current[k] = React.createRef();
    return refs.current[k];
  };

  const handleMouseMove = (e, r) => {
    if (!r.current) return;
    const rect = r.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rx = ((y - rect.height / 2) / rect.height) * 12;
    const ry = ((x - rect.width / 2) / rect.width) * -12;
    r.current.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02,1.02,1.02)`;
  };
  const handleMouseLeave = (r) => {
    if (r.current)
      r.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
  };

  const particlesInit = async (e) => { await loadSlim(e); };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getNotes();
        setNotes(res.data || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  const { curricula, grades, subjects, items } = useMemo(() => {
    let filtered = notes;
    if (curriculum) filtered = filtered.filter((n) => n.curriculum === curriculum);
    if (grade) filtered = filtered.filter((n) => n.grade === grade);
    if (subject) filtered = filtered.filter((n) => n.subject === subject);
    const curricula = [...new Set(notes.map((n) => n.curriculum).filter(Boolean))].sort();
    const grades = [...new Set(notes.filter((n) => !curriculum || n.curriculum === curriculum).map((n) => n.grade).filter(Boolean))].sort();
    const subjects = [...new Set(notes.filter((n) => (!curriculum || n.curriculum === curriculum) && (!grade || n.grade === grade)).map((n) => n.subject).filter(Boolean))].sort();
    return { curricula, grades, subjects, items: filtered };
  }, [notes, curriculum, grade, subject]);

  const step = subject ? 3 : grade ? 2 : curriculum ? 1 : 0;
  const options = useMemo(() => {
    const q = search.toLowerCase();
    if (step === 0) return curricula.filter((c) => c.toLowerCase().includes(q));
    if (step === 1) return grades.filter((g) => g.toLowerCase().includes(q));
    if (step === 2) return subjects.filter((s) => s.toLowerCase().includes(q));
    return items.filter((n) => n.title?.toLowerCase().includes(q));
  }, [step, curricula, grades, subjects, items, search]);

  const pick = (val) => {
    setSearch("");
    if (step === 0) setCurriculum(val);
    else if (step === 1) setGrade(val);
    else if (step === 2) setSubject(val);
  };

  const breadcrumbs = [
    curriculum && { label: curriculum, clear: () => { setCurriculum(null); setGrade(null); setSubject(null); } },
    grade && { label: grade, clear: () => { setGrade(null); setSubject(null); } },
    subject && { label: subject, clear: () => setSubject(null) },
  ].filter(Boolean);

  const stepLabel = ["Select Curriculum", "Select Grade", "Select Subject", `Study Notes: ${subject}`][step];

  const handleDownload = async (item) => {
  try {
    const response = await api.get(`resources/notes/${item.id}/download/`, { 
      responseType: "blob",
      timeout: 120000,
    });
    const contentType = response.headers["content-type"];
    const extension = getExtensionFromContentType(contentType, item.title);
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${item.title || "note"}${extension}`); // ✅
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) { console.error(err); }
};

  // ─── Pay with wallet balance ──────────────────────────────────────────────
  const payWithWallet = async () => {
    setPayingWallet(true);
    try {
      await walletPurchase({ resource_id: modal.item.id, resource_type: "Note" });
      const item = modal.item;
      setModal(null);
      await handleDownload(item);
    } catch (e) {
      alert(e.response?.data?.error || "Wallet payment failed.");
    } finally {
      setPayingWallet(false);
    }
  };

  // ─── Pay directly via Pesapal (no wallet top-up needed) ───────────────────
  const payWithPesapal = async () => {
    setPayingPesapal(true);
    try {
      const res = await initiateOneTimePurchase({ resource_id: modal.item.id, resource_type: "Note" });
      window.location.href = res.data.redirect_url;
    } catch (e) {
      alert(e.response?.data?.error || "Could not initiate payment.");
      setPayingPesapal(false);
    }
  };

  const isPaying = payingWallet || payingPesapal;

  return (
    <div className="relative min-h-screen text-slate-100 bg-[#0f172a]">
      <Particles
        id="notes-particles"
        init={particlesInit}
        className="absolute inset-0 -z-10"
        options={{
          background: { color: "transparent" },
          fpsLimit: 60,
          particles: {
            number: { value: 45 },
            color: { value: "#38bdf8" },
            opacity: { value: 0.15 },
            size: { value: { min: 1, max: 3 } },
            move: { enable: true, speed: 0.6 },
          },
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold tracking-widest text-xs uppercase mb-2">
              <BookOpen size={14} /> Knowledge Base
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">{stepLabel}</h1>
          </div>
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search notes..."
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-cyan-500/50 text-white placeholder-slate-500 outline-none transition-all backdrop-blur-md"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 mb-8 flex-wrap animate-in fade-in duration-500">
            <button onClick={() => { setCurriculum(null); setGrade(null); setSubject(null); }} className="p-2.5 bg-slate-800/50 rounded-xl text-slate-400 hover:text-white transition-all">
              <ArrowLeft size={16} />
            </button>
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={b.label}>
                <button onClick={b.clear} className="text-sm px-4 py-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all font-semibold">
                  {b.label}
                </button>
                {i < breadcrumbs.length - 1 && <ChevronRight size={14} className="text-slate-600" />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="animate-spin text-cyan-500 mb-4" size={40} />
            <p className="text-slate-400">Loading library...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {options.map((opt, i) => {
              const isItem = step === 3;
              const r = getRef(`${step}-${i}`);
              const isFree = isItem && parseFloat(opt.price || 0) === 0;
              return (
                <div
                  key={isItem ? opt.id : opt}
                  ref={r}
                  className={`relative group bg-gradient-to-br ${GRADS[i % GRADS.length]} p-8 rounded-[2rem] shadow-xl transition-all duration-300 ease-out cursor-pointer overflow-hidden border border-white/10 flex flex-col min-h-[170px] active:scale-95`}
                  onClick={isItem ? undefined : () => pick(opt)}
                  onMouseMove={(e) => handleMouseMove(e, r)}
                  onMouseLeave={() => handleMouseLeave(r)}
                >
                  <div className="absolute top-4 right-4 text-white/20 group-hover:text-white/40 transition-all duration-500">
                    <FileText size={isItem ? 32 : 48} />
                  </div>
                  {isFree && (
                    <span className="absolute top-6 left-6 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/20">
                      Free
                    </span>
                  )}
                  <div className="mt-auto">
                    <h3 className={`font-extrabold text-white leading-tight ${isItem ? "text-lg mb-4" : "text-2xl"}`}>
                      {isItem ? opt.title : opt}
                    </h3>
                    {isItem && (
                      <button
                        onClick={() => isFree ? handleDownload(opt) : setModal({ item: opt })}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-xs font-bold text-white transition-all backdrop-blur-md"
                      >
                        <Download size={14} /> {isFree ? "Download" : `Buy · KSh ${opt.price}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Purchase Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => !isPaying && setModal(null)}>
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
          <div
            className="relative bg-[#1e293b] border border-slate-700 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 px-8 py-8 border-b border-slate-700/50">
              <div className="flex justify-between items-center mb-4">
                <div className="p-3 bg-cyan-500/20 rounded-2xl text-cyan-400"><FileText /></div>
                <button onClick={() => !isPaying && setModal(null)} className="text-slate-500 hover:text-white transition-all">
                  <X size={20} />
                </button>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Confirm Purchase</p>
              <h3 className="text-2xl font-bold text-white leading-tight">{modal.item.title}</h3>
              <p className="text-slate-400 text-xs mt-1">{modal.item.subject} · {modal.item.grade}</p>
            </div>

            <div className="p-8">
              {/* Price */}
              <div className="flex items-center justify-between mb-6 p-4 bg-slate-900/50 rounded-2xl border border-slate-700/50">
                <span className="text-slate-400 font-medium">Total</span>
                <span className="text-3xl font-black text-white">KSh {parseFloat(modal.item.price).toFixed(2)}</span>
              </div>

              {/* Payment options */}
              <div className="space-y-3">
                {/* Wallet */}
                <button
                  onClick={payWithWallet}
                  disabled={isPaying}
                  className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded-2xl font-bold transition-all shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-3"
                >
                  {payingWallet
                    ? <><Loader2 className="animate-spin" size={18} /> Processing...</>
                    : <><CreditCard size={18} /> Pay with Wallet</>}
                </button>

                {/* Pesapal direct */}
                <button
                  onClick={payWithPesapal}
                  disabled={isPaying}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-600 hover:border-cyan-500/40 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 text-slate-200"
                >
                  {payingPesapal
                    ? <><Loader2 className="animate-spin" size={18} /> Redirecting...</>
                    : <><Smartphone size={18} /> Pay with M-Pesa / Card</>}
                </button>
              </div>

              <p className="text-center text-slate-500 text-[10px] mt-5 px-4 leading-relaxed">
                Wallet deducts instantly. M-Pesa/Card redirects to Pesapal checkout — resource unlocks on confirmation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}