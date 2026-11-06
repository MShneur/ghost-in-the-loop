# Ghost in the Loop v9 — Firefox Android E4 Canary

## PR #59 - one-tap Firefox Android exporter field check (2026-11-05, DRAFT/HOLD)

This is the new exporter-only E4 evidence lane. The v9.0.0-alpha.2 Play/HUMAN/Top canary below is historical; it is NOT evidence for the v9.0.26 exporter candidate.

**Preparation (one-time manual draft installation):**
1. In Firefox Android / Tampermonkey, back up the stable Ghost script. Open the signed-in GitHub PR #59 candidate from https://github.com/MShneur/ghost-in-the-loop/blob/redesign/9.1-cleaner-mobile-export-core-20261101/ghost-in-the-loop.user.js . Install as a clearly labeled test copy, with the stable copy disabled on the same ChatGPT page to avoid duplicate injection. This is not publication. Private GitHub may require sign-in.
2. Confirm Ghost shows version 9.0.26 and a direct Export > Field check (75s max) button. If missing, do not test or claim E4.
3. Log into ChatGPT, open the actual long /c/ conversation that previously took about five minutes and returned PARTIAL, pause Play, and keep Firefox foregrounded.

**One tap:** Ghost > Export > Field check (75s max). This invokes the existing same-origin ChatGPT fast archive readers (1, then 2 only if incomplete), with no automatic DOM history scanning. The existing progress overlay offers Cancel but cannot be paused or extended during this bounded check. A counts-only GITL_Android_Field_Check_*.json downloads automatically even when source coverage is partial or the time limit is reached. No prompt is sent. Expert raw capture is temporarily disabled in memory and the prior preference restored after the check. Review the JSON before sharing.

**Read the report correctly:**
- environment.android and environment.firefox reflect UA flags only; these do not independently authenticate the device.
- authentication.shortLivedBearerAvailable and authentication.successfulArchiveHTTPResponses are booleans/counts of access observed, not credentials or independent account verification.
- time.totalMs, time.timedOut and time.limitMs (75000) give elapsed timing and the foreground limit. Background tabs may suspend timers.
- readers.attempted and each lane duration/outcome identify the API attempts; readers.noAutomaticDOMCollector reflects instrumented Ghost collector invocations, not arbitrary host scrolling.
- coverage.historyBoundariesConfirmed, archivePages, archiveNodes, exportedTurns, unplacedTurns, activities, unreadable, missingId, redacted and mediaExcluded quantify accessible history and decode gaps. archiveTextVerified concerns accessible text only; media, hidden reasoning and parallel branches are not certified.
- coverage.independentSourceComparison defaults to false: the reviewer must compare independently with the actual conversation or prior trusted export before declaring full accessible source coverage.
- TIME_LIMIT, SOURCE_UNVERIFIED, unreadable or platform-redacted content remain HOLD. Scrolling cannot reconstruct redacted platform output.

**Return:** Share only the reviewed counts-only JSON and optionally a screenshot showing the Ghost version/button with chat contents obscured. The candidate always writes acceptance=PENDING_REAL_FIREFOX_ANDROID_REVIEW and release=HOLD, regardless of desktop tests. Genuine Firefox Android E4 and separate release identity gates must be reviewed before any merge, release, deployment or installation beyond the manual opt-in test.

---


Exact runtime payload commit: `27564568ebfb505a4aad780b1be03756384ee973`
Version: `9.0.0-alpha.2`
Payload SHA-256: `779ec984eccedfe7c63aea2dd08eab3ea6eda4f3f55848cfc487da4bc8cd004f`

## Install
Open the immutable raw userscript on Firefox Android/Tampermonkey:

https://raw.githubusercontent.com/MShneur/ghost-in-the-loop/27564568ebfb505a4aad780b1be03756384ee973/ghost-in-the-loop.user.js

Confirm Ghost shows `9.0.0-alpha.2` before testing.

## ChatGPT canary
Start a fresh chat and send:

```
Ghost v9 field canary. Keep this test mechanical.
For your next five assistant turns, reply with a short unique line naming the turn number and end with exactly:
[[GITL::PROCEED]]
On the sixth assistant turn, reply "CANARY COMPLETE" and end with exactly:
[[GITL::HALT]]
Do not ask questions or add another control marker.
```

Then press **Play once**.

PASS:
- five automatic continuation Sends occur, one per turn;
- no duplicate user turns;
- round advances to 5;
- sixth answer HALTs Ghost;
- panel remains usable on mobile.

After completion, press **Copy report** and save/paste the report.

## HUMAN canary
In a new chat send:

```
Reply "HUMAN CHECK" and end with exactly:
[[GITL::HUMAN]]
```

Press Play once. PASS = Ghost pauses and does not send another continuation.

## Top
On any long conversation, press **↑ Top** while Ghost is idle.
PASS = older history loads/scrolls upward without Send, URL/hash, composer, or panel mutation.

## Export
Use Export -> Copy MD or Save JSON.
PASS = archive/API export identifies full platform history when supported; fallback plainly says it may be incomplete.

## Perplexity
Repeat the six-turn canary, HUMAN, Top, and Export on an authenticated Perplexity thread.

## Watchdog
The production watchdog intentionally uses real timing:
- 5 min no visible progress = suspicion only
- +2 min still unchanged = bounded Stop recovery

Do not artificially shorten this in the release candidate. A genuine observed stall may serve as E4 watchdog evidence; otherwise leave watchdog field proof pending rather than waiting solely to manufacture a stall.

## Return
Paste Ghost's copied report(s) or screenshots into the architect chat. The architect will reconcile PASS/FAIL and determine release disposition.

## Stop conditions
Immediately stop the canary if:
- more than one user turn is sent for one assistant PROCEED;
- Ghost sends after HUMAN/HALT;
- Ghost reports uncertain Send;
- panel/composer/navigation behavior becomes unstable.

No merge, tag, release, or publication is authorized by this canary alone.
