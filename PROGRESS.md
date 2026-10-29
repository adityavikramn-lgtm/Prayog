# Progress

## Done
### Phase 0 — Setup (2026-10-29)
- Environment: Node v24.19.0 (LTS "Krypton"; v26 became the newest LTS on 2026-10-28, upgrade optional), npm 11.17.0, Git 2.55.0, 68 GB free. Project at `C:\Projects\prayog-studio` (outside OneDrive).
- Scaffolded with `npx create-video@latest --next --tailwind`; removed the template's AWS Lambda rendering and demo components.
- Packages: next 16.4.3, remotion + @remotion/player 4.0.539, katex, zod 4.6.7, vitest. `npm audit`: 0 vulnerabilities.
- Remotion agent skills installed in `.claude/skills/`.
- Placeholder home page (palette, KaTeX formula, quantity colours) and a Remotion `TitleCard` composition.
- `npm test` runs a toolchain smoke test (KaTeX + zod).
- CLAUDE.md, PROGRESS.md, PROJECT_BRIEF.md.

## Next
- Phase 1: physics core (projectile solver + RK4), mascot Kan, Scene 1, `/lab/projectile`, closed-form vs RK4 tests.

## Known issues / open questions
- `MY_NAME` and `CURRENT_TOPICS` in PROJECT_BRIEF.md section 0 are still blank.
- npm prints a peer-dependency warning about `@remotion/eslint-plugin` and ESLint 9; it comes from the template and is harmless.
