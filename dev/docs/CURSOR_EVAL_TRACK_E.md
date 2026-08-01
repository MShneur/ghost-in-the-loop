# Track E — External Prior Art Evaluation

**Research snapshot:** 2026-08-01  
**Scope:** locator semantics, mobile emulation, chat automation, stream
parsing, accessibility signals, selector resilience, and adjacent browser
automation tools.

## Executive recommendation

Ghost should adopt techniques, not runtime frameworks:

1. **Build mobile Playwright projects now, in the test harness.** Add a
   Chromium mobile-device project and keep the existing narrow-viewport
   Firefox project. A bundled mobile descriptor must not be spread into the
   Firefox project because Playwright does not support `isMobile` there.
2. **Build a small, read-only semantic candidate resolver.** Apply
   role/accessible-name/scope/visibility/strict-uniqueness ideas to composer
   discovery and diagnostics. Do not let it authorize Send.
3. **Prototype a bounded SSE parser behind the network-reading feature flag.**
   Write it clean-room from the WHATWG state machine, consume a cloned response
   concurrently, cap all buffers, and emit observations only. Do not import a
   parser into the userscript and do not make network data an actuator.
4. **Experiment with live-region and `aria-busy` transitions as corroborating
   completion evidence.** They are useful hints, not universal truth.
5. **Use full accessibility trees only in an external canary/test tool.**
   BrowserGym demonstrates the approach, but Chrome DevTools Protocol (CDP)
   cannot be a cross-browser userscript dependency.
6. **Skip automatic selector healing and generated actuator selectors.**
   Probabilistic recovery is appropriate for test diagnostics, not a button
   that sends user text.
7. **Skip wholesale adoption of the surveyed chat extensions and browser
   agents.** Their useful patterns can be reproduced in Ghost's small IIFE;
   their frameworks, permissions, dependencies, or licenses do not fit.

This track intentionally makes no runtime change. The highest-value concrete
items belong to the mobile-CI and reply-reading tracks, where they can be added
with the right integration tests. A selector or parser patch here would either
duplicate that ownership or introduce an unvalidated safety signal.

## Evaluation rules

The following Ghost contracts constrain every recommendation:

- `_reviewedSend()` remains the only DOM-button authority: reviewed profile or
  human-taught control, exactly one match, visible, enabled, and veto-safe.
- Heuristics, accessible-name matching, learned locators, stream contents, and
  accessibility changes are **observations only**.
- One dispatch is selected before `_beginSendAttempt()`; no technique here
  permits a retry or second actuator.
- `ghost-in-the-loop.user.js` stays a dependency-light single IIFE.
- `extension/content.js` remains generated.

“Maintenance” below is a timestamp signal, not an endorsement. Dates are the
latest default-branch commit observed from GitHub on the snapshot date.
Package sizes are npm `dist.unpackedSize`; source-file and repository sizes are
identified explicitly and are not interchangeable with installed size.

## Shortlist and build/skip calls

| Technique | Call | Why | IIFE/runtime cost |
|---|---|---|---|
| Playwright mobile device project | **BUILD (test only)** | Reproduces touch, narrow layout, mobile UA, screen, DPR, and viewport behavior that desktop projects miss | Zero product bytes; Playwright is already a dev dependency |
| Role/name/scope candidate pipeline | **BUILD (read-only first)** | More resilient than class chains and consistent with what users perceive | Small local helper; no imported AccName implementation |
| Strict uniqueness and fresh re-resolution | **KEEP / EXTEND** | Playwright's strict locator behavior matches Ghost's existing reviewed-send safety model | Already represented by `_reviewedSend()`; extend diagnostics only |
| Bounded SSE event state machine | **BUILD (flagged prototype)** | Distinguishes complete events and terminal markers from raw byte pulses | Hand-written, platform-neutral parser core plus per-platform decoders |
| Socket.IO packet parsing | **DEFER** | Correctly separates Engine.IO heartbeat/control packets from application events, but provider payloads remain platform-specific | Small protocol recognizer is possible; requires captured fixtures |
| `aria-live` / `aria-busy` observation | **EXPERIMENT** | Can expose streaming and settled-state transitions without scraping presentation classes | MutationObserver over a bounded set of existing regions |
| `ariaNotify()` | **SKIP for reading** | It sends announcements; it does not expose another site's announcement queue, and support is not universal | No value for reply detection |
| Full accessibility-tree snapshots | **BUILD in canary, SKIP in IIFE** | Excellent selector-drift evidence with computed names/roles | CDP/Chromium-only external tooling, not page JavaScript |
| Full AccName library | **SKIP runtime dependency** | Correct but much larger than the bounded semantics Ghost needs | `dom-accessibility-api` 0.7.1 is 282,447 B unpacked |
| CSS selector generator | **SKIP for actuators** | Unique today does not mean semantically stable tomorrow | `@medv/finder` is small, but positional fallbacks are unsafe authority |
| Probabilistic self-healing | **SKIP** | A confidence threshold can silently select the wrong safe-looking button | Healenium also requires a Selenium/backend architecture |

