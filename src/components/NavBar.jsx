import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useUserStore } from '../store/useUserStore'
import { useTheme } from '../hooks/useTheme'
import {
  IconHome,
  IconLog,
  IconChart,
  IconTrophy,
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
  { to: '/dashboard', label: 'Overview', Icon: IconHome },
  { to: '/log', label: 'Check-in', Icon: IconLog },
  { to: '/weekly', label: 'Progress', Icon: IconChart },
  { to: '/challenges', label: 'Goals', Icon: IconLightning },
]

const desktopTabs = [
  ...mobileTabs,
  { to: '/achievements', label: 'Achievements', Icon: IconTrophy },
]

const hiddenPaths = ['/login', '/signup', '/onboarding']

function NavItem({ tab, compact = false }) {
  const { Icon } = tab
  return (
    <NavLink key={tab.to} to={tab.to} className="block">
      {({ isActive }) => (
        <span className={`flex items-center ${compact ? 'flex-col gap-1 py-2' : 'gap-3 px-3 py-2.5'} rounded-xl text-sm font-semibold transition-colors ${
          isActive
            ? 'bg-slate-900 text-white dark:bg-[#7F5AF0] dark:text-white'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#B4B7D4] dark:hover:bg-white/[0.06] dark:hover:text-[#F1EEF9]'
        }`}>
          <Icon className={compact ? 'w-5 h-5' : 'w-[18px] h-[18px] shrink-0'} />
          <span className={compact ? 'text-[10px] leading-none' : ''}>{tab.label}</span>
        </span>
      )}
    </NavLink>
  )
}

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
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-slate-200/80 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-xl dark:border-white/10 dark:bg-[#141220]/95">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {mobileTabs.map((tab) => <NavItem key={tab.to} tab={tab} compact />)}
        </div>
      </nav>

      <aside className="hidden md:flex fixed left-5 top-5 bottom-5 z-50 w-[232px] flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#141220] dark:shadow-[0_12px_36px_rgba(0,0,0,0.28)]">
        <div className="flex items-center gap-3 px-2 py-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-extrabold text-white dark:bg-gradient-to-br dark:from-[#FF7AC6] dark:via-[#7F5AF0] dark:to-[#00E8C6]">Q</div>
          <div>
            <p className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-[#F1EEF9]">Qyven</p>
            <p className="text-[10px] font-medium text-slate-400 dark:text-[#8A8FA3]">Personal wellbeing</p>
          </div>
        </div>

        <NavLink to="/profile" className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.035] dark:hover:bg-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700 dark:bg-[#7F5AF0]/20 dark:text-[#C4B5FD]">{initial}</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800 dark:text-[#F1EEF9]">{profile?.username || 'Future builder'}</p>
              <p className="text-[10px] font-medium text-slate-500 dark:text-[#B4B7D4]">View profile</p>
            </div>
          </div>
        </NavLink>

        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-[#5A7050]">Workspace</p>
        <div className="flex flex-1 flex-col gap-1">
          {desktopTabs.map((tab) => <NavItem key={tab.to} tab={tab} />)}
        </div>

        <div className="border-t border-slate-200 pt-3 dark:border-white/10">
          <button type="button" onClick={toggleTheme} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:text-[#9DB890] dark:hover:bg-white/[0.06]">
            <ThemeIcon className="h-[18px] w-[18px]" /> {theme === 'dark' ? 'Use light theme' : 'Use dark theme'}
          </button>
          <button type="button" onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-[#9DB890] dark:hover:bg-red-500/10 dark:hover:text-red-400">
            <IconSignOut className="h-[18px] w-[18px]" /> Sign out
          </button>
        </div>
      </aside>

      <button type="button" onClick={toggleTheme} className="md:hidden fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm dark:border-white/10 dark:bg-[#111509] dark:text-green">
        <ThemeIcon className="w-5 h-5" />
      </button>
    </>
  )
}
