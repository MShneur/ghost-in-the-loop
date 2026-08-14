# Ghost in the Loop — Workbench 1 Handoff

Continue exactly from the current GITL field-debug state. Do not restart diagnosis from scratch.

## What matters now
- Real Perplexity mobile test: first transmission sends successfully; second continuation is inserted into the composer but Perplexity keeps its visible Submit button disabled.
- This means the next investigation should focus on how the second continuation is committed into Perplexity's real editor state, not on trying many different Send-button selectors.
- Rescue is optional and is not required after a failed run. In the last field report, Rescue did not recover the disabled Submit state.
- Watch/passive tests must always finish visibly or time out; never leave the user wondering whether the screen froze.
- ChatGPT has not yet been field-tested in this latest run.

## Next test design
Build the next diagnostic as a simple one-button flow for a non-coder:
1. User presses one Play/Run button once.
2. Script automatically runs the useful stages in sequence.
3. Script watches host state itself and advances only when safe.
4. Stop automatically at the first meaningful failure boundary.
5. Do not make the user press Test 1, Test 2, Test 3, etc.
6. Only ask for a manual action when a real human action is specifically needed.
7. First high-value manual checkpoint: after cycle-2 text is visibly staged while Submit is disabled, ask the user to type one normal character. Record whether that immediately enables Submit.
8. If one keystroke enables Submit, treat that as strong evidence that programmatic cycle-2 staging is visually present but not committed to Perplexity's internal editor model.
9. If Submit stays disabled, investigate stale/wrong editor instance or another host validity condition.

## Experimental discipline
Each automatic stage must test a genuinely different hypothesis. Do not repeat the same staging/send path with cosmetic selector variations. Prefer orthogonal editor-state/input strategies and stop before Send unless the candidate has actually produced an enabled, unique Send control.

## User-facing reporting rule
Keep reports short and plain-language. The user does not want coder-level logs or long pass/fail explanations. Tell them only:
- what button to press,
- whether it worked,
- what the next action is.
Keep detailed diagnostics inside the script/report for the next agent to interpret.

## Project context
Repo: `MShneur/ghost-in-the-loop`
P0: reliable Play/Proceed in the real authenticated host.
P1: Export.
Issue #40 remains the consolidation source of truth. Do not claim fixed without authenticated field proof.

This handoff is for **Ghost in the Loop — Workbench 1** and the next session should continue directly from here.
