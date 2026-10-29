# Voiceover slot

Record one MP3 per beat and save it here. The render script finds the files and makes each beat
last as long as your recording (or its default length, whichever is longer). No files = captions only.

```
public/voice/projectile-short-en/hook.mp3
public/voice/projectile-short-en/concept.mp3
public/voice/projectile-short-en/demo.mp3
public/voice/projectile-short-en/predict.mp3
public/voice/projectile-short-en/reveal.mp3
public/voice/projectile-short-en/cta.mp3
```

- Folder name: `<template>-<format>-<lang>`: format `short` or `explainer`, lang `en` or `hi`.
- The explainer also has a `sweep` beat.
- Read the caption lines in `src/templates/projectile/script.ts` for what each beat says.
- You can record only some beats; the others stay captions-only.
- Then render again: `npm run render:short -- projectile`.
