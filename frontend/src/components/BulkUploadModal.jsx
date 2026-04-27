// BulkUploadModal.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Upload,
  Loader2,
  Plus,
  Trash2,
  FileText,
  CheckCircle,
  AlertCircle,
  Layers,
  Info,
  Clock,
  HardDrive,
  Package,
  AlertTriangle,
} from "lucide-react";
import api from "../Api";

// ─── Constants ───────────────────────────────────────────────────────────────
const LIMITS = {
  maxTotalSizeGB: 2,
  maxFileSizeMB: 200,
  maxFilesPerBatch: 50,
  maxBatches: 5,
  estimatedUploadMinutes: 30,
};

const RESOURCE_TYPES = ["Note", "Exam", "PastPaper"];

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} min ${s} sec` : `${s} sec`;
}

function estimateUploadTime(totalBytes) {
  return Math.ceil(totalBytes / (5 * 1024 * 1024));
}

// ─── Shared style tokens ─────────────────────────────────────────────────────
const SELECT_CLS =
  "w-full bg-[#0a1628] border border-white/8 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer";
const INPUT_CLS =
  "w-full bg-[#0a1628] border border-white/8 px-3 py-2.5 rounded-xl text-xs font-semibold text-white outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-slate-600";
const LABEL_CLS =
  "block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5";

// ─── LimitBar ────────────────────────────────────────────────────────────────
function LimitBar({ label, used, max, unit = "", warn = 0.8 }) {
  const pct = Math.min((used / max) * 100, 100);
  const isWarn = pct >= warn * 100;
  const isOver = used > max;
  return (
    <div className="flex items-center gap-3 min-w-0">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 whitespace-nowrap w-20 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isOver ? "bg-rose-500" : isWarn ? "bg-amber-400" : "bg-emerald-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`text-[10px] font-bold whitespace-nowrap tabular-nums ${
          isOver
            ? "text-rose-400"
            : isWarn
              ? "text-amber-400"
              : "text-slate-500"
        }`}
      >
        {used}
        {unit} / {max}
        {unit}
      </span>
    </div>
  );
}

// ─── FileRow ─────────────────────────────────────────────────────────────────
function FileRow({ f, idx, onTitleChange, onRemove }) {
  const statusIcon = {
    pending: null,
    uploading: (
      <Loader2 size={13} className="animate-spin text-blue-400 shrink-0" />
    ),
    success: <CheckCircle size={13} className="text-emerald-400 shrink-0" />,
    error: (
      <AlertCircle
        size={13}
        className="text-rose-400 shrink-0"
        title={f.error}
      />
    ),
  }[f.status];

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all group ${
        f.status === "success"
          ? "bg-emerald-500/5 border-emerald-500/15"
          : f.status === "error"
            ? "bg-rose-500/5 border-rose-500/15"
            : "bg-[#0a1628] border-white/5 hover:border-white/12"
      }`}
    >
      <FileText size={13} className="text-slate-600 shrink-0" />
      <input
        value={f.title}
        onChange={(e) => onTitleChange(idx, e.target.value)}
        disabled={f.status === "uploading" || f.status === "success"}
        className="flex-1 bg-transparent border-none outline-none text-xs font-medium text-white min-w-0 disabled:opacity-50 placeholder:text-slate-600"
        placeholder="File title…"
      />
      <span className="text-[10px] text-slate-600 shrink-0 tabular-nums">
        {formatBytes(f.file.size)}
      </span>
      {statusIcon}
      {f.status !== "success" && f.status !== "uploading" && (
        <button
          onClick={() => onRemove(idx)}
          className="p-1 opacity-0 group-hover:opacity-100 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all shrink-0"
        >
          <Trash2 size={11} />
        </button>
      )}
    </div>
  );
}

