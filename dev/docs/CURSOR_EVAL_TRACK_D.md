# Track D — Runtime Safeguards

## Scope and outcome

This pass audited composer and Send ambiguity, injected-text verification,
actuation policy, dry-run behavior, navigation aborts, runaway limits, and
conversation identity.

The implemented set is one pre-dispatch safety envelope:

1. Resolve the active composer tier uniquely, including open shadow roots.
2. Require one deduplicated reviewed Send candidate across all profile
   selectors. Ambiguity cannot fall through to Enter.
3. Verify that the live composer contains the exact intended command after
   injection and again immediately before transaction creation.
4. Bind command preparation to an in-memory route identity, navigation epoch,
   and tab-lock namespace.
5. Add a global kill switch, per-host enable, and non-actuating dry-run preview.
6. Re-verify the single-tab lease immediately before selecting the actuator.

All failures above occur before `_beginSendAttempt()`. They capture a stable
diagnostic and pause without opening a transaction or firing an actuator.
Nothing adds a post-dispatch retry or fallback.

## Audit findings

- Composer detection returned the first selector match. Duplicate matches could
  therefore receive injected text based on DOM order.
- Reviewed Send uniqueness was enforced one selector at a time. A unique match
  from one selector could coexist with a different unique match from another.
  Worse, a null result could not distinguish “none” from “ambiguous,” so an
  ambiguous button set could fall through to a reviewed Enter dispatch.
- Injection success meant that an API call returned successfully. It did not
  prove that the live composer held the full intended command. The only content
  check was a short prefix used to decide whether to try a paste event.
- Same-host route changes used general loop activity as a proxy for a recent
  send. Generation traffic refreshes that activity, so an unrelated
  conversation change could be accepted for much longer than intended.
- There was no persistent global actuation switch, per-host authority, or true
  dry-run path.
- Existing runaway controls are useful but bypassable: randomized delay,
  watchdog pause, a soft round checkpoint, and a two-nudge sigil limit. There is
  no non-bypassable rolling or per-run dispatch quota.

## Threat model

| Asset | Hazard | Attacker or failure | Current control | Residual risk |
|---|---|---|---|---|
| User command integrity | Truncated, transformed, or stale text is sent | Editor event rejection, framework remount, hostile page mutation | Byte-exact comparison against the live composer after staging and again before journal creation | Editors that canonicalize equivalent text will pause falsely; this is intentional fail-closed behavior |
| Intended composer | Text is injected into the wrong field | Duplicate selectors, decoy editor, DOM reordering | First active configured tier must be unique; taught and learned selectors must remain unique; heuristic score ties fail closed; open shadow roots are included | Closed shadow roots cannot be enumerated; unusual editors may require Teach mode |
| Send authority | Wrong control is activated | Selector drift, duplicate Send controls, menu or message-action trap | All reviewed profile matches are deduplicated globally, visibility/enabled/veto checked, and required to resolve to one element; taught selector must also remain unique | A semantically wrong control with safe-looking metadata can still survive the veto; independent send confirmation limits state advancement, not the click itself |
| At-most-once delivery | A safeguard causes a second dispatch | Timeout, thrown click, uncertain evidence | All new gates run before `_beginSendAttempt()`; one selected actuator fires once; uncertainty remains observation-only | A platform may process one browser event more than once internally; that is outside page-script control |
| Single-tab authority | Two tabs drive one conversation | Non-atomic shared storage race | Existing claim/yield/re-read lease is retained and re-run immediately before mechanism selection | Storage APIs are not transactional; the deterministic re-read narrows but cannot mathematically eliminate every scheduler race |
| Conversation integrity | A prepared command lands in another chat | User navigation, SPA route replacement, delayed route assignment | Command-bound exact route identity, navigation epoch, and lock key; one route assignment is allowed only for an unbound new conversation; bound route changes pause loudly and require session reset before more actuation | A site can swap conversations without changing the URL; a portable semantic conversation ID is not yet available |
| Actuation authority | Automation runs where the user did not intend | Forgotten setting, generic/custom adapter, shared browser profile | Global kill switch; per-host switch; generic/custom adapters default disabled until explicit enable; policy checked at send entry, each running tick, and immediately pre-dispatch | Reviewed built-in sites remain enabled by default for upgrade compatibility |
| Safe evaluation | Testing a workflow accidentally mutates or sends | User assumes preview is simulation | Dry run records the exact next command in Ghost’s own UI, pauses, never resolves/injects a composer, and never opens a transaction | It does not test whether a real site would accept the text or enable Send; preview content remains visible locally |
| Quota and account safety | Runaway commands consume quota or trigger abuse controls | Missing markers, workflow cycle, user repeatedly extends/reset limits | 8–15 second normal delay, watchdog, round checkpoint, two-nudge cap, explicit stop, global kill switch | No hard rolling/per-run quota; initial and explicit reground paths can skip normal delay |
| Diagnostic privacy | Safeguard report leaks prompts or conversation IDs | Failure reporting | Reports contain codes, bounded status, and route classes only; exact command and exact route identity remain runtime-only | Dry-run preview intentionally displays command text in the local panel |

## Default behavior

- The global automation switch defaults on to avoid silently disabling existing
  installations.
- Reviewed built-in adapters retain their existing per-site default.
- Generic and custom adapters default off and require explicit per-host enable,
  even when a human-taught Send control exists.
- Dry run defaults off. Enabling it while running pauses the run immediately.
- Turning global or site authority off while a dispatch is unresolved converts
  that dispatch to the existing uncertain state; it never retries.

## Deferred product decisions

1. **Hard rate and run caps.** A non-bypassable limit needs product-owned
   values, persistence semantics, and recovery UX. Candidate policies include a
   rolling dispatch/hour cap, an absolute dispatches/run cap, or both. This pass
   does not invent thresholds that could strand legitimate long workflows.
2. **Default-off migration for reviewed sites.** Fresh-install opt-in and
   upgrade migration need an onboarding decision. This pass defaults only
   generic/custom adapters off, preserving established reviewed-site behavior.
3. **Semantic conversation identity.** Stronger identity would use a
   platform-provided conversation ID or stable DOM marker. That requires
   per-platform review and a privacy rule for keeping the identifier strictly
   in memory. URL/epoch binding is the safe cross-platform minimum.
4. **Dry-run continuation UX.** A one-click “send this preview” action was not
   added. A cached preview can become stale after navigation or reply changes;
   recomputing through the normal start path is safer.
5. **Text normalization.** Whitespace, Unicode, or line-ending normalization was
   rejected for the send gate. Any accepted normalization weakens the promise
   that the dispatched command is exactly the command constructed by Ghost.
6. **Ambiguity ranking.** Choosing the nearest, newest, or highest-scoring
   composer/Send control was rejected. Ranking turns uncertainty into actuation
   authority; the safe outcome is a loud pause and probe.

## Verification targets

- Unit behavior: policy defaults and blocks, dry-run non-actuation, exact-text
  mismatch pause, configured/shadow/taught/learned ambiguity, reviewed Send
  deduplication, and pre-journal ordering.
- Browser behavior in both engines: one-time new-conversation route assignment,
  genuine navigation pause, bound-conversation route rejection, and command
  context invalidation.
- Existing invariant suites: reviewed-send authority, single-dispatch
  selection, uncertain-send reconciliation, single-tab lock, own-UI isolation,
  Trusted Types, and generated extension parity.
