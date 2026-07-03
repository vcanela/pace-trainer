const PRESETS_KEY = 'paceTrainer:presets:v1'
const HISTORY_KEY = 'paceTrainer:history:v1'

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full / unavailable — non-fatal
  }
}

// ---- Presets: named { name, questionCount, totalMinutes } ----
export function loadPresets() {
  return read(PRESETS_KEY, [])
}

export function savePreset(preset) {
  const presets = loadPresets()
  // Replace a preset with the same (case-insensitive) name, else append.
  const idx = presets.findIndex(
    (p) => p.name.trim().toLowerCase() === preset.name.trim().toLowerCase(),
  )
  if (idx >= 0) presets[idx] = preset
  else presets.push(preset)
  write(PRESETS_KEY, presets)
  return presets
}

export function deletePreset(name) {
  const presets = loadPresets().filter((p) => p.name !== name)
  write(PRESETS_KEY, presets)
  return presets
}

// ---- History: completed sessions ----
export function loadHistory() {
  return read(HISTORY_KEY, [])
}

export function saveSession(session) {
  const history = loadHistory()
  history.unshift(session) // newest first
  const trimmed = history.slice(0, 50) // keep the last 50
  write(HISTORY_KEY, trimmed)
  return trimmed
}

export function deleteSession(id) {
  const history = loadHistory().filter((s) => s.id !== id)
  write(HISTORY_KEY, history)
  return history
}

export function clearHistory() {
  write(HISTORY_KEY, [])
  return []
}
