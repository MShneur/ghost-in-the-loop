# Ghost in the Loop — Master Evaluation & Upgrade Handoff

**Audience:** Cursor AI multi-agent team (parallel agents + one integrator).
**Goal:** Evaluate the whole system, fix the send/detection last mile, and
propose + implement upgrades across six tracks — **without breaking the safety
contracts that make this tool trustworthy.**

Current live version: **8.6.1** (`ghost-in-the-loop.user.js` → `const VER`).
Read this whole file before writing a line of code.

---

## 0. What this project is (2-minute model)

Ghost in the Loop is a **Tampermonkey userscript** (+ a mirrored Firefox MV3
extension) that automates multi-turn AI chat sessions: it reads the assistant's
reply, decides whether to proceed, injects the next prompt, and presses Send —
across ChatGPT, Claude, Perplexity, Gemini, DeepSeek, Copilot, Grok, Manus, and
~13 more. It runs personas, workflows/pipelines, roadmap autopilot, and exports
diagnostic capsules.

- **One file is the product:** `dev/ghost-in-the-loop.user.js` (~5,700-line single
  IIFE). The extension `dev/extension/content.js` is **generated** from it by
  `dev/scripts/build-extension.js` — never hand-edit `content.js`.
- **`dev/` is the working copy.** Live promotion copies `dev/*` → repo root on the
  `main` branch. Live install URL:
  `raw.githubusercontent.com/MShneur/ghost-in-the-loop/main/ghost-in-the-loop.user.js`.
- **Tests are dual-engine:** Jest unit tests (`dev/tests/*.test.js`) + Playwright
  e2e in **both Firefox and Chromium** (`dev/tests/e2e/*.spec.js`). CI parity for
  the extension is gated by `build-extension.js --check`.

---

## 1. NON-NEGOTIABLE INVARIANTS (breaking these fails review)

These are load-bearing safety properties. Every one has tests guarding it. Do not
weaken them; if a fix seems to require it, stop and flag it in your report.

