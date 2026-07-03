import { useEffect, useMemo, useRef, useState } from 'react'
import { buildReport, formatSeconds, formatDuration } from '../lib/report'
import { saveSession, loadHistory, deleteSession, clearHistory } from '../lib/storage'
import './Report.css'

function Report({ config, result, onNew, onRepeat }) {
  const report = useMemo(
    () =>
      buildReport({
        questionCount: config.questionCount,
        targetMs: config.targetMs,
        durations: result.durations,
        flags: result.flags,
        elapsedMs: result.elapsedMs,
      }),
    [config, result],
  )
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const savedRef = useRef(false)

  // Save this session once, then load the full history.
  useEffect(() => {
    if (savedRef.current) return
    savedRef.current = true
    const session = {
      id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      date: new Date().toISOString(),
      summary: {
        label: config.label,
        answered: report.answered,
        questionCount: report.questionCount,
        avgMs: report.avgMs,
        targetMs: report.targetMs,
      },
    }
    setHistory(saveSession(session))
  }, [config, report])

  const maxMs = Math.max(report.targetMs, ...report.questions.map((q) => q.ms), 1)
  const targetFrac = report.targetMs / maxMs

  return (
    <div className="report">
      <header className="report-header">
        <h1>Your pacing</h1>
        {config.label && <p className="report-label">{config.label}</p>}
        <p className="verdict">{report.verdict}</p>
      </header>

      <section className="stats">
        <Stat
          label="Avg / question"
          value={formatSeconds(report.avgMs)}
          sub={`target ${formatSeconds(report.targetMs)}`}
          tone={report.avgMs > report.targetMs ? 'over' : 'under'}
        />
        <Stat
          label="Completed"
          value={`${report.answered} / ${report.questionCount}`}
          sub={report.unanswered > 0 ? `${report.unanswered} not reached` : 'all done'}
          tone={report.unanswered > 0 ? 'over' : 'under'}
        />
        <Stat
          label="Time used"
          value={formatDuration(report.timeUsedMs)}
          sub={`of ${formatDuration(report.totalAllottedMs)}`}
          tone="neutral"
        />
      </section>

      <section className="card">
        <div className="chart-head">
          <h2>Time per question</h2>
          <div className="legend">
            <span className="legend-item"><i className="dot under" /> faster</span>
            <span className="legend-item"><i className="dot on" /> on pace</span>
            <span className="legend-item"><i className="dot over" /> slower</span>
          </div>
        </div>

        <div className="bars" style={{ '--target-frac': targetFrac }}>
          <div className="ref-line target-line" title={`Target ${formatSeconds(report.targetMs)}`} />
          {report.questions.map((q) => (
            <div className="bar-row" key={q.number}>
              <span className="bar-num">
                {q.flagged && <span className="bar-flag" title="You flagged this question">⚑</span>}
                Q{q.number}
              </span>
              <div className="bar-track">
                <div className={`bar-fill ${q.band}`} style={{ width: `${(q.ms / maxMs) * 100}%` }} />
              </div>
              <span className="bar-time">{formatSeconds(q.ms)}</span>
            </div>
          ))}
        </div>

        <p className="chart-note">
          The dashed line is your target pace. Bars are coloured by how each question compares to
          it. Flags (⚑) are ones you marked to revisit — a quick question may just be easy, so the
          raw times are shown too.
        </p>
      </section>

      {report.answered > 0 && (
        <div className={`avg-compare band-${report.avgBand}`}>
          <span className="avg-compare-label">On average you spent</span>
          <span className="avg-compare-value">{formatSeconds(report.avgMs)}</span>
          <span className="avg-compare-delta">
            {report.avgBand === 'on'
              ? `right on the ${formatSeconds(report.targetMs)} target`
              : `${formatDuration(Math.abs(report.avgDeltaMs))} ${
                  report.avgBand === 'over' ? 'slower than' : 'faster than'
                } the ${formatSeconds(report.targetMs)} target`}
          </span>
        </div>
      )}

      <div className="actions">
        <button type="button" className="btn-repeat" onClick={onRepeat}>
          Practise again
        </button>
        <button type="button" className="btn-new" onClick={onNew}>
          New set
        </button>
      </div>

      <section className="card">
        <button type="button" className="history-toggle" onClick={() => setShowHistory((s) => !s)}>
          {showHistory ? '▾' : '▸'} Past sessions ({history.length})
        </button>
        {showHistory && (
          <>
            <ul className="history-list">
              {history.map((s) => (
                <li key={s.id}>
                  <div className="hist-main">
                    <span className="hist-date">
                      {new Date(s.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      {s.summary.label ? ` · ${s.summary.label}` : ''}
                    </span>
                    <span className="hist-detail">
                      {s.summary.answered}/{s.summary.questionCount} · avg {formatSeconds(s.summary.avgMs)} vs{' '}
                      {formatSeconds(s.summary.targetMs)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="hist-delete"
                    aria-label="Delete session"
                    onClick={() => setHistory(deleteSession(s.id))}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            {history.length > 0 && (
              <button type="button" className="btn-clear-history" onClick={() => setHistory(clearHistory())}>
                Clear all history
              </button>
            )}
          </>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value, sub, tone }) {
  return (
    <div className={`stat tone-${tone}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-sub">{sub}</span>
    </div>
  )
}

export default Report
