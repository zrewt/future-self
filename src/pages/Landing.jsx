import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useUserStore } from '../store/useUserStore'

// ─────────────────────────────────────────────────────────────────────────────
// Scroll-linked parallax
// ─────────────────────────────────────────────────────────────────────────────

function useParallax() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    let ticking = false

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return scrollY
}

// ─────────────────────────────────────────────────────────────────────────────
// Scroll progress (0–1) — drives the top progress bar
// ─────────────────────────────────────────────────────────────────────────────

function useScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let ticking = false

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY
          const docHeight = document.documentElement.scrollHeight - window.innerHeight
          setProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return progress
}

// ─────────────────────────────────────────────────────────────────────────────
// Reveal animation — now blurs in as well as fading/translating in
// ─────────────────────────────────────────────────────────────────────────────

function useReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    observer.observe(el)

    return () => observer.disconnect()
  }, [threshold])

  return [ref, visible]
}

function Reveal({ children, delay = 0, scale = false, blur = true }) {
  const [ref, visible] = useReveal()

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        filter: blur ? (visible ? 'blur(0px)' : 'blur(6px)') : undefined,
        transform: visible
          ? 'translateY(0) scale(1)'
          : `translateY(28px) scale(${scale ? 0.95 : 1})`,
        transition: `opacity 0.75s ${delay}ms cubic-bezier(0.16,1,0.3,1),
          transform 0.75s ${delay}ms cubic-bezier(0.16,1,0.3,1),
          filter 0.75s ${delay}ms cubic-bezier(0.16,1,0.3,1)`,
      }}
    >
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Magnetic button — CTA subtly follows the cursor toward its center on hover
// ─────────────────────────────────────────────────────────────────────────────

function MagneticButton({ to, className, style, children, strength = 0.15 }) {
  const ref = useRef(null)
  const [transform, setTransform] = useState('translate(0px,0px) scale(1)')

  const handleMove = (e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) * strength
    const y = (e.clientY - rect.top - rect.height / 2) * strength
    setTransform(`translate(${x}px, ${y}px) scale(1.03)`)
  }

  const handleLeave = () => setTransform('translate(0px,0px) scale(1)')

  return (
    <Link
      ref={ref}
      to={to}
      className={className}
      style={{ ...style, transform, transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)' }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Scroll progress bar (fixed, top of viewport)
// ─────────────────────────────────────────────────────────────────────────────

function ScrollProgressBar({ progress }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 200,
        background: 'rgba(109,40,217,0.06)',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress * 100}%`,
          background: 'linear-gradient(90deg,#ff7ac6,#7c3aed,#00cdb4)',
          boxShadow: '0 0 8px rgba(124,58,237,0.5)',
          transition: 'width 0.1s linear',
        }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Subtle film-grain texture overlay
// ─────────────────────────────────────────────────────────────────────────────

function GrainOverlay() {
  return (
    <div
      aria-hidden="true"
      className="qyven-grain-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        pointerEvents: 'none',
        opacity: 0.025,
        mixBlendMode: 'overlay',
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sticky mobile CTA — appears once the user scrolls past the hero
// ─────────────────────────────────────────────────────────────────────────────

function StickyMobileCTA({ show, isLoggedIn }) {
  return (
    <div
      className="qyven-sticky-mobile-cta"
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 12,
        zIndex: 90,
        transform: show ? 'translateY(0)' : 'translateY(120%)',
        opacity: show ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease',
        pointerEvents: show ? 'auto' : 'none',
      }}
    >
      <Link
        to={isLoggedIn ? '/dashboard' : '/get-started'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '15px 20px',
          borderRadius: 999,
          background: 'linear-gradient(135deg,#ff7ac6,#7c3aed,#00cdb4)',
          color: '#fff',
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: 800,
          boxShadow: '0 10px 30px rgba(124,58,237,0.4)',
        }}
      >
        {isLoggedIn ? 'Go to my dashboard →' : 'Find My Score — Free →'}
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Animated score ring
// ─────────────────────────────────────────────────────────────────────────────

function ScoreRing({
  score = 67,
  size = 170,
  strokeWidth = 8,
}) {
  const [displayed, setDisplayed] = useState(0)
  const [ringSize, setRingSize] = useState(size)

  useEffect(() => {
    const updateSize = () => {
      if (window.innerWidth <= 380) {
        setRingSize(Math.min(size, 132))
      } else if (window.innerWidth <= 600) {
        setRingSize(Math.min(size, 145))
      } else {
        setRingSize(size)
      }
    }

    updateSize()

    window.addEventListener('resize', updateSize)

    return () => {
      window.removeEventListener('resize', updateSize)
    }
  }, [size])

  useEffect(() => {
    let frame = null
    let timeout = null
    let start = null

    const duration = 3500
    const delay = 400

    const animate = (timestamp) => {
      if (start === null) {
        start = timestamp
      }

      const elapsed = timestamp - start
      const progress = Math.min(elapsed / duration, 1)

      const eased = 1 - Math.pow(1 - progress, 3)
      const nextValue = Math.round(eased * score)

      setDisplayed((previous) =>
        previous === nextValue ? previous : nextValue
      )

      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      }
    }

    timeout = window.setTimeout(() => {
      frame = requestAnimationFrame(animate)
    }, delay)

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }

      if (frame) {
        cancelAnimationFrame(frame)
      }
    }
  }, [score])

  const radius = (ringSize - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius

  const progress = displayed / 100
  const dashOffset = circumference * (1 - progress)

  return (
    <div
      style={{
        width: ringSize,
        height: ringSize,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg
        width={ringSize}
        height={ringSize}
        viewBox={`0 0 ${ringSize} ${ringSize}`}
        style={{
          position: 'absolute',
          inset: 0,
          transform: 'rotate(-90deg)',
          overflow: 'visible',
        }}
      >
        <defs>
          <linearGradient
            id="landingScoreGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#ff7ac6" />
            <stop offset="50%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#00cdb4" />
          </linearGradient>
        </defs>

        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={radius}
          fill="none"
          stroke="rgba(109,40,217,0.10)"
          strokeWidth={strokeWidth}
        />

        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={radius}
          fill="none"
          stroke="url(#landingScoreGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            filter: 'drop-shadow(0 0 7px rgba(127,90,240,0.32))',
            willChange: 'stroke-dashoffset',
          }}
        />
      </svg>

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontSize: ringSize * 0.30,
            lineHeight: 0.95,
            fontWeight: 800,
            letterSpacing: '-0.06em',
            background:
              'linear-gradient(135deg,#ff7ac6,#7c3aed,#00cdb4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {displayed}
        </div>

        <div
          style={{
            marginTop: ringSize < 145 ? 5 : 7,
            fontSize: Math.max(9, ringSize * 0.06),
            fontWeight: 800,
            color: '#6b7280',
            letterSpacing: '0.13em',
          }}
        >
          FSS
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Pillar mini bar
// ─────────────────────────────────────────────────────────────────────────────

function PillarBar({
  icon,
  label,
  value,
  color,
  delay = 0,
}) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setWidth(value)
    }, 650 + delay)

    return () => clearTimeout(timeout)
  }, [value, delay])

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '22px 66px 1fr 28px',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 13 }}>{icon}</span>

      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: '#6b7280',
        }}
      >
        {label}
      </span>

      <div
        style={{
          height: 5,
          background: 'rgba(109,40,217,0.08)',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${width}%`,
            borderRadius: 999,
            background: color,
            boxShadow: `0 0 10px ${color}88`,
            transition:
              'width 1.15s cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </div>

      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          color,
          textAlign: 'right',
        }}
      >
        {value}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating background blobs
