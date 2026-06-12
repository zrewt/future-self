/**
 * Future Self Integrity Score
 * Measures how consistent and believable a user's logging is over time.
 * NOT meant to accuse — it rewards realistic, honest tracking.
 * Returns 0–100 with a label and confidence tier.
 */

// ── Helpers ────────────────────────────────────────────────────────────────────

function avg(arr) {
    if (!arr.length) return 0
    return arr.reduce((a, b) => a + b, 0) / arr.length
  }
  
  function stdDev(arr) {
    if (arr.length < 2) return 0
    const mean = avg(arr)
    const variance = arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / arr.length
    return Math.sqrt(variance)
  }
  
  // ── Main scoring function ──────────────────────────────────────────────────────
  
  /**
   * @param {object[]} logs - Array of daily_log rows, ordered newest first
   * @param {object} profile - users_profile row
   * @returns {{ score: number, label: string, tier: 'high'|'moderate'|'low', components: object }}
   */
  export function computeIntegrityScore(logs, profile) {
    if (!logs?.length) {
      return { score: 75, label: 'Building', tier: 'moderate', components: {} }
    }
  
    const last30 = logs.slice(0, 30)
    const last7  = logs.slice(0, 7)
  
    let score = 75 // Start at 75 — benefit of the doubt
  
    const components = {}
  
    // ── 1. Logging consistency (up to +15) ────────────────────────────────────
    // More days logged = more data = higher confidence
    const streak      = profile?.current_streak ?? 0
    const totalLogs   = logs.length
    const consistencyBonus = Math.min(15,
      Math.round(totalLogs * 0.3) +
      Math.min(5, Math.floor(streak / 7))
    )
    score += consistencyBonus
    components.consistency = consistencyBonus
  
    // ── 2. Score variation — realistic tracking has ups and downs (+10 / -10) ──
    // Perfect scores every day = suspicious. Some bad days = honest.
    const fssValues = last30.map((l) => l.future_self_score || 0).filter((v) => v > 0)
    const fssStdDev = stdDev(fssValues)
    const fssAvg    = avg(fssValues)
  
    let variationScore = 0
    if (fssStdDev >= 8) {
      // Good variation — realistic
      variationScore = Math.min(10, Math.round(fssStdDev * 0.6))
    } else if (fssStdDev < 3 && fssAvg > 70 && last30.length >= 7) {
      // Nearly identical high scores every day — suspicious
      variationScore = -10
    } else if (fssStdDev < 3 && fssAvg <= 70) {
      // Low variation but also low scores — probably just consistent mediocrity, fine
      variationScore = 0
    } else {
      variationScore = Math.round(fssStdDev * 0.3)
    }
    score += variationScore
    components.variation = variationScore
  
    // ── 3. Imperfect day honesty bonus (+8) ───────────────────────────────────
    // Reporting bad days is a sign of honest tracking
    const imperfectDays = last30.filter((l) =>
      (l.future_self_score || 0) < 50 ||
      (l.processed_servings || 0) >= 2 ||
      Number(l.sleep_hours || 0) < 6 ||
      (l.workout_duration_min === 0 && l.exercise_type === 'rest')
    ).length
  
    const honestyBonus = Math.min(8, Math.round(imperfectDays * 0.8))
    score += honestyBonus
    components.honesty = honestyBonus
  
    // ── 4. Gradient realism — scores should change gradually (+5 / -8) ────────
    // Jumping from 30 to 95 overnight is unrealistic
    let gradientScore = 0
    if (fssValues.length >= 3) {
      const dayToDay = []
      for (let i = 0; i < fssValues.length - 1; i++) {
        dayToDay.push(Math.abs(fssValues[i] - fssValues[i + 1]))
      }
      const avgJump = avg(dayToDay)
  
      if (avgJump > 25) {
        gradientScore = -8 // Too volatile
      } else if (avgJump > 15) {
        gradientScore = -3
      } else if (avgJump <= 10) {
        gradientScore = 5  // Nice gradual changes
      }
    }
    score += gradientScore
    components.gradient = gradientScore
  
    // ── 5. All-categories-maxed penalty (-12) ─────────────────────────────────
    // If every pillar is above 85 every single day for 7+ days, penalise
    if (last7.length >= 5) {
      const allHighDays = last7.filter((l) =>
        (l.fitness_score   || 0) >= 85 &&
        (l.nutrition_score || 0) >= 85 &&
        (l.energy_score    || 0) >= 85 &&
        (l.focus_score     || 0) >= 85
      ).length
  
      if (allHighDays >= 5) {
        score -= 12
        components.allMaxed = -12
      }
    }
  
    // ── 6. Recent logging activity (+5) ───────────────────────────────────────
    // Logged in the last 3 days = active, trustworthy
    const recentDays = last7.length
    if (recentDays >= 5) {
      score += 5
      components.recent = 5
    } else if (recentDays >= 3) {
      score += 2
      components.recent = 2
    }
  
    // ── Clamp and tier ─────────────────────────────────────────────────────────
    score = Math.min(100, Math.max(20, Math.round(score)))
  
    let label, tier
    if (score >= 85) { label = 'High Confidence';     tier = 'high'     }
    else if (score >= 65) { label = 'Moderate Confidence'; tier = 'moderate' }
    else              { label = 'Low Confidence';      tier = 'low'      }
  
    return { score, label, tier, components }
  }
  
  // ── Honesty XP bonus ──────────────────────────────────────────────────────────
  /**
   * Returns XP bonus and message if today's log is "honest" (not all perfect)
   * Called from Log.jsx on submit
   */
  export function getHonestyBonus(log) {
    if (!log) return null
  
    const isImperfect =
      (log.processed_servings || 0) >= 2 ||
      Number(log.sleep_hours || 0) < 6 ||
      (log.fitness_score || 0) < 40 ||
      (log.future_self_score || 0) < 50
  
    if (!isImperfect) return null
  
    return {
      xp: 10,
      message: 'Honest reflection +10 XP',
    }
  }
  
  // ── Confidence modifier for projections ───────────────────────────────────────
  /**
   * Returns a label for use in FutureProjectionCard
   */
  export function getProjectionConfidence(integrityScore) {
    if (integrityScore >= 85) return { label: 'High',     color: 'text-teal'   }
    if (integrityScore >= 65) return { label: 'Moderate', color: 'text-amber-600 dark:text-amber' }
    return                           { label: 'Low',      color: 'text-coral'  }
  }