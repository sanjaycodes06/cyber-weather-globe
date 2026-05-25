// src/components/AIAdvice.jsx
// AI-style travel advisor that generates advice based on weather conditions

import { motion } from "framer-motion";

// Icons for each advice type
const ADVICE_ICONS = {
  excellent: "🛫",
  rain: "☂️",
  humidity: "💧",
  outdoor: "🌿",
  cold: "🧥",
  hot: "🌡️",
  wind: "💨",
  snow: "❄️",
  storm: "⚡",
  fog: "🌫️",
};

/**
 * Generates an array of advice strings based on weather data.
 * Pure logic — no API calls needed.
 */
function generateAdvice(weather, forecast) {
  const advice = [];
  const temp = weather.main.temp;
  const humidity = weather.main.humidity;
  const windSpeed = weather.wind.speed;
  const condition = weather.weather[0].main.toLowerCase();
  const description = weather.weather[0].description.toLowerCase();

  // Rain check
  if (
    condition.includes("rain") ||
    condition.includes("drizzle") ||
    condition.includes("thunderstorm")
  ) {
    advice.push({ icon: ADVICE_ICONS.rain, text: "Carry an umbrella — precipitation expected." });
  }

  // Storm check
  if (condition.includes("thunderstorm")) {
    advice.push({ icon: ADVICE_ICONS.storm, text: "Severe storm conditions — avoid open areas." });
  }

  // Snow check
  if (condition.includes("snow")) {
    advice.push({ icon: ADVICE_ICONS.snow, text: "Snowfall detected — dress in warm layers." });
  }

  // Fog / Mist
  if (condition.includes("fog") || condition.includes("mist") || condition.includes("haze")) {
    advice.push({ icon: ADVICE_ICONS.fog, text: "Low visibility — drive with caution." });
  }

  // Temperature advice
  if (temp >= 28) {
    advice.push({ icon: ADVICE_ICONS.hot, text: "High heat — stay hydrated and seek shade." });
  } else if (temp <= 5) {
    advice.push({ icon: ADVICE_ICONS.cold, text: "Very cold — wear heavy clothing and gloves." });
  } else if (temp >= 18 && temp <= 27 && !condition.includes("rain")) {
    advice.push({ icon: ADVICE_ICONS.outdoor, text: "Good conditions for outdoor activities." });
  }

  // Humidity advice
  if (humidity >= 80) {
    advice.push({ icon: ADVICE_ICONS.humidity, text: `High humidity (${humidity}%) — may feel uncomfortable.` });
  }

  // Wind advice
  if (windSpeed >= 10) {
    advice.push({ icon: ADVICE_ICONS.wind, text: `Strong winds (${windSpeed} m/s) — secure loose items.` });
  }

  // Forecast rain check (next 3 days)
  if (forecast) {
    const upcomingRain = forecast
      .slice(0, 3)
      .some((day) => day.pop > 50);
    if (upcomingRain && !condition.includes("rain")) {
      advice.push({ icon: ADVICE_ICONS.rain, text: "Rain expected in the coming days — plan ahead." });
    }
  }

  // Excellent weather default
  if (advice.length === 0) {
    advice.push({ icon: ADVICE_ICONS.excellent, text: "Excellent weather for travel — enjoy your trip!" });
  }

  return advice;
}

export default function AIAdvice({ weather, forecast }) {
  const adviceList = generateAdvice(weather, forecast);

  return (
    <div className="ai-advice-container">
      <div className="ai-advice-header">
        <span className="ai-badge">◈ AI ADVISOR</span>
        <span className="ai-subtitle">Neural Travel Intelligence</span>
      </div>

      <div className="ai-advice-list">
        {adviceList.map((item, index) => (
          <motion.div
            key={index}
            className="ai-advice-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + 0.3 }}
          >
            <span className="ai-advice-icon">{item.icon}</span>
            <span className="ai-advice-text">{item.text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
