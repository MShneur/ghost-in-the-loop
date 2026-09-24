# 👻 Ghost in the Loop 9.0.1-alpha.1

Ghost is a **mechanical relay with a rich control shell**. The AI owns reasoning, planning, committees, and decisions.

> **Everything may influence the prompt. Only Play may influence Send.**

## Product shell

- **Run** — Loop, Plan First, AI Roadmap; Locked / Adaptive / Audit postures.
- **Auto** — user-authored Prompt Queue plus AI-authored Roadmap Autopilot.
- **Flow** — fixed prompt workflows with optional pause-between stages.
- **Personas** — single personas, multi-persona committees, custom Workshop packs.
- **AoA** — canonical Agents-of-AI / CTRL-AI / R-Duck prompt activators.
- **Export** — API/archive-first Markdown/JSON with truthful partial fallback.
- **Setup** — 13 skins, accents, sound, notifications, Quick Start and placement.

Placement supports right dock, left dock, draggable float, composer-row, and header-row. Docked panels collapse to a side rail.

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

- Userscript/npm: **9.0.1-alpha.1**
- WebExtension numeric version: **9.0.1**
- WebExtension display version: **9.0.1-alpha.1**
- Stable update/download channel: `main`

The extension runtime is generated from `ghost-in-the-loop.user.js`.

## Evidence boundary

Synthetic/browser E3 covers the restored shell and mechanical Queue/Roadmap/Flow behavior. Real Firefox Android + authenticated ChatGPT/Perplexity use remains the field-evidence layer; a host-specific failure should be reported through **Copy report** and repaired without adding a second Send architecture.
