import { useMemo, useState } from 'react'
import { loadHistory } from '../lib/storage'
import { listTypes, sessionsOfType } from '../lib/compare'
import { formatSeconds } from '../lib/report'
import './Progress.css'

function Progress({ onBack }) {
  const history = useMemo(() => loadHistory(), [])
  const types = useMemo(() => listTypes(history), [history])
  const [selectedKey, setSelectedKey] = useState(types[0]?.key ?? '')

  const selectedType = types.find((t) => t.key === selectedKey)
  const sessions = useMemo(
    () => (selectedKey ? sessionsOfType(history, selectedKey) : []),
    [history, selectedKey],
  )

  return (
    <div className="progress">
      <header className="progress-header">
        <button type="button" className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <h1>Progress</h1>
      </header>

      {types.length === 0 ? (
        <p className="empty">
          No runs saved yet. Do a practice run and it'll show up here so you can track your pace
          over time.
        </p>
      ) : (
        <>
          <label className="type-select">
            Practice type
            <select value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)}>
              {types.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label} ({t.count})
                </option>
              ))}
            </select>
          </label>

          <TrendChart sessions={sessions} targetMs={selectedType?.targetMs ?? null} />

          <ul className="run-list">
            {[...sessions].reverse().map((s, i, arr) => {
              // arr is newest-first; the "previous" run is the next one along.
              const prev = arr[i + 1]
              const delta = prev ? s.summary.avgMs - prev.summary.avgMs : null
              return (
                <li key={s.id}>
                  <div className="run-main">
                    <span className="run-date">
                      {new Date(s.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    <span className="run-detail">
                      {s.summary.answered}/{s.summary.markCount} marks · avg {formatSeconds(s.summary.avgMs)}
                    </span>
                  </div>
                  {delta != null && Math.abs(delta) >= 1000 && (
                    <span className={`run-delta ${delta < 0 ? 'faster' : 'slower'}`}>
                      {delta < 0 ? '▼' : '▲'} {formatSeconds(Math.abs(delta))}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}

function TrendChart({ sessions, targetMs }) {
  if (sessions.length < 2) {
    return (
      <div className="chart-empty">
        {sessions.length === 1
          ? 'Just one run so far — do another of this type to see a trend.'
          : 'No runs of this type yet.'}
      </div>
    )
  }

  const W = 320
  const H = 170
  const padL = 40
  const padR = 12
  const padT = 14
  const padB = 26

  const avgs = sessions.map((s) => s.summary.avgMs)
  const values = targetMs != null ? [...avgs, targetMs] : avgs
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const span = rawMax - rawMin || rawMax || 1
  const yMin = Math.max(0, rawMin - span * 0.15)
  const yMax = rawMax + span * 0.15

  const x = (i) => padL + (i * (W - padL - padR)) / (sessions.length - 1)
  const y = (v) => padT + ((yMax - v) * (H - padT - padB)) / (yMax - yMin)

  const bestIdx = avgs.indexOf(Math.min(...avgs))
  const points = avgs.map((v, i) => `${x(i)},${y(v)}`).join(' ')

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="trend-svg" role="img" aria-label="Average time per mark over time">
        {/* Y axis labels: min and max */}
        <text x="4" y={y(yMax) + 4} className="axis-label">{formatSeconds(yMax)}</text>
        <text x="4" y={y(yMin) + 4} className="axis-label">{formatSeconds(yMin)}</text>

        {/* Target reference line */}
        {targetMs != null && targetMs >= yMin && targetMs <= yMax && (
          <>
            <line x1={padL} y1={y(targetMs)} x2={W - padR} y2={y(targetMs)} className="target-ref" />
            <text x={W - padR} y={y(targetMs) - 4} className="target-ref-label" textAnchor="end">
              target {formatSeconds(targetMs)}
            </text>
          </>
        )}

        {/* Trend line */}
        <polyline points={points} className="trend-line" fill="none" />

        {/* Points */}
        {avgs.map((v, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(v)}
            r={i === bestIdx ? 5 : 3.5}
            className={`trend-pt ${i === bestIdx ? 'best' : ''} ${i === avgs.length - 1 ? 'latest' : ''}`}
          />
        ))}

        {/* X axis: first and last dates */}
        <text x={padL} y={H - 8} className="axis-label" textAnchor="start">
          {shortDate(sessions[0].date)}
        </text>
        <text x={W - padR} y={H - 8} className="axis-label" textAnchor="end">
          {shortDate(sessions[sessions.length - 1].date)}
        </text>
      </svg>
      <p className="chart-caption">
        Average time per mark, oldest to newest. Lower is faster; the ringed point is your best.
      </p>
    </div>
  )
}

function shortDate(iso) {
  return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short' })
}

export default Progress
