import { useEffect, useRef, useState, useCallback } from 'react'
import Globe from 'react-globe.gl'

// ─── Starfield: generate random star positions once on module load ─────────────
// Each star is: { x: %, y: %, size: px, opacity, duration: animation seconds }
const STARS = Array.from({ length: 260 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() < 0.15 ? 2 : 1,           // 15% are slightly bigger
  opacity: 0.3 + Math.random() * 0.65,
  twinkleDuration: 2.5 + Math.random() * 4,      // each star twinkles at its own pace
  twinkleDelay: Math.random() * 5,
}))

export default function GlobeComponent() {
  const globeRef   = useRef()
  const [size, setSize]     = useState({ w: window.innerWidth, h: window.innerHeight })
  const [ready, setReady]   = useState(false)
  // Stores the last clicked coordinates so the HUD and console can show them
  const [clicked, setClicked] = useState(null)

  // ── Responsive resize ────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ── Globe controls setup ─────────────────────────────────────────────────────
  const handleGlobeReady = useCallback(() => {
    if (!globeRef.current) return
    const ctrl = globeRef.current.controls()

    // Smooth, cinematic auto-rotation
    ctrl.autoRotate        = true
    ctrl.autoRotateSpeed   = 0.35       // slow & majestic
    ctrl.enableDamping     = true
    ctrl.dampingFactor     = 0.04       // buttery inertia
    ctrl.enableZoom        = true
    ctrl.minDistance       = 220
    ctrl.maxDistance       = 800

    // Start with a slight tilt for a more dramatic view
    globeRef.current.pointOfView({ lat: 15, lng: 0, altitude: 2.0 }, 0)

    // Fade in after controls are wired
    setTimeout(() => setReady(true), 100)
  }, [])

  // ── Click handler ────────────────────────────────────────────────────────────
  // react-globe.gl calls this with ({ lat, lng, altitude }, event) when the
  // user clicks directly on the Earth surface (not on empty space).
  const handleGlobeClick = useCallback(({ lat, lng }) => {
    // Round to 4 decimal places — plenty of precision, easy to read
    const coords = {
      lat: parseFloat(lat.toFixed(4)),
      lng: parseFloat(lng.toFixed(4)),
    }

    // 1️⃣  Log to console so developers can see it immediately
    console.log(`🌍 Globe clicked — lat: ${coords.lat}, lng: ${coords.lng}`)

    // 2️⃣  Save to state so the HUD can display it live
    setClicked(coords)
  }, [])

  return (
    <div style={s.root}>

      {/* ── Layer 1: Deep space background ── */}
      <div style={s.spaceGradient} />

      {/* ── Layer 2: Individual twinkling stars ── */}
      <div style={s.starCanvas} aria-hidden="true">
        {STARS.map(star => (
          <div
            key={star.id}
            style={{
              position: 'absolute',
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              borderRadius: '50%',
              backgroundColor: '#fff',
              
              animation: `twinkle ${star.twinkleDuration}s infinite ease-in-out`,
              animationDelay: `${star.twinkleDelay}s`,
              
            }}
          />
        ))}
      </div>

      {/* ── Layer 3: Nebula accent — soft colour clouds for depth ── */}
      <div style={s.nebulaBlue}  aria-hidden="true" />
      <div style={s.nebulaTeal}  aria-hidden="true" />

      {/* ── Layer 4: The Globe ── */}
      <div className='globe-wrapper' style={{ ...s.globeWrapper, opacity: ready ? 1 : 0 }}>
        <Globe
          ref={globeRef}
          width={size.w}
          height={size.h}
          onGlobeReady={handleGlobeReady}

          // Earth textures
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"

          // Neon blue atmosphere — the signature cyberpunk glow
          showAtmosphere={true}
          atmosphereColor="#00aaff"
          atmosphereAltitude={0.22}

          // Transparent background so our CSS layers show through
          backgroundColor="rgba(0,0,0,0)"

          // No data layers yet — clean cinematic look
          pointsData={[]}
          arcsData={[]}

          // ── Click detection ──────────────────────────────────────
          // onGlobeClick fires only when the user clicks Earth itself.
          // It receives { lat, lng, altitude } — we forward that to our handler.
          onGlobeClick={handleGlobeClick}
        />
      </div>

      {/* ── Layer 5: Vignette — pulls focus to the globe center ── */}
      <div style={s.vignette} aria-hidden="true" />

      {/* ── Layer 6: CRT scan lines — subtle cyberpunk texture ── */}
      <div style={s.scanlines} aria-hidden="true" />

      {/* ── Layer 7: HUD chrome ── */}
      <HUD clicked={clicked} />

      {/* ── Keyframe styles injected once ── */}
      <style>{KEYFRAMES}</style>
    </div>
  )
}

