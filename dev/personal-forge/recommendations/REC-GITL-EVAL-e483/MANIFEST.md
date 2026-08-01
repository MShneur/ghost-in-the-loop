# Personal Forge Recommendation — REC-GITL-EVAL-e483

**Identifier:** `REC-GITL-EVAL-e483`  
**Product:** Ghost in the Loop (GITL)  
**Type:** Cursor multi-agent evaluation upgrade (tracks A–G)  
**Status:** Ready for review — **not** promoted to `main`  
**Created:** 2026-08-01  
**Cloud agent run:** `bc-fc8cb35c-b1d4-4103-af72-9311624fe483`

## What this is

A consolidated recommendation from the Cursor evaluation handoff
(`dev/docs/HANDOFF_CURSOR_EVAL.md`). It upgrades GITL from **8.6.1 → 8.7.0**
with evidence-gated Send, runtime safeguards, a read-only network-read
prototype, mobile CI, gap-audit fixes, and prior-art notes — while keeping all
§1 safety invariants intact.

## Where to fetch it

| Artifact | Location |
|---|---|
| Integration branch | `cursor/cursor-eval-upgrade-e483` |
| Personal Forge alias branch | `personal-forge/REC-GITL-EVAL-e483` |
| Repository | `https://github.com/MShneur/ghost-in-the-loop` |
| Full report | `dev/docs/CURSOR_EVAL_REPORT.md` |
| Per-track reports | `dev/docs/CURSOR_EVAL_TRACK_*.md` |

```bash
git fetch origin personal-forge/REC-GITL-EVAL-e483
git checkout personal-forge/REC-GITL-EVAL-e483
cd dev
npm ci
npx jest && npx playwright test && node scripts/build-extension.js --check
```

## Install for testing (userscript)

Load `dev/ghost-in-the-loop.user.js` in Tampermonkey from the checked-out
branch. Do **not** install from `main` if you want this evaluation build.

## Install for testing (extension)

```bash
cd dev
node scripts/build-extension.js
# Load dev/extension/ as a temporary Firefox extension
```

## Feature flags to know

| Flag / setting | Default | Purpose |
|---|---|---|
| ChatGPT SSE read probe | off | Track C — read-only network completion metadata |
| Dry run | off | Track D — preview next command without actuation |
| Global / per-site enable | on for reviewed sites | Track D — kill-switch and per-host authority |

## Deferred to human / real device

- Authenticated ChatGPT and Perplexity mobile-web Send on Android hardware
- Firefox Android (GeckoView) — CI uses desktop Gecko + mobile viewport/UA
- P0 gap items B-01 (root tree drift) and B-02 (crash journal persistence)
- Semantic conversation identity beyond URL/route binding

## Promotion checklist

1. Review `dev/docs/CURSOR_EVAL_REPORT.md` executive summary and open questions.
2. Exercise mobile Send on a real phone (ChatGPT + Perplexity first).
3. Decide on P0 gap fixes before unattended promotion.
4. Merge to `main` only after human sign-off — this recommendation does not
   auto-promote.
