// src/components/WeatherPopup.jsx — COMPLETE REPLACEMENT
//
// The only change from your previous version:
//   • Accepts a new optional `clickPos` prop  ({ x, y } | null)
//   • A tiny helper `computePosition()` converts that into safe top/left values
//   • The motion.div for the panel uses those values instead of CSS centering
//   • Framer Motion only animates opacity + scale (no translate) → zero conflicts
//   • ALL other markup, logic, helpers, and styling are UNCHANGED

import { motion, AnimatePresence } from "framer-motion";
import ForecastCard from "./ForecastCard";
import AIAdvice     from "./AIAdvice";

// ─── Time formatter (unchanged) ───────────────────────────────────────────────
function formatTime(unixSeconds, timezoneOffsetSeconds) {
  const date    = new Date((unixSeconds + timezoneOffsetSeconds) * 1000);
  const hours   = date.getUTCHours();
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const ampm    = hours >= 12 ? "PM" : "AM";
  const h12     = hours % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

// ─── Forecast grouper (unchanged) ────────────────────────────────────────────
function groupForecastByDay(list) {
  const days = {};
  list.forEach((item) => {
    const dateKey = item.dt_txt.split(" ")[0];
    if (!days[dateKey]) {
      days[dateKey] = {
        date:    new Date(item.dt * 1000).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        tempMax: item.main.temp_max,
        tempMin: item.main.temp_min,
        icon:    item.weather[0].icon,
        condition: item.weather[0].main,
        pop:     item.pop ?? 0,
      };
    } else {
      const d = days[dateKey];
      d.tempMax = Math.max(d.tempMax, item.main.temp_max);
      d.tempMin = Math.min(d.tempMin, item.main.temp_min);
      d.pop     = Math.max(d.pop, item.pop ?? 0);
      if (item.dt_txt.includes("12:00:00")) {
        d.icon      = item.weather[0].icon;
        d.condition = item.weather[0].main;
      }
    }
  });
  return Object.values(days).slice(0, 7);
}

// ─── Stat row (unchanged) ────────────────────────────────────────────────────
function StatRow({ label, value }) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

// ─── NEW: safe position calculator ───────────────────────────────────────────
//
// Takes the raw click pixel coords and returns { top, left } in pixels that:
//   • offset the popup slightly away from the cursor (so it doesn't cover it)
//   • clamp so the popup never overflows any edge of the viewport
//
// POPUP_W / POPUP_H are conservative estimates of the popup's rendered size.
// They don't need to be pixel-perfect — the clamping adds padding anyway.
//
// We only use top + left (no transform: translate) so there is zero risk of
// conflicting with Framer Motion's own transform animations.

const POPUP_W   = 480;   // max-width from CSS (px)
const POPUP_H   = 600;   // conservative max height estimate (px)
const OFFSET_X  = 24;    // horizontal gap from cursor
const OFFSET_Y  = 20;    // vertical gap from cursor
const EDGE_PAD  = 16;    // minimum distance from any viewport edge

function computePosition(clickPos) {
  // No click position (e.g. from Search) → return null → CSS centers popup
  if (!clickPos) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Start: place popup to the right-and-below the click
  let left = clickPos.x + OFFSET_X;
  let top  = clickPos.y + OFFSET_Y;

  // If it would overflow the RIGHT edge → flip to the left of the cursor
  if (left + POPUP_W > vw - EDGE_PAD) {
    left = clickPos.x - POPUP_W - OFFSET_X;
  }

  // If it would overflow the BOTTOM edge → shift up
  if (top + POPUP_H > vh - EDGE_PAD) {
    top = vh - POPUP_H - EDGE_PAD;
  }

  // Hard clamp — never go off the left or top edge either
  left = Math.max(EDGE_PAD, left);
  top  = Math.max(EDGE_PAD, top);

  return { top, left };
}

// ─── Main component ───────────────────────────────────────────────────────────
//
// Props:
//   weather  — OWM current weather object
//   forecast — OWM forecast object (can be null)
//   onClose  — close handler
//   clickPos — { x, y } pixel coords of the globe click, or null

export default function WeatherPopup({ weather, forecast, onClose, clickPos }) {
  if (!weather) return null;

  const { main, wind, visibility, sys, weather: conditions, timezone, name } = weather;
  const condition    = conditions[0];
  const forecastDays = forecast ? groupForecastByDay(forecast.list) : [];

  // Compute where to place the panel (null = use CSS centering fallback)
  const pos = computePosition(clickPos);

  // ── Positioning style applied to the panel ───────────────────────────────
  //
  // When pos is available: use exact top/left pixel values.
  // When pos is null (search trigger): fall back to CSS class centering.
  //
  // IMPORTANT: we do NOT use `transform` here at all.
  // Framer Motion's `scale` animation uses its own internal transform,
  // and as long as we don't add a competing CSS transform, it works cleanly.
  const panelPositionStyle = pos
    ? { top: pos.top, left: pos.left, transform: "none" }
    : {};  // empty → CSS class `.popup-panel` centers with its own transform

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="popup-backdrop"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Panel */}
      <motion.div
        className="popup-panel"
        onClick={(e) => e.stopPropagation()}
        style={panelPositionStyle}
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.88 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
      >
        {/* Close button */}
        <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>

        {/* Scrollable content — all unchanged below this line */}
        <div className="popup-scroll">

          <div className="popup-header">
            <div className="location-chip">
              <span className="location-dot" />
              <span className="location-name">{name}, {sys.country}</span>
            </div>

            <div className="main-temp-row">
              <img
                className="condition-icon-large"
                src={`https://openweathermap.org/img/wn/${condition.icon}@4x.png`}
                alt={condition.description}
              />
              <div className="temp-block">
                <span className="temp-main">{Math.round(main.temp)}°C</span>
                <span className="condition-desc">{condition.description}</span>
                <span className="feels-like">Feels like {Math.round(main.feels_like)}°C</span>
              </div>
            </div>

            <div className="scan-line" />
          </div>

          <div className="stats-section">
            <div className="stats-grid">
              <StatRow label="💧 Humidity"   value={`${main.humidity}%`} />
              <StatRow label="💨 Wind"       value={`${wind.speed} m/s`} />
              <StatRow label="🌡 Pressure"   value={`${main.pressure} hPa`} />
              <StatRow label="👁 Visibility" value={`${(visibility / 1000).toFixed(1)} km`} />
              <StatRow label="🌅 Sunrise"    value={formatTime(sys.sunrise, timezone)} />
              <StatRow label="🌇 Sunset"     value={formatTime(sys.sunset, timezone)} />
            </div>
          </div>

          {forecastDays.length > 0 && (
            <div className="forecast-section">
              <div className="section-title">◈ 7-DAY FORECAST</div>
              <div className="forecast-strip">
                {forecastDays.map((day, i) => (
                  <ForecastCard key={day.date} day={day} index={i} />
                ))}
              </div>
            </div>
          )}

          <AIAdvice weather={weather} forecast={forecastDays} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
