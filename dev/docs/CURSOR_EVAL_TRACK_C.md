# Cursor Evaluation — Track C: stronger read-only chat signals

## Outcome

One prototype was implemented: an off-by-default parser for ChatGPT's SSE
conversation response. It runs only through the existing `GITL_NET` cloned
`fetch` response and produces bounded, redacted evaluation metadata.

It is deliberately **not** a completion input, Send-confirmation input, or
actuation source. DOM reading and the existing generation/send contracts are
unchanged.

The tests replay synthetic representative streams. This work does not claim
that an authenticated live site was exercised or that the private transport
schema is stable.

## Options compared

| Candidate | Robustness | Effort | Privacy posture | Main fragility | Decision |
|---|---|---:|---|---|---|
| ChatGPT SSE | High for framing; medium for payload schema | Medium | Medium: bounded event text exists only while parsing; retained state is metadata only | Endpoint, role/content/status fields, or `[DONE]` semantics can change | **Prototype** |
| Claude SSE | High for SSE framing; medium-low for request classification | Medium | Medium | Existing `/api/organizations` match is broad and can include non-generation traffic; event names and content-block shapes need separate fixtures | Defer |
| Perplexity Socket.IO | Medium-low | High | Medium | Engine.IO/Socket.IO envelopes, namespaces, heartbeats, binary/compressed frames, and event payload revisions | Defer |
| Gemini `batchexecute` | Low-medium | High | Medium | XSSI prefixes, length framing, nested escaped JSON, batched RPCs, and changing RPC identifiers | Defer |
| `aria-live` regions | Medium across sites, low per-site certainty | Low-medium | High if only state/counts are retained | Duplicate announcements, partial tokens, hidden regions, localization, and assistive-technology-dependent behavior | Defer |
| Stop→Send transition | Medium as a generation hint; no text signal | Low | High | Stop may be hidden rather than removed; Send may become voice/dictation, remain disabled, or have duplicate responsive layouts | Defer |

### Why the SSE prototype won

SSE has deterministic record boundaries, the existing interceptor already
clones known `fetch` streams, and a parser can be tested as a pure helper with
arbitrary chunk boundaries. The exact POST endpoint plus
`text/event-stream` content type also gives a narrower classification gate than
the currently broad Claude and Gemini endpoint matches.

Stop→Send and `aria-live` are cheaper, but neither gives an authoritative
transport completion record. The former has no text signal; the latter is
presentation state and can duplicate or omit announcements.

## Prototype design

The helper `_createChatGPTSSEReadProbe()`:

- accepts arbitrarily split CRLF or LF SSE chunks;
- handles `data:` events and `[DONE]`;
- ignores every message whose author role is not `assistant`;
- derives only assistant event count, current character count, terminal marker
  enum (`none | proceed | halt`), and completion enum
  (`none | message | done`);
- gives HALT marker detection priority if both markers are present;
- drops malformed events and counts them;
- drops an oversized event, counts it, and resumes at the next SSE boundary.

`GITL_NET` starts the helper only when all gates match:

1. the feature flag is the boolean `true`;
2. method is `POST`;
3. URL is the exact `/backend-api/conversation` endpoint, optionally followed
   by query/fragment data, not a conversation archive URL;
4. response content type is `text/event-stream`.

The parser sees at most one 65,536-character event at a time. Raw event and
assistant text are transient locals and are discarded after parsing. Retained
state has a fixed schema, numeric counters capped at 1,000,000, and no text,
URL, conversation identifier, request body, response object, or error string.
Only that redacted snapshot can enter local Diagnostics.

The parser output has no code path into `Adapter.isGenerating`,
`_sendEvidence`, `_confirmSend`, `engineTick`, `engineSend`, or reviewed Send
selection. Enabling it therefore cannot authorize, trigger, confirm, delay, or
retry a Send.

## Enable or disable

The default is off:

```text
netReadChatgptSse = false
```

To evaluate the userscript prototype:

1. Open the userscript manager's storage editor for Ghost in the Loop.
2. Set `netReadChatgptSse` to the boolean `true` (not the string `"true"`).
3. Reload the ChatGPT tab.
4. Open Setup → Advanced → Diagnostics. `Net read experiment` reports only
   stream counts, open/complete state, marker enum, and assistant character
   count.

For the generated Firefox extension, the equivalent extension-local value can
be set from an extension debugging console:

```js
browser.storage.local.set({ netReadChatgptSse: true })
```

That enables the mirrored code, but it is not a certified extension transport:
the current MV3 content script runs in an isolated world, while observing the
page's `fetch` requires a `world: "MAIN"` bridge. This prototype is therefore
evaluated as a userscript path; closing that pre-existing extension gap is
separate work.

Set the value to boolean `false` and reload to disable it again.

## Fixture coverage

`tests/net-read-chatgpt.test.js` internally replays:

- in-progress, terminal-message, and `[DONE]` records split at hostile chunk
  boundaries;
- CRLF and LF framing;
- ignored user-role content;
- malformed JSON;
- both markers, proving HALT priority;
- an oversized record followed by a valid record, proving bounded recovery;
- endpoint/method/content-type gating;
- diagnostic redaction and source contracts excluding completion/actuation
  consumers.

## Residual risks

- Private endpoint and JSON fields can change without notice. A parser mismatch
  degrades to redacted malformed/oversized counters; the normal DOM path
  continues unchanged.
- `Response.clone()` and decoding add memory/CPU work when enabled. The flag is
  off by default and the event buffer is capped, but a real-device performance
  check is still needed.
- A 65,536-character single SSE event is dropped. This bounds privacy and
  memory cost at the expense of observing unusually large replies.
- `[DONE]` is considered completion only after at least one assistant event.
  This avoids treating unrelated/empty streams as completed answers but may
  miss a schema that reports completion without an assistant message.
- Page-world interception can be blocked by hardened globals. Existing
  fault-tolerant installation remains in force; failure costs only optional
  telemetry, never panel boot or DOM fallback.
- The current MV3 wrapper does not bridge `GITL_NET` into the page's main
  JavaScript world. Generated-source parity is maintained, but live extension
  network capture remains a separate known gap.
- No live-site certification is claimed. Before any future promotion from
  evaluation metadata to a completion hint, authenticated captures must be
  reduced to synthetic fixtures and independent DOM catches must remain.
