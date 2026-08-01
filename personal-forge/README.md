# Personal Forge — Recommendation Intake

This folder holds **reviewable recommendations** for Ghost in the Loop and
related CTRL-FORGE projects. Each recommendation has a unique ID, a manifest,
and a handoff for human review before anything merges to `main`.

## Active recommendations

| ID | Branch | Version | Status |
|---|---|---|---|
| [REC-GITL-EVAL-20260801-A1A5](recommendations/REC-GITL-EVAL-20260801-A1A5/MANIFEST.md) | `cursor/eval-upgrade-tracks-a1a5` | 8.7.0 | Awaiting review |

## How to review

1. Check out branch `cursor/eval-upgrade-tracks-a1a5` on `ghost-in-the-loop`.
2. Read the recommendation manifest and full report under `dev/docs/CURSOR_EVAL_REPORT.md`.
3. Run the verification block from the report in `dev/`.
4. Test on a real device (Android Firefox / chatgpt.com) before promoting.

**Note:** This agent could not push directly to `MShneur/ctrl-forge` or create
`personal-forge` on GitHub (token is read-only for those repos). This folder
lives in the Ghost branch for import into your Personal Forge / ctrl-forge `mine/`
tree when ready.
