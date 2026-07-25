// src/hooks/useGlobalSearch.js
import { useState, useEffect, useRef, useCallback } from "react";
import { getNotes, getExams, getPastPapers } from "../Api";

// Per-type cap for the dropdown — this is a quick-glance list, not a full
// results page, so we don't need many rows per type.
const SEARCH_PAGE_SIZE = 8;
const DEBOUNCE_MS = 300;

/**
 * useGlobalSearch
 *
 * Debounced, server-side search across notes/exams/past-papers — no longer
 * preloads the entire resource library into memory (that doesn't scale as
 * the library grows, and delayed the search box being usable on page load).
 *
 * Returns:
 *  query         – current search string
 *  setQuery      – setter
 *  results       – flat array of { ...item, _type, _path, _downloadPath }
 *  allLoaded     – kept for backward compatibility, always true now (no
 *                  blocking upfront fetch to wait on anymore)
 *  isLoading     – true while a debounced search request is in flight
 *  isSearching   – true when query.length >= 2
 *  clear         – resets query
 */
export function useGlobalSearch() {
  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const thisRequest = ++requestId.current;

    const timeout = setTimeout(async () => {
      setIsLoading(true);

      const normalise = (data, type, path) =>
        (data || []).map((item) => ({
          ...item,
          description: item.description || item.content || null,
          _type:         type,
          _path:         path,
          _downloadPath: path.replace("/", ""),
        }));

      try {
        const [notesRes, examsRes, papersRes] = await Promise.allSettled([
          getNotes({ search: q, page_size: SEARCH_PAGE_SIZE }),
          getExams({ search: q, page_size: SEARCH_PAGE_SIZE }),
          getPastPapers({ search: q, page_size: SEARCH_PAGE_SIZE }),
        ]);

        // A newer keystroke already started another search — drop this stale result
        if (thisRequest !== requestId.current) return;

        const notes = notesRes.status === "fulfilled"
          ? normalise(notesRes.value.data.results, "Note", "/notes") : [];
        const exams = examsRes.status === "fulfilled"
          ? normalise(examsRes.value.data.results, "Exam", "/exams") : [];
        const papers = papersRes.status === "fulfilled"
          ? normalise(papersRes.value.data.results, "PastPaper", "/past-papers") : [];

        setResults([...notes, ...exams, ...papers]);
      } finally {
        if (thisRequest === requestId.current) setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [query]);

  const clear = useCallback(() => setQuery(""), []);

  return {
    query,
    setQuery,
    results,
    allLoaded: true,
    isLoading,
    isSearching: query.trim().length >= 2,
    clear,
  };
}