## 1. Playwright locator mechanics

### Verified mechanics

Playwright's current locator guide recommends user-facing attributes and
explicit contracts. Its built-ins include role, text, label, placeholder, alt
text, title, and test-id locators. The useful mechanics for Ghost are:

- `getByRole(role, {name})` uses explicit and implicit roles plus the computed
  accessible name, following ARIA and Accessible Name specifications.
- A locator is re-resolved before each action, so a framework re-render does
  not leave it bound to a stale element.
- Locators can be narrowed by ancestor scope, descendant presence, text,
  visibility, and intersections.
- Actions that imply a single target are strict: multiple matches fail rather
  than silently picking one. `or()` can also match both alternatives, so it
  does not waive strictness.
- CSS and XPath are supported but discouraged when they encode DOM structure.
  Playwright locators pierce open shadow roots by default; XPath does not, and
  closed roots remain inaccessible.

### Clean-room adaptation for Ghost

Do **not** bundle Playwright or reproduce the full AccName algorithm in the
userscript. Browser page JavaScript has no standard API that simply returns the
browser's computed accessible name. Instead, add a bounded semantic pipeline:

1. Scope outside `#gitl` and, when possible, inside the same composer/form
   neighborhood as the known input.
2. Gather likely editable elements or controls by native element type,
   `contenteditable`, and explicit/implicit role.
3. Derive a diagnostic name from a documented subset: `aria-labelledby`
   references, `aria-label`, associated `<label>`, then placeholder/title/text
   as appropriate.
4. Reject hidden, disabled, popup/menu, own-UI, and veto-text candidates.
5. Require a unique top candidate. Ambiguity is a result to report, not a tie
   to break.
6. Re-resolve from the DOM at point of use.

Use this first for `_heurInput()`, drift reports, and Teach Mode guidance. For a
Send control it may explain which candidates exist, but `_reviewedSend()` must
still resolve a reviewed selector or taught selector. Semantic similarity must
never promote a new actuator.

The full W3C accessible-name computation includes hidden-node rules,
name-from-content recursion, IDREF traversal, embedded controls, and CSS
generated content. A partial implementation must be labeled an approximation;
it must not claim parity with assistive technology or Playwright.

### Device descriptors

Playwright's device registry supplies combinations of user agent, screen,
viewport, device scale factor, touch support, and mobile behavior. Emulation is
valuable for responsive DOM branches, but it is not physical-device
certification.

At the snapshot, npm reported `@playwright/test` 1.62.1 under Apache-2.0,
modified 2026-08-01. Its wrapper package was 28,544 B unpacked; that figure
excludes `playwright-core` and downloaded browser binaries. The Playwright
repository's default branch had a 2026-07-31 commit. Ghost already carries
Playwright as a development-only dependency, so the proposed project adds no
runtime package.

Recommended project matrix:

- **Chromium desktop:** retain the current project.
- **Chromium mobile:** spread one current Android-class descriptor into a
  separate project. Exercise the real mobile responsive branch, touch, DPR, and
  meta viewport behavior.
- **Firefox narrow/mobile-like:** retain desktop Gecko with the explicit narrow
  viewport and Android UA. Do not set `isMobile`; Playwright's API states that
  it is unsupported in Firefox.
