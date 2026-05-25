# 🌐 Cyberpunk Globe Weather App

A futuristic holographic weather app built with React, Vite, react-globe.gl, Framer Motion, and OpenWeatherMap.

---

## 📁 Project Structure

```
your-project/
├── .env                          ← Your API key (create this yourself)
├── .env.example                  ← Template showing what .env needs
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── App.jsx                   ← Root: Globe + popup wiring
    ├── main.jsx                  ← Vite entry point (unchanged)
    ├── hooks/
    │   └── useWeather.js         ← All OpenWeatherMap API calls
    ├── components/
    │   ├── WeatherPopup.jsx      ← Main holographic popup card
    │   ├── ForecastCard.jsx      ← Single day forecast card
    │   ├── AIAdvice.jsx          ← AI-style travel advisor
    │   └── LoadingOverlay.jsx    ← Loading spinner overlay
    └── styles/
        └── cyberpunk.css         ← Full cyberpunk / glassmorphism theme
```

---

## ⚙️ Setup

### 1. Install dependencies

```bash
npm install framer-motion react-globe.gl
```

### 2. Create your `.env` file

Copy `.env.example` to `.env` and add your real API key:

```bash
cp .env.example .env
```

Then edit `.env`:
```
VITE_WEATHER_API=your_openweathermap_api_key_here
```

Get a free key at: https://openweathermap.org/api

### 3. Run the app

```bash
npm run dev
```

---

## 🧩 How each file works

### `src/App.jsx`
- Renders the Globe
- Listens for `onGlobeClick` → gets lat/lng
- Calls `useWeather` hook to fetch data
- Shows `LoadingOverlay` while loading
- Shows `WeatherPopup` when data is ready

### `src/hooks/useWeather.js`
- Custom hook that handles all API calls
- Calls both `/weather` (current) and `/forecast` (5-day) in parallel
- Returns: `{ weather, forecast, loading, error, fetchWeather }`
- Uses `VITE_WEATHER_API` from your `.env`

### `src/components/WeatherPopup.jsx`
- The main holographic popup panel
- Shows: city, country, temperature, feels like, condition, icon
- Shows: humidity, wind, pressure, visibility, sunrise, sunset
- Includes `<ForecastCard>` strip and `<AIAdvice>` section
- Animated with Framer Motion spring physics

### `src/components/ForecastCard.jsx`
- Receives one day's data and renders it
- Shows: day label, icon, condition, temp range, rain %

### `src/components/AIAdvice.jsx`
- Pure logic — no API calls
- Generates advice based on temp, humidity, wind, condition
- Advice examples: "Carry an umbrella", "High humidity expected", etc.

### `src/components/LoadingOverlay.jsx`
- Spinning ring shown while API call is in progress

### `src/styles/cyberpunk.css`
- Design tokens (CSS variables) for all colors, fonts, radii
- Glassmorphism panels with backdrop-filter blur
- Neon cyan + purple glow effects
- Orbitron display font + Rajdhani body font
- Responsive at 500px breakpoint

---

## 🔑 OpenWeatherMap API

The app uses two endpoints:

| Endpoint | Purpose |
|----------|---------|
| `/data/2.5/weather?lat=&lon=&units=metric` | Current weather |
| `/data/2.5/forecast?lat=&lon=&units=metric` | 5-day / 3-hour forecast |

Both are included in the **free tier** (60 calls/minute).

---

## 🎨 Customization tips

- **Globe texture**: Change `globeImageUrl` in `App.jsx` to any image URL
- **Atmosphere color**: Change `atmosphereColor` for different glow colors
- **Popup position**: The popup centers on screen — change `top/left` in `.popup-panel` CSS
- **Units**: Change `units=metric` to `units=imperial` in `useWeather.js` for Fahrenheit
- **AI advice**: Add more conditions in `generateAdvice()` in `AIAdvice.jsx`
