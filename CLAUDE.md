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
- `npm run remotion` — Remotion Studio (entry `src/remotion/index.ts`)

## Non-negotiables
- **Physics-true:** every frame computed from equations, never hand-keyed. A scene is a pure function of (frame, params): no unseeded randomness, no clocks. Physical objects never use easing (UI may).
- **Triple-verified:** closed-form solver = independent numerical simulation = stated answer, enforced by tests. Unverified → "Needs teacher review", never "Verified". No hard-coded badges, placeholder numbers or mock data shown as real.
- **AI for language, code for truth:** AI never produces final numbers; solvers do. Every AI response is zod-validated.
- **Conventions:** SI units. g = 10 m/s² unless stated ("Real world" lab mode: 9.8). 37°/53° → sin 37° = 3/5, cos 37° = 4/5. Solver and simulation take the same derived inputs. Answers stored as `{ value, unit, exact? }`; show exact form else 3 s.f.
- **Look:** "chalkboard at night". One colour per quantity (tokens in `styles/global.css`, Tailwind `text-velocity` etc.): velocity blue, acceleration orange, force pink, displacement yellow — always plus a label and a distinct arrowhead style (colour-blind safe). KaTeX for all maths. Big, phone-readable type.
- **Originality:** mascot Kan, visuals, questions, scripts all original. Nothing from "Animation vs. Physics" except the idea. No Vedantu branding. Flag any uncertain physics/JEE fact instead of guessing.
