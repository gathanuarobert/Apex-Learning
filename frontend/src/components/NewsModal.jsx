import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Newspaper } from "lucide-react";
import api from "../Api";

export default function NewsModal() {
  const [posts, setPosts] = useState([]);
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await api.get("resources/news/unread/");
        if (res.data.length > 0) {
          setPosts(res.data);
          setVisible(true);
        }
      } catch (err) {
        console.error("Failed to fetch news:", err);
      }
    };
    fetchNews();
  }, []);

  const markViewed = useCallback(async (postId, permanently = false) => {
    try {
      await api.post("resources/news/mark-viewed/", {
        post_id: postId,
        dismissed_permanently: permanently,
      });
    } catch (err) {
      console.error("Failed to mark news viewed:", err);
    }
  }, []);

  const handleClose = async () => {
    setClosing(true);
    await Promise.all(posts.map((p) => markViewed(p.id, dontShowAgain)));
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
    }, 200);
  };

  if (!visible || posts.length === 0) return null;

  const post = posts[current];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Modal */}
      <div
        className={`relative bg-[#1e293b] w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh] transition-all duration-200 ${
          closing ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover image */}
        {post.cover_image_url ? (
          <div className="h-48 w-full overflow-hidden flex-shrink-0">
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          // Placeholder banner if no image
          <div className="h-24 w-full bg-gradient-to-r from-blue-600/30 to-blue-800/20 flex items-center justify-center flex-shrink-0">
            <Newspaper size={36} className="text-blue-400/50" />
          </div>
        )}

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-sm"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Badge */}
          <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 mb-3">
            News & Updates
          </span>

          <h2 className="text-xl font-black text-white leading-snug mb-3">
            {post.title}
          </h2>

          <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">
            {post.body}
          </p>

          <p className="text-[11px] text-slate-600 font-bold uppercase tracking-widest mt-4">
            {new Date(post.created_at).toLocaleDateString("en-KE", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center gap-3 flex-shrink-0">
          {/* Don't show again */}
          <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
            />
            Don't show again
          </label>

          {/* Carousel controls */}
          {posts.length > 1 && (
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setCurrent((c) => c - 1)}
                disabled={current === 0}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[11px] font-black text-slate-500 tabular-nums">
                {current + 1} / {posts.length}
              </span>
              <button
                onClick={() => setCurrent((c) => c + 1)}
                disabled={current === posts.length - 1}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Got it */}
          <button
            onClick={handleClose}
            className={`px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest transition-all ${
              posts.length > 1 ? "" : "ml-auto"
            }`}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}