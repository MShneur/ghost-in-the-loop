# Recommendation `REC-GITL-8.7.0-BC-C01E892A-7F27`

**Ghost in the Loop v8.7.0** — Cursor multi-agent eval upgrade (session handoff).

| Field | Value |
|-------|-------|
| **ID** | `REC-GITL-8.7.0-BC-C01E892A-7F27` |
| **Version** | 8.7.0 |
| **Status** | Ready for review — **not for main** |
| **Source branch** | `personal-forge/rec-gitl-8.7.0-bc-c01e892a-7f27` |
| **Cloud run** | [bc-c01e892a](https://cursor.com/agents/bc-c01e892a-8ace-4a3a-968e-40bc91e97f27) |

## What this is

A tested recommendation bundle from the HANDOFF_CURSOR_EVAL session:

- Pre-dispatch prompt staging gate (mobile Send hardening)
- Send tier ladder (`_selectDispatchStrategy`)
- Safeguards: kill-switch, per-site disable, ambiguity guard, dry-run
- Network-read prototype (`gitlNetRead`, off by default)
- Mobile CI repro (`mobile-chrome` Playwright project)

Full report: [`dev/docs/CURSOR_EVAL_REPORT.md`](../../../dev/docs/CURSOR_EVAL_REPORT.md)

## Install for testing (Tampermonkey)

```
https://raw.githubusercontent.com/MShneur/ghost-in-the-loop/personal-forge/rec-gitl-8.7.0-bc-c01e892a-7f27/dev/ghost-in-the-loop.user.js
```

## Import into your Personal Forge (ctrl-forge `mine/`)

```bash
# From your private ctrl-forge clone:
mkdir -p mine/projects/gitl-eval-8.7.0
cp -r /path/to/ghost-in-the-loop/dev/docs/CURSOR_EVAL_REPORT.md mine/projects/gitl-eval-8.7.0/
cp /path/to/ghost-in-the-loop/personal-forge/recommendations/REC-GITL-8.7.0-BC-C01E892A-7F27/MANIFEST.json mine/projects/gitl-eval-8.7.0/
```

Or clone the recommendation branch directly:

```bash
git clone -b personal-forge/rec-gitl-8.7.0-bc-c01e892a-7f27 \
  https://github.com/MShneur/ghost-in-the-loop.git gitl-eval-8.7.0-rec
```

## Optional GM flags

```javascript
GM_setValue('dryRun', true)
GM_setValue('gitlNetRead', true)
GM_setValue('gitlKillSwitch', false)
```

## Verify locally

```bash
cd dev
npx jest
npx playwright test
node scripts/build-extension.js --check
```
