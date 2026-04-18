// src/components/UploadResourceModal.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  X, Upload, Loader2, Plus, Trash2, FileText,
  CheckCircle, AlertCircle, Layers, DollarSign,
} from "lucide-react";
import api from "../Api";

export default function UploadResourceModal({ isOpen, onClose, onSuccess, editResource }) {
  const [uploadMode, setUploadMode] = useState("single");

  // ── Single upload state ──────────────────────────────────────────────────
  const [resourceType, setResourceType] = useState("Note");
  const [title,       setTitle]       = useState("");
  const [file,        setFile]        = useState(null);
  const [price,       setPrice]       = useState("");
  const [description, setDescription] = useState("");
  const [year,        setYear]        = useState("");
  const [date,        setDate]        = useState("");   // always YYYY-MM-DD from type="date"
  const [headline,    setHeadline]    = useState("");
  const [body,        setBody]        = useState("");
  const [uploading,   setUploading]   = useState(false);
  const [error,       setError]       = useState("");

  // ── Bulk upload state ────────────────────────────────────────────────────
  const [bulkResourceType, setBulkResourceType] = useState("Note");
  const [bulkCurriculum,   setBulkCurriculum]   = useState("");
  const [bulkGrade,        setBulkGrade]        = useState("");
  const [bulkSubject,      setBulkSubject]      = useState("");
  const [bulkTopic,        setBulkTopic]        = useState("");
  const [bulkPrice,        setBulkPrice]        = useState("0");
  const [bulkYear,         setBulkYear]         = useState("");
  const [bulkDate,         setBulkDate]         = useState("");
  const [bulkFiles,        setBulkFiles]        = useState([]);
  const [bulkUploading,    setBulkUploading]    = useState(false);
  const [bulkError,        setBulkError]        = useState("");
  const bulkFileRef = useRef(null);

  // ── Shared dropdown state ────────────────────────────────────────────────
  const [curricula,  setCurricula]  = useState([]);
  const [grades,     setGrades]     = useState([]);
  const [subjects,   setSubjects]   = useState([]);
  const [topics,     setTopics]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [curriculum, setCurriculum] = useState("");
  const [grade,      setGrade]      = useState("");
  const [subject,    setSubject]    = useState("");
  const [topic,      setTopic]      = useState("");
  const [category,   setCategory]   = useState("");

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const [currRes, gradeRes, subjRes, topicRes, catRes] = await Promise.all([
          api.get("resources/education-levels/"),
          api.get("resources/grades/"),
          api.get("resources/subjects/"),
          api.get("resources/topics/"),
          api.get("resources/news-categories/"),
        ]);
        setCurricula(currRes.data   || []);
        setGrades(gradeRes.data     || []);
        setSubjects(subjRes.data    || []);
        setTopics(topicRes.data     || []);
        setCategories(catRes.data   || []);
      } catch (err) { console.error(err); }
    })();
  }, [isOpen]);

  useEffect(() => {
    if (editResource && isOpen) {
      setUploadMode("single");
      setResourceType(editResource.type);
      setTitle(editResource.title || editResource.headline || "");
      setPrice(editResource.price || "");
      setDescription(editResource.description || editResource.content || "");
      if (editResource.type === "Exam")       setDate(editResource.date || "");
      if (editResource.type === "News")       { setHeadline(editResource.headline || ""); setBody(editResource.body || ""); }
      if (editResource.type === "PastPaper" ||
          editResource.type === "Past Paper") setYear(editResource.year || "");
    } else if (!editResource && isOpen) {
      resetForm();
    }
  }, [editResource, isOpen]);

  const resetForm = () => {
    setResourceType("Note"); setTitle(""); setFile(null);
    setPrice(""); setDescription(""); setCurriculum("");
    setGrade(""); setSubject(""); setTopic(""); setCategory("");
    setYear(""); setDate(""); setHeadline(""); setBody(""); setError("");
    setBulkFiles([]); setBulkResourceType("Note"); setBulkError("");
  };

  const titleFromFilename = (filename) =>
    filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const handleBulkFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    setBulkFiles((prev) => [
      ...prev,
      ...selected.map((f) => ({ file: f, title: titleFromFilename(f.name), status: "pending", error: "" })),
    ]);
    e.target.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      if (resourceType === "News") {
        fd.append("headline", headline);
        fd.append("body", body);
        if (category) fd.append("category_id", category);
        if (file)     fd.append("file", file);
      } else {
        fd.append("title", title);
        if (file)        fd.append("file", file);
        if (price)       fd.append("price", price);
        if (curriculum)  fd.append("education_level_id", curriculum);
        if (grade)       fd.append("grade_id", grade);
        if (subject)     fd.append("subject_id", subject);
        if (topic)       fd.append("topic_id", topic);

        // description field — all three resource types now have it
        fd.append("description", description);

        // Note also needs content (the main body field on the model)
        if (resourceType === "Note") fd.append("content", description);

        // Exam-specific: date (YYYY-MM-DD enforced by type="date" input)
        if (resourceType === "Exam" && date) fd.append("date", date);

        // PastPaper-specific: year
        if ((resourceType === "PastPaper" || resourceType === "Past Paper") && year)
          fd.append("year", year);
      }

      const endpoints = {
        Note:        "resources/notes/",
        Exam:        "resources/exams/",
        PastPaper:   "resources/past-papers/",
        "Past Paper":"resources/past-papers/",
        News:        "resources/news/",
      };

      if (editResource)
        await api.patch(`${endpoints[resourceType]}${editResource.id}/`, fd);
      else
        await api.post(endpoints[resourceType], fd);

      onSuccess();
      onClose();
    } catch (err) {
      const detail = err.response?.data;
      const msg = detail
        ? Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ")
        : "Upload failed. Please check your inputs.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleBulkSubmit = async () => {
    setBulkUploading(true);
    const endpoints = {
      Note:      "resources/notes/",
      Exam:      "resources/exams/",
      PastPaper: "resources/past-papers/",
    };
    for (let i = 0; i < bulkFiles.length; i++) {
      if (bulkFiles[i].status === "success") continue;
      setBulkFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: "uploading" } : f));
      try {
        const fd = new FormData();
        fd.append("title", bulkFiles[i].title);
        fd.append("file",  bulkFiles[i].file);
        if (bulkPrice)     fd.append("price",              bulkPrice);
        if (bulkCurriculum)fd.append("education_level_id", bulkCurriculum);
        if (bulkGrade)     fd.append("grade_id",           bulkGrade);
        if (bulkSubject)   fd.append("subject_id",         bulkSubject);
        if (bulkTopic)     fd.append("topic_id",           bulkTopic);
        if (bulkResourceType === "Exam"      && bulkDate) fd.append("date", bulkDate);
        if (bulkResourceType === "PastPaper" && bulkYear) fd.append("year", bulkYear);
        await api.post(endpoints[bulkResourceType], fd);
        setBulkFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: "success" } : f));
      } catch {
        setBulkFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: "error", error: "Failed" } : f));
      }
    }
    setBulkUploading(false);
    onSuccess();
  };

  if (!isOpen) return null;

  // ── Input class helpers ──────────────────────────────────────────────────
  const inputCls = "w-full bg-[#0f172a] border border-white/5 p-4 rounded-2xl focus:border-blue-500 outline-none text-white text-sm font-bold";
  const selectCls = "w-full bg-[#0f172a] border border-white/5 p-3 rounded-xl text-xs font-bold text-slate-300 outline-none";
  const labelCls = "text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-[#0f172a]/90 backdrop-blur-md" />

      <div
        className="relative bg-[#1e293b] w-full max-w-3xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-center border-b border-white/5">
          <div>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Administrative Action</p>
            <h2 className="text-2xl font-black text-white">{editResource ? "Update Resource" : "Add Content"}</h2>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 text-slate-400 rounded-full hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        {!editResource && (
          <div className="flex px-8 mt-4 gap-2">
            {["single", "bulk"].map((mode) => (
              <button
                key={mode}
                onClick={() => setUploadMode(mode)}
                className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${uploadMode === mode ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-300"}`}
              >
                {mode} Mode
              </button>
            ))}
          </div>
        )}

        <div className="p-8 pt-6 overflow-y-auto">
          {uploadMode === "single" ? (
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Resource Type Pills */}
              <div className="grid grid-cols-4 gap-2 bg-[#0f172a] p-1.5 rounded-2xl border border-white/5">
                {["Note", "Exam", "PastPaper", "News"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setResourceType(type)}
                    disabled={!!editResource}
                    className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${resourceType === type ? "bg-[#1e293b] text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-400"}`}
                  >
                    {type === "PastPaper" ? "Past Paper" : type}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column */}
                <div className="space-y-4">

                  {/* Title / Headline */}
                  <div className="space-y-2">
                    <label className={labelCls}>{resourceType === "News" ? "Headline" : "Title"}</label>
                    <input
                      value={resourceType === "News" ? headline : title}
                      onChange={(e) => resourceType === "News" ? setHeadline(e.target.value) : setTitle(e.target.value)}
                      className={inputCls}
                      placeholder={resourceType === "News" ? "e.g. New Curriculum Update" : "e.g. Calculus Introduction"}
                    />
                  </div>

                  {/* Curriculum + Grade */}
                  {resourceType !== "News" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className={labelCls}>Curriculum</label>
                        <select value={curriculum} onChange={(e) => setCurriculum(e.target.value)} className={selectCls}>
                          <option value="">Select...</option>
                          {curricula.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className={labelCls}>Grade</label>
                        <select value={grade} onChange={(e) => setGrade(e.target.value)} className={selectCls}>
                          <option value="">Select...</option>
                          {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Subject + Topic */}
                  {resourceType !== "News" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className={labelCls}>Subject</label>
                        <select value={subject} onChange={(e) => setSubject(e.target.value)} className={selectCls}>
                          <option value="">Select...</option>
                          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className={labelCls}>Topic</label>
                        <select value={topic} onChange={(e) => setTopic(e.target.value)} className={selectCls}>
                          <option value="">Select...</option>
                          {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* News category */}
                  {resourceType === "News" && (
                    <div className="space-y-2">
                      <label className={labelCls}>Category</label>
                      <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
                        <option value="">Select...</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Price */}
                  {resourceType !== "News" && (
                    <div className="space-y-2">
                      <label className={labelCls}>Pricing (KSh)</label>
                      <div className="relative">
                        <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="w-full bg-[#0f172a] border border-white/5 pl-10 pr-4 py-4 rounded-2xl focus:border-emerald-500 outline-none text-white text-sm font-bold"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}

                  {/* Exam date — type="date" guarantees YYYY-MM-DD */}
                  {resourceType === "Exam" && (
                    <div className="space-y-2">
                      <label className={labelCls}>Exam Date</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={inputCls + " [color-scheme:dark]"}
                      />
                    </div>
                  )}

                  {/* Past Paper year */}
                  {(resourceType === "PastPaper" || resourceType === "Past Paper") && (
                    <div className="space-y-2">
                      <label className={labelCls}>Year</label>
                      <input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className={inputCls}
                        placeholder="e.g. 2023"
                        min="1990"
                        max={new Date().getFullYear()}
                      />
                    </div>
                  )}
                </div>

                {/* Right column */}
                <div className="space-y-4">

                  {/* Description — shown for Note, Exam, PastPaper */}
                  {resourceType !== "News" && (
                    <div className="space-y-2">
                      <label className={labelCls}>Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={5}
                        className="w-full bg-[#0f172a] border border-white/5 p-4 rounded-2xl focus:border-blue-500 outline-none text-white text-xs leading-relaxed"
                        placeholder="Describe what this resource covers — students see this before purchasing."
                      />
                    </div>
                  )}

                  {/* News body */}
                  {resourceType === "News" && (
                    <div className="space-y-2">
                      <label className={labelCls}>Body</label>
                      <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={5}
                        className="w-full bg-[#0f172a] border border-white/5 p-4 rounded-2xl focus:border-blue-500 outline-none text-white text-xs leading-relaxed"
                        placeholder="Full news content..."
                      />
                    </div>
                  )}

                  {/* File Upload */}
                  <div className="space-y-2">
                    <label className={labelCls}>File Upload</label>
                    <div className="relative group">
                      <input
                        type="file"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-full bg-blue-600/5 border-2 border-dashed border-blue-600/20 group-hover:border-blue-500/50 p-6 rounded-2xl flex flex-col items-center justify-center transition-all">
                        <Upload size={20} className="text-blue-500 mb-2" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate max-w-full">
                          {file ? file.name : "Choose or drag file"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                  <AlertCircle size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
                  <p className="text-rose-300 text-xs font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-black text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-900/20"
              >
                {uploading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                {editResource ? "Confirm Update" : "Finalize Upload"}
              </button>
            </form>
          ) : (
            /* ── Bulk Mode ─────────────────────────────────────────────── */
            <div className="space-y-8">
              <div className="bg-[#0f172a] p-6 rounded-3xl border border-white/5 grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className={labelCls}>Bulk Type</label>
                  <select value={bulkResourceType} onChange={(e) => setBulkResourceType(e.target.value)}
                    className="w-full bg-[#1e293b] border border-white/5 p-3 rounded-xl text-xs font-bold text-white outline-none">
                    <option value="Note">Notes</option>
                    <option value="Exam">Exams</option>
                    <option value="PastPaper">Past Papers</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>Curriculum</label>
                  <select value={bulkCurriculum} onChange={(e) => setBulkCurriculum(e.target.value)}
                    className="w-full bg-[#1e293b] border border-white/5 p-3 rounded-xl text-xs font-bold text-slate-400 outline-none">
                    <option value="">Select...</option>
                    {curricula.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>Grade</label>
                  <select value={bulkGrade} onChange={(e) => setBulkGrade(e.target.value)}
                    className="w-full bg-[#1e293b] border border-white/5 p-3 rounded-xl text-xs font-bold text-slate-400 outline-none">
                    <option value="">Select...</option>
                    {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>Subject</label>
                  <select value={bulkSubject} onChange={(e) => setBulkSubject(e.target.value)}
                    className="w-full bg-[#1e293b] border border-white/5 p-3 rounded-xl text-xs font-bold text-slate-400 outline-none">
                    <option value="">Select...</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>Base Price</label>
                  <input type="number" value={bulkPrice} onChange={(e) => setBulkPrice(e.target.value)}
                    className="w-full bg-[#1e293b] border border-white/5 p-3 rounded-xl text-xs font-bold text-white outline-none" placeholder="0.00" />
                </div>
                {bulkResourceType === "Exam" && (
                  <div className="space-y-2">
                    <label className={labelCls}>Exam Date</label>
                    <input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)}
                      className="w-full bg-[#1e293b] border border-white/5 p-3 rounded-xl text-xs font-bold text-white outline-none [color-scheme:dark]" />
                  </div>
                )}
                {bulkResourceType === "PastPaper" && (
                  <div className="space-y-2">
                    <label className={labelCls}>Year</label>
                    <input type="number" value={bulkYear} onChange={(e) => setBulkYear(e.target.value)}
                      className="w-full bg-[#1e293b] border border-white/5 p-3 rounded-xl text-xs font-bold text-white outline-none"
                      placeholder="2023" min="1990" max={new Date().getFullYear()} />
                  </div>
                )}
              </div>

              {/* File Queue */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Layers size={14} /> File Queue ({bulkFiles.length})
                  </h4>
                  <button onClick={() => bulkFileRef.current.click()}
                    className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300">
                    + Add Files
                  </button>
                  <input ref={bulkFileRef} type="file" multiple className="hidden" onChange={handleBulkFileSelect} />
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {bulkFiles.length > 0 ? bulkFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-[#0f172a] rounded-2xl border border-white/5 group">
                      <FileText size={20} className="text-slate-600" />
                      <input
                        value={f.title}
                        onChange={(e) => { const nf = [...bulkFiles]; nf[i].title = e.target.value; setBulkFiles(nf); }}
                        className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-white"
                      />
                      {f.status === "uploading" && <Loader2 size={14} className="animate-spin text-blue-500" />}
                      {f.status === "success"   && <CheckCircle size={14} className="text-emerald-500" />}
                      {f.status === "error"     && <AlertCircle size={14} className="text-rose-500" title={f.error} />}
                      <button onClick={() => setBulkFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        className="p-2 opacity-0 group-hover:opacity-100 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )) : (
                    <div className="py-12 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center text-slate-600">
                      <Upload size={32} className="mb-2 opacity-20" />
                      <p className="text-xs font-bold">Queue is empty</p>
                    </div>
                  )}
                </div>
              </div>

              {bulkError && (
                <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                  <AlertCircle size={16} className="text-rose-400" />
                  <p className="text-rose-300 text-xs font-medium">{bulkError}</p>
                </div>
              )}

              <button
                onClick={handleBulkSubmit}
                disabled={bulkUploading || bulkFiles.length === 0}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-3xl font-black text-xs tracking-widest uppercase transition-all shadow-xl shadow-emerald-900/20"
              >
                {bulkUploading ? <Loader2 className="animate-spin inline mr-2" size={18} /> : null}
                Process {bulkFiles.length} Upload{bulkFiles.length !== 1 ? "s" : ""}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}