1. **Reviewed-send authority.** `_reviewedSend()` returns an actuator only when it
   is a **unique, visible, enabled, veto-safe** match from a *reviewed* platform
   adapter (or a human-taught control, see #4). No heuristic or learned selector
   may ever *click* Send. Detection may be fuzzy; **actuation may not.**
   (`SEND_VETO` regex + `_sendLooksSafe()` + `_visible()`.)

2. **At-most-once send transaction.** Exactly **one** dispatch per round. The
   mechanism is chosen *before* `_beginSendAttempt()` opens the journal. After
   that, Ghost only *observes* evidence (`_sendEvidence` / `_confirmSend`) or goes
   `uncertain` (`_markSendUncertain` → `reconcileUncertainSend`). **Never escalate
   to a second actuator after the first fires.** (This double-send bug has been
   introduced and reverted once already — do not reintroduce it.) Guarded by
   `sendtransaction.test.js` + `sendlayered.test.js`.

3. **"Backups" means *selection*, not *escalation*.** When you add secondary /
   tertiary send paths (Track F), they must be alternative mechanisms the selector
   picks *before* the journal opens when higher tiers are unavailable — never a
   retry fired after a dispatch that didn't visibly work. Uncertainty resolves by
   observation and by *reconciliation on the next tick*, not by re-firing.

4. **Trusted Types / no innerHTML strings.** Gemini enforces Trusted Types (CSP).
   All DOM built through the `_TT()` policy; never assign raw HTML strings to
   `innerHTML`. Guarded by `trustedtypes.spec.js`.

5. **Own-UI isolation.** Ghost's panel is `#gitl`. Never actuate, read, or teach
   on our own UI: `_isOwnUI(el)` / `el.closest('#gitl')`. Skins are `#gitl`-scoped
   CSS tokens only.

6. **Single-tab authority.** The multi-tab lock (`claimTabLock` / `verifyTabLease`)
   is never relaxed. A tab that lost the lease must not send.

7. **Pause loud, never fail silent.** When Ghost can't act safely it calls
   `Reporter.capture(code, ...)` + `pauseWithProbe(reason)` and surfaces a
   diagnostic. Do not replace a loud pause with a silent best-guess click.

8. **Tests stay green in both engines; the extension stays in parity.**
   `npx jest` + `npx playwright test` all green, and `node scripts/build-extension.js
   --check` reports "current" before any commit.

9. **No model identifier in repo artifacts.** Don't put backing-model names in
   commits, code comments, changelog, or docs.

---

## 2. Repo map & commands

Run everything from `dev/`.

| Path | What |
|---|---|
| `ghost-in-the-loop.user.js` | The product (single IIFE). |
| `extension/content.js` | Generated mirror — build, don't edit. |
| `extension/manifest.json` | MV3 manifest; version must match `VER`. |
| `scripts/build-extension.js` | Generator; `--check` = parity gate. |
| `tests/*.test.js` | Jest unit + source-contract tests. |
| `tests/e2e/*.spec.js` | Playwright, Firefox + Chromium. |
| `tests/setup.js` | Boots the IIFE in a VM, exports internal symbols for tests. |
| `CHANGELOG.md` / `DEVLOG.md` | Ship notes + the "why/what-failed" record. **Read DEVLOG before re-trying anything — many dead ends are already documented.** |

```bash
node -c ghost-in-the-loop.user.js          # syntax
npx jest                                    # unit (fast)
npx playwright test                         # e2e, both engines
node scripts/build-extension.js             # regenerate content.js
node scripts/build-extension.js --check     # parity gate (must say "current")
```

**Key symbols to study first:** platform adapters (`PLAT`, the `chatgpt/perplexity/
gemini/...` objects ~line 534+), `_reviewedSend`, `_sendLooksSafe`, `SEND_VETO`,
`Adapter.injectText`, `Adapter.isGenerating`, `GITL_NET` (network observer),
`engineSend` + `_beginSendAttempt` + `_confirmSend` + `_sendEvidence` +
`_markSendUncertain` + `reconcileUncertainSend`, `TeachStore` + `Teach`,
completion detection (`_replyFingerprint`, `_observeReplyText`,
`_terminalReplyReady`, `_replyAdvancedBeyondBaseline`), `_TT`, `_isOwnUI`.

---

## 3. The problem class you're fixing first (context)

**Symptom (field, Android/Firefox, chatgpt.com):** loop injects the prompt but
pauses every round with `SEND-001 — No safe Send mechanism`. The mobile-web
composer doesn't expose a uniquely resolvable Send button (a dictation button
occupies that slot until a native keystroke), so `getSendBtn()` → null.

**Already shipped (do not redo, build on it):**
- **8.6.0 Teach Mode** — user taps the real Send/input control once; Ghost stores a
  stable per-host selector (`TeachStore`). A taught send is a *reviewed* actuator
  but re-veto'd through `_sendLooksSafe` on every resolve; capture never presses
  the control.
- **8.6.1** — ChatGPT now declares `dispatchFallback: 'enter'` (reviewed
  single-dispatch Enter keydown, same as Perplexity) so mobile web submits its
  ProseMirror composer when no button resolves.

**Still open / suspected weak spots (your starting hypotheses, verify them):**
- Programmatic `execCommand('insertText')` into React/ProseMirror composers may not
  fire the events that *enable* the Send button on some builds → button stays
  `disabled`/absent. Worth an evidence check: after `injectText`, does the composer
  actually contain our text, and does the reviewed button become enabled?
- No **network-truth** completion signal for most platforms — completion is inferred
  from DOM + WS pulses. Fragile under heartbeat/streaming edge cases (see the 8.5.2
  Socket.IO heartbeat fix in DEVLOG for the failure mode).
- **No mobile emulation in CI** — the exact failing environment can't be reproduced
  from the test suite today.
