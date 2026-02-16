import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import api from "../Api";

export default function UploadResourceModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    resourceType: "notes",
    title: "",
    content: "",
    description: "",
    year: "",
    date: "",
    headline: "",
    body: "",
    price: "0.00",
    file: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, file: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = new FormData();
      
      const endpoints = {
        notes: "resources/notes/",
        exams: "resources/exams/",
        pastpapers: "resources/past-papers/",
        news: "resources/news/",
      };

      if (formData.file) data.append("file", formData.file);
      data.append("price", formData.price);

      if (formData.resourceType === "notes") {
        data.append("title", formData.title);
        data.append("content", formData.content);
      } else if (formData.resourceType === "exams") {
        data.append("title", formData.title);
        data.append("description", formData.description);
        data.append("date", formData.date);
      } else if (formData.resourceType === "pastpapers") {
        data.append("title", formData.title);
        data.append("year", formData.year);
      } else if (formData.resourceType === "news") {
        data.append("headline", formData.headline);
        data.append("body", formData.body);
      }

      const endpoint = endpoints[formData.resourceType];
      await api.post(endpoint, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onSuccess();
      onClose();
      
      setFormData({
        resourceType: "notes",
        title: "",
        content: "",
        description: "",
        year: "",
        date: "",
        headline: "",
        body: "",
        price: "0.00",
        file: null,
      });
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err.response?.data?.detail ||
        JSON.stringify(err.response?.data) ||
        "Failed to upload resource"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0b1220] border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#0b1220] border-b border-slate-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-cyan-400">Upload Resource</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <FaTimes size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-300 mb-2 font-medium">Resource Type</label>
            <select
              name="resourceType"
              value={formData.resourceType}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-cyan-400"
            >
              <option value="notes">Notes</option>
              <option value="exams">Exams</option>
              <option value="pastpapers">Past Papers</option>
              <option value="news">News</option>
            </select>
          </div>

          {formData.resourceType === "notes" && (
            <>
              <input
                type="text"
                name="title"
                placeholder="Title *"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100"
              />
              <textarea
                name="content"
                placeholder="Content *"
                value={formData.content}
                onChange={handleChange}
                required
                rows={4}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100"
              />
            </>
          )}

          {formData.resourceType === "exams" && (
            <>
              <input
                type="text"
                name="title"
                placeholder="Title *"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100"
              />
              <textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100"
              />
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100"
              />
            </>
          )}

          {formData.resourceType === "pastpapers" && (
            <>
              <input
                type="text"
                name="title"
                placeholder="Title *"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100"
              />
              <input
                type="number"
                name="year"
                placeholder="Year *"
                value={formData.year}
                onChange={handleChange}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100"
              />
            </>
          )}

          {formData.resourceType === "news" && (
            <>
              <input
                type="text"
                name="headline"
                placeholder="Headline *"
                value={formData.headline}
                onChange={handleChange}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100"
              />
              <textarea
                name="body"
                placeholder="News Body *"
                value={formData.body}
                onChange={handleChange}
                required
                rows={6}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100"
              />
            </>
          )}

          <input
            type="number"
            name="price"
            placeholder="Price (KSh)"
            value={formData.price}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100"
          />

          <div>
            <label className="block text-slate-300 mb-2 font-medium">Upload File</label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:text-cyan-400 hover:file:bg-cyan-500/30"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}