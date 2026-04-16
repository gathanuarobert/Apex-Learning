// src/pages/NewsComposer.jsx
import React, { useState, useEffect } from "react";
import api from "../Api";

const NewsComposer = () => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [isPublished, setIsPublished] = useState(true);
  const [posting, setPosting] = useState(false);
  const [newsList, setNewsList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const fetchNews = async () => {
    try {
      const res = await api.get("resources/admin/news/");
      setNewsList(res.data || []);
    } catch (err) {
      console.error("Failed to fetch news:", err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchNews(); }, []);

  const handlePost = async () => {
    if (!title.trim() || !body.trim()) {
      alert("Title and body are required.");
      return;
    }
    setPosting(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("body", body);
      formData.append("is_published", isPublished ? "true" : "false");
      if (coverImage) formData.append("cover_image", coverImage);
      await api.post("resources/admin/news/", formData);
      setTitle("");
      setBody("");
      setCoverImage(null);
      setIsPublished(true);
      fetchNews();
    } catch (err) {
      console.error("Failed to post news:", err);
      alert("Failed to post news.");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this news post?")) return;
    try {
      await api.delete(`resources/admin/news/${id}/`);
      setNewsList((prev) => prev.filter((n) => n.id !== id));
    } catch {
      alert("Failed to delete.");
    }
  };

  const handleTogglePublish = async (post) => {
    try {
      const formData = new FormData();
      formData.append("is_published", !post.is_published ? "true" : "false");
      await api.patch(`resources/admin/news/${post.id}/`, formData);
      fetchNews();
    } catch {
      alert("Failed to update.");
    }
  };

  return (
    <div className="bg-[#0f172a] text-white min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6">News Composer</h1>

      {/* Form */}
      <div className="bg-[#1e293b] p-6 rounded-2xl shadow mb-8 space-y-4">
        <input
          type="text"
          placeholder="News Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 bg-[#0f172a] border border-blue-500/30 rounded-xl text-white outline-none focus:border-blue-500"
        />
        <textarea
          placeholder="Write news content..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full p-3 bg-[#0f172a] border border-blue-500/30 rounded-xl text-white outline-none focus:border-blue-500 h-36 resize-none"
        />
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1 block">
              Cover Image (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverImage(e.target.files[0])}
              className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer self-end pb-1">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded border-slate-600 text-blue-600"
            />
            Publish immediately
          </label>
        </div>
        <button
          onClick={handlePost}
          disabled={posting}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-6 py-3 rounded-xl font-bold text-sm transition-all"
        >
          {posting ? "Posting..." : "Post News"}
        </button>
      </div>

      {/* Posted News List */}
      <h2 className="text-2xl font-semibold mb-4">Posted News</h2>
      {loadingList ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : newsList.length === 0 ? (
        <p className="text-slate-400 text-sm">No news posted yet.</p>
      ) : (
        <div className="space-y-4">
          {newsList.map((news) => (
            <div key={news.id} className="bg-[#1e293b] p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-start gap-4">
              {news.cover_image_url && (
                <img
                  src={news.cover_image_url}
                  alt={news.title}
                  className="w-full sm:w-32 h-24 object-cover rounded-xl flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-white truncate">{news.title}</h3>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${news.is_published ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-400"}`}>
                    {news.is_published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="text-slate-400 text-sm line-clamp-2 mb-2">{news.body}</p>
                <span className="text-xs text-slate-600">
                  {new Date(news.created_at).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" })}
                </span>
              </div>
              <div className="flex sm:flex-col gap-2 flex-shrink-0">
                <button
                  onClick={() => handleTogglePublish(news)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition-all"
                >
                  {news.is_published ? "Unpublish" : "Publish"}
                </button>
                <button
                  onClick={() => handleDelete(news.id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsComposer;