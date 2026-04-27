// src/hooks/useGlobalSearch.js
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { getNotes, getExams, getPastPapers } from "../Api";

/**
 * useGlobalSearch
 *
 * Fetches ALL resources once (notes, exams, past papers) and exposes
 * a flat, indexed search — no tree navigation required.
 *
 * Returns:
 *  query         – current search string
 *  setQuery      – setter
 *  results       – filtered array of { ...item, _type, _path, _downloadPath }
 *  allLoaded     – true once all three fetches complete
 *  isSearching   – true when query.length >= 2
 *  clear         – resets query
 */
export function useGlobalSearch() {
  const [notes,      setNotes]      = useState([]);
  const [exams,      setExams]      = useState([]);
  const [pastPapers, setPastPapers] = useState([]);
  const [allLoaded,  setAllLoaded]  = useState(false);
  const [query,      setQuery]      = useState("");
  const hasFetched = useRef(false);

  // Fetch once, cache in module-level memory so navigating between pages
  // doesn't re-trigger the network calls.
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const normalise = (data, type, path) =>
      (data || []).map((item) => ({
        ...item,
        description: item.description || item.content || null,
        _type:         type,   // "Note" | "Exam" | "PastPaper"
        _path:         path,   // route to navigate to, e.g. "/notes"
        _downloadPath: path.replace("/", ""), // "notes" | "exams" | "past-papers"
      }));

    Promise.allSettled([
      getNotes().then((r)      => setNotes(normalise(r.data,      "Note",      "/notes"))),
      getExams().then((r)      => setExams(normalise(r.data,      "Exam",      "/exams"))),
      getPastPapers().then((r) => setPastPapers(normalise(r.data, "PastPaper", "/past-papers"))),
    ]).finally(() => setAllLoaded(true));
  }, []);

  const allItems = useMemo(
    () => [...notes, ...exams, ...pastPapers],
    [notes, exams, pastPapers],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    return allItems.filter((item) => {
      return (
        item.title?.toLowerCase().includes(q)       ||
        item.subject?.toLowerCase().includes(q)     ||
        item.grade?.toLowerCase().includes(q)       ||
        item.curriculum?.toLowerCase().includes(q)  ||
        item.description?.toLowerCase().includes(q) ||
        item.year?.toString().toLowerCase().includes(q)
      );
    });
  }, [allItems, query]);

  const clear = useCallback(() => setQuery(""), []);

  return {
    query,
    setQuery,
    results,
    allLoaded,
    isSearching: query.trim().length >= 2,
    clear,
  };
}