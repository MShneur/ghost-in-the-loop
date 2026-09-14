# Ghost in the Loop 9.0.0-alpha.1

Status: **built, syntax-checked, not field-certified**.

This is the architecture reboot. Public `main` / 8.8.5 remains untouched.

## Product boundary

Ghost 9 owns only two durable lanes:

1. **Play** — continue a conversation reliably.
2. **Export** — capture/export a conversation reliably.

Everything else is an optional activator. The active AI does the reasoning.

## Play

Base terminal contract:

```text
[[GITL::PROCEED]]
[[GITL::HUMAN]]
[[GITL::HALT]]
```

The controller reads only the final non-whitespace line. It does not interpret the body of the answer.

Flow:

```text
answer stops
-> inspect final terminal
-> stage one fixed continuation
-> click one reviewed host Send
-> confirm one delivery
-> repeat
```

No Alpha/Beta/Gamma/Delta selector UI. No Roadmap state. No controller-side planning.

### Drift recovery

- First invalid terminal: fixed reground prompt.
- Second invalid terminal: invoke Cleanerz if enabled.
- Repeated invalid terminal: stop for human review.

Ghost does not analyze why the AI drifted.

### Send safety

After a Send click, ambiguity never causes an automatic resend. An uncertain Send pauses.

The Page Reload button calls `location.reload()` and is a real page/script reload.

## AoA activators

The AoA tab can activate external protocols without reimplementing them inside Ghost:

- PLEX
- Model Relay
- Human Gate
- Cleanerz
- Quorum
- CTRL-AI
- R-Duck
- one custom Agents-of-AI path

Ghost fetches the selected canonical source and injects it as external protocol context. If retrieval fails, it still sends the canonical source pointer.

PLEX + Model Relay currently read from the Agents-of-AI feature branch:

`feature/plex-universal-model-relay`

until that work is promoted in Agents-of-AI.

## Model Relay

Ghost recognizes:

```text
[[AOA::CONTINUE]]
[[AOA::HUMAN]]
[[AOA::HALT]]
[[AOA::RELAY:MODEL_LABEL]]
```

In this alpha, `RELAY` pauses and names the requested model. Automatic Perplexity model-selector clicking is deliberately **not yet field-certified** and therefore is not allowed to guess selectors.

## Export

Export is independent of Play.

- ChatGPT: attempts same-origin `/backend-api/conversation/{id}` first.
- Perplexity: attempts same-origin `/rest/thread/{slug}` first.
- If API capture fails: DOM capture is used and explicitly labeled `partial`.
- Markdown, JSON, and Copy are available.

## Field gate

Before this can replace 8.8.5:

1. Disable the public 8.8.5 userscript.
2. Install `v9/ghost-in-the-loop.user.js` from this branch.
3. Perplexity Firefox Android: 5 consecutive automatic `PROCEED` rounds.
4. ChatGPT Firefox Android: 5 consecutive automatic `PROCEED` rounds.
5. No duplicate user turns.
6. Human terminal pauses immediately.
7. HALT terminal completes immediately.
8. Invalid terminal regrounds once; Cleanerz path is tested separately.
9. Page Reload visibly reloads the host page and Ghost.
10. Export is tested on both ChatGPT and Perplexity and reports whether the source was API or partial DOM.

## Install candidate

Raw branch path:

`https://raw.githubusercontent.com/MShneur/ghost-in-the-loop/refs/heads/rewrite/9.0.0-core-activators/v9/ghost-in-the-loop.user.js`

Do not run 8.8.5 and 9.0.0-alpha.1 at the same time.
