import { useState, useEffect, useMemo, useRef } from "react";
import { walletPurchase, initiateOneTimePurchase } from "../Api";
import api from "../Api";
import { useAuth } from "./useAuth";

export function useResourcePage(fetchFn, resourceType, downloadPath, openAuthModal) {
  const { isGuest } = useAuth();
  const [items,         setItems]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [curriculum,    setCurriculum]    = useState(null);
  const [grade,         setGrade]         = useState(null);
  const [subject,       setSubject]       = useState(null);
  const [search,        setSearch]        = useState("");
  const [modal,         setModal]         = useState(null);
  const [payingWallet,  setPayingWallet]  = useState(false);
  const [payingPesapal, setPayingPesapal] = useState(false);

  // ── M-Pesa state ─────────────────────────────────────────────────────────
  const [activeGateway, setActiveGateway] = useState("pesapal");
  const [mpesaPhone,    setMpesaPhone]    = useState("");
  const [payingMpesa,   setPayingMpesa]   = useState(false);
  const [mpesaPolling,  setMpesaPolling]  = useState(false);
  const [mpesaError,    setMpesaError]    = useState("");
  const pollRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  // Cleanup polling on unmount
  useEffect(() => () => stopPolling(), []);

  // ── Fetch active gateway on mount ─────────────────────────────────────────
  useEffect(() => {
    api.get("payments/active-gateway/")
      .then((res) => setActiveGateway(res.data.active_gateway))
      .catch(() => {}); // silently default to pesapal
  }, []);

  // ── Fetch resources ───────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetchFn();
        const normalised = (res.data || []).map((item) => ({
          ...item,
          description: item.description || item.content || null,
        }));
        setItems(normalised);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [fetchFn]);

  // ── Filters ───────────────────────────────────────────────────────────────
  const { curricula, grades, subjects, filtered } = useMemo(() => {
    let f = items;
    if (curriculum) f = f.filter((i) => i.curriculum === curriculum);
    if (grade)      f = f.filter((i) => i.grade      === grade);
    if (subject)    f = f.filter((i) => i.subject    === subject);

    const curricula = [...new Set(items.map((i) => i.curriculum).filter(Boolean))].sort();
    const grades    = [...new Set(
      items.filter((i) => !curriculum || i.curriculum === curriculum)
           .map((i) => i.grade).filter(Boolean),
    )].sort();
    const subjects  = [...new Set(
      items.filter((i) =>
        (!curriculum || i.curriculum === curriculum) &&
        (!grade      || i.grade      === grade))
           .map((i) => i.subject).filter(Boolean),
    )].sort();

    return { curricula, grades, subjects, filtered: f };
  }, [items, curriculum, grade, subject]);

  const step = subject ? 3 : grade ? 2 : curriculum ? 1 : 0;

  const options = useMemo(() => {
    const q = search.toLowerCase();
    if (step === 0) return curricula.filter((c) => c.toLowerCase().includes(q));
    if (step === 1) return grades.filter((g)    => g.toLowerCase().includes(q));
    if (step === 2) return subjects.filter((s)  => s.toLowerCase().includes(q));
    return filtered.filter((i) => i.title?.toLowerCase().includes(q));
  }, [step, curricula, grades, subjects, filtered, search]);

  const pick = (val) => {
    setSearch("");
    if      (step === 0) setCurriculum(val);
    else if (step === 1) setGrade(val);
    else if (step === 2) setSubject(val);
  };

  const clearAll  = () => { setCurriculum(null); setGrade(null); setSubject(null); };
  const clearFrom = (level) => {
    if (level <= 1) { setCurriculum(null); setGrade(null); setSubject(null); }
    if (level === 2) { setGrade(null); setSubject(null); }
    if (level === 3) setSubject(null);
  };

  const breadcrumbs = [
    curriculum && { label: curriculum, clear: () => clearFrom(1) },
    grade      && { label: grade,      clear: () => clearFrom(2) },
    subject    && { label: subject,    clear: () => clearFrom(3) },
  ].filter(Boolean);

  const getRelated = (item) =>
    filtered.filter((i) => i.subject === item.subject && i.id !== item.id).slice(0, 4);

  // ── Download ───────────────────────────────────────────────────────────────
  const getExtension = (contentType, filename) => {
    if (!contentType) {
      const ext = filename?.split(".").pop();
      return ext && ext.length <= 5 ? `.${ext}` : ".pdf";
    }
    if (contentType.includes("pdf"))                                            return ".pdf";
    if (contentType.includes("spreadsheetml") || contentType.includes("excel")) return ".xlsx";
    if (contentType.includes("ms-excel"))                                       return ".xls";
    if (contentType.includes("csv"))                                            return ".csv";
    if (contentType.includes("wordprocessingml") || contentType.includes("msword")) return ".docx";
    if (contentType.includes("presentationml") || contentType.includes("powerpoint")) return ".pptx";
    if (contentType.includes("jpeg") || contentType.includes("jpg"))            return ".jpg";
    if (contentType.includes("png"))                                            return ".png";
    return ".pdf";
  };

  const handleDownload = async (item) => {
    try {
      const response = await api.get(
        `resources/${downloadPath}/${item.id}/download/`,
        { responseType: "blob", timeout: 120000 },
      );
      const contentType = response.headers["content-type"];
      const extension   = getExtension(contentType, item.title);
      const url  = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `${item.title || "resource"}${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
  };

  // ── Payments ───────────────────────────────────────────────────────────────
  const payWithWallet = async () => {
    if (isGuest) { openAuthModal?.(); return; }
    setPayingWallet(true);
    try {
      await walletPurchase({ resource_id: modal.item.id, resource_type: resourceType });
      const item = modal.item;
      setModal(null);
      await handleDownload(item);
    } catch (e) {
      alert(e.response?.data?.error || "Wallet payment failed.");
    } finally { setPayingWallet(false); }
  };

  const payWithPesapal = async () => {
    if (isGuest) { openAuthModal?.(); return; }
    setPayingPesapal(true);
    try {
      const res = await initiateOneTimePurchase({
        resource_id: modal.item.id,
        resource_type: resourceType,
      });
      window.location.href = res.data.redirect_url;
    } catch (e) {
      alert(e.response?.data?.error || "Could not initiate payment.");
      setPayingPesapal(false);
    }
  };

  const payWithMpesa = async (phoneNumber) => {
    if (isGuest) { openAuthModal?.(); return; }
    if (!phoneNumber?.trim()) { setMpesaError("Please enter your M-Pesa phone number."); return; }

    setPayingMpesa(true);
    setMpesaPolling(false);
    setMpesaError("");
    stopPolling();

    try {
      const res = await api.post("payments/mpesa/stk-push/", {
        phone_number: phoneNumber.trim(),
        resource_id: modal.item.id,
        resource_type: resourceType,
        purpose: "purchase",
      });
      const paymentId = res.data.payment_id;
      setPayingMpesa(false);
      setMpesaPolling(true);

      let attempts = 0;
      const MAX_ATTEMPTS = 20; // 20 × 3s = 60s timeout

      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await api.get(`payments/mpesa/status/${paymentId}/`);
          const { status, error } = statusRes.data;

          if (status === "completed") {
            stopPolling();
            setMpesaPolling(false);
            const item = modal.item;
            setModal(null);
            setMpesaPhone("");
            await handleDownload(item);
          } else if (status === "failed") {
            stopPolling();
            setMpesaPolling(false);
            setMpesaError(error || "Payment failed or was cancelled. Please try again.");
          } else if (attempts >= MAX_ATTEMPTS) {
            stopPolling();
            setMpesaPolling(false);
            setMpesaError("No response after 60 seconds. If you completed payment, contact support.");
          }
        } catch (e) {
          // Network hiccup during poll — keep polling, don't surface error
        }
      }, 3000);

    } catch (e) {
      setPayingMpesa(false);
      setMpesaError(e.response?.data?.error || "Could not send M-Pesa prompt. Try again.");
    }
  };

  // Reset M-Pesa state when modal closes
  const handleSetModal = (val) => {
    if (!val) { stopPolling(); setMpesaPolling(false); setPayingMpesa(false); setMpesaError(""); setMpesaPhone(""); }
    setModal(val);
  };

  return {
    loading, step, search, modal, options, breadcrumbs,
    payingWallet, payingPesapal,
    isPaying: payingWallet || payingPesapal || payingMpesa || mpesaPolling,
    filtered,
    setSearch,
    setModal: handleSetModal,
    pick, clearAll, getRelated, handleDownload,
    payWithWallet, payWithPesapal,
    // M-Pesa
    activeGateway,
    mpesaPhone, setMpesaPhone,
    payingMpesa, mpesaPolling, mpesaError,
    payWithMpesa,
  };
}