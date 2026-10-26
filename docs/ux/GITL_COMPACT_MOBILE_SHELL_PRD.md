# Ghost in the Loop — Compact Embedded Mobile Shell UX PRD

**Status:** BOUNDED DESIGN BRIEF · NOT IMPLEMENTED · OWNER VISUAL APPROVAL REQUIRED  
**Date:** 2026-10-26 · **Baseline:** Ghost 9.0.17, source commit `88b995c650b1521a7ffb8936b96731318b61b426`  
**Owner intent:** Make the existing tiny Ghost companion **smaller, more elegant, faster to scan**, without converting it into a standalone app or losing a single real control.  
**Entry point for future workers:** Read this file, `AGENTS.md`, current `ghost-in-the-loop.user.js`, `tests/v9-compact-mobile-ui.test.js`, `.gitl/briefs/mobile-shell-concepts.md` and current `CHANGELOG.md` *before* any redesign.

## 0. Non-negotiable framing

Ghost is a **userscript shell attached to the host AI chat**, not a browser replacement, separate dashboard, home page, command center, or generic AI assistant. Show the real ChatGPT mobile chat *behind/alongside* the Ghost control panel. The chat's composer, messages, attachment, microphone and native Send controls remain usable. Type the task in the **host chat**; do **not** invent a second Ghost task composer.

**This design task is restricted to the existing panel, its rail, CSS hierarchy, navigation presentation, and genuine UI states.** Do not change core prompts, features, algorithms, approvals, storage, permissions, integrations, Send engine, or mounting semantics without a separate authorized implementation task. **Do not merge or deploy on this brief alone.**

## 1. Source-of-truth mobile geometry

| Item | Verified existing implementation | Design rule |
|---|---|---|
| Expanded panel | `#gitl9`; `width:min(334px,calc(100vw - 12px))` in later CSS rule | Treat **334 CSS px as a ceiling, not a desired width**. Propose a visibly slimmer default (target 260–290 CSS px where usable); verify actual fit instead of forcing a number. |
| Height | Viewport-derived `dvh`/safe-area cap, plus `fitPanelViewport()` and `visualViewport` resize | Reduce default vertical occupancy and internal empty space. Maintain bounded scroll. Never cross composer, keyboard or browser chrome. |
| First/open location | Current default `dock-right`; `dock-left`, draggable `float`, near `composer-row`, near `header-row` | All five existing options must remain, as do collapse and side rail. No separate side app. |
| Collapsed | Thin side rail, live progress, ghost indicator, AA/AA! state | Keep rail functional, compact, re-expandable, not a massive bubble. |
| Navigation | Seven **real** tab buttons near top; CSS presently four-column wrap | Preserve direct, labeled access to **all seven** sections on the expanded panel. Different agencies may vary shape, positioning *within the panel* and density, but not substitute fictional menus or erase destinations. |
| Scrolling | `.g-scroll` internal overflow with `overscroll-behavior:contain` | One primary scroll region; don't trap or hijack the host chat's scroll/focus. |
| Interaction | Existing primary buttons about 43 CSS px high, native `details/summary` accordions, conditional toggle styling | Save space by removing surplus containers/copy/margins, **not** by making controls too small to touch. Test 200% text and accessible names. |
| Skins/motion | 13 existing skins; restrained ghost/header motion; reduced-motion support | Reuse existing Ghost identity. Favor 1–2 purposeful motions, no perpetual spectacle or asset-heavy animation. |

**Evidence ceiling:** current userscript/source and hosted fixture tests are inspectable; authenticated Firefox Android + live host mounting/permission behavior is **not certified**. Structural host-affixed header/composer slots in `.gitl/briefs/mobile-shell-concepts.md` are exploratory/fixture-gated and must not be portrayed as universally shipped. Avoid moving/copying the host's Send DOM.

## 2. Exact existing information architecture (DO NOT RENAME INTO FICTION)

| Tab label | Internal tab | Verified controls/content to preserve |
|---|---|---|
| **Run** | `data-tab="play"` | `Play` (`data-a="play"`), `Pause` (`data-a="pause"`), `End` (`data-a="stop"`), `Top` (`data-a="top"`); `Modes & posture` accordion -> `Loop`, `Plan First`, `Roadmap`; `Locked`, `Adaptive`, `Audit`; `Limits & diagnostics` -> max rounds, `Copy report`; progress, execution status |
| **Auto** | `data-tab="auto"` | Session-only `Auto-Approve · ON/OFF` checkbox (`data-auto-approve`); detected / click-attempt / inaccessible status; `How Auto works` accordion; captured AI Roadmap stages when present; editable `Prompt queue`, `＋ Step`, delete step, `▶ Run queue` |
| **Flow** | `data-tab="flow"` | Workflow selector; `▶ Start workflow`; `Pause between` checkbox; actual stages with `Insert` per stage |
| **Personas** | `data-tab="prompt"` | `Committee`, `Every step`, `Final review`; existing single/multiple persona selection; workflow + posture dropdowns; `Workshop` and JSON Import / Copy custom JSON when expanded |
| **AoA** | `data-tab="aoa"` | Checkbox activators **PLEX**, **Model Relay**, **Human Gate**, **Cleanerz**, **Quorum**, **CTRL-AI**, **R-Duck**; custom AoA path field. **These are the shipped controls; named practitioner/persona chips on Run are not.** |
| **Export** | `data-tab="export"` | `Copy MD`, `Save MD`, `Save JSON`; `Advanced export`; `Page backup` -> `Save Page HTML` / `Diagnostic JSON`; `Project Vault` (Create, Add chat, project export/management) |
| **Setup** | `data-tab="settings"` | Skin preset (13), accents, `dock-left` / `dock-right` / `float` / `composer-row` / `header-row`, `Show Quick Start`, `Reset look`, `Test sound`, `Test notification`, existing approval detection option |

