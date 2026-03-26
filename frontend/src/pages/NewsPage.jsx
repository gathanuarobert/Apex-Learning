// src/pages/NewsPage.jsx
import React, { useEffect, useState } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { ArrowLeft, Search, Newspaper, Calendar, Tag, Download, X, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../Api";

export default function NewsPage() {
  const navigate = useNavigate();

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNews, setSelectedNews] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await api.get("resources/news/");
        setNews(res.data || []);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const filteredNews = news.filter(item =>
    item.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.body?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const particlesInit = async (engine) => {
    await loadSlim(engine);
  };

  // Determine file type from URL
  const getFileType = (url) => {
    if (!url) return null;
    const ext = url.split('.').pop().split('?')[0].toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    return 'download';
  };

  const handleDownload = (url) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = url.split('/').pop();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const fileUrl = selectedNews?.file_url || selectedNews?.file;
  const fileType = getFileType(fileUrl);

  return (
    <div className="relative w-full min-h-screen text-white overflow-y-auto bg-slate-950">
      {/* Background Particles */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        className="absolute inset-0 -z-10"
        options={{
          background: { color: "#0f172a" },
          fpsLimit: 60,
          particles: {
            number: { value: 55 },
            color: { value: ["#22c55e", "#4ade80", "#86efac"] },
            opacity: { value: 0.25 },
            size: { value: { min: 1, max: 3 } },
            move: { enable: true, speed: 0.6 },
            links: { enable: true, distance: 130, opacity: 0.15, color: "#22c55e" },
          },
        }}
      />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => navigate("/user-dashboard")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft size={18} /> Back
            </button>

            <div className="flex-1 max-w-md">
              <div className="flex items-center gap-3 bg-slate-800 rounded-lg px-4 py-2">
                <Search size={18} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search news..."
                  className="w-full bg-transparent focus:outline-none text-white placeholder-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-700 font-semibold">
              <Newspaper size={18} /> News
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Latest News</h1>
          <p className="text-slate-400 mt-1">Stay up to date with the latest updates and announcements</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            <p className="mt-4 text-slate-400">Loading news...</p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-20">
            <Newspaper size={64} className="mx-auto text-slate-700 mb-4" />
            <p className="text-slate-400 text-lg">
              {searchQuery ? "No news found matching your search." : "No news available yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 rounded-2xl border border-slate-800 hover:border-green-500 transition-all hover:shadow-lg hover:shadow-green-500/20 overflow-hidden flex flex-col cursor-pointer group"
                onClick={() => setSelectedNews(item)}
              >
                <div className="h-1.5 w-full bg-gradient-to-r from-green-500 to-green-700" />
                <div className="p-6 flex flex-col flex-1">
                  {item.category && (
                    <div className="flex items-center gap-1 mb-3">
                      <Tag size={12} className="text-green-400" />
                      <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>
                  )}
                  <h2 className="text-lg font-bold text-white mb-3 group-hover:text-green-400 transition-colors line-clamp-2">
                    {item.headline}
                  </h2>
                  <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 flex-1">
                    {item.body}
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-1 text-slate-500 text-xs">
                      <Calendar size={12} />
                      <span>
                        {item.published_at
                          ? new Date(item.published_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "Recently"}
                      </span>
                    </div>
                    <span className="text-green-400 text-xs font-semibold group-hover:underline">
                      Read more →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Article Modal */}
      {selectedNews && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-start z-50 p-4 overflow-y-auto"
          onClick={() => setSelectedNews(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full my-8 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-2 w-full bg-gradient-to-r from-green-500 to-green-700" />

            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  {selectedNews.category && (
                    <div className="flex items-center gap-1 mb-2">
                      <Tag size={12} className="text-green-400" />
                      <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">
                        {selectedNews.category}
                      </span>
                    </div>
                  )}
                  <h2 className="text-2xl font-bold text-white">{selectedNews.headline}</h2>
                </div>
                <button
                  onClick={() => setSelectedNews(null)}
                  className="ml-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg p-2 transition-colors flex-shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-6">
                <Calendar size={14} />
                <span>
                  {selectedNews.published_at
                    ? new Date(selectedNews.published_at).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Recently published"}
                </span>
              </div>

              <div className="border-t border-slate-800 mb-6" />

              {/* Full Body */}
              <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {selectedNews.body}
              </div>

              {/* Attachment Section */}
              {fileUrl && (
                <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
                  <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                    Attachment
                  </p>

                  {/* Image — show inline */}
                  {fileType === 'image' && (
                    <img
                      src={fileUrl}
                      alt="News attachment"
                      className="w-full rounded-xl border border-slate-700 object-contain max-h-96"
                    />
                  )}

                  {/* PDF — embed in modal */}
                  {fileType === 'pdf' && (
                    <div className="rounded-xl overflow-hidden border border-slate-700">
                      <iframe
                        src={fileUrl}
                        title="PDF Attachment"
                        className="w-full h-96"
                      />
                      {/* Also offer download for mobile where iframes don't work well */}
                      <div className="bg-slate-800 px-4 py-2 flex justify-end">
                        <button
                          onClick={() => handleDownload(fileUrl)}
                          className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-semibold transition-colors"
                        >
                          <Download size={14} /> Download PDF
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Other files — download button */}
                  {fileType === 'download' && (
                    <button
                      onClick={() => handleDownload(fileUrl)}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg font-semibold transition-colors"
                    >
                      <Download size={18} /> Download Attachment
                    </button>
                  )}

                  {/* For images, also offer download */}
                  {fileType === 'image' && (
                    <button
                      onClick={() => handleDownload(fileUrl)}
                      className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
                    >
                      <Download size={14} /> Download image
                    </button>
                  )}
                </div>
              )}

              {/* Close button */}
              <div className="mt-6 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setSelectedNews(null)}
                  className="w-full bg-slate-800 hover:bg-slate-700 px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}