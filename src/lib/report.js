// Colour bands are relative to the target pace. A generous dead-zone around the
// target counts as "on pace"; beyond it a question reads as faster or slower.
export const ON_PACE_BAND = 0.15 // within ±15% of target = on pace
// Flags (for the verdict / revisit list) are more conservative than the colour.
export const SLOW_RATIO = 1.5 // took >150% of target — worth flagging to revisit
export const FAST_RATIO = 0.5 // took <50% of target — very quick

// Build the full report from a finished run.
//   questionCount: how many questions the student set out to do
//   targetMs:      target time per question (the chosen pace)
//   durations:     per-question times in ms (length = questions answered)
//   flags:         0-based question indexes the student flagged
export function buildReport({ questionCount, targetMs, durations, flags = [] }) {
  const flagSet = new Set(flags)
  const totalAllottedMs = questionCount * targetMs

  const answered = durations.length
  const unanswered = Math.max(0, questionCount - answered)
  const totalSpentMs = durations.reduce((a, b) => a + b, 0)
  const avgMs = answered > 0 ? totalSpentMs / answered : 0

  const questions = durations.map((ms, i) => {
    const ratio = targetMs > 0 ? ms / targetMs : 1
    let band = 'on'
    if (ratio > 1 + ON_PACE_BAND) band = 'over'
    else if (ratio < 1 - ON_PACE_BAND) band = 'under'
    return {
      number: i + 1,
      ms,
      ratio,
      band,
      isSlow: ratio > SLOW_RATIO,
      isFast: ratio < FAST_RATIO,
      flagged: flagSet.has(i),
    }
  })

  const slow = questions.filter((q) => q.isSlow)
  const overPace = questions.filter((q) => q.band === 'over')

  // How the answered questions compare to their fair share of time.
  const paceDeltaMs = totalSpentMs - answered * targetMs

  return {
    questionCount,
    targetMs,
    totalAllottedMs,
    answered,
    unanswered,
    totalSpentMs,
    avgMs,
    paceDeltaMs,
    questions,
    slow,
    overPace,
    verdict: buildVerdict({ answered, unanswered, avgMs, targetMs, slow, paceDeltaMs }),
  }
}

function buildVerdict({ answered, unanswered, avgMs, targetMs, slow, paceDeltaMs }) {
  if (answered === 0) return 'No questions were completed.'

  const parts = []
  const overUnder = paceDeltaMs <= 0 ? 'under' : 'over'
  parts.push(
    `Averaged ${formatSeconds(avgMs)} per question against a ${formatSeconds(targetMs)} target` +
      ` (${formatDuration(Math.abs(paceDeltaMs))} ${overUnder} pace overall).`,
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
