// src/App.jsx — COMPLETE REPLACEMENT
//
// Changes from your previous version (marked ← CHANGED / ← NEW):
//   1. handleGlobeClick now reads e.clientX / e.clientY from the native event
//   2. clickPos state stores { x, y } pixel coords
//   3. clickPos is passed as a prop to WeatherPopup
//   4. Everything else is IDENTICAL to your working version

import { useRef, useState, useEffect, useCallback } from "react";
import Globe from "react-globe.gl";
import { AnimatePresence } from "framer-motion";

import useWeather     from "./hooks/useWeather";
import WeatherPopup   from "./components/WeatherPopup";
import LoadingOverlay from "./components/LoadingOverlay";
import Starfield      from "./components/Starfield";
import SearchBar      from "./components/SearchBar";

import "./styles/cyberpunk.css";
import "./styles/searchbar.css";

export default function App() {
  const globeRef = useRef(null);
  const [showPopup, setShowPopup] = useState(false);
  const [clickPos, setClickPos]   = useState(null);  // ← NEW: { x, y } in pixels

  const { weather, forecast, loading, error, fetchWeather } = useWeather();

  // ── Globe click ──────────────────────────────────────────────────────────
  // react-globe.gl calls onGlobeClick with (coords, event)
  // The second argument is the native MouseEvent — it has clientX / clientY.
  function handleGlobeClick({ lat, lng }, event) {   // ← CHANGED: added `event`
    setShowPopup(false);

    // Store the pixel position of the click so WeatherPopup can position near it.
    // clientX/Y are always safe — they come straight from the browser event.
    if (event) {
      setClickPos({ x: event.clientX, y: event.clientY });  // ← NEW
    }

    fetchWeather({ lat, lng });
  }

  // ── Open popup once data arrives ─────────────────────────────────────────
  useEffect(() => {
    if (!loading && weather) {
      setShowPopup(true);
    }
  }, [loading, weather]);

  function handleClose() {
    setShowPopup(false);
  }

  // ── Search bar handler ───────────────────────────────────────────────────
  // For search, we position the popup at screen center (no cursor position).
  // Passing null tells WeatherPopup to fall back to its centered default.
  const handleGeoSearch = useCallback((lat, lng) => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat, lng, altitude: 2.0 }, 1200);
    }
    setClickPos(null);          // ← NEW: center popup for searches
    setShowPopup(false);
    fetchWeather({ lat, lng });
  }, [fetchWeather]);

  const isOpen = showPopup && !loading && !!weather;

  return (
    <div
      className="app-root"
      style={{
        position: "relative",
        background: "#00000a",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <Starfield count={600} />

      <div className="hud-corner hud-tl" style={{ zIndex: 20 }}>
        <span className="hud-top-label">TERRAPULSE</span>
        <span className="hud-label">NEURAL WEATHER SYS</span>
        <span className="hud-version">v2.0.77 ◈ ONLINE</span>
      </div>
      <div className="hud-corner hud-tr" style={{ zIndex: 20 }}>
        <span className="hud-label">GLOBAL SCAN MODE</span>
        <span className="hud-version">CLICK EARTH OR SEARCH</span>
      </div>
      <div className="signature">
        crafted with ♥ by sanjay •
        <a href="https://github.com/sanjaycodes06" target="_blank" rel="noreferrer">github.com/sanjaycodes06</a>
      </div>

      <div style={{ position: "absolute", inset: 0, zIndex: 5 }}>
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          cloudImageUrl="https://raw.githubusercontent.com/turban/webgl-earth/master/images/fair_clouds_4k.png"
          cloudsAltitude={0.01}
          cloudsSpeed={0.25}
          atmosphereColor="rgba(2, 2, 2, 0.15)"
          atmosphereAltitude={0.11}
          onGlobeClick={handleGlobeClick}
          animateIn={true}
          backgroundColor="rgba(0,0,0,0)"
          showAtmosphere={true}
        />
      </div>

      <SearchBar onSearch={handleGeoSearch} disabled={loading} />

      <AnimatePresence>
        {loading && <LoadingOverlay key="loader" />}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <div className="error-toast" style={{ zIndex: 100 }}>⚠ {error}</div>
        )}
      </AnimatePresence>

      {/* ← CHANGED: pass clickPos prop */}
      <AnimatePresence>
        {isOpen && (
          <WeatherPopup
            key="popup"
            weather={weather}
            forecast={forecast}
            onClose={handleClose}
            clickPos={clickPos}   // ← NEW prop — null = center, {x,y} = near cursor
          />
        )}
      </AnimatePresence>
    </div>
  );
}
//all good things come to an end.