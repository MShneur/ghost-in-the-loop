# Ghost in the Loop v9.0.1 — Full Shell Restoration Return

Date: 2026-09-24
Branch: `feature/v9-0-1-full-shell`
Release target: `9.0.1-alpha.1`
Payload identity head: `d7f1f098e3c6910800c289d956cd6bd83a6f95de`

## Root cause
The v9 transport rewrite preserved the safer one-Send core but shipped a stripped product shell. Later repairs reused the same `9.0.0-alpha.2` version, so Tampermonkey could keep an older stripped copy even when main had changed.

## Corrected product contract
Ghost is a rich UI / prompt-data shell around a deliberately dumb mechanical relay.

The AI owns reasoning, planning, committees, stage content, and decisions.
Ghost only:
- stores prompt text and user selections;
- injects exact prompt clauses;
- watches exact terminal markers;
- captures an exact marked numbered roadmap;
- advances stored queue/workflow/roadmap indices;
- actuates the one canonical Send path.

## Restored product shell
- Run / Auto / Flow / Personas / AoA / Export / Setup tabs
- Loop / Plan First / AI Roadmap modes
- user-defined Prompt Queue
- fixed Flow workflows with optional pause-between
- single personas and multi-persona committees
- bounded custom Workshop persona/workflow JSON
- Locked / Adaptive / Audit postures
- 13 skins + accents
- left/right dock + side minimize rail
- draggable float + composer-row + header-row placement
- Quick Start/help
- sound + notifications
- API-first Export
- Top navigation / Reload / Copy report

## Transport preserved
`setComposerText -> reacquire one valid Send -> click once -> confirm once`

- exactly one `button.click()` Send actuator
- no Enter Send fallback
- no `requestSubmit`
- no automatic resend after ambiguity

## E3 behavior verification
Exact rich-shell candidate:
- mobile 412x915: seven tabs render; 13 skins; 5 placements; left dock minimize rail works with zero Sends
- Prompt Queue: two stored steps -> exactly two Sends -> COMPLETE
- AI Roadmap: one planning Send + exact 3-step marked roadmap -> exactly three step Sends -> COMPLETE
- Deep Research Flow: four stored stages -> exactly four Sends -> COMPLETE
- Pause-between Flow: stage 1 pauses; pressing Play sends stage 2 exactly once; stage 2 pauses again
- Committee: two selected personas inject distinct Researcher + Red Team instructions in one initial Send
- userscript + generated extension parse PASS
- extension generation parity PASS
- userscript/package/lock = `9.0.1-alpha.1`
- manifest = `9.0.1`, display = `9.0.1-alpha.1`

## Immutable payload hashes
- userscript: `e9a478ebb1740c60c44df091a98a6989701af7580f68f55f14eb38b7d740adfa`
- extension/content.js: `84e550d76cb9b399d73280e30dffb6f166e8167855c1e10d7915619b4d8f42c8`
- extension/manifest.json: `a0d651b977c5fa0567334d227c48013f63c83def4482ba47662a012cfd2854c3`

## Evidence ceiling
E3 synthetic/browser integration. Real authenticated Firefox Android ChatGPT/Perplexity remains E4 field evidence.

## Disposition
Ready for stable promotion under the owner's standing instruction to finish the restored version and make it live.
