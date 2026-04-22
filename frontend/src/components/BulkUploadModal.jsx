// BulkUploadModal.jsx
// Drop-in replacement for the bulk mode section inside UploadResourceModal.jsx
// Usage: <BulkUploadModal isOpen={...} onClose={...} onSuccess={...} />

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X, Upload, Loader2, Plus, Trash2, FileText,
  CheckCircle, AlertCircle, Layers, ChevronDown,
  Info, Clock, HardDrive, Package, AlertTriangle,
} from "lucide-react";
import api from "../Api";

// ─── Constants (configurable by sysadmin in a real app) ────────────────────
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

// Estimate upload time: ~5 MB/s assumed
function estimateUploadTime(totalBytes) {
  return Math.ceil(totalBytes / (5 * 1024 * 1024));
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function LimitBar({ label, used, max, unit = "", warn = 0.8 }) {
  const pct = Math.min((used / max) * 100, 100);
  const isWarn = pct >= warn * 100;
  const isOver = used > max;
  return (
    <div className="flex items-center gap-3 min-w-0">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">{label}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden min-w-[60px]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isOver ? "bg-rose-500" : isWarn ? "bg-amber-400" : "bg-emerald-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[10px] font-black whitespace-nowrap ${isOver ? "text-rose-400" : isWarn ? "text-amber-400" : "text-slate-400"}`}>
        {used}{unit} / {max}{unit}
      </span>
    </div>
  );
}

function FileRow({ f, idx, onTitleChange, onRemove }) {
  const statusIcon = {
    pending:   null,
    uploading: <Loader2 size={13} className="animate-spin text-blue-400" />,
    success:   <CheckCircle size={13} className="text-emerald-400" />,
    error:     <AlertCircle size={13} className="text-rose-400" title={f.error} />,
  }[f.status];

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-colors group
      ${f.status === "success" ? "bg-emerald-500/5 border-emerald-500/10" :
        f.status === "error"   ? "bg-rose-500/5 border-rose-500/10" :
        "bg-[#0f172a] border-white/5 hover:border-white/10"}`}>
      <FileText size={14} className="text-slate-600 shrink-0" />
      <input
        value={f.title}
        onChange={(e) => onTitleChange(idx, e.target.value)}
        disabled={f.status === "uploading" || f.status === "success"}
        className="flex-1 bg-transparent border-none outline-none text-xs font-semibold text-white min-w-0 disabled:opacity-60"
      />
      <span className="text-[10px] text-slate-600 shrink-0">{formatBytes(f.file.size)}</span>
      {statusIcon}
      {f.status !== "success" && f.status !== "uploading" && (
        <button
          onClick={() => onRemove(idx)}
          className="p-1 opacity-0 group-hover:opacity-100 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all shrink-0"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}

function BatchCard({
  batch, batchIdx, curricula, grades, subjects, topics,
  onUpdate, onRemove, onAddFiles, onRemoveFile, onTitleChange,
  totalBatches,
}) {
  const fileInputRef = useRef(null);
  const totalSize = batch.files.reduce((sum, f) => sum + f.file.size, 0);
  const isOverFileLimit = batch.files.length > LIMITS.maxFilesPerBatch;

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    onAddFiles(batchIdx, dropped);
  }, [batchIdx, onAddFiles]);

  const handleFileSelect = (e) => {
    onAddFiles(batchIdx, Array.from(e.target.files));
    e.target.value = "";
  };

  return (
    <div className="bg-[#1a2744] border border-white/8 rounded-2xl overflow-hidden">
      {/* Batch header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/2">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-black">
            {batchIdx + 1}
          </span>
          <div>
            <p className="text-xs font-black text-white">
              {batch.subject
                ? (subjects.find(s => String(s.id) === String(batch.subject))?.name || "Subject")
                : "New Batch"}
            </p>
            <p className="text-[10px] text-slate-500">
              {batch.files.length} file{batch.files.length !== 1 ? "s" : ""} · {formatBytes(totalSize)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOverFileLimit && (
            <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full border border-amber-400/20">
              Over limit
            </span>
          )}
          <span className="text-[10px] font-black text-slate-600 bg-white/5 px-2 py-1 rounded-full">
            {formatBytes(totalSize)}
          </span>
          {totalBatches > 1 && (
            <button
              onClick={() => onRemove(batchIdx)}
              className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Metadata row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Resource type */}
          <div className="space-y-1.5 col-span-2 md:col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Type</label>
            <select
              value={batch.resourceType}
              onChange={(e) => onUpdate(batchIdx, "resourceType", e.target.value)}
              className="w-full bg-[#0f172a] border border-white/5 px-3 py-2 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500 transition-colors"
            >
              {RESOURCE_TYPES.map(t => (
                <option key={t} value={t}>{t === "PastPaper" ? "Past Paper" : t}</option>
              ))}
            </select>
          </div>

          {/* Curriculum — fully independent per batch */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Curriculum</label>
            <select
              value={batch.curriculum}
              onChange={(e) => onUpdate(batchIdx, "curriculum", e.target.value)}
              className="w-full bg-[#0f172a] border border-white/5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">Any</option>
              {curricula.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Grade */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Grade</label>
            <select
              value={batch.grade}
              onChange={(e) => onUpdate(batchIdx, "grade", e.target.value)}
              className="w-full bg-[#0f172a] border border-white/5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">Any</option>
              {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Subject</label>
            <select
              value={batch.subject}
              onChange={(e) => onUpdate(batchIdx, "subject", e.target.value)}
              className="w-full bg-[#0f172a] border border-white/5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">Any</option>
              {topics.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Second metadata row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Topic */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Topic</label>
            <select
              value={batch.topic}
              onChange={(e) => onUpdate(batchIdx, "topic", e.target.value)}
              className="w-full bg-[#0f172a] border border-white/5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">Any</option>
              {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* Base price */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Price (KSh)</label>
            <input
              type="number"
              value={batch.price}
              onChange={(e) => onUpdate(batchIdx, "price", e.target.value)}
              className="w-full bg-[#0f172a] border border-white/5 px-3 py-2 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500 transition-colors"
              placeholder="0"
              min="0"
            />
          </div>

          {/* Exam date */}
          {batch.resourceType === "Exam" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Exam Date</label>
              <input
                type="date"
                value={batch.date}
                onChange={(e) => onUpdate(batchIdx, "date", e.target.value)}
                className="w-full bg-[#0f172a] border border-white/5 px-3 py-2 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
              />
            </div>
          )}

          {/* Past paper year */}
          {batch.resourceType === "PastPaper" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Year</label>
              <input
                type="number"
                value={batch.year}
                onChange={(e) => onUpdate(batchIdx, "year", e.target.value)}
                className="w-full bg-[#0f172a] border border-white/5 px-3 py-2 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500 transition-colors"
                placeholder="2024"
                min="1990"
                max={new Date().getFullYear()}
              />
            </div>
          )}
        </div>

        {/* File list */}
        <div className="space-y-2">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="space-y-1.5"
          >
            {batch.files.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scroll">
                {batch.files.map((f, i) => (
                  <FileRow
                    key={i}
                    f={f}
                    idx={i}
                    onTitleChange={(idx, val) => onTitleChange(batchIdx, idx, val)}
                    onRemove={(idx) => onRemoveFile(batchIdx, idx)}
                  />
                ))}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/8 hover:border-blue-500/40 rounded-xl py-8 flex flex-col items-center gap-2 text-slate-600 cursor-pointer transition-colors"
              >
                <Upload size={24} className="opacity-40" />
                <p className="text-xs font-bold">Drop files here or click to browse</p>
              </div>
            )}
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors mt-1"
          >
            <Plus size={12} /> Add More Files
          </button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
        </div>
      </div>
    </div>
  );
}

// ─── Summary panel ───────────────────────────────────────────────────────────

function SummaryPanel({ batches, totalFiles, totalBytes, estimatedSec, withinLimits }) {
  const isWarn = estimatedSec > LIMITS.estimatedUploadMinutes * 60 * 0.8;
  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${withinLimits ? "bg-emerald-500/5 border-emerald-500/15" : "bg-rose-500/5 border-rose-500/15"}`}>
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Package, label: "Total Batches", value: `${batches.length} / ${LIMITS.maxBatches}`, over: batches.length > LIMITS.maxBatches },
          { icon: FileText, label: "Total Files", value: `${totalFiles} / ${LIMITS.maxFilesPerBatch * batches.length}`, over: false },
          { icon: HardDrive, label: "Total Size", value: `${formatBytes(totalBytes)} / 2 GB`, over: totalBytes > LIMITS.maxTotalSizeGB * 1024 ** 3 },
          { icon: Clock, label: "Est. Upload Time", value: formatDuration(estimatedSec), over: isWarn },
        ].map(({ icon: Icon, label, value, over }) => (
          <div key={label} className={`bg-white/3 rounded-xl p-3 border ${over ? "border-rose-500/20" : "border-white/5"}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon size={11} className={over ? "text-rose-400" : "text-slate-500"} />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</span>
            </div>
            <p className={`text-sm font-black ${over ? "text-rose-400" : "text-white"}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Limit bars */}
      <div className="space-y-2 pt-1">
        <LimitBar label="Total Size" used={Math.round(totalBytes / (1024 ** 3) * 10) / 10} max={LIMITS.maxTotalSizeGB} unit=" GB" />
        <LimitBar label="Batches" used={batches.length} max={LIMITS.maxBatches} />
      </div>

      {/* Status badge */}
      <div className={`flex items-center gap-2 pt-1 ${withinLimits ? "text-emerald-400" : "text-rose-400"}`}>
        {withinLimits ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
        <span className="text-[10px] font-black uppercase tracking-widest">
          {withinLimits ? "Within limits — ready to upload" : "Exceeds limits — please reduce before uploading"}
        </span>
      </div>
    </div>
  );
}

// ─── Limits info tooltip ────────────────────────────────────────────────────

function LimitsInfo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors"
      >
        <Info size={12} /> Upload Limits
      </button>
      {open && (
        <div className="absolute top-6 left-0 z-50 bg-[#0f172a] border border-white/10 rounded-2xl p-4 w-64 shadow-2xl space-y-1.5">
          {[
            ["Max total size", `${LIMITS.maxTotalSizeGB} GB`],
            ["Max file size", `${LIMITS.maxFileSizeMB} MB`],
            ["Max files per batch", `${LIMITS.maxFilesPerBatch}`],
            ["Max batches", `${LIMITS.maxBatches}`],
            ["Est. timeout", `${LIMITS.estimatedUploadMinutes} min`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-xs">
              <span className="text-slate-500">{k}</span>
              <span className="font-black text-white">{v}</span>
            </div>
          ))}
          <p className="text-[10px] text-slate-600 pt-1 border-t border-white/5 mt-2">
            Note: These limits are configurable by the system administrator.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

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
    .replace(/\b\w/g, c => c.toUpperCase());
}

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

  // ── Derived stats ────────────────────────────────────────────────────────
  const totalFiles = batches.reduce((sum, b) => sum + b.files.length, 0);
  const totalBytes = batches.reduce((sum, b) => sum + b.files.reduce((s, f) => s + f.file.size, 0), 0);
  const estimatedSec = estimateUploadTime(totalBytes);
  const anyOverFileLimit = batches.some(b => b.files.length > LIMITS.maxFilesPerBatch);
  const anyOverSingleFile = batches.some(b => b.files.some(f => f.file.size > LIMITS.maxFileSizeMB * 1024 * 1024));
  const withinLimits =
    batches.length <= LIMITS.maxBatches &&
    totalBytes <= LIMITS.maxTotalSizeGB * 1024 ** 3 &&
    !anyOverFileLimit &&
    !anyOverSingleFile &&
    totalFiles > 0;

  // ── Batch mutations ──────────────────────────────────────────────────────
  const addBatch = () => {
    if (batches.length >= LIMITS.maxBatches) return;
    setBatches(prev => [...prev, newBatch()]);
  };

  const removeBatch = (idx) => {
    setBatches(prev => prev.filter((_, i) => i !== idx));
  };

  const updateBatch = (idx, key, val) => {
    setBatches(prev => prev.map((b, i) => i === idx ? { ...b, [key]: val } : b));
  };

  const addFiles = useCallback((batchIdx, newFiles) => {
    setBatches(prev => prev.map((b, i) => {
      if (i !== batchIdx) return b;
      const mapped = newFiles.map(f => ({
        file: f,
        title: titleFromFilename(f.name),
        status: "pending",
        error: "",
      }));
      return { ...b, files: [...b.files, ...mapped] };
    }));
  }, []);

  const removeFile = (batchIdx, fileIdx) => {
    setBatches(prev => prev.map((b, i) => {
      if (i !== batchIdx) return b;
      return { ...b, files: b.files.filter((_, fi) => fi !== fileIdx) };
    }));
  };

  const changeTitle = (batchIdx, fileIdx, val) => {
    setBatches(prev => prev.map((b, i) => {
      if (i !== batchIdx) return b;
      const files = b.files.map((f, fi) => fi === fileIdx ? { ...f, title: val } : f);
      return { ...b, files };
    }));
  };

  // ── Upload ───────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!withinLimits) return;
    setUploading(true);
    setGlobalError("");

    const endpoints = {
      Note:      "resources/notes/",
      Exam:      "resources/exams/",
      PastPaper: "resources/past-papers/",
    };

    for (let bi = 0; bi < batches.length; bi++) {
      const batch = batches[bi];
      for (let fi = 0; fi < batch.files.length; fi++) {
        const entry = batch.files[fi];
        if (entry.status === "success") continue;

        setBatches(prev => prev.map((b, i) => {
          if (i !== bi) return b;
          return { ...b, files: b.files.map((f, j) => j === fi ? { ...f, status: "uploading" } : f) };
        }));

        try {
          const fd = new FormData();
          fd.append("title", entry.title);
          fd.append("file", entry.file);
          if (batch.price)      fd.append("price", batch.price);
          if (batch.curriculum) fd.append("education_level_id", batch.curriculum);
          if (batch.grade)      fd.append("grade_id", batch.grade);
          if (batch.subject)    fd.append("subject_id", batch.subject);
          if (batch.topic)      fd.append("topic_id", batch.topic);
          if (batch.resourceType === "Exam"      && batch.date) fd.append("date", batch.date);
          if (batch.resourceType === "PastPaper" && batch.year) fd.append("year", batch.year);

          await api.post(endpoints[batch.resourceType], fd);

          setBatches(prev => prev.map((b, i) => {
            if (i !== bi) return b;
            return { ...b, files: b.files.map((f, j) => j === fi ? { ...f, status: "success" } : f) };
          }));
        } catch (err) {
          const msg = err.response?.data
            ? Object.values(err.response.data).flat().join(", ")
            : "Failed";
          setBatches(prev => prev.map((b, i) => {
            if (i !== bi) return b;
            return { ...b, files: b.files.map((f, j) => j === fi ? { ...f, status: "error", error: msg } : f) };
          }));
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

  const completedFiles = batches.reduce((sum, b) => sum + b.files.filter(f => f.status === "success").length, 0);
  const failedFiles = batches.reduce((sum, b) => sum + b.files.filter(f => f.status === "error").length, 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-[#0f172a]/90 backdrop-blur-md" />

      <div
        className="relative bg-[#131c31] w-full max-w-4xl rounded-[2rem] overflow-hidden shadow-2xl flex flex-col border border-white/8"
        style={{ maxHeight: "92vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-7 py-5 border-b border-white/5 bg-white/1 shrink-0">
          <div>
            <p className="text-blue-400 text-[9px] font-black uppercase tracking-[0.25em] mb-1">Admin · Content Management</p>
            <h2 className="text-xl font-black text-white">Bulk Upload</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload multiple files for multiple subjects in one session. Add as many subjects and files as you need before starting the upload.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <LimitsInfo />
            <button onClick={onClose} className="p-2.5 bg-white/5 text-slate-400 rounded-full hover:bg-white/10 transition-colors ml-3">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Summary ────────────────────────────────────────────────────── */}
        {totalFiles > 0 && (
          <div className="px-7 py-4 border-b border-white/5 shrink-0">
            <SummaryPanel
              batches={batches}
              totalFiles={totalFiles}
              totalBytes={totalBytes}
              estimatedSec={estimatedSec}
              withinLimits={withinLimits}
            />
          </div>
        )}

        {/* ── Batch list ─────────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-7 py-5 space-y-5">
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

          {/* Add batch button */}
          {batches.length < LIMITS.maxBatches && (
            <button
              onClick={addBatch}
              className="w-full py-4 border-2 border-dashed border-white/8 hover:border-blue-500/30 rounded-2xl flex items-center justify-center gap-2 text-slate-500 hover:text-blue-400 text-xs font-black uppercase tracking-widest transition-all"
            >
              <Plus size={16} /> Add Another Subject Batch
            </button>
          )}
          {batches.length >= LIMITS.maxBatches && (
            <p className="text-center text-[10px] font-black text-amber-400 uppercase tracking-widest">
              Maximum batch limit reached ({LIMITS.maxBatches})
            </p>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="px-7 py-5 border-t border-white/5 bg-white/1 shrink-0 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Progress / error */}
          <div className="flex items-center gap-4 text-xs">
            {completedFiles > 0 && (
              <span className="flex items-center gap-1.5 text-emerald-400 font-black">
                <CheckCircle size={13} /> {completedFiles} uploaded
              </span>
            )}
            {failedFiles > 0 && (
              <span className="flex items-center gap-1.5 text-rose-400 font-black">
                <AlertCircle size={13} /> {failedFiles} failed
              </span>
            )}
            {globalError && <span className="text-rose-400 font-semibold">{globalError}</span>}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={clearAll}
              disabled={uploading}
              className="px-5 py-3 text-xs font-black text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-2xl uppercase tracking-widest transition-all disabled:opacity-40"
            >
              Clear All
            </button>
            <button
              onClick={() => {/* save for later: could serialize to localStorage */}}
              disabled={uploading || totalFiles === 0}
              className="px-5 py-3 text-xs font-black text-slate-300 hover:text-white border border-white/10 hover:border-white/20 rounded-2xl uppercase tracking-widest transition-all disabled:opacity-40"
            >
              Save for Later
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || !withinLimits}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xs tracking-widest uppercase transition-all shadow-xl shadow-blue-900/30 flex items-center gap-2"
            >
              {uploading
                ? <><Loader2 className="animate-spin" size={15} /> Uploading…</>
                : <><Upload size={15} /> Start Upload</>}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
}