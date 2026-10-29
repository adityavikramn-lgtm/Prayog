# Progress

## Done
### Phase 0: Setup (2026-10-29)
- Environment: Node v24.19.0 (LTS "Krypton"; v26 became the newest LTS on 2026-10-28, upgrade optional), npm 11.17.0, Git 2.55.0, 68 GB free. Project at `C:\Projects\prayog-studio` (outside OneDrive).
- Scaffolded with `npx create-video@latest --next --tailwind`; removed the template's AWS Lambda rendering and demo components.
- Packages: next 16.4.3, remotion + @remotion/player 4.0.539, katex, zod 4.6.7, vitest. `npm audit`: 0 vulnerabilities.
- Remotion agent skills installed in `.claude/skills/`.
- CLAUDE.md, PROGRESS.md, PROJECT_BRIEF.md.

### Phase 1: Physics core, Kan, first scene (2026-10-29)
- `src/physics/`: closed-form projectile solver (`projectile.ts`), generic RK4 + event location by bisection (`rk4.ts`), 3-s.f. formatting, seeded random.
- `src/templates/projectile/`: `model.ts` (zod params, g presets, JEE trig convention for 37°/53°), `simulate.ts` (RK4 measures T, H, R by detecting y = 0 and v_y = 0), `timeline.ts` (beats; constant playback rate shown on screen when ≠ 1×), `Scene.tsx`, `Lab.tsx`, `LabPlayer.tsx`.
- `src/mascot/`: Kan (SVG) with calm / excited / scared / dizzy / proud, eyes follow velocity, squash and stretch, arms only when holding something; `pose.ts` maps physics state → mood.
- Scene: equal-time strobe dots, trail, v / v_x / v_y / g arrows (distinct heads), live KaTeX panel with numbers substituted, apex (v_y = 0, H) and landing (R) markers, Earth (JEE 10 / real 9.8) / Moon / Mars presets. Signature move: Kan pulls θ out of R = u² sin 2θ / g and drags it 75° → 15° → 45° (max range), then shows θ and 90° − θ landing together.
- `/lab/projectile`: Player at 60 fps with play / pause / scrub, sliders, presets, toggles, draggable θ in the formula (mouse, touch, arrow keys), and a live "formula vs RK4" table computed in the browser.
- Remotion composition `Projectile` (1920×1080, 30 fps, duration from the physics) opens in Studio.
- Tests (110): RK4 alone on SHM (error < 1e-9), hand-checked JEE values, R = u² sin 2θ / g, complementary angles, 45° maximum, v_y = 0 at apex, 100 seeded random launches closed form vs RK4 (< 0.1 %; actual differences ~1e-11 %), formatting, validation.

### Phase 2: Video factory (2026-10-29)
- Scene split into shared parts (`parts.tsx`, `world.ts`) that work in 16:9 and 9:16; the lab uses the same parts.
- `script.ts`: beats hook → concept → demo → (explainer: θ sweep) → pause & predict (30° vs 60°) → reveal → call to action, in English and Hinglish (draft). Numbers are `{{placeholders}}` filled by the solver; the exact answer 20√3 m is checked in tests.
- `videoPlan.ts`: beat timing; flights at one constant rate (shown on screen); a voiceover clip stretches its beat.
- Compositions: `projectile-short` (1080×1920, 36.3 s, loops: last frame = first frame), `projectile-explainer` (1920×1080, 61.1 s), and a cover still for each. Optional Shorts safe-zone overlay (`--safe-zones`).
- Voiceover slot: `public/voice/<template>-<format>-<lang>/<beat>.mp3` (see the README there). No music.
- `npm run render:short -- projectile` / `render:explainer` → `renders/` (en + hi MP4 + cover PNG), H.264 yuv420p. All four videos render in about 2 minutes.
- Tests (127): script complete in both languages, Roman-script Hinglish, placeholders filled, captions short enough for 3 lines, physics claims (complementary angles, sin 60° = sin 120°, 45° max), Short 30–45 s / explainer 60–90 s, beat and event order, voiceover stretching, Short text boxes inside the safe area.

## Next
- Phase 3: verified question engine: 15 original questions, verification suite, "Watch this question", variants, DPP builder, /verified page.

## Known issues / open questions
- `MY_NAME` and `CURRENT_TOPICS` in PROJECT_BRIEF.md section 0 are still blank.
- Hinglish lines are a draft; a Hindi-speaking teacher should review them before publishing.
- Shorts safe-zone margins are common practice (YouTube publishes no exact sizes).
- Remotion warns that it expects zod 4.5.4 exactly; we force 4.6.7 (security fix). Studio and all renders work.
- Honest note: without air resistance, acceleration is constant, so RK4 is almost exact for projectiles. The check still tests landing/top detection and the formulas; harder checks come with later topics.
- Launches start and land at the same height (ground level) for now; cliff/height questions come in Phase 3.
- `noUnusedLocals` is off in tsconfig because Next's generated `.next/dev/types/validator.ts` breaks it; ESLint still flags unused code.
- npm prints a peer-dependency warning about `@remotion/eslint-plugin` and ESLint 9; it comes from the template and is harmless.
