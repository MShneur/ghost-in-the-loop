# Ghost Research Fallback Evidence

## Identity
- Round: 6
- Nominal timer lens: Worker 6 / Devil's Advocate / release auditor
- Executed role: mobile-layout and scroll-behavior researcher with adversarial release-audit lens
- Research fallback ID: `R6-RESEARCH-FALLBACK-RED-SCROLL-ANCHOR-10`
- Program: `MOBILE-SHELL-STRUCTURAL`
- Started at: 2026-08-07T16:51:16Z
- Finished at: 2026-08-07T17:00:00Z
- Lease claim commit: `dc0f026762fd2adc1710ca9aadb545517ddeabdf`
- Inspected starting head: `d72b4039887b3b9cc4dae81ad7b330c95e7907be`
- Canonical maker: `MShneur/Personal-Forge:08-agent-bridge/CHATGPT_AUTOMATION_MAKER.md`, canonical v1.0 dated 2026-08-07

## State Read
- Branch: `agent/8.8-repair-resume`.
- Canonical state was active, Round 6 `MOBILE-SHELL-STRUCTURAL`, `publishReady: false`, and `lease: null` before claim.
- `R6-A1X-MOBILE-SHELL-LIVE-STRUCTURE-CAPTURE` remains locally blocked on `DQ-R6-LIVE-STRUCTURE-CAPTURE`; current authenticated ChatGPT structure and exact Blue/Red insertion positions remain UNKNOWN.
- `R6-A2-MOBILE-SHELL-BUILD` remains waiting on A1X submission; no current product structural insertion rule is authorized.
- No dependency-ready implementation, repair, Red-Team, mobile certification, audit, documentation, packaging, or release assignment existed.
- No pull-request workflow was associated with starting head `d72b4039887b3b9cc4dae81ad7b330c95e7907be`, and no open PR used the isolated branch as head when checked.
- Fallback-09 explicitly nominated Red expansion scroll-anchoring/layout-measurement as a materially different next research mode.

## Step Performed
Performed one bounded non-conflicting research step answering:

**How should a future in-flow Red expandable composer row prove that expansion/collapse preserves user scroll intent and latest-message reachability without hiding a layout failure by programmatically scrolling the host conversation?**

This step does **not** implement Red, identify a live ChatGPT scroll container, add a selector, mutate host layout, change product behavior, or weaken Send/CHOICE/route/lease/uncertainty safeguards.

## Repository Evidence

### Red is required to reflow, not cover
The Round-6 mobile-shell brief requires Red to be an in-flow sibling beneath the composer. Expansion must increase footer/layout height, keep the composer usable, keep the latest message reachable, preserve scroll anchoring within an acceptable tolerance, collapse without stale padding/height, and survive rerender without duplication.

**Implication:** scroll/reachability is a release property of Red, not a cosmetic follow-up.

### Current Ghost already contains narrowly scoped programmatic scrolling elsewhere
Current `ghost-in-the-loop.user.js` writes `scrollTop` in existing non-structural paths: Gemini answer retrieval nudges an `infinite-scroller` to its bottom, while the Manus export scanner walks a virtualized scroll container and restores its original position.

**Implication:** a future Red oracle must distinguish existing unrelated scroll writes from any new structural-shell behavior. Red mount/verify/expand/collapse must not gain implicit `scrollTop`, `scrollBy`, `scrollTo`, or `scrollIntoView` authority merely to make a layout test pass.

## Primary Platform Research

### Browser scroll anchoring is useful but cannot be assumed to save Red
Primary source: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll_anchoring/Overview

MDN documents browser scroll anchoring as a mechanism intended to keep the user's view stable when content changes outside the visible region. It also documents suppression triggers including changes to margin/padding, width/height-related properties, transforms, and position changes in the scroll container.

**Implication:** Red expansion changes layout height by design, so the test cannot assume browser anchoring will preserve the desired view. Direct geometric and scroll-state invariants are required.

### `overflow-anchor` is not a safe cross-browser product dependency
Primary source: https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-anchor

