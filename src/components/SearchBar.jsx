// src/components/SearchBar.jsx  (full replacement — drop over your existing file)
//
// What's new vs the previous version:
//   ✅ Debounced autocomplete — fetches suggestions 350ms after the user stops typing
//   ✅ Dropdown with up to 5 city matches, cyberpunk-styled
//   ✅ Keyboard navigation (↑ ↓ Enter Escape) through suggestions
//   ✅ Click-outside to close dropdown (useEffect + mousedown listener)
//   ✅ Selecting a suggestion fills input, moves globe, fetches weather
//   ✅ All existing search / Enter / SCAN / clear / error behaviour unchanged
//
// Props (unchanged from before):
//   onSearch(lat, lng) — called when a city is confirmed (suggestion click OR Enter/SCAN)
//   disabled           — true while weather is loading

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_KEY = import.meta.env.VITE_WEATHER_API;
const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";

// ─── tiny helper: build a readable city label ───────────────────────────────
function cityLabel(item) {
  // e.g. "Bhubaneswar, Odisha, IN"
  const parts = [item.name];
  if (item.state)   parts.push(item.state);
  if (item.country) parts.push(item.country);
  return parts.join(", ");
}

export default function SearchBar({ onSearch, disabled }) {
  const [query,       setQuery]       = useState("");
  const [status,      setStatus]      = useState("idle"); // idle | loading | error
  const [errMsg,      setErrMsg]      = useState("");
  const [focused,     setFocused]     = useState(false);

  // ── autocomplete state ──────────────────────────────────────────────────
  const [suggestions, setSuggestions] = useState([]); // array of OWM geo results
  const [showDrop,    setShowDrop]    = useState(false);
  const [activeIdx,   setActiveIdx]   = useState(-1);  // keyboard-highlighted row

  // ── refs ────────────────────────────────────────────────────────────────
  const wrapperRef  = useRef(null);   // the whole search-wrapper div
  const debounceRef = useRef(null);   // holds the setTimeout id

  // ── close dropdown when user clicks outside the search bar ─────────────
  // We attach a "mousedown" listener to the document.
  // If the click target is NOT inside wrapperRef, we hide the dropdown.
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDrop(false);
        setActiveIdx(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    // Cleanup: remove listener when component unmounts
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── debounced autocomplete fetch ────────────────────────────────────────
  // Runs every time `query` changes.
  // We wait 350ms after the user stops typing before hitting the API —
  // this prevents a request on every single keystroke.
  useEffect(() => {
    const trimmed = query.trim();

    // Don't fetch for very short queries or if no key
    if (trimmed.length < 2 || !API_KEY) {
      setSuggestions([]);
      setShowDrop(false);
      return;
    }

    // Clear any previous pending timer
    clearTimeout(debounceRef.current);

    // Schedule a new fetch after 350ms of silence
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${GEO_URL}?q=${encodeURIComponent(trimmed)}&limit=5&appid=${API_KEY}`
        );
        if (!res.ok) return; // silently ignore errors in autocomplete
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          setSuggestions(data);
          setShowDrop(true);
          setActiveIdx(-1);
        } else {
          setSuggestions([]);
          setShowDrop(false);
        }
      } catch {
        // Network hiccup — just hide dropdown, don't show error
        setSuggestions([]);
        setShowDrop(false);
      }
    }, 350);

    // Cleanup: if query changes before timer fires, cancel the old timer
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // ── confirm a city (suggestion click OR Enter/SCAN with no suggestion) ──
  // This is the single function that fires onSearch.
  const confirmCity = useCallback((lat, lon) => {
    setShowDrop(false);
    setActiveIdx(-1);
    setStatus("idle");
    onSearch(lat, lon);
  }, [onSearch]);

  // ── handle suggestion row click ─────────────────────────────────────────
  function handleSuggestionClick(item) {
    setQuery(cityLabel(item));    // fill input with full city name
    confirmCity(item.lat, item.lon);
  }

  // ── manual search (Enter key or SCAN button) ────────────────────────────
  // If a suggestion is keyboard-highlighted, use it.
  // Otherwise fall back to fetching limit=1 for the raw query string.
  const handleSearch = useCallback(async () => {
    // Case 1: user has a suggestion highlighted via keyboard → use it
    if (activeIdx >= 0 && suggestions[activeIdx]) {
      const item = suggestions[activeIdx];
      setQuery(cityLabel(item));
      confirmCity(item.lat, item.lon);
      return;
    }

    // Case 2: first suggestion exists, just pick it (like Google does)
    if (suggestions.length > 0 && showDrop) {
      const item = suggestions[0];
      setQuery(cityLabel(item));
      confirmCity(item.lat, item.lon);
      return;
    }

    // Case 3: no suggestions visible — do a fresh geocode for the raw query
    const city = query.trim();
    if (!city) return;

    setStatus("loading");
    setErrMsg("");
    setShowDrop(false);

    try {
      const res = await fetch(
        `${GEO_URL}?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`
      );
      if (!res.ok) throw new Error(`Geocoding error: ${res.status}`);

      const data = await res.json();
      if (!data || data.length === 0) {
        setStatus("error");
        setErrMsg(`"${city}" not found — try a different spelling.`);
        return;
      }

      confirmCity(data[0].lat, data[0].lon);
    } catch (err) {
      console.error("[SearchBar]", err);
      setStatus("error");
      setErrMsg("Network error — check your connection.");
    }
  }, [query, activeIdx, suggestions, showDrop, confirmCity]);

  // ── keyboard navigation inside the input ───────────────────────────────
  // Arrow keys move the highlighted suggestion up/down.
  // Enter confirms. Escape closes the dropdown.
  function handleKeyDown(e) {
    if (!showDrop || suggestions.length === 0) {
      if (e.key === "Enter") handleSearch();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault(); // stop page scrolling
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      setShowDrop(false);
      setActiveIdx(-1);
    }
  }

  const isLoading = status === "loading" || disabled;

  return (
    <div className="search-wrapper" ref={wrapperRef}>

      {/* ── Bar ─────────────────────────────────────────────────────── */}
      <motion.div
        className={[
          "search-bar",
          focused            ? "search-bar--focused" : "",
          isLoading          ? "search-bar--loading" : "",
          status === "error" ? "search-bar--error"   : "",
        ].join(" ")}
        initial={{ opacity: 0, y: -28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="sb-top-glow" aria-hidden="true" />

        {/* Crosshair / spinner icon */}
        <span className="sb-icon" aria-hidden="true">
          {isLoading ? (
            <span className="sb-spinner" />
          ) : (
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
              <line x1="8"    y1="0.5"  x2="8"    y2="3.5"  stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <line x1="8"    y1="12.5" x2="8"    y2="15.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <line x1="0.5"  y1="8"    x2="3.5"  y2="8"    stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <line x1="12.5" y1="8"    x2="15.5" y2="8"    stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          )}
        </span>

        {/* Input */}
        <input
          className="sb-input"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setFocused(true);
            // Re-show dropdown if suggestions already exist
            if (suggestions.length > 0) setShowDrop(true);
          }}
          onBlur={() => setFocused(false)}
          placeholder="ENTER CITY NAME..."
          autoComplete="off"
          spellCheck={false}
          disabled={isLoading}
          aria-label="Search city"
          aria-autocomplete="list"
          aria-expanded={showDrop}
        />

        {/* Clear × */}
        <AnimatePresence>
          {query.length > 0 && !isLoading && (
            <motion.button
              className="sb-clear"
              onClick={() => {
                setQuery("");
                setStatus("idle");
                setSuggestions([]);
                setShowDrop(false);
              }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.15 }}
              aria-label="Clear"
              type="button"
            >✕</motion.button>
          )}
        </AnimatePresence>

        <div className="sb-divider" aria-hidden="true" />

        {/* SCAN button */}
        <motion.button
          className="sb-btn"
          onClick={handleSearch}
          disabled={isLoading || !query.trim()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
        >
          {isLoading ? "SCANNING" : "SCAN"}
        </motion.button>
      </motion.div>

      {/* ── Autocomplete dropdown ────────────────────────────────────── */}
      <AnimatePresence>
        {showDrop && suggestions.length > 0 && (
          <motion.ul
            className="sb-dropdown"
            role="listbox"
            aria-label="City suggestions"
            initial={{ opacity: 0, y: -8, scaleY: 0.92 }}
            animate={{ opacity: 1, y: 0,  scaleY: 1 }}
            exit={{    opacity: 0, y: -6, scaleY: 0.94 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ originY: 0 }} // scale from the top edge
          >
            {suggestions.map((item, idx) => (
              <motion.li
                key={`${item.lat}-${item.lon}-${idx}`}
                className={`sb-suggestion ${activeIdx === idx ? "sb-suggestion--active" : ""}`}
                role="option"
                aria-selected={activeIdx === idx}
                // mousedown fires before onBlur, so the click registers
                // before the input loses focus and hides the dropdown
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent input blur
                  handleSuggestionClick(item);
                }}
                onMouseEnter={() => setActiveIdx(idx)}
                whileHover={{ x: 3 }}
                transition={{ duration: 0.1 }}
              >
                {/* Pin icon */}
                <span className="sug-icon" aria-hidden="true">
                  <svg width="10" height="12" viewBox="0 0 10 13" fill="none">
                    <path d="M5 0C2.24 0 0 2.24 0 5c0 3.75 5 8 5 8s5-4.25 5-8c0-2.76-2.24-5-5-5z" fill="currentColor"/>
                    <circle cx="5" cy="5" r="1.8" fill="rgba(0,8,20,0.7)"/>
                  </svg>
                </span>

                {/* City name — bold part */}
                <span className="sug-name">{item.name}</span>

                {/* State + country — dimmer */}
                <span className="sug-meta">
                  {[item.state, item.country].filter(Boolean).join(", ")}
                </span>

                {/* Lat/lon — very dim, right-aligned */}
                <span className="sug-coords">
                  {item.lat.toFixed(1)}°&nbsp;{item.lon.toFixed(1)}°
                </span>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* ── Error message ────────────────────────────────────────────── */}
      <AnimatePresence>
        {status === "error" && (
          <motion.p
            className="sb-error"
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            ⚠ {errMsg}
          </motion.p>
        )}
      </AnimatePresence>

    </div>
  );
}
