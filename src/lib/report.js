// Heuristic thresholds for flagging a question's pace. These are deliberately
// generous, and the UI always shows the raw time alongside the flag — a fast
// question may simply have been easy, not careless.
export const SLOW_RATIO = 1.5 // took >150% of the target time
export const FAST_RATIO = 0.5 // took <50% of the target time

export function targetMsPerQuestion(questionCount, totalMinutes) {
  if (!questionCount || questionCount <= 0) return 0
  return (totalMinutes * 60 * 1000) / questionCount
}

// Build the full report from a finished run.
//   durations: array of per-question times in ms (length = questions answered)
//   flags:     array of 0-based question indexes the student flagged
export function buildReport({ questionCount, totalMinutes, durations, flags = [] }) {
  const flagSet = new Set(flags)
  const targetMs = targetMsPerQuestion(questionCount, totalMinutes)
  const totalAllottedMs = totalMinutes * 60 * 1000

  const answered = durations.length
  const unanswered = Math.max(0, questionCount - answered)
  const totalSpentMs = durations.reduce((a, b) => a + b, 0)
  const avgMs = answered > 0 ? totalSpentMs / answered : 0

  const questions = durations.map((ms, i) => {
    const ratio = targetMs > 0 ? ms / targetMs : 1
    let category = 'ok'
    if (ratio > SLOW_RATIO) category = 'slow'
    else if (ratio < FAST_RATIO) category = 'fast'
    return {
      number: i + 1,
      ms,
      ratio,
      category,
      flagged: flagSet.has(i),
    }
  })

  const slow = questions.filter((q) => q.category === 'slow')
  const fast = questions.filter((q) => q.category === 'fast')

  // Pace delta: how the answered questions compare to their fair share of time.
  const paceDeltaMs = totalSpentMs - answered * targetMs

  return {
    questionCount,
    totalMinutes,
    targetMs,
    totalAllottedMs,
    answered,
    unanswered,
    totalSpentMs,
    avgMs,
    paceDeltaMs,
    questions,
    slow,
    fast,
    verdict: buildVerdict({ answered, unanswered, avgMs, targetMs, slow, paceDeltaMs }),
  }
}

function buildVerdict({ answered, unanswered, avgMs, targetMs, slow, paceDeltaMs }) {
  if (answered === 0) return 'No questions were completed.'

  const parts = []
  const overUnder = paceDeltaMs <= 0 ? 'under' : 'over'
  const absDelta = Math.abs(paceDeltaMs)
  parts.push(
    `Averaged ${formatSeconds(avgMs)} per question against a ${formatSeconds(targetMs)} target` +
      ` (${formatDuration(absDelta)} ${overUnder} pace overall).`,
  )

  if (unanswered > 0) {
    parts.push(`Time ran out with ${unanswered} question${unanswered === 1 ? '' : 's'} still to go.`)
  }

  if (slow.length > 0) {
    const nums = slow.slice(0, 3).map((q) => `Q${q.number}`).join(', ')
    parts.push(
      `${slow.length} question${slow.length === 1 ? '' : 's'} ran long${
        nums ? ` (${nums}${slow.length > 3 ? '…' : ''})` : ''
      } — candidates to flag and return to.`,
    )
  }

  return parts.join(' ')
}

// "1:47" for >= 1 min, otherwise "47s". Rounds to whole seconds.
export function formatSeconds(ms) {
  const totalSeconds = Math.round(ms / 1000)
  if (totalSeconds < 60) return `${totalSeconds}s`
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// "M:SS" always (for clock-style totals).
export function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
