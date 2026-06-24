import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useUserStore } from '../store/useUserStore'

const REVIEWS = [
  { text: '"34-day streak and counting — the shield saved me twice"', name: 'Marcus R.', stars: '★★★★★', color: '#7F77DD' },
  { text: '"My sleep score went from 38 to 71 in 3 weeks"', name: 'Jasmine L.', stars: '★★★★★', color: '#2DD4BF' },
  { text: '"Now competing with my friend on streak length lol"', name: 'Daniel K.', stars: '★★★★★', color: '#F87171' },
  { text: '"The data insights actually changed how I schedule my day"', name: 'Shreya P.', stars: '★★★★★', color: '#9E98E8' },
  { text: '"Two minutes a night. I genuinely look forward to it"', name: 'Tom W.', stars: '★★★★★', color: '#2DD4BF' },
  { text: '"First tracker that doesn\'t make me feel guilty on bad days"', name: 'Anika N.', stars: '★★★★★', color: '#7F77DD' },
  { text: '"Hit a personal best of 91 last Tuesday. Still buzzing"', name: 'Ryan M.', stars: '★★★★★', color: '#F87171' },
  { text: '"The XP breakdown after logging is genuinely satisfying"', name: 'Priya S.', stars: '★★★★★', color: '#2DD4BF' },
]

const TARGET_SCORE = 84
const TARGET_PILLARS = [78, 82, 71, 65, 74]
const PILLARS = [
  { icon: '🥗', label: 'Nutrition',  color: '#2DD4BF', desc: 'Fruit, veg, protein tracked in real servings — not calories.' },
  { icon: '🏋️', label: 'Fitness',    color: '#7F77DD', desc: 'Any workout logged — gym, run, yoga, sport, or rest.' },
  { icon: '💤', label: 'Sleep',      color: '#2DD4BF', desc: 'Hours, quality, hydration, and mood in one energy score.' },
  { icon: '🎯', label: 'Focus',      color: '#9E98E8', desc: 'Deep work, reading, and meditation tracked daily.' },
  { icon: '🌿', label: 'Longevity',  color: '#F87171', desc: 'A composite that weighs what actually extends healthy years.' },
]

// Easing function
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

