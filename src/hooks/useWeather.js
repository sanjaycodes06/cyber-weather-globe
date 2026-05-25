// src/hooks/useWeather.js
// Custom hook — handles all OpenWeatherMap API calls
// Returns { weather, forecast, loading, error, fetchWeather }

import { useState, useCallback } from "react";

// Your API key lives in .env as VITE_WEATHER_API
// Create a file called .env in the project root and add:
//   VITE_WEATHER_API=your_openweathermap_key_here
const API_KEY = import.meta.env.VITE_WEATHER_API;
const BASE = "https://api.openweathermap.org/data/2.5";

export default function useWeather() {
  const [weather, setWeather] = useState(null);   // current weather
  const [forecast, setForecast] = useState(null); // 5-day / 3-hour forecast
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * fetchWeather({ lat, lng })
   * Fetches current weather + forecast for the given coordinates.
   * Call this from your Globe's onClick handler.
   */
  const fetchWeather = useCallback(async ({ lat, lng }) => {
    if (!API_KEY) {
      setError("Missing API key. Add VITE_WEATHER_API to your .env file.");
      return;
    }

    setLoading(true);
    setError(null);
    setWeather(null);
    setForecast(null);

    try {
      // Both requests fire in parallel for speed
      const [weatherRes, forecastRes] = await Promise.all([
        fetch(
          `${BASE}/weather?lat=${lat}&lon=${lng}&units=metric&appid=${API_KEY}`
        ),
        fetch(
          `${BASE}/forecast?lat=${lat}&lon=${lng}&units=metric&appid=${API_KEY}`
        ),
      ]);

      if (!weatherRes.ok) {
        throw new Error(`Weather API error: ${weatherRes.status}`);
      }
      if (!forecastRes.ok) {
        throw new Error(`Forecast API error: ${forecastRes.status}`);
      }

      const [weatherData, forecastData] = await Promise.all([
        weatherRes.json(),
        forecastRes.json(),
      ]);

      setWeather(weatherData);
      setForecast(forecastData);
    } catch (err) {
      console.error("useWeather error:", err);
      setError(err.message || "Failed to fetch weather data.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { weather, forecast, loading, error, fetchWeather };
}
