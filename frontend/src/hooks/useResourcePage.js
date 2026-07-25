import { useState, useEffect, useMemo, useRef } from "react";
import { walletPurchase, initiateOneTimePurchase, getFilterOptions } from "../Api";
import api from "../Api";
import { useAuth } from "./useAuth";

export function useResourcePage(fetchFn, resourceType, downloadPath, openAuthModal) {
  const { isGuest } = useAuth();
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

  // ── Funnel state: curriculum/grade/subject are still plain NAME strings
  // (unchanged external contract) — resolved to IDs internally via `combos`
  // for building API filter params. Names are safe to use as the lookup key
  // because EducationLevel/Grade/Subject names are unique in the DB.
  const [combos,        setCombos]        = useState([]); // cheap funnel metadata
  const [items,         setItems]         = useState([]); // leaf-level page of resources
  const [page,          setPage]          = useState(1);
  const [hasMore,       setHasMore]       = useState(false);
  const [loadingMore,   setLoadingMore]   = useState(false);

  const resourceTypeKey = resourceType.toLowerCase(); // "Note" -> "note" etc.

  // ── Fetch funnel metadata once (tiny payload — combos of curriculum/grade/subject) ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await getFilterOptions(resourceTypeKey);
        if (!cancelled) setCombos(res.data.combos || []);
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [resourceTypeKey]);

  const curricula = useMemo(
    () => [...new Set(combos.map((c) => c.education_level).filter(Boolean))].sort(),
    [combos],
  );
  const grades = useMemo(
    () => [...new Set(
      combos.filter((c) => !curriculum || c.education_level === curriculum)
            .map((c) => c.grade).filter(Boolean),
    )].sort(),
    [combos, curriculum],
  );
  const subjects = useMemo(
    () => [...new Set(
      combos.filter((c) =>
        (!curriculum || c.education_level === curriculum) &&
        (!grade      || c.grade           === grade))
            .map((c) => c.subject).filter(Boolean),
    )].sort(),
    [combos, curriculum, grade],
  );

  // Resolve the selected names back to IDs for the API filter params
  const resolveId = (nameField, idField, value) => {
    const match = combos.find((c) => c[nameField] === value);
    return match ? match[idField] : null;
  };
  const curriculumId = useMemo(
    () => (curriculum ? resolveId('education_level', 'education_level_id', curriculum) : null),
    [combos, curriculum],
  );
  const gradeId = useMemo(
    () => (grade ? resolveId('grade', 'grade_id', grade) : null),
    [combos, grade],
  );
  const subjectId = useMemo(
    () => (subject ? resolveId('subject', 'subject_id', subject) : null),
    [combos, subject],
  );

  const step = subject ? 3 : grade ? 2 : curriculum ? 1 : 0;

  const normaliseItems = (results) =>
    (results || []).map((item) => ({
      ...item,
      description: item.description || item.content || null,
    }));

  // ── Fetch the actual (paginated, server-filtered) item list — only once
  // the user has drilled down to a specific subject. Debounced so fast
  // typing in the search box doesn't fire a request per keystroke.
  useEffect(() => {
    if (step !== 3 || !subjectId) { setItems([]); setHasMore(false); return; }

    let cancelled = false;
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetchFn({
          education_level: curriculumId,
          grade: gradeId,
          subject: subjectId,
          search: search || undefined,
          page: 1,
        });
        if (cancelled) return;
        setItems(normaliseItems(res.data.results));
        setPage(1);
        setHasMore(Boolean(res.data.next));
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false); }
    }, 300);

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [step, subjectId, search]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await fetchFn({
        education_level: curriculumId,
        grade: gradeId,
        subject: subjectId,
        search: search || undefined,
        page: nextPage,
      });
      setItems((prev) => [...prev, ...normaliseItems(res.data.results)]);
      setPage(nextPage);
      setHasMore(Boolean(res.data.next));
    } catch { /* silent */ }
    finally { setLoadingMore(false); }
  };

  // ── Options shown in the grid at each funnel step ───────────────────────
  // Steps 0-2 filter the (small, already-loaded) name lists client-side.
  // Step 3 shows the server-filtered/paginated items as-is.
  const options = useMemo(() => {
    const q = search.toLowerCase();
    if (step === 0) return curricula.filter((c) => c.toLowerCase().includes(q));
    if (step === 1) return grades.filter((g)    => g.toLowerCase().includes(q));
    if (step === 2) return subjects.filter((s)  => s.toLowerCase().includes(q));
    return items;
  }, [step, curricula, grades, subjects, items, search]);

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
    items.filter((i) => i.id !== item.id).slice(0, 4);

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
    filtered: items, // kept for backward compat with any external consumers
    hasMore, loadingMore, loadMore,
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