# Track G — Mobile CI and performance audit

## Scope and evidence boundary

This track adds reproducible browser coverage for the mobile buttonless-composer
failure class and removes two measured sources of unnecessary observer work.
It does not inspect an authenticated live site.

Playwright's Firefox executable is desktop Gecko. The `mobile-firefox` project
adds a 412×915 viewport, `hasTouch: true`, real Playwright touchscreen dispatch,
and a Firefox-for-Android-style user agent, but it is not GeckoView and cannot
certify Firefox Android. Device confirmation remains separate.

## Browser matrix

| Project | Engine/build | Viewport/input/UA | Coverage |
|---|---|---|---|
| `chromium` | Desktop Chromium | Desktop defaults | Full e2e suite |
| `firefox` | Desktop Gecko | Desktop defaults | Full e2e suite |
| `mobile-firefox` | Desktop Gecko | 412×915, touch dispatch, Android-style Firefox UA | Full e2e suite plus mobile-only fixture assertions |

Firefox projects are advertised when a Firefox binary is installed. CI installs
Chromium and Firefox before listing/running the matrix. The workflow now runs
from `dev/`; previously it exercised the stale promoted root tree, so changes to
the canonical development suite did not reach CI. The first matrix run exposed
two mouse-only orb tests; their mobile variants now use Playwright touchscreen
input for taps and the product's touch Pointer Event path for dragging.

## Mobile buttonless-composer fixture

`tests/e2e/mock-mobile-buttonless.html` models the relevant shape without
claiming to mirror a current live DOM:

- fixed, phone-sized ProseMirror-style contenteditable composer;
- attachment popup and dictation buttons adjacent to the composer;
- no Send button;
- a Stop control that appears only after the fixture accepts Enter;
- existing assistant output so confirmation starts from a realistic baseline.

`mobile-buttonless.spec.js` runs only in `mobile-firefox` and proves:

1. the project has its requested viewport, UA and touch configuration, and a
   Playwright touchscreen tap arrives as `pointerType: "touch"`;
2. the reviewed buttonless strategy emits one Enter keydown, presses neither
   adjacent trap, then commits only after `composer+stop` evidence;
3. when the fixture ignores Enter, the prompt remains staged, the transaction
   becomes `uncertain`, the round does not advance, and no second actuator runs.

These are safety properties of the synthetic failure class, not live-site
compatibility claims.

## Performance audit

### Measured changes

The browser tests count work at the expensive boundary rather than using a
timing benchmark:

| Reproduction | Before | After | Safety check |
|---|---:|---:|---|
| 200 unrelated class changes in one burst while running | 1 debounced full-page Continue scan | 0 scans | Revealing a matching Continue control still produces exactly 1 scan/click |
| One unrelated 200-node append burst | 1 sentinel style/layout check | 0 style/layout reads | Removing `#gitl` still produces 1 observer-driven remount before the 3s poll |

Implementation is limited to mutation-record filtering:

- the Continue observer schedules work only when the changed subtree contains a
  button with a reviewed Continue label;
- the panel sentinel schedules its liveness check only when the panel is
  disconnected or a removed subtree contains it.

The sentinel's 3-second poll remains intentional because its child-list observer
cannot see a host stylesheet hiding the panel.

### Observer and reflow inventory

| Component | Lifetime and trigger | Layout/style cost | Finding |
|---|---|---|---|
| Continue observer | Permanent; body child/selected-attribute mutations; active only while running | `clickContinue()` scans buttons after 300ms debounce | Filtered as above |
| Re-detect observer | At most 12s after a failed manual re-detect; child mutations; 250ms throttle plus 800ms interval | Input visibility/resolution checks | Bounded and user-triggered; unchanged |
| Rail tracker | Only in opt-in rail mode; ResizeObserver, child observer, 1.2s geometry poll | One composer rect read when polling; reposition is animation-frame coalesced | Acceptable bounded tradeoff; unchanged |
| Panel sentinel | Permanent child observer plus 3s fallback poll | Style and panel rect reads in `isDown()` | Unrelated mutation reads removed |

No page-scroll event listener exists. The rail follows resize/visual-viewport
changes and its bounded poll; the existing source-contract test prevents a
scroll listener from returning. Export code intentionally changes scroll
positions while harvesting, which is not a listener.

## Selector resolution, caching, and invalidation

- `_q` caches configured input and diagnostic-stop results. Every cache hit
  checks `isConnected` and own-UI exclusion.
- Element caches clear on route changes, Ghost reboot, manual re-detect, and
  return-to-visible when the cached composer detached. SPA boot retry clears
  configured-selector entries while hydration is incomplete.
- Heuristic input/send candidates have a four-second TTL and liveness checks.
  Persistent Selector Memory is input/read-only; learned Send is disabled.
- `_reviewedSend()` is deliberately uncached. Each call freshly resolves every
  reviewed selector and re-checks unique match, connection/visibility, enabled
  state, own-UI exclusion, and the safety veto. Taught Send resolution is also
  fresh and re-vetoed.

No mutation-based actuator cache was added. A still-connected control can change
meaning or state without being removed, so caching it could stale actuation
authority. A connected-but-hidden cached input remains a residual detection
edge case; broad mutation invalidation was deferred because it adds permanent
whole-page work and is not needed to realize the measured gains above.

## Verification commands

Run from `dev/`:

```bash
npx jest --runInBand
npx playwright test
node scripts/build-extension.js --check
node --check ghost-in-the-loop.user.js
node --check extension/content.js
```

Targeted measurement/reproduction:

```bash
npx playwright test tests/e2e/observer-performance.spec.js
npx playwright test tests/e2e/mobile-buttonless.spec.js --project=mobile-firefox
```

Verified on this branch:

- Jest: 36 suites, 428 tests passed.
- Playwright: 120 passed, 6 expected skips (the three mobile-only cases skip in
  each desktop project); Chromium, desktop Firefox, and `mobile-firefox` green.
- Userscript and generated extension syntax: passed.
- Generated extension parity: current.
