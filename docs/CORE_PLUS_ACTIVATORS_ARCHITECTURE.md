# Ghost Core + Activators Architecture

Status: target architecture for the simple-core experiment.

## Product boundary

Ghost owns only two durable product lanes:

1. **Play** — continue an AI conversation reliably.
2. **Export** — capture/export the conversation reliably.

Everything else is an optional activator or host adapter. Ghost must not become a second reasoning engine.

## Play core

The AI owns planning, reasoning, batch/milestone decisions, committee logic, recovery reasoning, and choice of specialist workflow.

Ghost owns only:

1. wait for the current answer to finish;
2. inspect the final protocol line;
3. perform the registered mechanical action;
4. send the configured continuation/bootstrap text;
5. confirm that one send happened;
6. repeat or stop.

Ghost must not infer meaning from the body of the conversation.

## Base terminal contract

The base engine needs only a very small terminal vocabulary:

```text
[[GITL::PROCEED]]
[[GITL::HUMAN]]
[[GITL::HALT]]
```

Optional add-ons may register additional exact terminal commands. The core treats them as identifiers mapped to actions; it does not understand the add-on's reasoning.

Example AoA relay terminals:

```text
[[AOA::CONTINUE]]
[[AOA::RELAY:MODEL_LABEL]]
[[AOA::HUMAN]]
[[AOA::HALT]]
```

## Protocol drift

If the final line is not valid, Ghost does not analyze why.

It sends a fixed reground prompt:

```text
You strayed from the active control protocol. Re-read the existing conversation, reground in the current task, and continue without restarting. Follow the active protocol exactly. Your response must end with one valid terminal control line.
```

Retry at most a small fixed number of times (default: 2). After repeated failure, stop for the human.

No roadmap reconstruction. No semantic diagnosis. No controller-side planning.

## Activators

Ghost may expose an **AoA** tab and later other protocol tabs.

An activator has only:

- repository/source identifier;
- component ID;
- compact bootstrap text;
- optional registered terminal commands;
- optional host action (for example model selector automation).

Examples:

- Agents-of-AI Human Gate;
- Cleanerz;
- Quorum;
- PLEX;
- Model Relay;
- CTRL-AI;
- R-Duck;
- project-specific protocols hosted elsewhere.

Ghost does not reimplement these systems.

## Reference-first, inline fallback

A prompt cannot reliably "activate a GitHub repo" unless the current model/runtime can retrieve that repository.

Therefore activators use two paths:

### Reference path

If the runtime can retrieve the source, inject a compact pointer:

```text
Activate Agents-of-AI component `plex` from the canonical repository and apply it silently to the existing task. Do not restart completed work.
```

### Inline fallback

If the runtime cannot retrieve the repository, Ghost may fetch/cache the canonical component text itself and inject that text into the prompt.

This keeps the AI protocol external while avoiding false assumptions about host browsing.

The fallback is transport, not reasoning.

## Model Relay

Model selection is an optional add-on, not part of Play.

The active AI decides whether another model would materially improve the unresolved next step and emits the exact relay terminal.

Ghost may then:

1. open the host model selector;
2. choose the requested available model;
3. inject the fixed relay bootstrap;
4. resume base Play.

If the requested model is unavailable, Ghost pauses rather than silently substituting.

Host-native multi-model systems should be preferred when they already satisfy the task.

## Perplexity note

Perplexity exposes model selection in the query UI and makes explicit model selections sticky for the thread. Perplexity also has native Model Council / Computer multi-model orchestration on eligible plans. Ghost should not recreate those native systems when available; sequential selector automation is for the simpler case where the user wants explicit model-to-model relay in an ordinary thread.

## Non-goals

Ghost Play does not own:

- model benchmarking;
- model capability essays;
- reasoning about which AoA workflow should fire;
- committee logic;
- roadmap generation;
- persona implementation;
- source research;
- project planning;
- decision analysis.

Those belong to the active AI and the external protocols it has been instructed to use.

## Release rule

No optional activator may be allowed to change or replace the base Play transport.

If every add-on is disabled, `Play` must still mean:

```text
answer ends -> exact terminal -> one continuation send -> next answer
```

That invariant is the product.