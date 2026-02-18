// src/pages/ExamsPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { ArrowLeft, Search, X, Download, BookOpen, ChevronRight, Loader2 } from "lucide-react";
import { getExams, walletPurchase, initiateOneTimePurchase } from "../Api";

const GRADS = ["from-green-500 to-green-700","from-blue-500 to-blue-700","from-purple-500 to-purple-700","from-pink-500 to-pink-700","from-teal-500 to-teal-700","from-cyan-500 to-cyan-700","from-orange-500 to-orange-700","from-rose-500 to-rose-700","from-indigo-500 to-indigo-700","from-yellow-500 to-yellow-600"];
const grad = (i) => GRADS[i % GRADS.length];

export default function ExamsPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [curriculum, setCurriculum] = useState(null);
  const [grade, setGrade] = useState(null);
  const [subject, setSubject] = useState(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [phone, setPhone] = useState("");
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
        const res = await getExams();
        setExams(res.data || []);
      } catch (e) {
        console.error(e);
        setError("Failed to load exams.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const { curricula, grades, subjects, items } = useMemo(() => {
    let filtered = exams;
    if (curriculum) filtered = filtered.filter((e) => e.curriculum === curriculum);
    if (grade) filtered = filtered.filter((e) => e.grade === grade);
    if (subject) filtered = filtered.filter((e) => e.subject === subject);
    const curricula = [...new Set(exams.map((e) => e.curriculum).filter(Boolean))].sort();
    const grades = [...new Set(exams.filter((e) => !curriculum || e.curriculum === curriculum).map((e) => e.grade).filter(Boolean))].sort();
    const subjects = [...new Set(exams.filter((e) => (!curriculum || e.curriculum === curriculum) && (!grade || e.grade === grade)).map((e) => e.subject).filter(Boolean))].sort();
    return { curricula, grades, subjects, items: filtered };
  }, [exams, curriculum, grade, subject]);

  const step = subject ? 3 : grade ? 2 : curriculum ? 1 : 0;
  const options = useMemo(() => {
    const q = search.toLowerCase();
    if (step === 0) return curricula.filter((c) => c.toLowerCase().includes(q));
    if (step === 1) return grades.filter((g) => g.toLowerCase().includes(q));
    if (step === 2) return subjects.filter((s) => s.toLowerCase().includes(q));
    return items.filter((e) => e.title?.toLowerCase().includes(q));
  }, [step, curricula, grades, subjects, items, search]);

  const pick = (val) => { setSearch(""); if (step === 0) setCurriculum(val); else if (step === 1) setGrade(val); else if (step === 2) setSubject(val); };
  const goBack = () => { setSearch(""); if (subject) { setSubject(null); return; } if (grade) { setGrade(null); return; } if (curriculum) { setCurriculum(null); return; } navigate("/user-dashboard"); };
  const breadcrumbs = [curriculum && { label: curriculum, clear: () => { setCurriculum(null); setGrade(null); setSubject(null); } }, grade && { label: grade, clear: () => { setGrade(null); setSubject(null); } }, subject && { label: subject, clear: () => setSubject(null) }].filter(Boolean);
  const stepLabel = ["Select Curriculum", "Select Grade / Level", "Select Subject", subject ? `Exams — ${subject}` : ""][step];

  const payWallet = async () => { setPaying(true); try { await walletPurchase({ resource_id: modal.item.id, resource_type: "Exam" }); alert("Payment successful!"); setModal(null); } catch (e) { alert(e.response?.data?.error || "Wallet payment failed."); } finally { setPaying(false); } };
  const payMpesa = async () => { if (!phone) { alert("Enter M-Pesa phone."); return; } setPaying(true); try { await initiateOneTimePurchase({ phone_number: phone, resource_id: modal.item.id, resource_type: "Exam" }); alert("STK Push sent!"); setModal(null); setPhone(""); } catch (e) { alert(e.response?.data?.error || "M-Pesa failed."); } finally { setPaying(false); } };

  return (
    <div className="relative min-h-screen flex flex-col text-white bg-gray-900 overflow-x-hidden">
      <Particles id="exams-bg" init={particlesInit} className="absolute inset-0 -z-10" options={{ background: { color: { value: "#0f172a" } }, fpsLimit: 60, particles: { number: { value: 90, density: { enable: true, area: 800 } }, color: { value: ["#38bdf8", "#a78bfa", "#f472b6", "#22c55e"] }, shape: { type: "circle" }, opacity: { value: 0.5 }, size: { value: { min: 3, max: 7 } }, move: { enable: true, speed: 1, outModes: "out", random: true } } }} />
      <div className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50 px-4 py-3 flex items-center gap-3">
        <button onClick={goBack} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-semibold transition-all hover:scale-105 active:scale-95 shrink-0"><ArrowLeft size={15} /> Back</button>
        <div className="flex-1 flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2 border border-gray-700/60 focus-within:border-green-500/60 transition-colors">
          <Search size={14} className="text-gray-500 shrink-0" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${stepLabel.toLowerCase()}…`} className="w-full bg-transparent outline-none text-sm placeholder-gray-600" />
          {search && <button onClick={() => setSearch("")}><X size={12} className="text-gray-500 hover:text-white" /></button>}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0"><BookOpen size={13} /> Exams</div>
      </div>
      {breadcrumbs.length > 0 && (
        <div className="px-4 pt-3 flex items-center gap-2 flex-wrap">
          {breadcrumbs.map((b, i) => (<React.Fragment key={b.label}><button onClick={b.clear} className="text-xs px-2.5 py-1 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition">{b.label}</button>{i < breadcrumbs.length - 1 && <ChevronRight size={11} className="text-gray-700" />}</React.Fragment>))}
        </div>
      )}
      <div className="flex-1 px-4 py-6 pb-16">
        {loading && <div className="flex flex-col items-center justify-center py-32 gap-3 text-green-500"><Loader2 size={32} className="animate-spin" /><p className="text-sm font-medium">Loading exams…</p></div>}
        {!loading && error && <div className="text-center py-24 text-red-400 text-sm">{error}</div>}
        {!loading && !error && exams.length === 0 && <div className="flex flex-col items-center justify-center py-32 gap-3 text-gray-600"><BookOpen size={48} className="opacity-40" /><p className="text-sm font-medium">No exams uploaded yet.</p></div>}
        {!loading && !error && exams.length > 0 && (
          <>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-5">{stepLabel}</p>
            <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {options.map((opt, i) => {
                const isItem = step === 3;
                const r = getRef(`${step}-${i}-${isItem ? opt.id : opt}`);
                const displayText = isItem ? opt.title : opt;
                return (
                  <div key={isItem ? opt.id : opt} ref={r} className={`bg-gradient-to-br ${grad(i)} rounded-2xl shadow-2xl cursor-pointer transform transition duration-500 relative overflow-hidden animate-float ${isItem ? "p-5 flex flex-col gap-3" : "p-8"}`} onClick={isItem ? undefined : () => pick(opt)} onMouseMove={(e) => tilt(e, r)} onMouseLeave={() => untilt(r)}>
                    <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-20 transition" />
                    <h3 className={`font-semibold shimmer leading-snug ${isItem ? "text-sm flex-1" : "text-xl"}`}>{displayText}</h3>
                    {isItem && <button onClick={() => setModal({ item: opt })} className="relative z-10 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-bold bg-black/25 hover:bg-black/50 border border-white/25 hover:border-white/60 backdrop-blur-sm transition-all hover:scale-105 active:scale-95"><Download size={11} /> Buy & Download</button>}
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
            <div className="bg-gradient-to-r from-green-600/30 to-teal-600/20 px-5 py-4 border-b border-gray-800 flex items-start justify-between">
              <div><p className="text-xs text-gray-400 mb-0.5">Purchase Exam</p><h3 className="font-bold text-white text-sm">{modal.item.title}</h3><p className="text-xs text-gray-500 mt-0.5">{modal.item.subject} · {modal.item.grade}</p></div>
              <button onClick={() => setModal(null)} className="text-gray-500 hover:text-white transition"><X size={18} /></button>
            </div>
            <div className="px-5 py-5 flex flex-col gap-3">
              <div className="flex items-baseline gap-1 mb-2"><span className="text-2xl font-bold text-green-400">KSh {parseFloat(modal.item.price).toFixed(2)}</span></div>
              <button onClick={payWallet} disabled={paying} className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 font-bold text-sm transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">{paying ? "Processing…" : "💳 Pay with Wallet"}</button>
              <div className="flex items-center gap-3"><div className="flex-1 h-px bg-gray-800" /><span className="text-xs text-gray-600">or via M-Pesa</span><div className="flex-1 h-px bg-gray-800" /></div>
              <input type="tel" placeholder="254XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition placeholder-gray-600" />
              <button onClick={payMpesa} disabled={paying} className="w-full py-3 rounded-xl bg-green-700 hover:bg-green-600 font-bold text-sm transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">{paying ? "Sending…" : "📱 Send M-Pesa STK"}</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes scaleUp{from{transform:scale(0.9);opacity:0}to{transform:scale(1);opacity:1}}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}.animate-float{animation:float 3s ease-in-out infinite}@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}.shimmer{background:linear-gradient(90deg,rgba(255,255,255,.2) 0%,rgba(255,255,255,.6) 50%,rgba(255,255,255,.2) 100%);background-size:200% 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 2.5s infinite}`}</style>
    </div>
  );
}