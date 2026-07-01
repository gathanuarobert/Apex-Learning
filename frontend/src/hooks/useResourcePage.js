// src/hooks/useResourcePage.js
import { useState, useEffect, useMemo } from "react";
import { walletPurchase, initiateOneTimePurchase } from "../Api";
import api from "../Api";
import { useAuth } from "./useAuth";

export function useResourcePage(fetchFn, resourceType, downloadPath, openAuthModal) {
  const { isGuest } = useAuth(); // ← only isGuest, no openAuthModal
  const [items,         setItems]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [curriculum,    setCurriculum]    = useState(null);
  const [grade,         setGrade]         = useState(null);
  const [subject,       setSubject]       = useState(null);
  const [search,        setSearch]        = useState("");
  const [modal,         setModal]         = useState(null);
  const [payingWallet,  setPayingWallet]  = useState(false);
  const [payingPesapal, setPayingPesapal] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
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
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchFn]);

  // ── Filters ──────────────────────────────────────────────────────────────
  const { curricula, grades, subjects, filtered } = useMemo(() => {
    let f = items;
    if (curriculum) f = f.filter((i) => i.curriculum === curriculum);
    if (grade)      f = f.filter((i) => i.grade      === grade);
    if (subject)    f = f.filter((i) => i.subject    === subject);

    const curricula = [...new Set(items.map((i) => i.curriculum).filter(Boolean))].sort();
    const grades    = [...new Set(
      items
        .filter((i) => !curriculum || i.curriculum === curriculum)
        .map((i) => i.grade)
        .filter(Boolean),
    )].sort();
    const subjects  = [...new Set(
      items
        .filter((i) =>
          (!curriculum || i.curriculum === curriculum) &&
          (!grade      || i.grade      === grade),
        )
        .map((i) => i.subject)
        .filter(Boolean),
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

  // ── Related ───────────────────────────────────────────────────────────────
  const getRelated = (item) =>
    filtered.filter((i) => i.subject === item.subject && i.id !== item.id).slice(0, 4);

  // ── Download ──────────────────────────────────────────────────────────────
  const getExtension = (contentType, filename) => {
    if (!contentType) {
      const ext = filename?.split(".").pop();
      return ext && ext.length <= 5 ? `.${ext}` : ".pdf";
    }
    if (contentType.includes("pdf"))                    return ".pdf";
    if (contentType.includes("spreadsheetml") ||
        contentType.includes("excel"))                  return ".xlsx";
    if (contentType.includes("ms-excel"))               return ".xls";
    if (contentType.includes("csv"))                    return ".csv";
    if (contentType.includes("wordprocessingml") ||
        contentType.includes("msword"))                 return ".docx";
    if (contentType.includes("presentationml") ||
        contentType.includes("powerpoint"))             return ".pptx";
    if (contentType.includes("jpeg") ||
        contentType.includes("jpg"))                    return ".jpg";
    if (contentType.includes("png"))                    return ".png";
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
    } catch (err) {
      console.error(err);
    }
  };

  // ── Payments ──────────────────────────────────────────────────────────────
  const payWithWallet = async () => {
    if (isGuest) {
      openAuthModal?.();
      return;
    }
    setPayingWallet(true);
    try {
      await walletPurchase({ resource_id: modal.item.id, resource_type: resourceType });
      const item = modal.item;
      setModal(null);
      await handleDownload(item);
    } catch (e) {
      alert(e.response?.data?.error || "Wallet payment failed.");
    } finally {
      setPayingWallet(false);
    }
  };

  const payWithPesapal = async () => {
    if (isGuest) {
      openAuthModal?.();
      return;
    }
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

  return {
    loading, step, search, modal, options, breadcrumbs,
    payingWallet, payingPesapal,
    isPaying: payingWallet || payingPesapal,
    filtered,
    setSearch, setModal,
    pick, clearAll, getRelated, handleDownload, payWithWallet, payWithPesapal,
  };
}