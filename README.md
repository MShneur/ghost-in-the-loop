# 👻 Ghost in the Loop v9 candidate

Ghost in the Loop is a userscript / Firefox extension that keeps long AI tasks moving while preserving one hard transport rule:

> **Everything may influence the prompt. Only Play may influence Send.**

This branch is the **v9 integration candidate**. It is not the stable/public channel yet.

## Current v9 architecture

Play is deliberately small:

`setComposerText → reacquire one valid Send → click once → confirm once`

If any of those steps are uncertain, Ghost fails closed. There is no Enter fallback, `requestSubmit` escalation, automatic resend, or controller-side semantic reasoning.

## What v9 includes

- one-Send Play transport
- strict terminal control markers
- bounded stall watchdog: 5 minutes quiet + 2 minute grace, then confirmed Stop recovery
- compact `↑ Top` navigation with bounded lazy-history loading
- API-first Markdown/JSON export with truthful visible-page fallback
- platform-visible reasoning export only when the host exposes it
- optional raw platform JSON export
- 13 appearance skins + accent colors
- Quick Start and plain-language help
- personas, workflows, and Locked / Adaptive / Audit prompt postures
- bounded additive custom Workshop JSON imports
- observational round/workflow stage display
- opt-in sound and notifications
- external Agents-of-AI / CTRL-AI / R-Duck activators

## Control markers

Default Ghost control lines:

```text
[[GITL::PROCEED]]
[[GITL::HUMAN]]
[[GITL::HALT]]
```

When Model Relay is enabled:

```text
[[AOA::CONTINUE]]
[[AOA::HUMAN]]
[[AOA::HALT]]
[[AOA::RELAY:MODEL_LABEL]]
```

The valid control line must be the final non-whitespace control suffix. Ghost does not infer intent from normal prose.

Workflow stage reporting is optional and display-only:

```text
[[GITL::STAGE:X/Y]]
```

It never authorizes Send or advances a workflow.

## Stall watchdog

Ghost watches for **observable output change**, not total task duration.

- output still changing → leave the model alone
- 5 minutes unchanged → suspected stall
- another 2 minutes unchanged → bounded Stop recovery
- Stop is reacquired and attempted at most 3 times
- after confirmed Stop, one reground prompt goes through normal Play
- a second recovered stall requires a human

## Export

Ghost prefers host conversation/archive data where supported.

- **full platform history** — supported archive/API parse succeeded
- **may be incomplete** — visible-page fallback was required
- raw platform JSON is opt-in
- platform-visible reasoning/steps are labeled explicitly
- Ghost does not claim access to hidden chain-of-thought

## Prompt features

Personas, workflows, postures, AoA activators, and custom Workshop content only change **prompt construction**.

They do not gain Send authority.

Custom Workshop bundles are bounded JSON data, additive only, and cannot replace built-ins.

## Appearance and feedback

Settings include:

- 13 skins
- accent colors
- Quick Start replay
- sound cues
- notifications

Sound and notifications are optional/status-only and do not mutate loop state.

## Supported focus for v9 certification

First-class field certification is currently focused on:

1. ChatGPT
2. Perplexity
3. Firefox Android + Tampermonkey

Other hosts remain generic / lower-evidence until separately verified.

## Candidate identity

- Userscript / npm version: **9.0.0-alpha.2**
- WebExtension numeric version: **9.0.0**
- WebExtension display version: **9.0.0-alpha.2**
- Stable update/download channel remains `main`
- Candidate publication state remains **not published**

The extension runtime is deterministically generated from `ghost-in-the-loop.user.js` by `scripts/build-extension.js`.

## Required release proof

Automated/source/browser checks are not enough to certify the real mobile path.

Before v9 release, the exact candidate still needs authenticated Firefox Android/Tampermonkey proof on both ChatGPT and Perplexity:

- at least 5 consecutive PROCEED cycles per host
- HUMAN and HALT
- no duplicate Sends
- uncertain Send fails closed
- watchdog recovery
- `↑ Top` on a long/lazy-loaded conversation
- reload
- Export truthfulness
- mobile panel usability

## Development authority

For current work, use:

- GitHub repository state as implementation authority
- `docs/handoffs/` for v9 bounded-batch returns
- issue #47 for the v9 product/reconciliation scope
- legacy 8.8 branches/issues only as failure archaeology

Do not restore old alternate Send engines merely to make a historical test pass.
