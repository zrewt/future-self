import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useUserStore } from '../store/useUserStore'

// ── Animated score ring ───────────────────────────────────────────────────────
function ScoreRing({ score = 67, size = 160, strokeWidth = 8 }) {
  const [displayed, setDisplayed] = useState(0)
  const r = (size / 2) - strokeWidth
  const circ = 2 * Math.PI * r
  const dash = (displayed / 100) * circ

  useEffect(() => {
    let start = null
    const dur = 1800
    const step = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / dur, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setDisplayed(Math.round(ease * score))
      if (p < 1) requestAnimationFrame(step)
    }
    const t = setTimeout(() => requestAnimationFrame(step), 400)
    return () => clearTimeout(t)
  }, [score])

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg style={{ transform: 'rotate(-90deg)', position: 'absolute' }} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7F5AF0" />
            <stop offset="100%" stopColor="#00E87A" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#ringGrad)"
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.08s linear', filter: 'drop-shadow(0 0 8px rgba(0,232,122,0.5))' }}
        />
      </svg>
      <div className="text-center z-10">
        <div className="font-extrabold tabular-nums leading-none" style={{
          fontSize: size * 0.3,
          background: 'linear-gradient(135deg, #00E87A, #7F5AF0)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          {displayed}
        </div>
        <div style={{ fontSize: size * 0.065, color: '#5A7050', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>
          FSS
        </div>
      </div>
    </div>
  )
}

// ── Pillar bar ────────────────────────────────────────────────────────────────
function PillarBar({ icon, label, value, color, delay = 0 }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 600 + delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-5 shrink-0">{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#5A7050', width: 60, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          width: `${width}%`,
          background: color,
          boxShadow: `0 0 6px ${color}88`,
          transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)',
        }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 800, color, width: 24, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  )
}

// ── Pulse line SVG ────────────────────────────────────────────────────────────
function PulseLine({ color = '#00E87A' }) {
  return (
    <svg width="100%" height="24" viewBox="0 0 300 24" preserveAspectRatio="none" style={{ opacity: 0.45 }}>
      <path d="M0,12 L40,12 L55,12 L65,3 L75,21 L82,1 L90,23 L97,12 L130,12 L180,12 L195,6 L205,18 L213,9 L221,15 L228,12 L300,12"
        fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle r="3" fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }}>
        <animateMotion dur="3.5s" repeatCount="indefinite">
          <mpath href="#pp" />
        </animateMotion>
      </circle>
    </svg>
  )
}

// ── Scroll reveal hook ────────────────────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

