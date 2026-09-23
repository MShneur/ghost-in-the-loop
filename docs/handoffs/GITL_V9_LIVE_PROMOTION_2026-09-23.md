# Ghost in the Loop v9 — Live Promotion Receipt

Date: 2026-09-23
Stable channel: `main`
Version: `9.0.0-alpha.2`
Promoted payload commit: `5698dfb643640516a3fff8340773ae86d83df643`

## Result
Ghost v9.0.0-alpha.2 is live on the stable Tampermonkey update/download channel.

## Stable payload verification
Fetched from `raw.githubusercontent.com/MShneur/ghost-in-the-loop/main` after promotion:

- `ghost-in-the-loop.user.js`
  - bytes: 75335
  - sha256: `47b488d7b9632344d6c676806bc2dba694bccee20e08ca9b1380377652e00a52`
- `extension/content.js`
  - bytes: 75226
  - sha256: `031259052a0b482cdc0d1cd99aa864d9e080d7b62b4a10ce1f221d7f422ae73d`
- `extension/manifest.json`
  - bytes: 1582
  - sha256: `2a097e4edf3f1f863abc23695f9b1f0b89102f238d582b825382242279645087`

Verification:
- userscript syntax: PASS
- extension syntax: PASS
- userscript version: 9.0.0-alpha.2
- runtime version: 9.0.0-alpha.2
- manifest numeric version: 9.0.0
- manifest display version: 9.0.0-alpha.2
- side minimize/expand rail present
- exactly one `button.click()` Send actuation
- no Enter Send route
- no `requestSubmit` Send escalation

## Included product surface
- one-Send Play
- strict terminal markers
- stall watchdog
- Top navigation
- API-first truthful Export
- 13 skins + accents
- Quick Start/help
- personas/workflows/postures
- bounded custom Workshop JSON
- observational progress
- opt-in sound/notifications
- side-attached minimize rail
- mobile touch-target repair
- package/extension parity
- separated v9 vs legacy test authority

## Evidence ceiling
E3 automated/browser integration evidence is complete for the promoted artifact.
Authenticated Firefox Android ChatGPT and Perplexity field use remains observational E4 evidence and should be recorded from real use. This limitation does not change the fact that the owner explicitly authorized promotion to main.

## Disposition
LIVE ON MAIN.

Future repairs must preserve the v9 one-Send architecture and the restored product shell unless a later explicit KILL decision changes scope.
