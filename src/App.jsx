// src/App.jsx
// Root component — wires the Globe, weather fetching, and popup together

import { useRef, useState,useEffect } from "react";
import Globe from "react-globe.gl";
import { AnimatePresence } from "framer-motion";

import useWeather from "./hooks/useWeather";
import WeatherPopup from "./components/WeatherPopup";
import LoadingOverlay from "./components/LoadingOverlay";

import "./styles/cyberpunk.css";

export default function App() {
  const globeRef = useRef(null);

  // Track whether the popup is open
  const [showPopup, setShowPopup] = useState(false);

  // Custom hook handles all API calls
  const { weather, forecast, loading, error, fetchWeather } = useWeather();

  // ── Globe click handler ────────────────────────────────────────────────────
  // react-globe.gl calls onGlobeClick with { lat, lng, altitude }
  function handleGlobeClick({ lat, lng }) {
    setShowPopup(false); // close any existing popup first
    fetchWeather({ lat, lng });
    // Show popup once data arrives (handled by useEffect below)
  }

  useEffect(() => {
    if(!loading && weather) {
      setShowPopup(true);
    }
  }, [loading, weather]);

  // Open popup whenever fresh weather data arrives
  // We use a small trick: watch `weather` prop in WeatherPopup
  // so we just always show it when weather is non-null
  function handleClose() {
    setShowPopup(false);
  }

  // Whenever we get new weather data, open the popup
  // (loading state hides it; error state shows error toast)
  const isOpen = showPopup&& !loading && !!weather;

  return (
    <div className="app-root">
      {/* ── Cyberpunk HUD overlay (decorative) ────────────────────────── */}
      <div className="hud-corner hud-tl">
        <span className="hud-label">NEURAL WEATHER SYS</span>
        <span className="hud-version">v2.0.77 ◈ ONLINE</span>
      </div>
      <div className="hud-corner hud-tr">
        <span className="hud-label">GLOBAL SCAN MODE</span>
        <span className="hud-version">CLICK EARTH TO PROBE</span>
      </div>

      {/* ── 3D Globe ──────────────────────────────────────────────────── */}
      <Globe
        ref={globeRef}
        // Visual settings — tweak these to match your existing globe config
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereColor="rgba(0, 255, 255, 0.15)"
        atmosphereAltitude={0.25}
        // Click detection
        onGlobeClick={handleGlobeClick}
        // Rotation
        animateIn={true}
      />

      {/* ── Loading overlay ───────────────────────────────────────────── */}
      <AnimatePresence>
        {loading && <LoadingOverlay key="loader" />}
      </AnimatePresence>

      {/* ── Error toast ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <div className="error-toast">
            ⚠ {error}
          </div>
        )}
      </AnimatePresence>

      {/* ── Weather popup ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <WeatherPopup
            key="popup"
            weather={weather}
            forecast={forecast}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