// ─── BatchCard ───────────────────────────────────────────────────────────────
function BatchCard({
  batch,
  batchIdx,
  curricula,
  grades,
  subjects,
  topics,
  onUpdate,
  onRemove,
  onAddFiles,
  onRemoveFile,
  onTitleChange,
  totalBatches,
}) {
  const fileInputRef = useRef(null);
  const [filesOpen, setFilesOpen] = useState(true);
  const totalSize = batch.files.reduce((sum, f) => sum + f.file.size, 0);
  const isOverFileLimit = batch.files.length > LIMITS.maxFilesPerBatch;

  const handleFileDrop = useCallback(
    (e) => {
      e.preventDefault();
      onAddFiles(batchIdx, Array.from(e.dataTransfer.files));
    },
    [batchIdx, onAddFiles],
  );

  const handleFileSelect = (e) => {
    onAddFiles(batchIdx, Array.from(e.target.files));
    e.target.value = "";
  };

  const successCount = batch.files.filter((f) => f.status === "success").length;
  const errorCount = batch.files.filter((f) => f.status === "error").length;
  const uploadingCount = batch.files.filter(
    (f) => f.status === "uploading",
  ).length;

  return (
    <div className="bg-[#162035] border border-white/8 rounded-2xl overflow-hidden">
      {/* ── Batch header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/25 flex items-center justify-center text-blue-400 text-[11px] font-black shrink-0">
            {batchIdx + 1}
          </span>
          <div>
            <p className="text-xs font-bold text-white leading-tight">
              {batch.subject
                ? subjects.find((s) => String(s.id) === String(batch.subject))
                    ?.name || "Subject"
                : "New Batch"}
            </p>
            <p className="text-[10px] text-slate-600 mt-0.5 tabular-nums">
              {batch.files.length} file{batch.files.length !== 1 ? "s" : ""} ·{" "}
              {formatBytes(totalSize)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOverFileLimit && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-400/8 px-2 py-1 rounded-full border border-amber-400/15">
              Over limit
            </span>
          )}
          {totalBatches > 1 && (
            <button
              onClick={() => onRemove(batchIdx)}
              className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/8 rounded-lg transition-all"
              title="Remove batch"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Batch body ───────────────────────────────────────────────── */}
      <div className="p-5 space-y-4">
        {/* Row 1: Type · Curriculum · Grade · Subject */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2 md:col-span-1">
            <label className={LABEL_CLS}>Type</label>
            <select
              value={batch.resourceType}
              onChange={(e) =>
                onUpdate(batchIdx, "resourceType", e.target.value)
              }
              className={SELECT_CLS}
            >
              {RESOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "PastPaper" ? "Past Paper" : t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLS}>Curriculum</label>
            <select
              value={batch.curriculum}
              onChange={(e) => onUpdate(batchIdx, "curriculum", e.target.value)}
              className={SELECT_CLS}
            >
              <option value="">Any</option>
              {curricula.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLS}>Grade</label>
            <select
              value={batch.grade}
              onChange={(e) => onUpdate(batchIdx, "grade", e.target.value)}
              className={SELECT_CLS}
            >
              <option value="">Any</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLS}>Subject</label>
            <select
              value={batch.subject}
              onChange={(e) => onUpdate(batchIdx, "subject", e.target.value)}
              className={SELECT_CLS}
            >
              <option value="">Any</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Topic · Price · Exam date / Year */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className={LABEL_CLS}>Topic</label>
            <select
              value={batch.topic}
              onChange={(e) => onUpdate(batchIdx, "topic", e.target.value)}
              className={SELECT_CLS}
            >
              <option value="">Any</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLS}>Price (KSh)</label>
            <input
              type="number"
              value={batch.price}
              onChange={(e) => onUpdate(batchIdx, "price", e.target.value)}
              className={INPUT_CLS}
              placeholder="0"
              min="0"
            />
          </div>

          {batch.resourceType === "Exam" && (
            <div>
              <label className={LABEL_CLS}>Exam Date</label>
              <input
                type="date"
                value={batch.date}
                onChange={(e) => onUpdate(batchIdx, "date", e.target.value)}
                className={INPUT_CLS + " [color-scheme:dark]"}
              />
            </div>
          )}

          {batch.resourceType === "PastPaper" && (
            <div>
              <label className={LABEL_CLS}>Year</label>
              <input
                type="number"
                value={batch.year}
                onChange={(e) => onUpdate(batchIdx, "year", e.target.value)}
                className={INPUT_CLS}
                placeholder="2024"
                min="1990"
                max={new Date().getFullYear()}
              />
            </div>
          )}
        </div>

        {/* ── Files collapsible section ─────────────────────────────── */}
        <div className="border border-white/6 rounded-xl overflow-hidden">
          {/* Toggle header */}
          <button
            type="button"
            onClick={() => setFilesOpen((o) => !o)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className={LABEL_CLS + " mb-0"}>Files</span>
              {/* Status pills */}
              <div className="flex items-center gap-1.5">
                {batch.files.length > 0 && (
                  <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full tabular-nums">
                    {batch.files.length}
                  </span>
                )}
                {successCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/8 px-2 py-0.5 rounded-full">
                    <CheckCircle size={9} /> {successCount}
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/8 px-2 py-0.5 rounded-full">
                    <AlertCircle size={9} /> {errorCount}
                  </span>
                )}
                {uploadingCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/8 px-2 py-0.5 rounded-full">
                    <Loader2 size={9} className="animate-spin" />{" "}
                    {uploadingCount}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Add files button — stop propagation so it doesn't toggle */}
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  (e.stopPropagation(), fileInputRef.current?.click())
                }
                className="flex items-center gap-1 text-[10px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors"
              >
                <Plus size={11} /> Add Files
              </span>
              {/* Chevron */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-slate-500 transition-transform duration-200 ${filesOpen ? "rotate-180" : "rotate-0"}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </button>

          {/* Collapsible body */}
          <div
            style={{
              maxHeight: filesOpen ? "2000px" : "0px",
              opacity: filesOpen ? 1 : 0,
              overflow: "hidden",
              transition: "max-height 0.25s ease, opacity 0.2s ease",
            }}
          >
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="px-3.5 pb-3.5 pt-2"
            >
              {batch.files.length > 0 ? (
                <div className="space-y-1">
                  {batch.files.map((f, i) => (
                    <FileRow
                      key={i}
                      f={f}
                      idx={i}
                      onTitleChange={(idx, val) =>
                        onTitleChange(batchIdx, idx, val)
                      }
                      onRemove={(idx) => onRemoveFile(batchIdx, idx)}
                    />
                  ))}
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-white/10 hover:border-blue-500/30 bg-white/[0.01] hover:bg-blue-500/3 rounded-xl py-7 flex flex-col items-center gap-2 text-slate-600 cursor-pointer transition-all"
                >
                  <Upload size={20} className="opacity-30" />
                  <p className="text-xs font-semibold">
                    Drop files here or click to browse
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
}

// ─── SummaryPanel ────────────────────────────────────────────────────────────
function SummaryPanel({ batches, totalFiles, totalBytes, estimatedSec, withinLimits }) {
  const [open, setOpen] = useState(false); // collapsed by default
  const isWarn = estimatedSec > LIMITS.estimatedUploadMinutes * 60 * 0.8;

  return (
    <div className={`rounded-xl border transition-colors ${
      withinLimits ? "bg-emerald-500/[0.04] border-emerald-500/12" : "bg-rose-500/[0.04] border-rose-500/12"
    }`}>
      {/* ── Collapsed summary row (always visible) ── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors rounded-xl"
      >
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status dot */}
          <div className={`flex items-center gap-1.5 ${withinLimits ? "text-emerald-400" : "text-rose-400"}`}>
            {withinLimits
              ? <CheckCircle size={13} className="shrink-0" />
              : <AlertTriangle size={13} className="shrink-0" />}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {withinLimits ? "Ready to upload" : "Exceeds limits"}
            </span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          {/* Inline stats */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-500 tabular-nums">
              <span className="text-white font-bold">{batches.length}</span>/{LIMITS.maxBatches} batches
            </span>
            <span className="text-[10px] text-slate-500 tabular-nums">
              <span className="text-white font-bold">{totalFiles}</span> files
            </span>
            <span className="text-[10px] text-slate-500 tabular-nums">
              <span className="text-white font-bold">{formatBytes(totalBytes)}</span>
            </span>
            <span className="text-[10px] text-slate-500 tabular-nums">
              ~<span className="text-white font-bold">{formatDuration(estimatedSec)}</span>
            </span>
          </div>
        </div>
        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`text-slate-500 transition-transform duration-200 shrink-0 ml-2 ${open ? "rotate-180" : "rotate-0"}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* ── Expanded detail ── */}
      <div style={{
        maxHeight: open ? "400px" : "0px",
        opacity: open ? 1 : 0,
        overflow: "hidden",
        transition: "max-height 0.25s ease, opacity 0.2s ease",
      }}>
        <div className="px-4 pb-4 space-y-3.5 border-t border-white/5 pt-3">
          {/* Stat tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { icon: Package, label: "Total Batches", value: `${batches.length} / ${LIMITS.maxBatches}`, over: batches.length > LIMITS.maxBatches },
              { icon: FileText, label: "Total Files", value: `${totalFiles} / ${LIMITS.maxFilesPerBatch * batches.length}`, over: false },
              { icon: HardDrive, label: "Total Size", value: `${formatBytes(totalBytes)} / 2 GB`, over: totalBytes > LIMITS.maxTotalSizeGB * 1024 ** 3 },
              { icon: Clock, label: "Upload Time", value: formatDuration(estimatedSec), over: isWarn },
            ].map(({ icon: Icon, label, value, over }) => (
              <div key={label} className={`rounded-xl p-3 border bg-white/[0.02] ${over ? "border-rose-500/15" : "border-white/5"}`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon size={11} className={over ? "text-rose-400" : "text-slate-600"} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{label}</span>
                </div>
                <p className={`text-sm font-black tabular-nums ${over ? "text-rose-400" : "text-white"}`}>{value}</p>
              </div>
            ))}
          </div>
          {/* Progress bars */}
          <div className="space-y-2">
            <LimitBar label="Total Size" used={Math.round((totalBytes / 1024 ** 3) * 10) / 10} max={LIMITS.maxTotalSizeGB} unit=" GB" />
            <LimitBar label="Batches" used={batches.length} max={LIMITS.maxBatches} />
          </div>
        </div>
      </div>
    </div>
  );
}
// ─── LimitsInfo popover ───────────────────────────────────────────────────────
function LimitsInfo() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
          open ? "text-slate-300" : "text-slate-600 hover:text-slate-400"
        }`}
      >
        <Info size={12} /> Upload Limits
      </button>

      {open && (
        <div className="absolute top-7 right-0 z-50 bg-[#0f172a] border border-white/10 rounded-2xl p-4 w-56 shadow-2xl">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-3">
            System Limits
          </p>
          <div className="space-y-2">
            {[
              ["Max total size", `${LIMITS.maxTotalSizeGB} GB`],
              ["Max file size", `${LIMITS.maxFileSizeMB} MB`],
              ["Max files / batch", `${LIMITS.maxFilesPerBatch}`],
              ["Max batches", `${LIMITS.maxBatches}`],
              ["Est. timeout", `${LIMITS.estimatedUploadMinutes} min`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center">
                <span className="text-[11px] text-slate-500">{k}</span>
                <span className="text-[11px] font-black text-white tabular-nums">
                  {v}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-slate-700 pt-2.5 mt-2.5 border-t border-white/5">
            Configurable by system administrator.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function newBatch() {
  return {
    id: Date.now() + Math.random(),
    resourceType: "Note",
    curriculum: "",
    grade: "",
    subject: "",
    topic: "",
    price: "0",
    date: "",
    year: "",
    files: [],
  };
}

function titleFromFilename(filename) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function BulkUploadModal({ isOpen, onClose, onSuccess }) {
  const [batches, setBatches] = useState([newBatch()]);
  const [curricula, setCurricula] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const [currRes, gradeRes, subjRes, topicRes] = await Promise.all([
          api.get("resources/education-levels/"),
          api.get("resources/grades/"),
          api.get("resources/subjects/"),
          api.get("resources/topics/"),
        ]);
        setCurricula(currRes.data || []);
        setGrades(gradeRes.data || []);
        setSubjects(subjRes.data || []);
        setTopics(topicRes.data || []);
      } catch (err) {
        console.error("Failed to load dropdowns:", err);
      }
    })();
  }, [isOpen]);

  // ── Derived stats ──────────────────────────────────────────────────────
  const totalFiles = batches.reduce((sum, b) => sum + b.files.length, 0);
  const totalBytes = batches.reduce(
    (sum, b) => sum + b.files.reduce((s, f) => s + f.file.size, 0),
    0,
  );
  const estimatedSec = estimateUploadTime(totalBytes);
  const anyOverFileLimit = batches.some(
    (b) => b.files.length > LIMITS.maxFilesPerBatch,
  );
  const anyOverSingleFile = batches.some((b) =>
    b.files.some((f) => f.file.size > LIMITS.maxFileSizeMB * 1024 * 1024),
  );
  const withinLimits =
    batches.length <= LIMITS.maxBatches &&
    totalBytes <= LIMITS.maxTotalSizeGB * 1024 ** 3 &&
    !anyOverFileLimit &&
    !anyOverSingleFile &&
    totalFiles > 0;

  // ── Batch mutations ────────────────────────────────────────────────────
  const addBatch = () => {
    if (batches.length < LIMITS.maxBatches)
      setBatches((p) => [...p, newBatch()]);
  };
  const removeBatch = (idx) => setBatches((p) => p.filter((_, i) => i !== idx));
  const updateBatch = (idx, key, val) =>
    setBatches((p) => p.map((b, i) => (i === idx ? { ...b, [key]: val } : b)));

  const addFiles = useCallback((batchIdx, newFiles) => {
    setBatches((prev) =>
      prev.map((b, i) => {
        if (i !== batchIdx) return b;
        return {
          ...b,
          files: [
            ...b.files,
            ...newFiles.map((f) => ({
              file: f,
              title: titleFromFilename(f.name),
              status: "pending",
              error: "",
            })),
          ],
        };
      }),
    );
  }, []);

  const removeFile = (batchIdx, fileIdx) =>
    setBatches((prev) =>
      prev.map((b, i) =>
        i !== batchIdx
          ? b
          : { ...b, files: b.files.filter((_, fi) => fi !== fileIdx) },
      ),
    );

  const changeTitle = (batchIdx, fileIdx, val) =>
    setBatches((prev) =>
      prev.map((b, i) =>
        i !== batchIdx
          ? b
          : {
              ...b,
              files: b.files.map((f, fi) =>
                fi === fileIdx ? { ...f, title: val } : f,
              ),
            },
      ),
    );

  // ── Upload ─────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!withinLimits) return;
    setUploading(true);
    setGlobalError("");
    const endpoints = {
      Note: "resources/notes/",
      Exam: "resources/exams/",
      PastPaper: "resources/past-papers/",
    };

    for (let bi = 0; bi < batches.length; bi++) {
      const batch = batches[bi];
      for (let fi = 0; fi < batch.files.length; fi++) {
        const entry = batch.files[fi];
        if (entry.status === "success") continue;

        setBatches((prev) =>
          prev.map((b, i) =>
            i !== bi
              ? b
              : {
                  ...b,
                  files: b.files.map((f, j) =>
                    j === fi ? { ...f, status: "uploading" } : f,
                  ),
                },
          ),
        );

        try {
          const fd = new FormData();

          fd.append("title", entry.title.trim() || entry.file.name);
          fd.append("file", entry.file);

          // Always send description/content (backend requires it for Notes)
          const titleVal = entry.title.trim() || entry.file.name;
          fd.append("description", titleVal);
          if (batch.resourceType === "Note") fd.append("content", titleVal);

          // Price: only send if non-empty and non-zero (match working modal behaviour)
          if (batch.price) fd.append("price", batch.price);

          if (batch.curriculum)
            fd.append("education_level_id", batch.curriculum);
          if (batch.grade) fd.append("grade_id", batch.grade);
          if (batch.subject) fd.append("subject_id", batch.subject);
          if (batch.topic) fd.append("topic_id", batch.topic);

          if (batch.resourceType === "Exam" && batch.date)
            fd.append("date", batch.date);
          if (batch.resourceType === "PastPaper" && batch.year)
            fd.append("year", batch.year);
          await api.post(endpoints[batch.resourceType], fd);
          setBatches((prev) =>
            prev.map((b, i) =>
              i !== bi
                ? b
                : {
                    ...b,
                    files: b.files.map((f, j) =>
                      j === fi ? { ...f, status: "success" } : f,
                    ),
                  },
            ),
          );
        } catch (err) {
          console.error("400 detail:", err.response?.data);
          const msg = err.response?.data
            ? Object.values(err.response.data).flat().join(", ")
            : "Failed";
          setBatches((prev) =>
            prev.map((b, i) =>
              i !== bi
                ? b
                : {
                    ...b,
                    files: b.files.map((f, j) =>
                      j === fi ? { ...f, status: "error", error: msg } : f,
                    ),
                  },
            ),
          );
        }
      }
    }
    setUploading(false);
    onSuccess?.();
  };

  const clearAll = () => {
    setBatches([newBatch()]);
    setGlobalError("");
  };

  if (!isOpen) return null;

  const completedFiles = batches.reduce(
    (sum, b) => sum + b.files.filter((f) => f.status === "success").length,
    0,
  );
  const failedFiles = batches.reduce(
    (sum, b) => sum + b.files.filter((f) => f.status === "error").length,
    0,
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0a1220]/92 backdrop-blur-md" />

      {/* Modal sheet */}
      <div
        className="relative bg-[#111927] w-full max-w-4xl rounded-t-3xl md:rounded-[1.75rem] shadow-2xl flex flex-col border border-white/8 overflow-hidden"
        style={{ maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-6 md:px-8 py-5 border-b border-white/6 shrink-0">
          <div className="space-y-0.5">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400/80">
              Admin · Content Management
            </p>
            <h2 className="text-xl font-black text-white tracking-tight">
              Bulk Upload
            </h2>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Upload multiple files across multiple subjects in one session.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-0.5 shrink-0">
            <LimitsInfo />
            <div className="w-px h-4 bg-white/10" />
            <button
              onClick={onClose}
              className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Summary bar ────────────────────────────────────────────── */}
        {totalFiles > 0 && (
          <div className="px-6 md:px-8 py-4 border-b border-white/6 shrink-0">
            <SummaryPanel
              batches={batches}
              totalFiles={totalFiles}
              totalBytes={totalBytes}
              estimatedSec={estimatedSec}
              withinLimits={withinLimits}
            />
          </div>
        )}

        {/* ── Batch list ──────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-6 md:px-8 py-5 space-y-4 custom-scroll">
          {batches.map((batch, idx) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              batchIdx={idx}
              curricula={curricula}
              grades={grades}
              subjects={subjects}
              topics={topics}
              onUpdate={updateBatch}
              onRemove={removeBatch}
              onAddFiles={addFiles}
              onRemoveFile={removeFile}
              onTitleChange={changeTitle}
              totalBatches={batches.length}
            />
          ))}

          {batches.length < LIMITS.maxBatches ? (
            <button
              onClick={addBatch}
              className="w-full py-3.5 border border-dashed border-white/10 hover:border-blue-500/30 hover:bg-blue-500/[0.03] rounded-xl flex items-center justify-center gap-2 text-slate-600 hover:text-blue-400 text-[11px] font-bold uppercase tracking-widest transition-all"
            >
              <Plus size={14} /> Add Another Subject Batch
            </button>
          ) : (
            <p className="text-center text-[10px] font-black text-amber-500/70 uppercase tracking-widest py-2">
              Maximum of {LIMITS.maxBatches} batches reached
            </p>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div className="px-6 md:px-8 py-4 border-t border-white/6 bg-white/[0.01] shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Status indicators */}
            <div className="flex items-center gap-4 min-h-[20px]">
              {completedFiles > 0 && (
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                  <CheckCircle size={13} /> {completedFiles} uploaded
                </span>
              )}
              {failedFiles > 0 && (
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400">
                  <AlertCircle size={13} /> {failedFiles} failed
                </span>
              )}
              {globalError && (
                <span className="text-[11px] font-semibold text-rose-400">
                  {globalError}
                </span>
              )}
              {completedFiles === 0 && failedFiles === 0 && !globalError && (
                <span className="text-[10px] text-slate-700 uppercase tracking-widest font-bold">
                  {totalFiles > 0
                    ? `${totalFiles} file${totalFiles !== 1 ? "s" : ""} queued`
                    : "No files queued"}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={clearAll}
                disabled={uploading}
                className="flex-1 sm:flex-none px-4 py-2.5 text-[11px] font-bold text-slate-500 hover:text-slate-300 border border-white/8 hover:border-white/15 rounded-xl uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Clear All
              </button>
              <button
                onClick={() => {
                  /* save for later */
                }}
                disabled={uploading || totalFiles === 0}
                className="flex-1 sm:flex-none px-4 py-2.5 text-[11px] font-bold text-slate-400 hover:text-white border border-white/8 hover:border-white/15 rounded-xl uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Save for Later
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !withinLimits}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-black text-[11px] tracking-widest uppercase transition-all shadow-lg shadow-blue-900/25 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin shrink-0" size={14} />{" "}
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload size={14} className="shrink-0" /> Start Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scroll::-webkit-scrollbar       { width: 3px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>
    </div>
  );
}
