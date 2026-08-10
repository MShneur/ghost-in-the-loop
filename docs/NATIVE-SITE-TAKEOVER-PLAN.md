# Native Site Takeover Rebuild Plan

## Goal

Promote the already-tested Round-6 structural prototypes into the actual Ghost product so Ghost integrates into the AI site's native composer/action area instead of relying on a separate side dock/rail whenever the host structure is safely verified.

This is a rebuild path, not an accessibility-only patch release.

## Product UX contract

1. On a verified supported host, Ghost mounts compact controls **inside the native composer/action row** as an ordinary in-flow element.
2. A successful native mount suppresses the separate visible rail/dock. The rail remains only a fail-closed fallback when native structural verification is unavailable or uncertain.
3. The site's original composer and Send control remain the actual native controls. Ghost never wraps, clones, replaces, or moves Send.
4. Passive mount/repair performs zero Send, submit, input, or keydown actuation and does not steal focus.
5. Ghost's expanded controls open from the native integration point without covering or replacing the composer.
6. ChatGPT and Claude are the first site-specific runners because Round 6 already produced deterministic prototypes for both. Other sites stay on the standard structural protocol or rail fallback until separately verified.

## Existing work to promote

Round-6 evidence already validated test-only native structural prototypes:

- ChatGPT Blue prototype blob: `53cc902428a3fc1496a83ad1bf0bd1bbe6752c84`
- Claude Blue prototype blob: `88277ddbcb268e7a25a9b2f54197f8fc08c4ddcc`
- Final bounded audit: `.gitl/evidence/round-6/final-mobile-shell-audit-retry.md`

Those prototypes proved in-flow mounting, open Shadow DOM controls, exact Send-node preservation, coalesced repair, focus preservation, zero passive actuation, and fail-closed demotion. They were not promoted into the shipped userscript.

## Current gap

The 8.8 staging userscript still mounts the main `#gitl` panel with `document.body.appendChild(panel)` and its composer rail is geometry-positioned beside/above the composer. The release candidate therefore does not yet satisfy the native-takeover UX contract above.

## Build order

1. Extract the Round-6 native-mount primitive into production code in `ghost-in-the-loop.user.js`.
2. Wire a ChatGPT site-specific structural resolver to the current adapter-owned composer and exact reviewed Send identity.
3. Wire the independently specified Claude resolver.
4. On structural success, expose Ghost's compact controls in the native action row and suppress the visible external rail; on any verification loss, cleanly demote to the existing rail.
5. Preserve the existing at-most-once Send transaction, CHOICE, route, lease, uncertainty, and composer-staging safeguards unchanged.
6. Fold the already-reproduced accessibility fixes into this rebuilt UI before release.

## Required gates before release

- Unit/base/build-identity/package checks green.
- Native takeover fixture tests green for ChatGPT and Claude.
- Send identity preserved and passive actuation = 0.
- Existing bad-state/valid-state Send evidence remains 0/1.
- Chromium, Firefox, WebKit, Chrome, and Edge functional checks green where available.
- BrowserStack live-host/device structural checks green for the rebuilt integration where public host state permits.
- Checkly live-host boot/drift canary green.
- Axe serious/critical Ghost-owned violations cleared on the rebuilt UI.
- No new research round unless a concrete failing gate requires it.

## Stop rule

Do not return to cadence-driven research or repeated already-green lanes. Build -> test changed artifact -> repair concrete failure -> final gate. Two failed repair passes on the same defect class trigger a Human Gate review instead of another branch/prototype loop.

## Release boundary

`release/8.8.0-staging`, `agent/8.8-repair-resume`, and `main` remain untouched. This branch is the rebuild line. No merge, tag, publication, or GitHub Release is authorized by this plan.