# Ghost Simple Core Reboot — field-rooted experiment

Date: 2026-09-13
Branch: `experiment/simple-core-canary-2026-09-13`
Status: isolated experiment; stable `main` is unchanged.

## Why this branch exists

8.8.5 is in a fix-fixes-fix loop on real Firefox Android / Perplexity. The current evidence is no longer consistent with one missing selector:

- a valid `[[GITL::PROCEED]]` response can enter `roadmap_reask` because persisted Advanced/Roadmap state leaks into an existing conversation;
- Alpha can send successfully while a later confirmation becomes `SEND-002`;
- Beta can be selected even when telemetry says `same_form:false` and `request_submit:false`, so that route has no viable actuator;
- redetection can report `found_send:false` while the saved live DOM contains the current Perplexity `button[aria-label="Submit"]` next to `#ask-input`;
- `COMPOSER-002` can fire even when the saved live DOM visibly contains the complete intended prompt in the current Lexical editor;
- the header reload control intentionally restarts Ghost services without reloading the page, which is not what a user reasonably expects from a reload control.

These are cross-layer failures. More fallback routes do not fix the root architecture.

## Historical baseline

The first public release, 4.1.0 (`5ae6492e87a446372258e0d8c5ab453b4cd6c36c`), used a much smaller loop:

1. resolve current platform input;
2. write text;
3. resolve one Send control;
4. click it;
5. wait for output to stop;
6. read the latest assistant tail;
7. `PROCEED` -> send `Continue`; `SYSTEM_HALT` -> stop.

It was less safe and its old selectors are not suitable for a literal rollback, but the separation is useful. This experiment restores the small control graph while retaining the most important modern safety invariant: after one Send actuation, uncertainty never triggers an automatic second Send.

## Cleanerz disposition

### DONE

A real-host run is DONE when one Resume action can repeatedly perform:

`read latest answer -> detect marker -> stage exactly one continuation -> actuate exactly one host Send -> confirm a new turn -> repeat`

and a visible Reload action actually reloads the page/script.

### BROKEN

Any of these is BROKEN:

- visible correct prompt + `COMPOSER-002`;
- route selected when its own precondition is false;
- `PROCEED` diverted into roadmap recovery without an explicitly bound roadmap run;
- transport state depends on persona/workflow/roadmap state;
- one uncertain Send causes another automatic actuator to fire;
- UI says reload but only restarts internal services.

### SALVAGE

- explicit `PROCEED / CHOICE / HALT` markers;
- fail-closed handling after an ambiguous Send;
- per-host adapters;
- field diagnostics;
- workflows/personas/roadmaps as optional higher layers;
- API-first chat-history work already introduced in 6.9.

### KILL FROM THE CORE PATH

- Alpha/Beta/Gamma/Delta as ordinary production choices;
- roadmap recovery inside transport;
- persisted roadmap mode silently governing arbitrary existing chats;
- verification that depends on preserving the same framework-owned editor node;
- cached capability labels that can disagree with the current live actuator;
- network telemetry as required authority for ordinary completion;
- a reload icon that does not reload the page.

## Experimental architecture

### Layer 0 — Transport

Only this layer can write or Send.

- resolve the current editor at action time;
- write one command;
- reacquire the current editor after framework reconciliation;
- verify the semantic text visible in that editor;
- resolve one host-owned Send control in the editor's local container;
- click exactly once;
- confirm through a new user turn or generation start;
- if confirmation is ambiguous, pause with no resend.

For the current Perplexity DOM captured from Firefox Android:

- editor: `#ask-input[contenteditable=true][data-lexical-editor=true]`;
- Send: unique local `button[aria-label="Submit"]`.

There is no Beta/requestSubmit path because the captured host state has no same-form/requestSubmit contract.

### Layer 1 — Reader

Reader is read-only and must be replaceable independently of Transport.

Preferred hierarchy:

1. same-origin conversation/archive endpoint when the provider's own signed-in page exposes one;
2. provider-native export request;
3. semantic DOM message containers as fallback.

For ChatGPT, keep the existing 6.9 API-first lineage around `/backend-api/conversation/{id}` with DOM fallback.
For Perplexity, investigate the provider's own thread export/full-history requests from the signed-in browser session instead of treating broad DOM scraping as the primary archive.

### Layer 2 — Control

Only marker semantics:

- `[[GITL::PROCEED]]`
- `[[GITL::CHOICE]]`
- `[[GITL::HALT]]`

No roadmap parsing here.

### Layer 3 — Orchestration

Roadmap, workflows, personas, committees, adaptive posture, model relay, etc. live here. They may choose the next text command, but cannot change Transport authority or Send mechanics.

## Canary

`diagnostics/gitl-simple-core.user.js`

Scope intentionally limited to ChatGPT + Perplexity. It has:

- Resume;
- Stop;
- a real `Reload Page` control;
- minimal marker protocol;
- one host actuator;
- new-turn / generation confirmation;
- no roadmap;
- no workflow engine;
- no personas;
- no Alpha/Beta/Gamma/Delta;
- no automatic post-dispatch fallback.

The normal 8.x userscript must be disabled while this canary is active. The canary refuses to run if it sees the normal `#gitl` panel.

## Field gate before adding intelligence back

Do not reattach Roadmap/Workflow/Persona layers until Simple Core passes, on the real phone:

1. Perplexity Firefox Android: 5 consecutive automatic rounds;
2. ChatGPT Firefox Android: 5 consecutive automatic rounds;
3. no duplicate user turns;
4. no manual route switching;
5. page Reload visibly reboots everything;
6. one saved-page artifact after the run proves current editor, current Send, and final marker state.

Only after this gate should higher layers be reintroduced one at a time.