`overflow-anchor` remains limited-availability rather than a universal Baseline feature.

**Implication:** the first structural candidate must not mutate host `overflow-anchor` as a generic repair or make support for that property a release prerequisite. Adapter behavior must be verified independently.

### Bottom detection requires a tolerance for subpixel scroll positions
Primary sources:
- https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight
- https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTop
- https://developer.mozilla.org/en-US/docs/Web/API/Element/clientHeight

MDN documents that `scrollTop` is subpixel precise while `scrollHeight` and `clientHeight` are rounded, and gives a `<= 1` pixel threshold as the correct form of bottom detection rather than exact equality.

**Implication:** deterministic fixtures may predeclare a 1 CSS-pixel numerical tolerance for scroll-bottom classification/rounding only. That tolerance must not be expanded post hoc to excuse real message occlusion or an anchor jump.

### IntersectionObserver is a passive tail-visibility oracle
Primary sources:
- https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver
- https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/root

IntersectionObserver can asynchronously measure target intersection relative to an ancestor element used as its root and is broadly available.

**Implication:** where a deterministic fixture owns a tail sentinel, use an observer or equivalent geometry to verify latest-tail visibility without scrolling it into view. Do not depend on experimental `trackVisibility`.

### `scrollIntoView()` would hide the failure being tested
Primary source: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView

`scrollIntoView()` scrolls ancestor containers to expose a target.

**Implication:** calling it in Red's primary verification/repair path would repair the evidence after the fact and can conceal a structurally bad mount. Prohibit it in the first Red candidate's passive mount/expand/collapse path.

### `scrollend` is optional settlement evidence, not the sole gate
Primary source: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollend_event

Element `scrollend` is Baseline 2025 on current browsers, but older browsers may not provide it and it does not fire when scroll position never changes.

**Implication:** it may supplement a test, but settlement should still be provable from stable frames/geometry rather than requiring `scrollend`.

### LayoutShift/CLS is the wrong primary pass/fail metric for intentional Red expansion
Primary source: https://developer.mozilla.org/en-US/docs/Web/API/LayoutShift/hadRecentInput

`LayoutShift.hadRecentInput` is limited/experimental and explicitly exists because shifts after recent user interaction, including a user expanding UI, are commonly excluded from layout-shift metrics.

**Implication:** Red could visibly move the conversation yet still look benign in CLS-style data. Use direct layout/visibility/intent invariants; retain LayoutShift only as optional diagnostics.

### ResizeObserver can participate in a feedback loop
Primary source: https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver

MDN documents cyclic resize dependencies and the `ResizeObserver loop completed with undelivered notifications` error. Deferral prevents lockup but does not eliminate the loop itself.

**Implication:** Red repair must keep the existing coalesced/scheduled ResizeObserver discipline and the test oracle must detect unbounded callback/repair growth rather than treating repeated relayout as successful responsiveness.

## User / Adoption Evidence

### Users distinguish "follow latest" from "reading history"
OpenAI Developer Community, 2026-07-16: https://community.openai.com/t/auto-scroll-live-transcript-in-voice-mode/1387104

A Voice Mode feature request proposes auto-following the latest transcript while active, pausing follow when the user manually scrolls upward, offering a Jump-to-latest affordance, and resuming after returning to bottom. OpenAI Support said the behavior was useful enough to log.

Recent community reports show the opposite failure as well: users object when ChatGPT keeps forcing the view to the bottom while they are trying to read earlier text.
- 2026-08-06: https://www.reddit.com/r/ChatGPT/comments/1vgwqkt/chatgpt_mac_app_keeps_autoscrolling_to_the_bottom/
- 2026-08-04 adoption example: https://www.reddit.com/r/chrome_extensions/comments/1vfil5q/built_a_chrome_extension_that_stops_chatgpt_and/

**Implication:** Red must preserve two distinct pre-existing user states. "Keep latest visible" and "do not steal my reading position" are not interchangeable.