// ─── HUD overlay ──────────────────────────────────────────────────────────────
function HUD({ clicked }) {
  const [tick, setTick] = useState(0)

  // Blinking cursor effect for the live indicator
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 800)
    return () => clearInterval(id)
  }, [])

  // Format a decimal coordinate into degrees + N/S or E/W label
  // e.g. formatLat(48.8566) → "48.8566° N"
  const formatLat = (lat) => `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`
  const formatLng = (lng) => `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`

  return (
    <>
      {/* Top-left — system ID */}
      <div style={{ ...s.hud, top: 28, left: 32 }}>
        <span style={s.hudTitle}>GEO // EARTH-1</span>
        <span style={s.hudSub}>ATMOSPHERIC MONITOR v2.4</span>
        <div style={s.hudRule} />
        <span style={s.hudMicro}>REAL-TIME ORBITAL SCAN</span>
      </div>

      {/* Top-right — status */}
      <div style={{ ...s.hud, top: 28, right: 32, alignItems: 'flex-end' }}>
        <span style={{ ...s.hudTitle, color: '#00ffaa' }}>
          {tick % 2 === 0 ? '● ' : '○ '}LIVE
        </span>
        <span style={s.hudSub}>SIGNAL NOMINAL</span>
        <div style={s.hudRule} />
        <span style={s.hudMicro}>SAT LINK STABLE</span>
      </div>

      {/* Bottom-left — interaction hint */}
      <div style={{ ...s.hud, bottom: 28, left: 32 }}>
        <span style={s.hudMicro}>DRAG TO ROTATE  ·  SCROLL TO ZOOM  ·  CLICK TO PING</span>
      </div>

      {/* Bottom-right — live coordinates, updated on every click */}
      <div style={{ ...s.hud, bottom: 28, right: 32, alignItems: 'flex-end' }}>
        {clicked ? (
          // Show real coordinates once the user has clicked
          <>
            <span style={{ ...s.hudTitle, color: '#00ffcc', fontSize: 10 }}>
              ◎ PING ACQUIRED
            </span>
            <span style={s.hudSub}>{formatLat(clicked.lat)}</span>
            <span style={s.hudSub}>{formatLng(clicked.lng)}</span>
          </>
        ) : (
          // Placeholder before first click
          <span style={s.hudMicro}>CLICK EARTH TO PING</span>
        )}
      </div>
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const FONT = '"Courier New", Courier, monospace'

const s = {
  root: {
    position:   'fixed',
    inset:       0,
    background: '#00000a',
    overflow:   'hidden',
    cursor:     'grab',
  },

  // Deep space — very dark blue-black gradient
  spaceGradient: {
    position:   'absolute',
    inset:       0,
    background: 'radial-gradient(ellipse at 60% 40%, #020818 0%, #00000a 70%)',
    zIndex:      0,
  },

  // Star canvas covers the full viewport
  starCanvas: {
    position:   'absolute',
    inset:       0,
    zIndex:      1,
    pointerEvents: 'none',
  },

  // Soft nebula blobs — painted with box-shadow and blur
  nebulaBlue: {
    position:   'absolute',
    top:        '10%',
    right:      '5%',
    width:       400,
    height:      300,
    borderRadius: '50%',
    background: 'radial-gradient(ellipse, rgba(0,80,200,0.07) 0%, transparent 70%)',
    filter:     'blur(40px)',
    zIndex:      2,
    pointerEvents: 'none',
  },
  nebulaTeal: {
    position:   'absolute',
    bottom:     '15%',
    left:       '5%',
    width:       350,
    height:      250,
    borderRadius: '50%',
    background: 'radial-gradient(ellipse, rgba(0,180,140,0.06) 0%, transparent 70%)',
    filter:     'blur(40px)',
    zIndex:      2,
    pointerEvents: 'none',
  },

  globeWrapper: {
    position:   'absolute',
    inset:       0,
    zIndex:      5,
    transition: 'opacity 1.4s ease',
  },

  // Radial vignette darkens the edges, making the globe pop
  vignette: {
    position:   'absolute',
    inset:       0,
    background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,8,0.82) 100%)',
    zIndex:      9,
    pointerEvents: 'none',
  },

  // Faint horizontal scan-line texture
  scanlines: {
    position:      'absolute',
    inset:          0,
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,180,255,0.012) 3px, rgba(0,180,255,0.012) 4px)',
    zIndex:         10,
    pointerEvents: 'none',
  },

  // HUD base — each corner shares this
  hud: {
    position:      'absolute',
    display:       'flex',
    flexDirection: 'column',
    gap:            4,
    zIndex:        20,
    pointerEvents: 'none',
  },
  hudTitle: {
    fontFamily:    FONT,
    fontSize:       11,
    fontWeight:     700,
    letterSpacing: '0.2em',
    color:         '#00ccff',
    textTransform: 'uppercase',
  },
  hudSub: {
    fontFamily:    FONT,
    fontSize:       9,
    letterSpacing: '0.14em',
    color:         'rgba(0,180,255,0.55)',
    textTransform: 'uppercase',
  },
  hudRule: {
    width:           60,
    height:           1,
    background:     'rgba(0,180,255,0.25)',
    margin:         '2px 0',
  },
  hudMicro: {
    fontFamily:    FONT,
    fontSize:       8,
    letterSpacing: '0.12em',
    color:         'rgba(0,180,255,0.3)',
    textTransform: 'uppercase',
  },
}

// ─── CSS keyframes (injected via <style> tag) ─────────────────────────────────
// ─── CSS keyframes (injected via <style> tag) ─────────────────────────────────
const KEYFRAMES = `
  @keyframes twinkle {
    0%, 100% { 
      opacity: 0.15; 
      transform: scale(0.8); 
    }
    50% { 
      opacity: 0.9; 
      transform: scale(1.2); 
    }
  }
`
{/* ── Layer 2: Individual twinkling stars ── */}
<div style={s.starCanvas} aria-hidden="true">
  {STARS.map(star => (
    <div
      key={star.id}
      style={{
        position: 'absolute',
        left: `${star.x}%`,
        top: `${star.y}%`,
        width: star.size,
        height: star.size,
        borderRadius: '50%',
        backgroundColor: '#fff',
        
        // This links directly to our updated keyframes loop above
        animation: `twinkle ${star.twinkleDuration}s infinite alternate ease-in-out`,
        animationDelay: `${star.twinkleDelay}s`,
      }}
    />
  ))}
</div>