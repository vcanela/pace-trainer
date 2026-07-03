import { useMemo, useState } from 'react'
import { BUILTIN_PRESETS, presetPaceMs, presetLabel } from '../lib/presets'
import { loadCustomPresets, saveCustomPreset, deleteCustomPreset, loadHistory } from '../lib/storage'
import { formatSeconds, formatDuration } from '../lib/report'
import './Setup.css'

const SUBJECTS = ['Physics', 'Chemistry', 'Biology']

function Setup({ onStart }) {
  const [customPresets, setCustomPresets] = useState(loadCustomPresets)
  const allPresets = useMemo(() => [...BUILTIN_PRESETS, ...customPresets], [customPresets])

  const [selectedId, setSelectedId] = useState('phys-sl')
  const selected = allPresets.find((p) => p.id === selectedId) || allPresets[0]
  const paceMs = presetPaceMs(selected)

  const [count, setCount] = useState(selected.questions)
  const totalMs = count * paceMs
  const historyCount = loadHistory().length

  // Custom preset form
  const [showCustom, setShowCustom] = useState(false)
  const [cName, setCName] = useState('')
  const [cQuestions, setCQuestions] = useState(30)
  const [cMinutes, setCMinutes] = useState(45)
  const customValid = cName.trim() && cQuestions >= 1 && cMinutes >= 1

  const changeCount = (n) => setCount(Math.max(1, Math.min(200, n)))

  const handleSaveCustom = () => {
    if (!customValid) return
    const next = saveCustomPreset({ name: cName, questions: cQuestions, minutes: cMinutes })
    setCustomPresets(next)
    setSelectedId(`custom-${cName.trim().toLowerCase()}`)
    setCName('')
    setShowCustom(false)
  }

  const handleDeleteCustom = (id) => {
    const next = deleteCustomPreset(id)
    setCustomPresets(next)
    if (selectedId === id) setSelectedId('phys-sl')
  }

  const start = () => {
    onStart({ label: presetLabel(selected), questionCount: count, targetMs: paceMs })
  }

  return (
    <div className="setup">
      <header className="setup-header">
        <h1>Pace Trainer</h1>
        <p className="tagline">
          Pick your exam pace, choose how many questions you have, then lap each one as
          you finish. No clock while you go — just a report at the end.
        </p>
      </header>

      <section className="card">
        <h2>1 · Pace</h2>
        <label className="select-label">
          Exam
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {SUBJECTS.map((subj) => (
              <optgroup key={subj} label={`IB ${subj} — Paper 1A`}>
                {BUILTIN_PRESETS.filter((p) => p.subject === subj).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.level} · {p.questions} Q in {p.minutes} min
                  </option>
                ))}
              </optgroup>
            ))}
            {customPresets.length > 0 && (
              <optgroup label="Your presets">
                {customPresets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.questions} Q in {p.minutes} min
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
        <div className="pace-readout">
          <span className="pace-value">{formatSeconds(paceMs)}</span>
          <span className="pace-unit">per question</span>
        </div>
      </section>

      <section className="card">
        <h2>2 · How many questions?</h2>
        <div className="stepper">
          <button type="button" className="step-btn" onClick={() => changeCount(count - 1)} aria-label="One fewer question">
            −
          </button>
          <input
            type="number"
            min="1"
            max="200"
            inputMode="numeric"
            className="count-input"
            value={count}
            onChange={(e) => changeCount(Math.floor(Number(e.target.value) || 1))}
          />
          <button type="button" className="step-btn" onClick={() => changeCount(count + 1)} aria-label="One more question">
            +
          </button>
        </div>
        <div className="quick-chips">
          {[5, 10, 15, 20].map((n) => (
            <button key={n} type="button" className="chip" onClick={() => changeCount(n)}>
              {n}
            </button>
          ))}
          <button type="button" className="chip" onClick={() => changeCount(selected.questions)}>
            Full ({selected.questions})
          </button>
        </div>
      </section>

      <section className="summary-card">
        <div className="summary-line">
          <strong>{count}</strong> questions · <strong>{formatSeconds(paceMs)}</strong> each
        </div>
        <div className="summary-total">
          Total practice time <strong>{formatDuration(totalMs)}</strong>
        </div>
        <button type="button" className="btn-start" onClick={start}>
          Start practice
        </button>
      </section>

      <section className="card">
        <button type="button" className="custom-toggle" onClick={() => setShowCustom((s) => !s)}>
          {showCustom ? '▾' : '▸'} Custom presets ({customPresets.length})
        </button>
        {showCustom && (
          <div className="custom-body">
            <p className="note">
              Make your own pace from any reference paper — enter its total questions and
              minutes and it works out the per-question target.
            </p>
            {customPresets.length > 0 && (
              <ul className="custom-list">
                {customPresets.map((p) => (
                  <li key={p.id}>
                    <span>
                      <strong>{p.name}</strong> — {p.questions} Q in {p.minutes} min (
                      {formatSeconds(presetPaceMs(p))}/Q)
                    </span>
                    <button
                      type="button"
                      className="del-btn"
                      aria-label={`Delete ${p.name}`}
                      onClick={() => handleDeleteCustom(p.id)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="custom-form">
              <input
                type="text"
                placeholder="Name, e.g. SEHS SL Paper 1"
                value={cName}
                onChange={(e) => setCName(e.target.value)}
              />
              <div className="custom-nums">
                <label>
                  Questions
                  <input
                    type="number"
                    min="1"
                    value={cQuestions}
                    onChange={(e) => setCQuestions(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                  />
                </label>
                <label>
                  Minutes
                  <input
                    type="number"
                    min="1"
                    value={cMinutes}
                    onChange={(e) => setCMinutes(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                  />
                </label>
                <button type="button" className="btn-save" disabled={!customValid} onClick={handleSaveCustom}>
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <p className="disclaimer">
        IB doesn't publish a standalone time for Paper 1A (it's sat with Paper 1B), so
        built-in paces use the recommended split. Adjust with a custom preset if needed.
        {historyCount > 0 && ` · ${historyCount} saved session${historyCount === 1 ? '' : 's'}.`}
      </p>
    </div>
  )
}

export default Setup
