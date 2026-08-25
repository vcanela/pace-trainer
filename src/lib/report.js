// Colour bands are relative to the target pace. A generous dead-zone around the
// target counts as "on pace"; beyond it a question reads as faster or slower.
export const ON_PACE_BAND = 0.15 // within ±15% of target = on pace
// Flags (for the verdict / revisit list) are more conservative than the colour.
export const SLOW_RATIO = 1.5 // took >150% of target — worth flagging to revisit
export const FAST_RATIO = 0.5 // took <50% of target — very quick

// Build the full report from a finished run.
//   markCount: how many marks (questions) the student set out to do
//   targetMs:  target time per mark (the chosen pace), or null for no target
//   durations: per-mark times in ms (length = marks answered)
//   flags:     0-based indexes the student flagged
export function buildReport({ markCount, targetMs, durations, flags = [], elapsedMs }) {
  const flagSet = new Set(flags)
  const hasTarget = targetMs != null && targetMs > 0
  const totalAllottedMs = hasTarget ? markCount * targetMs : null

  const answered = durations.length
  const unanswered = Math.max(0, markCount - answered)
  // Time spent on completed marks (used for average and pace delta).
  const completedMs = durations.reduce((a, b) => a + b, 0)
  // Actual wall-clock time used. When the timer runs out with a mark still in
  // progress, that time still counts — so "time used" reflects the whole
  // sitting, not just the completed laps. Falls back to completedMs if absent.
  let timeUsedMs = elapsedMs ?? completedMs
  if (hasTarget) timeUsedMs = Math.min(timeUsedMs, totalAllottedMs)
  const avgMs = answered > 0 ? completedMs / answered : 0

  const questions = durations.map((ms, i) => {
    const ratio = hasTarget ? ms / targetMs : 1
    let band = 'none'
    if (hasTarget) {
      band = 'on'
      if (ratio > 1 + ON_PACE_BAND) band = 'over'
      else if (ratio < 1 - ON_PACE_BAND) band = 'under'
    }
    return {
      number: i + 1,
      ms,
      ratio,
      band,
      isSlow: hasTarget && ratio > SLOW_RATIO,
      flagged: flagSet.has(i),
    }
  })

  const slow = questions.filter((q) => q.isSlow)

  // Comparisons against target only make sense when a target was set.
  const paceDeltaMs = hasTarget ? completedMs - answered * targetMs : null
  const avgDeltaMs = hasTarget && answered > 0 ? avgMs - targetMs : null
  let avgBand = 'none'
  if (avgDeltaMs != null) {
    avgBand = avgDeltaMs > targetMs * ON_PACE_BAND ? 'over' : avgDeltaMs < -targetMs * ON_PACE_BAND ? 'under' : 'on'
  }

  return {
    markCount,
    targetMs,
    hasTarget,
    totalAllottedMs,
    answered,
    unanswered,
    completedMs,
    timeUsedMs,
    avgMs,
    avgDeltaMs,
    avgBand,
    paceDeltaMs,
    questions,
    slow,
    verdict: buildVerdict({ hasTarget, answered, unanswered, avgMs, targetMs, slow, paceDeltaMs }),
  }
}

function buildVerdict({ hasTarget, answered, unanswered, avgMs, targetMs, slow, paceDeltaMs }) {
  if (answered === 0) return 'No marks were completed.'

  const parts = []

  if (hasTarget) {
    const overUnder = paceDeltaMs <= 0 ? 'under' : 'over'
    parts.push(
      `Averaged ${formatSeconds(avgMs)} per mark against a ${formatSeconds(targetMs)} target` +
        ` (${formatDuration(Math.abs(paceDeltaMs))} ${overUnder} pace overall).`,
    )
    if (unanswered > 0) {
      parts.push(`Time ran out with ${unanswered} mark${unanswered === 1 ? '' : 's'} still to go.`)
    }
    if (slow.length > 0) {
      const nums = slow.slice(0, 3).map((q) => `Q${q.number}`).join(', ')
      parts.push(
        `${slow.length} mark${slow.length === 1 ? '' : 's'} ran long${
          nums ? ` (${nums}${slow.length > 3 ? '…' : ''})` : ''
        } — candidates to flag and return to.`,
      )
    }
  } else {
    parts.push(
      `Averaged ${formatSeconds(avgMs)} per mark across ${answered} mark${answered === 1 ? '' : 's'}.` +
        ' No target was set — this is just your natural speed.',
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
