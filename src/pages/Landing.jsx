import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useUserStore } from '../store/useUserStore'

// ── Scroll-linked parallax value ─────────────────────────────────────────────
function useParallax() {
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => { setScrollY(window.scrollY); ticking = false })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return scrollY
}

// ── Scroll reveal (fade + scale + slide) ─────────────────────────────────────
function useReveal(threshold = 0.15) {
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

function Reveal({ children, delay = 0, scale = false }) {
  const [ref, visible] = useReveal()
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible
        ? 'translateY(0) scale(1)'
        : `translateY(28px) scale(${scale ? 0.94 : 1})`,
      transition: `opacity 0.7s ${delay}ms cubic-bezier(0.16,1,0.3,1), transform 0.7s ${delay}ms cubic-bezier(0.16,1,0.3,1)`,
    }}>
      {children}
    </div>
  )
}

// ── Animated score ring ───────────────────────────────────────────────────────
function ScoreRing({ score = 67, size = 150, strokeWidth = 8 }) {
  const [displayed, setDisplayed] = useState(0)
  const r = (size / 2) - strokeWidth
  const circ = 2 * Math.PI * r
  const dash = (displayed / 100) * circ

  useEffect(() => {
    let start = null
    const dur = 1600
    const step = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / dur, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setDisplayed(Math.round(ease * score))
      if (p < 1) requestAnimationFrame(step)
    }
    const t = setTimeout(() => requestAnimationFrame(step), 300)
    return () => clearTimeout(t)
  }, [score])

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg style={{ transform: 'rotate(-90deg)', position: 'absolute' }} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF7AC6" />
            <stop offset="50%" stopColor="#7F5AF0" />
            <stop offset="100%" stopColor="#00E8C6" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#ringGrad)"
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.08s linear', filter: 'drop-shadow(0 0 10px rgba(127,90,240,0.4))' }}
        />
      </svg>
      <div className="text-center z-10">
        <div className="font-extrabold tabular-nums leading-none" style={{
          fontSize: size * 0.3,
          background: 'linear-gradient(135deg, #FF7AC6, #7F5AF0, #00E8C6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          {displayed}
        </div>
        <div style={{ fontSize: size * 0.065, color: '#8A8FA3', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>
          FSS
        </div>
      </div>
    </div>
  )
}

function PillarBar({ icon, label, value, color, delay = 0 }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 600 + delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return (
    <div className="flex items-center gap-3">
      <span style={{ fontSize: 14, width: 22, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#9DA3C4', width: 62, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99, width: `${width}%`, background: color,
          boxShadow: `0 0 10px ${color}99`,
          transition: 'width 1.1s cubic-bezier(0.16,1,0.3,1)',
        }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 800, color, width: 24, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  )
}

const PILLARS_DEMO = [
  { icon: '🏋️', label: 'Fitness',   value: 74, color: '#7F5AF0', delay: 0   },
  { icon: '🥗', label: 'Nutrition', value: 61, color: '#00E87A', delay: 100 },
  { icon: '💤', label: 'Energy',    value: 68, color: '#4DA6FF', delay: 200 },
  { icon: '🎯', label: 'Focus',     value: 59, color: '#FFB830', delay: 300 },
  { icon: '🌿', label: 'Longevity', value: 81, color: '#FF5C8A', delay: 400 },
]

const FIVE_PILLARS = [
  { icon: '🥗', label: 'Nutrition', color: '#00E87A', glow: 'rgba(0,232,122,0.18)',  weight: '25%', desc: 'Food quality, servings, hydration' },
  { icon: '🏋️', label: 'Fitness',   color: '#7F5AF0', glow: 'rgba(127,90,240,0.18)', weight: '25%', desc: 'Duration, intensity, consistency' },
  { icon: '💤', label: 'Sleep',     color: '#4DA6FF', glow: 'rgba(77,166,255,0.18)', weight: '20%', desc: 'Hours, quality, recovery' },
  { icon: '🎯', label: 'Focus',     color: '#FFB830', glow: 'rgba(255,184,48,0.18)', weight: '15%', desc: 'Deep work, reading, mindfulness' },
  { icon: '🌿', label: 'Longevity', color: '#FF5C8A', glow: 'rgba(255,92,138,0.18)', weight: '15%', desc: 'Habits that compound over years' },
]

const HOW_STEPS = [
  { icon: '📋', title: 'Log',     desc: 'A 90-second daily check-in across five areas of your life.', color: '#00E8C6' },
  { icon: '🔢', title: 'Score',   desc: 'Qyven turns your day into a single 0–99 Future Self Score.', color: '#7F5AF0' },
  { icon: '📈', title: 'Improve', desc: 'See what actually changes your trajectory over time.', color: '#FF7AC6' },
]

// ── Floating gradient blobs (parallax) ────────────────────────────────────────
function FloatingBlobs({ scrollY }) {
  const blobs = [
    { top: -120, left: '8%',  size: 380, color: 'rgba(127,90,240,0.28)', speed: 0.15 },
    { top: 200,  left: '78%', size: 320, color: 'rgba(255,122,198,0.22)', speed: 0.3  },
    { top: 700,  left: '4%',  size: 300, color: 'rgba(0,232,198,0.2)',   speed: 0.2  },
    { top: 1200, left: '70%', size: 360, color: 'rgba(255,184,48,0.18)', speed: 0.25 },
    { top: 1900, left: '10%', size: 340, color: 'rgba(0,232,122,0.2)',   speed: 0.18 },
  ]
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {blobs.map((b, i) => (
        <div key={i} style={{
          position: 'absolute', top: b.top - scrollY * b.speed, left: b.left,
          width: b.size, height: b.size, borderRadius: '50%',
          background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
          filter: 'blur(20px)',
          animation: `drift${i % 3} ${14 + i * 2}s ease-in-out infinite`,
        }} />
      ))}
      <style>{`
        @keyframes drift0 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(30px,20px); } }
        @keyframes drift1 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-25px,30px); } }
        @keyframes drift2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(20px,-25px); } }
      `}</style>
    </div>
  )
}

// ── Main Landing ──────────────────────────────────────────────────────────────
export default function Landing() {
  const { user, authReady } = useUserStore()
  const isLoggedIn = authReady && !!user
  const scrollY = useParallax()

  return (
    <div style={{ background: '#0B0A14', color: '#F1EEF9', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>

      <FloatingBlobs scrollY={scrollY} />

      {/* ── Nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px',
        background: 'rgba(11,10,20,0.75)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: -0.5 }}>
          Qy<span style={{ background: 'linear-gradient(135deg, #FF7AC6, #00E8C6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ven</span>
        </span>
        {isLoggedIn ? (
          <Link to="/dashboard" style={{
            background: 'linear-gradient(135deg, #FF7AC6, #7F5AF0, #00E8C6)',
            color: '#fff', fontWeight: 700, fontSize: 13,
            padding: '9px 20px', borderRadius: 99, textDecoration: 'none',
            boxShadow: '0 0 24px rgba(127,90,240,0.35)',
          }}>
            Dashboard →
          </Link>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Link to="/login" style={{ color: '#C4C6DD', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
              Sign in
            </Link>
            <Link to="/get-started" style={{
              background: 'linear-gradient(135deg, #FF7AC6, #7F5AF0, #00E8C6)',
              color: '#fff', fontWeight: 700, fontSize: 13,
              padding: '9px 20px', borderRadius: 99, textDecoration: 'none',
              boxShadow: '0 0 24px rgba(127,90,240,0.35)',
            }}>
              Find My Score →
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '100px 24px 60px', textAlign: 'center',
        position: 'relative', zIndex: 1,
      }}>
        <Reveal>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 99, padding: '6px 14px', marginBottom: 24,
            fontSize: 11, fontWeight: 700,
            background2: 'transparent',
            color: '#00E8C6',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'linear-gradient(135deg, #FF7AC6, #00E8C6)', display: 'inline-block' }} />
            Future Self Scoring
          </div>
        </Reveal>

        <Reveal delay={80}>
          <h1 style={{
            fontSize: 'clamp(38px, 7vw, 72px)', fontWeight: 800,
            lineHeight: 1.05, letterSpacing: -2, marginBottom: 20,
          }}>
            What is your<br />
            <span style={{ background: 'linear-gradient(120deg, #FF7AC6, #7F5AF0 45%, #00E8C6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Future Self Score?
            </span>
          </h1>
        </Reveal>

        <Reveal delay={160}>
          <p style={{
            fontSize: 'clamp(15px, 2.5vw, 18px)', color: '#B4B7D4',
            maxWidth: 480, lineHeight: 1.65, marginBottom: 36,
          }}>
            See how your daily habits are shaping the person you're becoming.
            Log your day. Get your score. Watch yourself improve.
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 56 }}>
            {isLoggedIn ? (
              <Link to="/dashboard" style={{
                background: 'linear-gradient(135deg, #FF7AC6, #7F5AF0, #00E8C6)',
                color: '#fff', fontWeight: 700, fontSize: 16,
                padding: '16px 32px', borderRadius: 99, textDecoration: 'none',
                boxShadow: '0 4px 36px rgba(127,90,240,0.45)',
              }}>
                Go to my dashboard →
              </Link>
            ) : (
              <>
                <Link to="/get-started" style={{
                  background: 'linear-gradient(135deg, #FF7AC6, #7F5AF0, #00E8C6)',
                  color: '#fff', fontWeight: 700, fontSize: 16,
                  padding: '16px 32px', borderRadius: 99, textDecoration: 'none',
                  boxShadow: '0 4px 36px rgba(127,90,240,0.45)',
                }}>
                  Find My Score →
                </Link>
                <Link to="/login" style={{
                  color: '#C4C6DD', fontSize: 15, fontWeight: 600,
                  textDecoration: 'none', display: 'flex', alignItems: 'center',
                  padding: '16px 24px', border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 99,
                }}>
                  Sign in
                </Link>
              </>
            )}
          </div>
        </Reveal>

        <Reveal delay={320} scale>
          <div style={{
            background: 'linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%), rgba(20,18,32,0.9)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 28, padding: '28px 24px',
            maxWidth: 340, width: '100%',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 70px rgba(127,90,240,0.15)',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 2, background: 'linear-gradient(90deg, #FF7AC6, #7F5AF0, #00E8C6)', borderRadius: '0 0 99px 99px' }} />
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#8A8FA3', marginBottom: 20, textAlign: 'center' }}>
              Future Self Score
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <ScoreRing score={67} size={150} strokeWidth={7} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PILLARS_DEMO.map(p => <PillarBar key={p.label} {...p} />)}
            </div>
          </div>
        </Reveal>

        <p style={{ marginTop: 20, fontSize: 12, color: '#6E7290' }}>
          Free · No credit card · 90 seconds
        </p>
      </div>

      {/* ── How it works ── */}
      <div id="how" style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#00E8C6', marginBottom: 12 }}>
              How it works
            </p>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 12 }}>
              Log once. Understand everything.
            </h2>
            <p style={{ fontSize: 16, color: '#B4B7D4', maxWidth: 440, margin: '0 auto', lineHeight: 1.65 }}>
              A 90-second daily check-in produces a score that tells you exactly where you stand.
            </p>
          </div>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {HOW_STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 100} scale>
              <div style={{
                background: `linear-gradient(160deg, ${s.color}14 0%, rgba(255,255,255,0.02) 100%)`,
                border: `1px solid ${s.color}33`,
                borderRadius: 20, padding: 24, height: '100%',
                transition: 'transform 0.25s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6E7290', marginBottom: 12 }}>
                  Step {i + 1}
                </p>
                <span style={{ fontSize: 30, display: 'block', marginBottom: 10 }}>{s.icon}</span>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#F1EEF9', marginBottom: 8 }}>{s.title}</p>
                <p style={{ fontSize: 14, color: '#B4B7D4', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ── Trajectory / differentiator ── */}
      <div style={{ padding: '60px 24px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <Reveal scale>
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,122,198,0.1) 0%, rgba(127,90,240,0.1) 50%, rgba(0,232,198,0.1) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 28, padding: '48px 36px', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #FF7AC6, #7F5AF0, #00E8C6, #FFB830)' }} />
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, letterSpacing: -1, lineHeight: 1.15, marginBottom: 14 }}>
              Don&apos;t just track your habits.
            </h2>
            <p style={{
              fontSize: 'clamp(20px, 3vw, 30px)', fontWeight: 800, letterSpacing: -0.5, marginBottom: 20,
              background: 'linear-gradient(120deg, #FF7AC6, #00E8C6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              See where they&apos;re taking you.
            </p>
            <p style={{ fontSize: 16, color: '#B4B7D4', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.65 }}>
              Your habits become data. Your data becomes a pattern. Your pattern shows you where you&apos;re heading.
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
              {[
                { label: 'Today',    value: 64, h: 64,  color: '#8A8FA3' },
                { label: '30 days',  value: 70, h: 80,  color: '#00E8C6' },
                { label: '6 months', value: 79, h: 100, color: '#7F5AF0' },
                { label: '1 year',   value: 87, h: 120, color: '#FF7AC6' },
              ].map((t) => (
                <div key={t.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: t.color }}>{t.value}</span>
                  <div style={{
                    width: 44, height: t.h, borderRadius: 10,
                    background: t.color === '#8A8FA3' ? 'rgba(255,255,255,0.08)' : t.color,
                    boxShadow: t.color !== '#8A8FA3' ? `0 0 18px ${t.color}55` : 'none',
                  }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#6E7290', textAlign: 'center', lineHeight: 1.3 }}>{t.label}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#6E7290', marginBottom: 28 }}>
              Qyven progression estimate — based on consistency, not guaranteed
            </p>
            {!isLoggedIn && (
              <Link to="/get-started" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg, #FF7AC6, #7F5AF0, #00E8C6)',
                color: '#fff', fontWeight: 700, fontSize: 15,
                padding: '14px 28px', borderRadius: 99, textDecoration: 'none',
                boxShadow: '0 4px 28px rgba(127,90,240,0.4)',
              }}>
                See my trajectory →
              </Link>
            )}
          </div>
        </Reveal>
      </div>

      {/* ── Five pillars ── */}
      <div style={{ padding: '60px 24px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#00E8C6', marginBottom: 12 }}>
              Five pillars
            </p>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, letterSpacing: -1, lineHeight: 1.1 }}>
              Every dimension of your best self.
            </h2>
          </div>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
          {FIVE_PILLARS.map((p, i) => (
            <Reveal key={p.label} delay={i * 70} scale>
              <div style={{
                background: `linear-gradient(160deg, ${p.glow} 0%, rgba(255,255,255,0.02) 100%)`,
                border: `1px solid ${p.color}30`,
                borderRadius: 18, padding: '20px 16px',
                borderTop: `2px solid ${p.color}`,
                transition: 'transform 0.2s', height: '100%',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <span style={{ fontSize: 26, display: 'block', marginBottom: 10 }}>{p.icon}</span>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#F1EEF9', marginBottom: 4 }}>{p.label}</p>
                <p style={{ fontSize: 12, color: '#B4B7D4', lineHeight: 1.5, marginBottom: 8 }}>{p.desc}</p>
                <span style={{ fontSize: 12, fontWeight: 800, color: p.color }}>{p.weight} weight</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ── Trust bar ── */}
      <div style={{ padding: '40px 24px', maxWidth: 700, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <Reveal>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px 32px' }}>
            {[
              { t: 'Free forever', c: '#00E87A' },
              { t: 'No credit card', c: '#4DA6FF' },
              { t: '90-second daily log', c: '#7F5AF0' },
              { t: 'Works on any device', c: '#FFB830' },
              { t: 'No fake health claims', c: '#FF5C8A' },
            ].map(t => (
              <span key={t.t} style={{ fontSize: 13, fontWeight: 600, color: '#B4B7D4', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: t.c }}>✓</span> {t.t}
              </span>
            ))}
          </div>
        </Reveal>
      </div>

      {/* ── Final CTA ── */}
      <div style={{ padding: '60px 24px 100px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <Reveal scale>
          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#00E8C6', marginBottom: 16 }}>
              Ready?
            </p>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 50px)', fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 18 }}>
              What&apos;s your<br />
              <span style={{ background: 'linear-gradient(120deg, #FF7AC6, #7F5AF0, #00E8C6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Future Self Score?
              </span>
            </h2>
            <p style={{ fontSize: 16, color: '#B4B7D4', marginBottom: 32, lineHeight: 1.6 }}>
              Answer 5 questions. Get your personalized score in 60 seconds.
            </p>
            {isLoggedIn ? (
              <Link to="/dashboard" style={{
                display: 'inline-flex', alignItems: 'center',
                background: 'linear-gradient(135deg, #FF7AC6, #7F5AF0, #00E8C6)',
                color: '#fff', fontWeight: 700, fontSize: 17,
                padding: '18px 40px', borderRadius: 99, textDecoration: 'none',
                boxShadow: '0 4px 36px rgba(127,90,240,0.45)',
              }}>
                Go to dashboard →
              </Link>
            ) : (
              <Link to="/get-started" style={{
                display: 'inline-flex', alignItems: 'center',
                background: 'linear-gradient(135deg, #FF7AC6, #7F5AF0, #00E8C6)',
                color: '#fff', fontWeight: 700, fontSize: 17,
                padding: '18px 40px', borderRadius: 99, textDecoration: 'none',
                boxShadow: '0 4px 36px rgba(127,90,240,0.45)',
              }}>
                Find My Score →
              </Link>
            )}
            <p style={{ fontSize: 13, color: '#6E7290', marginTop: 16 }}>
              Free · No credit card · 90 seconds
            </p>
          </div>
        </Reveal>
      </div>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        padding: '24px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, position: 'relative', zIndex: 1,
      }}>
        <span style={{ fontWeight: 800, fontSize: 17 }}>
          Qy<span style={{ background: 'linear-gradient(135deg, #FF7AC6, #00E8C6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ven</span>
        </span>
        <p style={{ fontSize: 13, color: '#6E7290' }}>
          Built for people who take the long view.
        </p>
        {!isLoggedIn && (
          <Link to="/get-started" style={{ fontSize: 13, color: '#00E8C6', textDecoration: 'none', fontWeight: 600 }}>
            Find My Score →
          </Link>
        )}
      </footer>
    </div>
  )
}