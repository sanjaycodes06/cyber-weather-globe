// src/components/LoadingOverlay.jsx
// Shown while weather data is being fetched

import { motion } from "framer-motion";

export default function LoadingOverlay() {
  return (
    <motion.div
      className="loading-overlay"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      <div className="loading-spinner" />
      <div className="loading-text">SCANNING COORDINATES</div>
      <div className="loading-subtext">Neural uplink established...</div>
    </motion.div>
  );
}
