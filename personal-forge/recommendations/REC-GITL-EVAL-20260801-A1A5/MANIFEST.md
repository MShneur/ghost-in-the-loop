# Recommendation Manifest

| Field | Value |
|---|---|
| **ID** | `REC-GITL-EVAL-20260801-A1A5` |
| **Type** | eval-upgrade |
| **Product** | Ghost in the Loop |
| **Source repo** | `MShneur/ghost-in-the-loop` |
| **Source branch** | `cursor/eval-upgrade-tracks-a1a5` |
| **Base branch** | `claude/skin-system-redesign-dh04go` |
| **Target version** | `8.7.0` |
| **Created** | 2026-08-01 |
| **Promote to main?** | No — human review first |

## Summary

Cursor multi-agent evaluation implementing send evidence gate, tier ladder,
safeguards, network-read prototype, and mobile CI repro. All safety invariants
preserved; 445 Jest + 117 Playwright tests green.

## Artifacts

| Path | Description |
|---|---|
| `dev/ghost-in-the-loop.user.js` | Product (8.7.0) |
| `dev/docs/CURSOR_EVAL_REPORT.md` | Full eval report |
| `dev/docs/HANDOFF_CURSOR_EVAL.md` | Original master brief |
| `dev/CHANGELOG.md` | Ship notes |
| `dev/DEVLOG.md` | Rationale + dead ends |

## Verification

```bash
cd dev
npx jest
npx playwright test
node scripts/build-extension.js --check
```

## Import into ctrl-forge

Copy this folder to `mine/projects/ghost-in-the-loop-eval/` in your Personal
Forge instance, or open a Recommendation issue on ctrl-forge linking this ID.
