# 👻 Ghost in the Loop 9.0.19

Ghost is a **mechanical relay with a rich control shell**. The AI owns reasoning, planning, committees, and decisions.

> **Everything may influence the prompt. Only Play may influence Send.**

## Product shell

- **Run** — Loop, Plan First, AI Roadmap; Locked / Adaptive / Audit postures.
- **Auto** — user-authored Prompt Queue plus AI-authored Roadmap Autopilot; session-only Auto-Approve ON/OFF for matching ChatGPT tool-permission prompts. OFF by default; may authorize connected-service actions.
- **Flow** — fixed prompt workflows with optional pause-between stages.
- **Personas** — single personas, multi-persona committees, custom Workshop packs.
- **AoA** — canonical Agents-of-AI / CTRL-AI / R-Duck prompt activators.
- **Export** — API/archive-first Markdown/JSON with truthful partial fallback.
- **Setup** — 15 built-in skins (including [Ghostwave and Ghostwave Compact](docs/skins/GHOSTWAVE_V9.md)), accents, sound, notifications, Quick Start and placement.

Placement supports right dock, left dock, draggable float, composer-row, and header-row. Docked panels collapse to a side rail.

## Compact mobile UX design gate (proposal, not implemented)

Before creating Ghost mobile reskins or 2×2 agency concepts, read [Compact Embedded Mobile Shell UX PRD](docs/ux/GITL_COMPACT_MOBILE_SHELL_PRD.md). It records the v9 button/tab inventory, host-chat mounting constraints, 334px panel ceiling, named AoA/practitioner method sources, four bounded compact design lanes, and the owner-approval gate. **No UI changes are authorized by this document.**

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

- Userscript/npm: **9.0.19**
- WebExtension numeric version: **9.0.1**
- WebExtension display version: **9.0.19**
- Stable update/download channel: `main`

The extension runtime is generated from `ghost-in-the-loop.user.js`.

## Evidence boundary

Synthetic/browser E3 covers the restored shell and mechanical Queue/Roadmap/Flow behavior. Real Firefox Android + authenticated ChatGPT/Perplexity use remains the field-evidence layer; a host-specific failure should be reported through **Copy report** and repaired without adding a second Send architecture.

**Auto-Approve limitation (9.0.18):** The header AA indicator pulses while enabled and shows AA! when inaccessible ChatGPT components are detected. Current ChatGPT permission cards can be rendered inside closed Shadow DOM; a Tampermonkey userscript cannot reliably access/click these controls. The auto-click mode is not certified for these cards; the toggle alone is not evidence of success.

**9.0.18:** Auto-Approve delay under Setup (0–30 seconds; 5 seconds default). Per-chat session scope, cancel on OFF or chat change. A closed Shadow DOM approval remains inaccessible to the browser userscript; an attempted click is not proof of permission grant.

## Firefox closed-shadow permission controls

Ghost now attempts Firefox's read-only `openOrClosedShadowRoot` extension accessor when scanning ChatGPT approval cards, in addition to the normal document search. This does **not** change account or site permissions. It requires an extension/userscript execution context that actually exposes the Firefox API; Firefox Android/Tampermonkey availability is not yet field-proven. Enabling Auto-Approve remains session-only, uses the configured 0-30 second delay, and records click **attempts**, not confirmed grants. An unavailable accessor is shown as a limited state. Until field-tested, do not rely on unattended permission acceptance.

