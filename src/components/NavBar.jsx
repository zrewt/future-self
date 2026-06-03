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

const tabs = [
  { to: '/dashboard', label: 'Home', Icon: IconHome },
  { to: '/log', label: 'Log', Icon: IconLog, fab: true },
  { to: '/weekly', label: 'Week', Icon: IconChart },
  { to: '/achievements', label: 'Awards', Icon: IconTrophy },
]

const hiddenPaths = ['/login', '/signup', '/onboarding']

export default function NavBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, reset } = useUserStore()
  const { theme, toggleTheme } = useTheme()

  if (hiddenPaths.includes(location.pathname)) {
    return null
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    reset()
    navigate('/login')
  }

  const ThemeIcon = theme === 'dark' ? IconSun : IconMoon
  const initial = (profile?.username || 'F')[0].toUpperCase()

  return (
    <>
      {/* Mobile — floating dock */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 px-4 pb-4 safe-bottom pointer-events-none">
        <div className="pointer-events-auto max-w-md mx-auto">
          <div className="flex items-end justify-between gap-1 px-2 py-2 rounded-[28px] bg-white/85 dark:bg-slate-950/85 backdrop-blur-2xl shadow-dock dark:shadow-none border border-white/80 dark:border-white/10">
            {tabs.map((tab) => {
              const { Icon } = tab

              if (tab.fab) {
                return (
                  <NavLink
                    key={tab.to}
                    to={tab.to}
                    className="relative -mt-7 flex flex-col items-center"
                  >
                    <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-700 dark:from-teal dark:to-primary text-white shadow-glow ring-4 ring-surface-muted dark:ring-[#080A12]">
                      <Icon className="w-6 h-6" />
                    </span>
                    <span className="text-[10px] font-bold text-primary dark:text-teal mt-1.5">{tab.label}</span>
                  </NavLink>
                )
              }

              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={({ isActive }) =>
                    [
                      'flex flex-1 flex-col items-center gap-1 py-2 rounded-2xl transition-all duration-200',
                      isActive
                        ? 'text-primary dark:text-teal bg-primary-50 dark:bg-white/10'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200',
                    ].join(' ')
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={isActive ? 'w-6 h-6' : 'w-5 h-5'} />
                      <span className="text-[10px] font-semibold">{tab.label}</span>
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Desktop — glass sidebar */}
      <aside className="hidden md:flex fixed left-4 top-4 bottom-4 z-50 w-[220px] flex-col">
        <div className="flex flex-col h-full glass-card p-4 shadow-card">
          <div className="flex items-center gap-3 px-3 py-4 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary-700 text-white shadow-md shadow-primary/30">
              <IconSparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white leading-tight">Future Self</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Level up daily</p>
            </div>
          </div>

          <div className="mx-2 mb-3 rounded-2xl bg-slate-950 text-white dark:bg-white/10 border border-transparent dark:border-white/10 p-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center font-extrabold">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{profile?.username || 'Future builder'}</p>
                <p className="text-[11px] text-white/60">Make today count</p>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-1 mt-2">
            {tabs.map((tab) => {
              const { Icon } = tab
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200',
                      tab.fab && !isActive
                        ? 'bg-gradient-to-r from-primary/10 to-primary-50 dark:from-teal/15 dark:to-primary/10 text-primary dark:text-teal border border-primary/20 dark:border-teal/20'
                        : isActive
                          ? 'bg-primary dark:bg-teal text-white shadow-md shadow-primary/25 dark:shadow-teal/20'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-slate-100',
                    ].join(' ')
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {tab.label}
                </NavLink>
              )
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="btn-secondary !px-3 !py-2.5 !rounded-xl text-xs"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <ThemeIcon className="w-4 h-4" />
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-200 dark:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors"
            >
              <IconSignOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="md:hidden fixed right-4 top-4 z-50 flex gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="h-11 w-11 rounded-2xl bg-white/85 dark:bg-slate-950/85 border border-white/80 dark:border-white/10 shadow-card dark:shadow-none backdrop-blur-xl flex items-center justify-center text-slate-700 dark:text-slate-100"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <ThemeIcon className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={handleSignOut}
          className="h-11 w-11 rounded-2xl bg-red-50/90 dark:bg-red-500/10 border border-red-100 dark:border-red-400/20 shadow-card dark:shadow-none backdrop-blur-xl flex items-center justify-center text-red-600 dark:text-red-200"
          title="Sign out"
        >
          <IconSignOut className="w-5 h-5" />
        </button>
      </div>
    </>
  )
}