// Animated score ring
function ScoreRing() {
  const [score, setScore] = useState(0)
  const [pillars, setPillars] = useState([0, 0, 0, 0, 0])
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const DURATION = 2200
    let start = null

    function step(ts) {
      if (!start) start = ts
      const t = Math.min((ts - start) / DURATION, 1)
      const e = easeOutCubic(t)
      setScore(Math.round(e * TARGET_SCORE))
      setPillars(TARGET_PILLARS.map(v => Math.round(e * v)))
      if (t < 1) requestAnimationFrame(step)
    }

    setTimeout(() => requestAnimationFrame(step), 500)
  }, [])

  const r = 86
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      {/* Ring */}
      <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Glow */}
        <div style={{
          position: 'absolute', inset: -24, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(127,119,221,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
          <defs>
            <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7F77DD" />
              <stop offset="100%" stopColor="#2DD4BF" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle cx="100" cy="100" r={r} fill="none" stroke="url(#rg)" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.1s linear' }}
          />
        </svg>
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{
            fontFamily: "'Syne', sans-serif", fontSize: 52, fontWeight: 800, lineHeight: 1,
            letterSpacing: -2,
            background: 'linear-gradient(135deg, #9E98E8, #2DD4BF)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>{score}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8B8FA8', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 4 }}>
            Future Self Score
          </div>
        </div>
      </div>

      {/* Pillar bars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, width: '100%', maxWidth: 400 }}>
        {PILLARS.map((p, i) => (
          <div key={p.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 20 }}>{p.icon}</span>
            <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 100,
                background: p.color,
                width: `${pillars[i]}%`,
                transition: 'width 0.1s linear',
              }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#8B8FA8', fontFamily: "'Syne', sans-serif" }}>
              {pillars[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Scroll reveal hook
function useReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.12 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

function RevealSection({ children, delay = 0 }) {
  const [ref, visible] = useReveal()
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(28px)',
      transition: `opacity 0.7s ${delay}ms ease, transform 0.7s ${delay}ms ease`,
    }}>
      {children}
    </div>
  )
}

export default function Landing() {
  const { user, authReady } = useUserStore()
  const isLoggedIn = authReady && !!user

  const ctaLink = isLoggedIn ? '/dashboard' : '/signup'
  const ctaText = isLoggedIn ? 'Go to your dashboard →' : 'Start scoring your days →'

  return (
    <div style={{
      background: '#0D0F1A', color: '#F0F0FF', fontFamily: "'Inter', sans-serif",
      minHeight: '100vh', overflowX: 'hidden',
    }}>
      {/* Google Fonts — Syne */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .land-btn-primary {
          background: #7F77DD;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 16px;
          padding: 16px 32px;
          border-radius: 100px;
          text-decoration: none;
          display: inline-block;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 0 40px rgba(127,119,221,0.35);
        }
        .land-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 60px rgba(127,119,221,0.55);
        }
        .land-btn-ghost {
          color: #8B8FA8;
          font-size: 15px;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s;
        }
        .land-btn-ghost:hover { color: #F0F0FF; }

        .land-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 28px;
          transition: transform 0.3s, border-color 0.3s;
        }
        .land-card:hover {
          transform: translateY(-4px);
          border-color: rgba(127,119,221,0.3);
        }

        .ticker-wrap {
          width: 100%; overflow: hidden;
          background: rgba(127,119,221,0.06);
          border-top: 1px solid rgba(255,255,255,0.06);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 11px 0;
          position: relative;
        }
        .ticker-wrap::before, .ticker-wrap::after {
          content: ''; position: absolute;
          top: 0; bottom: 0; width: 80px; z-index: 2; pointer-events: none;
        }
        .ticker-wrap::before { left: 0; background: linear-gradient(to right, #0D0F1A, transparent); }
        .ticker-wrap::after  { right: 0; background: linear-gradient(to left, #0D0F1A, transparent); }

        .ticker-track {
          display: flex; width: max-content;
          animation: ticker 38s linear infinite;
        }
        .ticker-track:hover { animation-play-state: paused; }
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        .review-chip {
          display: inline-flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 100px;
          padding: 7px 16px 7px 10px;
          margin: 0 7px;
          white-space: nowrap;
          font-size: 13px;
          color: rgba(240,240,255,0.8);
          flex-shrink: 0;
        }
        .chip-avatar {
          width: 26px; height: 26px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0;
        }

        .dot-pulse {
          width: 7px; height: 7px; border-radius: 50%; background: #2DD4BF;
          animation: dotpulse 2s ease infinite;
        }
        @keyframes dotpulse {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.4; transform:scale(0.75); }
        }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          overflow: hidden;
          max-width: 760px;
          margin: 0 auto;
        }
        .stat-cell {
          background: #13162A;
          padding: 28px 20px;
          text-align: center;
        }
        .stat-num {
          font-family: 'Syne', sans-serif;
          font-size: 34px; font-weight: 800; letter-spacing: -1px;
          background: linear-gradient(135deg, #9E98E8, #2DD4BF);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; line-height: 1; margin-bottom: 6px;
        }
        .stat-lbl { font-size: 13px; color: #8B8FA8; font-weight: 500; }

        @media (max-width: 640px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr); }
          .steps-grid { grid-template-columns: 1fr !important; }
          .pillars-section-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .reviews-grid { grid-template-columns: 1fr !important; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 32px',
        background: 'rgba(13,15,26,0.75)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: -0.5 }}>
          Qy<span style={{ color: '#7F77DD' }}>ven</span>
        </span>
        <Link to={ctaLink} className="land-btn-primary" style={{ fontSize: 14, padding: '10px 22px' }}>
          {isLoggedIn ? 'Dashboard →' : 'Get started free'}
        </Link>
      </nav>

      {/* ── Review ticker ── */}
      <div style={{ paddingTop: 65 }}>
        <div className="ticker-wrap">
          <div className="ticker-track">
            {[...REVIEWS, ...REVIEWS].map((r, i) => (
              <div key={i} className="review-chip">
                <div className="chip-avatar" style={{ background: r.color + '33', color: r.color, border: `1px solid ${r.color}55` }}>
                  {r.name.split(' ').map(n => n[0]).join('')}
                </div>
                <span style={{ color: '#FBBF24', fontSize: 11, letterSpacing: 1 }}>{r.stars}</span>
                <span>{r.text}</span>
                <span style={{ color: r.color, fontSize: 12, fontWeight: 600, marginLeft: 4 }}>— {r.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Hero ── */}
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px 60px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background glows */}
        <div style={{
          position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)',
          width: 800, height: 800, pointerEvents: 'none',
          background: 'radial-gradient(ellipse, rgba(127,119,221,0.15) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: -100, right: -100,
          width: 400, height: 400, pointerEvents: 'none',
          background: 'radial-gradient(ellipse, rgba(45,212,191,0.08) 0%, transparent 70%)',
        }} />

        {/* Eyebrow */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(127,119,221,0.1)', border: '1px solid rgba(127,119,221,0.22)',
          borderRadius: 100, padding: '6px 16px',
          fontSize: 12, fontWeight: 600, color: '#9E98E8',
          letterSpacing: '0.06em', textTransform: 'uppercase',
          marginBottom: 28,
          animation: 'fadeUp 0.6s ease both',
        }}>
          <div className="dot-pulse" />
          Daily performance scoring
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(40px, 7vw, 78px)',
          fontWeight: 800, lineHeight: 1.05,
          letterSpacing: -2, marginBottom: 22,
          animation: 'fadeUp 0.7s 0.1s ease both',
        }}>
          Your future self<br />
          has a <span style={{ color: '#7F77DD' }}>score</span>.<br />
          <span style={{ color: '#2DD4BF' }}>Build it daily.</span>
        </h1>

        {/* Sub */}
        <p style={{
          fontSize: 'clamp(16px, 2.5vw, 19px)', color: '#8B8FA8',
          maxWidth: 520, lineHeight: 1.65, marginBottom: 36, fontWeight: 400,
          animation: 'fadeUp 0.7s 0.2s ease both',
        }}>
          Qyven turns your day into a single 0–99 number across fitness, nutrition, sleep, focus, and longevity — so you always know where you stand.
        </p>

        {/* CTAs */}
        <div style={{
          display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center',
          flexWrap: 'wrap', marginBottom: 52,
          animation: 'fadeUp 0.7s 0.3s ease both',
        }}>
          <Link to={ctaLink} className="land-btn-primary">{ctaText}</Link>
          <a href="#how" className="land-btn-ghost">See how it works ↓</a>
        </div>

        {/* Score ring */}
        <div style={{ animation: 'fadeUp 0.8s 0.4s ease both', position: 'relative' }}>
          <ScoreRing />
        </div>

        <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }`}</style>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)', margin: '0 24px' }} />

      {/* ── How it works ── */}
      <section id="how" style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <RevealSection>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9E98E8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>How it works</p>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 14 }}>
            Log once.<br />Understand everything.
          </h2>
          <p style={{ fontSize: 17, color: '#8B8FA8', maxWidth: 480, lineHeight: 1.65 }}>
            A two-minute daily check-in across five areas of your life produces a score that compounds over time.
          </p>
        </RevealSection>

        <RevealSection delay={100}>
          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginTop: 44 }}>
            {[
              { icon: '📋', step: 'Step one',   title: 'Log your day',          desc: 'Quick tap inputs for what you ate, how you moved, how you slept, what you focused on. Takes 90 seconds.' },
              { icon: '🔢', step: 'Step two',   title: 'Get your score',        desc: 'Qyven calculates your Future Self Score in real time — a single 0–99 number that blends all five pillars.' },
              { icon: '📈', step: 'Step three', title: 'Watch yourself improve', desc: 'Streaks, XP, levels, and weekly insights compound your progress. See what actually moves your score.' },
            ].map(s => (
              <div key={s.step} className="land-card">
                <p style={{ fontSize: 11, fontWeight: 700, color: '#7F77DD', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, opacity: 0.7 }}>{s.step}</p>
                <span style={{ fontSize: 30, display: 'block', marginBottom: 12 }}>{s.icon}</span>
                <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, color: '#F0F0FF', marginBottom: 10 }}>{s.title}</p>
                <p style={{ fontSize: 14, color: '#8B8FA8', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </RevealSection>
      </section>

      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)', margin: '0 24px' }} />

      {/* ── Five pillars ── */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <RevealSection>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9E98E8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>The five pillars</p>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 14 }}>
            Every dimension<br />of your best self.
          </h2>
          <p style={{ fontSize: 17, color: '#8B8FA8', maxWidth: 480, lineHeight: 1.65 }}>
            Your score isn't one-dimensional. It reflects the five things that actually compound into a better life.
          </p>
        </RevealSection>

        <RevealSection delay={100}>
          <div className="pillars-section-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginTop: 44 }}>
            {PILLARS.map((p, i) => (
              <div key={p.label} className="land-card" style={{ padding: '22px 18px' }}>
                <span style={{ fontSize: 26, display: 'block', marginBottom: 12 }}>{p.icon}</span>
                <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: '#F0F0FF', marginBottom: 8 }}>{p.label}</p>
                <p style={{ fontSize: 13, color: '#8B8FA8', lineHeight: 1.5, marginBottom: 14 }}>{p.desc}</p>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 100,
                    background: p.color,
                    width: `${TARGET_PILLARS[i]}%`,
                    transition: 'width 1.6s 0.3s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </RevealSection>
      </section>

      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)', margin: '0 24px' }} />

      {/* ── Reviews ── */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <RevealSection>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9E98E8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>What people say</p>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1 }}>
            Built for people who<br />actually follow through.
          </h2>
        </RevealSection>

        <RevealSection delay={100}>
          <div className="reviews-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 44 }}>
            {[
              { q: "I've tried every habit tracker. The streak shield is the first forgiveness mechanic that actually kept me going past week two. I'm on a 34-day streak and I've never hit that before.", name: 'Marcus R.',  meta: '34-day streak · Fitness focus',     c: '#7F77DD' },
              { q: "The score goes up when I do the things I know I should do. That sounds obvious but no other app made it feel that clear. My sleep score was 38 in week one. It's 71 now.",          name: 'Jasmine L.', meta: 'Level 8 · Scholar path',            c: '#2DD4BF' },
              { q: "Showed my public profile score to a friend as a joke. Now he's using it and trying to beat me. The competitive element wasn't something I expected to care about, but here we are.",  name: 'Daniel K.',  meta: 'Personal best: 91 FSS',            c: '#F87171' },
              { q: "The Ask your data insights are what got me. It told me my focus score drops 22 points on days after poor sleep. That's not obvious until you see it in your own numbers.",            name: 'Shreya P.',  meta: '62-day streak · Builder path',     c: '#9E98E8' },
              { q: "I log it every night before bed. Takes maybe two minutes. The XP screen with the breakdown is genuinely satisfying — I look forward to it in a way I didn't expect.",                name: 'Tom W.',     meta: 'Level 12 · 89 perfect days',       c: '#2DD4BF' },
              { q: "Most apps make you feel guilty. Qyven just scores you and moves on. A 51 day isn't a failure — it's data. That reframe alone made me consistent for the first time.",               name: 'Anika N.',   meta: 'Balanced path · 19-day streak',    c: '#7F77DD' },
            ].map((r, i) => (
              <div key={i} className="land-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ color: '#FBBF24', fontSize: 13, letterSpacing: 2, marginBottom: 14 }}>★★★★★</div>
                <p style={{ fontSize: 14, color: 'rgba(240,240,255,0.82)', lineHeight: 1.7, fontStyle: 'italic', flex: 1, marginBottom: 18 }}>
                  "{r.q}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: r.c + '33', border: `1px solid ${r.c}55`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: r.c, flexShrink: 0,
                  }}>
                    {r.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#F0F0FF' }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: '#8B8FA8' }}>{r.meta}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </RevealSection>
      </section>

      {/* ── Stats ── */}
      <div style={{ padding: '0 24px 80px' }}>
        <RevealSection>
          <div className="stat-grid">
            {[
              { n: '0–99', l: 'Daily score range' },
              { n: '5',    l: 'Life pillars tracked' },
              { n: '90s',  l: 'Average log time' },
              { n: 'Free', l: 'Always' },
            ].map(s => (
              <div key={s.l} className="stat-cell">
                <div className="stat-num">{s.n}</div>
                <div className="stat-lbl">{s.l}</div>
              </div>
            ))}
          </div>
        </RevealSection>
      </div>

      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)', margin: '0 24px' }} />

      {/* ── Final CTA ── */}
      <div style={{ padding: '80px 24px 100px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 600, height: 400, pointerEvents: 'none',
          background: 'radial-gradient(ellipse, rgba(127,119,221,0.14) 0%, transparent 70%)',
        }} />
        <RevealSection>
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 580, margin: '0 auto' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9E98E8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 18 }}>Ready?</p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 20 }}>
              What's your<br /><span style={{ color: '#7F77DD' }}>Future Self Score</span>?
            </h2>
            <p style={{ fontSize: 17, color: '#8B8FA8', marginBottom: 36, lineHeight: 1.6 }}>
              Log your first day in under two minutes. Your score is waiting.
            </p>
            <Link to={ctaLink} className="land-btn-primary" style={{ fontSize: 17, padding: '18px 40px' }}>
              {ctaText}
            </Link>
            <p style={{ fontSize: 13, color: '#8B8FA8', marginTop: 16, opacity: 0.7 }}>
              No credit card. No app store. Works on any device.
            </p>
          </div>
        </RevealSection>
      </div>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        padding: '24px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18 }}>
          Qy<span style={{ color: '#7F77DD' }}>ven</span>
        </span>
        <p style={{ fontSize: 13, color: '#8B8FA8' }}>© 2026 Qyven. Built for people who take the long view.</p>
        <Link to={ctaLink} style={{ fontSize: 13, color: '#9E98E8', textDecoration: 'none', fontWeight: 600 }}>
          {isLoggedIn ? 'Dashboard →' : 'Get started →'}
        </Link>
      </footer>
    </div>
  )
}