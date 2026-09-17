# GITL v9 — Batch 1 Return: Terminal Suffix Normalization

Date: 2026-09-16 ET
Master architecture: `docs/handoffs/GITL_V9_MASTER_ARCHITECT_PASS_2026-09-16.md`
Implementation branch: `fix/v9-terminal-suffix-normalization`
Baseline: `main` @ `d2dd2d82400262d7555612f809c170c23a9adff7`

## Result

PASS at source/parser level; NOT merged; NOT field-certified.

Product commit: `285ca67604f2c095392216771f089cd8024415cc`
Test commit: `c35a22eff40454101040b3c122e7a777892dbd99`

## Delta

- Preserve exact final-line terminal markers as the preferred path.
- Add `terminalCandidate()` mechanical normalization.
- Accept a valid Ghost/AoA terminal marker only when it is the final whitespace-separated suffix of the entire response.
- Apply the same final-suffix rule to `[[AOA::RELAY:MODEL_LABEL]]`.
- Reject interior markers, markers joined directly to preceding text, and markers followed by extra non-whitespace content.
- Return `normalized: true|false` and log `terminal-normalized` once when the normalized terminal is actually handled.
- No Play transport choreography, Export, UI, watchdog, package/version, or activator changes.

## Evidence

- Connector diff against main: branch is 2 commits ahead / 0 behind.
- Changed files only:
  - `ghost-in-the-loop.user.js` — 20 additions / 7 deletions
  - `tests/v9-terminal-normalization.test.js` — new 64-line focused test
- Exact product diff confirms parser + normalization-event changes only.
- Direct local Node execution of the exact parser logic covered 7 cases and PASSed:
  - exact marker remains non-normalized;
  - flattened Ghost suffix accepted;
  - flattened AoA suffix accepted;
  - flattened relay suffix accepted;
  - interior marker rejected;
  - non-whitespace-separated marker rejected;
  - marker followed by trailing text rejected.
- Focused Jest test committed to exercise the parser block directly from the userscript.
- No GitHub-hosted Actions were run.

## Claim ceiling

E1 parser/source behavior only. The branch has not run the repository's full Jest/browser suite in this chat because the local sandbox cannot resolve GitHub and the browser runtimes are unauthenticated to GitHub. This does not block the isolated parser implementation, but integration/field claims remain prohibited.

## Preservation check

Invariant preserved: **Everything may influence the prompt. Only Play may influence Send.**

No second Send path, no Enter/requestSubmit fallback, no resend behavior, no controller semantic reasoning.

## Disposition

Batch 1 implementation: READY FOR INTEGRATION REVIEW.
Overall v9: NOT READY.

Next architect batch: Stall Watchdog design/implementation, kept isolated from terminal parsing and from the later `↑ Top` navigation batch.
