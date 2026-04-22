// src/components/UploadResourceModal.jsx
import React, { useState, useEffect } from "react";
import {
  X, Upload, Loader2, CheckCircle, AlertCircle, DollarSign, Layers,
} from "lucide-react";
import api from "../Api";

export default function UploadResourceModal({ isOpen, onClose, onSuccess, editResource, onOpenBulk }) {
  // ── Single upload state ──────────────────────────────────────────────────
  const [resourceType, setResourceType] = useState("Note");
  const [title,        setTitle]        = useState("");
  const [file,         setFile]         = useState(null);
  const [price,        setPrice]        = useState("");
  const [description,  setDescription]  = useState("");
  const [year,         setYear]         = useState("");
  const [date,         setDate]         = useState("");
  const [headline,     setHeadline]     = useState("");
  const [body,         setBody]         = useState("");
  const [uploading,    setUploading]    = useState(false);
  const [error,        setError]        = useState("");

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
        if (file)       fd.append("file", file);
        if (price)      fd.append("price", price);
        if (curriculum) fd.append("education_level_id", curriculum);
        if (grade)      fd.append("grade_id", grade);
        if (subject)    fd.append("subject_id", subject);
        if (topic)      fd.append("topic_id", topic);
        fd.append("description", description);
        if (resourceType === "Note") fd.append("content", description);
        if (resourceType === "Exam" && date) fd.append("date", date);
        if ((resourceType === "PastPaper" || resourceType === "Past Paper") && year)
          fd.append("year", year);
      }

      const endpoints = {
        Note: "resources/notes/", Exam: "resources/exams/",
        PastPaper: "resources/past-papers/", "Past Paper": "resources/past-papers/",
        News: "resources/news/",
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

  if (!isOpen) return null;

  const inputCls  = "w-full bg-[#0f172a] border border-white/5 p-4 rounded-2xl focus:border-blue-500 outline-none text-white text-sm font-bold transition-colors";
  const selectCls = "w-full bg-[#0f172a] border border-white/5 p-3 rounded-xl text-xs font-bold text-slate-300 outline-none focus:border-blue-500 transition-colors";
  const labelCls  = "text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-[#0f172a]/90 backdrop-blur-md" />

      <div
        className="relative bg-[#1e293b] w-full max-w-3xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="p-7 pb-4 flex justify-between items-start border-b border-white/5 shrink-0">
          <div>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Administrative Action</p>
            <h2 className="text-2xl font-black text-white">
              {editResource ? "Update Resource" : "Add Content"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Bulk upload shortcut — only visible when not editing */}
            {!editResource && onOpenBulk && (
              <button
                onClick={() => { onClose(); onOpenBulk(); }}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/8 hover:border-blue-500/30 text-slate-300 hover:text-blue-300 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <Layers size={13} />
                Bulk Upload
              </button>
            )}
            <button
              onClick={onClose}
              className="p-3 bg-white/5 text-slate-400 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── Scrollable form body ────────────────────────────────────────── */}
        <div className="p-7 pt-5 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Resource Type Pills */}
            <div className="grid grid-cols-4 gap-2 bg-[#0f172a] p-1.5 rounded-2xl border border-white/5">
              {["Note", "Exam", "PastPaper", "News"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setResourceType(type)}
                  disabled={!!editResource}
                  className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all
                    ${resourceType === type
                      ? "bg-[#1e293b] text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-400 disabled:cursor-not-allowed"}`}
                >
                  {type === "PastPaper" ? "Past Paper" : type}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ── Left column ──────────────────────────────────────────── */}
              <div className="space-y-4">

                {/* Title / Headline */}
                <div className="space-y-2">
                  <label className={labelCls}>{resourceType === "News" ? "Headline" : "Title"} *</label>
                  <input
                    value={resourceType === "News" ? headline : title}
                    onChange={(e) => resourceType === "News" ? setHeadline(e.target.value) : setTitle(e.target.value)}
                    className={inputCls}
                    placeholder={resourceType === "News" ? "e.g. New Curriculum Update" : "e.g. Calculus Introduction"}
                    required
                  />
                </div>

                {/* Curriculum + Grade */}
                {resourceType !== "News" && (
                  <div className="grid grid-cols-2 gap-3">
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
                  <div className="grid grid-cols-2 gap-3">
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
                        className="w-full bg-[#0f172a] border border-white/5 pl-10 pr-4 py-4 rounded-2xl focus:border-emerald-500 outline-none text-white text-sm font-bold transition-colors"
                        placeholder="0.00"
                        min="0"
                      />
                    </div>
                  </div>
                )}

                {/* Exam date */}
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

              {/* ── Right column ─────────────────────────────────────────── */}
              <div className="space-y-4">

                {/* Description (Note / Exam / PastPaper) */}
                {resourceType !== "News" && (
                  <div className="space-y-2">
                    <label className={labelCls}>Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className="w-full bg-[#0f172a] border border-white/5 p-4 rounded-2xl focus:border-blue-500 outline-none text-white text-xs leading-relaxed transition-colors resize-none"
                      placeholder="Describe what this resource covers — students see this before purchasing."
                    />
                  </div>
                )}

                {/* News body */}
                {resourceType === "News" && (
                  <div className="space-y-2">
                    <label className={labelCls}>Body *</label>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={5}
                      required
                      className="w-full bg-[#0f172a] border border-white/5 p-4 rounded-2xl focus:border-blue-500 outline-none text-white text-xs leading-relaxed transition-colors resize-none"
                      placeholder="Full news content..."
                    />
                  </div>
                )}

                {/* File upload */}
                <div className="space-y-2">
                  <label className={labelCls}>
                    File Upload{editResource ? " (leave empty to keep existing)" : ""}
                  </label>
                  <div className="relative group">
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full bg-blue-600/5 border-2 border-dashed border-blue-600/20 group-hover:border-blue-500/40 p-6 rounded-2xl flex flex-col items-center justify-center transition-all">
                      <Upload size={20} className="text-blue-500 mb-2" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate max-w-full px-2 text-center">
                        {file ? file.name : "Choose or drag file"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                <p className="text-rose-300 text-xs font-medium">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={uploading}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-3xl font-black text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-900/20"
            >
              {uploading
                ? <Loader2 className="animate-spin" size={18} />
                : <CheckCircle size={18} />}
              {editResource ? "Confirm Update" : "Finalize Upload"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}