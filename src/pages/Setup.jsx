import { useState } from 'react'
import { BUILTIN_PRESETS, presetPaceMs, presetLabel } from '../lib/presets'
import { formatSeconds, formatDuration } from '../lib/report'
import './Setup.css'

const SUBJECTS = ['Physics', 'Chemistry', 'Biology']

function Setup({ onStart }) {
  const [paceMode, setPaceMode] = useState('custom') // 'none' | 'custom' | 'ib'
  const [ibPaceId, setIbPaceId] = useState('phys-sl')
  const [customMin, setCustomMin] = useState(1.5) // minutes per mark
  const [markCount, setMarkCount] = useState(10)

  const ibPreset = BUILTIN_PRESETS.find((p) => p.id === ibPaceId)

  let targetMs = null
  let paceLabel = 'No target'
  if (paceMode === 'custom') {
    targetMs = customMin > 0 ? customMin * 60 * 1000 : null
    paceLabel = 'Custom pace'
  } else if (paceMode === 'ib') {
    targetMs = presetPaceMs(ibPreset)
    paceLabel = presetLabel(ibPreset)
  }

  const totalMs = targetMs != null ? markCount * targetMs : null
  const changeMarks = (n) => setMarkCount(Math.max(1, Math.min(200, Math.floor(n) || 1)))

  const start = () => onStart({ label: paceLabel, markCount, targetMs })

  return (
    <div className="setup">
      <header className="setup-header">
        <h1>Pace Trainer</h1>
        <p className="tagline">
          Optionally set a target pace, choose how many marks you're doing, then lap each one as
          you finish. No clock while you go — just a report at the end.
        </p>
      </header>

      <section className="card">
        <h2>1 · Pace <span className="optional">optional</span></h2>
        <div className="mode-toggle" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={paceMode === 'none'}
            className={paceMode === 'none' ? 'active' : ''}
            onClick={() => setPaceMode('none')}
          >
            No target
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={paceMode === 'custom'}
            className={paceMode === 'custom' ? 'active' : ''}
            onClick={() => setPaceMode('custom')}
          >
            Custom
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={paceMode === 'ib'}
            className={paceMode === 'ib' ? 'active' : ''}
            onClick={() => setPaceMode('ib')}
          >
            IB exam
          </button>
        </div>

        {paceMode === 'none' && (
          <p className="mode-note">No pace set — you'll just find out how fast you naturally are.</p>
        )}

        {paceMode === 'custom' && (
          <label className="custom-min">
            Minutes per mark
            <div className="min-input">
              <input
                type="number"
                min="0.25"
                step="0.25"
                inputMode="decimal"
                value={customMin}
                onChange={(e) => setCustomMin(Math.max(0, Number(e.target.value) || 0))}
              />
              <span>min</span>
            </div>
          </label>
        )}

        {paceMode === 'ib' && (
          <label className="select-label">
            Exam pace
            <select value={ibPaceId} onChange={(e) => setIbPaceId(e.target.value)}>
              {SUBJECTS.map((subj) => (
                <optgroup key={subj} label={`IB ${subj} — Paper 1A`}>
                  {BUILTIN_PRESETS.filter((p) => p.subject === subj).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.level} · {formatSeconds(presetPaceMs(p))} per mark
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        )}

        <div className="pace-readout">
          {targetMs != null ? (
            <>
              <span className="pace-value">{formatSeconds(targetMs)}</span>
              <span className="pace-unit">per mark</span>
            </>
          ) : (
            <span className="pace-none">No target pace</span>
          )}
        </div>
      </section>

      <section className="card">
        <h2>2 · How many marks?</h2>
        <div className="stepper">
          <button type="button" className="step-btn" onClick={() => changeMarks(markCount - 1)} aria-label="One fewer mark">
            −
          </button>
          <input
            type="number"
            min="1"
            max="200"
            inputMode="numeric"
            className="count-input"
            value={markCount}
            onChange={(e) => changeMarks(Number(e.target.value))}
          />
          <button type="button" className="step-btn" onClick={() => changeMarks(markCount + 1)} aria-label="One more mark">
            +
          </button>
        </div>
        <div className="quick-chips">
          {[5, 10, 15, 20].map((n) => (
            <button key={n} type="button" className="chip" onClick={() => changeMarks(n)}>
              {n}
            </button>
          ))}
        </div>
        <label className="select-label from-exam">
          Or use an IB exam's length
          <select
            value=""
            onChange={(e) => {
              const p = BUILTIN_PRESETS.find((x) => x.id === e.target.value)
              if (p) changeMarks(p.questions)
            }}
          >
            <option value="" disabled>
              Set marks from an exam…
            </option>
            {BUILTIN_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.subject} {p.level} · {p.questions} marks
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="summary-card">
        <div className="summary-line">
          <strong>{markCount}</strong> marks
          {targetMs != null && (
            <>
              {' '}
              · <strong>{formatSeconds(targetMs)}</strong> each
            </>
          )}
        </div>
        <div className="summary-total">
          {totalMs != null ? (
            <>
              Total practice time <strong>{formatDuration(totalMs)}</strong>
            </>
          ) : (
            <span className="untimed">Untimed — finish whenever you're done</span>
          )}
        </div>
        <button type="button" className="btn-start" onClick={start}>
          Start practice
        </button>
      </section>
    </div>
  )
}

export default Setup
