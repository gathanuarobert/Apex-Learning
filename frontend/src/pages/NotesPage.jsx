// src/pages/NotesPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { ArrowLeft, Search, X, Download, FileText, ChevronRight, Loader2 } from "lucide-react";
import { getNotes, walletPurchase } from "../Api";
import api from "../Api";

const GRADS = ["from-blue-500 to-blue-700","from-purple-500 to-purple-700","from-pink-500 to-pink-700","from-green-500 to-green-700","from-cyan-500 to-cyan-700","from-orange-500 to-orange-700","from-teal-500 to-teal-700","from-rose-500 to-rose-700","from-indigo-500 to-indigo-700","from-yellow-500 to-yellow-600"];
const grad = (i) => GRADS[i % GRADS.length];

export default function NotesPage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [curriculum, setCurriculum] = useState(null);
  const [grade, setGrade] = useState(null);
  const [subject, setSubject] = useState(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [paying, setPaying] = useState(false);

  const refs = useRef({});
  const getRef = (k) => { if (!refs.current[k]) refs.current[k] = React.createRef(); return refs.current[k]; };
  const tilt = (e, r) => { if (!r.current) return; const rect = r.current.getBoundingClientRect(); const rx = ((e.clientY - rect.top - rect.height / 2) / rect.height) * 10; const ry = ((e.clientX - rect.left - rect.width / 2) / rect.width) * 10; r.current.style.transform = `rotateX(${-rx}deg) rotateY(${ry}deg) scale(1.05)`; };
  const untilt = (r) => { if (r.current) r.current.style.transform = "rotateX(0) rotateY(0) scale(1)"; };
  const particlesInit = async (e) => { await loadSlim(e); };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getNotes();
        setNotes(res.data || []);
      } catch (e) {
        console.error(e);
        setError("Failed to load notes.");
      } finally {
        setLoading(false);
      }
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

  const pick = (val) => { setSearch(""); if (step === 0) setCurriculum(val); else if (step === 1) setGrade(val); else if (step === 2) setSubject(val); };
  const goBack = () => { setSearch(""); if (subject) { setSubject(null); return; } if (grade) { setGrade(null); return; } if (curriculum) { setCurriculum(null); return; } navigate("/user-dashboard"); };
  const breadcrumbs = [curriculum && { label: curriculum, clear: () => { setCurriculum(null); setGrade(null); setSubject(null); } }, grade && { label: grade, clear: () => { setGrade(null); setSubject(null); } }, subject && { label: subject, clear: () => setSubject(null) }].filter(Boolean);
  const stepLabel = ["Select Curriculum", "Select Grade / Level", "Select Subject", subject ? `Notes — ${subject}` : ""][step];

  const showToast = (msg, color = "green") => {
    document.querySelectorAll('.fixed.top-20.right-4').forEach(el => el.remove());
    const toast = document.createElement('div');
    toast.className = `fixed top-20 right-4 bg-${color}-600 text-white px-4 py-3 rounded-lg shadow-lg z-[60] animate-slide-in`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  };

  const handleResourceClick = (item) => {
    const price = parseFloat(item.price || 0);
    if (price === 0) {
      handleDirectDownload(item);
    } else {
      setModal({ item });
    }
  };

  const handleDirectDownload = async (item) => {
    try {
      const toast = document.createElement('div');
      toast.className = 'fixed top-20 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg z-[60] flex items-center gap-2 animate-slide-in';
      toast.innerHTML = '<svg class="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Downloading free resource...';
      document.body.appendChild(toast);
      const response = await api.get(`resources/notes/${item.id}/download/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${item.title || 'note'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.remove();
      showToast('✓ Free download complete!');
    } catch (err) {
      console.error("Download failed:", err);
      showToast(`✗ ${err.response?.data?.detail || "Download failed"}`, "red");
    }
  };

 const payWallet = async () => {
  setPaying(true);
  try {
    await walletPurchase({ resource_id: modal.item.id, resource_type: "Note" });
    const purchasedItem = modal.item;
    setModal(null);
    showToast('✓ Purchase successful! Starting download…');
    await handleDirectDownload(purchasedItem);
  } catch (e) {
    alert(e.response?.data?.error || e.response?.data?.message || "Wallet payment failed.");
  } finally {
    setPaying(false);
  }
};

  const payPesapal = async () => {
    setPaying(true);
    try {
      const res = await api.post("payments/purchase/resource/initiate/", {
        resource_id: modal.item.id,
        resource_type: "Note",
      });
      window.location.href = res.data.redirect_url;
    } catch (e) {
      alert(e.response?.data?.error || "Payment failed.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col text-white bg-gray-900 overflow-x-hidden">
      <Particles id="notes-bg" init={particlesInit} className="absolute inset-0 -z-10" options={{ background: { color: { value: "#0f172a" } }, fpsLimit: 60, particles: { number: { value: 90, density: { enable: true, area: 800 } }, color: { value: ["#38bdf8", "#a78bfa", "#f472b6", "#22c55e"] }, shape: { type: "circle" }, opacity: { value: 0.5 }, size: { value: { min: 3, max: 7 } }, move: { enable: true, speed: 1, outModes: "out", random: true } } }} />
      <div className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50 px-4 py-3 flex items-center gap-3">
        <button onClick={goBack} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-semibold transition-all hover:scale-105 active:scale-95 shrink-0"><ArrowLeft size={15} /> Back</button>
        <div className="flex-1 flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2 border border-gray-700/60 focus-within:border-blue-500/60 transition-colors">
          <Search size={14} className="text-gray-500 shrink-0" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${stepLabel.toLowerCase()}…`} className="w-full bg-transparent outline-none text-sm placeholder-gray-600" />
          {search && <button onClick={() => setSearch("")}><X size={12} className="text-gray-500 hover:text-white" /></button>}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0"><FileText size={13} /> Notes</div>
      </div>
      {breadcrumbs.length > 0 && (
        <div className="px-4 pt-3 flex items-center gap-2 flex-wrap">
          {breadcrumbs.map((b, i) => (<React.Fragment key={b.label}><button onClick={b.clear} className="text-xs px-2.5 py-1 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition">{b.label}</button>{i < breadcrumbs.length - 1 && <ChevronRight size={11} className="text-gray-700" />}</React.Fragment>))}
        </div>
      )}
      <div className="flex-1 px-4 py-6 pb-16">
        {loading && <div className="flex flex-col items-center justify-center py-32 gap-3 text-blue-500"><Loader2 size={32} className="animate-spin" /><p className="text-sm font-medium">Loading notes…</p></div>}
        {!loading && error && <div className="text-center py-24 text-red-400 text-sm">{error}</div>}
        {!loading && !error && notes.length === 0 && <div className="flex flex-col items-center justify-center py-32 gap-3 text-gray-600"><FileText size={48} className="opacity-40" /><p className="text-sm font-medium">No notes uploaded yet.</p></div>}
        {!loading && !error && notes.length > 0 && (
          <>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-5">{stepLabel}</p>
            <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {options.map((opt, i) => {
                const isItem = step === 3;
                const r = getRef(`${step}-${i}-${isItem ? opt.id : opt}`);
                const displayText = isItem ? opt.title : opt;
                const isFree = isItem && parseFloat(opt.price || 0) === 0;
                return (
                  <div key={isItem ? opt.id : opt} ref={r} className={`bg-gradient-to-br ${grad(i)} rounded-2xl shadow-2xl cursor-pointer transform transition duration-500 relative overflow-hidden animate-float ${isItem ? "p-5 flex flex-col gap-3" : "p-8"}`} onClick={isItem ? undefined : () => pick(opt)} onMouseMove={(e) => tilt(e, r)} onMouseLeave={() => untilt(r)}>
                    <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-20 transition" />
                    {isFree && <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">FREE</div>}
                    <h3 className={`font-semibold shimmer leading-snug ${isItem ? "text-sm flex-1" : "text-xl"}`}>{displayText}</h3>
                    {isItem && (
                      <button onClick={() => handleResourceClick(opt)} className="relative z-10 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-bold bg-black/25 hover:bg-black/50 border border-white/25 hover:border-white/60 backdrop-blur-sm transition-all hover:scale-105 active:scale-95">
                        <Download size={11} /> {isFree ? 'Download Free' : 'Buy & Download'}
                      </button>
                    )}
                  </div>
                );
              })}
              {options.length === 0 && <p className="col-span-full text-gray-600 text-sm py-12 text-center">{search ? `No results for "${search}".` : "Nothing here."}</p>}
            </div>
          </>
        )}
      </div>
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden" style={{ animation: "scaleUp .25s ease" }}>
            <div className="bg-gradient-to-r from-blue-600/30 to-purple-600/20 px-5 py-4 border-b border-gray-800 flex items-start justify-between">
              <div><p className="text-xs text-gray-400 mb-0.5">Purchase Note</p><h3 className="font-bold text-white text-sm">{modal.item.title}</h3><p className="text-xs text-gray-500 mt-0.5">{modal.item.subject} · {modal.item.grade}</p></div>
              <button onClick={() => setModal(null)} className="text-gray-500 hover:text-white transition"><X size={18} /></button>
            </div>
            <div className="px-5 py-5 flex flex-col gap-3">
              <div className="flex items-baseline gap-1 mb-2"><span className="text-2xl font-bold text-blue-400">KSh {parseFloat(modal.item.price).toFixed(2)}</span></div>
              <button onClick={payWallet} disabled={paying} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-sm transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">{paying ? "Processing…" : "💳 Pay with Wallet"}</button>
              <div className="flex items-center gap-3"><div className="flex-1 h-px bg-gray-800" /><span className="text-xs text-gray-600">or pay via Pesapal</span><div className="flex-1 h-px bg-gray-800" /></div>
              <button onClick={payPesapal} disabled={paying} className="w-full py-3 rounded-xl bg-green-700 hover:bg-green-600 font-bold text-sm transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">{paying ? "Redirecting…" : "📱 Pay via Pesapal (M-Pesa/Card)"}</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes scaleUp{from{transform:scale(0.9);opacity:0}to{transform:scale(1);opacity:1}}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}.animate-float{animation:float 3s ease-in-out infinite}@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}.shimmer{background:linear-gradient(90deg,rgba(255,255,255,.2) 0%,rgba(255,255,255,.6) 50%,rgba(255,255,255,.2) 100%);background-size:200% 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 2.5s infinite}@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}.animate-slide-in{animation:slideIn 0.3s ease-out forwards}`}</style>
    </div>
  );
}