import { formatSeconds } from './report'

// Two runs are comparable only when they share a "type": the same pace. IB
// presets and custom paces are keyed by their target (and label, so different
// IB exams at the same pace stay distinct); untargeted runs form one group.
export function sessionTypeKey(session) {
  const t = session.summary?.targetMs
  if (t == null) return 'none'
  return `${session.summary.label}@${Math.round(t)}`
}

export function typeLabel(session) {
  const t = session.summary?.targetMs
  if (t == null) return 'No target · natural speed'
  return `${session.summary.label} · ${formatSeconds(t)}/mark`
}

// Distinct types present in history, newest activity first, with a run count.
export function listTypes(history) {
  const map = new Map()
  for (const s of history) {
    const key = sessionTypeKey(s)
    if (!map.has(key)) {
      map.set(key, { key, label: typeLabel(s), targetMs: s.summary?.targetMs ?? null, count: 0 })
    }
    map.get(key).count += 1
  }
  return [...map.values()]
}

// Sessions of one type, oldest first (chronological, for charting).
export function sessionsOfType(history, key) {
  return history
    .filter((s) => sessionTypeKey(s) === key)
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
}

// Compare a just-finished session against prior runs of the same type. `history`
// may already contain the current session; it is excluded by id.
export function compareToHistory(history, current) {
  const key = sessionTypeKey(current)
  const priors = history.filter((s) => s.id !== current.id && sessionTypeKey(s) === key)
  if (priors.length === 0) return { isFirst: true }

  const byDateDesc = [...priors].sort((a, b) => new Date(b.date) - new Date(a.date))
  const last = byDateDesc[0]
  const bestPrior = priors.reduce((m, s) => (s.summary.avgMs < m.summary.avgMs ? s : m))
  const cur = current.summary.avgMs

  return {
    isFirst: false,
    priorCount: priors.length,
    lastAvgMs: last.summary.avgMs,
    deltaVsLastMs: cur - last.summary.avgMs, // negative = faster than last time
    isBest: cur < bestPrior.summary.avgMs,
    bestPriorAvgMs: bestPrior.summary.avgMs,
  }
}
