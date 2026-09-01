import { Link } from 'react-router-dom'
import { useEffect, useId, useRef, useState } from 'react'
import { useUserStore } from '../store/useUserStore'

// ─────────────────────────────────────────────────────────────────────────────
// Scroll reveal
// ─────────────────────────────────────────────────────────────────────────────

function useReveal(threshold = 0.12) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [threshold])

  return [ref, visible]
}

function Reveal({ children, className = '', delay = 0 }) {
  const [ref, visible] = useReveal()

  return (
    <div
      ref={ref}
      className={`qy-reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ '--delay': `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Score ring
// ─────────────────────────────────────────────────────────────────────────────

function ScoreRing({ score = 67, size = 150 }) {
  const gradientId = useId().replace(/:/g, '')
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    let frame
    const start = performance.now()
    const duration = 1100

    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      setDisplayScore(Math.round(score * eased))

      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      }
    }

    frame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(frame)
  }, [score])

  const radius = 44
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div
      className="qy-score-ring"
      style={{
        width: size,
        height: size,
        '--score-size': `${size}px`,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="qy-score-svg"
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#9a82f4" />
            <stop offset="100%" stopColor="#7658dc" />
          </linearGradient>
        </defs>

        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="rgba(20, 17, 30, 0.09)"
          strokeWidth="7"
        />

        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        />
      </svg>

      <div className="qy-score-center">
        <strong>{displayScore}</strong>
        <span>FSS</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Metric bar
// ─────────────────────────────────────────────────────────────────────────────

function MetricBar({ label, value, accent = 'purple' }) {
  return (
    <div className="qy-metric">
      <div className="qy-metric-top">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <div className="qy-metric-track">
        <div
          className={`qy-metric-fill ${accent}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Product preview
// ─────────────────────────────────────────────────────────────────────────────

function ProductPreview() {
  return (
    <div className="qy-product-shell">
      <div className="qy-product-window">
        <div className="qy-window-top">
          <div className="qy-window-dots">
            <span />
            <span />
            <span />
          </div>

          <div className="qy-window-title">
            qyven.app
          </div>

          <div className="qy-window-profile">
            B
          </div>
        </div>

        <div className="qy-product-body">
          <aside className="qy-product-sidebar">
            <div className="qy-product-logo">
              <span className="qy-logo-mark">Q</span>
              <span>qyven</span>
            </div>

            <div className="qy-side-links">
              <div className="qy-side-link active">
                <span>◷</span>
                Today
              </div>

              <div className="qy-side-link">
                <span>＋</span>
                Log
              </div>

              <div className="qy-side-link">
                <span>↗</span>
                Progress
              </div>

              <div className="qy-side-link">
                <span>○</span>
                You
              </div>
            </div>

            <div className="qy-sidebar-bottom">
              <div className="qy-level-mini">
                <span>Level 7</span>
                <small>1,240 XP</small>
              </div>

              <div className="qy-xp-track">
                <div />
              </div>
            </div>
          </aside>

          <main className="qy-product-main">
            <div className="qy-product-heading">
              <div>
                <span className="qy-eyebrow-small">
                  Tuesday, September 1
                </span>

                <h3>Good morning.</h3>
              </div>

              <div className="qy-streak">
                <span>🔥</span>
                12 day streak
              </div>
            </div>

            <div className="qy-dashboard-grid">
              <div className="qy-score-card">
                <div className="qy-score-card-top">
                  <div>
                    <span className="qy-card-label">
                      Future Self Score
                    </span>

                    <p>
                      How your habits are adding up.
                    </p>
                  </div>

                  <span className="qy-score-change">
                    +4
                  </span>
                </div>

                <div className="qy-score-main">
                  <ScoreRing score={67} size={142} />

                  <div className="qy-score-copy">
                    <strong>
                      You're building momentum.
                    </strong>

                    <span>
                      Keep today's habits consistent to keep
                      moving forward.
                    </span>
                  </div>
                </div>
              </div>

              <div className="qy-today-card">
                <div className="qy-card-header">
                  <span className="qy-card-label">
                    Today's habits
                  </span>

                  <span className="qy-complete">
                    3 / 5
                  </span>
                </div>

                <div className="qy-habit-list">
                  <div className="qy-habit complete">
                    <span className="qy-habit-check">
                      ✓
                    </span>

                    <div>
                      <strong>Eat well</strong>
                      <small>Nutrition</small>
                    </div>

                    <span className="qy-habit-xp">
                      +20
                    </span>
                  </div>

                  <div className="qy-habit complete">
                    <span className="qy-habit-check">
                      ✓
                    </span>

                    <div>
                      <strong>Move your body</strong>
                      <small>Fitness</small>
                    </div>

                    <span className="qy-habit-xp">
                      +20
                    </span>
                  </div>

                  <div className="qy-habit complete">
                    <span className="qy-habit-check">
                      ✓
                    </span>

                    <div>
                      <strong>Drink water</strong>
                      <small>Hydration</small>
                    </div>

                    <span className="qy-habit-xp">
                      +15
                    </span>
                  </div>

                  <div className="qy-habit">
                    <span className="qy-habit-circle" />

                    <div>
                      <strong>Focus</strong>
                      <small>Habits</small>
                    </div>

                    <span className="qy-habit-arrow">
                      →
                    </span>
                  </div>

                  <div className="qy-habit">
                    <span className="qy-habit-circle" />

                    <div>
                      <strong>Sleep well</strong>
                      <small>Recovery</small>
                    </div>

                    <span className="qy-habit-arrow">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="qy-pillars-card">
              <div className="qy-card-header">
                <div>
                  <span className="qy-card-label">
                    Your pillars
                  </span>

                  <p>
                    Where you're strongest today.
                  </p>
                </div>

                <span className="qy-view-all">
                  View progress →
                </span>
              </div>

              <div className="qy-pillar-grid">
                <MetricBar
                  label="Nutrition"
                  value={82}
                  accent="green"
                />

                <MetricBar
                  label="Fitness"
                  value={74}
                  accent="purple"
                />

                <MetricBar
                  label="Sleep"
                  value={68}
                  accent="blue"
                />

                <MetricBar
                  label="Focus"
                  value={61}
                  accent="yellow"
                />

                <MetricBar
                  label="Longevity"
                  value={77}
                  accent="pink"
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Check-in demo
// ─────────────────────────────────────────────────────────────────────────────

function CheckInDemo() {
  const [selected, setSelected] = useState('Good')

  const options = [
    { label: 'Great', icon: '✦' },
    { label: 'Good', icon: '◒' },
    { label: 'Okay', icon: '○' },
    { label: 'Rough', icon: '⌁' },
  ]

  return (
    <div className="qy-checkin-card">
      <div className="qy-checkin-top">
        <span className="qy-demo-label">
          DAILY CHECK-IN
        </span>

        <span className="qy-demo-time">
          ~30 sec
        </span>
      </div>

      <h3>How are you feeling today?</h3>

      <p>
        Quickly log your day. Qyven handles the rest.
      </p>

      <div className="qy-checkin-options">
        {options.map((option) => (
          <button
            key={option.label}
            type="button"
            className={
              selected === option.label
                ? 'selected'
                : ''
            }
            onClick={() => setSelected(option.label)}
          >
            <span>{option.icon}</span>
            {option.label}
          </button>
        ))}
      </div>

      <div className="qy-checkin-footer">
        <span>Energy</span>

        <div className="qy-energy-dots">
          <i />
          <i />
          <i className="active" />
          <i />
          <i />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Trajectory graph
// ─────────────────────────────────────────────────────────────────────────────

function TrajectoryGraph() {
  return (
    <div className="qy-trajectory-card">
      <div className="qy-trajectory-header">
        <div>
          <span className="qy-card-label">
            Future trajectory
          </span>

          <p>
            Small habits compound.
          </p>
        </div>

        <span className="qy-trajectory-badge">
          +18 projected
        </span>
      </div>

      <div className="qy-graph">
        <div className="qy-graph-y">
          <span>90</span>
          <span>70</span>
          <span>50</span>
          <span>30</span>
        </div>

        <div className="qy-graph-area">
          <div className="qy-grid-line one" />
          <div className="qy-grid-line two" />
          <div className="qy-grid-line three" />
          <div className="qy-grid-line four" />

          <svg
            viewBox="0 0 700 250"
            preserveAspectRatio="none"
            className="qy-trajectory-svg"
          >
            <defs>
              <linearGradient
                id="trajectoryLine"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop
                  offset="0%"
                  stopColor="#9a82f4"
                />

                <stop
                  offset="100%"
                  stopColor="#7658dc"
                />
              </linearGradient>

              <linearGradient
                id="trajectoryFill"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  stopColor="#8f73f4"
                  stopOpacity="0.18"
                />

                <stop
                  offset="100%"
                  stopColor="#8f73f4"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            <path
              d="M0 195 C70 187, 100 185, 150 175 C210 163, 225 178, 285 151 C350 122, 350 135, 405 111 C470 83, 490 96, 540 69 C600 37, 625 49, 700 20 L700 250 L0 250 Z"
              fill="url(#trajectoryFill)"
            />

            <path
              d="M0 195 C70 187, 100 185, 150 175 C210 163, 225 178, 285 151 C350 122, 350 135, 405 111 C470 83, 490 96, 540 69 C600 37, 625 49, 700 20"
              fill="none"
              stroke="url(#trajectoryLine)"
              strokeWidth="4"
              strokeLinecap="round"
            />

            <circle
              cx="0"
              cy="195"
              r="5"
              fill="#8f73f4"
            />

            <circle
              cx="700"
              cy="20"
              r="6"
              fill="#7658dc"
            />
          </svg>

          <div className="qy-graph-label now">
            Now
          </div>

          <div className="qy-graph-label six">
            6 months
          </div>

          <div className="qy-graph-label year">
            1 year
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Landing
// ─────────────────────────────────────────────────────────────────────────────

export default function Landing() {
  const { user, authReady } = useUserStore()
  const isLoggedIn = authReady && !!user

  const ctaPath = isLoggedIn
    ? '/dashboard'
    : '/get-started'

  return (
    <div className="qy-page">
      <div className="qy-noise" />

      {/* Navigation */}

      <header className="qy-nav">
        <Link to="/" className="qy-brand">
          <span className="qy-brand-mark">
            Q
          </span>

          <span>qyven</span>
        </Link>

        <nav className="qy-nav-links">
          <a href="#how-it-works">
            How it works
          </a>

          <a href="#pillars">
            Pillars
          </a>

          <a href="#trajectory">
            Your future
          </a>
        </nav>

        <div className="qy-nav-actions">
          <Link
            to="/login"
            className="qy-login"
          >
            Log in
          </Link>

          <Link
            to={ctaPath}
            className="qy-primary-small"
          >
            Get started
            <span>↗</span>
          </Link>
        </div>
      </header>

      <main>

        {/* Hero */}

        <section className="qy-hero">
          <div className="qy-hero-glow one" />
          <div className="qy-hero-glow two" />

          <Reveal className="qy-hero-content">
            <div className="qy-hero-pill">
              <span className="qy-live-dot" />
              Your habits. Your future.
            </div>

            <h1>
              See where your
              <br />
              <span>habits are taking you.</span>
            </h1>

            <p className="qy-hero-sub">
              Qyven turns the things you do every day
              into a clear picture of the person
              you're becoming.
            </p>

            <div className="qy-hero-actions">
              <Link
                to={ctaPath}
                className="qy-primary-button"
              >
                Start building your future
                <span>↗</span>
              </Link>

              <a
                href="#how-it-works"
                className="qy-secondary-button"
              >
                See how it works
                <span>↓</span>
              </a>
            </div>

            <div className="qy-hero-note">
              <span>✦</span>
              Built around consistency, not perfection.
            </div>
          </Reveal>

          <Reveal
            className="qy-hero-product"
            delay={120}
          >
            <ProductPreview />
          </Reveal>
        </section>

        {/* Statement */}

        <section className="qy-statement">
          <Reveal>
            <span className="qy-section-kicker">
              THE IDEA
            </span>

            <h2>
              Your future isn't decided
              <br />
              <em>one day.</em>
            </h2>

            <p>
              It's built through thousands of small
              decisions. Qyven helps you see those
              decisions clearly — and understand where
              they're taking you.
            </p>
          </Reveal>
        </section>

        {/* How it works */}

        <section
          id="how-it-works"
          className="qy-how"
        >
          <div className="qy-container">
            <Reveal className="qy-section-heading">
              <div>
                <span className="qy-section-kicker">
                  HOW IT WORKS
                </span>

                <h2>
                  Simple enough
                  <br />
                  to actually use.
                </h2>
              </div>

              <p>
                No complicated spreadsheets. No endless
                data entry. Just a simple loop that helps
                you understand yourself better.
              </p>
            </Reveal>

            <div className="qy-feature-grid">
              <Reveal
                className="qy-feature-card large"
                delay={80}
              >
                <div className="qy-feature-number">
                  01
                </div>

                <div className="qy-feature-copy">
                  <span>LOG</span>

                  <h3>
                    Tell Qyven what you did.
                  </h3>

                  <p>
                    Meals. Movement. Sleep. Focus.
                    The habits that actually shape
                    your day.
                  </p>
                </div>

                <div className="qy-feature-visual">
                  <CheckInDemo />
                </div>
              </Reveal>

              <Reveal
                className="qy-feature-card"
                delay={160}
              >
                <div className="qy-feature-number">
                  02
                </div>

                <div className="qy-feature-copy">
                  <span>UNDERSTAND</span>

                  <h3>
                    See what it means.
                  </h3>

                  <p>
                    Qyven turns your daily actions into
                    one clear picture: your Future Self
                    Score.
                  </p>
                </div>

                <div className="qy-mini-score">
                  <ScoreRing
                    score={74}
                    size={125}
                  />

                  <div>
                    <strong>74</strong>
                    <span>
                      Future Self Score
                    </span>
                  </div>
                </div>
              </Reveal>

              <Reveal
                className="qy-feature-card"
                delay={240}
              >
                <div className="qy-feature-number">
                  03
                </div>

                <div className="qy-feature-copy">
                  <span>IMPROVE</span>

                  <h3>
                    Keep moving forward.
                  </h3>

                  <p>
                    Watch your habits compound and make
                    tomorrow slightly better than today.
                  </p>
                </div>

                <div className="qy-mini-progress">
                  <div className="qy-mini-progress-top">
                    <span>
                      30 day consistency
                    </span>

                    <strong>
                      82%
                    </strong>
                  </div>

                  <div className="qy-mini-progress-track">
                    <div />
                  </div>

                  <div className="qy-mini-days">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>

                  <div className="qy-mini-day-dots">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Score */}

        <section className="qy-dark-section">
          <div className="qy-dark-glow" />

          <div className="qy-container">
            <Reveal className="qy-dark-heading">
              <span className="qy-section-kicker light">
                THE SCORE
              </span>

              <h2>
                One number.
                <br />
                <span>A clearer picture.</span>
              </h2>

              <p>
                Your Future Self Score brings your habits
                together into something you can actually
                understand.
              </p>
            </Reveal>

            <Reveal
              className="qy-score-showcase"
              delay={120}
            >
              <div className="qy-score-showcase-main">
                <ScoreRing
                  score={67}
                  size={220}
                />

                <div className="qy-showcase-score-copy">
                  <span>
                    YOUR FUTURE SELF SCORE
                  </span>

                  <strong>67</strong>

                  <p>
                    You're heading in the right
                    direction. Keep building
                    consistency.
                  </p>

                  <div className="qy-score-trend">
                    <span>↗</span>
                    +8 this month
                  </div>
                </div>
              </div>

              <div className="qy-score-breakdown">
                <div className="qy-breakdown-header">
                  <span>
                    Today's breakdown
                  </span>

                  <span>
                    Sept 1
                  </span>
                </div>

                <MetricBar
                  label="Nutrition"
                  value={82}
                  accent="green"
                />

                <MetricBar
                  label="Fitness"
                  value={74}
                  accent="purple"
                />

                <MetricBar
                  label="Sleep"
                  value={68}
                  accent="blue"
                />

                <MetricBar
                  label="Hydration"
                  value={72}
                  accent="yellow"
                />

                <MetricBar
                  label="Habits"
                  value={61}
                  accent="pink"
                />
              </div>
            </Reveal>
          </div>
        </section>

        {/* Trajectory */}

        <section
          id="trajectory"
          className="qy-trajectory-section"
        >
          <div className="qy-container">
            <Reveal className="qy-section-heading trajectory-heading">
              <div>
                <span className="qy-section-kicker">
                  THE LONG GAME
                </span>

                <h2>
                  Small actions.
                  <br />
                  <em>Big trajectory.</em>
                </h2>
              </div>

              <p>
                Qyven isn't about becoming a different
                person overnight. It's about seeing what
                happens when you stay consistent.
              </p>
            </Reveal>

            <Reveal delay={100}>
              <TrajectoryGraph />
            </Reveal>
          </div>
        </section>

        {/* Pillars */}

        <section
          id="pillars"
          className="qy-pillars-section"
        >
          <div className="qy-container">
            <Reveal className="qy-pillars-intro">
              <span className="qy-section-kicker">
                YOUR FOUNDATION
              </span>

              <h2>
                Everything that
                <br />
                <em>moves you forward.</em>
              </h2>

              <p>
                Qyven looks beyond a single habit. It
                brings the major pieces of your day
                together so you can see the whole picture.
              </p>
            </Reveal>

            <div className="qy-pillar-list">
              {[
                [
                  '01',
                  'Nutrition',
                  'Fuel your body with food that supports you.',
                  'green',
                ],
                [
                  '02',
                  'Fitness',
                  'Build strength, movement and capacity.',
                  'purple',
                ],
                [
                  '03',
                  'Sleep',
                  'Recover so tomorrow starts stronger.',
                  'blue',
                ],
                [
                  '04',
                  'Focus',
                  'Protect your attention and do meaningful work.',
                  'yellow',
                ],
                [
                  '05',
                  'Longevity',
                  'Make choices your future self will thank you for.',
                  'pink',
                ],
              ].map(
                ([number, name, description, color], index) => (
                  <Reveal
                    key={name}
                    className="qy-pillar-row"
                    delay={index * 45}
                  >
                    <span className="qy-pillar-index">
                      {number}
                    </span>

                    <div className="qy-pillar-name">
                      <span
                        className={`qy-pillar-dot ${color}`}
                      />

                      {name}
                    </div>

                    <p>{description}</p>

                    <span className="qy-pillar-arrow">
                      ↗
                    </span>
                  </Reveal>
                )
              )}
            </div>
          </div>
        </section>

        {/* Final CTA */}

        <section className="qy-final-cta">
          <div className="qy-final-glow" />

          <Reveal>
            <span className="qy-section-kicker light">
              START TODAY
            </span>

            <h2>
              Who are you becoming
              <br />
              <span>
                if you keep living like this?
              </span>
            </h2>

            <p>
              Start tracking today. See where it takes you.
            </p>

            <Link
              to={ctaPath}
              className="qy-final-button"
            >
              Start building your future
              <span>↗</span>
            </Link>
          </Reveal>
        </section>
      </main>

      {/* Footer */}

      <footer className="qy-footer">
        <div className="qy-footer-inner">
          <Link
            to="/"
            className="qy-brand footer-brand"
          >
            <span className="qy-brand-mark">
              Q
            </span>

            <span>qyven</span>
          </Link>

          <p>
            Track what you do today.
            <br />
            See where it takes you.
          </p>

          <div className="qy-footer-links">
            <Link to="/login">
              Log in
            </Link>

            <Link to={ctaPath}>
              Get started
            </Link>
          </div>

          <span className="qy-copyright">
            © {new Date().getFullYear()} Qyven
          </span>
        </div>
      </footer>

      {/* Styles */}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');

        :root {
          --qy-bg: #f8f8f6;
          --qy-white: #ffffff;
          --qy-ink: #111014;
          --qy-heading: #17151b;
          --qy-text: #625f68;
          --qy-muted: #89858e;
          --qy-faint: #aaa6ad;

          --qy-border: rgba(17, 16, 20, 0.09);

          --qy-purple: #8064e8;
          --qy-purple-dark: #684dce;
          --qy-purple-soft: #efebff;

          --qy-dark: #111014;
          --qy-dark-card: #19181e;
        }

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        .qy-page {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background: var(--qy-bg);
          color: var(--qy-text);
          font-family:
            'DM Sans',
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .qy-page a {
          color: inherit;
          text-decoration: none;
        }

        .qy-page button {
          font: inherit;
        }

        .qy-noise {
          position: fixed;
          inset: 0;
          z-index: 100;
          pointer-events: none;
          opacity: 0.018;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E");
        }

        .qy-container {
          width: min(1180px, calc(100% - 48px));
          margin: 0 auto;
        }

        /* NAV */

        .qy-nav {
          position: relative;
          z-index: 20;
          width: min(1240px, calc(100% - 48px));
          height: 82px;
          margin: 0 auto;

          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .qy-brand {
          display: inline-flex;
          align-items: center;
          gap: 9px;

          color: var(--qy-heading);

          font-family: 'Manrope', sans-serif;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .qy-brand-mark {
          width: 30px;
          height: 30px;

          display: grid;
          place-items: center;

          border-radius: 9px;

          background: var(--qy-heading);
          color: white;

          font-size: 14px;
          font-weight: 800;

          box-shadow:
            0 5px 16px rgba(17, 16, 20, 0.12);
        }

        .qy-nav-links {
          display: flex;
          align-items: center;
          gap: 34px;
          margin-left: 100px;
        }

        .qy-nav-links a {
          color: #6c6871;
          font-size: 13px;
          font-weight: 600;
          transition: color 180ms ease;
        }

        .qy-nav-links a:hover {
          color: var(--qy-heading);
        }

        .qy-nav-actions {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .qy-login {
          color: #5d5962 !important;
          font-size: 13px;
          font-weight: 700;
        }

        /*
         * ALL PRIMARY BUTTONS USE THE SAME PURPLE TREATMENT.
         */

        .qy-primary-small {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;

          min-height: 40px;
          padding: 0 15px;

          border-radius: 999px;

          background: var(--qy-purple);
          color: white !important;

          font-size: 12px;
          font-weight: 800;

          box-shadow:
            0 8px 22px rgba(128, 100, 232, 0.20);

          transition:
            transform 180ms ease,
            background 180ms ease,
            box-shadow 180ms ease;
        }

        .qy-primary-small span {
          color: white;
        }

        .qy-primary-small:hover {
          background: var(--qy-purple-dark);
          transform: translateY(-2px);
          box-shadow:
            0 12px 28px rgba(128, 100, 232, 0.26);
        }

        /* REVEAL */

        .qy-reveal {
          opacity: 0;
          transform: translateY(28px);

          transition:
            opacity 800ms cubic-bezier(.22, 1, .36, 1),
            transform 800ms cubic-bezier(.22, 1, .36, 1);

          transition-delay: var(--delay, 0ms);
        }

        .qy-reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* HERO */

        .qy-hero {
          position: relative;
          padding: 88px 0 115px;
          text-align: center;
        }

        .qy-hero-glow {
          position: absolute;
          pointer-events: none;
          border-radius: 999px;
          filter: blur(70px);
        }

        .qy-hero-glow.one {
          width: 450px;
          height: 450px;
          top: 20px;
          left: -220px;
          background: rgba(163, 140, 255, 0.13);
        }

        .qy-hero-glow.two {
          width: 500px;
          height: 500px;
          top: 160px;
          right: -270px;
          background: rgba(205, 194, 255, 0.18);
        }

        .qy-hero-content {
          position: relative;
          z-index: 2;
          width: min(850px, calc(100% - 40px));
          margin: 0 auto;
        }

        .qy-hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 9px;

          padding: 8px 13px;

          border: 1px solid rgba(128, 100, 232, 0.16);
          border-radius: 999px;

          background: rgba(255, 255, 255, 0.78);
          color: #7060a5;

          font-size: 11px;
          font-weight: 800;

          box-shadow:
            0 5px 20px rgba(30, 20, 60, 0.04);
        }

        .qy-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--qy-purple);
          box-shadow:
            0 0 0 4px rgba(128, 100, 232, 0.10);
        }

        .qy-hero h1 {
          margin: 26px 0 24px;

          color: var(--qy-heading);

          font-family: 'Manrope', sans-serif;
          font-size: clamp(58px, 7.3vw, 102px);
          line-height: 0.96;
          letter-spacing: -0.065em;
          font-weight: 700;
        }

        .qy-hero h1 span {
          color: var(--qy-purple-dark);
        }

        .qy-hero-sub {
          width: min(590px, 100%);
          margin: 0 auto;

          color: #69656e;

          font-size: 17px;
          line-height: 1.65;
        }

        .qy-hero-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 11px;
          margin-top: 34px;
        }

        /*
         * PRIMARY = PURPLE
         * SECONDARY = WHITE
         */

        .qy-primary-button,
        .qy-secondary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 13px;

          min-height: 51px;
          padding: 0 21px;

          border-radius: 999px;

          font-size: 13px;
          font-weight: 800;

          transition:
            transform 180ms ease,
            box-shadow 180ms ease,
            background 180ms ease;
        }

        .qy-primary-button {
          background: var(--qy-purple);
          color: white !important;

          box-shadow:
            0 12px 30px rgba(128, 100, 232, 0.22);
        }

        .qy-primary-button span {
          color: white;
          font-size: 16px;
        }

        .qy-primary-button:hover {
          background: var(--qy-purple-dark);
          transform: translateY(-2px);

          box-shadow:
            0 16px 36px rgba(128, 100, 232, 0.28);
        }

        .qy-secondary-button {
          background: white;
          color: var(--qy-heading) !important;

          border: 1px solid rgba(17, 16, 20, 0.10);

          box-shadow:
            0 6px 20px rgba(17, 16, 20, 0.04);
        }

        .qy-secondary-button span {
          color: #77727d;
        }

        .qy-secondary-button:hover {
          background: #fafafa;
          transform: translateY(-2px);
          box-shadow:
            0 10px 25px rgba(17, 16, 20, 0.07);
        }

        .qy-hero-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;

          margin-top: 19px;

          color: #8d8991;

          font-size: 11px;
          font-weight: 500;
        }

        .qy-hero-note span {
          color: var(--qy-purple);
        }

        .qy-hero-product {
          position: relative;
          z-index: 2;

          width: min(1100px, calc(100% - 32px));
          margin: 76px auto 0;
        }

        /* PRODUCT */

        .qy-product-shell {
          position: relative;
          padding: 10px;

          border-radius: 25px;

          background: rgba(255, 255, 255, 0.76);

          border: 1px solid rgba(17, 16, 20, 0.10);

          box-shadow:
            0 45px 90px rgba(30, 22, 50, 0.11),
            0 10px 35px rgba(30, 22, 50, 0.06);
        }

        .qy-product-window {
          overflow: hidden;

          border-radius: 18px;

          background: #fbfbfc;

          border: 1px solid rgba(17, 16, 20, 0.07);

          text-align: left;
        }

        .qy-window-top {
          height: 44px;

          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;

          padding: 0 15px;

          border-bottom: 1px solid rgba(17, 16, 20, 0.07);

          background: #f7f7f8;
        }

        .qy-window-dots {
          display: flex;
          gap: 5px;
        }

        .qy-window-dots span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #d2d0d5;
        }

        .qy-window-title {
          color: #817d86;
          font-size: 9px;
          font-weight: 700;
        }

        .qy-window-profile {
          justify-self: end;

          width: 22px;
          height: 22px;

          display: grid;
          place-items: center;

          border-radius: 7px;

          background: #ebe8fa;
          color: #6653a3;

          font-size: 9px;
          font-weight: 800;
        }

        .qy-product-body {
          display: grid;
          grid-template-columns: 172px 1fr;
          min-height: 490px;
        }

        .qy-product-sidebar {
          display: flex;
          flex-direction: column;

          padding: 23px 14px 17px;

          background: #f4f4f5;

          border-right: 1px solid rgba(17, 16, 20, 0.07);
        }

        .qy-product-logo {
          display: flex;
          align-items: center;
          gap: 7px;

          padding: 0 7px;

          color: #28252d;

          font-family: 'Manrope', sans-serif;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .qy-logo-mark {
          width: 21px;
          height: 21px;

          display: grid;
          place-items: center;

          border-radius: 6px;

          background: #151419;
          color: white;

          font-size: 9px;
        }

        .qy-side-links {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 38px;
        }

        .qy-side-link {
          display: flex;
          align-items: center;
          gap: 9px;

          padding: 9px;

          border-radius: 8px;

          color: #77737d;

          font-size: 9px;
          font-weight: 700;
        }

        .qy-side-link span {
          width: 13px;
          color: #817d86;
          text-align: center;
          font-size: 11px;
        }

        .qy-side-link.active {
          background: #eae6fa;
          color: #5f4a9d;
        }

        .qy-side-link.active span {
          color: #6d55b3;
        }

        .qy-sidebar-bottom {
          margin-top: auto;
          padding: 12px 8px 0;
        }

        .qy-level-mini {
          display: flex;
          align-items: center;
          justify-content: space-between;

          color: #68646d;

          font-size: 8px;
          font-weight: 800;
        }

        .qy-level-mini small {
          color: #918d95;
          font-size: 7px;
          font-weight: 700;
        }

        .qy-xp-track {
          height: 4px;
          margin-top: 7px;

          overflow: hidden;

          border-radius: 10px;
          background: #dedde1;
        }

        .qy-xp-track div {
          width: 68%;
          height: 100%;

          border-radius: inherit;

          background: var(--qy-purple);
        }

        .qy-product-main {
          min-width: 0;
          padding: 27px 28px;
        }

        .qy-product-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .qy-eyebrow-small {
          color: #85818a;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .qy-product-heading h3 {
          margin: 5px 0 0;

          color: #242128;

          font-family: 'Manrope', sans-serif;
          font-size: 21px;
          letter-spacing: -0.04em;
        }

        .qy-streak {
          display: inline-flex;
          align-items: center;
          gap: 6px;

          padding: 7px 9px;

          border: 1px solid rgba(17, 16, 20, 0.07);
          border-radius: 8px;

          background: white;
          color: #68646d;

          font-size: 8px;
          font-weight: 800;
        }

        .qy-dashboard-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 12px;
          margin-top: 23px;
        }

        .qy-score-card,
        .qy-today-card,
        .qy-pillars-card {
          border: 1px solid rgba(17, 16, 20, 0.07);
          border-radius: 13px;

          background: white;

          box-shadow:
            0 8px 24px rgba(17, 16, 20, 0.025);
        }

        .qy-score-card {
          padding: 16px;
        }

        .qy-score-card-top,
        .qy-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .qy-card-label {
          color: #2d2931;
          font-size: 9px;
          font-weight: 800;
        }

        .qy-score-card-top p,
        .qy-card-header p {
          margin: 4px 0 0;
          color: #8c8891;
          font-size: 7px;
          font-weight: 500;
        }

        .qy-score-change {
          padding: 4px 6px;

          border-radius: 5px;

          background: #eeeaff;
          color: #674fb5;

          font-size: 8px;
          font-weight: 800;
        }

        .qy-score-main {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 19px;

          min-height: 205px;
        }

        .qy-score-ring {
          position: relative;
          flex: 0 0 auto;
        }

        .qy-score-svg {
          display: block;
        }

        .qy-score-center {
          position: absolute;
          inset: 0;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          pointer-events: none;
        }

        .qy-score-center strong {
          color: #211e25;

          font-family: 'Manrope', sans-serif;
          font-size: calc(var(--score-size) * 0.24);
          line-height: 1;
          letter-spacing: -0.06em;
        }

        .qy-score-center span {
          margin-top: 5px;

          color: #817c87;

          font-size: calc(var(--score-size) * 0.075);
          font-weight: 800;
          letter-spacing: 0.06em;
        }

        .qy-score-copy {
          display: flex;
          flex-direction: column;
          max-width: 130px;
        }

        .qy-score-copy strong {
          color: #29262d;
          font-family: 'Manrope', sans-serif;
          font-size: 10px;
          line-height: 1.35;
        }

        .qy-score-copy span {
          margin-top: 7px;
          color: #77737c;
          font-size: 8px;
          line-height: 1.5;
        }

        .qy-today-card {
          padding: 16px;
        }

        .qy-complete {
          color: #77737d;
          font-size: 8px;
          font-weight: 800;
        }

        .qy-habit-list {
          display: flex;
          flex-direction: column;
          gap: 3px;
          margin-top: 13px;
        }

        .qy-habit {
          display: grid;
          grid-template-columns: 17px 1fr auto;
          align-items: center;
          gap: 7px;

          padding: 7px 5px;

          border-radius: 7px;
        }

        .qy-habit.complete {
          background: #fafafa;
        }

        .qy-habit-check,
        .qy-habit-circle {
          width: 15px;
          height: 15px;

          display: grid;
          place-items: center;

          border-radius: 50%;
        }

        .qy-habit-check {
          background: #eeeafd;
          color: #6951b9;
          font-size: 8px;
          font-weight: 900;
        }

        .qy-habit-circle {
          border: 1px solid #ccc9cf;
        }

        .qy-habit strong {
          display: block;
          color: #37333b;
          font-size: 8px;
          font-weight: 800;
        }

        .qy-habit small {
          display: block;
          margin-top: 2px;
          color: #96919a;
          font-size: 6px;
          font-weight: 600;
        }

        .qy-habit-xp {
          color: #716b81;
          font-size: 7px;
          font-weight: 800;
        }

        .qy-habit-arrow {
          color: #817c85;
          font-size: 9px;
        }

        .qy-pillars-card {
          margin-top: 12px;
          padding: 16px;
        }

        .qy-view-all {
          color: #716c76;
          font-size: 7px;
          font-weight: 800;
        }

        .qy-pillar-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 15px;
          margin-top: 16px;
        }

        .qy-metric-top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .qy-metric-top span {
          color: #747079;
          font-size: 7px;
          font-weight: 700;
        }

        .qy-metric-top strong {
          color: #48434d;
          font-size: 7px;
          font-weight: 800;
        }

        .qy-metric-track {
          height: 4px;
          overflow: hidden;
          border-radius: 10px;
          background: #e9e8eb;
        }

        .qy-metric-fill {
          height: 100%;
          border-radius: inherit;
        }

        .qy-metric-fill.green,
        .qy-pillar-dot.green {
          background: #5fb486;
        }

        .qy-metric-fill.purple,
        .qy-pillar-dot.purple {
          background: #8467e4;
        }

        .qy-metric-fill.blue,
        .qy-pillar-dot.blue {
          background: #6895df;
        }

        .qy-metric-fill.yellow,
        .qy-pillar-dot.yellow {
          background: #d2a84c;
        }

        .qy-metric-fill.pink,
        .qy-pillar-dot.pink {
          background: #d480ab;
        }

        /* STATEMENT */

        .qy-statement {
          padding: 160px 24px 175px;

          text-align: center;

          background: white;

          border-top: 1px solid rgba(17, 16, 20, 0.05);
          border-bottom: 1px solid rgba(17, 16, 20, 0.05);
        }

        .qy-section-kicker {
          display: inline-block;

          color: #79747e;

          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.13em;
        }

        .qy-statement h2 {
          margin: 22px 0 25px;

          color: var(--qy-heading);

          font-family: 'Manrope', sans-serif;
          font-size: clamp(44px, 5.4vw, 75px);
          line-height: 1.02;
          letter-spacing: -0.06em;
        }

        .qy-statement h2 em,
        .qy-pillars-intro h2 em,
        .trajectory-heading h2 em {
          color: var(--qy-purple-dark);
          font-style: normal;
        }

        .qy-statement p {
          width: min(570px, 100%);
          margin: 0 auto;

          color: #6f6b74;

          font-size: 16px;
          line-height: 1.7;
        }

        /* HOW */

        .qy-how {
          padding: 145px 0;
        }

        .qy-section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 60px;
          margin-bottom: 55px;
        }

        .qy-section-heading h2,
        .qy-dark-heading h2,
        .trajectory-heading h2 {
          margin: 17px 0 0;

          color: var(--qy-heading);

          font-family: 'Manrope', sans-serif;
          font-size: clamp(42px, 5vw, 68px);
          line-height: 1;
          letter-spacing: -0.06em;
        }

        .qy-section-heading > p {
          width: 340px;
          margin: 0 0 3px;

          color: #6e6a73;

          font-size: 14px;
          line-height: 1.7;
        }

        .qy-feature-grid {
          display: grid;
          grid-template-columns: 1.25fr 0.875fr 0.875fr;
          gap: 14px;
        }

        .qy-feature-card {
          min-height: 510px;

          display: flex;
          flex-direction: column;

          padding: 25px;

          overflow: hidden;

          border: 1px solid rgba(17, 16, 20, 0.08);
          border-radius: 20px;

          background: white;
        }

        .qy-feature-card.large {
          background: #f0edff;
          border-color: rgba(128, 100, 232, 0.13);
        }

        .qy-feature-number {
          color: #8b8790;

          font-family: 'Manrope', sans-serif;
          font-size: 11px;
          font-weight: 800;
        }

        .qy-feature-copy {
          position: relative;
          z-index: 2;
          margin-top: auto;
        }

        .qy-feature-copy > span {
          color: #77727c;

          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.12em;
        }

        .qy-feature-copy h3 {
          max-width: 310px;
          margin: 11px 0 10px;

          color: #211e25;

          font-family: 'Manrope', sans-serif;
          font-size: 24px;
          line-height: 1.05;
          letter-spacing: -0.05em;
        }

        .qy-feature-copy p {
          max-width: 300px;
          margin: 0;

          color: #6f6b74;

          font-size: 12px;
          line-height: 1.65;
        }

        .qy-feature-visual {
          margin: 34px 0 0;
        }

        /* CHECK IN */

        .qy-checkin-card {
          padding: 18px;

          border-radius: 14px;

          background: white;

          box-shadow:
            0 18px 40px rgba(60, 44, 110, 0.09);
        }

        .qy-checkin-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .qy-demo-label {
          color: #725db5;

          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.12em;
        }

        .qy-demo-time {
          color: #7f7a84;
          font-size: 7px;
          font-weight: 700;
        }

        .qy-checkin-card h3 {
          margin: 15px 0 5px;

          color: #26222b;

          font-family: 'Manrope', sans-serif;
          font-size: 16px;
          letter-spacing: -0.04em;
        }

        .qy-checkin-card > p {
          margin: 0;

          color: #77727c;

          font-size: 8px;
          font-weight: 500;
        }

        .qy-checkin-options {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-top: 17px;
        }

        .qy-checkin-options button {
          padding: 9px 4px;

          border: 1px solid #e6e4e8;
          border-radius: 8px;

          background: white;
          color: #6f6a74;

          cursor: pointer;

          font-size: 7px;
          font-weight: 800;

          transition:
            border-color 160ms ease,
            background 160ms ease,
            color 160ms ease;
        }

        .qy-checkin-options button span {
          display: block;
          margin-bottom: 5px;

          color: #8068d4;

          font-size: 12px;
        }

        .qy-checkin-options button:hover,
        .qy-checkin-options button.selected {
          border-color: #d2c8f6;
          background: #f4f1ff;
          color: #5f4c9b;
        }

        .qy-checkin-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-top: 18px;
          padding-top: 12px;

          border-top: 1px solid #ecebed;

          color: #77727c;

          font-size: 8px;
          font-weight: 800;
        }

        .qy-energy-dots {
          display: flex;
          gap: 4px;
        }

        .qy-energy-dots i {
          width: 13px;
          height: 5px;

          border-radius: 10px;

          background: #e1dfe4;
        }

        .qy-energy-dots i.active {
          background: var(--qy-purple);
        }

        /* MINI SCORE */

        .qy-mini-score {
          min-height: 190px;

          margin-top: 35px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 13px;

          border-radius: 15px;

          background: #f6f6f7;
        }

        .qy-mini-score > div:last-child {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .qy-mini-score strong {
          color: #2a262e;

          font-family: 'Manrope', sans-serif;
          font-size: 17px;
          letter-spacing: -0.05em;
        }

        .qy-mini-score span {
          margin-top: 3px;
          color: #817c86;
          font-size: 7px;
          font-weight: 600;
        }

        /* MINI PROGRESS */

        .qy-mini-progress {
          margin-top: auto;
          padding: 18px;

          border-radius: 15px;

          background: #f7f7f7;
        }

        .qy-mini-progress-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .qy-mini-progress-top span {
          color: #6f6a74;
          font-size: 8px;
          font-weight: 700;
        }

        .qy-mini-progress-top strong {
          color: #47424c;
          font-size: 8px;
          font-weight: 800;
        }

        .qy-mini-progress-track {
          height: 6px;
          margin-top: 13px;

          overflow: hidden;

          border-radius: 10px;

          background: #e5e4e7;
        }

        .qy-mini-progress-track div {
          width: 82%;
          height: 100%;

          border-radius: inherit;

          background: var(--qy-purple);
        }

        .qy-mini-days {
          display: flex;
          justify-content: space-between;

          margin-top: 13px;

          color: #88838c;

          font-size: 6px;
          font-weight: 600;
        }

        .qy-mini-day-dots {
          display: flex;
          justify-content: space-between;
          margin-top: 5px;
        }

        .qy-mini-day-dots i {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #d9d7dc;
        }

        .qy-mini-day-dots i:nth-child(-n+6) {
          background: var(--qy-purple);
        }

        /* DARK SCORE */

        .qy-dark-section {
          position: relative;
          overflow: hidden;

          padding: 150px 0 155px;

          background: var(--qy-dark);
          color: white;
        }

        .qy-dark-glow {
          position: absolute;

          width: 600px;
          height: 600px;

          top: -250px;
          right: -150px;

          border-radius: 50%;

          background: rgba(130, 100, 240, 0.16);

          filter: blur(90px);
        }

        .qy-dark-heading {
          position: relative;
          z-index: 2;
          text-align: center;
        }

        .qy-section-kicker.light {
          color: #a19da8;
        }

        .qy-dark-heading h2 {
          color: white;
        }

        .qy-dark-heading h2 span {
          color: #aa98f2;
        }

        .qy-dark-heading p {
          width: min(510px, 100%);
          margin: 23px auto 0;

          color: #a09ba7;

          font-size: 15px;
          line-height: 1.7;
        }

        .qy-score-showcase {
          position: relative;
          z-index: 2;

          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 14px;

          margin-top: 65px;
        }

        .qy-score-showcase-main,
        .qy-score-breakdown {
          min-height: 420px;

          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 22px;

          background: rgba(255, 255, 255, 0.035);

          backdrop-filter: blur(12px);
        }

        .qy-score-showcase-main {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 65px;

          padding: 45px;
        }

        .qy-showcase-score-copy {
          max-width: 190px;
        }

        .qy-showcase-score-copy > span {
          color: #9e99a5;

          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.13em;
        }

        .qy-showcase-score-copy strong {
          display: block;
          margin-top: 10px;

          color: white;

          font-family: 'Manrope', sans-serif;
          font-size: 70px;
          line-height: 0.9;
          letter-spacing: -0.07em;
        }

        .qy-showcase-score-copy p {
          margin: 15px 0 0;

          color: #9b96a2;

          font-size: 10px;
          line-height: 1.6;
        }

        .qy-score-trend {
          display: inline-flex;
          align-items: center;
          gap: 6px;

          margin-top: 17px;

          color: #c0b3f7;

          font-size: 8px;
          font-weight: 900;
        }

        .qy-score-trend span {
          width: 19px;
          height: 19px;

          display: grid;
          place-items: center;

          border-radius: 6px;

          background: rgba(141, 111, 239, 0.14);
        }

        .qy-score-breakdown {
          padding: 28px;
        }

        .qy-breakdown-header {
          display: flex;
          justify-content: space-between;

          padding-bottom: 19px;

          border-bottom: 1px solid rgba(255, 255, 255, 0.08);

          color: #e1dde5;

          font-size: 10px;
          font-weight: 800;
        }

        .qy-breakdown-header span:last-child {
          color: #89848f;
          font-size: 8px;
        }

        .qy-score-breakdown .qy-metric {
          margin-top: 27px;
        }

        .qy-score-breakdown .qy-metric-top span {
          color: #aaa5b0;
          font-size: 9px;
        }

        .qy-score-breakdown .qy-metric-top strong {
          color: #ddd9e2;
          font-size: 9px;
        }

        .qy-score-breakdown .qy-metric-track {
          height: 5px;
          background: rgba(255, 255, 255, 0.09);
        }

        /* TRAJECTORY */

        .qy-trajectory-section {
          padding: 150px 0;
          background: white;
        }

        .trajectory-heading {
          margin-bottom: 55px;
        }

        .qy-trajectory-card {
          overflow: hidden;

          border: 1px solid rgba(17, 16, 20, 0.08);
          border-radius: 22px;

          background: #fbfbfb;

          box-shadow:
            0 20px 50px rgba(17, 16, 20, 0.04);
        }

        .qy-trajectory-header {
          display: flex;
          justify-content: space-between;

          padding: 27px 30px 22px;
        }

        .qy-trajectory-header p {
          margin: 4px 0 0;
          color: #88838c;
          font-size: 9px;
          font-weight: 600;
        }

        .qy-trajectory-badge {
          align-self: flex-start;

          padding: 7px 10px;

          border-radius: 999px;

          background: #eeeaff;
          color: #664fb1;

          font-size: 8px;
          font-weight: 900;
        }

        .qy-graph {
          display: flex;

          height: 330px;

          padding: 10px 30px 25px 20px;
        }

        .qy-graph-y {
          width: 35px;

          display: flex;
          flex-direction: column;
          justify-content: space-between;

          padding: 6px 0 33px;

          color: #8f8a94;

          font-size: 8px;
          font-weight: 600;
        }

        .qy-graph-area {
          position: relative;
          flex: 1;
          min-width: 0;
        }

        .qy-grid-line {
          position: absolute;
          left: 0;
          right: 0;

          border-top: 1px dashed rgba(17, 16, 20, 0.08);
        }

        .qy-grid-line.one {
          top: 5%;
        }

        .qy-grid-line.two {
          top: 35%;
        }

        .qy-grid-line.three {
          top: 65%;
        }

        .qy-grid-line.four {
          top: 95%;
        }

        .qy-trajectory-svg {
          position: absolute;
          inset: 0 0 35px;

          width: 100%;
          height: calc(100% - 35px);

          overflow: visible;
        }

        .qy-graph-label {
          position: absolute;
          bottom: 5px;

          color: #8f8a94;

          font-size: 8px;
          font-weight: 600;
        }

        .qy-graph-label.now {
          left: 0;
        }

        .qy-graph-label.six {
          left: 50%;
          transform: translateX(-50%);
        }

        .qy-graph-label.year {
          right: 0;
        }

        /* PILLARS */

        .qy-pillars-section {
          padding: 150px 0 160px;
          background: #f4f3f6;
        }

        .qy-pillars-intro {
          max-width: 700px;
        }

        .qy-pillars-intro h2 {
          margin: 18px 0 22px;

          color: var(--qy-heading);

          font-family: 'Manrope', sans-serif;
          font-size: clamp(45px, 5.3vw, 72px);
          line-height: 0.98;
          letter-spacing: -0.065em;
        }

        .qy-pillars-intro p {
          width: 500px;
          max-width: 100%;

          color: #6f6a74;

          font-size: 14px;
          line-height: 1.7;
        }

        .qy-pillar-list {
          margin-top: 75px;

          border-top: 1px solid rgba(17, 16, 20, 0.12);
        }

        .qy-pillar-row {
          display: grid;
          grid-template-columns: 70px 240px 1fr 40px;
          align-items: center;

          gap: 20px;

          min-height: 95px;

          border-bottom: 1px solid rgba(17, 16, 20, 0.12);
        }

        .qy-pillar-index {
          color: #85808a;

          font-size: 9px;
          font-weight: 800;
        }

        .qy-pillar-name {
          display: flex;
          align-items: center;
          gap: 11px;

          color: #29252d;

          font-family: 'Manrope', sans-serif;
          font-size: 17px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .qy-pillar-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .qy-pillar-row p {
          margin: 0;

          color: #6f6a74;

          font-size: 11px;
          font-weight: 500;
        }

        .qy-pillar-arrow {
          justify-self: end;

          color: #716c76;

          font-size: 16px;

          transition: transform 180ms ease;
        }

        .qy-pillar-row:hover .qy-pillar-arrow {
          transform: translate(3px, -3px);
        }

        /* FINAL CTA */

        .qy-final-cta {
          position: relative;
          overflow: hidden;

          padding: 165px 24px;

          text-align: center;

          background: #111014;
          color: white;
        }

        .qy-final-glow {
          position: absolute;

          width: 500px;
          height: 500px;

          top: 50%;
          left: 50%;

          transform: translate(-50%, -50%);

          border-radius: 50%;

          background: rgba(123, 92, 225, 0.18);

          filter: blur(100px);
        }

        .qy-final-cta > .qy-reveal {
          position: relative;
          z-index: 2;
        }

        .qy-final-cta h2 {
          margin: 20px 0 18px;

          color: white;

          font-family: 'Manrope', sans-serif;
          font-size: clamp(46px, 6vw, 84px);
          line-height: 0.98;
          letter-spacing: -0.065em;
        }

        .qy-final-cta h2 span {
          color: #aa98f2;
        }

        .qy-final-cta p {
          margin: 0;

          color: #9c97a3;

          font-size: 14px;
        }

        /*
         * FINAL CTA IS INTENTIONALLY WHITE BECAUSE
         * IT IS ON THE DARK BACKGROUND.
         */

        .qy-final-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 13px;

          margin-top: 34px;
          padding: 15px 22px;

          border-radius: 999px;

          background: white;
          color: #17141b !important;

          font-size: 12px;
          font-weight: 900;

          box-shadow:
            0 12px 35px rgba(0, 0, 0, 0.22);

          transition:
            transform 180ms ease,
            box-shadow 180ms ease;
        }

        .qy-final-button span {
          color: #5f4ca0;
          font-size: 15px;
        }

        .qy-final-button:hover {
          transform: translateY(-3px);

          box-shadow:
            0 18px 45px rgba(0, 0, 0, 0.28);
        }

        /* FOOTER */

        .qy-footer {
          background: #111014;
          color: white;
        }

        .qy-footer-inner {
          width: min(1180px, calc(100% - 48px));
          min-height: 150px;

          margin: 0 auto;

          display: grid;
          grid-template-columns: 1fr 1fr auto auto;

          align-items: center;

          gap: 45px;

          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .footer-brand {
          color: white;
        }

        .footer-brand .qy-brand-mark {
          background: white;
          color: #111014;
        }

        .qy-footer-inner p {
          margin: 0;

          color: #918c98;

          font-size: 10px;
          line-height: 1.55;
        }

        .qy-footer-links {
          display: flex;
          gap: 23px;
        }

        .qy-footer-links a {
          color: #aaa5af;

          font-size: 10px;
          font-weight: 700;

          transition: color 160ms ease;
        }

        .qy-footer-links a:hover {
          color: white;
        }

        .qy-copyright {
          color: #6e6975;
          font-size: 9px;
        }

        /* TABLET */

        @media (max-width: 1000px) {
          .qy-nav-links {
            display: none;
          }

          .qy-product-body {
            grid-template-columns: 140px 1fr;
          }

          .qy-pillar-grid {
            grid-template-columns: repeat(3, 1fr);
            row-gap: 15px;
          }

          .qy-feature-grid {
            grid-template-columns: 1fr 1fr;
          }

          .qy-feature-card.large {
            grid-column: span 2;
            min-height: 520px;
          }

          .qy-score-showcase {
            grid-template-columns: 1fr;
          }

          .qy-score-showcase-main,
          .qy-score-breakdown {
            min-height: 360px;
          }

          .qy-footer-inner {
            grid-template-columns: 1fr 1fr;
            padding: 35px 0;
          }
        }

        /* MOBILE */

        @media (max-width: 700px) {
          .qy-container {
            width: min(100% - 32px, 1180px);
          }

          .qy-nav {
            width: calc(100% - 32px);
            height: 70px;
          }

          .qy-login {
            display: none;
          }

          .qy-primary-small {
            padding: 0 13px;
            font-size: 11px;
          }

          .qy-hero {
            padding: 65px 0 75px;
          }

          .qy-hero h1 {
            font-size: clamp(48px, 14vw, 72px);
          }

          .qy-hero-sub {
            font-size: 15px;
          }

          .qy-hero-actions {
            flex-direction: column;
          }

          .qy-primary-button,
          .qy-secondary-button {
            width: min(300px, 100%);
          }

          .qy-hero-product {
            width: calc(100% - 20px);
            margin-top: 48px;
          }

          .qy-product-shell {
            padding: 5px;
            border-radius: 16px;
          }

          .qy-product-window {
            border-radius: 12px;
          }

          .qy-product-body {
            display: block;
          }

          .qy-product-sidebar {
            display: none;
          }

          .qy-product-main {
            padding: 18px 14px;
          }

          .qy-product-heading h3 {
            font-size: 17px;
          }

          .qy-dashboard-grid {
            grid-template-columns: 1fr;
          }

          .qy-score-main {
            min-height: 190px;
          }

          .qy-pillar-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .qy-statement,
          .qy-how,
          .qy-dark-section,
          .qy-trajectory-section,
          .qy-pillars-section {
            padding-top: 95px;
            padding-bottom: 100px;
          }

          .qy-statement h2 {
            font-size: 43px;
          }

          .qy-section-heading {
            display: block;
            margin-bottom: 35px;
          }

          .qy-section-heading > p {
            width: 100%;
            margin-top: 22px;
          }

          .qy-section-heading h2,
          .qy-dark-heading h2,
          .trajectory-heading h2 {
            font-size: 45px;
          }

          .qy-feature-grid {
            grid-template-columns: 1fr;
          }

          .qy-feature-card.large {
            grid-column: auto;
          }

          .qy-feature-card {
            min-height: 460px;
          }

          .qy-score-showcase-main {
            flex-direction: column;
            gap: 28px;
            text-align: center;
          }

          .qy-showcase-score-copy {
            max-width: 230px;
          }

          .qy-score-showcase-main,
          .qy-score-breakdown {
            min-height: auto;
          }

          .qy-score-showcase-main {
            padding: 38px 20px;
          }

          .qy-score-breakdown {
            padding: 22px;
          }

          .qy-trajectory-header {
            padding: 20px;
          }

          .qy-graph {
            height: 260px;
            padding-left: 12px;
            padding-right: 15px;
          }

          .qy-pillar-list {
            margin-top: 45px;
          }

          .qy-pillar-row {
            grid-template-columns: 30px 1fr 30px;
            gap: 8px;
            min-height: 90px;
          }

          .qy-pillar-row p {
            display: none;
          }

          .qy-pillar-name {
            font-size: 16px;
          }

          .qy-final-cta {
            padding: 110px 20px;
          }

          .qy-final-cta h2 {
            font-size: 47px;
          }

          .qy-footer-inner {
            grid-template-columns: 1fr 1fr;
            gap: 30px 20px;
            padding: 35px 0;
          }

          .qy-copyright {
            grid-column: span 2;
          }
        }

        @media (max-width: 420px) {
          .qy-brand {
            font-size: 18px;
          }

          .qy-primary-small {
            font-size: 10px;
          }

          .qy-hero h1 {
            font-size: 47px;
          }

          .qy-product-heading {
            align-items: flex-start;
          }

          .qy-streak {
            font-size: 7px;
          }

          .qy-score-main {
            gap: 10px;
          }

          .qy-score-copy {
            max-width: 100px;
          }

          .qy-pillar-grid {
            grid-template-columns: 1fr 1fr;
          }

          .qy-final-cta h2 {
            font-size: 43px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }

          .qy-reveal {
            opacity: 1;
            transform: none;
            transition: none;
          }

          .qy-primary-button,
          .qy-secondary-button,
          .qy-primary-small,
          .qy-final-button,
          .qy-pillar-arrow {
            transition: none;
          }
        }
      `}</style>
    </div>
  )
}