**Never confuse destinations with Run modes:** `Auto`, `Flow`, `Personas`, `AoA`, `Export`, `Setup` are tabs, not extra `Loop / Plan First / Roadmap` modes. `Queue` is in **Auto**, not a new Run button. `Auto-Approve` belongs to **Auto**; its AA status indicator may appear in the existing header/rail but its risky toggle must not become a casual Run control.

## 3. Proposed first-open **Run** hierarchy (designable, not committed implementation)

1. **One thin header:** Ghost mark / compact identity, true status and progress signal, collapse, help; avoid repeating the product name, mascot and status in multiple card stacks.
2. **Top menu:** the *seven labels above*. Up to two compact rows or a demonstrably accessible compact scrolling ribbon. Clearly distinguish current tab. No side navigation drawer, invented `Home`, unlabeled glyph-only menu, or always-hidden tabs. A 2-row navigation is currently the lower-risk parity baseline; alternatives must prove seven-tab discoverability.
3. **One condensed live line:** e.g. actual `Idle / Running / Paused`, current loop count and state. No fake telemetry or projected AI progress.
4. **Execution:** `Play · Pause · End · Top` always one action away on Run. Play visually primary; End distinguishable and safe; Pause/Top not omitted. Use disabled states honestly.
5. **Accordions in the Run content:** `Modes & posture` (Loop/Plan First/Roadmap + Locked/Adaptive/Audit) and `Limits & diagnostics` (round limit + Copy report). Closed by default unless saved preference requires otherwise. Avoid double section titles and paragraphs repeating what the buttons already say.
6. **Advanced tabs remain the natural home** for queues, committees, AoA activators, export, skins, and approval settings. Do not bring their large forms onto Run to decorate the first page.

Space-saving priority: eliminate **redundant headers, separators, nested card padding, empty rows, explanatory filler and repeated progress boxes** first; keep readable touch targets and focus indicators. Accordions/segmented controls/toggles are appropriate for *existing choices*. They are **not** a license to invent new switches or hide running state.

## 4. Real small-interface practitioner methods — named-quorum source record

