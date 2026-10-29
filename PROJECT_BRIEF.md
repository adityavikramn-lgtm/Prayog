Prayog Studio — Project Brief for Claude Code
 
Physics-true AI animations + triple-verified JEE practice, built for JEE teachers.
How to use this file: put it in an empty folder, open that folder in Claude Code, and say: "Read PROJECT_BRIEF.md completely and follow it. Start with Phase 0 only."
Claude: this file is the source of truth for the whole project. Re-read it at the start of every session, together with CLAUDE.md and PROGRESS.md once they exist.
0. Fill these in first (edit, then save)

```
SUBJECT        = Physics         # or Maths / Chemistry: match the teacher you are pitching
AUDIENCE       = JEE Main + JEE Advanced aspirants (Class 11-12)
LANGUAGE       = English captions + Hinglish toggle (Hindi-English mix in Roman script)
PROJECT_NAME   = Prayog Studio   # "prayog" = experiment; rename if you like
MASCOT_NAME    = Kan             # from "kan" (कण) = particle; rename if you like
MY_NAME        = Adithya Vikram  # shown in the footer and the pitch
CURRENT_TOPICS = Electrostatics (Coulomb's law)  # from the reference class: Class 12, JEE 2026

```

1. Mission
You are a senior full-stack engineer, motion designer and JEE subject expert, working with me (a beginner) on a portfolio project. I will show it to a Vedantu JEE teacher to win a part-time role making AI-powered teaching content.
The bar: it must do things almost no "AI for education" demo does, and every claim it makes must be true and checkable. Most AI tools make content that looks right. Ours proves it is right.
2. The two references: what to take, what to leave

* Reference 1: "Animation vs. Physics" by Alan Becker (YouTube). Take only the idea: a character who discovers physics by playing with it, where equations, vectors and graphs are objects the character can grab, push, ride and break. Take nothing else: no characters or look-alikes (no stick-figure cast), no scenes, gags, sounds, music, titles or thumbnails.
* Reference 2: a live JEE class on Vedantu's "JEE English" YouTube channel. Take the audience and the standard: JEE Main/Advanced level, exam-pattern questions, teacher-led explanation, fast pace, mostly phone viewers.

3. Signature features (non-negotiable)

1. Physics-true animation. Every frame is computed from real equations, never hand-keyed. Numbers on screen (velocity, height, time) are live values from the simulation. The mascot's motion is the physics, and its emotions follow it: big acceleration → scared, at rest → calm, top of the flight (v_y = 0) → floating, landing → squash.
2. Triple-verified answers. For every question, three things must agree: (a) the closed-form solver, (b) an independent numerical simulation, (c) the answer written in the solution. Automated tests enforce it. Anything not verified is labelled "Needs teacher review", never "Verified".
3. Paste a question → watch it happen. A teacher pastes or photographs a question; AI reads it, picks the matching scene template and extracts the numbers; code computes the verified answer; the animation plays that exact question. AI handles language, code handles truth.
4. Variant engine. One click makes 5 versions of any question with new numbers and new contexts, each re-verified, with answers that come out clean the way JEE answers do, printable as a DPP with an answer key.
5. One scene → three outputs. The same scene code becomes (a) a live classroom simulation with sliders the teacher can screen-share, (b) a 9:16 YouTube Short / Reel, (c) a 16:9 explainer, both rendered to MP4.
6. Teacher-first. A slot for the teacher's own voiceover, English + Hinglish captions, and every wrong option tied to a named common mistake the teacher can discuss in class.

