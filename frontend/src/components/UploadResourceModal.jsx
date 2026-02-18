// src/components/UploadResourceModal.jsx
import React, { useState, useEffect } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import api from "../Api";

export default function UploadResourceModal({ isOpen, onClose, onSuccess }) {
  const [resourceType, setResourceType] = useState("Note");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  
  // Dropdowns data
  const [curricula, setCurricula] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Selected values
  const [curriculum, setCurriculum] = useState("");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("");
  
  // PastPaper specific
  const [year, setYear] = useState("");
  
  // Exam specific
  const [date, setDate] = useState("");
  
  // News specific
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // Fetch dropdown options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [currRes, gradeRes, subjRes, topicRes, catRes] = await Promise.all([
          api.get("resources/education-levels/"),
          api.get("resources/grades/"),
          api.get("resources/subjects/"),
          api.get("resources/topics/"),
          api.get("resources/news-categories/"),
        ]);
        
        setCurricula(currRes.data || []);
        setGrades(gradeRes.data || []);
        setSubjects(subjRes.data || []);
        setTopics(topicRes.data || []);
        setCategories(catRes.data || []);
      } catch (err) {
        console.error("Failed to fetch dropdown options:", err);
      }
    };
    
    if (isOpen) fetchOptions();
  }, [isOpen]);

  const resetForm = () => {
    setResourceType("Note");
    setTitle("");
    setFile(null);
    setPrice("");
    setDescription("");
    setCurriculum("");
    setGrade("");
    setSubject("");
    setTopic("");
    setCategory("");
    setYear("");
    setDate("");
    setHeadline("");
    setBody("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validation
    if (resourceType === "News") {
      if (!headline || !body) {
        setError("Headline and body are required for news.");
        return;
      }
    } else {
      if (!title || !file) {
        setError("Title and file are required.");
        return;
      }
    }
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      
      if (resourceType === "News") {
        formData.append("headline", headline);
        formData.append("body", body);
        if (category) formData.append("category_id", category);
        if (file) formData.append("file", file);
      } else {
        formData.append("title", title);
        formData.append("file", file);
        if (price) formData.append("price", price);
        if (curriculum) formData.append("education_level_id", curriculum);
        if (grade) formData.append("grade_id", grade);
        if (subject) formData.append("subject_id", subject);
        if (topic) formData.append("topic_id", topic);
        
        if (resourceType === "Note" && description) {
          formData.append("content", description);
        }
        
        if (resourceType === "Exam") {
          if (date) formData.append("date", date);
          if (description) formData.append("description", description);
        }
        
        if (resourceType === "PastPaper" && year) {
          formData.append("year", year);
        }
      }
      
      const endpoints = {
        Note: "resources/notes/",
        Exam: "resources/exams/",
        PastPaper: "resources/past-papers/",
        News: "resources/news/",
      };
      
      await api.post(endpoints[resourceType], formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Upload failed:", err);
      setError(err.response?.data?.error || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0b1220] border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Upload Resource</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Resource Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Resource Type</label>
            <select
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition"
            >
              <option value="Note">Note</option>
              <option value="Exam">Exam</option>
              <option value="PastPaper">Past Paper</option>
              <option value="News">News</option>
            </select>
          </div>

          {/* News-specific fields */}
          {resourceType === "News" ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Headline *</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition"
                  placeholder="Breaking: New policy announced..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Body *</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition resize-none"
                  placeholder="Write the full news article here..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition"
                >
                  <option value="">Select category (optional)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Featured Image (optional)</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  accept="image/*"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-400 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </>
          ) : (
            <>
              {/* Common fields for Note/Exam/PastPaper */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition"
                  placeholder="e.g., Algebra Notes"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Curriculum</label>
                  <select
                    value={curriculum}
                    onChange={(e) => setCurriculum(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition"
                  >
                    <option value="">Select...</option>
                    {curricula.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Grade</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition"
                  >
                    <option value="">Select...</option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition"
                  >
                    <option value="">Select...</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Topic</label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition"
                  >
                    <option value="">Select...</option>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {resourceType === "PastPaper" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition"
                    placeholder="e.g., 2023"
                  />
                </div>
              )}

              {resourceType === "Exam" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Exam Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Price (KSh)</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition"
                  placeholder="0.00 for free"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition resize-none"
                  placeholder="Optional description..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">File *</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  accept=".pdf,.doc,.docx"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-400 focus:outline-none focus:border-cyan-500 transition"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Accepted: PDF, DOC, DOCX</p>
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 px-4 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Upload
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}