- Selector drift: no canary that detects when a live site changes its DOM.

---

## 4. Multi-agent work plan

Spin up parallel agents on **separate branches off `claude/skin-system-redesign-dh04go`**
(or off `main` if that branch is merged). One **Integrator** agent owns merge order,
keeps tests green, and assembles the final report. Each agent's output is: a diff +
its own tests + a section in the report. **Prefer small, test-backed, reversible
changes behind the invariants above.**

### Agent A — Send/detection last mile (fix + harden)
- **Mission:** make Send reliable on mobile web (ChatGPT + Perplexity first, then
  Gemini/Claude) without violating invariants #1–#3.
- **Do:** verify the `injectText` → button-enable hypothesis on each platform;
  add a pre-dispatch **evidence gate** ("composer actually holds our exact prompt
  and, if a reviewed button exists, it's now enabled") so a taught/Enter path only
  fires when the prompt is really staged; confirm the 8.6.1 Enter path actually
  submits on real ChatGPT mobile web and add a source-contract test.
- **Deliverable:** patch + tests; a short per-platform table of "how Send is
  resolved and confirmed" for the report.
- **Guardrails:** invariants #1, #2, #3, #7.

### Agent B — Gap analysis / audit (mostly read-only)
- **Mission:** enumerate what's missing or brittle across the whole system.
- **Do:** cross-check each platform adapter's selectors against the live sites;
  list every place completion/answer detection can be fooled; find untested code
  paths; check the Teach Mode + uncertain-send reconciliation for holes; audit
  error/diagnostic coverage.
- **Deliverable:** a prioritized **gap register** (severity × likelihood × blast
  radius), each row with a concrete repro or code pointer. Implement only the
  cheap/safe fixes; file the rest for the user to prioritize.

### Agent C — "New ways of reading the chats"
- **Mission:** propose + prototype stronger reply-reading than DOM scraping.
- **Investigate (rank by robustness × effort):**
  - **Network/stream reading** — parse the platform's own streaming responses
    (ChatGPT SSE, Perplexity socket.io frames, Gemini batchexecute, Claude SSE) via
    the existing `GITL_NET` fetch/XHR hook to get *authoritative* completion + full
    text. Highest value, most per-platform fragility — prototype for one platform
    behind a feature flag, read-only, never an actuation source.
  - **`aria-live` / accessibility tree** — many chat apps announce streaming/turn
    completion in live regions; a cross-platform completion signal.
  - **Stop→Send button state transition** as a completion proxy (already partly
    used via `stopVisible`) — formalize it.
  - **Debounced "text stable + terminal marker"** — harden `_observeReplyText` /
    `_replyFingerprint` with a mutation-quiet window.
- **Deliverable:** a comparison memo + one working prototype (flagged off by default),
  with tests. **Reading only — must not touch actuation authority (invariant #1).**

### Agent D — Safeguards
- **Mission:** raise the floor on "never do the wrong thing."
- **Ideas to evaluate/implement:** pre-send verification that the injected text is
  exactly what we intend; ambiguity guard (if >1 plausible composer/send button,
  pause instead of guessing); a global kill-switch + per-site enable; run-away caps
  (max rounds/nudges already exist — audit them); navigation/route-change abort;
  a **dry-run/simulate mode** that shows what Ghost *would* send without sending;
  rate-limiting; detection that the tab/page is the intended conversation.
- **Deliverable:** patches + tests; a "threat model" section for the report.

### Agent E — Newer projects / techniques to fold in
- **Mission:** find external prior art worth adopting — as *techniques*, not heavy
  deps (the userscript is a single dependency-light IIFE; keep it that way; the
  extension may take build-time deps).
- **Look at:** Playwright's role/aria-first locator strategy (informs detection);
  Playwright **device descriptors** for mobile-emulation CI (see Track under Agent G);
  open-source chat-automation userscripts and how they solve completion/send;
  accessibility-tree tooling. For anything proposed, state license, size, and how it
  maps onto the IIFE constraint.
- **Deliverable:** a shortlist with a build-or-skip recommendation each; implement at
  most the one highest-ROI item behind tests.

### Agent F — Secondary & tertiary send/detection backups (selection tiers)
- **Mission:** a documented, evidence-gated **tier ladder** for Send, all obeying
  at-most-once (invariant #2/#3). Proposed order (selector picks the highest
  available *before* the journal):
  1. Unique reviewed Send button (`_reviewedSend`).
  2. Reviewed `dispatchFallback: 'enter'` (composer submits on Enter).
  3. Reviewed `form.requestSubmit()` **only** when a single reviewed `<form>`
     uniquely wraps the composer (careful: past double-send source — must be the
     *chosen* mechanism, fired once, never after another).
  4. Human-taught control (Teach Mode).
  Plus detection backups: reviewed selector → taught selector → memory → heuristic
  (detection only) → pause-with-probe.
- **Deliverable:** the ladder implemented as *pre-journal selection* + a truth table
  in tests proving no path can fire twice.

### Agent G — Optimizations + mobile-repro CI
- **Mission:** performance + closing the "can't reproduce mobile" gap.
- **Do:** add a Playwright **mobile project** (touch + mobile viewport + Firefox
  Android UA) so the failing class is reproducible in CI; profile observer/reflow
  cost on `pointer:coarse` (a `backdrop-filter` reflow bug was already fixed — hunt
  for siblings); cache selector resolution with mutation-based invalidation; ensure
  no per-scroll listeners crept back.
- **Deliverable:** the mobile CI project + at least one e2e reproducing the mobile
  send scenario, plus a perf note.

---

## 5. Rules of engagement

- **Read `DEVLOG.md` first.** Many approaches (naive Enter+submit double-send,
  innerHTML on Gemini, scroll-listener rail jump, heartbeat-as-generation) already
  failed and are documented. Don't repeat them.
- **Propose-then-build for anything risky.** Architectural changes, new actuation
  paths, or anything touching the send transaction: write the plan in your report
  section first, keep the change minimal, gate it with a test that would fail
  without it.
- **Every behavior change ships with a test** (unit source-contract test at minimum;
  e2e when it's a real-browser behavior). New actuation paths need a truth-table
  test proving single-dispatch.
- **Feature-flag experiments off by default.** Network-reading prototypes especially.
- **Keep the diff reviewable.** One track per branch. The Integrator merges in the
  order A → F → D → C/E/G, re-running `npx jest && npx playwright test &&
  node scripts/build-extension.js --check` after each.
- **Bump `VER` + `manifest.json` together; add a CHANGELOG + DEVLOG entry.** Do not
  promote to `main` — leave that to the human; hand back a branch + report.

## 6. What to hand back

A single report (`docs/CURSOR_EVAL_REPORT.md`) with:
1. **Executive summary** — what was fixed, what's proposed, what needs a human call.
2. **Per-track findings** (A–G), each: what you found, what you changed, what you
   deferred and why.
3. **Gap register** (Agent B) — prioritized, with repros.
4. **Reading-the-chat comparison** (Agent C) — options × robustness × effort, and
   the prototype's flag + how to try it.
5. **Send tier truth table** (Agent F) — proving at-most-once holds on every path.
6. **Risk/threat model** (Agent D).
7. **Open questions for the user** — anything needing a real device or a product
   decision.
8. **Verification block** — paste of `jest` + `playwright` + `--check` output on the
   final integrated branch.

## 7. Definition of done

- All invariants (§1) intact; a reviewer can point to the test guarding each.
- `npx jest` + `npx playwright test` green in **both** engines; extension in parity.
- The mobile ChatGPT/Perplexity send scenario is reproducible in CI and passes.
- Report delivered; branch pushed; **no promotion to `main`**, no PR unless the user
  asks.
