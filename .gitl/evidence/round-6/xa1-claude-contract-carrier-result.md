# R6 XA1 Claude Contract Carrier Result

- tested_head: `4066724a2d9ca55b2c4adf274e132a19daad29ac`
- run_id: `31222178355`
- run_attempt: `1`
- verdict: **PASS**
- playwright_exit_code: `0`
- command: `npx playwright test tests/e2e/claude-structure-contract.spec.js --project=chromium --project=firefox`
- scope: deterministic fixture only; no live Claude navigation, typing, click, submit, input, keydown, Send actuation, or structural activation
- live_claude_structure: **UNKNOWN / NOT CLAIMED**
- live_chatgpt_structure: **UNKNOWN / NOT CLAIMED**

The workflow also ran `npm ci`, `node --check tests/e2e/claude-structure-contract.spec.js`, and installed portable Chromium + Firefox before the fixture execution. Full logs are uploaded as the `r6-xa1-claude-contract` artifact.