// ─────────────────────────────────────────────────────────────────────────────

function FloatingBlobs({ scrollY }) {
  const blobs = [
    { top: -150, left: '2%', size: 560, color: 'rgba(167,139,250,0.22)', speed: 0.08, duration: 27 },
    { top: 180, left: '72%', size: 470, color: 'rgba(251,113,133,0.16)', speed: 0.12, duration: 31 },
    { top: 720, left: '-8%', size: 520, color: 'rgba(52,211,153,0.13)', speed: 0.09, duration: 24 },
    { top: 1320, left: '76%', size: 620, color: 'rgba(96,165,250,0.13)', speed: 0.11, duration: 35 },
    { top: 1940, left: '8%', size: 450, color: 'rgba(251,191,36,0.11)', speed: 0.07, duration: 29 },
    { top: 2600, left: '66%', size: 500, color: 'rgba(196,181,253,0.18)', speed: 0.10, duration: 33 },
  ]

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {blobs.map((blob, index) => (
        <div
          key={index}
          className="qyven-mobile-blob"
          style={{
            position: 'absolute',
            top: blob.top - scrollY * blob.speed,
            left: blob.left,
            width: blob.size,
            height: blob.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${blob.color} 0%, transparent 70%)`,
            filter: 'blur(20px)',
            animation: `qyvenDrift${index % 3} ${blob.duration}s ease-in-out infinite`,
          }}
        />
      ))}

      <style>
        {`
          @keyframes qyvenDrift0 {
            0%, 100% { transform: translate(0,0); }
            50% { transform: translate(35px,20px); }
          }

          @keyframes qyvenDrift1 {
            0%, 100% { transform: translate(0,0); }
            50% { transform: translate(-30px,25px); }
          }

          @keyframes qyvenDrift2 {
            0%, 100% { transform: translate(0,0); }
            50% { transform: translate(20px,-25px); }
          }

          /* Unified with the main mobile breakpoint below (780px) instead of
             a separate 640px cutoff — one "is this mobile" threshold for the
             whole page, not two disagreeing ones. */
          @media (max-width: 780px) {
            .qyven-mobile-blob { display: block !important; }
          }
        `}
      </style>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// Ambient trajectory scene
// ─────────────────────────────────────────────────────────────────────────────

function AmbientTrajectory({ scrollY }) {
  const particles = [
    [8, 18, 2, 18, 0], [18, 68, 1.5, 22, 2], [31, 28, 1.2, 19, 4],
    [44, 82, 2, 24, 1], [57, 16, 1.4, 21, 5], [68, 58, 1.6, 20, 3],
    [79, 25, 1.2, 23, 6], [91, 72, 2, 25, 2], [96, 39, 1.3, 18, 7],
    [12, 45, 1.1, 26, 4], [73, 88, 1.2, 22, 1], [38, 58, 1, 27, 5],
  ]

  return (
    <div className="qyven-ambient-scene" aria-hidden="true">
      <div className="qyven-ambient-grid" />

      <div
        className="qyven-hero-orbit orbit-one"
        style={{ transform: `translate3d(0, ${scrollY * -0.035}px, 0)` }}
      />
      <div
        className="qyven-hero-orbit orbit-two"
        style={{ transform: `translate3d(0, ${scrollY * -0.055}px, 0)` }}
      />

      <svg
        className="qyven-hero-trajectory"
        viewBox="0 0 1200 720"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="heroTrajectoryGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff7ac6" stopOpacity="0" />
            <stop offset="35%" stopColor="#7c3aed" stopOpacity="0.24" />
            <stop offset="72%" stopColor="#67E8F9" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00cdb4" stopOpacity="0" />
          </linearGradient>
          <filter id="heroTrajectoryGlow">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          className="qyven-hero-trajectory-glow"
          d="M-40 625 C170 575 215 455 390 495 C570 535 580 355 760 390 C920 420 925 210 1240 120"
          fill="none"
          stroke="url(#heroTrajectoryGradient)"
          strokeWidth="18"
          strokeLinecap="round"
          filter="url(#heroTrajectoryGlow)"
        />
        <path
          className="qyven-hero-trajectory-line"
          d="M-40 625 C170 575 215 455 390 495 C570 535 580 355 760 390 C920 420 925 210 1240 120"
          fill="none"
          stroke="url(#heroTrajectoryGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle className="qyven-trajectory-node node-one" cx="390" cy="495" r="3" />
        <circle className="qyven-trajectory-node node-two" cx="760" cy="390" r="3.5" />
        <circle className="qyven-trajectory-node node-three" cx="1110" cy="165" r="4" />
      </svg>

      <div className="qyven-particle-field">
        {particles.map(([left, top, size, duration, delay], index) => (
          <span
            key={index}
            className="qyven-particle"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </div>

      <div className="qyven-ambient-vignette" />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

const PILLARS = [
  {
    icon: '🥗',
    label: 'Nutrition',
    color: '#00E87A',
    description: 'Food quality, protein, plants & hydration',
  },
  {
    icon: '🏋️',
    label: 'Fitness',
    color: '#7c3aed',
    description: 'Movement, training & consistency',
  },
  {
    icon: '💤',
    label: 'Sleep',
    color: '#4DA6FF',
    description: 'Sleep, recovery & energy',
  },
  {
    icon: '🎯',
    label: 'Focus',
    color: '#FFB830',
    description: 'Deep work, reading & mindfulness',
  },
  {
    icon: '🌿',
    label: 'Longevity',
    color: '#FF5C8A',
    description: 'Habits that compound over time',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Main Landing
// ─────────────────────────────────────────────────────────────────────────────

export default function Landing() {
  const { user, authReady } = useUserStore()

  const isLoggedIn = authReady && !!user
  const scrollY = useParallax()
  const scrollProgress = useScrollProgress()

  const [spotlight, setSpotlight] = useState({ x: 50, y: 50 })
  const handleHeroMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setSpotlight({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  const showStickyCTA = scrollY > (typeof window !== 'undefined' ? window.innerHeight * 0.6 : 500)

  return (
    <div
      className="qyven-landing"
      style={{
        minHeight: '100vh',
        background: '#f5f3ff',
        color: '#12111e',
        fontFamily:
          "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        overflowX: 'hidden',
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
      }}
    >
      <ScrollProgressBar progress={scrollProgress} />
      <GrainOverlay />

      <FloatingBlobs scrollY={scrollY} />
      <AmbientTrajectory scrollY={scrollY} />

      {/* ───────────────── NAV ───────────────── */}

      <nav
        className="qyven-nav"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 64,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          borderBottom:
            '1px solid rgba(109,40,217,0.08)',
        }}
      >
        <Link
          to="/"
          style={{
            textDecoration: 'none',
            color: '#12111e',
            fontSize: 23,
            fontWeight: 800,
            letterSpacing: '-0.07em',
          }}
        >
          Qyven
        </Link>

        <div
          className="qyven-nav-right"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          {!isLoggedIn && (
            <Link
              to="/login"
              className="qyven-nav-signin"
              style={{
                color: '#6b7280',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              Sign in
            </Link>
          )}

          <Link
            to={isLoggedIn ? '/dashboard' : '/get-started'}
            className="qyven-nav-cta qyven-interactive-button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '9px 18px',
              minHeight: 40,
              borderRadius: 999,
              background:
                'linear-gradient(135deg,#ff7ac6,#7c3aed,#00cdb4)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: 12,
              fontWeight: 800,
              boxShadow:
                '0 0 26px rgba(127,90,240,0.3)',
              whiteSpace: 'nowrap',
            }}
          >
            {isLoggedIn
              ? 'Dashboard →'
              : 'Find My Score →'}
          </Link>
        </div>
      </nav>

      {/* ───────────────── HERO ───────────────── */}

      <section
        className="qyven-hero qyven-hero-enhanced"
        onMouseMove={handleHeroMouseMove}
        style={{
          minHeight: '100vh',
          padding: '125px 20px 70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          className="qyven-hero-spotlight"
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            background: `radial-gradient(600px circle at ${spotlight.x}% ${spotlight.y}%, rgba(124,58,237,0.07), transparent 70%)`,
          }}
        />

        <div
          className="qyven-hero-grid"
          style={{
            width: '100%',
            maxWidth: 1100,
            display: 'grid',
            gridTemplateColumns:
              'minmax(0,1.05fr) minmax(300px,0.75fr)',
            gap: 70,
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Hero copy */}

          <div className="qyven-hero-copy">
            <Reveal>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 13px',
                  borderRadius: 999,
                  background:
                    'rgba(255,255,255,0.045)',
                  border:
                    '1px solid rgba(255,255,255,0.1)',
                  color: '#8FEBDD',
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.13em',
                  textTransform: 'uppercase',
                  marginBottom: 22,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#00cdb4',
                    boxShadow:
                      '0 0 10px rgba(0,232,198,0.8)',
                  }}
                />
                Your Future Self Score
              </div>
            </Reveal>

            <Reveal delay={80}>
              <h1
                className="qyven-hero-title"
                style={{
                  margin: 0,
                  fontSize:
                    'clamp(44px, 7vw, 76px)',
                  lineHeight: 0.99,
                  letterSpacing: '-0.065em',
                  fontWeight: 800,
                  maxWidth: 700,
                }}
              >
                Your habits are
                <br />
                <span
                  style={{
                    background:
                      'linear-gradient(110deg,#8b5cf6,#7c3aed 45%,#00cdb4)',
                    WebkitBackgroundClip:
                      'text',
                    WebkitTextFillColor:
                      'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  shaping your future.
                </span>
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <div
                className="qyven-hero-question"
                style={{
                  marginTop: 20,
                  fontSize: 'clamp(22px,3vw,30px)',
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  color: '#12111e',
                }}
              >
                Do you know your score?
              </div>
            </Reveal>

            <Reveal delay={180}>
              <p
                className="qyven-hero-description"
                style={{
                  margin: '16px 0 0',
                  maxWidth: 560,
                  color: '#6b7280',
                  fontSize: 'clamp(16px,2.3vw,19px)',
                  lineHeight: 1.65,
                }}
              >
                Qyven turns your everyday habits into one simple
                Future Self Score — so you can see where you stand
                and where your consistency could take you.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div
                className="qyven-hero-actions"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 28,
                }}
              >
                <MagneticButton
                  to={isLoggedIn ? '/dashboard' : '/get-started'}
                  className="qyven-main-cta qyven-interactive-button"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px 27px',
                    minHeight: 54,
                    borderRadius: 999,
                    background:
                      'linear-gradient(135deg,#ff7ac6,#7c3aed,#00cdb4)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: 15,
                    fontWeight: 800,
                    boxShadow:
                      '0 8px 40px rgba(127,90,240,0.38)',
                  }}
                >
                  {isLoggedIn
                    ? 'Go to my dashboard →'
                    : 'Find My Score →'}
                </MagneticButton>

                {!isLoggedIn && (
                  <span
                    style={{
                      fontSize: 12,
                      color: '#9ca3af',
                    }}
                  >
                    Takes about 60 seconds
                  </span>
                )}
              </div>
            </Reveal>

            <Reveal delay={300}>
              <div
                className="qyven-trust-points"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 18,
                  marginTop: 25,
                  color: '#9ca3af',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                <span>✓ Free to start</span>
                <span>✓ No credit card</span>
                <span>✓ Built around your habits</span>
              </div>
            </Reveal>
          </div>

          {/* Score preview */}

          <Reveal delay={180} scale>
            <div
              className="qyven-score-preview-wrapper"
              style={{
                position: 'relative',
                maxWidth: 390,
                width: '100%',
                margin: '0 auto',
              }}
            >
              <div
                className="qyven-score-glow"
                style={{
                  position: 'absolute',
                  inset: -40,
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle,rgba(127,90,240,0.16),transparent 65%)',
                  filter: 'blur(15px)',
                  pointerEvents: 'none',
                }}
              />

              <div
                className="qyven-score-card qCard"
                style={{
                  position: 'relative',
                  padding: 25,
                  borderRadius: 30,
                  background:
                    'linear-gradient(155deg,#ffffff,#ffffff)',
                  border:
                    '1px solid rgba(109,40,217,0.12)',
                  boxShadow:
                    '0 30px 90px rgba(76,29,149,0.12), inset 0 1px 0 rgba(109,40,217,0.06)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 35,
                    right: 35,
                    height: 2,
                    background:
                      'linear-gradient(90deg,#ff7ac6,#7c3aed,#00cdb4)',
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        color: '#9ca3af',
                        textTransform:
                          'uppercase',
                        letterSpacing:
                          '0.13em',
                        fontWeight: 800,
                      }}
                    >
                      Your Future Self Score
                    </div>

                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      See where you stand
                    </div>
                  </div>

                  <span
                    style={{
                      padding:
                        '5px 9px',
                      borderRadius: 999,
                      background:
                        'rgba(0,232,198,0.08)',
                      border:
                        '1px solid rgba(0,232,198,0.18)',
                      color: '#00cdb4',
                      fontSize: 9,
                      fontWeight: 800,
                    }}
                  >
                    LIVE
                  </span>
                </div>

                <div className="qyven-score-card-signal">
                  <span className="qyven-signal-dot" />
                  <span>Tracking your trajectory</span>
                </div>

                <div
                  className="qyven-score-ring-container"
                  style={{
                    display: 'flex',
                    justifyContent:
                      'center',
                    padding:
                      '10px 0 22px',
                  }}
                >
                  <ScoreRing
                    score={67}
                    size={175}
                    strokeWidth={8}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection:
                      'column',
                    gap: 11,
                  }}
                >
                  <PillarBar
                    icon="🏋️"
                    label="Fitness"
                    value={74}
                    color="#7c3aed"
                  />

                  <PillarBar
                    icon="🥗"
                    label="Nutrition"
                    value={61}
                    color="#00E87A"
                    delay={100}
                  />

                  <PillarBar
                    icon="💤"
                    label="Sleep"
                    value={68}
                    color="#4DA6FF"
                    delay={200}
                  />

                  <PillarBar
                    icon="🎯"
                    label="Focus"
                    value={59}
                    color="#FFB830"
                    delay={300}
                  />

                  <PillarBar
                    icon="🌿"
                    label="Longevity"
                    value={81}
                    color="#FF5C8A"
                    delay={400}
                  />
                </div>

                <div
                  style={{
                    marginTop: 22,
                    padding:
                      '12px 14px',
                    borderRadius: 14,
                    background:
                      'rgba(255,255,255,0.035)',
                    border:
                      '1px solid rgba(109,40,217,0.08)',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: 16,
                    }}
                  >
                    ↗
                  </span>

                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#12111e',
                      }}
                    >
                      Your score can change.
                    </div>

                    <div
                      style={{
                        fontSize: 10,
                        color: '#777C97',
                        marginTop: 2,
                      }}
                    >
                      Consistency is what moves it.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────────────── SOCIAL PROOF / POSITIONING ───────────────── */}

      <section
        style={{
          padding: '10px 24px 90px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Reveal>
          <div
            style={{
              maxWidth: 900,
              margin: '0 auto',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: '#676C86',
                marginBottom: 16,
              }}
            >
              Most habit trackers tell you what you did.
            </p>

            <div
              style={{
                fontSize:
                  'clamp(22px,4vw,34px)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
              }}
            >
              Qyven shows you
              <span
                style={{
                  marginLeft: 8,
                  background:
                    'linear-gradient(110deg,#ff7ac6,#7c3aed,#00cdb4)',
                  WebkitBackgroundClip:
                    'text',
                  WebkitTextFillColor:
                    'transparent',
                  backgroundClip:
                    'text',
                }}
              >
                where it's taking you.
              </span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ───────────────── HOW IT WORKS ───────────────── */}

      <section
        className="qyven-section"
        style={{
          padding: '70px 24px 100px',
          maxWidth: 1050,
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Reveal>
          <div
            style={{
              textAlign: 'center',
              marginBottom: 48,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: '#00cdb4',
                fontWeight: 800,
                textTransform:
                  'uppercase',
                letterSpacing:
                  '0.14em',
                marginBottom: 12,
              }}
            >
              Simple by design
            </div>

            <h2
              style={{
                margin: 0,
                fontSize:
                  'clamp(28px,4.5vw,42px)',
                letterSpacing:
                  '-0.05em',
                lineHeight: 1.08,
              }}
            >
              Three steps.
              <br />
              One clearer direction.
            </h2>
          </div>
        </Reveal>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(230px,1fr))',
            gap: 16,
          }}
        >
          {[
            {
              number: '01',
              title: 'Check in',
              text: 'Answer a few quick questions about your day.',
              icon: '✓',
              color: '#00cdb4',
            },
            {
              number: '02',
              title: 'Get your score',
              text: 'Qyven turns your habits into one simple Future Self Score.',
              icon: '◎',
              color: '#7c3aed',
            },
            {
              number: '03',
              title: 'See your trajectory',
              text: 'Understand what is moving you forward and what needs attention.',
              icon: '↗',
              color: '#ff7ac6',
            },
          ].map((step, index) => (
            <Reveal
              key={step.number}
              delay={index * 100}
              scale
            >
              <div
                style={{
                  height: '100%',
                  padding: 25,
                  borderRadius: 22,
                  background:
                    `linear-gradient(145deg,${step.color}10,#ffffff)`,
                  border:
                    `1px solid ${step.color}25`,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    alignItems: 'center',
                    marginBottom: 28,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: step.color,
                      letterSpacing:
                        '0.1em',
                    }}
                  >
                    {step.number}
                  </span>

                  <span
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      display: 'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'center',
                      background:
                        `${step.color}12`,
                      color: step.color,
                      fontSize: 18,
                      fontWeight: 800,
                    }}
                  >
                    {step.icon}
                  </span>
                </div>

                <h3
                  style={{
                    margin:
                      '0 0 8px',
                    fontSize: 18,
                    fontWeight: 800,
                  }}
                >
                  {step.title}
                </h3>

                <p
                  style={{
                    margin: 0,
                    color: '#9297B2',
                    fontSize: 13,
                    lineHeight: 1.65,
                  }}
                >
                  {step.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────────── TRAJECTORY ───────────────── */}

      <section
        className="qyven-section"
        style={{
          padding: '20px 24px 110px',
          maxWidth: 1050,
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Reveal scale>
          <div
            className="qyven-trajectory-card qCard"
            style={{
              borderRadius: 30,
              padding:
                '55px 30px 45px',
              background:
                'linear-gradient(135deg,rgba(255,122,198,0.09),rgba(127,90,240,0.1) 50%,rgba(0,232,198,0.08))',
              border:
                '1px solid rgba(255,255,255,0.1)',
              position: 'relative',
              overflow: 'hidden',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background:
                  'linear-gradient(90deg,#ff7ac6,#7c3aed,#00cdb4)',
              }}
            />

            <div
              style={{
                fontSize: 10,
                color: '#FF9FD4',
                fontWeight: 800,
                textTransform:
                  'uppercase',
                letterSpacing:
                  '0.14em',
                marginBottom: 13,
              }}
            >
              Your trajectory
            </div>

            <h2
              style={{
                margin: 0,
                fontSize:
                  'clamp(27px,4.5vw,43px)',
                letterSpacing:
                  '-0.05em',
                lineHeight: 1.08,
              }}
            >
              Small choices compound.
              <br />
              <span
                style={{
                  background:
                    'linear-gradient(120deg,#ff7ac6,#7c3aed,#00cdb4)',
                  WebkitBackgroundClip:
                    'text',
                  WebkitTextFillColor:
                    'transparent',
                  backgroundClip:
                    'text',
                }}
              >
                See the direction.
              </span>
            </h2>

            <p
              style={{
                maxWidth: 520,
                margin:
                  '18px auto 40px',
                color: '#A8ACC5',
                fontSize: 14,
                lineHeight: 1.7,
              }}
            >
              Qyven helps turn your daily behavior
              into a bigger picture — so you can
              see whether you're moving toward the
              person you want to become.
            </p>

            {/* Trajectory chart */}

            <div
              className="qyven-chart"
              style={{
                maxWidth: 650,
                margin: '0 auto',
                position: 'relative',
                height: 220,
                padding:
                  '20px 15px 40px',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 40,
                  height: 1,
                  background:
                    'rgba(109,40,217,0.06)',
                }}
              />

              {[25, 50, 75].map((line) => (
                <div
                  key={line}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: `${100 - line}%`,
                    borderTop:
                      '1px dashed rgba(255,255,255,0.045)',
                  }}
                />
              ))}

              <svg
                viewBox="0 0 700 180"
                preserveAspectRatio="none"
                style={{
                  width: '100%',
                  height: '100%',
                  overflow: 'visible',
                }}
              >
                <defs>
                  <linearGradient
                    id="trajectoryLine"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop
                      offset="0%"
                      stopColor="#ff7ac6"
                    />
                    <stop
                      offset="50%"
                      stopColor="#7c3aed"
                    />
                    <stop
                      offset="100%"
                      stopColor="#00cdb4"
                    />
                  </linearGradient>

                  <linearGradient
                    id="trajectoryFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#7c3aed"
                      stopOpacity="0.18"
                    />
                    <stop
                      offset="100%"
                      stopColor="#7c3aed"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                <path
                  d="M 0 140 C 80 138, 120 128, 175 132 C 230 136, 270 105, 325 112 C 390 120, 430 82, 480 89 C 535 95, 570 55, 620 58 C 650 60, 680 35, 700 22 L 700 180 L 0 180 Z"
                  fill="url(#trajectoryFill)"
                />

                <path
                  className="qyven-chart-line"
                  d="M 0 140 C 80 138, 120 128, 175 132 C 230 136, 270 105, 325 112 C 390 120, 430 82, 480 89 C 535 95, 570 55, 620 58 C 650 60, 680 35, 700 22"
                  fill="none"
                  stroke="url(#trajectoryLine)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                <circle
                  cx="0"
                  cy="140"
                  r="6"
                  fill="#ff7ac6"
                />

                <circle
                  cx="350"
                  cy="111"
                  r="6"
                  fill="#7c3aed"
                />

                <circle
                  cx="700"
                  cy="22"
                  r="7"
                  fill="#00cdb4"
                />
              </svg>

              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  bottom: 8,
                  fontSize: 10,
                  color: '#777C96',
                }}
              >
                Today
              </div>

              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: 8,
                  transform:
                    'translateX(-50%)',
                  fontSize: 10,
                  color: '#777C96',
                }}
              >
                6 months
              </div>

              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: 8,
                  fontSize: 10,
                  color: '#777C96',
                }}
              >
                1 year
              </div>
            </div>

            <p
              style={{
                margin:
                  '0 auto 28px',
                maxWidth: 500,
                fontSize: 10,
                color: '#9ca3af',
              }}
            >
              Illustrative trajectory. Your actual
              score is based on your check-ins and
              consistency.
            </p>

            {!isLoggedIn && (
              <Link
                to="/get-started"
                className="qyven-secondary-cta"
                style={{
                  display:
                    'inline-flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  padding:
                    '14px 25px',
                  minHeight: 48,
                  borderRadius: 999,
                  background:
                    'rgba(109,40,217,0.06)',
                  border:
                    '1px solid rgba(255,255,255,0.13)',
                  color: '#12111e',
                  textDecoration:
                    'none',
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                See where I stand →
              </Link>
            )}
          </div>
        </Reveal>
      </section>

      {/* ───────────────── WHAT YOU'LL SEE ───────────────── */}

      <section
        className="qyven-section"
        style={{
          padding: '20px 24px 100px',
          maxWidth: 1050,
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Reveal>
          <div
            style={{
              textAlign: 'center',
              marginBottom: 45,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: '#00cdb4',
                fontWeight: 800,
                textTransform:
                  'uppercase',
                letterSpacing:
                  '0.14em',
                marginBottom: 12,
              }}
            >
              Your results
            </div>

            <h2
              style={{
                margin: 0,
                fontSize:
                  'clamp(27px,4.5vw,40px)',
                letterSpacing:
                  '-0.05em',
              }}
            >
              More than a number.
            </h2>
          </div>
        </Reveal>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(200px,1fr))',
            gap: 14,
          }}
        >
          {[
            {
              icon: '◎',
              title: 'Your score',
              text: 'A simple snapshot of how your habits are adding up.',
              color: '#7c3aed',
            },
            {
              icon: '↑',
              title: 'Your strongest area',
              text: "See where you're already building momentum.",
              color: '#00cdb4',
            },
            {
              icon: '⚡',
              title: 'Your opportunity',
              text: 'Find the areas where one small change could matter most.',
              color: '#FFB830',
            },
            {
              icon: '↗',
              title: 'Your trajectory',
              text: 'Understand the direction your consistency is taking you.',
              color: '#ff7ac6',
            },
          ].map((item, index) => (
            <Reveal
              key={item.title}
              delay={index * 80}
              scale
            >
              <div
                style={{
                  height: '100%',
                  padding: 22,
                  borderRadius: 20,
                  background:
                    '#ffffff',
                  border:
                    '1px solid #ffffff',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 13,
                    display: 'flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'center',
                    background:
                      `${item.color}12`,
                    color: item.color,
                    fontSize: 19,
                    fontWeight: 800,
                    marginBottom: 18,
                  }}
                >
                  {item.icon}
                </div>

                <h3
                  style={{
                    margin:
                      '0 0 7px',
                    fontSize: 15,
                    fontWeight: 800,
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    margin: 0,
                    color: '#888DA7',
                    fontSize: 12,
                    lineHeight: 1.65,
                  }}
                >
                  {item.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────────── FIVE PILLARS ───────────────── */}

      <section
        className="qyven-section"
        style={{
          padding: '20px 24px 100px',
          maxWidth: 1050,
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Reveal>
          <div
            style={{
              textAlign: 'center',
              marginBottom: 42,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: '#00cdb4',
                fontWeight: 800,
                textTransform:
                  'uppercase',
                letterSpacing:
                  '0.14em',
                marginBottom: 12,
              }}
            >
              Five dimensions
            </div>

            <h2
              style={{
                margin: 0,
                fontSize:
                  'clamp(26px,4.5vw,40px)',
                letterSpacing:
                  '-0.05em',
              }}
            >
              Your whole self,
              <br />
              not just one habit.
            </h2>
          </div>
        </Reveal>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(170px,1fr))',
            gap: 12,
          }}
        >
          {PILLARS.map((pillar, index) => (
            <Reveal
              key={pillar.label}
              delay={index * 70}
              scale
            >
              <div
                style={{
                  height: '100%',
                  minHeight: 165,
                  padding: 19,
                  borderRadius: 18,
                  background:
                    `linear-gradient(150deg,${pillar.color}0D,rgba(255,255,255,0.018))`,
                  border:
                    `1px solid ${pillar.color}22`,
                  borderTop:
                    `2px solid ${pillar.color}`,
                }}
              >
                <div
                  style={{
                    fontSize: 25,
                    marginBottom: 14,
                  }}
                >
                  {pillar.icon}
                </div>

                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    marginBottom: 6,
                  }}
                >
                  {pillar.label}
                </div>

                <div
                  style={{
                    color: '#858AA4',
                    fontSize: 11,
                    lineHeight: 1.55,
                  }}
                >
                  {pillar.description}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────────── FINAL CTA ───────────────── */}

      <section
        className="qyven-final-cta"
        style={{
          padding:
            '70px 24px 120px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Reveal scale>
          <div
            style={{
              maxWidth: 650,
              margin: '0 auto',
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: '#00cdb4',
                fontWeight: 800,
                textTransform:
                  'uppercase',
                letterSpacing:
                  '0.14em',
                marginBottom: 15,
              }}
            >
              Start with yourself
            </div>

            <h2
              style={{
                margin: 0,
                fontSize:
                  'clamp(34px,6vw,58px)',
                lineHeight: 1.02,
                letterSpacing:
                  '-0.06em',
                fontWeight: 800,
              }}
            >
              You know what
              <br />
              <span
                style={{
                  background:
                    'linear-gradient(120deg,#ff7ac6,#7c3aed,#00cdb4)',
                  WebkitBackgroundClip:
                    'text',
                  WebkitTextFillColor:
                    'transparent',
                  backgroundClip:
                    'text',
                }}
              >
                you're capable of.
              </span>
            </h2>

            <p
              style={{
                maxWidth: 460,
                margin:
                  '20px auto 30px',
                color: '#989DB7',
                fontSize: 15,
                lineHeight: 1.65,
              }}
            >
              Find out where you stand today —
              then start building toward where you
              want to be.
            </p>

            <MagneticButton
              to={isLoggedIn ? '/dashboard' : '/get-started'}
              className="qyven-final-button qyven-interactive-button"
              style={{
                display:
                  'inline-flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                padding:
                  '17px 32px',
                minHeight: 54,
                borderRadius: 999,
                background:
                  'linear-gradient(135deg,#ff7ac6,#7c3aed,#00cdb4)',
                color: '#fff',
                textDecoration:
                  'none',
                fontSize: 16,
                fontWeight: 800,
                boxShadow:
                  '0 8px 45px rgba(127,90,240,0.4)',
              }}
            >
              {isLoggedIn
                ? 'Go to my dashboard →'
                : 'Find My Score →'}
            </MagneticButton>

            <div
              style={{
                marginTop: 16,
                color: '#9ca3af',
                fontSize: 11,
              }}
            >
              Free to start · Takes about 60 seconds
            </div>
          </div>
        </Reveal>
      </section>

      {/* ───────────────── FOOTER ───────────────── */}

      <footer
        className="qyven-footer"
        style={{
          borderTop:
            '1px solid rgba(109,40,217,0.08)',
          padding:
            '24px 28px',
          display: 'flex',
          alignItems:
            'center',
          justifyContent:
            'space-between',
          gap: 15,
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Link
          to="/"
          style={{
            color: '#12111e',
            textDecoration:
              'none',
            fontWeight: 800,
            fontSize: 17,
            letterSpacing:
              '-0.05em',
          }}
        >
          Qyven
        </Link>

        <p
          style={{
            margin: 0,
            color: '#9ca3af',
            fontSize: 11,
          }}
        >
          Track what you do today. See where it takes you.
        </p>

        {!isLoggedIn && (
          <Link
            to="/get-started"
            style={{
              color: '#00cdb4',
              textDecoration:
                'none',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            Find My Score →
          </Link>
        )}
      </footer>

      {/* ───────────────── STICKY MOBILE CTA ───────────────── */}

      <StickyMobileCTA show={showStickyCTA} isLoggedIn={isLoggedIn} />

      {/* ───────────────── MOBILE / PWA RESPONSIVE CSS ───────────────── */}

      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&display=swap');

          .qyven-landing {
            background: #f5f3ff !important;
            color: #12111e !important;
          }

          .qyven-nav {
            background: rgba(255,255,255,0.76) !important;
            border-bottom: 1px solid rgba(109,40,217,0.10) !important;
            box-shadow: 0 10px 30px rgba(109,40,217,0.06) !important;
          }

          .qyven-score-card, .qCard {
            background: #ffffff !important;
            border: 1px solid rgba(109,40,217,0.10) !important;
            box-shadow: 0 18px 50px rgba(109,40,217,0.10) !important;
            transition: transform 260ms cubic-bezier(0.16,1,0.3,1), box-shadow 260ms ease;
          }

          .qCard:hover {
            transform: translateY(-6px);
            box-shadow: 0 24px 60px rgba(109,40,217,0.16) !important;
          }

          .qyven-score-card {
            animation: qyvenScoreFloat 8s ease-in-out infinite;
            transform-origin: center bottom;
          }

          .qyven-score-card::after {
            content: '';
            position: absolute;
            left: 12%; right: 12%; bottom: -28px;
            height: 34px;
            border-radius: 50%;
            background: rgba(109,40,217,0.16);
            filter: blur(18px);
            transform: scaleX(0.86);
            z-index: -1;
            animation: qyvenScoreShadow 8s ease-in-out infinite;
          }

          .qyven-ambient-grid {
            background-image: radial-gradient(circle, rgba(109,40,217,0.20) 1px, transparent 1.5px) !important;
            background-size: 34px 34px !important;
            opacity: 0.42 !important;
            -webkit-mask-image: radial-gradient(ellipse at center, black 20%, transparent 76%);
            mask-image: radial-gradient(ellipse at center, black 20%, transparent 76%);
          }

          .qyven-hero-trajectory-line {
            stroke-width: 2 !important;
            stroke-dasharray: 12 12;
            animation: qyvenTrajectoryFlow 9s linear infinite;
          }

          .qyven-hero-trajectory-glow { opacity: 0.55 !important; }
          .qyven-trajectory-node { transform-box: fill-box; transform-origin: center; animation: qyvenNodePulse 2.8s ease-in-out infinite; }
          .node-two { animation-delay: .7s; }
          .node-three { animation-delay: 1.4s; }

          .qyven-particle:nth-child(3n+1) { background: #7c3aed !important; }
          .qyven-particle:nth-child(3n+2) { background: #fb7185 !important; }
          .qyven-particle:nth-child(3n) { background: #14b8a6 !important; }

          @keyframes qyvenScoreFloat {
            0%,100% { transform: translate3d(0,0,0); }
            50% { transform: translate3d(0,-7px,0); }
          }
          @keyframes qyvenScoreShadow {
            0%,100% { opacity:.55; transform:scaleX(.86); }
            50% { opacity:.82; transform:scaleX(1); }
          }

          @keyframes qyvenDrift0 {
            0%,100% { transform:translate3d(0,0,0) scale(1); }
            35% { transform:translate3d(55px,-25px,0) scale(1.08); }
            70% { transform:translate3d(-30px,45px,0) scale(.96); }
          }
          @keyframes qyvenDrift1 {
            0%,100% { transform:translate3d(0,0,0) scale(1); }
            40% { transform:translate3d(-60px,35px,0) scale(1.06); }
            75% { transform:translate3d(35px,-40px,0) scale(.94); }
          }
          @keyframes qyvenDrift2 {
            0%,100% { transform:translate3d(0,0,0) scale(1); }
            30% { transform:translate3d(35px,50px,0) scale(.95); }
            68% { transform:translate3d(-55px,-30px,0) scale(1.1); }
          }

          * {
            box-sizing: border-box;
          }

          html {
            overflow-x: hidden;
            width: 100%;
          }

          body {
            overflow-x: hidden;
            width: 100%;
            margin: 0;
          }

          @media (max-width: 780px) {
            .qyven-hero-spotlight { display: none !important; }

            .qyven-nav {
              height: 60px !important;
              padding-left: 16px !important;
              padding-right: 16px !important;
            }

            .qyven-nav > a:first-child {
              font-size: 21px !important;
            }

            .qyven-nav-right {
              gap: 10px !important;
            }

            .qyven-nav-signin {
              font-size: 11px !important;
            }

            .qyven-nav-cta {
              padding: 8px 14px !important;
              min-height: 38px !important;
              font-size: 11px !important;
            }

            .qyven-hero {
              min-height: auto !important;
              padding:
                84px 18px 50px !important;
              display: block !important;
            }

            /* Text leads on mobile — headline first, then the score
               card as visual proof underneath it. */
            .qyven-hero-grid {
              display: flex !important;
              flex-direction: column !important;
              gap: 24px !important;
              align-items: stretch !important;
            }

            .qyven-hero-copy {
              width: 100% !important;
              text-align: center !important;
              margin-top: 6px !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
            }

            .qyven-hero-copy > div:first-child {
              margin-left: auto !important;
              margin-right: auto !important;
            }

            .qyven-hero-title {
              font-size:
                clamp(36px, 9.5vw, 48px) !important;
              line-height: 1.04 !important;
              letter-spacing: -0.055em !important;
              max-width: 100% !important;
              margin-left: auto !important;
              margin-right: auto !important;
            }

            .qyven-hero-description {
              font-size: 16px !important;
              line-height: 1.62 !important;
              max-width: 380px !important;
              margin: 18px auto 0 !important;
              text-align: center !important;
            }

            .qyven-hero-actions {
              margin-top: 24px !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              gap: 10px !important;
              width: 100% !important;
            }

            .qyven-main-cta {
              width: 100% !important;
              min-height: 54px !important;
              padding:
                15px 20px !important;
              font-size: 14px !important;
            }

            .qyven-hero-actions > span {
              text-align: center !important;
              width: 100% !important;
              font-size: 11px !important;
            }

            .qyven-trust-points {
              justify-content: center !important;
              gap: 8px 14px !important;
              margin-top: 16px !important;
              font-size: 10px !important;
              line-height: 1.5 !important;
            }

            .qyven-score-preview-wrapper {
              max-width: 290px !important;
              width: 100% !important;
              margin: 0 auto !important;
            }

            .qyven-score-glow {
              inset: -14px !important;
            }

            .qyven-score-card {
              padding: 16px !important;
              border-radius: 22px !important;
            }

            .qyven-score-ring-container {
              padding:
                2px 0 8px !important;
            }

       

            /* pillar bar list — 5th direct child of the card */
            .qyven-score-card > div:nth-child(5) {
              gap: 6px !important;
            }

            /* "your score can change" note — 6th direct child */
            .qyven-score-card > div:nth-child(6) {
              margin-top: 10px !important;
              padding: 8px 10px !important;
            }

            .qyven-section {
              padding-left: 18px !important;
              padding-right: 18px !important;
            }

            .qyven-trajectory-card {
              padding:
                42px 16px 30px !important;
              border-radius: 24px !important;
            }

            .qyven-chart {
              width: 100% !important;
              height: 185px !important;
              padding:
                12px 4px 38px !important;
            }

            .qyven-chart svg {
              min-width: 0 !important;
            }

            .qyven-secondary-cta {
              width: 100% !important;
              min-height: 50px !important;
            }

            .qyven-final-cta {
              padding:
                55px 18px 90px !important;
            }

            .qyven-final-button {
              width: 100% !important;
              max-width: 420px !important;
              padding:
                16px 20px !important;
              min-height: 54px !important;
              font-size: 14px !important;
            }

            .qyven-footer {
              padding:
                24px 18px !important;
              flex-direction: column !important;
              text-align: center !important;
              gap: 14px !important;
              padding-bottom: 88px !important;
            }

            .qyven-footer p {
              max-width: 280px !important;
              line-height: 1.5 !important;
            }
          }

          @media (min-width: 781px) {
            .qyven-sticky-mobile-cta { display: none !important; }
          }

          @media (max-width: 480px) {
            .qyven-hero {
              padding:
                72px 16px 44px !important;
            }

            .qyven-hero-grid {
              gap: 20px !important;
            }

            .qyven-hero-title {
              font-size:
                clamp(34px, 10vw, 44px) !important;
            }

            .qyven-hero-copy > div:first-child {
              font-size: 8px !important;
              padding:
                6px 10px !important;
              letter-spacing:
                0.1em !important;
              margin-bottom: 16px !important;
            }

            .qyven-score-preview-wrapper {
              max-width: 260px !important;
            }

            .qyven-score-card {
              padding: 14px !important;
              border-radius: 20px !important;
            }
              
@media (max-width: 780px) {
  .qyven-score-card {
    animation: none !important;
  }
}
            .qyven-score-ring-container {
              height: auto !important;
              align-items: center !important;
            }

            .qyven-section {
              padding-left: 16px !important;
              padding-right: 16px !important;
            }

            .qyven-trajectory-card {
              padding:
                38px 14px 28px !important;
            }

            .qyven-chart {
              height: 165px !important;
            }
          }

          @media (max-width: 360px) {
            .qyven-nav-cta {
              padding:
                7px 11px !important;
              font-size: 10px !important;
            }

            .qyven-hero-title {
              font-size: 34px !important;
            }

            .qyven-score-preview-wrapper {
              max-width: 235px !important;
            }

            .qyven-score-card {
              padding: 15px !important;
            }

            .qyven-trust-points {
              font-size: 9px !important;
            }
          }


          /* ─────────────────────────────────────────────────────────────
             Enhanced motion / ambient hero
             ───────────────────────────────────────────────────────────── */

          .qyven-ambient-scene {
            position: absolute;
            inset: 0;
            min-height: 100%;
            overflow: hidden;
            pointer-events: none;
            z-index: 0;
          }

          .qyven-ambient-grid {
            position: absolute;
            inset: 0;
            opacity: 0.22;
            background-image:
              linear-gradient(#ffffff 1px, transparent 1px),
              linear-gradient(90deg, #ffffff 1px, transparent 1px);
            background-size: 80px 80px;
            mask-image: radial-gradient(ellipse at center, black 0%, transparent 72%);
            -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 72%);
          }

          .qyven-hero-enhanced::before,
          .qyven-hero-enhanced::after {
            content: '';
            position: absolute;
            pointer-events: none;
            border-radius: 50%;
            filter: blur(2px);
          }

          .qyven-hero-enhanced::before {
            width: 620px;
            height: 620px;
            left: -210px;
            top: 70px;
            background: radial-gradient(circle, rgba(127,90,240,0.14), transparent 68%);
            animation: qyvenHeroGlowOne 16s ease-in-out infinite;
          }

          .qyven-hero-enhanced::after {
            width: 520px;
            height: 520px;
            right: -180px;
            top: 80px;
            background: radial-gradient(circle, rgba(0,232,198,0.11), rgba(255,122,198,0.06) 38%, transparent 70%);
            animation: qyvenHeroGlowTwo 19s ease-in-out infinite;
          }

          .qyven-hero-trajectory {
            position: absolute;
            inset: 0;
            width: 100%;
            height: min(100%, 760px);
            opacity: 0.9;
          }

          .qyven-hero-trajectory-line {
            stroke-dasharray: 120 18;
            animation: qyvenTrajectoryFlow 13s linear infinite;
          }

          .qyven-hero-trajectory-glow {
            opacity: 0.18;
            stroke-dasharray: 85 35;
            animation: qyvenTrajectoryFlow 13s linear infinite reverse;
          }

          .qyven-trajectory-node {
            fill: #67E8F9;
            filter: drop-shadow(0 0 8px rgba(103,232,249,0.8));
            animation: qyvenNodePulse 3.5s ease-in-out infinite;
          }

          .node-two { animation-delay: 0.8s; }
          .node-three { animation-delay: 1.6s; }

          .qyven-particle-field {
            position: absolute;
            inset: 0;
          }

          .qyven-particle {
            position: absolute;
            display: block;
            border-radius: 50%;
            background: rgba(190, 240, 255, 0.65);
            box-shadow: 0 0 9px rgba(103,232,249,0.45);
            opacity: 0.32;
            animation-name: qyvenParticleFloat;
            animation-timing-function: ease-in-out;
            animation-iteration-count: infinite;
          }

          .qyven-ambient-vignette {
            position: absolute;
            inset: 0;
            background:
              radial-gradient(ellipse at 50% 38%, transparent 0%, rgba(109,40,217,0.025) 48%, rgba(245,243,255,0.72) 100%);
          }

          .qyven-floating-card {
            animation: qyvenCardFloat 7s ease-in-out infinite;
            transform-origin: center center;
          }

          .qyven-floating-card::after {
            content: '';
            position: absolute;
            width: 70%;
            height: 45%;
            left: 15%;
            bottom: -28%;
            background: radial-gradient(ellipse, rgba(127,90,240,0.24), transparent 70%);
            filter: blur(18px);
            z-index: -1;
            animation: qyvenCardShadow 7s ease-in-out infinite;
          }

          .qyven-score-card-signal {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            margin: 0 auto 3px;
            width: fit-content;
            padding: 5px 9px;
            border: 1px solid rgba(103,232,249,0.1);
            border-radius: 999px;
            background: rgba(103,232,249,0.035);
            color: #656A83;
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 0.02em;
          }

          .qyven-signal-dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #00cdb4;
            box-shadow: 0 0 8px rgba(0,232,198,0.8);
            animation: qyvenSignalPulse 2s ease-in-out infinite;
          }

          .qyven-interactive-button {
            transition:
              box-shadow 220ms ease,
              filter 220ms ease;
          }

          .qyven-interactive-button:hover {
            filter: brightness(1.06);
          }

          .qyven-interactive-button:active {
            filter: brightness(0.97);
          }

          .qyven-chart-line {
            stroke-dasharray: 900;
            stroke-dashoffset: 900;
            animation: qyvenChartDraw 2.4s 0.35s cubic-bezier(0.16,1,0.3,1) forwards;
          }

          @keyframes qyvenHeroGlowOne {
            0%, 100% { transform: translate3d(0,0,0) scale(1); opacity: 0.85; }
            50% { transform: translate3d(70px,35px,0) scale(1.12); opacity: 1; }
          }

          @keyframes qyvenHeroGlowTwo {
            0%, 100% { transform: translate3d(0,0,0) scale(1); opacity: 0.8; }
            50% { transform: translate3d(-55px,50px,0) scale(1.1); opacity: 1; }
          }

          @keyframes qyvenTrajectoryFlow {
            to { stroke-dashoffset: -138; }
          }

          @keyframes qyvenNodePulse {
            0%, 100% { transform: scale(1); opacity: 0.65; }
            50% { transform: scale(1.55); opacity: 1; }
          }

          @keyframes qyvenParticleFloat {
            0%, 100% { transform: translate3d(0,0,0); opacity: 0.18; }
            50% { transform: translate3d(12px,-18px,0); opacity: 0.62; }
          }

          @keyframes qyvenCardFloat {
            0%, 100% { transform: translate3d(0,0,0) rotate(0deg); }
            50% { transform: translate3d(0,-7px,0) rotate(0.25deg); }
          }

          @keyframes qyvenCardShadow {
            0%, 100% { transform: scale(0.92); opacity: 0.65; }
            50% { transform: scale(1.05); opacity: 1; }
          }

          @keyframes qyvenSignalPulse {
            0%, 100% { opacity: 0.45; transform: scale(0.85); }
            50% { opacity: 1; transform: scale(1.15); }
          }

          @keyframes qyvenChartDraw {
            to { stroke-dashoffset: 0; }
          }


          @media (max-width: 780px) {
            .qyven-ambient-grid {
              background-size: 58px 58px;
              opacity: 0.14;
            }

            .qyven-hero-trajectory {
              height: 650px;
              opacity: 0.55;
            }

            .qyven-hero-enhanced::before {
              width: 430px;
              height: 430px;
              left: -230px;
              top: 30px;
            }

            .qyven-hero-enhanced::after {
              width: 390px;
              height: 390px;
              right: -220px;
              top: 390px;
            }

            .qyven-particle {
              opacity: 0.22;
            }

            .qyven-floating-card {
              animation-duration: 8s;
            }

            .qyven-score-card-signal {
              font-size: 7.5px;
              padding: 4px 8px;
            }
          }

          @media (max-width: 480px) {
            .qyven-hero-trajectory {
              height: 620px;
              opacity: 0.38;
            }

            .qyven-ambient-grid {
              opacity: 0.1;
            }

            .qyven-floating-card {
              animation-duration: 9s;
            }

            .qyven-score-card-signal {
              margin-bottom: 0;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
              scroll-behavior: auto !important;
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }

          @supports (padding: env(safe-area-inset-bottom)) {
            .qyven-footer {
              padding-bottom:
                max(24px, env(safe-area-inset-bottom)) !important;
            }

            .qyven-nav {
              padding-top:
                env(safe-area-inset-top) !important;
            }
          }
        `}
      </style>
    </div>
  )
}