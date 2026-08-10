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

const mobileTabs = [
  { to: '/dashboard',   label: 'Home',       Icon: IconHome },
  { to: '/log',         label: 'Log',        Icon: IconLog,       fab: true },
  { to: '/weekly',      label: 'Week',       Icon: IconChart },
  { to: '/challenges',  label: 'Challenges', Icon: IconLightning },
]

const desktopTabs = [
  { to: '/dashboard',    label: 'Home',       Icon: IconHome },
  { to: '/log',          label: 'Log',        Icon: IconLog,        fab: true },
  { to: '/weekly',       label: 'Week',       Icon: IconChart },
  { to: '/challenges',   label: 'Challenges', Icon: IconLightning },
  { to: '/achievements', label: 'Awards',     Icon: IconTrophy },
]

const hiddenPaths = ['/login', '/signup', '/onboarding']

export default function NavBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, reset } = useUserStore()
  const { theme, toggleTheme } = useTheme()

  if (hiddenPaths.includes(location.pathname)) return null

  async function handleSignOut() {
    await supabase.auth.signOut()
    reset()
    navigate('/login')
  }

  const ThemeIcon = theme === 'dark' ? IconSun : IconMoon
  const initial = (profile?.username || 'F')[0].toUpperCase()

  return (
    <>
      {/* ── Mobile bottom dock ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 px-4 pb-4 safe-bottom pointer-events-none">
        <div className="pointer-events-auto max-w-md mx-auto">
          <div
            className="
              flex items-end justify-between gap-1 px-2 py-2 rounded-[28px]
              bg-white/90 dark:bg-[#161C0F]/95
              backdrop-blur-2xl
              border border-white/80 dark:border-[#00E87A]/10
              shadow-dock dark:shadow-none
            "
          >
            {mobileTabs.map((tab) => {
              const { Icon } = tab

              if (tab.fab) {
                return (
                  <NavLink
                    key={tab.to}
                    to={tab.to}
                    className="relative -mt-7 flex flex-col items-center"
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className="
                            flex items-center justify-center w-14 h-14 rounded-2xl text-white
                            bg-gradient-to-br from-[#7F5AF0] to-[#6D44E0]
                            dark:from-[#00E87A] dark:to-[#7F5AF0]
                            shadow-[0_0_24px_rgba(127,90,240,0.5)]
                            dark:shadow-[0_0_24px_rgba(0,232,122,0.5)]
                            outline outline-4 outline-white/90 dark:outline-[#0A0D08]
                          "
                        >
                          <Icon className="w-6 h-6" />
                        </span>

                        <span className="text-[10px] font-bold mt-1.5 text-[#7F5AF0] dark:text-[#00E87A]">
                          {tab.label}
                        </span>
                      </>
                    )}
                  </NavLink>
                )
              }

              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className="flex flex-1 flex-col items-center"
                >
                  {({ isActive }) => (
                    <span
                      className={`
                        flex flex-col items-center gap-1 w-full py-2 rounded-2xl
                        transition-colors duration-150
                        ${
                          isActive
                            ? 'text-[#7F5AF0] dark:text-[#00E87A] bg-[#7F5AF0]/10 dark:bg-[#00E87A]/10'
                            : 'text-slate-400 dark:text-[#5A7050] hover:text-slate-600 dark:hover:text-[#9DB890]'
                        }
                      `}
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

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex fixed left-4 top-4 bottom-4 z-50 w-[220px] flex-col">
        <div
          className="
            flex flex-col h-full rounded-2xl p-4
            bg-white/92 dark:bg-[#161C0F]/92
            border border-slate-200/80 dark:border-[#00E87A]/10
            shadow-card dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.45)]
            backdrop-blur-xl
          "
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-3 py-4 mb-2">
            <div
              className="
                flex items-center justify-center w-10 h-10 rounded-2xl text-white
                bg-gradient-to-br from-[#7F5AF0] to-[#6D44E0]
                dark:from-[#00E87A] dark:to-[#7F5AF0]
                shadow-[0_4px_16px_rgba(127,90,240,0.4)]
                dark:shadow-[0_4px_16px_rgba(0,232,122,0.4)]
              "
            >
              <IconSparkles className="w-5 h-5" />
            </div>

            <div>
              <p className="font-bold text-slate-900 dark:text-[#E8F0E0] leading-tight">
                Qyven
              </p>
              <p className="text-[11px] text-slate-400 dark:text-[#5A7050] font-medium">
                Level up daily
              </p>
            </div>
          </div>

          {/* ── Profile card ── */}
          <div
            className="
              mx-2 mb-3 rounded-2xl p-3
              bg-slate-100/80 dark:bg-[#1E2616]
              border border-slate-200/60 dark:border-[#00E87A]/15
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  h-10 w-10 rounded-xl flex items-center justify-center font-extrabold text-sm flex-shrink-0
                  bg-[#7F5AF0]/15 dark:bg-[#00E87A]/15
                  text-[#7F5AF0] dark:text-[#00E87A]
                  border border-[#7F5AF0]/20 dark:border-[#00E87A]/25
                "
              >
                {initial}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold truncate text-slate-900 dark:text-[#E8F0E0]">
                  {profile?.username || 'Future builder'}
                </p>

                <p className="text-[11px] text-slate-500 dark:text-[#9DB890]">
                  Make today count
                </p>
              </div>
            </div>
          </div>

          {/* Nav links */}
          <div className="flex-1 flex flex-col gap-1.5 mt-2">
            {desktopTabs.map((tab) => {
              const { Icon } = tab

              return (
                <NavLink key={tab.to} to={tab.to}>
                  {({ isActive }) => (
                    <span
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm
                        transition-all duration-150 w-full
                        ${
                          isActive
                            ? 'bg-gradient-to-r from-[#7F5AF0] to-[#6D44E0] dark:from-[#00E87A]/20 dark:to-[#00E87A]/10 text-white dark:text-[#00E87A] dark:border dark:border-[#00E87A]/20'
                            : 'text-slate-500 dark:text-[#5A7050] hover:bg-slate-100/70 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-[#9DB890]'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {tab.label}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </div>

          {/* Bottom actions */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="
                inline-flex items-center justify-center gap-2
                rounded-xl px-3 py-2.5 text-xs font-bold
                transition-colors duration-150
                bg-slate-100 dark:bg-[#00E87A]/8
                border border-slate-200/70 dark:border-[#00E87A]/18
                text-slate-700 dark:text-[#00E87A]
                hover:bg-slate-200/60 dark:hover:bg-[#00E87A]/14
              "
            >
              <ThemeIcon className="w-4 h-4" />
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>

            {/* Sign out */}
            <button
              type="button"
              onClick={handleSignOut}
              className="
                inline-flex items-center justify-center gap-2
                rounded-xl px-3 py-2.5 text-xs font-bold
                transition-colors duration-150
                bg-red-50/80 dark:bg-[#FF5C5C]/10
                border border-red-200/50 dark:border-[#FF5C5C]/20
                text-red-600 dark:text-[#FF5C5C]
                hover:bg-red-100/70 dark:hover:bg-[#FF5C5C]/20
              "
            >
              <IconSignOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile top-right actions ── */}
      <div className="md:hidden fixed right-4 top-4 z-50 flex gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="
            h-11 w-11 rounded-2xl backdrop-blur-xl
            flex items-center justify-center
            transition-colors duration-150
            bg-white/90 dark:bg-[#161C0F]/90
            border border-slate-200/70 dark:border-[#00E87A]/15
            text-slate-700 dark:text-[#00E87A]
            shadow-sm dark:shadow-none
          "
        >
          <ThemeIcon className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          className="
            h-11 w-11 rounded-2xl backdrop-blur-xl
            flex items-center justify-center
            transition-colors duration-150
            bg-red-50/90 dark:bg-[#FF5C5C]/10
            border border-red-200/50 dark:border-[#FF5C5C]/20
            text-red-600 dark:text-[#FF5C5C]
            shadow-sm dark:shadow-none
          "
        >
          <IconSignOut className="w-5 h-5" />
        </button>
      </div>
    </>
  )
}