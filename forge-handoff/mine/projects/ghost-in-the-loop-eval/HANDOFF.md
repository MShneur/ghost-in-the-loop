# Handoff — Ghost in the Loop Cursor eval

**Recommendation-ID:** `GITL-EVAL-20260801-cac16205`  
**Last updated:** 2026-08-01

## Done
- Integrated evaluation tracks A–G into v8.7.0 on branch `cursor/gitl-eval-integrator-2995`.
- Pre-dispatch composer evidence gate; send selection ladder; safeguards; optional `gitlNetRead`; AccName helpers; mobile Playwright projects.
- Jest 456 / Playwright 86 / extension parity all green.
- Report + gap register + prior-art memo written under `dev/docs/`.
- Filed Personal Forge recommendation set under unique ID `GITL-EVAL-20260801-cac16205`
  (CTRL-FORGE issues #2–#6). See `RECOMMENDATION.md`.

## Open
- Git push of `mine/projects/` into `ctrl-forge` still blocked for `cursor[bot]` —
  recommendations are on issues; tree copy still needs human grant or manual import.
- Real-device confirm of ChatGPT/Perplexity Android Enter path.
- Product call: Claude/Gemini `dispatchFallback:'enter'` after device evidence.
- Do **not** promote to `main` until field retest.

## Pick up first
1. Open https://github.com/MShneur/ctrl-forge/issues/2 (`GITL-EVAL-20260801-cac16205`).
2. Checkout `cursor/gitl-eval-integrator-2995` and read `dev/docs/CURSOR_EVAL_REPORT.md`.
3. Field-test mobile Send on Android Firefox chatgpt.com with Teach Mode as backup.
4. Only then decide on `main` promotion.
