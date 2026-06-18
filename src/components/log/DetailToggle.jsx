import { useEffect, useState } from 'react'

export default function DetailToggle({ label, badge, children, defaultOpen = false, forceOpen = false }) {
  const [open, setOpen] = useState(defaultOpen || (badge > 0))

  useEffect(() => {
    if (forceOpen) setOpen(true)
  }, [forceOpen])

  return (
    <div className="mt-4 pt-4 border-t border-slate-100/80">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 text-left group"
      >
        <span className="text-sm font-semibold text-primary group-hover:text-primary-700 transition-colors">
          {label}
          {badge > 0 && (
            <span className="ml-2 pill bg-primary-50 text-primary-700 text-[10px]">{badge}</span>
          )}
        </span>
        <span
          className={[
            'text-slate-400 text-xs font-bold transition-transform duration-200',
            open ? 'rotate-180' : '',
          ].join(' ')}
        >
          ▼
        </span>
      </button>
      {open && <div className="mt-3 space-y-3 animate-fade-in">{children}</div>}
    </div>
  )
}