### Mobile resize loops are a real adjacent failure mode
OpenAI Developer Community, 2026-05-08: https://community.openai.com/t/mcp-app-ui-causes-chat-to-be-jittery-on-mobile-but-not-on-desktop/1380483

A ChatGPT Apps SDK report traced mobile whitespace/jitter to a `min-height: 100%` setting that apparently fed an iframe resize loop; removing it fixed the issue, and OpenAI Support agreed with the diagnosis.

**Implication:** a Red candidate that repeatedly adjusts host height/spacer values from resize callbacks can create the same class of oscillation. The first candidate should prefer intrinsic in-flow sizing and observe rather than continuously "correct" host dimensions.

## Competing Expert Lenses

### Expert A — observational, host-flow-first scroll contract
Approach: Red changes only its own in-flow block height. Before expansion, classify the user as either **FOLLOWING_LATEST** or **READING_HISTORY** from the actual scroll owner. Measure the same scroll owner, latest-tail visibility, a stable visible history anchor, composer/Red geometry, and resource counters before/after settlement. Do not issue any Ghost scroll command.

Strengths:
- preserves user intent;
- exposes host/layout failure instead of masking it;
- adds no new scrolling authority;
- works even where CSS scroll anchoring is absent or suppressed because the oracle checks the result directly.

Failure mode:
- some host layouts may not naturally preserve bottom reachability when footer height grows.

Disposition: **favored first certification contract**. If it fails on the authenticated host, fail Red for that adapter and investigate an explicit host layout/spacer contract rather than silently scrolling.

### Expert B — explicit scroll correction after Red changes size
Approach: after expand/collapse, write `scrollTop`, call `scrollBy`/`scrollTo`, or `scrollIntoView()` to restore the latest message or prior anchor.

Strengths:
- can visually compensate for host layouts that do not preserve position naturally.

Failure modes:
- overrides the user's history-reading intent;
- can fight host streaming auto-follow behavior;
- conceals an invalid structural mount;
- introduces a new mutation/interaction authority into a safety-sensitive host page;
- is brittle with virtualization and changing scroll owners.

Disposition: **reject as the first Red implementation and as a test repair**. Consider only as a later adapter-specific design if current-host evidence proves it necessary and a separate reviewed authority/test contract is explicitly opened.

### Expert C — adapter-owned host spacer/message-list sizing contract
Approach: adjust an authenticated host bottom spacer or message-list layout variable so Red's height is accounted for without directly scrolling.

Strengths:
- can preserve layout semantics without imperative scrolling.

Failure modes:
- more invasive host-style/state mutation;
- highly adapter-specific;
- current A1X evidence does not yet identify the live ChatGPT footer/scroll hierarchy or any approved spacer.

Disposition: keep as the strongest evidence-dependent alternative if host-flow-only Red later fails. **Not authorized now.**

### Outside-frame candidate — shrink or overlay Red instead of growing the footer
This could avoid scroll movement by keeping Red out of the layout or restricting its height.

Disposition: reject any viewport-overlay version because it violates the confirmed structural requirement. A bounded-height in-flow Red with internal content navigation could be tested later, but it still must satisfy the same host-flow and latest-message reachability contract.

### Reliability / security lens
Scroll behavior is not Send authority, but it can cause harmful unintended user-interface actuation. The safest first architecture adds no scroll command and no host style mutation beyond the already-required, reversible structural insertion. Existing Send node identity and all zero-actuation ledgers remain independent gates.

### Constrained mobile lens
Keyboard, orientation, 320-CSS-pixel-equivalent width, 200% text, browser chrome movement, streaming content growth, and virtualized long threads can all change the effective scroll owner or available height. The oracle must re-resolve/verify the current scroll owner and fail closed rather than writing to a stale one.

### Test / certification lead
The primary test must prove both user states and prove the oracle cannot pass by auto-scrolling the page.

## Predeclared Red Scroll / Reflow Contract

### R1 — identify the scroll owner or reject structural Red
Determine whether the relevant conversation scroll owner is the document or a specific ancestor using actual overflow and scroll metrics. It must contain the conversation tail and remain connected. If this is ambiguous on the live host, Red stays rail-only for that adapter.

