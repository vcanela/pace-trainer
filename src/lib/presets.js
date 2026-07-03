// Built-in pace presets for IB papers that are purely multiple choice with a
// set time. Each preset describes a full reference paper (questions + minutes),
// from which we derive a target pace (time per question).
//
// IMPORTANT: IB does not publish a separate official duration for Paper 1A — it
// is sat together with Paper 1B in one session (SL 1h30, HL 2h). These minutes
// are the widely-recommended split (≈40 min for the 1B data section, the rest
// for 1A). Physics figures are as published by exam-prep sources; Chemistry and
// Biology use the same 1B split. Treat them as a sensible default and adjust
// with a custom preset if your teacher gives different guidance.
export const BUILTIN_PRESETS = [
  { id: 'phys-sl', subject: 'Physics', level: 'SL', questions: 25, minutes: 50 },
  { id: 'phys-hl', subject: 'Physics', level: 'HL', questions: 40, minutes: 80 },
  { id: 'chem-sl', subject: 'Chemistry', level: 'SL', questions: 30, minutes: 50 },
  { id: 'chem-hl', subject: 'Chemistry', level: 'HL', questions: 40, minutes: 80 },
  { id: 'bio-sl', subject: 'Biology', level: 'SL', questions: 30, minutes: 50 },
  { id: 'bio-hl', subject: 'Biology', level: 'HL', questions: 40, minutes: 80 },
]

export function presetPaceMs(preset) {
  if (!preset || !preset.questions) return 0
  return (preset.minutes * 60 * 1000) / preset.questions
}

export function presetLabel(preset) {
  if (!preset) return ''
  if (preset.custom) return preset.name
  return `${preset.subject} ${preset.level} — Paper 1A`
}
