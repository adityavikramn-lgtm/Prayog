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

### Application videos (2026-10-29), done ahead of Phase 3 at the user's request
- References checked: "Animation vs. Physics" (idea only) and a Vedantu JEE English class on Electrostatics / Coulomb's force, so CURRENT_TOPICS = Electrostatics and Coulomb's law was pulled forward from Phase 4.
- Coulomb engine: `src/physics/coulomb.ts` (k = 9×10⁹, e = 1.6×10⁻¹⁹ JEE values; force, superposition, release speeds, null point), `src/templates/coulomb/simulate.ts` (independent RK4 of two released charges), `model.ts` (all video setups), tests: inverse square, third law, triangle 0.9√3 N, null point 10 cm (closed form + bisection), 40 random release cases (energy formula vs RK4, momentum = 0), energy conserved along drawn samples.
- `coulomb-explainer` (16:9, 4 min 52 s, en + hi): hook → charges → law (Kan drags r, live F–r graph) → third law → released from rest (live RK4 vs energy formula, KE/U bars) → superposition (head-to-tail vectors) → pause & predict → reveal (test charge finds the null point) → recap/CTA. Plus cover.
- `teacher-demo` (16:9, 2 min 33 s, English): the pitch. Problem (a real AI-style slip vs the checked answer) → "AI for language, code for truth" → templates for Vedantu JEE teachers (real scenes playing live; DPP and paste-a-question clearly marked "coming next, not built yet") → 4-step workflow (live formula vs RK4 check) → proof numbers read from `src/generated/stats.json` (`npm run stats`) and `render-times.json` (written by the render script) → weekly offer → "Made by Adithya Vikram for the Vedantu JEE content role". Vedantu appears as text only; no logo, colours or copied layouts; no teacher named.
- Shared video UI (`src/video/ui.tsx`), Kan +/− charge badge, open-triangle force arrowheads.

