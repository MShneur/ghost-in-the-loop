# Ghost in the Loop v9 — Stall Watchdog Addendum

Date: 2026-09-16 ET
Authority: current GitHub implementation truth outranks this addendum.
Parent architecture: `docs/handoffs/GITL_V9_MASTER_ARCHITECT_PASS_2026-09-16.md`
Owner correction: long-running ChatGPT/Perplexity generations can become mechanically stuck; v9 needs bounded auto-recovery without restoring semantic controller reasoning.

## Product delta

Add a **Stall Watchdog** as a separate mechanical recovery layer.

It must NOT decide whether the model is reasoning well, whether a task is hard, or whether a plan is correct. It observes only host/runtime progress signals.

Architecture invariant remains:

> **Everything may influence the prompt. Only Play may influence Send.**

The watchdog may request/trigger a bounded recovery through Play, but it never becomes a peer Send engine.

## Recommended behavior

### 1. Heartbeat, not total-duration timeout

Arm only after Ghost has confirmed that a generation is active.

Maintain `lastProgressAt` from non-semantic mechanical signals such as:

- active assistant output text/DOM fingerprint changed;
- active assistant output length changed materially;
- active response node received DOM mutations;
- generation/Stop control state changed;
- host-provided visible progress/tool/status indicator changed.

Do not inspect task meaning or infer whether the model is making intellectual progress.

Network activity may be advisory only; it must not by itself keep a visibly frozen generation alive forever.

### 2. Default timing

Recommended defaults for first field candidate:

- `SOFT_STALL = 5 minutes` with no observable heartbeat;
- `GRACE = 2 minutes` more;
- recovery begins only if there is still no observable progress at ~7 minutes.

This means a 20-minute research task that keeps visibly updating is never stopped merely because it is long.

Make thresholds configurable later; do not add complexity to the first candidate.

### 3. Recovery state machine

`OBSERVING -> SUSPECTED_STALL -> STOPPING -> REGROUNDING -> RESUMED | HUMAN_REQUIRED`

#### OBSERVING
Generation active and heartbeat continues.

#### SUSPECTED_STALL
No heartbeat for 5 minutes.
Visible Ghost status: `No visible progress — checking…`
No prompt injection and no Send.

If any heartbeat returns during the 2-minute grace window, reset to OBSERVING.

#### STOPPING
At hard stall (~7 minutes), prefer the host's **existing Stop generation control** if one unambiguous visible control exists.

- This is a Stop actuator, not a Send actuator.
- Reacquire the current visible Stop control before every click.
- Click at most once per attempt.
- Confirm that generation actually stopped before proceeding.
- If the host still clearly shows generation active, allow a small bounded retry count (recommended maximum 3 total Stop-click attempts with delay/reacquisition between attempts).
- If Stop authority is ambiguous, missing, or state cannot be confirmed, fail closed to `HUMAN_REQUIRED`.

Do NOT type/send the word `stop` as the primary recovery method in the first implementation. That would create additional Send traffic while the prior generation state is uncertain and risks recreating the old alternate-actuator problem.

If later E4 evidence proves a platform truly requires an in-chat `stop` message, that must be designed as an explicit Play-owned recovery transaction with its own at-most-once/confirmation contract, not an ad-hoc watchdog Send loop.

#### REGROUNDING
Only after generation stop is positively confirmed does the watchdog ask Play to send exactly one recovery prompt.

Recommended recovery prompt:

```
You were interrupted because the previous step showed no visible progress for an extended period.

Reground from the conversation and the last confirmed completed step. Do not restart the whole task.

1. Identify the exact subtask that was in progress when you stalled.
2. Preserve all confirmed work already completed.
3. Reduce only the stalled subtask into the smallest safe next unit(s).
4. Execute just the first unit now.
5. If that unit is still too large, split it once more before executing.
6. Do not repeat completed research, rebuild the whole plan, or expand scope.
7. End with the normal Ghost terminal marker.
```

The controller does not parse the answer semantically. The AI performs the reassessment in-prompt.

#### RESUMED
Recovery prompt Send is confirmed once through the normal Play path. Return to ordinary observation with a fresh watchdog timer.

#### HUMAN_REQUIRED
Stop could not be confirmed, Send state is uncertain, recovery prompt failed, or the same lane stalls again after one automatic recovery.

Recommended first-version limit: **one automatic reground per user turn / stalled lane**. A second stall goes to Human rather than creating an infinite self-repair loop.

## Preservation rules

- No semantic controller reasoning.
- No alternate Send engine.
- No Enter/requestSubmit escalation.
- No repeated recovery messages after uncertain Send acceptance.
- No restart-from-scratch behavior.
- No arbitrary timer that kills a long but visibly progressing task.
- Watchdog state must not be confused with Play terminal state.
- Stop-button retries are bounded and separately confirmed.
- Recovery prompt is sent through the canonical Play Send path only after a confirmed stop.

## Minimal data / state

Keep the watchdog intentionally small:

- `generationStartedAt`
- `lastProgressAt`
- `lastProgressFingerprint`
- `stallState`
- `stopAttempts` (0..3)
- `recoveryCount` (0..1 per lane/turn)

Do not store/analyze full response semantics for watchdog decisions.

## UI

Small optional status only:

- `Working…`
- `No visible progress — checking…`
- `Stopping stalled response…`
- `Regrounding stalled step…`
- `Needs you — recovery uncertain`

Later advanced setting may expose stall timing; novice default should require no configuration.

## Evidence contract

Autonomous E1-E3 tests:

1. continuous output mutations for >7 simulated minutes never trigger Stop;
2. 5 minutes stagnant -> SUSPECTED_STALL only;
3. heartbeat during grace cancels recovery;
4. 7 minutes stagnant -> one Stop attempt;
5. continued active generation permits bounded Stop retries, max 3;
6. confirmed stop -> exactly one recovery prompt via canonical Play Send path;
7. uncertain Stop -> zero recovery Send;
8. uncertain recovery Send -> zero resend;
9. second stall after one auto-recovery -> HUMAN_REQUIRED;
10. watchdog never accepts interior/semantic text as a progress decision;
11. watchdog never mutates Export/Top/settings state;
12. regression proves ordinary Play Send remains the sole Send actuator.

E4 field proof required on authenticated Firefox Android for ChatGPT first, then Perplexity.

## Roadmap insertion

Insert this as **Batch 1B / P0-P1** after terminal-parser repair and before broad product-shell restoration.

Recommended sequence:

1. terminal parser repair;
2. Stall Watchdog mechanical heartbeat + Stop/recovery state machine;
3. `↑ Top` navigation;
4. Export restoration;
5. rich product-shell restoration;
6. identity/parity;
7. autonomous integration;
8. exact-artifact phone field canary.

Reason: watchdog touches active-generation lifecycle and canonical Play recovery, so it should be isolated and proven before unrelated UI restoration increases the regression surface.

## Open decision for field evidence

First implementation should use host Stop-control clicks as the only automatic interruption method. Do not automatically send `stop` text unless direct field evidence shows that the host Stop control cannot reliably interrupt the observed stuck state and the owner explicitly approves a Play-owned in-chat stop-message recovery contract.
