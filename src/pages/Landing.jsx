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
// Reveal animation
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

function Reveal({ children, delay = 0, scale = false }) {
  const [ref, visible] = useReveal()

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'translateY(0) scale(1)'
          : `translateY(28px) scale(${scale ? 0.95 : 1})`,
        transition: `opacity 0.75s ${delay}ms cubic-bezier(0.16,1,0.3,1),
          transform 0.75s ${delay}ms cubic-bezier(0.16,1,0.3,1)`,
      }}
    >
      {children}
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

  const radius = size / 2 - strokeWidth
  const circumference = 2 * Math.PI * radius
  const dash = (displayed / 100) * circumference

  useEffect(() => {
    let frame
    let start = null

    const duration = 1500

    const animate = (timestamp) => {
      if (!start) start = timestamp

      const progress = Math.min(
        (timestamp - start) / duration,
        1
      )

      const eased = 1 - Math.pow(1 - progress, 3)

      setDisplayed(Math.round(eased * score))

      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      }
    }

    const timeout = setTimeout(() => {
      frame = requestAnimationFrame(animate)
    }, 400)

    return () => {
      clearTimeout(timeout)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [score])

  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          position: 'absolute',
          transform: 'rotate(-90deg)',
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
            <stop offset="0%" stopColor="#FF7AC6" />
            <stop offset="50%" stopColor="#7F5AF0" />
            <stop offset="100%" stopColor="#00E8C6" />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={strokeWidth}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#landingScoreGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{
            filter: 'drop-shadow(0 0 12px rgba(127,90,240,0.45))',
            transition: 'stroke-dasharray 0.08s linear',
          }}
        />
      </svg>

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: size * 0.3,
            lineHeight: 0.95,
            fontWeight: 800,
            letterSpacing: '-0.06em',
            background:
              'linear-gradient(135deg, #FF7AC6, #7F5AF0, #00E8C6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {displayed}
        </div>

        <div
          style={{
            marginTop: 7,
            fontSize: size * 0.06,
            fontWeight: 800,
            color: '#858AA5',
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
          color: '#9499B5',
        }}
      >
        {label}
      </span>

      <div
        style={{
          height: 5,
          background: 'rgba(255,255,255,0.06)',
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
    {
      top: -120,
      left: '4%',
      size: 430,
      color: 'rgba(127,90,240,0.24)',
      speed: 0.12,
    },
    {
      top: 240,
      left: '78%',
      size: 340,
      color: 'rgba(255,122,198,0.18)',
      speed: 0.22,
    },
    {
      top: 820,
      left: '-4%',
      size: 320,
      color: 'rgba(0,232,198,0.14)',
      speed: 0.16,
    },
    {
      top: 1500,
      left: '76%',
      size: 390,
      color: 'rgba(255,184,48,0.12)',
      speed: 0.2,
    },
    {
      top: 2200,
      left: '8%',
      size: 340,
      color: 'rgba(0,232,122,0.13)',
      speed: 0.14,
    },
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
            animation: `qyvenDrift${index % 3} ${
              15 + index * 2
            }s ease-in-out infinite`,
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
            .qyven-mobile-blob {
              display: none !important;
            }
          }
        `}
      </style>
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
    color: '#7F5AF0',
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

  return (
    <div
      className="qyven-landing"
      style={{
        minHeight: '100vh',
        background: '#0B0A14',
        color: '#F1EEF9',
        fontFamily:
          "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        overflowX: 'hidden',
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
      }}
    >
      <FloatingBlobs scrollY={scrollY} />

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
    background: 'rgba(11,10,20,0.72)',
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
    borderBottom:
      '1px solid rgba(255,255,255,0.06)',
  }}
>
  <Link
    to="/"
    style={{
      textDecoration: 'none',
      color: '#F5F3FF',
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
          color: '#AEB2CC',
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
      className="qyven-nav-cta"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '9px 18px',
        minHeight: 40,
        borderRadius: 999,
        background:
          'linear-gradient(135deg,#FF7AC6,#7F5AF0,#00E8C6)',
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
        className="qyven-hero"
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
          className="qyven-hero-grid"
          style={{
            width: '100%',
            maxWidth: 1100,
            display: 'grid',
            gridTemplateColumns:
              'minmax(0,1.05fr) minmax(300px,0.75fr)',
            gap: 70,
            alignItems: 'center',
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
                    background: '#00E8C6',
                    boxShadow:
                      '0 0 10px rgba(0,232,198,0.8)',
                  }}
                />
                Your habits. Your trajectory.
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
                What is your
                <br />
                <span
                  style={{
                    background:
                      'linear-gradient(110deg,#D8B4FE,#A78BFA 45%,#67E8F9)',
                    WebkitBackgroundClip:
                      'text',
                    WebkitTextFillColor:
                      'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Future Self Score?
                </span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p
                className="qyven-hero-description"
                style={{
                  margin:
                    '25px 0 0',
                  maxWidth: 560,
                  color: '#AEB2CC',
                  fontSize:
                    'clamp(16px,2.3vw,19px)',
                  lineHeight: 1.65,
                }}
              >
                A simple score that shows how your
                everyday choices are shaping the
                person you're becoming.
              </p>
            </Reveal>

            <Reveal delay={230}>
              <div
                className="qyven-hero-actions"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 32,
                }}
              >
                <Link
                  to={
                    isLoggedIn
                      ? '/dashboard'
                      : '/get-started'
                  }
                  className="qyven-main-cta"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding:
                      '16px 25px',
                    minHeight: 52,
                    borderRadius: 999,
                    background:
                      'linear-gradient(135deg,#FF7AC6,#7F5AF0,#00E8C6)',
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
                </Link>

                {!isLoggedIn && (
                  <span
                    style={{
                      fontSize: 12,
                      color: '#737891',
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
                  color: '#767B96',
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
                className="qyven-score-card"
                style={{
                  position: 'relative',
                  padding: 25,
                  borderRadius: 30,
                  background:
                    'linear-gradient(155deg,rgba(255,255,255,0.075),rgba(255,255,255,0.025))',
                  border:
                    '1px solid rgba(255,255,255,0.11)',
                  boxShadow:
                    '0 30px 90px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
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
                      'linear-gradient(90deg,#FF7AC6,#7F5AF0,#00E8C6)',
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
                        color: '#737891',
                        textTransform:
                          'uppercase',
                        letterSpacing:
                          '0.13em',
                        fontWeight: 800,
                      }}
                    >
                      Your Future Self
                    </div>

                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      Score preview
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
                      color: '#00E8C6',
                      fontSize: 9,
                      fontWeight: 800,
                    }}
                  >
                    LIVE
                  </span>
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
                    color="#7F5AF0"
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
                      '1px solid rgba(255,255,255,0.06)',
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
                        color: '#F1EEF9',
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
                    'linear-gradient(110deg,#FF7AC6,#7F5AF0,#00E8C6)',
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
                color: '#00E8C6',
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
              color: '#00E8C6',
            },
            {
              number: '02',
              title: 'Get your score',
              text: 'Qyven turns your habits into one simple Future Self Score.',
              icon: '◎',
              color: '#7F5AF0',
            },
            {
              number: '03',
              title: 'See your trajectory',
              text: 'Understand what is moving you forward and what needs attention.',
              icon: '↗',
              color: '#FF7AC6',
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
                    `linear-gradient(145deg,${step.color}10,rgba(255,255,255,0.025))`,
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
            className="qyven-trajectory-card"
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
                  'linear-gradient(90deg,#FF7AC6,#7F5AF0,#00E8C6)',
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
                    'linear-gradient(120deg,#FF7AC6,#7F5AF0,#00E8C6)',
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
                    'rgba(255,255,255,0.08)',
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
                      stopColor="#FF7AC6"
                    />
                    <stop
                      offset="50%"
                      stopColor="#7F5AF0"
                    />
                    <stop
                      offset="100%"
                      stopColor="#00E8C6"
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
                      stopColor="#7F5AF0"
                      stopOpacity="0.18"
                    />
                    <stop
                      offset="100%"
                      stopColor="#7F5AF0"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                <path
                  d="M 0 140 C 80 138, 120 128, 175 132 C 230 136, 270 105, 325 112 C 390 120, 430 82, 480 89 C 535 95, 570 55, 620 58 C 650 60, 680 35, 700 22 L 700 180 L 0 180 Z"
                  fill="url(#trajectoryFill)"
                />

                <path
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
                  fill="#FF7AC6"
                />

                <circle
                  cx="350"
                  cy="111"
                  r="6"
                  fill="#7F5AF0"
                />

                <circle
                  cx="700"
                  cy="22"
                  r="7"
                  fill="#00E8C6"
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
                color: '#656A83',
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
                    'rgba(255,255,255,0.08)',
                  border:
                    '1px solid rgba(255,255,255,0.13)',
                  color: '#F1EEF9',
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
                color: '#00E8C6',
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
              color: '#7F5AF0',
            },
            {
              icon: '↑',
              title: 'Your strongest area',
              text: "See where you're already building momentum.",
              color: '#00E8C6',
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
              color: '#FF7AC6',
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
                    'rgba(255,255,255,0.025)',
                  border:
                    '1px solid rgba(255,255,255,0.075)',
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
                color: '#00E8C6',
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
                color: '#00E8C6',
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
                    'linear-gradient(120deg,#FF7AC6,#7F5AF0,#00E8C6)',
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

            <Link
              to={
                isLoggedIn
                  ? '/dashboard'
                  : '/get-started'
              }
              className="qyven-final-button"
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
                  'linear-gradient(135deg,#FF7AC6,#7F5AF0,#00E8C6)',
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
                : 'Find My Future Self Score →'}
            </Link>

            <div
              style={{
                marginTop: 16,
                color: '#656A83',
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
            '1px solid rgba(255,255,255,0.06)',
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
            color: '#F1EEF9',
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
            color: '#5F647D',
            fontSize: 11,
          }}
        >
          Track what you do today. See where it takes you.
        </p>

        {!isLoggedIn && (
          <Link
            to="/get-started"
            style={{
              color: '#00E8C6',
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

      {/* ───────────────── MOBILE / PWA RESPONSIVE CSS ───────────────── */}

      <style>
        {`
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
                105px 18px 55px !important;
              display: block !important;
            }

            .qyven-hero-grid {
              display: flex !important;
              flex-direction: column !important;
              gap: 42px !important;
              align-items: stretch !important;
            }

            .qyven-hero-copy {
              width: 100% !important;
              text-align: left !important;
            }

            .qyven-hero-title {
              font-size:
                clamp(42px, 11vw, 56px) !important;
              line-height: 0.98 !important;
              letter-spacing: -0.065em !important;
              max-width: 100% !important;
            }

            .qyven-hero-description {
              font-size: 16px !important;
              line-height: 1.6 !important;
              max-width: 100% !important;
              margin-top: 20px !important;
            }

            .qyven-hero-actions {
              margin-top: 25px !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 10px !important;
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
              margin-top: 19px !important;
              font-size: 10px !important;
              line-height: 1.5 !important;
            }

            .qyven-score-preview-wrapper {
              max-width: 100% !important;
              width: 100% !important;
              margin: 0 auto !important;
            }

            .qyven-score-glow {
              inset: -20px !important;
            }

            .qyven-score-card {
              padding: 20px !important;
              border-radius: 24px !important;
            }

            .qyven-score-ring-container {
              padding:
                8px 0 20px !important;
            }

            .qyven-score-ring-container > div {
              transform: scale(0.9);
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
            }

            .qyven-footer p {
              max-width: 280px !important;
              line-height: 1.5 !important;
            }
          }

          @media (max-width: 480px) {
            .qyven-hero {
              padding:
                96px 16px 48px !important;
            }

            .qyven-hero-grid {
              gap: 34px !important;
            }

            .qyven-hero-title {
              font-size:
                clamp(39px, 11.5vw, 51px) !important;
            }

            .qyven-hero-copy > div:first-child {
              font-size: 8px !important;
              padding:
                6px 10px !important;
              letter-spacing:
                0.1em !important;
              margin-bottom: 18px !important;
            }

            .qyven-score-card {
              padding: 18px !important;
              border-radius: 22px !important;
            }

            .qyven-score-ring-container > div {
              transform: scale(0.82);
            }

            .qyven-score-ring-container {
              height: 168px !important;
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
              font-size: 38px !important;
            }

            .qyven-score-card {
              padding: 15px !important;
            }

            .qyven-trust-points {
              font-size: 9px !important;
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