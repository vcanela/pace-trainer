# Pace Trainer

A personal exam time-management trainer. Set up a practice set (number of
questions × total time), then **lap** each question as you finish it. During the
run there's no clock — just the question number and a big tap button — so you
train your internal pacing instinct. At the end you get a report of where your
time went.

Built as a companion to [Exam Station](https://github.com/vcanela/exam-station),
but a separate, student-facing app.

## Running locally

```
npm install
npm run dev
```

## How it works

- **Setup** — enter questions + minutes (or load a saved preset). It shows your
  target pace, e.g. 40 Q in 60 min → 1:30 per question.
- **Run (blind)** — tap anywhere / press `Space` to finish a question, `F` to
  flag one to revisit, `Backspace` to undo a mis-tap. It auto-stops when the
  total time runs out.
- **Report** — average vs target, per-question bars against the target line,
  flags for questions that ran long or were very quick (raw times shown too),
  and a history of past sessions saved on the device.

## Building

```
npm run build
```

Outputs a static site to `dist/`, including a service worker so it works offline
once loaded (installable as a PWA on a phone).
