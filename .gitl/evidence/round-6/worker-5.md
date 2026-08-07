# Ghost Worker Evidence

## Identity
- Round: 6
- Worker evidence slot: 5
- Intended role: Mobile / browser / accessibility / performance
- Executed by: `scheduled-worker-2-r6-a4-mobile-perf-17`
- Assignment ID: `R6-A4-MOBILE-SHELL-MOBILE-PERF`
- Started at: 2026-08-07T20:14:00Z
- Finished at: 2026-08-07T20:19:59Z

## State Read
- Branch: `agent/8.8-repair-resume`
- Lease claim commit: `9bd26aee6b15a7cd07eb104fca94ceb0fdced6ad`
- A4 test-artifact commit: `0716a99d4afa4ffb0c3b038fdae56604fe2bd881`
- Trigger/tested head: `c34b6a9dd0af078dbd79363fe0475b4a02aeb43a`
- A3 predecessor: submitted after overflow-clipping repair PASS.

## Step Performed
Added and executed a deterministic A4 mobile/browser/accessibility/performance fixture against the exact repaired Blue browser-side candidate blob. The fixture exercises Pixel-class Chromium emulation, a portable desktop-Firefox lane, 320 CSS px reflow, 200% text, reduced motion, deterministic VisualViewport resize signalling, orientation changes, native-control insertion/repair, ARIA semantics, cleanup/resource invariants, and Chromium-only 1x/4x/6x CPU-throttled stress. Hosted timing is descriptive only; the tests contain no post-hoc latency budget.

## Research Sources
- Repository mobile-shell brief and A4 assignment define host-flow, narrow/mobile, keyboard/orientation, accessibility and performance gates.
- Round-6 mobile-reflow evidence predeclares 320 CSS px, 200% text, VisualViewport-as-signal, and platform-claim limits.
- Round-6 constrained-runtime evidence predeclares Chromium-only 1x/4x/6x CPU throttling with invariant-based PASS and descriptive timing only.
- A3 evidence fixes the exact repaired candidate blob at `53cc902428a3fc1496a83ad1bf0bd1bbe6752c84`.

## Changes
- Added `tests/e2e/mobile-shell-blue-mobile-perf.spec.js` in commit `0716a99d4afa4ffb0c3b038fdae56604fe2bd881`.
- The test pins and executes the exact repaired Blue candidate browser body; it does not add live ChatGPT selectors or production binding.
- Temporary workflow and trigger are removed by this result transaction.
- Production userscript/extension behavior: unchanged.

## Tests
- Guard: **success**
- npm ci: **success**
- cert:base/generated parity: **success**
- lint: **success**
- full unit: **success**
- focused Send/route/lease safety: **success**
- browser install: **success**
- exact Blue Chromium+Firefox baseline: **success**
- A3 Red Team Chromium+Firefox baseline: **success**
- A4 mobile/accessibility/performance Chromium+Firefox: **failure**
- Carrier run: `31215306655`
- Job ID: `92987347838`
- Artifact: `9008274458`
- Artifact digest: `43205f30b8082b09f6aff801c3a4d090531d9676ea50e909cc1a582e31e49db9`
- Overall: **FAIL**

## Acceptance Criteria
- Pixel-class Chromium emulation: **FAIL_OR_BLOCKED** — included in A4 fixture Chromium lane.
- Portable desktop Firefox: **FAIL_OR_BLOCKED** — desktop Firefox only; not GeckoView.
- <=500 px / 320 CSS px / 200% text / reduced motion: **FAIL_OR_BLOCKED**.
- VisualViewport signal + orientation transitions: **FAIL_OR_BLOCKED** — deterministic signal/viewport fixture, not a real IME claim.
- In-flow mount, native controls reachable, exact Send identity, zero passive Send actuation: **FAIL_OR_BLOCKED**.
- Observer/listener/pending-repair cleanup and bounded resource counts: **FAIL_OR_BLOCKED**.
- Chromium CPU stress 1x/4x/6x with descriptive timing only: **FAIL_OR_BLOCKED**.
- Physical Android / Android WebView / GeckoView / real assistive technology / calibrated low-end hardware: **NOT TESTED / NOT CLAIMED**.
- Live authenticated ChatGPT structural insertion: **NOT TESTED / UNKNOWN pending A1X**.

## Safety Checks
- Send authority unchanged: YES.
- CHOICE behavior unchanged: YES.
- Route and lease safety unchanged: YES.
- Uncertainty/fail-closed fallback unchanged: YES.
- No `main`, merge, auto-merge, tag, publish, or release action: YES.

## Risks and Limits
Pixel 7 here is Playwright/Chromium emulation, not a physical Android device. Firefox is desktop Playwright Firefox, not Firefox-Android/GeckoView. The VisualViewport case dispatches a deterministic resize signal and the orientation case changes hosted viewport geometry; neither certifies a real mobile IME/browser-toolbar combination. CPU throttling is Chromium-only and relative to the hosted runner. Live ChatGPT binding remains UNKNOWN until A1X current-host evidence is actually obtained.

## Recommended Next Action
Keep A4 retry-ready. Inspect this run and make the smallest test/candidate repair for the concrete failure; do not skip to A5 or research.

## Assignment Status
- retry-ready
