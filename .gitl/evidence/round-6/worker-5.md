# Ghost Worker Evidence

## Identity
- Round: 6
- Worker evidence slot: 5
- Intended role: Mobile / browser / accessibility / performance
- Executed by: `scheduled-worker-2-r6-a4-mobile-perf-17`
- Assignment ID: `R6-A4-MOBILE-SHELL-MOBILE-PERF`
- Started at: 2026-08-07T20:14:00Z
- Finished at: 2026-08-07T20:22:52Z

## State Read
- Branch: `agent/8.8-repair-resume`
- Lease claim: `9bd26aee6b15a7cd07eb104fca94ceb0fdced6ad`
- Initial A4 artifact: `0716a99d4afa4ffb0c3b038fdae56604fe2bd881`
- Initial carrier result: run `31215306655`, job `92987347838`, artifact `9008274458`, digest `43205f30b8082b09f6aff801c3a4d090531d9676ea50e909cc1a582e31e49db9` — FAIL only because the fixture expected exactly two orientationchange events while Chromium emitted native events in addition to the fixture's manual events.
- Smallest repair commit: `096722a6688a3b5ff3dc1e20aa22ec799cafabdb`.

## Step Performed
A4 added a deterministic mobile/browser/accessibility/performance fixture that executes the exact repaired Blue candidate blob `53cc902428a3fc1496a83ad1bf0bd1bbe6752c84`. The first carrier exposed an oracle bug, not a candidate safety failure: emulated Chromium emitted orientationchange on viewport shape changes while the helper also injected orientationchange, producing four events instead of the synthetic expected two. The recovery removed the injected event and made viewport geometry the orientation oracle. No product behavior was weakened or changed.

## Changes
- `tests/e2e/mobile-shell-blue-mobile-perf.spec.js`: Pixel-class Chromium, desktop Firefox, 320 CSS px, 200% text, reduced motion, deterministic VisualViewport signal, portrait/landscape transitions, native-control repair, ARIA semantics, resource cleanup, and Chromium 1x/4x/6x CPU stress.
- Repair: do not inject duplicate orientationchange; assert final portrait geometry directly after landscape/portrait transitions.
- Production userscript/extension: unchanged.
- Temporary carrier and trigger: removed by this transaction.

## Tests
- Guard: **success**
- Repair application: **success**
- npm ci: **success**
- cert:base/generated parity: **success**
- lint: **success**
- full unit: **success**
- focused Send/route/lease safety: **success**
- browser install: **success**
- exact Blue Chromium+Firefox baseline: **success**
- A3 Red Team Chromium+Firefox baseline: **success**
- repaired A4 Chromium+Firefox fixture: **success**
- Repair carrier run: `31215517114`
- Job ID: `92988007587`
- Artifact: `9008352875`
- Artifact digest: `08555f208f2eaaf5e16318b0deb3975ec9f52947d65f21ff0b69730c678d5297`
- Overall: **PASS**

## Acceptance Criteria
- Pixel-class Chromium emulation plus 320 CSS px / 200% text / reduced motion: **PASS**.
- Deterministic VisualViewport resize signalling and portrait/landscape viewport geometry: **PASS**.
- Portable desktop Firefox semantic/focus/narrow contract: **PASS** — not GeckoView.
- In-flow mount, native controls reachable, exact Send identity, zero passive Send actuation: **PASS**.
- Scoped observer/listener/pending-repair counts and clean teardown: **PASS**.
- Chromium 1x/4x/6x CPU stress: **PASS** with timing descriptive only.
- Physical Android / Android WebView / GeckoView / real IME / real assistive technology / calibrated low-end hardware: **NOT TESTED / NOT CLAIMED**.
- Live authenticated ChatGPT insertion: **UNKNOWN / NOT TESTED pending A1X current-host evidence**.

## Safety Checks
- Send / CHOICE / route / lease / uncertainty authority weakened: NO.
- Host viewport or VirtualKeyboard placement policy mutated: NO.
- Main / merge / auto-merge / tag / publish / release action: NO.

## Risks and Limits
Hosted Pixel emulation is not a physical Android device. The VisualViewport case is deterministic signal evidence, not a real keyboard/IME claim. Desktop Firefox is not GeckoView. CDP CPU throttling is Chromium-only and relative to the hosted runner. Current authenticated ChatGPT structural binding remains UNKNOWN.

## Recommended Next Action
Submit A4 and expose `R6-A5-MOBILE-SHELL-AUDIT`. Do not return to research while A5 is executable.

## Assignment Status
- submitted