### R2 — FOLLOWING_LATEST state
If the pre-expand scroll owner is at bottom within the predeclared 1 CSS-pixel rounding tolerance:
- expand Red in flow;
- make zero Ghost scroll API/property writes;
- after layout settlement, require the latest-tail target to remain reachable/visible within the same scroll owner and require the composer/Red to remain visible and non-overlapping;
- collapse and verify there is no stale spacer/padding/height residue.

### R3 — READING_HISTORY state
If the user begins measurably away from bottom:
- capture a stable visible message/fixture anchor identity plus its root-relative geometry;
- expand and collapse Red with zero Ghost scroll writes;
- require no forced jump to latest and no loss/replacement of the anchor;
- in deterministic fixtures, permit at most 1 CSS pixel solely for subpixel/rounded measurement noise; record raw live-host deltas instead of raising the threshold after results are known.

### R4 — streaming intersection
While a response grows, test both FOLLOWING_LATEST and READING_HISTORY. Red may not convert a user who intentionally scrolled up back into follow mode. Host-native scrolling/anchoring events are allowed; Ghost-issued scroll commands are not.

### R5 — passive scroll-write ledger
Instrument the deterministic fixture so Red mount/verify/expand/collapse fails if Ghost calls or sets `scrollTop`, `scrollBy`, `scrollTo`, or `scrollIntoView`. A `scroll` event by itself is not a failure because browser scroll anchoring or native host behavior may move the scroll position without a Ghost write.

### R6 — geometry is the primary oracle
Record before/after:
- `scrollTop`, `scrollHeight`, `clientHeight`;
- scroll-owner and tail rectangles;
- stable history-anchor rectangle when applicable;
- composer and Red rectangles;
- intersection/tail reachability where a fixture sentinel exists;
- Red/observer/listener/pending-repair counts.

Do not use CLS/LayoutShift score as the pass/fail oracle.

### R7 — settle without forcing scroll
Use stable animation-frame measurements as the baseline settlement criterion. `scrollend` may be recorded when supported but cannot be required, because it does not fire if no scroll position changes and older clients may lack it.

### R8 — resize-loop kill
Exercise repeated expand/collapse, keyboard/viewport resize signals, and host rerender. Require bounded/coalesced ResizeObserver repair activity, no repeated `ResizeObserver loop completed with undelivered notifications`, one Red mount, and complete listener/observer teardown.

### R9 — virtualization and stale ownership
Replace or virtualize the message subtree/scroll owner in deterministic fixtures. Any cached stale owner or anchor must be detected before measurement/write. Since passive Red has no scroll authority, stale resolution fails verification and returns to rail rather than mutating the wrong container.

### R10 — no false certification
Hosted Chromium/Firefox/Pixel emulation can certify only the deterministic behavior they actually execute. Real ChatGPT scroll-container identity, physical Android, WebView, GeckoView, real IME/keyboard combinations, and host virtualization remain separate evidence surfaces until tested.

## Novel Finding / Decision
The strongest first Red contract is **scroll-intent-preserving and observational, not corrective**:

1. detect whether the user was following latest or reading history;
2. allow Red to change only its own in-flow size;
3. verify the host's resulting scroll/geometry directly;
4. prohibit Ghost scroll writes in the primary structural path;
5. fail the Red mount for that adapter if latest reachability or history position cannot be preserved naturally;
6. only then consider a separately authorized adapter-specific spacer/layout contract.

This also closes a test-design trap: a browser `scroll` event must not be confused with a Ghost scroll action, because native scroll anchoring/host logic may legitimately change scroll position. Instrument **write authority**, not merely events.

