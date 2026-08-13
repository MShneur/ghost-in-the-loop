# Ghost Play Rescue Lab

Status: **experimental field-test companion**

Core release under test: **Ghost in the Loop 8.8.2**

Rescue Lab build: **0.3.0**

This lab exists because Play/auto-continue is Ghost's primary product promise. A green unit suite is not enough: users must be able to click Play and get one safe outbound turn, or receive a precise error that explains where execution stopped.

## Product identity

The rescue build deliberately makes identity visible instead of hiding it in diagnostics:

- Header: **Ghost**
- Subtitle: **in the Loop · v8.8.2**
- Setup identity card: **Ghost in the Loop · v8.8.2**
- Funding position: **Free forever · supported by donations**

Current product direction keeps **Free forever**. Do not replace that phrase with Pro/paywall messaging without a new explicit product decision. Optional donations and future non-blocking advertising may fund development; neither changes the current free-access promise.

## Temporary three-method Play frame

The field-test UI intentionally puts **Primary**, **Alpha**, and **Beta** inside one bordered compatibility frame so users understand that the expanded control is temporary rather than a permanent three-button product design.

The message shown in that frame says:

> Three Play methods are shown temporarily while we figure out what changed. Start with Primary. If it fails, confirm nothing was sent, then try Alpha or Beta. Once Primary is reliable again, Ghost goes back to one Play button.

The product goal remains one dependable **Primary** Play button. Alpha and Beta exist only to isolate the failure mechanism and keep field testing productive while Primary is repaired.

## Why this is a companion script first

The released Primary engine has years of safety work around exact-one Send authority, leases, route protection, uncertainty, and at-most-once delivery. We do not destabilize that release merely to collect fallback data.

The rescue lab runs alongside the current Ghost userscript and groups the current Transport control with two fallback test methods:

- **Primary** — unchanged Ghost 8.8.2 Play path; remains the default.
- **Alpha** — independent semantic Send-control lookup. It does not use Primary's reviewed selector list.
- **Beta** — independent native composer-form submission. It does not use Alpha's Send lookup or Primary's actuator selection.

Only one rescue method is ever invoked by a user click.

## Safety invariant

**Never switch engines after a possible actuation.**

If Alpha or Beta actuates once and delivery cannot be confirmed, the lab reports `delivery uncertain` and tells the user to inspect the conversation. It does not automatically try another engine.

If Primary itself reports an uncertain delivery, Alpha and Beta are locked out.

The companion also refuses to claim `nothing sent` for Primary merely because it did not observe a new turn; Primary is closure-local and the companion cannot prove whether its actuator fired. Primary failures therefore use the truthful state **no send observed** unless Ghost core itself provides stronger evidence.

## Error stages

Every rescue attempt receives a short Run ID and one of these stages:

1. `PLAY`
2. `PREFLIGHT`
3. `COMPOSER`
4. `STAGE`
5. `AUTHORITY`
6. `DISPATCH`
7. `CONFIRM`
8. `RUNNING`

Examples:

- `ALPHA-COMP-001` — Alpha could not identify one safe composer.
- `ALPHA-AUTH-002` — multiple plausible Send controls; Alpha refused to guess.
- `BETA-FORM-001` — the composer has no native form for Beta to submit.
- `BETA-CONF-001` — Beta actuated once but delivery could not be proved.
- `RESCUE-SAFETY-001` — an unresolved Primary delivery locks rescue actuation.
- `PRIMARY-START-001` — Primary did not visibly enter RUNNING and no new outbound turn was observed by the lab.

The status line always reports the method, stage, and one of:

- `confirmed`
- `nothing sent` (Alpha/Beta pre-actuation failure only)
- `no send observed` (conservative Primary observation)
- `delivery uncertain`

## Feedback

After a method produces a result, the user can press:

- `👍 Worked`
- `👎 Failed`

The lab stores only bounded local metadata:

- coarse site family (ChatGPT, Claude, Perplexity, etc.)
- method (Primary/Alpha/Beta)
- worked/failed
- stage
- stable error code
- core version
- lab version
- timestamp

It never stores or copies prompt text, assistant text, full URLs, conversation IDs, credentials, raw user-agent strings, or network payloads.

A click copies a line such as:

`GITL-FEEDBACK | ChatGPT | Alpha | WORKED | CONFIRM | none | core 8.8.2 | lab 0.3.0`

This can be pasted into a bug report or development chat so we can build a site/method evidence matrix without collecting conversation content.

## Test contract

`tests/e2e/play-rescue-lab.spec.js` does what the old transport contract did not: it physically clicks the rendered rescue controls.

It verifies:

- the Ghost / in the Loop / version branding is visible;
- Setup shows version + Free forever + donation support;
- one temporary border physically contains Primary, Alpha, and Beta;
- the compatibility message says the three-method state is temporary and the end state is one Primary Play button;
- Alpha performs exactly one semantic Send and does not use Beta;
- Beta performs exactly one native form submit and does not use Alpha;
- uncertain Primary delivery locks both rescue engines;
- a silent Primary click becomes a visible `PRIMARY-START-001` failure;
- copied feedback excludes prompt text;
- the rescue UI still mounts when an `innerHTML` sink is forcibly blocked (Trusted-Types-like condition).

## Install for field testing

Keep normal Ghost 8.8.2 installed and enabled.

Install this second userscript from the isolated branch:

`agent/play-rescue-ux/diagnostics/play-rescue-lab.user.js`

Then reload the AI site. The normal Ghost panel should show:

- the new two-line brand lockup;
- one bordered **Play compatibility check** area marked **TEMP**;
- **Primary · current Ghost** above the normal Start button;
- Alpha and Beta fallback test buttons inside the same border;
- a short note explaining why three methods are temporarily visible;
- a method/stage/error status line;
- version/funding identity on Setup.

Do not install the companion as a replacement for core Ghost. It intentionally depends on the normal Ghost panel being present.

## Promotion rule

Alpha or Beta does not become Primary because it worked once. Promotion requires repeated real-site evidence plus independent adversarial tests showing:

1. the candidate works on the target site/browser class;
2. Primary can be deliberately broken without breaking the candidate;
3. the candidate can be deliberately broken without changing Primary;
4. exactly one actuator fires;
5. uncertainty never triggers automatic fallback;
6. Play proceeds through outbound turn, generation, marker detection, and next-loop behavior.
