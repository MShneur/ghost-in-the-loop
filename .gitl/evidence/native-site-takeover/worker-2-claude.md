# Worker 2 — Claude native takeover promotion

Date: 2026-08-11 UTC
Branch: `feature/native-site-takeover`
Frozen 8.8 branches: untouched

## Scope

Promote the Round-6 bounded Claude structural/native-mount design into the production userscript without changing the frozen 8.8 release candidate, weakening Send safeguards, or claiming live Claude certification.

## Product change

Verified product commit: `46f9dbf46ca35c2ba5a99cf317a1b348db3c2269` (`feat: promote bounded Claude native takeover`).

The existing `NativeSiteMount` now dispatches between reviewed ChatGPT and bounded Claude structural resolvers. The Claude resolver requires a visible reviewed `div.ProseMirror[contenteditable="true"]` editor inside a form, exactly one reviewed safe Send identity, exactly one eligible in-flow flex/grid action-row ancestor containing Send but not the editor, and clipping/ownership checks. Any ambiguity or structural mismatch remains on or demotes to the existing rail.

The shared mount preserves the exact native Send node, uses one ordinary in-flow Ghost host with an open ShadowRoot and `type="button"` Ghost controls, performs zero passive Send/submit/input/keydown actuation, repairs by moving only the Ghost host, and fails closed if the capability target changes.

Generated `extension/content.js` was rebuilt from the userscript by the certification path.

## Deterministic production tests

Added `tests/e2e/native-claude-takeover.spec.js` with production-userscript coverage for:

- verified in-flow mount, exact Send identity, focus preservation, ShadowRoot controls, and passive rail suppression;
- ambiguous structural action-row ancestry -> rail;
- ambiguous reviewed Send -> rail;
- broad non-ProseMirror contenteditable fallback -> rail;
- Send replacement after mount -> Ghost removed and rail restored;
- late native action-row growth -> only the same Ghost host is repositioned, Send/native nodes remain untouched.

## Worker 2 verification

GitHub Actions run: `31454523140`, job `93665467864` — **SUCCESS**.

Passed:

- guarded product transformation;
- `npm run cert:base && npm run lint`;
- full Jest unit suite;
- existing ChatGPT production takeover matrix on Chromium desktop, Chromium mobile, and Firefox;
- new Claude production takeover matrix on Chromium desktop, Chromium mobile, and Firefox;
- representative mobile resource/recovery performance probe;
- verified product commit/push.

An initial carrier workflow parse attempt (`31454479374`) produced zero jobs because its YAML `if:` scalar was malformed. It was corrected before any product mutation; the successful run above is the product evidence. This was a test-harness error, not product evidence.

## Independent audit

The durable Worker 4 audit workflow was expanded to cover both ChatGPT and Claude production takeover fixtures.

Independent GitHub Actions run: `31454665957`, job `93665884297` — **SUCCESS**.

Passed independently:

- base certification and syntax;
- full Jest unit suite;
- combined ChatGPT + Claude Chromium desktop / Chromium mobile / Firefox takeover matrix;
- whole-composer fail-closed ChatGPT regression probe;
- representative mobile resource/recovery performance probe;
- audit artifact upload.

## Boundaries / non-claims

This is deterministic production-userscript certification against controlled fixtures. It does **not** claim live authenticated Claude DOM certification, live-host insertion success, WebKit coverage, physical Firefox-Android coverage, or hosted timing/performance certification.

The Claude resolver is intentionally strict: unsupported or ambiguous live structure must fail closed to the existing rail rather than guess.

No merge, tag, release, publication, `main`, `release/8.8.0-staging`, or frozen 8.8 candidate change was performed.

## Handoff

Claude native takeover is accepted at bounded deterministic + independent cross-browser verification scope. The next dependency-ready step should target live-host/non-actuating structural evidence and accessibility/visual verification without weakening exact-Send or rail-demotion safeguards.