### Rough-hemisphere explainer (2026-10-29), from a question the user sent
- Question (reworded, not copied): block dragged slowly up a rough fixed hemisphere by a string along the surface; work by the man. Answer W = mgR(1 + μ); friction part = μmg × horizontal distance.
- `src/physics/hemisphere.ts` (forces, W(φ), total), `src/templates/hemisphere/simulate.ts` (independent step-by-step drag: forces from balance, T·ds summed, energy books), tests: worked example 30 J, 50 random cases within 0.1 %, gravity −mgR and friction −μmgR, wrong options (20 J, 35.7 J) tied to named mistakes.
- `hemisphere-explainer` (16:9, 5 min 30 s without voice, English): hook → setup → free-body diagram (arrows to scale) → integral with a filling work bar → horizontal-distance insight → traps → worked numbers + simulation → recap/CTA. The man's rope keeps its length, so he walks right by the arc the block climbs.
- Voice: `scripts/voice.mts` (ElevenLabs REST, one MP3 per line, previous/next text for flow; `--dry-run` uses no credits). Per-line timing in `plan.ts` so captions and visuals follow the voice.
- Rewritten as a full lesson at the user's request: the complete question shown and read first, then every idea from zero (what work is, each force, why "slowly" means balance, the angle and ds = R dφ, splitting mg, balancing, setting up and doing the two integrals), the answer, its meaning, numbers, traps, recap. 15 beats, 76 lines, each line can add a formula to the board panel and switch on a drawing. Expanded again (user asked for more, zero confusion): a "how to attack it" plan, a sine/cosine refresher (splitting any force), a slow zoomed-in resolution of the weight (radius ⟂ surface, why gravity makes φ with the surface and 90° − φ with the radius, mg cos φ and mg sin φ, end checks), balancing with "out = in" / "up = down" and why each force is or isn't in a direction, and a second method (work-energy theorem). 18 beats, 106 lines, 13 min 11 s with the free Windows voice. (Earlier version: 8 min 50 s (Microsoft Mark, `--engine=windows`); Everygen voices need a paid Everygen plan, ElevenLabs needs a key.

### ASE102 Unit III lesson: alloys and phase diagrams (2026-10-31), for the user's own exam
- Source: the course syllabus (ASE102.pdf, Unit III) and the textbook (Callister, Ch. 10, plus Section 5.4 for solid solutions). The user's handwritten notes cover Units I–II only; "ASE102 note 2.pdf" is an empty file.
- `src/templates/phase/`: `model.ts` (diagram lines anchored to the book's points, lever rule, Gibbs rule, water P–T curves from Clausius–Clapeyron, steel microstructure fractions), `script.ts` (22 sections, 187 lines, automatic spoken reading of symbols and numbers), `parts.tsx` (diagrams, Voronoi grains, lamellae, fraction bars), `Explainer.tsx` (scenes, sounds, cover).
- Covers every syllabus topic: definitions, solubility limit, phases/equilibrium/metastable, why we alloy, substitutional vs interstitial and Hume-Rothery, unary (water), binary axes, Cu–Ni isomorphous, reading a diagram, lever rule (seesaw + mass balance), cooling Cu–Ni with live tie line and growing grains, coring, Gibbs rule, Cu–Ag eutectic, Pb–Sn and solder, the four eutectic microstructures, eutectic/eutectoid/peritectic (Cu–Zn), Fe–Fe₃C, eutectoid/hypo/hypereutectoid steels, the three syllabus diagrams, quiz, recap.
- Microstructure areas are the lever-rule fractions (grains shrunk by √w), and proeutectoid amounts while cooling come from the lever rule on the drawn lines.
- Tests (25): lever rule vs mass balance (200 tie lines), book values (31.5/42.5 → 0.68/0.32; 11/98 → 0.67/0.33; pearlite 0.89/0.11; 0.40 % C → 0.51/0.49; 1.20 % C → 0.93/0.07; primary α 0.50), carbon/tin balances, lines meet at invariant points, Gibbs cases, water curves, area fractions, script fully speakable, syllabus coverage.
- Voice: `npm run voice -- phase --engine=clone --emotion=0.7 --bass=5`; render `npm run render:explainer -- phase`.

### ASE102 Unit II lesson: imperfections in solids and strengthening (2026-10-31)
- About 10 minutes, same style and voice as Unit III. Sources: syllabus Unit II, the user's notes 3–4, Callister Ch. 5 (defects) and Ch. 8 (strengthening, recovery, recrystallization, grain growth).
- `src/templates/defects/`: `model.ts` (vacancies Nv = N e^(−Qv/kT) with the book's copper example, Peierls–Nabarro slip profile for the moving edge dislocation, Hall–Petch, %CW, Avrami and d² − d0² = Kt for the annealing drawings), `script.ts` (12 sections, 71 lines), `Explainer.tsx` (reuses the Unit III drawing blocks).
- Hall–Petch numbers are labelled "example values" (σ0 = 70 MPa, ky = 0.74 MPa·m½); the strength/ductility vs annealing curve is labelled "shape only".
- Tests (16): Example 5.1 two ways, slip profile limits, Hall–Petch linear in d^(−1/2), Example 8.2 35.6 %CW two ways, quiz 36 %, annealing laws, script speakable, syllabus coverage, length.
- Voice: `npm run voice -- defects --engine=clone --emotion=0.7 --bass=5`; render `npm run render:explainer -- defects`.

### Student solver in 3D: /solve (2026-10-31), Phase 5 reshaped for students (user's choices: Gemini free tier; projectile, incline, circular + banking, SHM)
- `src/solver/`: six checked question types (projectile from a height, block on an incline (released or pushed up), banked/flat road, conical pendulum, spring, pendulum). Each solves with formulas and is checked by an independent RK4 run (or a force-balance bisection for the banked road); "verified" only when every pair agrees to 0.1 %. JEE trig (37°/53°) built in.
- `src/solve3d/`: three.js scenes (@react-three/fiber + drei) driven by the same motion functions as the answer; arrows with a different head per quantity (solid / double / open cone); labels as canvas sprites (drei Html labels broke when they mounted and unmounted every frame); live readout + energy bars outside the canvas; play/pause/scrub/speed; camera steps back on phones.
- `/solve`: type or photograph a question → `/api/read` (Gemini, server-side, key from `.env.local` only) returns the topic + numbers (zod-checked, only known keys kept) → numbers shown for the student to confirm → code solves. Unsupported topics: AI-only text clearly marked "Not verified, needs teacher review", no 3D. Works fully without a key (pick the topic, type the numbers).
- Gemini: `interactions` endpoint, `x-goog-api-key`, model from `GEMINI_MODEL` (default `gemini-3.5-flash-lite`, checked in Google's docs on 2026-10-31). Per-IP limit 15 requests / 10 min (per server instance).
- Site colour tokens in `styles/global.css` synced with `src/theme.ts` (navy).
- Tests (27): every example formula = simulation, hand-checked JEE values, 240 seeded random questions, banked force balance, bad input → plain error, AI reply parsing/cleaning, AI never answers supported types.

## Next
- /solve: add the Gemini key (ACTION NEEDED) and test 5 real questions incl. photos; then Phase 6: GitHub + Vercel public link.
- Generate the ElevenLabs voice once the key and voice id are in `.env.local`, then re-render.
- Phase 3: verified question engine: 15 original questions, verification suite, "Watch this question", variants, DPP builder, /verified page.
- A Coulomb lab page (`/lab/coulomb`) and a Coulomb Short.

## Known issues / open questions
- Gemini free-tier limits are shown only in AI Studio (not in the docs pages); on the free tier Google may use prompts to improve its products. The per-IP limit is in memory, so on Vercel it is per server instance (best effort).
- The Gemini interactions request/response shape was taken from the docs but not yet tested with a real key.
- Phase diagrams: key points are the textbook values; curves between them are smooth approximations (fine for reading shapes, not for reading 3 s.f. off the curve). The Fe–C δ corner uses standard handbook compositions (0.09 / 0.17 / 0.53 wt% C); the book text gives only 1493 °C.
- ElevenLabs: their pricing page lists the commercial licence under the paid Starter plan, not Free. Fine for an application demo; check before monetised or company use.
- Hemisphere video assumes the string stays tangent to the surface and the string itself slides without friction (stated on screen).
- Hinglish lines are a draft; a Hindi-speaking teacher should review them before publishing.
- Shorts safe-zone margins are common practice (YouTube publishes no exact sizes).
- Remotion warns that it expects zod 4.5.4 exactly; we force 4.6.7 (security fix). Studio and all renders work.
- Honest note: without air resistance, acceleration is constant, so RK4 is almost exact for projectiles. The check still tests landing/top detection and the formulas; harder checks come with later topics.
- Launches start and land at the same height (ground level) for now; cliff/height questions come in Phase 3.
- `noUnusedLocals` is off in tsconfig because Next's generated `.next/dev/types/validator.ts` breaks it; ESLint still flags unused code.
- npm prints a peer-dependency warning about `@remotion/eslint-plugin` and ESLint 9; it comes from the template and is harmless.
