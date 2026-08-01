# Ghost in the Loop — Cursor evaluation (v8.7.0)

Review package for Personal Forge / CTRL-FORGE.  
**Source branch:** `cursor/gitl-eval-integrator-2995` on `MShneur/ghost-in-the-loop`  
**Not live.** Do not treat as promoted `main`.

## What this is

Multi-track evaluation of Ghost in the Loop after the 8.6.1 mobile Send work:
send ladder + evidence gate, safeguards, optional network chat-reading, prior-art
AccName helpers, mobile CI, and a full report.

## Where the code is

The product code was developed on the Ghost in the Loop review branch (this
environment could push there, but **could not push to `MShneur/ctrl-forge`** —
`cursor[bot]` returned 403). Pull or browse:

https://github.com/MShneur/ghost-in-the-loop/tree/cursor/gitl-eval-integrator-2995

Work from `dev/` on that branch.

## Docs in this package

| File | Purpose |
|------|---------|
| `HANDOFF.md` | Next-session pickup |
| `PROJECT_STATE.yaml` | Compact state |
| `deliverables/CURSOR_EVAL_REPORT.md` | Full report |
| `research/GAP_REGISTER.md` | Gap audit |
| `research/PRIOR_ART_MEMO.md` | External techniques |

## How to install into CTRL-FORGE

```bash
# from a clone of ctrl-forge
cp -R forge-handoff/mine/projects/ghost-in-the-loop-eval \
  mine/projects/ghost-in-the-loop-eval
```

Or grant the Cursor agent write access to `MShneur/ctrl-forge` and re-run push.