4. How you work with me (I'm a beginner)

* Explain in simple words. One short "what and why" before each big step. No jargon dumps.
* Start every phase by showing me a short plan (I'll use Plan mode). Then build.
* Packages installed inside this project (npm): go ahead, and tell me in one line what each one is for.
* Anything outside the project (Node, Git, global tools, accounts, API keys, anything that costs money): stop and show me this box, then wait.

```
ACTION NEEDED FROM YOU
What:  ...
Why:   ...
How:   exact link or command
Then type: done

```

* Never ask me to paste an API key or password into the chat. Tell me which file to put it in (`.env.local`).
* Prefer free and open tools. Ask before anything with a cost.
* One phase at a time. At the end of each phase: run the tests and a production build, fix every error, update PROGRESS.md, make a git commit, then stop and tell me (1) what was built, (2) exactly how to see it, (3) what I should check, (4) what's next. Wait for me to say "next".
* If the same error comes back 3 times, stop and give me 2–3 options instead of looping.
* Don't add features outside the current phase. Depth over breadth.
* Never fake anything: no hard-coded "verified" badges, no placeholder numbers in finished output, no mock data shown as real.
* In Phase 0, create CLAUDE.md (short and permanent: stack, commands, the non-negotiables, that I'm a beginner on Windows) and PROGRESS.md (done / next / known issues), so any new session can continue where we stopped.

5. Tech stack (decided; ask before changing)

* Next.js (App Router) + TypeScript + Tailwind CSS: the web app and its API routes.
* Remotion: scenes are React components. `@remotion/player` gives the interactive in-browser version; the Remotion CLI renders MP4s. Start from Remotion's official Next.js template if `npx create-video@latest` offers one; otherwise scaffold Next.js and add Remotion. Install Remotion's official agent skills in this project (`npx skills add remotion-dev/skills`) and follow them. If that command needs interactive answers, give me the exact command to run myself.
* KaTeX for equations, Vitest for the verification suite, zod to validate data and every AI response.
* AI layer (Phase 5 only): `AI_PROVIDER` = `gemini` or `anthropic`, model ID from an env var. Look up the current model IDs and SDK usage in the official docs at that time; don't guess.
* Deploy: GitHub + Vercel.
* Windows: I'm on Windows. Use commands that work in PowerShell. The project folder must not be inside OneDrive.

6. Architecture

```
src/
  physics/            pure deterministic functions, no React: closed-form solvers, RK4 integrator
  templates/
    projectile/       one folder per scene template
      model.ts        zod params schema, units, valid ranges, solve(params) -> results
      simulate.ts     numerical simulation with fixed dt -> measured results
      Scene.tsx       Remotion composition: picture = f(frame, params)
      script.ts       beats for Short + explainer, English and Hinglish
      questions.json  question bank (verified by tests)
      variants.ts     rules for new numbers that keep answers clean
  mascot/             Kan as an SVG React component; pose/expression = f(physics state)
  ai/                 provider layer, prompts, zod schemas (Phase 5)
  app/                pages: /  /lab/[template]  /questions  /dpp  /studio  /verified
  remotion/           Remotion entry + composition registry (9:16 and 16:9 per template)
tests/                verification suite
renders/              MP4 output (git-ignored)
demo-kit/             Phase 7 deliverables

```

Rules:

* A scene is a pure function of (frame, params): same inputs, same picture. No unseeded randomness, no real-time clocks.
* SI units everywhere.
* JEE conventions: questions use g = 10 m/s² unless stated; when 37° / 53° appear, use sin 37° = 3/5 and cos 37° = 4/5. Every question states its conventions in the text, and the solver and the simulation take the same derived inputs (e.g. u_x = 4u/5, u_y = 3u/5), so the checks compare like with like. "Real world" mode in /lab uses g = 9.8.
* Answers are stored as `{ value, unit, exact? }` (e.g. `exact: "20\\sqrt{3}"`). Show the exact form when available, otherwise 3 significant figures.
* The AI never produces final numbers. Numbers always come from solvers.

7. Look and feel

* A distinct identity, not a generic template: dark "chalkboard at night" background, chalk-white strokes, and one consistent colour per physical quantity across every scene (velocity, acceleration, force, displacement). Also use labels and different arrowhead styles, so it stays readable for colour-blind students.
* Big type that is readable on a phone. KaTeX for all maths.
* UI elements may use easing; physical objects never do. Easing on a falling body would fake the physics.
* Kan is original: a round "particle" body, big expressive eyes, small arms that appear only when it interacts with something, colours from our palette. It must not resemble any existing cartoon character.

8. Content plan
Use the list for SUBJECT. Build #1 only in Phases 1–3; add the rest in Phase 4. If CURRENT_TOPICS is filled in, reorder to match it.
Physics (default)

1. Projectile motion: Kan is launched; live velocity components (v_x constant, v_y shrinking, then flipping); v_y = 0 at the top; range vs angle (maximum at 45°, complementary angles give equal range).
2. Relative motion: boat crossing a river (shortest time vs shortest path).
3. Newton's laws: Atwood machine and blocks with friction; free-body-diagram arrows build up live.
4. Vertical circular motion: Kan rides the inside of a loop; minimum speed at the bottom is √(5gR), and what happens below it.
5. Collisions: coefficient-of-restitution slider; momentum and kinetic-energy bars before and after.
6. SHM: spring–block and pendulum synced with the reference circle ("SHM is the shadow of circular motion").
7. Ray optics: refraction and total internal reflection; critical angle.

Maths

1. Parabola: focus–directrix definition and the reflection property.
2. Complex numbers: multiplying by i as a 90° rotation on the Argand plane.
3. Definite integral as area: Riemann rectangles converging.
4. Matrices as transformations of a grid; determinant as the area scale factor.
5. Probability: a live simulation converging to the exact answer.
6. Limits: zooming into a function near a point.

Chemistry

1. Ideal gas: particle box; pressure measured from wall collisions vs the gas law (a 2D box is fine if the 2D form is labelled).
2. First-order kinetics: decay simulation vs the half-life formula.
3. Hydrogen spectrum: electron jumps → wavelength from the Rydberg formula.
4. Acid–base titration curve: pH computed step by step.
5. Chemical equilibrium: Le Chatelier with live Q vs K.

For Maths and Chemistry, the "simulation check" is an independent numerical method (numerical integration, Monte Carlo, step-by-step calculation), still compared with the closed form.
9. Phases
Phase 0: Setup and environment check (no features yet)

* Check `node -v` (current LTS), `npm -v`, `git --version`, free disk space (want 5 GB+), and that the folder is not inside OneDrive. If anything is missing, use the ACTION NEEDED box.
* Scaffold the project (see section 5); add Remotion, `@remotion/player`, KaTeX, Vitest and zod; install the Remotion agent skills.
* `git init`, `.gitignore` (`.env*`, `renders/`, `node_modules/`), first commit.
* Create CLAUDE.md and PROGRESS.md.
* Done when: `npm run dev` shows a placeholder home page, `npm test` runs, and I've seen the page in my browser.

Phase 1: Physics core, mascot, first scene (one topic, end to end)

* `physics/`: projectile solver (range, max height, time of flight, position and velocity at time t) and an RK4 integrator.
* `mascot/`: Kan with 5 expressions (calm, excited, scared, dizzy, proud), squash-and-stretch on impacts, eyes that follow the velocity direction.
* Scene 1: launch, dotted trajectory, live velocity vectors, KaTeX panel with live numbers substituted in, highlighted key moments (top point, landing), Earth / Moon / Mars presets for g.
* The signature move: Kan grabs the θ in R = u² sin 2θ / g and drags it; the trajectory and R update live.
* `/lab/projectile`: sliders (u, θ, g), play / pause / scrub, toggles (vectors, equations, trail), smooth at 60 fps.
* Tests: closed form vs RK4 on 100 random valid parameter sets, relative error < 0.1%.
* Done when: sliders, animation and numbers all agree, tests are green, and I've played with it.

Phase 2: Video factory

* Remotion compositions for Scene 1: a Short at 1080×1920 (30–45 s) and an explainer at 1920×1080 (60–90 s), plus a cover image (still) for each.
* Script beats: hook (the first 2 seconds must grab) → concept → live demo → "pause and predict" question → reveal → call to action ("comment your answer"). The Short should loop cleanly.
* Burned-in captions, large and readable on a phone; keep text clear of the Shorts UI areas (top, bottom, right edge).
* English and Hinglish versions from `script.ts`.
* Voiceover slot: if `public/voice/<id>.mp3` exists, use it and fit the beats to it; otherwise captions only. No music by default (I'll add royalty-free audio myself if I want).
* Render scripts such as `npm run render:short -- projectile`, output to `renders/`.
* Done when: I have both MP4s, they play on my phone, nothing is cut off, nothing flickers.

Phase 3: Verified question engine

* Question schema (zod): id, template, params, conventions, difficulty (easy / medium / hard), type (single-correct MCQ or numerical), text (English + Hinglish), options, answer `{ value, unit, exact? }`, solution steps (KaTeX), and for each wrong option the named mistake it represents (e.g. "used sin θ instead of sin 2θ").
* 15 original questions for Scene 1 (5 easy, 5 medium, 5 hard), JEE Main pattern, original wording. Do not copy past papers or books.
* Verification suite, per question: solver(params) equals the stated answer; the simulation-measured value equals the solver (within tolerance); each wrong option differs from the answer and is reproduced by computing its named mistake; numbers render cleanly.
* "▶ Watch this question": opens the scene with that question's exact numbers and pauses at the key moment.
* Variant engine: N variants with new numbers (chosen so answers stay clean) and new everyday Indian contexts; every variant re-verified.
* DPP builder: choose questions → A4 print layout (header with subject/teacher slots, questions, answer key on a separate page) → browser "Print to PDF".
* `/verified` page: every question with its check results, generated from the test output, never typed by hand.
* Done when: the test output shows every check passing and I can print a clean DPP PDF.

Phase 4: Topic library

* Repeat Phases 1–3 for topics #2–#6 of SUBJECT: interactive lab + Short + explainer + at least 10 verified questions each. If time is short, build fewer topics; never lower the bar.
* Done when: every topic meets the Phase 1–3 bar.

Phase 5: AI Teacher Studio (needs an API key: use the ACTION NEEDED box)

* `/studio`, "Paste or photograph a question": AI returns strict JSON `{ template, params, askedQuantity }` → zod-validated → the extracted values are shown for the teacher to confirm or correct → the solver computes the answer → the animation plays → the AI writes the explanation in words using placeholders like `{{range}}`, and the app fills every number from the solver.
* "5 variants" button (Phase 3 engine) and "new contexts" (AI rewrites the story; numbers stay locked).
* "Make a Short": AI writes the hook, 30-second script, title, description and hashtags (English / Hinglish) → fills the Remotion composition → shows me the render command.
* Topic not supported yet: say so honestly and offer an AI-only solution clearly labelled "Not verified: teacher review needed".
* Keys only in `.env.local`, used server-side only (no `NEXT_PUBLIC_` prefix), never logged or committed. A `STUDIO_PASSCODE` protects `/studio` on the public site.
* Everything outside `/studio` keeps working with no key.
* Done when: I paste 5 different JEE-style questions and each one either works end to end or fails honestly.

Phase 6: Polish and deploy

* Landing page: the problem (AI makes confident mistakes; teachers have no time), the headline features with live mini-demos, the "AI for language, code for truth" principle, and a live count of verified questions.
* Mobile-first, high contrast, dark mode, keyboard controls in /lab.
* Smooth on a mid-range Android phone: lazy-load scenes, no console errors, production build passes.
* GitHub Actions runs the verification suite on every push; the README shows the badge.
* Walk me step by step through GitHub + Vercel deployment and environment variables.
* Done when: the public link works on my phone.

Phase 7: Demo kit for the teacher

* `demo-kit/`: 3 Shorts + 1 explainer on topics this teacher teaches, one DPP (PDF), and a one-page pitch as a print-ready page: the problem → what I built → proof in numbers (questions verified, scenes, render time) → what I can deliver every week (e.g. "3 Shorts + 2 DPPs").
* A 60–90 s demo video: Remotion intro and outro around my screen recording (tell me how to record my screen on Windows).
* README: what it is, GIFs, how to run it, an architecture diagram, how verification works.
* Done when: the folder has everything and I can send it in one message.

Stretch (only after Phase 7)

* Student "Mistake Finder": a student photographs their handwritten attempt → AI points to the first wrong step and gives a hint, not the full answer, and says plainly when it isn't sure.

10. Rules that protect me

* Everything original: mascot, visuals, questions, scripts. No copyrighted music, characters, logos or past-paper text.
* Don't put Vedantu's name, logo or colours on the product or videos as if it were theirs. "Built for JEE teachers" is fine. Put a teacher's name on a video only after they approve.
* Never put API keys, passwords or personal data in code, commits, logs or screenshots.
* If a physics, maths or JEE-convention fact is uncertain, flag it for me instead of guessing.

11. Your first reply
Confirm you've read this file, summarise the plan in 5 simple bullet points, list what you'll check in Phase 0, then show your Phase 0 plan.
