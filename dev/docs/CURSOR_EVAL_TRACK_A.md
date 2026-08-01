# Track A — Mobile send last mile

## Findings

| Platform | Resolution in reviewed flow | Confirmation |
|---|---|---|
| ChatGPT | A unique reviewed Send button wins when injection enables it. If none resolves, the adapter-authorized Enter path is selected before the journal. The pre-dispatch gate requires the same live composer to contain the complete prompt and re-validates the chosen actuator. | Independent assistant transition, or composer cleared plus visible Stop/trusted network. The mobile fixture confirmed via composer + Stop. Missing evidence becomes uncertain; nothing is resent. |
| Perplexity | Same authority order: unique reviewed button, otherwise its explicit Enter fallback. Exact staging and actuator validity are re-proved before the journal. | Same independent evidence contract. The mobile fixture confirmed via composer + Stop; Socket.IO telemetry remains advisory. |

In 390×844 real-browser fixtures, `injectText()` fired the input events that
enabled initially disabled reviewed buttons for both platform shapes. Their
buttonless variants received exactly one Enter keydown with the full multiline
prompt, and a deliberately changed composer was refused before transaction
creation. Coverage ran in Chromium mobile emulation and desktop Gecko with a
mobile viewport/Android UA; Firefox's runner does not emulate touch points.

## Deferred real-device questions

- Do current authenticated Android web builds preserve the exact prompt and
  enable the same reviewed controls after programmatic insertion?
- Do account/editor settings on both sites accept the synthetic Enter event,
  including ChatGPT configurations where Enter-to-send is disabled?
- On Firefox Android/GeckoView, do composer clearing, Stop visibility, and
  trusted network timing provide confirmation within the existing deadline?
- Do mobile keyboard composition, autocorrection, or accessibility tooling
  rewrite staged text and therefore trigger the new fail-closed gate?

No real-device verification is claimed.
