// src/components/GlobalSearchBar.jsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, X, FileText, BookOpen, FileArchive,
  Loader2, ChevronRight, Tag, CheckCircle2,
} from "lucide-react";
import { useGlobalSearch } from "../hooks/useGlobalSearch";
import ResourceModal from "./ResourceModal";
import { walletPurchase, initiateOneTimePurchase } from "../Api";
import api from "../Api";

// ─── tiny helpers ────────────────────────────────────────────────────────────

const TYPE_META = {
  Note:      { label: "Note",       Icon: FileText,   accent: "text-cyan-400",   bg: "bg-cyan-500/15 border-cyan-500/20"   },
  Exam:      { label: "Exam",       Icon: BookOpen,   accent: "text-blue-400",   bg: "bg-blue-500/15 border-blue-500/20"   },
  PastPaper: { label: "Past Paper", Icon: FileArchive, accent: "text-purple-400", bg: "bg-purple-500/15 border-purple-500/20" },
};

const MODAL_ACCENT = {
  Note:      { accentClass: "from-cyan-600/20 to-blue-600/20",     iconBgClass: "bg-cyan-500/20 text-cyan-400"   },
  Exam:      { accentClass: "from-blue-600/20 to-indigo-600/20",   iconBgClass: "bg-blue-500/20 text-blue-400"   },
  PastPaper: { accentClass: "from-purple-600/20 to-pink-600/20",   iconBgClass: "bg-purple-500/20 text-purple-400" },
};

