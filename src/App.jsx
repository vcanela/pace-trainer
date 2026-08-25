import { useState } from 'react'
import Setup from './pages/Setup.jsx'
import Run from './pages/Run.jsx'
import Report from './pages/Report.jsx'

// The app is a simple linear flow: setup -> run -> report -> (back to setup).
// State is held here and passed down rather than routed by URL.
function App() {
  const [phase, setPhase] = useState('setup') // 'setup' | 'run' | 'report'
  const [config, setConfig] = useState(null) // { label, markCount, targetMs|null }
  const [result, setResult] = useState(null) // { durations, flags }

  const startRun = (cfg) => {
    setConfig(cfg)
    setResult(null)
    setPhase('run')
  }

  const finishRun = (res) => {
    setResult(res)
    setPhase('report')
  }

  const newRun = () => {
    setPhase('setup')
  }

  const repeatRun = () => {
    setResult(null)
    setPhase('run')
  }

  if (phase === 'run') {
    return <Run config={config} onFinish={finishRun} onCancel={newRun} />
  }
  if (phase === 'report') {
    return <Report config={config} result={result} onNew={newRun} onRepeat={repeatRun} />
  }
  return <Setup onStart={startRun} />
}

export default App
