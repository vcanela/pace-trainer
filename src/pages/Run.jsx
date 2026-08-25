import { useCallback, useEffect, useRef, useState } from 'react'
import './Run.css'

function Run({ config, onFinish, onCancel }) {
  const { markCount, targetMs } = config
  const hasTarget = targetMs != null && targetMs > 0
  const totalMs = hasTarget ? markCount * targetMs : null

  const startedAtRef = useRef(Date.now())
  const [lapTimes, setLapTimes] = useState([]) // absolute timestamps, one per finished mark
  const [flags, setFlags] = useState([]) // 0-based indexes flagged
  const [currentFlagged, setCurrentFlagged] = useState(false)

  const answered = lapTimes.length
  const currentNumber = Math.min(answered + 1, markCount)
  const finishedRef = useRef(false)

  const deriveDurations = useCallback((times) => {
    const start = startedAtRef.current
    return times.map((t, i) => t - (i === 0 ? start : times[i - 1]))
  }, [])

  // Keep a live ref to the finish logic so the auto-stop interval always calls
  // the latest version (with current laps/flags).
  const finishRef = useRef(() => {})
  useEffect(() => {
    finishRef.current = () => {
      if (finishedRef.current) return
      finishedRef.current = true
      onFinish({
        durations: deriveDurations(lapTimes),
        flags,
        elapsedMs: Date.now() - startedAtRef.current,
      })
    }
  }, [lapTimes, flags, deriveDurations, onFinish])

  const lap = useCallback(() => {
    if (finishedRef.current) return
    setLapTimes((prev) => {
      if (prev.length >= markCount) return prev
      const next = [...prev, Date.now()]
      return next
    })
    setFlags((prevFlags) => {
      if (currentFlagged) return [...prevFlags, lapTimes.length]
      return prevFlags
    })
    setCurrentFlagged(false)
  }, [markCount, currentFlagged, lapTimes.length])

  const undo = useCallback(() => {
    if (finishedRef.current) return
    setLapTimes((prev) => {
      if (prev.length === 0) return prev
      const removedIndex = prev.length - 1
      setFlags((prevFlags) => {
        const wasFlagged = prevFlags.includes(removedIndex)
        setCurrentFlagged(wasFlagged)
        return prevFlags.filter((i) => i !== removedIndex)
      })
      return prev.slice(0, -1)
    })
  }, [])

  const toggleFlag = useCallback(() => {
    if (finishedRef.current) return
    setCurrentFlagged((f) => !f)
  }, [])

  const endNow = useCallback(() => finishRef.current(), [])

  // Finish automatically when all marks are lapped.
  useEffect(() => {
    if (lapTimes.length >= markCount) {
      finishRef.current()
    }
  }, [lapTimes.length, markCount])

  // Auto-stop when the total time runs out (blind — no clock shown to the user).
  // Only applies when a pace/target was set; with no target the run is untimed.
  useEffect(() => {
    if (totalMs == null) return undefined
    const id = setInterval(() => {
      if (Date.now() - startedAtRef.current >= totalMs) {
        finishRef.current()
      }
    }, 250)
    return () => clearInterval(id)
  }, [totalMs])

  // Keyboard: Space/Enter = lap, F = flag, Backspace = undo.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        lap()
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        toggleFlag()
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [lap, toggleFlag, undo])

  return (
    <div className="run">
      <button
        type="button"
        className={`tap-zone ${currentFlagged ? 'is-flagged' : ''}`}
        onClick={lap}
      >
        <span className="run-progress">Mark</span>
        <span className="run-number">{currentNumber}</span>
        <span className="run-total">of {markCount}</span>
        <span className="run-hint">Tap anywhere (or press Space) when you finish each question</span>
        {currentFlagged && <span className="flag-chip">⚑ Flagged</span>}
      </button>

      <footer className="run-footer">
        <button type="button" className="foot-btn" onClick={undo} disabled={answered === 0}>
          ↶ Undo
        </button>
        <button type="button" className={`foot-btn flag-btn ${currentFlagged ? 'active' : ''}`} onClick={toggleFlag}>
          ⚑ {currentFlagged ? 'Flagged' : 'Flag'}
        </button>
        <button type="button" className="foot-btn end-btn" onClick={endNow}>
          Finish
        </button>
        <button type="button" className="foot-btn cancel-btn" onClick={onCancel}>
          Cancel
        </button>
      </footer>
    </div>
  )
}

export default Run
