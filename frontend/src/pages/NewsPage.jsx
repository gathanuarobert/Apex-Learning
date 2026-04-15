// src/pages/NewsPage.jsx
import React, { useEffect, useState } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { ArrowLeft, Search, Newspaper, Calendar, Tag, Download, X, FileText, ChevronRight } from "lucide-react";
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
        const res = await api.get("resources/news/published/");
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
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.body?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const particlesInit = async (engine) => { await loadSlim(engine); };

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

  const fileUrl = selectedNews?.cover_image_url;
  const fileType = getFileType(fileUrl);

  return (
    <div className="relative min-h-screen text-slate-100 bg-[#0f172a]">
      <Particles
        id="news-particles"
        init={particlesInit}
        className="absolute inset-0 -z-10"
        options={{
          background: { color: "transparent" },
          fpsLimit: 60,
          particles: {
            number: { value: 40 },
            color: { value: "#22c55e" },
            opacity: { value: 0.2 },
            size: { value: { min: 1, max: 3 } },
            move: { enable: true, speed: 0.5 },
            links: { enable: true, distance: 150, opacity: 0.1, color: "#22c55e" },
          },
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold tracking-widest text-xs uppercase mb-2">
               <Newspaper size={14} /> Global Updates
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Latest News</h1>
            <p className="text-slate-400 mt-2">Stay informed with the latest curriculum changes and community announcements.</p>
          </div>

          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search articles..."
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-emerald-500/50 text-white placeholder-slate-500 outline-none transition-all backdrop-blur-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2">
                <X size={16} className="text-slate-500 hover:text-white" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-400 font-medium">Fetching news feed...</p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-24 bg-slate-800/20 rounded-3xl border border-dashed border-slate-700/50">
            <Newspaper size={48} className="mx-auto text-slate-700 mb-4" />
            <p className="text-slate-400 text-lg">No announcements found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredNews.map((item, idx) => (
              <div
                key={item.id}
                className="group relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden cursor-pointer hover:border-emerald-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${idx * 100}ms` }}
                onClick={() => setSelectedNews(item)}
              >
                <div className="h-2 w-full bg-gradient-to-r from-emerald-500 to-green-600 opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-4">
                    {/* {item.category && (
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-emerald-500/20">
                        {item.category}
                      </span>
                    )} */}
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                      <Calendar size={12} />
                      {item.created_at ? new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recent"}
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-bold text-white mb-4 group-hover:text-emerald-400 transition-colors leading-tight">
                    {item.title}
                  </h2>
                  <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 mb-6">
                    {item.body}
                  </p>
                  
                  <div className="mt-auto flex items-center gap-2 text-emerald-400 text-sm font-bold group-hover:gap-4 transition-all">
                    Read Full Article <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Article Modal */}
      {selectedNews && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={() => setSelectedNews(null)}>
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
          <div 
            className="relative bg-[#1e293b] border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-[#1e293b]/90 backdrop-blur-md px-8 py-6 border-b border-slate-700/50 flex items-center justify-between">
              <div>
                 <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest block mb-1">{selectedNews.category || 'Announcement'}</span>
                 <h2 className="text-2xl font-bold text-white leading-tight">{selectedNews.title}</h2>
              </div>
              <button onClick={() => setSelectedNews(null)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-8">
              <div className="flex items-center gap-4 text-slate-400 text-sm mb-8 bg-slate-900/40 p-3 rounded-2xl w-fit">
                <div className="flex items-center gap-2"><Calendar size={14} /> {new Date(selectedNews.created_at).toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
              </div>

              <div className="text-slate-200 leading-relaxed text-lg whitespace-pre-wrap font-light italic">
                {selectedNews.body}
              </div>

              {fileUrl && (
                <div className="mt-12 space-y-6">
                  <div className="h-px bg-slate-700/50 w-full" />
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Download size={16} /> Attached Resources
                  </h4>

                  {fileType === 'image' && (
                    <div className="relative group">
                      <img src={fileUrl} alt="News" className="w-full rounded-2xl border border-slate-700/50 shadow-lg" />
                      <button onClick={() => handleDownload(fileUrl)} className="absolute top-4 right-4 p-3 bg-black/60 backdrop-blur-md rounded-xl text-white opacity-0 group-hover:opacity-100 transition-all">
                        <Download size={20} />
                      </button>
                    </div>
                  )}

                  {fileType === 'pdf' && (
                    <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-xl bg-slate-900">
                      <iframe src={fileUrl} title="Attachment" className="w-full h-[500px]" />
                      <div className="p-4 bg-slate-800 flex justify-between items-center">
                        <span className="text-xs text-slate-400">PDF Document</span>
                        <button onClick={() => handleDownload(fileUrl)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-bold transition-all">
                          <Download size={14} /> Download
                        </button>
                      </div>
                    </div>
                  )}

                  {fileType === 'download' && (
                    <button onClick={() => handleDownload(fileUrl)} className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl font-bold text-white transition-all shadow-lg shadow-emerald-900/20">
                      <Download size={20} /> Download Associated File
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-700/50 flex justify-end">
              <button onClick={() => setSelectedNews(null)} className="px-8 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-all">Close Article</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}