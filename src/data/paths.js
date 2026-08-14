/**
 * data/paths.js
 *
 * Maps each onboarding "path" (avatar_class) to HOW the user gets coached —
 * as opposed to focus_pillar, which drives WHAT gets emphasized (see
 * Log.jsx / Dashboard.jsx pillar-promotion logic, phase 2 of the
 * personalization plan).
 *
 * Reuses the existing question IDs from utils/dataQuestions.js — no new
 * correlation math. priorityQuestionIds is currently only wired into
 * Insights.jsx (phase 3), but `tone` is written now so phases 4-5 (quest
 * framing, achievement copy, Dashboard greeting) can reuse it later
 * without another config pass.
 *
 * Minimum-data thresholds below are read directly off dataQuestions.js —
 * NOT guessed. If those thresholds change, emptyStateCopy's "~2 weeks"
 * framing should be re-checked against them:
 *   - best_day_of_week   needs 14+ logs
 *   - weekday_weekend    needs 5+ weekday logs, 3+ weekend logs
 *   - month_comparison   needs 3+ logs in each of this/last month
 *   - consistency        needs 10+ logs (8+ per pillar field)
 *   - sleep_fitness      needs 8+ day-pairs (so ~9+ consecutive days logged)
 *   - mood_factors       needs 10+ logs with mood set
 *   - what_drags_down    needs 10+ scored logs
 *   - best_day_ever      needs 5+ scored logs
 *   - streak_story       needs longest_streak >= 3
 */

export const PATHS = {
  athlete: {
    label: 'Athlete',
    icon: '🏋️',

    // Recovery-framed: leans into sleep's effect on training, and streak
    // as a training-log narrative — regardless of which pillar the user's
    // goal points to.
    priorityQuestionIds: ['sleep_fitness', 'streak_story', 'consistency'],

    emptyStateCopy:
      "Not enough training data yet to show recovery patterns. Log workouts and sleep for about 2 weeks and this will start showing you what actually moves your performance.",

    tone: {
      greetingPrefix: 'Ready to put in the work today?',
      questionFraming: 'Recovery check',
      achievementTone: 'earned, not given',
    },
  },

  scholar: {
    label: 'Scholar',
    icon: '📚',

    // Consistency- and mood-framed, read through a focus/knowledge lens.
    priorityQuestionIds: ['consistency', 'mood_factors', 'month_comparison'],

    emptyStateCopy:
      "Not enough sessions logged yet to see what's shaping your focus. Keep logging for about 2 weeks and this will start surfacing what actually moves your concentration and mood.",

    tone: {
      greetingPrefix: 'What are you building toward today?',
      questionFraming: 'What the data shows',
      achievementTone: 'measured, precise',
    },
  },

  builder: {
    label: 'Builder',
    icon: '🔧',

    // Systems-framed: streak as an uptime story, month-over-month as a
    // system-performance readout.
    priorityQuestionIds: ['streak_story', 'month_comparison', 'weekday_weekend'],

    emptyStateCopy:
      "Not enough history yet to show your system at work. Keep logging for about 2 weeks and this will start showing what's actually holding your streak up — and what's breaking it.",

    tone: {
      greetingPrefix: 'What are you maintaining today?',
      questionFraming: 'System status',
      achievementTone: 'built, brick by brick',
    },
  },

  balanced: {
    label: 'Balanced',
    icon: '⚖️',

    // Generalist framing: no single lever — weekday/weekend rhythm, worst-day
    // causes, and month trend, so nothing pillar gets over-emphasized.
    priorityQuestionIds: ['weekday_weekend', 'what_drags_down', 'month_comparison'],

    emptyStateCopy:
      "Not enough days logged yet to see your overall rhythm. Keep logging for about 2 weeks and this will start showing what's actually driving your good days vs your rough ones.",

    tone: {
      greetingPrefix: 'How\'s today shaping up?',
      questionFraming: 'Worth noticing',
      achievementTone: 'steady, well-rounded',
    },
  },
}

export const DEFAULT_PATH = 'balanced'

/**
 * Always returns a valid path config — falls back to DEFAULT_PATH for a
 * missing/unrecognized avatar_class rather than throwing, since
 * avatar_class is optional on older accounts.
 */
export function getPathConfig(avatarClass) {
  return PATHS[avatarClass] || PATHS[DEFAULT_PATH]
}