- **Real-device smoke test:** retain as a release/field check for GeckoView,
  virtual keyboard, userscript manager, and native input-event differences.

High-value mobile cases are: composer insertion enables or reveals Send;
dictation-vs-Send replacement; Enter fallback dispatches once; ambiguity
pauses; panel remains usable at narrow widths; and no generated extension
parity drift.

## 2. Network stream parsers

### Current Ghost baseline

`GITL_NET` already does the safest first step:

- patches page `fetch`, XHR, and WebSocket defensively;
- consumes cloned fetch bodies rather than stealing the page response;
- emits byte/done observations for known endpoints;
- treats unknown same-origin POST/event-stream traffic as bounded heuristic
  pulses;
- excludes common WebSocket heartbeat/control frames; and
- allows stable terminal DOM evidence to override stale network activity.

It does **not** parse event boundaries, packet types, reply text, or
provider-specific completion markers. This is an intentional metadata-only
observer today.

### SSE prior art

Two maintained MIT packages provide useful reference behavior:

| Project | Verified release/size | Maintenance | Call |
|---|---|---|---|
| [`eventsource-parser`](https://github.com/rexxars/eventsource-parser) | 3.1.0; 123,218 B unpacked | commit/release 2026-05-27 | **Study tests/state machine; do not import** |
| [`parse-sse`](https://github.com/sindresorhus/parse-sse) | 0.1.0; 18,501 B unpacked | commit/release 2025-10-25 | **Best size reference; still clean-room** |

`eventsource-parser` accepts arbitrary partial chunks, handles events,
comments, retry fields, errors, reset/flush, and (in 3.1.0) a configurable
maximum buffer. `parse-sse` composes a `Response` with native
`ReadableStream`/`TransformStream` and preserves event type, multiline data,
last-event ID, and retry state.

For Ghost, importing either package is unnecessary. The required subset can be
implemented from the WHATWG event-stream algorithm:

- decode UTF-8 incrementally with `TextDecoder(..., {stream:true})`;
- retain a bounded partial line across chunks;
- accept CRLF, lone LF, and lone CR;
- ignore comment lines;
- split only on the first colon and remove at most one leading space;
- append multiple `data:` fields with newline semantics;
- dispatch only at a blank line;
- retain event name and last-event ID where needed; and
- terminate parsing and drop trust if any line/event/stream cap is exceeded.

The generic parser should output `{event, data, id}` observations. A separate,
reviewed platform decoder may interpret JSON and terminal markers. Never store
raw prompts, headers, credentials, or full responses in diagnostics.

The clone must be consumed concurrently and cancellation/navigation must be
normal. Parsing should be disabled per platform after repeated malformed or
oversized frames. A parsed “done” event is completion evidence; it is not send
confirmation and never authorizes an action.

### WebSocket and Socket.IO

The Socket.IO protocol is layered over Engine.IO. Numeric packets for open,
close, ping, pong, message, upgrade, and noop are not all application data;
Socket.IO adds connect/disconnect/event/ack/error/binary packet types and
namespaces. Ghost's current heartbeat filter fixes the most damaging false
positive, but string-length heuristics cannot establish reply completion.

**Call: defer until sanitized fixtures exist.** Then implement a tiny packet
classifier from the protocol specification, preserving `_wsFrameIsMeaningful`
as the fail-safe fallback. Only provider-specific event names/payload schemas
can produce completion evidence. Unknown packets remain pulses.

## 3. Accessibility and live-region techniques

ARIA defines `aria-live` politeness (`off`, `polite`, `assertive`),
`aria-atomic` whole-region announcements, and `aria-busy` state while a region
is still being modified. These attributes are observable in normal DOM and
sometimes align better with user-visible updates than generated CSS classes.

Recommended read-only experiment:

1. At reply baseline, collect a capped set of visible, non-Ghost elements with
   live-region roles/attributes, plus relevant ancestors of the assistant
   container.
2. Observe child/text mutations and changes to `aria-busy`.
3. Record only timestamps, normalized text fingerprints, region identity, and
   busy transitions.
4. Treat `busy: true → false` plus reply advancement and a terminal DOM state
   as corroborating completion evidence.
5. Ignore unrelated status/toast regions and stop observing on navigation,
   pause, or a strict timeout.

Limitations are material: sites may omit live regions, replace them during a
render, announce unrelated status, leave `aria-busy` unset, or keep an atomic
region changing after generation. Therefore a live-region event alone must not
end a turn.

`Element.ariaNotify()` is not a reader. It asks assistive technology to
announce a supplied string and does not expose announcements from the page.
MDN marked it limited availability on the snapshot date. Ghost may later use a
feature-detected call to improve its own accessibility, with a polite live
region fallback, but it has no role in reply detection.

### Full accessibility tree

BrowserGym is strong prior art for an external drift canary. Its observation
code:

- marks DOM elements with stable temporary IDs;
- captures `DOMSnapshot.captureSnapshot` with layout bounds/clickability;
- calls `Accessibility.getFullAXTree` for each frame; and
- joins accessibility nodes back to DOM identities.

This yields computed role, name, description, states, visibility/layout, and
frame context. It is useful for “the reviewed selector disappeared; these
semantic candidates replaced it” reports.

It does not belong in Ghost's IIFE. The CDP Accessibility and DOMSnapshot
domains are experimental and Chromium-specific; a content script cannot assume
CDP access. Build this as a Playwright/Chromium canary artifact, while keeping
cross-engine end-to-end assertions based on public Playwright locators.

`dom-accessibility-api` is a credible MIT testing implementation of AccName,
with web-platform-test coverage and a documented visibility limitation. At
282,447 B unpacked it is disproportionate for the userscript. It may be used as
a **dev-only oracle** for unit fixtures if a future semantic resolver warrants
that differential testing.

## 4. Selector resilience

### Useful patterns

- Playwright: semantic contracts, composition, strictness, fresh resolution.
- [`@medv/finder`](https://github.com/antonmedv/finder): configurable filtering
  of class names, attributes, IDs, tags, and selector root; unique selector
  generation; bounded search timeout.
- Healenium: stores historical locator context, scores replacement candidates,
  and reports healed locators.

### Ghost decision

Keep Ghost's split between **observation resilience** and **actuator
authority**. `SelectorMemory` is appropriate for a composer because writing can
still be verified before dispatch. It correctly refuses Send memory. Teach Mode
is explicit human review and re-applies vetoes when resolving.

Do not add general generated selectors for Send. Finder's README advertises a
1.5 kB minified+gzipped implementation and its npm package is only 14,170 B
unpacked, but fallback selectors containing structural position can drift to a
different control while remaining unique. The useful clean-room ideas are:

- limit the root to the composer neighborhood;
- reject hashed/volatile IDs and classes;
- prefer stable ARIA/data/name/type attributes;
- require uniqueness;
- record a semantic fingerprint separately from the selector; and
- invalidate rather than “heal” when the fingerprint changes.

Do not add Healenium. Its web library is designed around Selenium, a backend,
an imitator service, recovery tries, and a score threshold. More importantly,
probabilistic healing conflicts with reviewed-send authority. Its pattern is
acceptable only for a canary that proposes adapter updates for human review.
The project is Apache-2.0 and had a 2026-03-03 default-branch commit, but its
multi-service architecture makes a package-size comparison with an IIFE
misleading.

## 5. Chat automation and userscript prior art

| Project | License evidence | Size / architecture | Maintenance signal | Build/skip |
|---|---|---|---|---|
| [`chatgpt-auto-continue`](https://github.com/adamlui/chatgpt-auto-continue) | MIT in userscript header and `docs/LICENSE.md`; GitHub root-license detection is empty | Main userscript blob 38,869 B, but it pins several remote `@require`s; `@kudoai/chatgpt.js` 4.15.6 alone is 617,355 B unpacked | 2026-08-01 | **Study only.** It polls for a Continue control every 500 ms and clicks it; Ghost already has a smaller reviewed `clickContinue()` and should not import the library stack |
| [`chatgpt.js`](https://github.com/KudoAI/chatgpt.js) | MIT in package metadata and `docs/LICENSE.md` | Automation library; npm 4.15.6 is 617,355 B unpacked | 2026-07-31 | **Skip dependency.** Broad convenience API is larger and single-site-oriented; retain narrowly reviewed local adapters |
| [`KeepChatGPT`](https://github.com/xcanwin/KeepChatGPT) | GPL-2.0-only LICENSE | Single userscript source blob 151,017 B | 2026-07-20 | **Do not copy.** GPL-2.0-only cannot simply be combined into this AGPLv3 program; broad keepalive/tracking/UI behavior also exceeds Ghost's scope |
| [`MCP-SuperAssistant`](https://github.com/srbhptl39/MCP-SuperAssistant) | MIT LICENSE/package metadata | Multi-package extension; root runtime dependencies include React, React DOM, and Firebase; GitHub reports ~3.7 MB repository size | 2026-02-09 | **Skip runtime.** Study explicit manual/auto-execute controls, tool cards, and transport status; tool execution needs a separate threat model |
| [`MultAI`](https://github.com/Arvid-pku/MultAI) | README says MIT, but no LICENSE file was found and GitHub reports no detected license | MV3, per-provider scripts, iframed sites, DNR header rewriting; GitHub reports ~0.9 MB repository size | 2026-05-01 | **Skip code and iframe design.** Compare drawer/prompt library are product ideas only; rewriting frame protections expands security and policy risk |
| [`ChatHub`](https://github.com/chathub-dev/chathub) | GPL-3.0 | React/Vite extension with a large dependency list, API and web adapters, local history, prompt library, compare/export; GitHub reports ~5.0 MB repository size | 2026-02-27 | **Skip dependency.** Feature breadth is useful roadmap input, not IIFE prior art |
| [`simple-chat-hub-extension`](https://github.com/jackyr/simple-chat-hub-extension) | No license grant found | MV3 multi-chat extension; GitHub reports ~32 MB repository size | 2026-04-06 | **Do not reuse.** Treat unlicensed source as all-rights-reserved |

The strongest lesson from these projects is not a selector: it is explicit
scope. Continue-button utilities can be tiny but rely on polling and a large
helper library; multi-provider extensions gain compare/history/tool features by
accepting framework size, broad host permissions, and per-provider maintenance.
Ghost should preserve its compact adapter boundary and add only independently
specified features.

## 6. Broader tools with more options

| Project | License | Options beyond Ghost | Maintenance / size note | Decision |
|---|---|---|---|---|
| [`Browser Use`](https://github.com/browser-use/browser-use) | MIT | General browser tasks, custom tools, persistent sessions, structured extraction, hosted/local modes | commit 2026-07-27; Python/browser-agent stack, GitHub reports ~33.5 MB repository size | **Skip runtime; study trace/tool abstractions** |
| [`BrowserGym`](https://github.com/ServiceNow/BrowserGym) | Apache-2.0 LICENSE (GitHub API reports `NOASSERTION`) | Benchmarks, screenshots, DOM snapshots, AX trees, stable DOM IDs, action/observation spaces | commit 2026-03-17; Python + Playwright + CDP | **Adopt AX-tree canary technique only** |
| [`Nanobrowser`](https://github.com/nanobrowser/nanobrowser) | Apache-2.0 | General task planning/navigation, multi-agent roles, side panel, history, local browser execution | commit 2025-11-24; React/Turbo extension monorepo | **Skip runtime; study plan/navigate separation** |

These tools solve open-ended browser control, not deterministic chat-loop
continuation. Their larger option sets bring planning, screenshots, arbitrary
clicks, credentials, proxies, and tool execution. Folding those runtimes into
Ghost would weaken the small reviewed adapter surface. The useful adaptation is
an **offline canary/diagnostic layer** that produces evidence for a human or a
reviewed adapter update.

## 7. License and clean-room guidance

Ghost is AGPLv3. This is an engineering screen, not legal advice:

- MIT and Apache-2.0 sources are generally usable if their notice and license
  obligations are preserved. Even so, no surveyed package is necessary at
  runtime.
- AGPLv3 section 13 expressly addresses combining with GPLv3. That does not make
  GPL-2.0-only source automatically compatible.
- A README assertion without a license text, or a repository with no license
  grant, is not a safe source-copying basis.
- Ideas, public standards, and externally observable behavior can be
  independently implemented. Do not translate or mechanically port project
  source.

Clean-room procedure for the recommended work:

1. Write a behavior specification from W3C/WHATWG/Playwright/protocol docs and
   Ghost's own invariants.
2. Create original fixtures: split SSE lines/chunks, duplicate semantic
   controls, hidden/popup controls, busy/live transitions, and sanitized packet
   frames.
3. Implement from the specification without looking at third-party function
   bodies during coding.
4. Differential-test against standards examples or a dev-only permissive
   oracle; never ship the oracle.
5. Keep per-platform payload interpretation separate from generic parsing.
6. Preserve attribution for any copied standard test vector whose terms
   require it; otherwise generate local vectors.
7. Run unit, Chromium, Firefox, and generated-extension parity gates before
   promotion.

## Primary sources

### Standards and browser tooling

- Playwright, [Locators](https://playwright.dev/docs/locators),
  [Emulation](https://playwright.dev/docs/emulation), and
  [`isMobile` API note](https://playwright.dev/docs/api/class-testoptions#test-options-is-mobile)
- W3C, [Accessible Name and Description Computation 1.2](https://www.w3.org/TR/accname-1.2/)
- W3C, [`aria-live`](https://www.w3.org/TR/wai-aria-1.2/#aria-live),
  [`aria-busy`](https://www.w3.org/TR/wai-aria-1.2/#aria-busy), and
  [`aria-atomic`](https://www.w3.org/TR/wai-aria-1.2/#aria-atomic)
- MDN, [`Element.ariaNotify()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/ariaNotify)
- WHATWG, [Server-sent event stream interpretation](https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation)
- Socket.IO, [protocol specification](https://github.com/socketio/socket.io-protocol)
- Chrome DevTools Protocol,
  [`Accessibility.getFullAXTree`](https://chromedevtools.github.io/devtools-protocol/tot/Accessibility/#method-getFullAXTree)
  and
  [`DOMSnapshot.captureSnapshot`](https://chromedevtools.github.io/devtools-protocol/tot/DOMSnapshot/#method-captureSnapshot)

### Projects and package metadata

- [Playwright](https://github.com/microsoft/playwright) — Apache-2.0
- [eventsource-parser](https://github.com/rexxars/eventsource-parser) — MIT
- [parse-sse](https://github.com/sindresorhus/parse-sse) — MIT
- [dom-accessibility-api](https://github.com/eps1lon/dom-accessibility-api) — MIT
- [finder](https://github.com/antonmedv/finder) — MIT
- [Healenium Web](https://github.com/healenium/healenium-web) — Apache-2.0
- [chatgpt-auto-continue](https://github.com/adamlui/chatgpt-auto-continue) — MIT notices described above
- [chatgpt.js](https://github.com/KudoAI/chatgpt.js) — MIT
- [KeepChatGPT](https://github.com/xcanwin/KeepChatGPT) — GPL-2.0-only
- [MCP-SuperAssistant](https://github.com/srbhptl39/MCP-SuperAssistant) — MIT
- [MultAI](https://github.com/Arvid-pku/MultAI) — incomplete license signal described above
- [ChatHub](https://github.com/chathub-dev/chathub) — GPL-3.0
- [simple-chat-hub-extension](https://github.com/jackyr/simple-chat-hub-extension) — no license found
- [Browser Use](https://github.com/browser-use/browser-use) — MIT
- [BrowserGym](https://github.com/ServiceNow/BrowserGym) — Apache-2.0 file
- [Nanobrowser](https://github.com/nanobrowser/nanobrowser) — Apache-2.0

## Track outcome

Research-only commit. No dependency, userscript, generated extension, manifest,
or test file was changed. The recommended first implementation is the mobile
Playwright project; the recommended first runtime experiment is bounded SSE
event parsing, owned by the reply-reading track and observation-only.
