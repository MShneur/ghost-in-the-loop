# REC-GITL-8.7.0-5348

**Ghost in the Loop v8.7.0 — Cursor evaluation recommendation**

| Field | Value |
|-------|-------|
| **ID** | `REC-GITL-8.7.0-5348` |
| **Status** | Ready for review |
| **Do not promote** | `main` on ghost-in-the-loop |

## What this is

A Personal Forge–style recommendation bundle from the Cursor cloud-agent evaluation session (suffix `5348`). It packages the integrated v8.7.0 work: send evidence gates, tier ladder, safeguards, net-read prototype (off), mobile CI, and gap fixes — with full test verification.

## Where to read

1. **Primary report:** [`dev/docs/CURSOR_EVAL_REPORT.md`](../../../dev/docs/CURSOR_EVAL_REPORT.md)
2. **Manifest:** [`RECOMMENDATION.yaml`](./RECOMMENDATION.yaml)
3. **Handoff brief:** [`dev/docs/HANDOFF_CURSOR_EVAL.md`](../../../dev/docs/HANDOFF_CURSOR_EVAL.md)

## Source

- Repo: `MShneur/ghost-in-the-loop`
- Branch: `cursor/ghost-loop-eval-5348`
- Tag branch: `recommendation/REC-GITL-8.7.0-5348`

## Copy into ctrl-forge (Personal Forge)

If you maintain Personal Forge at `ctrl-forge`:

```bash
# From your local ctrl-forge clone (mine/ is yours — forge never touches it)
mkdir -p mine/projects/ghost-in-the-loop/recommendations
cp -r <ghost-in-the-loop>/personal-forge/recommendations/REC-GITL-8.7.0-5348 \
  mine/projects/ghost-in-the-loop/recommendations/
```

Or merge the evaluation branch and reference this ID in your project `HANDOFF.md`.

## Verification (2026-08-01)

```
jest:       41 suites, 490 tests — all passed
playwright: 82 passed (4 projects)
parity:     build-extension.js --check current
```