function Reveal({ children, delay = 0 }) {
  const [ref, visible] = useReveal()
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.65s ${delay}ms ease, transform 0.65s ${delay}ms ease`,
    }}>
      {children}
    </div>
  )
}

const PILLARS_DEMO = [
  { icon: '🏋️', label: 'Fitness',   value: 74, color: '#7F5AF0', delay: 0   },
  { icon: '🥗', label: 'Nutrition', value: 61, color: '#00E87A', delay: 100 },
  { icon: '💤', label: 'Energy',    value: 68, color: '#4DA6FF', delay: 200 },
  { icon: '🎯', label: 'Focus',     value: 59, color: '#FFB830', delay: 300 },
  { icon: '🌿', label: 'Longevity', value: 81, color: '#FF5C5C', delay: 400 },
]

const HOW_STEPS = [
  { icon: '📋', title: 'Log',     desc: 'A 90-second daily check-in across five areas of your life.' },
  { icon: '🔢', title: 'Score',   desc: 'Qyven turns your day into a single 0–99 Future Self Score.' },
  { icon: '📈', title: 'Improve', desc: 'See what actually changes your trajectory — not just what you tracked.' },
]

const FIVE_PILLARS = [
  { icon: '🥗', label: 'Nutrition',  color: '#00E87A', desc: 'Food quality, servings, hydration' },
  { icon: '🏋️', label: 'Fitness',    color: '#7F5AF0', desc: 'Duration, intensity, consistency' },
  { icon: '💤', label: 'Sleep',      color: '#4DA6FF', desc: 'Hours, quality, recovery' },
  { icon: '🎯', label: 'Focus',      color: '#FFB830', desc: 'Deep work, reading, mindfulness' },
  { icon: '🌿', label: 'Longevity',  color: '#FF5C5C', desc: 'The habits that compound over years' },
]

// ── Main Landing ──────────────────────────────────────────────────────────────
export default function Landing() {
  const { user, authReady } = useUserStore()
  const isLoggedIn = authReady && !!user

  const primaryHex = '#7F5AF0'

  return (
    <div style={{ background: '#0A0D08', color: '#E8F0E0', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── Nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px',
        background: 'rgba(10,13,8,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,232,122,0.08)',
      }}>
        <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: -0.5 }}>
          Qy<span style={{ color: '#00E87A' }}>ven</span>
        </span>
        {isLoggedIn ? (
          <Link to="/dashboard" style={{
            background: 'linear-gradient(135deg, #00E87A, #7F5AF0)',
            color: '#fff', fontWeight: 700, fontSize: 13,
            padding: '9px 20px', borderRadius: 99, textDecoration: 'none',
            boxShadow: '0 0 20px rgba(0,232,122,0.3)',
          }}>
            Dashboard →
          </Link>
        ) : (
          <Link to="/get-started" style={{
            background: 'linear-gradient(135deg, #00E87A, #7F5AF0)',
            color: '#fff', fontWeight: 700, fontSize: 13,
            padding: '9px 20px', borderRadius: 99, textDecoration: 'none',
            boxShadow: '0 0 20px rgba(0,232,122,0.3)',
          }}>
            Find My Score →
          </Link>
        )}
      </nav>

      {/* ── Hero ── */}
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '100px 24px 60px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background glows */}
        <div style={{ position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)', width: 700, height: 700, background: 'radial-gradient(ellipse, rgba(0,232,122,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -100, right: -100, width: 400, height: 400, background: 'radial-gradient(ellipse, rgba(127,90,240,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Eyebrow */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,232,122,0.08)', border: '1px solid rgba(0,232,122,0.2)',
          borderRadius: 99, padding: '6px 14px', marginBottom: 24,
          fontSize: 11, fontWeight: 700, color: '#00E87A',
          textTransform: 'uppercase', letterSpacing: '0.1em',
          animation: 'fadeUp 0.6s ease both',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E87A', boxShadow: '0 0 8px #00E87A', animation: 'pulse 2s ease infinite', display: 'inline-block' }} />
          Future Self Scoring
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(38px, 7vw, 72px)', fontWeight: 800,
          lineHeight: 1.05, letterSpacing: -2, marginBottom: 20,
          animation: 'fadeUp 0.7s 0.1s ease both',
        }}>
          What is your<br />
          <span style={{ background: 'linear-gradient(135deg, #00E87A, #7F5AF0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Future Self Score?
          </span>
        </h1>

        {/* Sub */}
        <p style={{
          fontSize: 'clamp(15px, 2.5vw, 18px)', color: '#9DB890',
          maxWidth: 480, lineHeight: 1.65, marginBottom: 36,
          animation: 'fadeUp 0.7s 0.2s ease both',
        }}>
          See how your daily habits are shaping the person you're becoming.
          Log your day. Get your score. Watch yourself improve.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 56, animation: 'fadeUp 0.7s 0.3s ease both' }}>
          {isLoggedIn ? (
            <Link to="/dashboard" style={{
              background: 'linear-gradient(135deg, #00E87A, #7F5AF0)',
              color: '#fff', fontWeight: 700, fontSize: 16,
              padding: '16px 32px', borderRadius: 99, textDecoration: 'none',
              boxShadow: '0 4px 32px rgba(0,232,122,0.4)',
            }}>
              Go to my dashboard →
            </Link>
          ) : (
            <>
              <Link to="/get-started" style={{
                background: 'linear-gradient(135deg, #00E87A, #7F5AF0)',
                color: '#fff', fontWeight: 700, fontSize: 16,
                padding: '16px 32px', borderRadius: 99, textDecoration: 'none',
                boxShadow: '0 4px 32px rgba(0,232,122,0.4)',
              }}>
                Find My Score →
              </Link>
              <a href="#how" style={{
                color: '#5A7050', fontSize: 15, fontWeight: 500,
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
                padding: '16px 8px',
              }}>
                See how it works ↓
              </a>
            </>
          )}
        </div>

        {/* Product demo card */}
        <div style={{
          background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%), rgba(22,28,15,0.9)',
          border: '1px solid rgba(0,232,122,0.15)',
          borderRadius: 28, padding: '28px 24px',
          maxWidth: 340, width: '100%',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 60px rgba(0,0,0,0.5)',
          animation: 'fadeUp 0.8s 0.4s ease both',
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 2, background: 'linear-gradient(90deg, #00E87A, #7F5AF0)', borderRadius: '0 0 99px 99px' }} />
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#5A7050', marginBottom: 20, textAlign: 'center' }}>
            Future Self Score
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <ScoreRing score={67} size={150} strokeWidth={7} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PILLARS_DEMO.map(p => (
              <PillarBar key={p.label} {...p} />
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <PulseLine />
          </div>
        </div>

        <p style={{ marginTop: 20, fontSize: 12, color: '#5A7050' }}>
          Free · No credit card · 90 seconds
        </p>

        <style>{`
          @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
          @keyframes pulse  { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.7); } }
        `}</style>
      </div>

      {/* ── How it works ── */}
      <div id="how" style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#00E87A', marginBottom: 12 }}>
              How it works
            </p>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 12 }}>
              Log once. Understand everything.
            </h2>
            <p style={{ fontSize: 16, color: '#9DB890', maxWidth: 440, margin: '0 auto', lineHeight: 1.65 }}>
              A 90-second daily check-in produces a score that tells you exactly where you stand.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {HOW_STEPS.map((s, i) => (
              <div key={s.title} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 20, padding: 24,
                transition: 'border-color 0.2s, transform 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,232,122,0.25)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5A7050', marginBottom: 12 }}>
                  Step {i + 1}
                </p>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 10 }}>{s.icon}</span>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#E8F0E0', marginBottom: 8 }}>{s.title}</p>
                <p style={{ fontSize: 14, color: '#9DB890', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {/* ── Differentiator ── */}
      <div style={{ padding: '60px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <Reveal>
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,232,122,0.08) 0%, rgba(127,90,240,0.08) 100%)',
            border: '1px solid rgba(0,232,122,0.15)',
            borderRadius: 28, padding: '48px 36px', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #00E87A, #7F5AF0, #00E87A)' }} />
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, letterSpacing: -1, lineHeight: 1.15, marginBottom: 14 }}>
              Don&apos;t just track your habits.
            </h2>
            <p style={{ fontSize: 'clamp(20px, 3vw, 30px)', fontWeight: 800, letterSpacing: -0.5, color: '#00E87A', marginBottom: 20 }}>
              See where they&apos;re taking you.
            </p>
            <p style={{ fontSize: 16, color: '#9DB890', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.65 }}>
              Your habits become data. Your data becomes a pattern. Your pattern shows you where you&apos;re heading.
            </p>
            {/* Mini trajectory visual */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
              {[
                { label: 'Today',    value: 64, h: 64  },
                { label: '30 days',  value: 70, h: 80  },
                { label: '6 months', value: 79, h: 100 },
                { label: '1 year',   value: 87, h: 120 },
              ].map((t, i) => (
                <div key={t.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: i === 0 ? '#5A7050' : '#00E87A' }}>{t.value}</span>
                  <div style={{
                    width: 44, height: t.h, borderRadius: 10,
                    background: i === 0
                      ? 'rgba(255,255,255,0.08)'
                      : `linear-gradient(180deg, #00E87A ${100 - Math.round((t.value / 87) * 100)}%, #7F5AF0 100%)`,
                    boxShadow: i > 0 ? '0 0 16px rgba(0,232,122,0.25)' : 'none',
                  }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#5A7050', textAlign: 'center', lineHeight: 1.3 }}>{t.label}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#5A7050', marginBottom: 28 }}>
              Qyven progression estimate — based on consistency, not guaranteed
            </p>
            {!isLoggedIn && (
              <Link to="/get-started" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg, #00E87A, #7F5AF0)',
                color: '#fff', fontWeight: 700, fontSize: 15,
                padding: '14px 28px', borderRadius: 99, textDecoration: 'none',
                boxShadow: '0 4px 24px rgba(0,232,122,0.35)',
              }}>
                See my trajectory →
              </Link>
            )}
          </div>
        </Reveal>
      </div>

      {/* ── Five pillars ── */}
      <div style={{ padding: '60px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#00E87A', marginBottom: 12 }}>
              Five pillars
            </p>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, letterSpacing: -1, lineHeight: 1.1 }}>
              Every dimension of your best self.
            </h2>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            {FIVE_PILLARS.map(p => (
              <div key={p.label} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 18, padding: '20px 16px',
                borderTop: `2px solid ${p.color}`,
                transition: 'transform 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <span style={{ fontSize: 26, display: 'block', marginBottom: 10 }}>{p.icon}</span>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#E8F0E0', marginBottom: 6 }}>{p.label}</p>
                <p style={{ fontSize: 12, color: '#9DB890', lineHeight: 1.5 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {/* ── Trust bar ── */}
      <div style={{ padding: '40px 24px', maxWidth: 700, margin: '0 auto' }}>
        <Reveal>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px 32px' }}>
            {['Free forever', 'No credit card', '90-second daily log', 'Works on any device', 'No fake health claims'].map(t => (
              <span key={t} style={{ fontSize: 13, fontWeight: 600, color: '#5A7050', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#00E87A' }}>✓</span> {t}
              </span>
            ))}
          </div>
        </Reveal>
      </div>

      {/* ── Final CTA ── */}
      <div style={{ padding: '60px 24px 100px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(0,232,122,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <Reveal>
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 520, margin: '0 auto' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#00E87A', marginBottom: 16 }}>
              Ready?
            </p>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 50px)', fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 18 }}>
              What&apos;s your<br />
              <span style={{ background: 'linear-gradient(135deg, #00E87A, #7F5AF0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Future Self Score?
              </span>
            </h2>
            <p style={{ fontSize: 16, color: '#9DB890', marginBottom: 32, lineHeight: 1.6 }}>
              Answer 5 questions. Get your personalized score in 60 seconds.
            </p>
            {isLoggedIn ? (
              <Link to="/dashboard" style={{
                display: 'inline-flex', alignItems: 'center',
                background: 'linear-gradient(135deg, #00E87A, #7F5AF0)',
                color: '#fff', fontWeight: 700, fontSize: 17,
                padding: '18px 40px', borderRadius: 99, textDecoration: 'none',
                boxShadow: '0 4px 32px rgba(0,232,122,0.4)',
              }}>
                Go to dashboard →
              </Link>
            ) : (
              <Link to="/get-started" style={{
                display: 'inline-flex', alignItems: 'center',
                background: 'linear-gradient(135deg, #00E87A, #7F5AF0)',
                color: '#fff', fontWeight: 700, fontSize: 17,
                padding: '18px 40px', borderRadius: 99, textDecoration: 'none',
                boxShadow: '0 4px 32px rgba(0,232,122,0.4)',
              }}>
                Find My Score →
              </Link>
            )}
            <p style={{ fontSize: 13, color: '#5A7050', marginTop: 16 }}>
              Free · No credit card · 90 seconds
            </p>
          </div>
        </Reveal>
      </div>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <span style={{ fontWeight: 800, fontSize: 17 }}>
          Qy<span style={{ color: '#00E87A' }}>ven</span>
        </span>
        <p style={{ fontSize: 13, color: '#5A7050' }}>
          Built for people who take the long view.
        </p>
        {!isLoggedIn && (
          <Link to="/get-started" style={{ fontSize: 13, color: '#00E87A', textDecoration: 'none', fontWeight: 600 }}>
            Find My Score →
          </Link>
        )}
      </footer>
    </div>
  )
}
