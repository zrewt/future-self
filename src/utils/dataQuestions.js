/**
 * "Ask Your Data" — structured analysis engine. Every answer is computed
 * from real log history (no AI, no guessing) and includes a concrete
 * recommendation derived from the same computation that produced the insight.
 */

function avg(arr) {
    if (!arr.length) return null
    return arr.reduce((a, b) => a + b, 0) / arr.length
  }
  
  function round1(n) {
    return Math.round(n * 10) / 10
  }
  
  function dayOfWeek(dateISO) {
    return new Date(`${dateISO}T12:00:00`).getDay()
  }
  
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  
  function isWeekend(dateISO) {
    const d = dayOfWeek(dateISO)
    return d === 0 || d === 6
  }
  
  function correlation(xs, ys) {
    const n = xs.length
    if (n < 5) return null
    const mx = avg(xs), my = avg(ys)
    let num = 0, dx2 = 0, dy2 = 0
    for (let i = 0; i < n; i++) {
      const dx = xs[i] - mx
      const dy = ys[i] - my
      num += dx * dy
      dx2 += dx * dx
      dy2 += dy * dy
    }
    if (dx2 === 0 || dy2 === 0) return null
    return num / Math.sqrt(dx2 * dy2)
  }
  
  function describeCorrelation(r) {
    const abs = Math.abs(r)
    if (abs < 0.2) return 'no real relationship'
    if (abs < 0.4) return 'a weak relationship'
    if (abs < 0.6) return 'a moderate relationship'
    return 'a strong relationship'
  }
  
  /**
   * Every answer follows this shape:
   * {
   *   summary: string          — the headline finding
   *   detail: string|null      — supporting context
   *   stat: { value, label }   — the single number to feature on the card
   *   status: 'good'|'attention'|'neutral'  — drives card color/icon
   *   recommendation: string|null  — concrete next action, grounded in the data
   * }
   */
  
  // ── Patterns & timing ──────────────────────────────────────────────────────
  
  function qBestDayOfWeek(logs) {
    if (logs.length < 14) return null
    const byDay = Array.from({ length: 7 }, () => [])
    logs.forEach((l) => {
      if (l.future_self_score != null) byDay[dayOfWeek(l.log_date)].push(l.future_self_score)
    })
    const averages = byDay.map((vals, i) => ({ day: DAY_NAMES[i], avg: avg(vals), count: vals.length }))
      .filter((d) => d.count >= 2)
    if (averages.length < 3) return null
    averages.sort((a, b) => b.avg - a.avg)
    const best = averages[0]
    const worst = averages[averages.length - 1]
    const gap = Math.round(best.avg - worst.avg)
  
    return {
      summary: `${best.day}s are your strongest day, ${worst.day}s your weakest.`,
      detail: averages.map((d) => `${d.day.slice(0, 3)} ${Math.round(d.avg)}`).join('  ·  '),
      stat: { value: Math.round(best.avg), label: `avg on ${best.day}` },
      status: gap >= 10 ? 'attention' : 'neutral',
      recommendation: gap >= 10
        ? `Look at what's different about your ${worst.day} routine — schedule, sleep the night before, or workload — and try borrowing one habit from your ${best.day}s.`
        : `Your week is fairly even — no single day needs fixing, which is a good sign of a stable routine.`,
    }
  }
  
  function qWeekdayVsWeekend(logs) {
    const weekday = logs.filter((l) => !isWeekend(l.log_date) && l.future_self_score != null).map((l) => l.future_self_score)
    const weekend = logs.filter((l) => isWeekend(l.log_date) && l.future_self_score != null).map((l) => l.future_self_score)
    if (weekday.length < 5 || weekend.length < 3) return null
    const wdAvg = avg(weekday), weAvg = avg(weekend)
    const diff = Math.round(wdAvg - weAvg)
  
    if (Math.abs(diff) < 3) {
      return {
        summary: 'Weekdays and weekends are evenly matched.',
        detail: `Weekdays avg ${Math.round(wdAvg)}, weekends avg ${Math.round(weAvg)}.`,
        stat: { value: Math.round((wdAvg + weAvg) / 2), label: 'overall avg' },
        status: 'good',
        recommendation: 'No gap to close here — whatever you\'re doing is holding up regardless of the day.',
      }
    }
  
    const better = diff > 0 ? 'weekdays' : 'weekends'
    const worse = diff > 0 ? 'weekends' : 'weekdays'
    return {
      summary: `Your ${better} consistently outperform your ${worse} by ${Math.abs(diff)} points.`,
      detail: `Weekdays: ${Math.round(wdAvg)}  ·  Weekends: ${Math.round(weAvg)}`,
      stat: { value: Math.abs(diff), label: `point gap` },
      status: Math.abs(diff) >= 12 ? 'attention' : 'neutral',
      recommendation: diff > 0
        ? `Structure is doing a lot of work for you. Try carrying one weekday anchor — a set wake time, or a morning log — into your weekends.`
        : `You loosen up and perform better without a packed schedule. Worth checking whether weekday stress is the actual drag, not lack of time.`,
    }
  }
  
  // ── Trends ──────────────────────────────────────────────────────────────────
  
  function qMonthComparison(logs) {
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const toDate = (iso) => new Date(`${iso}T12:00:00`)
  
    const thisMonth = logs.filter((l) => toDate(l.log_date) >= thisMonthStart && l.future_self_score != null)
    const lastMonth = logs.filter((l) => toDate(l.log_date) >= lastMonthStart && toDate(l.log_date) <= lastMonthEnd && l.future_self_score != null)
    if (thisMonth.length < 3 || lastMonth.length < 3) return null
  
    const thisAvg = avg(thisMonth.map((l) => l.future_self_score))
    const lastAvg = avg(lastMonth.map((l) => l.future_self_score))
    const diff = Math.round(thisAvg - lastAvg)
  
    if (Math.abs(diff) < 2) {
      return {
        summary: 'Holding steady month over month.',
        detail: `This month: ${Math.round(thisAvg)}  ·  Last month: ${Math.round(lastAvg)}`,
        stat: { value: Math.round(thisAvg), label: 'this month avg' },
        status: 'neutral',
        recommendation: 'Stability is fine, but if you want movement, pick one pillar below and push it deliberately for two weeks.',
      }
    }
  
    return {
      summary: diff > 0 ? `You're trending up ${diff} points this month.` : `You're down ${Math.abs(diff)} points this month.`,
      detail: `This month: ${Math.round(thisAvg)}  ·  Last month: ${Math.round(lastAvg)}`,
      stat: { value: diff > 0 ? `+${diff}` : diff, label: 'point change' },
      status: diff > 0 ? 'good' : 'attention',
      recommendation: diff > 0
        ? `Whatever changed is working — check your Trends chart for what shifted around when the climb started, and keep doing it.`
        : `Before assuming it's a slump, check if one specific pillar dropped (below) — usually one cause explains most of a dip like this.`,
    }
  }
  
  function qConsistencyByPillar(logs) {
    if (logs.length < 10) return null
    const fields = [
      { key: 'nutrition_score', label: 'Nutrition' },
      { key: 'fitness_score', label: 'Fitness' },
      { key: 'energy_score', label: 'Sleep & Energy' },
      { key: 'focus_score', label: 'Focus' },
    ]
    const results = fields.map((f) => {
      const vals = logs.map((l) => l[f.key]).filter((v) => v != null)
      if (vals.length < 8) return null
      const m = avg(vals)
      if (!m) return null
      const variance = avg(vals.map((v) => (v - m) ** 2))
      const cv = Math.sqrt(variance) / m
      return { label: f.label, cv, avg: Math.round(m) }
    }).filter(Boolean)
  
    if (results.length < 2) return null
    results.sort((a, b) => a.cv - b.cv)
    const mostConsistent = results[0]
    const leastConsistent = results[results.length - 1]
  
    return {
      summary: `${mostConsistent.label} is your steadiest pillar. ${leastConsistent.label} swings the most.`,
      detail: `${mostConsistent.label} avg ${mostConsistent.avg}  ·  ${leastConsistent.label} avg ${leastConsistent.avg}`,
      stat: { value: mostConsistent.label, label: 'most consistent' },
      status: 'neutral',
      recommendation: `${leastConsistent.label} is your highest-leverage fix — even small steadiness gains there will move your overall score more than polishing what's already consistent.`,
    }
  }
  
  // ── Correlations ──────────────────────────────────────────────────────────
  
  function qSleepVsNextDayFitness(logs) {
    const byDate = new Map(logs.map((l) => [l.log_date, l]))
    const pairs = []
    for (const l of logs) {
      const d = new Date(`${l.log_date}T12:00:00`)
      d.setDate(d.getDate() + 1)
      const nextISO = d.toISOString().slice(0, 10)
      const next = byDate.get(nextISO)
      if (next && l.sleep_hours != null && next.fitness_score != null) {
        pairs.push([Number(l.sleep_hours), next.fitness_score])
      }
    }
    if (pairs.length < 8) return null
    const r = correlation(pairs.map((p) => p[0]), pairs.map((p) => p[1]))
    if (r == null) return null
    const strength = describeCorrelation(r)
  
    if (Math.abs(r) < 0.25) {
      return {
        summary: `Sleep doesn't show a strong link to your next-day fitness score.`,
        detail: `Correlation: ${round1(r)} — ${strength} found.`,
        stat: { value: round1(r), label: 'correlation' },
        status: 'neutral',
        recommendation: 'Something else is likely driving your workout quality — motivation, schedule, or workout type are worth checking instead.',
      }
    }
  
    return {
      summary: r > 0
        ? `More sleep tends to mean a stronger workout the next day.`
        : `More sleep correlates with weaker next-day workouts — unusual, worth a closer look.`,
      detail: `Based on ${pairs.length} day-pairs  ·  correlation ${round1(r)} (${strength})`,
      stat: { value: round1(r), label: 'correlation strength' },
      status: r > 0 ? 'good' : 'attention',
      recommendation: r > 0
        ? `Protecting your sleep the night before a planned workout is a real, measurable lever for you — not just general advice.`
        : `Check if "more sleep" days are actually rest/recovery days being miscounted, or if oversleeping is linked to lower energy for you specifically.`,
    }
  }
  
  function qMoodCorrelations(logs) {
    const withMood = logs.filter((l) => l.mood != null)
    if (withMood.length < 10) return null
  
    const fields = [
      { key: 'sleep_hours', label: 'sleep', transform: Number },
      { key: 'focus_minutes', label: 'focus time', transform: Number },
      { key: 'workout_duration_min', label: 'exercise', transform: Number },
      { key: 'water_ml', label: 'hydration', transform: Number },
    ]
  
    const results = fields
      .map((f) => {
        const xs = withMood.map((l) => f.transform(l[f.key] ?? 0))
        const ys = withMood.map((l) => l.mood)
        const r = correlation(xs, ys)
        return r == null ? null : { label: f.label, r }
      })
      .filter(Boolean)
      .sort((a, b) => Math.abs(b.r) - Math.abs(a.r))
  
    if (!results.length || Math.abs(results[0].r) < 0.3) {
      return {
        summary: 'No single factor stands out as strongly tied to your mood yet.',
        detail: 'It looks fairly independent across sleep, exercise, focus, and hydration so far.',
        stat: { value: '—', label: 'no clear driver' },
        status: 'neutral',
        recommendation: 'Keep logging — mood patterns often take longer to surface than physical ones. Check back after a few more weeks.',
      }
    }
  
    const top = results[0]
    return {
      summary: `Your mood tracks most closely with ${top.label}.`,
      detail: results.slice(0, 3).map((r) => `${r.label}: ${round1(r.r)}`).join('  ·  '),
      stat: { value: round1(top.r), label: `${top.label} correlation` },
      status: top.r > 0 ? 'good' : 'attention',
      recommendation: top.r > 0
        ? `${top.label.charAt(0).toUpperCase() + top.label.slice(1)} is your strongest, most controllable lever on how you feel day to day — prioritize it on rough days specifically.`
        : `Less ${top.label} is tracking with better mood for you — worth questioning whether more isn't always better here.`,
    }
  }
  
  function qWhatDragsYouDown(logs) {
    const scored = logs.filter((l) => l.future_self_score != null)
    if (scored.length < 10) return null
  
    const sorted = [...scored].sort((a, b) => a.future_self_score - b.future_self_score)
    const worstQuartile = sorted.slice(0, Math.max(3, Math.floor(sorted.length / 4)))
    const restQuartile = sorted.slice(Math.floor(sorted.length / 4))
  
    const fields = [
      { key: 'sleep_hours', label: 'sleep hours', transform: Number },
      { key: 'water_ml', label: 'hydration', transform: Number },
      { key: 'workout_duration_min', label: 'exercise', transform: Number },
      { key: 'focus_minutes', label: 'focus time', transform: Number },
    ]
  
    const gaps = fields.map((f) => {
      const worstAvg = avg(worstQuartile.map((l) => f.transform(l[f.key] ?? 0)))
      const restAvg = avg(restQuartile.map((l) => f.transform(l[f.key] ?? 0)))
      return { label: f.label, worstAvg, restAvg, gapPercent: restAvg ? ((restAvg - worstAvg) / restAvg) * 100 : 0 }
    }).sort((a, b) => Math.abs(b.gapPercent) - Math.abs(a.gapPercent))
  
    const top = gaps[0]
    if (Math.abs(top.gapPercent) < 15) {
      return {
        summary: "No single factor explains your lower-scoring days.",
        detail: 'They seem to vary for different reasons each time, not one repeated cause.',
        stat: { value: '—', label: 'no clear pattern' },
        status: 'neutral',
        recommendation: 'Without one dominant cause, the highest-leverage move is just reducing how often off days happen at all — consistency over optimization.',
      }
    }
  
    return {
      summary: `Your lowest-scoring days share one thing: noticeably less ${top.label}.`,
      detail: `About ${Math.round(Math.abs(top.gapPercent))}% lower than your typical day — the biggest gap found.`,
      stat: { value: `-${Math.round(Math.abs(top.gapPercent))}%`, label: top.label },
      status: 'attention',
      recommendation: `${top.label.charAt(0).toUpperCase() + top.label.slice(1)} is your single biggest early-warning sign. On a day it's slipping, treat it as a flag — not just a number.`,
    }
  }
  
  // ── Records & streaks ──────────────────────────────────────────────────────
  
  function qBestDayEver(logs) {
    const scored = logs.filter((l) => l.future_self_score != null)
    if (scored.length < 5) return null
    const best = scored.reduce((a, b) => (b.future_self_score > a.future_self_score ? b : a))
    const date = new Date(`${best.log_date}T12:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    const pillars = [
      { label: 'Nutrition', v: best.nutrition_score },
      { label: 'Fitness', v: best.fitness_score },
      { label: 'Sleep/Energy', v: best.energy_score },
      { label: 'Focus', v: best.focus_score },
    ].sort((a, b) => b.v - a.v)
  
    return {
      summary: `Your best day was ${date}.`,
      detail: `${pillars[0].label} led (${pillars[0].v}), ${pillars[1].label} close behind (${pillars[1].v}).`,
      stat: { value: best.future_self_score, label: 'peak score' },
      status: 'good',
      recommendation: `That day is your proof of concept — it's a real combination you've already pulled off once. Treat it as a template, not a fluke.`,
    }
  }
  
  function qLongestStreakStory(logs, profile) {
    if (!profile?.longest_streak || profile.longest_streak < 3) return null
    const current = profile.current_streak || 0
    const longest = profile.longest_streak
    const atRecord = current >= longest && current > 0
  
    return {
      summary: atRecord
        ? `You're matching or beating your all-time streak record right now.`
        : `Your record is ${longest} days — you're currently ${longest - current} away from it.`,
      detail: `Current streak: ${current}  ·  Best ever: ${longest}`,
      stat: { value: current, label: 'current streak' },
      status: atRecord ? 'good' : 'neutral',
      recommendation: atRecord
        ? `You're in uncharted territory — every day from here sets a new personal best.`
        : `You've already proven you can hold ${longest} days once. The skill isn't new, you just need the next ${longest - current} days.`,
    }
  }
  
  // ── Question registry ─────────────────────────────────────────────────────
  
  export const QUESTION_CATEGORIES = [
    {
      id: 'patterns',
      label: 'Patterns & Timing',
      icon: '📅',
      questions: [
        { id: 'best_day_of_week', text: 'What day of the week am I strongest?', icon: '📈', compute: qBestDayOfWeek },
        { id: 'weekday_weekend', text: 'Weekdays vs weekends', icon: '⚖️', compute: qWeekdayVsWeekend },
      ],
    },
    {
      id: 'trends',
      label: 'Trends',
      icon: '📊',
      questions: [
        { id: 'month_comparison', text: 'This month vs last month', icon: '📆', compute: qMonthComparison },
        { id: 'consistency', text: 'Which pillar am I most consistent in?', icon: '🎯', compute: qConsistencyByPillar },
      ],
    },
    {
      id: 'correlations',
      label: 'What Affects What',
      icon: '🔗',
      questions: [
        { id: 'sleep_fitness', text: 'Does sleep affect my workouts?', icon: '💤', compute: qSleepVsNextDayFitness },
        { id: 'mood_factors', text: 'What most affects my mood?', icon: '🙂', compute: qMoodCorrelations },
        { id: 'what_drags_down', text: 'What\'s driving my worst days?', icon: '⚠️', compute: qWhatDragsYouDown },
      ],
    },
    {
      id: 'records',
      label: 'Records & Streaks',
      icon: '🏆',
      questions: [
        { id: 'best_day_ever', text: 'What was my best day ever?', icon: '⭐', compute: qBestDayEver },
        { id: 'streak_story', text: 'Current streak vs my record', icon: '🔥', compute: qLongestStreakStory },
      ],
    },
  ]
  
  export function answerQuestion(questionId, logs, profile) {
    for (const cat of QUESTION_CATEGORIES) {
      const q = cat.questions.find((q) => q.id === questionId)
      if (q) return q.compute(logs, profile)
    }
    return null
  }
  
  export function getSuggestedQuestions(logs, profile, count = 3) {
    const all = QUESTION_CATEGORIES.flatMap((cat) =>
      cat.questions.map((q) => ({ ...q, category: cat.label, categoryIcon: cat.icon }))
    )
    const answerable = all.filter((q) => answerQuestion(q.id, logs, profile) != null)
    const seed = new Date().getDate()
    const shuffled = [...answerable].sort((a, b) => ((a.id.charCodeAt(0) + seed) % 7) - ((b.id.charCodeAt(0) + seed) % 7))
    return shuffled.slice(0, count)
  }
  
  export function getAnsweredCount(logs, profile) {
    const all = QUESTION_CATEGORIES.flatMap((cat) => cat.questions)
    return all.filter((q) => answerQuestion(q.id, logs, profile) != null).length
  }