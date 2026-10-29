# Prayog Studio

Physics-true animations + triple-verified JEE practice, built for JEE teachers.
**Source of truth: `PROJECT_BRIEF.md`.** At the start of every session, re-read it, this file and `PROGRESS.md`.

## The user
- A beginner, on **Windows** (PowerShell). Explain in simple words; one short "what and why" before each big step.
- One phase at a time. Each phase ends with: tests + production build green → update PROGRESS.md → git commit → report (built / how to see / what to check / next) → wait for "next".
- Anything outside the project (global installs, accounts, API keys, anything that costs money): stop and show the **ACTION NEEDED** box from the brief.
- Never ask for keys or passwords in chat; they go in `.env.local` (git-ignored, server-side only, no `NEXT_PUBLIC_`).
- Same error 3 times → stop and offer 2–3 options.

## Stack
Next.js 16 (App Router) + TypeScript + Tailwind v4 · Remotion 4 (`@remotion/player` in the browser, CLI for MP4) · KaTeX · zod · Vitest.
Started from Remotion's official Next.js template; its AWS Lambda parts were removed (we render locally).
Next.js 16 is newer than most training data: check `node_modules/next/dist/docs/` before using a Next API (see `AGENTS.md`).
Remotion agent skills live in `.claude/skills/` — load `remotion-best-practices` before writing Remotion code.
All Remotion packages must stay on the **same exact version**. `overrides.zod` in package.json forces one patched zod.

## Commands
- `npm run dev` — web app at http://localhost:3000
- `npm test` — verification suite (Vitest, `tests/**/*.test.ts`)
- `npm run build` — production build
- `npm run lint` · `npx tsc --noEmit`
- `npm run remotion` — Remotion Studio (entry `src/remotion/index.ts`); use `--port 3001` while `npm run dev` runs
- Lab: http://localhost:3000/lab/projectile
- `npm run render:short -- projectile` / `npm run render:explainer -- projectile` — MP4s + cover PNGs (en + hi) into `renders/`. Flags: `--lang=en`, `--frames=0,300` (PNG check frames into `renders/check/`), `--safe-zones`.
- Voiceover: `public/voice/<template>-<format>-<lang>/<beat>.mp3` (see `public/voice/README.md`).

## Video structure
Compositions are `<template>-<format>` (+ `-cover` stills, + `projectile-lab`). Words live in `script.ts` (en + hi, `{{placeholders}}` filled from the solver, `$…$` = KaTeX); beat timing in `videoPlan.ts`; text-box positions in `videoLayout.ts` (Short boxes are tested against `SHORTS_SAFE`). Scene building blocks in `parts.tsx` work in both `LANDSCAPE` and `PORTRAIT` (`world.ts`).

## Non-negotiables
- **Physics-true:** every frame computed from equations, never hand-keyed. A scene is a pure function of (frame, params): no unseeded randomness, no clocks. Physical objects never use easing (UI may).
- **Triple-verified:** closed-form solver = independent numerical simulation = stated answer, enforced by tests. Unverified → "Needs teacher review", never "Verified". No hard-coded badges, placeholder numbers or mock data shown as real.
- **AI for language, code for truth:** AI never produces final numbers; solvers do. Every AI response is zod-validated.
- **Conventions:** SI units. g = 10 m/s² unless stated ("Real world" lab mode: 9.8). 37°/53° → sin 37° = 3/5, cos 37° = 4/5. Solver and simulation take the same derived inputs. Answers stored as `{ value, unit, exact? }`; show exact form else 3 s.f.
- **Look:** "chalkboard at night". One colour per quantity (CSS tokens in `styles/global.css`, literal values in `src/theme.ts`; keep both in sync): velocity blue, acceleration orange, force pink, displacement yellow — always plus a label and a distinct arrowhead style (`src/components/Arrow.tsx`, colour-blind safe). Kan's own accent is mint. KaTeX for all maths. Big, phone-readable type.
- **Originality:** mascot Kan, visuals, questions, scripts all original. Nothing from "Animation vs. Physics" except the idea. No Vedantu branding. Flag any uncertain physics/JEE fact instead of guessing.
