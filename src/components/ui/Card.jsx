export function Card({ children, className = '', hover = false }) {
  return (
    <div className={[hover ? 'glass-card-hover' : 'glass-card', 'p-5', className].join(' ')}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        {subtitle && <p className="section-title mb-1">{subtitle}</p>}
        {title && <h2 className="text-lg font-bold text-slate-900">{title}</h2>}
      </div>
      {action}
    </div>
  )
}
