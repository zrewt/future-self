import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useUserStore } from '../store/useUserStore'
import { useTheme } from '../hooks/useTheme'
import {
  IconHome,
  IconLog,
  IconChart,
  IconTrophy,
  IconSparkles,
  IconMoon,
  IconSun,
  IconSignOut,
} from './ui/Icons'

function IconLightning({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

const tabs = [
  { to: '/dashboard', label: 'Home',       Icon: IconHome },
  { to: '/log',       label: 'Log',        Icon: IconLog,       fab: true },
  { to: '/weekly',    label: 'Week',       Icon: IconChart },
  { to: '/challenges',label: 'Challenges', Icon: IconLightning },
]

const hiddenPaths = ['/login', '/signup', '/onboarding']

export default function NavBar() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { profile, reset } = useUserStore()
  const { theme, toggleTheme } = useTheme()

  if (hiddenPaths.includes(location.pathname)) return null

  async function handleSignOut() {
    await supabase.auth.signOut()
    reset()
    navigate('/login')
  }

  const ThemeIcon = theme === 'dark' ? IconSun : IconMoon
  const initial   = (profile?.username || 'F')[0].toUpperCase()
  const isDark    = theme === 'dark'

  return (
    <>
      {/* ═══════════════════════════════════════════
          MOBILE — floating dock
          Light: white glass, purple active
          Dark:  forest glass, green active
      ═══════════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 px-4 pb-4 safe-bottom pointer-events-none">
        <div className="pointer-events-auto max-w-md mx-auto">
          <div
            className="flex items-end justify-between gap-1 px-2 py-2 rounded-[28px] backdrop-blur-2xl border transition-colors duration-300"
            style={{
              background: isDark
                ? 'rgba(22,28,15,0.92)'
                : 'rgba(255,255,255,0.88)',
              borderColor: isDark
                ? 'rgba(0,232,122,0.1)'
                : 'rgba(255,255,255,0.85)',
              boxShadow: isDark
                ? 'inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.5)'
                : '0 -4px 32px rgba(15,23,42,0.08), inset 0 0 0 1px rgba(255,255,255,0.8)',
            }}
          >
            {tabs.map((tab) => {
              const { Icon } = tab

              /* FAB — Log button */
              if (tab.fab) {
                return (
                  <NavLink
                    key={tab.to}
                    to={tab.to}
                    className="relative -mt-7 flex flex-col items-center"
                  >
                    <span
                      className="flex items-center justify-center w-14 h-14 rounded-2xl text-white transition-all duration-300"
                      style={{
                        background: isDark
                          ? 'linear-gradient(135deg, #00E87A 0%, #7F5AF0 100%)'
                          : 'linear-gradient(135deg, #7F5AF0 0%, #6D44E0 100%)',
                        boxShadow: isDark
                          ? '0 0 24px rgba(0,232,122,0.5), 0 4px 16px rgba(0,0,0,0.3)'
                          : '0 0 24px rgba(127,90,240,0.5), 0 4px 16px rgba(0,0,0,0.15)',
                        ringColor: isDark ? '#0A0D08' : '#F5F7F2',
                      }}
                      style2={{
                        outline: `4px solid ${isDark ? '#0A0D08' : '#F5F7F2'}`,
                      }}
                    >
                      <span
                        className="absolute inset-0 rounded-2xl"
                        style={{
                          outline: `4px solid ${isDark ? '#0A0D08' : '#F5F7F2'}`,
                          borderRadius: 'inherit',
                        }}
                      />
                      <Icon className="w-6 h-6 relative z-10" />
                    </span>
                    <span
                      className="text-[10px] font-bold mt-1.5 transition-colors duration-300"
                      style={{ color: isDark ? '#00E87A' : '#7F5AF0' }}
                    >
                      {tab.label}
                    </span>
                  </NavLink>
                )
              }

              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className="flex flex-1 flex-col items-center gap-1 py-2 rounded-2xl transition-all duration-200"
                >
                  {({ isActive }) => (
                    <span
                      className="flex flex-col items-center gap-1 w-full py-1.5 rounded-2xl transition-all duration-200"
                      style={{
                        background: isActive
                          ? isDark
                            ? 'rgba(0,232,122,0.1)'
                            : 'rgba(127,90,240,0.08)'
                          : 'transparent',
                        color: isActive
                          ? isDark ? '#00E87A' : '#7F5AF0'
                          : isDark ? '#5A7050' : '#94A3B8',
                      }}
                    >
                      <Icon className={isActive ? 'w-6 h-6' : 'w-5 h-5'} />
                      <span className="text-[10px] font-semibold">{tab.label}</span>
                    </span>
                  )}
                </NavLink>
              )
            })}
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════
          DESKTOP — glass sidebar
          Light: white glass + purple accents
          Dark:  forest glass + green accents
      ═══════════════════════════════════════════ */}
      <aside className="hidden md:flex fixed left-4 top-4 bottom-4 z-50 w-[220px] flex-col">
        <div
          className="flex flex-col h-full rounded-2xl p-4 transition-all duration-300"
          style={{
            background: isDark
              ? 'linear-gradient(160deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 100%), rgba(22,28,15,0.92)'
              : 'rgba(255,255,255,0.92)',
            border: `1px solid ${isDark ? 'rgba(0,232,122,0.1)' : 'rgba(255,255,255,0.75)'}`,
            boxShadow: isDark
              ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.45)'
              : '0 1px 2px rgba(15,23,42,0.04), 0 6px 24px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-3 py-4 mb-2">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-2xl text-white shadow-md transition-all duration-300"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, #00E87A, #7F5AF0)'
                  : 'linear-gradient(135deg, #7F5AF0, #6D44E0)',
                boxShadow: isDark
                  ? '0 4px 16px rgba(0,232,122,0.4)'
                  : '0 4px 16px rgba(127,90,240,0.4)',
              }}
            >
              <IconSparkles className="w-5 h-5" />
            </div>
            <div>
              <p
                className="font-bold leading-tight transition-colors duration-300"
                style={{ color: isDark ? '#E8F0E0' : '#0D1409' }}
              >
                Qyven
              </p>
              <p
                className="text-[11px] font-medium transition-colors duration-300"
                style={{ color: isDark ? '#5A7050' : '#94A3B8' }}
              >
                Level up daily
              </p>
            </div>
          </div>

          {/* Profile card */}
          <div
            className="mx-2 mb-3 rounded-2xl p-3 transition-all duration-300"
            style={{
              background: isDark ? 'rgba(0,232,122,0.06)' : '#0D1409',
              border: `1px solid ${isDark ? 'rgba(0,232,122,0.15)' : 'transparent'}`,
              color: '#fff',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center font-extrabold text-sm flex-shrink-0"
                style={{
                  background: isDark ? 'rgba(0,232,122,0.15)' : 'rgba(255,255,255,0.15)',
                  color: isDark ? '#00E87A' : '#fff',
                  border: isDark ? '1px solid rgba(0,232,122,0.25)' : 'none',
                }}
              >
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{profile?.username || 'Future builder'}</p>
                <p
                  className="text-[11px]"
                  style={{ color: isDark ? '#5A7050' : 'rgba(255,255,255,0.55)' }}
                >
                  Make today count
                </p>
              </div>
            </div>
          </div>

          {/* Nav links */}
          <div className="flex-1 flex flex-col gap-1 mt-2">
            {[
              { to: '/dashboard',  label: 'Home',       Icon: IconHome },
              { to: '/log',        label: 'Log',        Icon: IconLog,        fab: true },
              { to: '/weekly',     label: 'Week',       Icon: IconChart },
              { to: '/challenges', label: 'Challenges', Icon: IconLightning },
              { to: '/achievements',label: 'Awards',    Icon: IconTrophy },
            ].map((tab) => {
              const { Icon } = tab
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200"
                >
                  {({ isActive }) => {
                    let style = {}
                    let className = 'flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 w-full'

                    if (isActive) {
                      style = isDark
                        ? {
                            background: 'rgba(0,232,122,0.12)',
                            color: '#00E87A',
                            boxShadow: 'inset 0 1px 0 rgba(0,232,122,0.1)',
                            border: '1px solid rgba(0,232,122,0.2)',
                          }
                        : {
                            background: 'linear-gradient(135deg, #7F5AF0, #6D44E0)',
                            color: '#fff',
                            boxShadow: '0 4px 12px rgba(127,90,240,0.35)',
                          }
                    } else if (tab.fab) {
                      style = isDark
                        ? {
                            background: 'rgba(0,232,122,0.06)',
                            color: '#00E87A',
                            border: '1px solid rgba(0,232,122,0.15)',
                          }
                        : {
                            background: 'rgba(127,90,240,0.06)',
                            color: '#7F5AF0',
                            border: '1px solid rgba(127,90,240,0.15)',
                          }
                    } else {
                      style = {
                        color: isDark ? '#5A7050' : '#64748B',
                      }
                    }

                    return (
                      <span className={className} style={style}>
                        <Icon className="w-5 h-5 shrink-0" />
                        {tab.label}
                      </span>
                    )
                  }}
                </NavLink>
              )
            })}
          </div>

          {/* Bottom actions */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200"
              style={{
                background: isDark ? 'rgba(0,232,122,0.08)' : 'rgba(127,90,240,0.08)',
                border: `1px solid ${isDark ? 'rgba(0,232,122,0.18)' : 'rgba(127,90,240,0.18)'}`,
                color: isDark ? '#00E87A' : '#7F5AF0',
              }}
            >
              <ThemeIcon className="w-4 h-4" />
              {isDark ? 'Light' : 'Dark'}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-colors"
              style={{
                background: isDark ? 'rgba(255,92,92,0.08)' : 'rgba(255,92,92,0.06)',
                border: '1px solid rgba(255,92,92,0.18)',
                color: isDark ? '#FF5C5C' : '#DC2626',
              }}
            >
              <IconSignOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════
          MOBILE — top right action buttons
      ═══════════════════════════════════════════ */}
      <div className="md:hidden fixed right-4 top-4 z-50 flex gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="h-11 w-11 rounded-2xl backdrop-blur-xl flex items-center justify-center transition-all duration-200"
          style={{
            background: isDark ? 'rgba(22,28,15,0.9)' : 'rgba(255,255,255,0.88)',
            border: `1px solid ${isDark ? 'rgba(0,232,122,0.15)' : 'rgba(255,255,255,0.85)'}`,
            color: isDark ? '#00E87A' : '#7F5AF0',
            boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 2px 8px rgba(15,23,42,0.08)',
          }}
        >
          <ThemeIcon className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={handleSignOut}
          className="h-11 w-11 rounded-2xl backdrop-blur-xl flex items-center justify-center transition-colors"
          style={{
            background: isDark ? 'rgba(255,92,92,0.1)' : 'rgba(254,242,242,0.9)',
            border: `1px solid ${isDark ? 'rgba(255,92,92,0.2)' : 'rgba(254,202,202,0.8)'}`,
            color: isDark ? '#FF5C5C' : '#DC2626',
            boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 2px 8px rgba(15,23,42,0.08)',
          }}
        >
          <IconSignOut className="w-5 h-5" />
        </button>
      </div>
    </>
  )
}
