# Ghost in the Loop v9 — Batch 2 Stall Watchdog Return

Date: 2026-09-16 ET
Architect lane: master v9 reconciliation
Implementation branch: `feature/v9-stall-watchdog`
Base: `fix/v9-terminal-suffix-normalization` @ `c35a22eff40454101040b3c122e7a777892dbd99`

## Result

Implemented the bounded mechanical Stall Watchdog specified in `GITL_V9_STALL_WATCHDOG_ADDENDUM_2026-09-16.md`.

Product commit: `0a3e474ee2a44849a0a62d6197826007b1d7d10e`
Test commit: `18db57bf81b0b0a4fc5fd3f862b367d6f92b5dc7`

Branch delta from Batch 1 is restricted to:

- `ghost-in-the-loop.user.js`
- `tests/v9-stall-watchdog.test.js`

No Export, Top-navigation, activator, package-version, or extension files changed.

## Implemented behavior

- 5 minutes with no visible assistant-output fingerprint change => `SUSPECTED_STALL` status only.
- 2 additional minutes with no change => bounded recovery begins.
- Any visible assistant-output fingerprint change during the grace period resets the progress clock.
- Only one unambiguous visible host Stop control is accepted as Stop authority.
- Stop is reacquired before each attempt and capped at 3 attempts.
- Generation stop must be positively observed before any recovery prompt is staged.
- Stop failure/ambiguity goes directly to human review with zero recovery Send.
- After confirmed Stop, exactly one recovery prompt is routed through canonical `sendOnce()`.
- No Enter, requestSubmit, alternate Send actuator, or automatic resend was introduced.
- Recovery prompt tells the model to preserve completed work, isolate only the stalled subtask, split it smaller, execute one smaller unit, and avoid restarting the entire task.
- One automatic stall recovery is allowed. A second hard stall before a normal lane transition pauses for the human instead of creating a recovery loop.
- Watchdog decisions use only mechanical host/runtime signals; no task-quality/semantic reasoning was added.
- Diagnostic report exposes watchdog state/counters but not response fingerprints/content.

## Preservation check

Architecture invariant preserved:

> Everything may influence the prompt. Only Play may influence Send.

Canonical Play remains:

`setComposerText -> reacquire one valid Send -> click once -> confirm once`

The watchdog owns only progress timing + bounded Stop attempts. It does not own Send.

## Autonomous verification

Container-local pure-state checks:

- 6 phase-boundary cases PASS.
- 8 bounded recovery simulation cases PASS, including:
  - 5-minute suspicion boundary;
  - 7-minute recovery boundary;
  - second stall -> human;
  - ambiguous Stop -> zero clicks / zero recovery Send;
  - three failed Stop confirmations -> max 3 clicks / zero recovery Send;
  - confirmed Stop on retry -> one recovery Send.

Repository source-contract test added for constants, mechanical heartbeat, max attempts, unique Stop authority, canonical `sendOnce()` routing, no requestSubmit/Enter fallback, uncertain-Stop fail-closed behavior, and privacy-safe diagnostic reporting.

No GitHub-hosted Actions were run.

## Evidence ceiling / remaining proof

Current claim ceiling: source + focused autonomous state-machine verification. Exact full repository Jest/browser suite was not executed in this chat because the local container cannot reach GitHub and does not contain the repository checkout/dependencies.

Required before release claim:

1. run repository syntax/Jest/browser checks in an available direct/self-hosted environment;
2. E4 authenticated Firefox Android field test on ChatGPT first, then Perplexity;
3. specifically exercise a real long-running generation or a controlled field-safe stall case before claiming automatic Stop/recovery works on host UI.

## Next implementation batch

`↑ Top` navigation remains next. Keep it isolated from watchdog and Play transport. First candidate behavior remains disabled while Play is actively RUNNING unless direct evidence later proves safe coexistence.