function highlight(text = "", query = "") {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-transparent text-white font-bold underline underline-offset-2 decoration-current">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// Group results by type
function groupResults(results) {
  const groups = {};
  for (const item of results) {
    if (!groups[item._type]) groups[item._type] = [];
    groups[item._type].push(item);
  }
  return groups;
}

// ─── main component ──────────────────────────────────────────────────────────

/**
 * GlobalSearchBar
 *
 * Props:
 *  placeholder   – input placeholder text (default "Search all resources…")
 *  accentColor   – Tailwind focus color class (default "focus:border-blue-500/50")
 *  iconColor     – Tailwind icon color on focus (default "group-focus-within:text-blue-400")
 *  className     – extra classes for the outer wrapper
 *  maxResults    – max items shown in dropdown (default 12)
 */
export default function GlobalSearchBar({
  placeholder  = "Search all resources…",
  accentColor  = "focus:border-blue-500/50",
  iconColor    = "group-focus-within:text-blue-400",
  className    = "",
  maxResults   = 12,
}) {
  const navigate = useNavigate();
  const { query, setQuery, results, allLoaded, isSearching, clear } = useGlobalSearch();

  const [open,          setOpen]         = useState(false);
  const [modal,         setModal]        = useState(null);   // { item }
  const [payingWallet,  setPayingWallet]  = useState(false);
  const [payingPesapal, setPayingPesapal] = useState(false);

  const inputRef    = useRef(null);
  const dropdownRef = useRef(null);
  const isPaying    = payingWallet || payingPesapal;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        inputRef.current    && !inputRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Open dropdown when results arrive
  useEffect(() => {
    if (isSearching) setOpen(true);
    else             setOpen(false);
  }, [isSearching, results.length]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") { clear(); setOpen(false); }
  };

  const handleSelect = (item) => {
    setOpen(false);
    setModal({ item });
  };

  // ── Download ─────────────────────────────────────────────────────────────
  const getExtension = (ct, filename) => {
    if (!ct) { const e = filename?.split(".").pop(); return e && e.length <= 5 ? `.${e}` : ".pdf"; }
    if (ct.includes("pdf"))            return ".pdf";
    if (ct.includes("spreadsheetml") || ct.includes("excel")) return ".xlsx";
    if (ct.includes("ms-excel"))       return ".xls";
    if (ct.includes("csv"))            return ".csv";
    if (ct.includes("wordprocessingml") || ct.includes("msword")) return ".docx";
    if (ct.includes("presentationml") || ct.includes("powerpoint")) return ".pptx";
    if (ct.includes("jpeg") || ct.includes("jpg")) return ".jpg";
    if (ct.includes("png")) return ".png";
    return ".pdf";
  };

  const handleDownload = useCallback(async (item) => {
    try {
      const response = await api.get(
        `resources/${item._downloadPath}/${item.id}/download/`,
        { responseType: "blob", timeout: 120000 },
      );
      const ct  = response.headers["content-type"];
      const ext = getExtension(ct, item.title);
      const url  = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `${item.title || "resource"}${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // ── Payments ─────────────────────────────────────────────────────────────
  const payWithWallet = async () => {
    if (!modal) return;
    setPayingWallet(true);
    try {
      await walletPurchase({ resource_id: modal.item.id, resource_type: modal.item._type });
      const item = modal.item;
      setModal(null);
      await handleDownload(item);
    } catch (e) {
      alert(e.response?.data?.error || "Wallet payment failed.");
    } finally {
      setPayingWallet(false);
    }
  };

  const payWithPesapal = async () => {
    if (!modal) return;
    setPayingPesapal(true);
    try {
      const res = await initiateOneTimePurchase({
        resource_id:   modal.item.id,
        resource_type: modal.item._type,
      });
      window.location.href = res.data.redirect_url;
    } catch (e) {
      alert(e.response?.data?.error || "Could not initiate payment.");
      setPayingPesapal(false);
    }
  };

  const getRelated = (item) =>
    results
      .filter((i) => i.subject === item.subject && i.id !== item.id && i._type === item._type)
      .slice(0, 4);

  // ── Grouped display ───────────────────────────────────────────────────────
  const capped   = results.slice(0, maxResults);
  const grouped  = groupResults(capped);
  const typeOrder = ["Note", "Exam", "PastPaper"];

  const modalItem  = modal?.item;
  const modalMeta  = modalItem ? MODAL_ACCENT[modalItem._type] : null;
  const ModalIcon  = modalItem ? TYPE_META[modalItem._type]?.Icon : BookOpen;

  return (
    <>
      {/* ── Search input ─────────────────────────────────────────────────── */}
      <div className={`relative group w-full ${className}`}>
        <Search
          className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors ${iconColor}`}
          size={18}
        />
        <input
          ref={inputRef}
          type="text"
          placeholder={allLoaded ? placeholder : "Loading resources…"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => isSearching && setOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={!allLoaded}
          className={`
            w-full pl-12 pr-10 py-3.5 rounded-2xl
            bg-slate-800/50 border border-slate-700/50
            ${accentColor}
            text-white placeholder-slate-500 outline-none
            transition-all backdrop-blur-md
            disabled:opacity-50 disabled:cursor-wait
          `}
        />

        {/* Loading spinner / clear button */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {!allLoaded ? (
            <Loader2 size={15} className="animate-spin text-slate-500" />
          ) : query ? (
            <button
              onClick={() => { clear(); setOpen(false); }}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>
          ) : null}
        </div>

        {/* ── Dropdown ─────────────────────────────────────────────────── */}
        {open && isSearching && (
          <div
            ref={dropdownRef}
            className="
              absolute top-[calc(100%+8px)] left-0 right-0 z-[200]
              bg-slate-900/95 backdrop-blur-xl
              border border-slate-700/60
              rounded-2xl shadow-2xl shadow-black/40
              overflow-hidden
              animate-in fade-in slide-in-from-top-2 duration-200
            "
          >
            {capped.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <Search size={28} className="mb-3 opacity-40" />
                <p className="text-sm font-semibold">No results for "{query}"</p>
                <p className="text-xs mt-1 opacity-70">Try a subject, grade, or title</p>
              </div>
            ) : (
              <div className="max-h-[420px] overflow-y-auto custom-scrollbar divide-y divide-slate-800/60">
                {typeOrder.map((type) => {
                  const group = grouped[type];
                  if (!group?.length) return null;
                  const meta = TYPE_META[type];

                  return (
                    <div key={type}>
                      {/* Section header */}
                      <div className={`flex items-center gap-2 px-4 py-2 ${meta.bg} border-b border-transparent`}>
                        <meta.Icon size={12} className={meta.accent} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${meta.accent}`}>
                          {meta.label}s — {group.length} result{group.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Result rows */}
                      {group.map((item) => {
                        const isFree      = parseFloat(item.price || 0) === 0;
                        const isPurchased = item.is_purchased || item.owned || false;

                        return (
                          <button
                            key={`${type}-${item.id}`}
                            onClick={() => handleSelect(item)}
                            className="
                              w-full flex items-center gap-3 px-4 py-3
                              hover:bg-slate-800/70 transition-all duration-150
                              text-left group/row
                            "
                          >
                            {/* Icon */}
                            <div className={`
                              flex-shrink-0 p-2 rounded-xl
                              ${meta.bg} border
                            `}>
                              <meta.Icon size={14} className={meta.accent} />
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-200 group-hover/row:text-white truncate transition-colors">
                                {highlight(item.title, query)}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {item.curriculum && (
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    {highlight(item.curriculum, query)}
                                  </span>
                                )}
                                {item.grade && (
                                  <>
                                    <span className="text-slate-700 text-[10px]">·</span>
                                    <span className="text-[10px] text-slate-500">
                                      {highlight(item.grade, query)}
                                    </span>
                                  </>
                                )}
                                {item.subject && (
                                  <>
                                    <span className="text-slate-700 text-[10px]">·</span>
                                    <span className="text-[10px] text-slate-500">
                                      {highlight(item.subject, query)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Price / status */}
                            <div className="flex-shrink-0 text-right">
                              {isPurchased ? (
                                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                                  <CheckCircle2 size={10} /> Owned
                                </span>
                              ) : isFree ? (
                                <span className="text-[10px] text-slate-400 font-bold">Free</span>
                              ) : (
                                <span className="text-[10px] text-slate-300 font-bold">
                                  KSh {item.price}
                                </span>
                              )}
                            </div>

                            <ChevronRight size={13} className="flex-shrink-0 text-slate-600 group-hover/row:text-slate-400 transition-colors" />
                          </button>
                        );
                      })}
                    </div>
                  );
                })}

                {/* Footer: total count */}
                {results.length > maxResults && (
                  <div className="px-4 py-2.5 bg-slate-800/30 border-t border-slate-800">
                    <p className="text-[10px] text-slate-500 text-center">
                      Showing {maxResults} of {results.length} results — refine your search
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Keyboard hint */}
            <div className="px-4 py-2 border-t border-slate-800/60 flex items-center gap-3 bg-slate-900/60">
              <span className="text-[10px] text-slate-600">Press</span>
              <kbd className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Esc</kbd>
              <span className="text-[10px] text-slate-600">to close</span>
              <span className="ml-auto text-[10px] text-slate-600 italic">Click any result to open</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Resource modal (opened from search result) ────────────────────── */}
      {modal && modalMeta && (
        <ResourceModal
          item={modal.item}
          accentClass={modalMeta.accentClass}
          iconBgClass={modalMeta.iconBgClass}
          Icon={ModalIcon}
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

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </>
  );
}