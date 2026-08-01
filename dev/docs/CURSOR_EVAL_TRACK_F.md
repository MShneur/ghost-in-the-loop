# Track F — Evidence-gated Send mechanism ladder

## Contract

Ghost selects one mechanism only after the composer contains the normalized
exact prompt. Selection is complete before `_beginSendAttempt()` opens the
journal:

1. one unique reviewed adapter Send button;
2. Enter on a uniquely reviewed composer, only when the adapter explicitly
   declares `dispatchFallback: 'enter'`;
3. `form.requestSubmit()` only when an explicit `submitForm` selector resolves
   the one safe form directly wrapping a uniquely reviewed composer;
4. one unique, enabled, visible, veto-safe human-taught Send control.

After the journal opens, the selected actuator is called once. A throw or lack
of confirmation becomes `uncertain`; it never causes fallback, escalation, or
re-selection.

Heuristic Send candidates and selector memory remain diagnostic/detection
inputs only. Neither can enter the candidate set. A heuristic or remembered
composer also cannot receive Enter or form actuation.

## Ordering rationale

Teach Mode previously resolved before adapter selectors. Track F deliberately
places it after the three adapter-owned tiers. Reviewed adapter declarations
are narrow, versioned, and centrally revocable; a per-host taught selector is a
user assertion that can become stale after a page redesign. Therefore the
adapter mechanism wins when both identify an actuator. This does not remove
taught authority: on an unreviewed host, or whenever all reviewed adapter tiers
are unavailable, the taught control remains the selected mechanism after its
uniqueness, enabled-state, visibility, own-UI, and veto checks pass.

Enter precedes form submission because it is explicitly reviewed only for
adapters whose composer semantics are known to submit on one keydown. Form
submission has a wider browser behavior surface, so it is later and requires a
separate explicit `submitForm` declaration plus direct-wrapper, same-origin,
self-target, connected, non-hidden, non-dialog, `requestSubmit` checks. Only
`PROFILES.claude` opts into this tier initially.

## Availability truth table

`B` = reviewed button, `E` = reviewed Enter, `F` = reviewed form, `T` = taught
control. This table assumes exact prompt evidence is present.

| B | E | F | T | Selected |
|---|---|---|---|---|
| 0 | 0 | 0 | 0 | none |
| 0 | 0 | 0 | 1 | taught control |
| 0 | 0 | 1 | 0 | reviewed form |
| 0 | 0 | 1 | 1 | reviewed form |
| 0 | 1 | 0 | 0 | reviewed Enter |
| 0 | 1 | 0 | 1 | reviewed Enter |
| 0 | 1 | 1 | 0 | reviewed Enter |
| 0 | 1 | 1 | 1 | reviewed Enter |
| 1 | 0 | 0 | 0 | reviewed button |
| 1 | 0 | 0 | 1 | reviewed button |
| 1 | 0 | 1 | 0 | reviewed button |
| 1 | 0 | 1 | 1 | reviewed button |
| 1 | 1 | 0 | 0 | reviewed button |
| 1 | 1 | 0 | 1 | reviewed button |
| 1 | 1 | 1 | 0 | reviewed button |
| 1 | 1 | 1 | 1 | reviewed button |

For all 16 rows:

- without exact prompt evidence, selection is `none` and dispatch count is 0;
- with evidence, dispatch count is 1 when a tier is available, otherwise 0;
- if the selected actuator throws, its count remains 1, every lower tier
  remains 0, and the transaction becomes uncertain.

`tests/sendlayered.test.js` executes all 16 availability combinations across
evidence present/absent and actuator throw/no-throw: 64 cases, each asserting
total dispatch count is at most one.

## Residual risks

- Rich-text editors may represent visually identical text with different
  whitespace. The exact staging gate fails closed, which can increase manual
  sends but cannot send unverified text.
- Synthetic Enter can be disabled by a user preference. It then becomes
  uncertain; form and taught tiers are intentionally not tried afterward.
- `requestSubmit()` may be blocked by native validation or future application
  changes. It is never retried with another mechanism.
- A taught selector can drift. Runtime uniqueness and veto checks reduce this
  risk; ambiguity disables it.
- The reviewed form opt-in still needs real-site regression checks after major
  composer redesigns. Removing `submitForm` immediately disables that tier.