## Tests / Execution
- Live authenticated ChatGPT structure/scroll-owner capture: **NOT RE-RUN** — the interactive-permission gate is unchanged, and repeating it would not discriminate the alternatives.
- Existing deterministic A1X structure probe: **INSPECTED, NOT RE-RUN** — exact 2/2 evidence already exists and no product/test code changed.
- Product syntax/lint/generated/unit/browser matrix: **NOT APPLICABLE / NOT RUN** — no product or test code changed.
- New Red scroll fixture: **NOT CREATED** — current-host insertion/scroll hierarchy remains gated on A1X; this wake is a predeclared methodology step.
- Repository source scroll-path inspection: **EXECUTED**.
- Primary platform and recent user/adoption research: **EXECUTED**.

No new test PASS, CI run ID, job ID, artifact, physical-device result, or live-host scroll behavior is claimed.

## Changes
- `.gitl/autopilot-state.json` — bounded research lease claim and final handoff state.
- `.gitl/evidence/round-6/research-fallback-10.md` — this durable research result.
- Product source: **NONE**.
- Generated extension source: **NONE**.
- Test/product workflow/dependency changes: **NONE**.
- `main`, merge, auto-merge, tag, publish, release: **NONE**.

## Acceptance Criteria
- Latest canonical maker read before Ghost work: PASS.
- State, round plan, orchestration, task prompt, evidence contract, succession rule, deferred queue, mobile-shell brief, latest assignment-linked evidence read: PASS.
- No dependency-ready executable assignment existed: PASS.
- Lease/branch/workflow/PR conflict gate checked before claim: PASS.
- Lease claimed before durable research write: PASS.
- Research mode materially differs from fallbacks 01-09: PASS.
- Repository programmatic-scroll paths inspected: PASS.
- Primary scroll-anchoring, scroll metrics, observer, LayoutShift, and ResizeObserver evidence gathered: PASS.
- Current user/adoption evidence gathered without promoting anecdotes above reproducible project evidence: PASS.
- At least three materially different Red scroll approaches compared: PASS.
- Passive scroll-write ledger and user-intent split produced: PASS.
- Current live ChatGPT scroll owner or insertion slot guessed: NO.
- A2 implementation authorized: NO.
- Send/CHOICE/route/lease/uncertainty weakened: NO.

## Safety Checks
- Send authority unchanged: PASS.
- CHOICE behavior unchanged: PASS.
- Route fail-closed behavior unchanged: PASS.
- Lease semantics preserved: PASS.
- Uncertainty behavior unchanged: PASS.
- Rail fallback unchanged: PASS.
- New structural scroll authority added: NO.
- `main`, merge, auto-merge, tag, publish, release: NONE.

## Risks and Limits
- Current authenticated ChatGPT structure and actual scroll owner remain UNKNOWN, so this research cannot prove Red works on the live host.
- Browser scroll anchoring differs by support and can be suppressed by layout changes; it is not a portable guarantee.
- Virtualized conversations may replace anchors or scroll owners; live behavior is not inferred from deterministic fixtures.
- A 1 CSS-pixel tolerance is only a measurement/rounding allowance for deterministic scroll arithmetic, not an acceptable user-visible jump budget.
- IntersectionObserver measures intersection, not every form of visual occlusion; direct geometry and host-control assertions remain required.
- LayoutShift/CLS is intentionally diagnostic-only for this feature because intentional user expansion may be excluded and support is limited.
- Physical Android, Android WebView, GeckoView/Firefox-Android, real mobile keyboards, and actual assistive-technology behavior remain separately uncertified.
- This is the fourth materially novel wake of the new research-novelty round after fallbacks 07-09. Diminishing returns have not begun because this wake produced a new actionable scroll-authority and user-intent contract.

## Recommended Next Action
If `DQ-R6-LIVE-STRUCTURE-CAPTURE` becomes satisfiable, resume A1X exactly as written and carry the Red R1-R10 scroll/reflow contract into A2/A3/A4 without weakening it.

If the live-capture gate remains unchanged, the next wake should use another materially different bounded research mode, preferably the previously nominated **state-machine/fault-sequence methodology** for structural mount/repair/route/keyboard/rerender interleavings. Do not repeat Red scroll research without changed evidence.

## Assignment Status
- research-only / completed bounded fallback
