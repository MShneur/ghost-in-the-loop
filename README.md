# 👻 Ghost in the Loop 9.0.20

Ghost is a **mechanical relay with a rich control shell**. The AI owns reasoning, planning, committees, and decisions.

> **Everything may influence the prompt. Only Play may influence Send.**

## Product shell

- **Run** — Loop, Plan First, AI Roadmap; Locked / Adaptive / Audit postures.
- **Auto** — user-authored Prompt Queue plus AI-authored Roadmap Autopilot; session-only Auto-Approve ON/OFF for matching ChatGPT tool-permission prompts. OFF by default; may authorize connected-service actions.
- **Flow** — fixed prompt workflows with optional pause-between stages.
- **Personas** — single personas, multi-persona committees, custom Workshop packs.
- **AoA** — canonical Agents-of-AI / CTRL-AI / R-Duck prompt activators.
- **Export** — API/archive-first Markdown/JSON with truthful partial fallback.
- **Setup** — 17 built-in skins (including [Ghostwave and Ghostwave Compact](docs/skins/GHOSTWAVE_V9.md) plus [A Edge Rail and D Command Selector](docs/ux/GITL_SELECTED_A_D_SKINS_20261026.md)), accents, sound, notifications, Quick Start and placement.

Placement supports right dock, left dock, draggable float, composer-row, and header-row. Docked panels collapse to a side rail.

## Compact mobile UX design and selected skins

Before creating Ghost mobile reskins or 2×2 agency concepts, read [Compact Embedded Mobile Shell UX PRD](docs/ux/GITL_COMPACT_MOBILE_SHELL_PRD.md). It records the original v9 inventory and four design lanes. The owner-selected A Edge Rail and D Command Selector skins are now implemented in 9.0.20, alongside Ghostwave and Ghostwave Compact. The historical brief does not supersede the current source or authorize unrelated redesign.

## Dumb-relay architecture

Ghost does not decide what the task means or infer which step is next.

- Normal Loop: watches the exact final control marker and injects the continuation text.
- Prompt Queue: advances the stored queue index.
- AI Roadmap: asks the AI for an exact `[[GITL::ROADMAP]]` + consecutive numbered list, stores those literal steps, then injects each step in order.
- Flow: advances a fixed stored workflow index.

The sole Send path remains:

`setComposerText → reacquire one valid Send → click once → confirm once`

There is no Enter fallback, `requestSubmit` escalation, or automatic resend after an uncertain actuation.

## Control markers

```text
[[GITL::PROCEED]]
[[GITL::HUMAN]]
[[GITL::HALT]]
```

Model Relay uses the corresponding `[[AOA::...]]` controls.

## Version identity

- Userscript/npm: **9.0.20**
- WebExtension numeric version: **9.0.20**
- WebExtension display version: **9.0.20**
- Stable update/download channel: `main`

The extension runtime is generated from `ghost-in-the-loop.user.js`.

## Evidence boundary

Synthetic/browser E3 covers the restored shell and mechanical Queue/Roadmap/Flow behavior. Real Firefox Android + authenticated ChatGPT/Perplexity use remains the field-evidence layer; a host-specific failure should be reported through **Copy report** and repaired without adding a second Send architecture.

**Auto-Approve state (9.0.20):** Setup retains a 0–30-second delay, default 5 seconds, and Auto retains the session-only ON/OFF switch. A Firefox-only read-only accessor is present for closed shadow-root inspection. It is NOT PROVEN available to Tampermonkey on Firefox Android, nor is an attempted click an accepted permission grant. Do not call the approval workflow completed until the authenticated device accepts it.

## Current progression tree — Ghost Auto-Approve acceptance

**Goal:** User enables Ghost Auto-Approve in one chat, sees an ordinary ChatGPT approval card, and Ghost performs the intended click after the configurable delay. Approval acceptance must be confirmed on authenticated Firefox Android. Play/Proceed, export, seven tabs, and 17 skins must remain intact.

This is a **task-scoped finishing tree**. It does not replace the old 8.8 orchestration ledger or claim overall product completion.

```text
GOAL  Working Auto-Approve on authenticated Firefox Android
|
+-- A. Source & skin baseline  [PASS — main 9.0.20]
|      17 skins, 7 tabs, one Send transport
|
+-- B. Integrated package consistency  [PASS — source and generated extension match]
|      Userscript + extension; release metadata aligned
|
+-- C. Real approval field canary  [NOT TESTED — NEXT MILESTONE]
|      ON -> approval appears -> delay -> single click -> host accepts
|      OFF/chat change -> no click; negative/unrelated buttons ignored
|
+-- D. Field acceptance & release close  [HOLD — depends on C]
       Exact installed version, evidence, no duplicate action or skin regressions
```

**Current position:** B finished at source/static level. **Next milestone:** C, authenticated Firefox Android acceptance. **Stop condition:** If permission card cannot be detected or an approval cannot be confirmed, do not claim completion or advance versions. An unavailable browser verifier means NOT TESTED, not PASS.

## Firefox closed-shadow permission controls

Ghost now attempts Firefox's read-only `openOrClosedShadowRoot` extension accessor when scanning ChatGPT approval cards, in addition to the normal document search. This does **not** change account or site permissions. It requires an extension/userscript execution context that actually exposes the Firefox API; Firefox Android/Tampermonkey availability is not yet field-proven. Enabling Auto-Approve remains session-only, uses the configured 0-30 second delay, and records click **attempts**, not confirmed grants. An unavailable accessor is shown as a limited state. Until field-tested, do not rely on unattended permission acceptance.

