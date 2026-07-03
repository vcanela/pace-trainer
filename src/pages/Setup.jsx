import { useState } from 'react'
import { loadPresets, savePreset, deletePreset, loadHistory } from '../lib/storage'
import { targetMsPerQuestion, formatSeconds } from '../lib/report'
import './Setup.css'

function Setup({ onStart }) {
  const [questionCount, setQuestionCount] = useState(40)
  const [totalMinutes, setTotalMinutes] = useState(60)
  const [presets, setPresets] = useState(loadPresets)
  const [presetName, setPresetName] = useState('')
  const historyCount = loadHistory().length

  const valid = questionCount >= 1 && totalMinutes >= 1
  const targetMs = valid ? targetMsPerQuestion(questionCount, totalMinutes) : 0

  const applyPreset = (p) => {
    setQuestionCount(p.questionCount)
    setTotalMinutes(p.totalMinutes)
    setPresetName(p.name)
  }

  const handleSavePreset = () => {
    const name = presetName.trim()
    if (!name || !valid) return
    setPresets(savePreset({ name, questionCount, totalMinutes }))
  }

  const handleDeletePreset = (name) => {
    setPresets(deletePreset(name))
  }

  return (
    <div className="setup">
      <header className="setup-header">
        <h1>Pace Trainer</h1>
        <p className="tagline">
          Practise your exam pacing. Lap each question as you finish it, then get a
          report of where your time went.
        </p>
      </header>

      <section className="card">
        <h2>This practice set</h2>
        <div className="inputs">
          <label>
            Questions
            <input
              type="number"
              min="1"
              inputMode="numeric"
              value={questionCount}
              onChange={(e) => setQuestionCount(Math.max(1, Math.floor(Number(e.target.value) || 0)))}
            />
          </label>
          <span className="times">×</span>
          <label>
            Total time (min)
            <input
              type="number"
              min="1"
              inputMode="numeric"
              value={totalMinutes}
              onChange={(e) => setTotalMinutes(Math.max(1, Math.floor(Number(e.target.value) || 0)))}
            />
          </label>
        </div>

        <div className="target">
          <span className="target-label">Target pace</span>
          <span className="target-value">{valid ? formatSeconds(targetMs) : '—'}</span>
          <span className="target-unit">per question</span>
        </div>

        <button type="button" className="btn-start" disabled={!valid} onClick={() => onStart({ questionCount, totalMinutes })}>
          Start practice
        </button>
      </section>

      <section className="card">
        <h2>Presets</h2>
        {presets.length === 0 ? (
          <p className="muted">No presets yet. Save the set above to reuse it later.</p>
        ) : (
          <ul className="preset-list">
            {presets.map((p) => (
              <li key={p.name}>
                <button type="button" className="preset-apply" onClick={() => applyPreset(p)}>
                  <span className="preset-name">{p.name}</span>
                  <span className="preset-detail">
                    {p.questionCount} Q · {p.totalMinutes} min ·{' '}
                    {formatSeconds(targetMsPerQuestion(p.questionCount, p.totalMinutes))}/Q
                  </span>
                </button>
                <button
                  type="button"
                  className="preset-delete"
                  aria-label={`Delete preset ${p.name}`}
                  onClick={() => handleDeletePreset(p.name)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="save-preset">
          <input
            type="text"
            placeholder="Name this set, e.g. Bio HL Paper 1A"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
          />
          <button type="button" className="btn-save" disabled={!presetName.trim() || !valid} onClick={handleSavePreset}>
            Save
          </button>
        </div>
      </section>

      {historyCount > 0 && (
        <p className="history-note">
          You have {historyCount} saved session{historyCount === 1 ? '' : 's'} — view them from the report after your next run.
        </p>
      )}
    </div>
  )
}

export default Setup
