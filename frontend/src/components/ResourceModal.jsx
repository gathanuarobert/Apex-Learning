import React from "react";
import {
  X, CreditCard, Smartphone, Loader2,
  CheckCircle2, Download, Tag, BookOpen, Phone,
} from "lucide-react";

export default function ResourceModal({
  item,
  accentClass    = "from-blue-600/20 to-indigo-600/20",
  iconBgClass    = "bg-blue-500/20 text-blue-400",
  Icon           = BookOpen,
  payingWallet   = false,
  payingPesapal  = false,
  onPayWallet,
  onPayPesapal,
  onDownload,
  onClose,
  relatedItems   = [],
  onSelectRelated,
  // M-Pesa props
  activeGateway  = "pesapal",
  mpesaPhone     = "",
  onMpesaPhoneChange,
  payingMpesa    = false,
  mpesaPolling   = false,
  mpesaError     = "",
  onPayMpesa,
}) {
  const isPaying    = payingWallet || payingPesapal || payingMpesa || mpesaPolling;
  const isFree      = parseFloat(item?.price || 0) === 0;
  const isPurchased = item?.is_purchased || item?.owned || false;
  const canDownload = isFree || isPurchased;

  if (!item) return null;

  const meta = [item.subject, item.grade, item.year].filter(Boolean).join(" · ");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={() => !isPaying && onClose?.()}
    >
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />

      <div
        className={`
          relative bg-[#1e293b] border border-slate-700/80
          w-full sm:max-w-lg
          rounded-t-[2.5rem] sm:rounded-[2.5rem]
          shadow-2xl overflow-hidden
          max-h-[92dvh] flex flex-col
          animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className={`bg-gradient-to-r ${accentClass} px-6 pt-6 pb-5 border-b border-slate-700/50 flex-shrink-0`}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className={`p-3 rounded-2xl ${iconBgClass} flex-shrink-0`}>
              <Icon size={22} />
            </div>
            <button
              onClick={() => !isPaying && onClose?.()}
              className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl transition-all flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>
          <h2 className="text-xl font-extrabold text-white leading-snug mb-1">{item.title}</h2>
          {meta && <p className="text-slate-400 text-xs font-medium">{meta}</p>}
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {item.thumbnail && (
            <div className="rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-900/40">
              <img src={item.thumbnail} alt={item.title} className="w-full object-cover max-h-44" />
            </div>
          )}

          {item.description ? (
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                About this resource
              </p>
              <p className="text-slate-300 text-sm leading-relaxed">{item.description}</p>
            </div>
          ) : (
            <p className="text-slate-500 text-sm italic">No description provided.</p>
          )}

          {isPurchased && (
            <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-emerald-300 font-semibold text-sm">Already purchased</p>
                <p className="text-emerald-400/70 text-xs">You can download this resource anytime.</p>
              </div>
            </div>
          )}

          {!canDownload && (
            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-700/50">
              <div className="flex items-center gap-2 text-slate-400">
                <Tag size={14} />
                <span className="font-medium text-sm">Price</span>
              </div>
              <span className="text-2xl font-black text-white">
                KSh {parseFloat(item.price).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {relatedItems.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                Related resources
              </p>
              <div className="space-y-2">
                {relatedItems.slice(0, 4).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => onSelectRelated?.(r)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/40 rounded-xl text-left transition-all group"
                  >
                    <span className="text-slate-300 text-xs font-medium group-hover:text-white line-clamp-1 transition-colors">
                      {r.title}
                    </span>
                    <span className="text-slate-500 text-xs font-bold flex-shrink-0">
                      {parseFloat(r.price || 0) === 0 ? "Free" : `KSh ${r.price}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer actions ── */}
        <div className="flex-shrink-0 px-6 pb-6 pt-4 border-t border-slate-700/50 space-y-3 bg-[#1e293b]">
          {canDownload ? (
            <button
              onClick={() => onDownload?.(item)}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 text-white shadow-lg shadow-emerald-900/20"
            >
              <Download size={18} /> Download Now
            </button>
          ) : (
            <>
              {/* ── Pay with Wallet (always shown) ── */}
              <button
                onClick={onPayWallet}
                disabled={isPaying}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3 text-white"
              >
                {payingWallet
                  ? <><Loader2 className="animate-spin" size={18} /> Processing…</>
                  : <><CreditCard size={18} /> Pay with Wallet</>}
              </button>

              {/* ── Pesapal gateway ── */}
              {activeGateway === "pesapal" && (
                <button
                  onClick={onPayPesapal}
                  disabled={isPaying}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600 hover:border-blue-500/40 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 text-slate-200"
                >
                  {payingPesapal
                    ? <><Loader2 className="animate-spin" size={18} /> Redirecting…</>
                    : <><Smartphone size={18} /> Pay with M-Pesa / Card</>}
                </button>
              )}

              {/* ── M-Pesa STK Push gateway ── */}
              {activeGateway === "mpesa" && (
                <>
                  {mpesaPolling ? (
                    /* Waiting for user to enter PIN */
                    <div className="w-full py-5 bg-green-900/20 border border-green-500/30 rounded-2xl flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-green-400" size={22} />
                      <p className="text-green-300 font-bold text-sm">Check your phone</p>
                      <p className="text-green-400/70 text-xs text-center px-4">
                        An M-Pesa payment prompt was sent to your phone. Enter your PIN to complete.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="tel"
                          placeholder="07XX XXX XXX"
                          value={mpesaPhone}
                          onChange={(e) => onMpesaPhoneChange?.(e.target.value)}
                          disabled={payingMpesa}
                          className="w-full pl-10 pr-4 py-3.5 bg-slate-800 border border-slate-600 rounded-2xl text-white text-sm focus:outline-none focus:border-green-500/60 placeholder-slate-500 disabled:opacity-50 transition-colors"
                        />
                      </div>
                      <button
                        onClick={() => onPayMpesa?.(mpesaPhone)}
                        disabled={isPaying || !mpesaPhone.trim()}
                        className="w-full py-4 bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold transition-all flex items-center justify-center gap-3 text-white"
                      >
                        {payingMpesa
                          ? <><Loader2 className="animate-spin" size={18} /> Sending prompt…</>
                          : <><Smartphone size={18} /> Pay with M-Pesa</>}
                      </button>
                      {mpesaError && (
                        <p className="text-red-400 text-xs text-center px-2">{mpesaError}</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          <p className="text-center text-slate-500 text-[10px] leading-relaxed px-4">
            {canDownload
              ? "Your download will start immediately."
              : activeGateway === "mpesa"
              ? "Wallet deducts instantly. M-Pesa sends a prompt to your phone — enter PIN to confirm."
              : "Wallet deducts instantly. M-Pesa/Card redirects to Pesapal — resource unlocks on confirmation."}
          </p>
        </div>
      </div>
    </div>
  );
}