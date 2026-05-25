// src/App.jsx
import { useRef, useState, useEffect } from "react";
import Globe from "react-globe.gl";
import { AnimatePresence } from "framer-motion";

import useWeather from "./hooks/useWeather";
import WeatherPopup from "./components/WeatherPopup";
import LoadingOverlay from "./components/LoadingOverlay";
import Starfield from "./components/Starfield"; // ◄ IMPORT YOUR COMPONENT HERE

import "./styles/cyberpunk.css";

export default function App() {
  const globeRef = useRef(null);
  const [showPopup, setShowPopup] = useState(false);
  const { weather, forecast, loading, error, fetchWeather } = useWeather();

  function handleGlobeClick({ lat, lng }) {
    setShowPopup(false); 
    fetchWeather({ lat, lng });
  }

  useEffect(() => {
    if(!loading && weather) {
      setShowPopup(true);
    }
  }, [loading, weather]);

  function handleClose() {
    setShowPopup(false);
  }

  const isOpen = showPopup && !loading && !!weather;

  return (
    <div className="app-root" style={{ position: 'relative', background: '#00000a', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      
      {/* ─── 1. CLEAN AND PROFESSIONAL COMPONENT ABSTRACTION ─── */}
      <Starfield count={600} />

      {/* ── Cyberpunk overlay (decorative) ────────────────────────── */}
      <div className="hud-corner hud-tl" style={{ zIndex: 20 }}>
        <span className="hud-label">NEURAL WEATHER SYS</span>
        <span className="hud-version">v2.0.77 ◈ ONLINE</span>
      </div>
      <div className="hud-corner hud-tr" style={{ zIndex: 20 }}>
        <span className="hud-label">GLOBAL SCAN MODE</span>
        <span className="hud-version">CLICK EARTH TO PROBE</span>
      </div>

      {/* ── 3D Globe ──────────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
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

      {/* ── Loading overlay ───────────────────────────────────────────── */}
      <AnimatePresence>
        {loading && <LoadingOverlay key="loader" />}
      </AnimatePresence>

      {/* ── Error toast ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <div className="error-toast" style={{ zIndex: 100 }}>
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