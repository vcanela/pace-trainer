import { useState } from 'react'
import Setup from './pages/Setup.jsx'
import Run from './pages/Run.jsx'
import Report from './pages/Report.jsx'
import Progress from './pages/Progress.jsx'

// The app is a simple linear flow: setup -> run -> report -> (back to setup),
// with a progress screen reachable from setup and report.
function App() {
  const [phase, setPhase] = useState('setup') // 'setup' | 'run' | 'report' | 'progress'
  const [config, setConfig] = useState(null) // { label, markCount, targetMs|null }
  const [result, setResult] = useState(null) // { durations, flags, elapsedMs }

  const startRun = (cfg) => {
    setConfig(cfg)
    setResult(null)
    setPhase('run')
  }

  const finishRun = (res) => {
    setResult(res)
    setPhase('report')
  }

  const newRun = () => setPhase('setup')
  const repeatRun = () => {
    setResult(null)
    setPhase('run')
  }
  const showProgress = () => setPhase('progress')

  if (phase === 'run') {
    return <Run config={config} onFinish={finishRun} onCancel={newRun} />
  }
  if (phase === 'report') {
    return (
      <Report
        config={config}
        result={result}
        onNew={newRun}
        onRepeat={repeatRun}
        onProgress={showProgress}
      />
    )
  }
  if (phase === 'progress') {
    return <Progress onBack={newRun} />
  }
  return <Setup onStart={startRun} onProgress={showProgress} />
}

export default App
