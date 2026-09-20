# Ghost in the Loop v9 — Firefox Android E4 Canary

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
