// src/pages/PastPapersPage.jsx
import React from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import {
  ArrowLeft, Search, ChevronRight, Loader2, History, FileArchive,
} from "lucide-react";
import { getPastPapers } from "../Api";
import { useResourcePage } from "../hooks/useResourcePage";
import ResourceCard  from "../components/ResourceCard";
import ResourceModal from "../components/ResourceModal";

const GRADS = [
  "from-purple-600/80 to-indigo-700/90",
  "from-fuchsia-600/80 to-pink-700/90",
  "from-violet-600/80 to-purple-800/90",
  "from-rose-600/80 to-purple-700/90",
];

export default function PastPapersPage() {
  const {
    loading, step, search, modal, options, breadcrumbs,
    payingWallet, payingPesapal, isPaying,
    setSearch, setModal,
    pick, clearAll, getRelated, handleDownload, payWithWallet, payWithPesapal,
  } = useResourcePage(getPastPapers, "PastPaper", "past-papers");

  const particlesInit = async (e) => { await loadSlim(e); };

  const stepLabel = [
    "Select Curriculum", "Select Level", "Select Subject",
    `${options[0]?.subject ?? ""} Papers`,
  ][step];

  return (
    <div className="relative min-h-screen text-slate-100 bg-[#0f172a]">
      <Particles
        id="pp-particles"
        init={particlesInit}
        className="absolute inset-0 -z-10"
        options={{
          background: { color: "transparent" },
          fpsLimit: 60,
          particles: {
            number: { value: 40 },
            color: { value: "#a78bfa" },
            opacity: { value: 0.15 },
            size: { value: { min: 1, max: 3 } },
            move: { enable: true, speed: 0.8 },
          },
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <div className="flex items-center gap-2 text-purple-400 font-bold tracking-widest text-xs uppercase mb-2">
              <History size={14} /> Revision Archive
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">{stepLabel}</h1>
          </div>

          <div className="relative group w-full md:w-80">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search archive…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-purple-500/50 text-white placeholder-slate-500 outline-none transition-all backdrop-blur-md"
            />
          </div>
        </div>

        {/* ── Breadcrumbs ── */}
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 mb-8 flex-wrap animate-in fade-in duration-500">
            <button
              onClick={clearAll}
              className="p-2.5 bg-slate-800/50 rounded-xl text-slate-400 hover:text-white transition-all"
            >
              <ArrowLeft size={16} />
            </button>
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={b.label}>
                <button
                  onClick={b.clear}
                  className="text-sm px-4 py-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-all font-semibold"
                >
                  {b.label}
                </button>
                {i < breadcrumbs.length - 1 && (
                  <ChevronRight size={14} className="text-slate-600" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* ── Grid ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="animate-spin text-purple-500 mb-4" size={40} />
            <p className="text-slate-400">Opening vault…</p>
          </div>
        ) : options.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <FileArchive size={40} className="mx-auto mb-4 opacity-40" />
            <p className="font-semibold">No results found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {options.map((opt, i) => {
              const isItem = step === 3;

              if (!isItem) {
                return (
                  <div
                    key={opt}
                    onClick={() => pick(opt)}
                    className={`
                      relative group bg-gradient-to-br ${GRADS[i % GRADS.length]}
                      p-8 rounded-[2rem] shadow-xl border border-white/10
                      flex flex-col min-h-[160px] cursor-pointer
                      transition-all duration-300 active:scale-95 overflow-hidden
                    `}
                  >
                    <div className="absolute top-4 right-4 text-white/15 group-hover:text-white/30 transition-all duration-500 pointer-events-none">
                      <FileArchive size={48} />
                    </div>
                    <div className="mt-auto">
                      <h3 className="font-extrabold text-white text-2xl leading-tight">{opt}</h3>
                    </div>
                  </div>
                );
              }

              return (
                <ResourceCard
                  key={opt.id}
                  item={opt}
                  index={i}
                  gradients={GRADS}
                  Icon={FileArchive}
                  onView={(item) => setModal({ item })}
                  onDownload={handleDownload}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {modal && (
        <ResourceModal
          item={modal.item}
          accentClass="from-purple-600/20 to-pink-600/20"
          iconBgClass="bg-purple-500/20 text-purple-400"
          Icon={FileArchive}
          payingWallet={payingWallet}
          payingPesapal={payingPesapal}
          onPayWallet={payWithWallet}
          onPayPesapal={payWithPesapal}
          onDownload={handleDownload}
          onClose={() => !isPaying && setModal(null)}
          relatedItems={getRelated(modal.item)}
          onSelectRelated={(item) => setModal({ item })}
        />
      )}
    </div>
  );
}