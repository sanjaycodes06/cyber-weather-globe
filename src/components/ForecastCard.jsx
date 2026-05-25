// src/components/ForecastCard.jsx
// Displays a single day's forecast — used inside the 7-day forecast strip

import { motion } from "framer-motion";

/**
 * Props:
 *  - day: { date, icon, condition, tempMax, tempMin, pop }
 *  - index: number (used for staggered animation delay)
 */
export default function ForecastCard({ day, index }) {
  return (
    <motion.div
      className="forecast-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 + 0.2 }}
    >
      {/* Day label */}
      <div className="fc-day">{day.date}</div>

      {/* Weather icon */}
      <img
        className="fc-icon"
        src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
        alt={day.condition}
      />

      {/* Condition text */}
      <div className="fc-condition">{day.condition}</div>

      {/* Temperature range */}
      <div className="fc-temps">
        <span className="fc-high">{Math.round(day.tempMax)}°</span>
        <span className="fc-separator">/</span>
        <span className="fc-low">{Math.round(day.tempMin)}°</span>
      </div>

      {/* Rain probability */}
      <div className="fc-rain">
        <span className="fc-rain-icon">🌧</span>
        <span className="fc-rain-pct">{Math.round(day.pop * 100)}%</span>
      </div>
    </motion.div>
  );
}
