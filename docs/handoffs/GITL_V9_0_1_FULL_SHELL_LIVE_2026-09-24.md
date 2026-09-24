# Ghost in the Loop v9.0.1 — Full Shell Live Receipt

Date: 2026-09-24
Stable version: `9.0.1-alpha.1`
Promotion head: `b2c8bdcf75f0d0d433df10c22171433c5c268db4`

The earlier `9.0.0-alpha.2` live promotion is superseded. That version reused one version number across materially different payloads and did not preserve the accepted rich product shell.

## Live product contract
Ghost is deliberately not an intelligent controller. The AI owns reasoning/planning. Ghost owns exact prompt storage/injection, exact marker observation, stored queue/workflow/roadmap indices, product UI, export/diagnostics, and one fail-closed Send path.

## Stable raw proof
Post-promotion fetch from `main/ghost-in-the-loop.user.js`:
- HTTP 200
- bytes: 99497
- SHA-256: `e9a478ebb1740c60c44df091a98a6989701af7580f68f55f14eb38b7d740adfa`
- version: `9.0.1-alpha.1`
- Run / Auto / Flow / Personas / AoA / Export / Setup present
- side minimize present
- 13 skins present
- exactly one Send `button.click()`
- no `requestSubmit` or Enter Send fallback

## E3 behavioral proof
- user Prompt Queue: exact stored steps, exactly one Send per step, COMPLETE
- AI Roadmap: exact marked consecutive numbered roadmap capture, one Send per stored step, COMPLETE
- Flow: exact fixed stages, one Send per stage, COMPLETE
- Pause-between: no next stage until Play; then exactly one next-stage Send
- Committee: selected persona instructions injected as prompt data
- mobile shell: seven tabs, five placements, left-dock collapse/expand, zero Send from UI placement actions
- extension generation parity and version parity PASS

## Field boundary
Authenticated Firefox Android ChatGPT/Perplexity remains E4 observational evidence. Host-specific field failures must be repaired without resurrecting alternate Send engines or deleting rich-shell features.