This is a **research-method lens roster**, not a claim that these people joined our project, built a design, approved a layout, or can be summoned as remote human agents. In accordance with [AoA Quorum](https://github.com/MShneur/Agents-of-AI/blob/main/workflows/quorum.md), obtain fresh live sources when actually reconvening; these links record the methods used to form this brief, not a permanently frozen expert verdict.

| Quorum seat (heavy / light) | Practitioners and documented methods | Application to Ghost |
|---|---|---|
| **Method** | **Rauno Freiberg** — [small toolbars/tabs/interaction craft](https://rauno.me/craft); **Steve Schoger** — [Refactoring UI/visual hierarchy](https://www.steveschoger.com/) | Compact 334px-class interaction craft, meaningful hierarchy, restrained detail |
| **Evidence** | **Luke Wroblewski** — [Mobile First](https://www.lukew.com/resources/mobile_first.asp); **Jakob Nielsen** — [progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) | Ruthless mobile prioritization; keep common actions upfront, disclose complexity |
| **Operator** | **Emil Kowalski** — [UI motion, mobile-native implementation methods](https://emilkowal.ski/skill); **Adam Wathan** — [Refactoring UI implementation](https://refactoringui.com/) | CSS/function feasibility, low-cost subtle animation, tight component discipline |
| **Adversary** | **Sara Soueidan** — [accessible icon buttons](https://www.sarasoueidan.com/blog/accessible-icon-buttons/); **Adam Silver** — [accessible form/input patterns](https://adamsilver.io/) | Defend against tiny invisible tap targets, unlabelled icons, deceptive toggles |
| **Affected/mobile** | **Val Head** — [purposeful interface animation/reduced motion](https://valhead.com/); **Raluca Budiu** — [progressive disclosure and mobile usability](https://www.nngroup.com/videos/progressive-disclosure/) | Low-vision/motion-sensitive users and ordinary Android thumb/focus workflows |

**Method-selection finding, not simulated agreement:** Rauno is the strongest focused reference for **small toolbars, menu treatments and microinteractions**; pair with Steve for density, Luke for mobile constraints, Sara/Adam Silver for accessible controls, and Emil/Val for animation. A shiny Dribbble-style dashboard is the wrong benchmark; browser-extension/tool UI is the relevant class.

**Actual Agents-of-AI library protocol reviewers:** `personas/compass.md` (narrowest scope), `personas/friction.md` / UXPsych (cognitive load), `personas/wireframe.md` / LogicArchitect (source/DOM mapping), `personas/redline.md` / RedTeam (misclick, focus, Send and approval risks), and `workflows/quorum.md` (named quorum/evidence). These are reusable methods, not shipped Ghost first-page buttons.

## 5. Four competitive **reskin** lanes (bounded, distinct)

Each lane gets the **same verified Run state**, exactly seven real top destinations, same actions, same host ChatGPT mobile screen, same 334px ceiling, and no invented controls. The independent competition is about placement and visual behavior *inside the actual Ghost panel*, not entire layouts of imaginary applications.

| Lane | Independent compact design thesis | Navigation/interaction signature |
|---|---|---|
| **A · Toolcraft** (Rauno + Emil methods) | Precision dock: restrained dark navy, mini orbital ghost used as a progress signal, exquisite subtle hover/tap/expand motion | Thin unified **ribbon** top tabs, compressed identity/status into one line, slim action strip, two quiet accordions |
| **B · Refactoring** (Steve + Adam Wathan methods) | Dense but breathable: carefully calibrated typography and hierarchy; fewer nested boxes, gentle curvature, high clarity | **Two-row connected microtabs** clearly selected; visually distinct Play and End; no filler or gratuitous empty wells |
| **C · Mobile First** (Luke + Nielsen methods) | Best first action: maximize visible ChatGPT chat and minimize time-to-Play, with advanced controls gradually disclosed | **Two-tier tab treatment** with all seven names reachable and clear group boundaries, minimal live status strip, expandable modes |
| **D · Inclusive Motion** (Sara + Val methods) | Readability and confidence: crisp labels, focus states, contrast, purposeful running/paused signals | **Text-forward segmented top menu** with unmistakable selection, explicit touch/keyboard affordances, accessible expanding panels |

Lane/person names are **method inspirations only, not fictional actual agency contracts**. Do not clone copyrighted portfolio artwork. The earlier v8 ghost float, pulse, progress bar, small particles, and midnight-blue character are optional compact references; do not reintroduce all effects simultaneously.

## 6. Bounded work package / stop conditions

**Allowed now:** this versioned design brief and a discoverability link in `README.md`. **No userscript, extension, CSS, JS, tests, CI, build, release, deploy, or permission changes. No paid services. No GitHub Actions runs.**

**Design phase (future owner-authorized work):** four competing proposals, *each* with only (a) one 360×800-ish mobile ChatGPT screenshot showing the existing Ghost expanded at realistic width/placement and actual Run page; (b) one minimized-rail screenshot on the same host; (c) one annotated top-menu/accordion/toggle behavior sheet (can be same page); (d) CSS feasibility/overflow notes. No full-site comps, fake queues on Run, giant personas page, or unrelated product feature concepts. Use a controlled identical data state: idle, zero completed loops, configured limit shown as sourced; do not fabricate measured runtime.

**Owner choice is a hard gate.** After visual approval, an isolated CSS/markup implementation plan and narrowly scoped tests may be proposed; no automatic merge to `main`. If a concept cannot fit without hiding or breaking an existing control, mark **REJECTED**, not "close enough".

## 7. Acceptance checklist (all must pass before a production reskin)

- [ ] Same product: ChatGPT mobile page clearly visible; Ghost remains a small, positionable overlay/rail, no app-scale surface; native composer and Send available.
- [ ] Source parity: seven real sections and all genuine Run actions **Play, Pause, End, Top**; three real modes; three real postures; same advanced accordions; no fake buttons.
- [ ] Navigation: active/current state is unmistakable, seven named destinations directly discoverable from the expanded **top** nav at 320/360/390/412 CSS px; no disappearing menu.
- [ ] Density: reduced idle footprint and less empty space than the current baseline, using before/after measured CSS px, without clipped text or unreasonably small tap targets.
- [ ] State: ready/running/paused/error/disabled, loop fraction, minimization, focus and overflow remain readable and truthful. No state change triggers Send.
- [ ] Platform: dock-left/right, float, near-composer/header, Chrome mobile-size fixture and Firefox Android field checks; keyboard/rotation/safe-area, 200% text, reduced motion, focus, scroll and host remount.
- [ ] Permissions: Auto-Approve **OFF on reload** and separate from Play; AA and AA! do not imply successful approvals; closed Shadow DOM limitation is not masked.
- [ ] Architecture: exactly one Play-authorized chat Send actuator; no Enter/`requestSubmit` fallback or ambiguity resend; no duplication or second mount.
- [ ] Evidence: source-level parity and test receipts included; physical Firefox Android claims only after physical testing. For future implementation review `tests/v9-compact-mobile-ui.test.js` and regression suites without invoking hosted Actions by default.
- [ ] Different proposals: four genuinely different top-menu and compactness strategies, not four color swaps. Owner selects *one* direction before implementation.

**Closeout status (2026-10-26):** REPO PRD ONLY · design/render/field-test **NOT_TESTED** · owner selection pending.