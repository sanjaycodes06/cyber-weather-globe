// src/components/WeatherPopup.jsx
// The main holographic weather popup — shows current conditions, forecast, and AI advice

import { motion, AnimatePresence } from "framer-motion";
import ForecastCard from "./ForecastCard";
import AIAdvice from "./AIAdvice";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert Unix timestamp + timezone offset → "HH:MM AM/PM" */
function formatTime(unixSeconds, timezoneOffsetSeconds) {
  const date = new Date((unixSeconds + timezoneOffsetSeconds) * 1000);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

/** Convert a list of 3-hour forecast slots → one entry per day */
function groupForecastByDay(list) {
  const days = {};

  list.forEach((item) => {
    // "2024-03-15" → use as the key
    const dateKey = item.dt_txt.split(" ")[0];

    if (!days[dateKey]) {
      days[dateKey] = {
        date: new Date(item.dt * 1000).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        tempMax: item.main.temp_max,
        tempMin: item.main.temp_min,
        icon: item.weather[0].icon,
        condition: item.weather[0].main,
        pop: item.pop ?? 0,
        count: 1,
      };
    } else {
      const d = days[dateKey];
      d.tempMax = Math.max(d.tempMax, item.main.temp_max);
      d.tempMin = Math.min(d.tempMin, item.main.temp_min);
      d.pop = Math.max(d.pop, item.pop ?? 0);
      // Use the noon slot icon when available for best representation
      if (item.dt_txt.includes("12:00:00")) {
        d.icon = item.weather[0].icon;
        d.condition = item.weather[0].main;
      }
      d.count++;
    }
  });

  // Return up to 7 days, skipping today (first entry)
  return Object.values(days).slice(0, 7);
}

// ─── Stat Row ────────────────────────────────────────────────────────────────

function StatRow({ label, value }) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

/**
 * Props:
 *  - weather:  current weather object from OWM /weather endpoint
 *  - forecast: forecast object from OWM /forecast endpoint  (can be null)
 *  - onClose:  function to close the popup
 */
export default function WeatherPopup({ weather, forecast, onClose }) {
  if (!weather) return null;

  const { main, wind, visibility, sys, weather: conditions, timezone, name } = weather;
  const condition = conditions[0];
  const forecastDays = forecast ? groupForecastByDay(forecast.list) : [];

  return (
    <AnimatePresence>
      {/* Backdrop — clicking outside closes the popup */}
      <motion.div
        className="popup-backdrop"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Popup panel */}
      <motion.div
        className="popup-panel"
        onClick={(e) => e.stopPropagation()} // prevent close when clicking inside
        initial={{ opacity: 0, scale: 0.75, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.75, y: 40 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      >
        {/* ── Close button ── */}
        <button className="close-btn" onClick={() => {console.log("Close button clicked"); if (onClose) onClose();}} aria-label="Close">
          ✕
        </button>

        {/* ── Scrollable inner content ── */}
        <div className="popup-scroll">

          {/* ── Header: location + main temp ── */}
          <div className="popup-header">
            <div className="location-chip">
              <span className="location-dot" />
              <span className="location-name">
                {name}, {sys.country}
              </span>
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

            {/* Decorative scan line */}
            <div className="scan-line" />
          </div>

          {/* ── Stats grid ── */}
          <div className="stats-section">
            <div className="stats-grid">
              <StatRow label="💧 Humidity" value={`${main.humidity}%`} />
              <StatRow label="💨 Wind" value={`${wind.speed} m/s`} />
              <StatRow label="🌡 Pressure" value={`${main.pressure} hPa`} />
              <StatRow
                label="👁 Visibility"
                value={`${(visibility / 1000).toFixed(1)} km`}
              />
              <StatRow
                label="🌅 Sunrise"
                value={formatTime(sys.sunrise, timezone)}
              />
              <StatRow
                label="🌇 Sunset"
                value={formatTime(sys.sunset, timezone)}
              />
            </div>
          </div>

          {/* ── 7-day forecast ── */}
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

          {/* ── AI Advice ── */}
          <AIAdvice weather={weather} forecast={forecastDays} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
