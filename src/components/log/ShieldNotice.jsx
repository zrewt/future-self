export default function ShieldNotice({ shieldEvent, newShieldEarned }) {
    if (!shieldEvent && !newShieldEarned) return null
  
    return (
      <div className="space-y-2 mb-4">
        {shieldEvent?.type === 'shield_consumed' && (
          <div className="glass-card p-4 bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🛡️</span>
              <p className="font-extrabold text-slate-900 text-sm">A shield protected your streak</p>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              You missed logging on {new Date(`${shieldEvent.missedDate}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, but a streak shield kept it alive. Your streak continues uninterrupted.
            </p>
          </div>
        )}
        {newShieldEarned > 0 && (
          <div className="glass-card p-4 bg-teal/5 border border-teal/20">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🛡️✨</span>
              <p className="font-extrabold text-slate-900 text-sm">
                New shield earned!
              </p>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              14 days of consistency earned you a streak shield — it'll automatically protect you if you ever miss a single day.
            </p>
          </div>
        )}
      </div>
    )
  }