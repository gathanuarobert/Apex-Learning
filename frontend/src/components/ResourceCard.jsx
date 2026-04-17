// src/components/ResourceCard.jsx
import React, { useRef } from "react";
import { Eye, Download, CheckCircle2 } from "lucide-react";

/**
 * ResourceCard
 *
 * Props:
 *  item        – the resource object from the API
 *  index       – used to pick the gradient
 *  gradients   – array of Tailwind gradient strings (passed by the parent page)
 *  Icon        – Lucide icon component for the watermark (BookOpen, FileText, etc.)
 *  onView      – called when the user clicks "View Details" (or the free download CTA)
 *  onDownload  – called for free items directly from the card
 */
export default function ResourceCard({ item, index, gradients, Icon, onView, onDownload }) {
  const ref = useRef(null);

  const isFree       = parseFloat(item.price || 0) === 0;
  const isPurchased  = item.is_purchased || item.owned || false;
  const gradient     = gradients[index % gradients.length];
  const shortDesc    = item.description
    ? item.description.length > 90
      ? item.description.slice(0, 90).trimEnd() + "…"
      : item.description
    : null;

  // 3-D tilt on mouse move
  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x    = e.clientX - rect.left;
    const y    = e.clientY - rect.top;
    const rx   = ((y - rect.height / 2) / rect.height) * 10;
    const ry   = ((x - rect.width  / 2) / rect.width)  * -10;
    ref.current.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02,1.02,1.02)`;
  };
  const handleMouseLeave = () => {
    if (ref.current)
      ref.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
  };

  const handleCTA = (e) => {
    e.stopPropagation();
    if ((isFree || isPurchased) && !onView) {
      onDownload?.(item);
    } else {
      onView(item);
    }
  };

  return (
    <div
      ref={ref}
      className={`
        relative group bg-gradient-to-br ${gradient}
        rounded-[2rem] border border-white/10 shadow-xl
        overflow-hidden cursor-pointer
        transition-all duration-300 ease-out active:scale-95
        flex flex-col min-h-[220px] p-6
      `}
      onClick={() => onView(item)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Watermark icon */}
      <div className="absolute top-4 right-4 text-white/15 group-hover:text-white/30 transition-all duration-500 pointer-events-none">
        {Icon && <Icon size={40} />}
      </div>

      {/* Status badge */}
      {isPurchased ? (
        <span className="absolute top-5 left-5 flex items-center gap-1.5 px-3 py-1 bg-emerald-500/25 border border-emerald-400/30 rounded-full text-[10px] font-bold text-emerald-300 uppercase tracking-widest backdrop-blur-md">
          <CheckCircle2 size={10} /> Purchased
        </span>
      ) : isFree ? (
        <span className="absolute top-5 left-5 px-3 py-1 bg-white/20 border border-white/20 rounded-full text-[10px] font-bold text-white uppercase tracking-widest backdrop-blur-md">
          Free
        </span>
      ) : (
        <span className="absolute top-5 left-5 px-3 py-1 bg-black/20 border border-white/10 rounded-full text-[10px] font-bold text-white/80 uppercase tracking-widest backdrop-blur-md">
          KSh {item.price}
        </span>
      )}

      {/* Content */}
      <div className="mt-auto pt-8">
        <h3 className="font-extrabold text-white text-lg leading-tight mb-2 line-clamp-2">
          {item.title}
        </h3>

        {/* Short description preview */}
        {shortDesc && (
          <p className="text-white/60 text-xs leading-relaxed mb-4 line-clamp-2">
            {shortDesc}
          </p>
        )}

        {/* CTA button */}
        <button
          onClick={handleCTA}
          className={`
            w-full flex items-center justify-center gap-2 py-3
            rounded-2xl text-xs font-bold text-white
            border border-white/20 backdrop-blur-md
            transition-all duration-200
            ${isPurchased || isFree
              ? "bg-emerald-500/20 hover:bg-emerald-500/35"
              : "bg-white/10 hover:bg-white/20"
            }
          `}
        >
          {isPurchased || isFree
            ? <><Download size={13} /> Download</>
            : <><Eye size={13} /> View Details & Purchase</>
          }
        </button>
      </div>
    </div>
  );
}