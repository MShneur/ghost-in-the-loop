# Round 7 Worker 4 — BUILD-IDENTITY Red Team / clean-CI verification

## Identity

- Assignment: `R7-A3-BUILD-IDENTITY-REDTEAM-CI`
- Executed by: `scheduled-worker-3-r7-a3-redteam-ci-04`
- Intended method: independent test-engineer / Red-Team successor
- Canonical lease claim: `8e7aedb41b2e18c29ef366dd1ea6b78a201d4b02`
- Inspected predecessor head: `0bc30f5188ba98c09453dd6ee0a304fff1d2cf72`
- Exact tested A3 head: `8e7aedb41b2e18c29ef366dd1ea6b78a201d4b02`
- Branch: `agent/8.8-repair-resume`
- Started: `2026-08-08T09:20:30Z`
- Exact A3 CI completed: `2026-08-08T09:27:19Z`

## State Read

The canonical maker v1.1, shared state, round plan, orchestration README, succession rule, evidence contract, task prompts, deferred-question queue, and `.gitl/user-directives/2026-08-07-release-pressure.md` were read before assignment mutation.

Round 4 and Round 5 remain accepted only at their recorded bounded scopes. Round 6 read-only authenticated inspection remains authorized, while exact current live ChatGPT/Claude insertion and physical-platform claims remain uncertified. `publishReady` remains false.

A1 and A2 were submitted and A3 was the earliest dependency-ready assignment. The Delivery-Pressure Checkpoint made research fallback ineligible because a safe executable release-critical verification artifact existed; the research-only wake count remained zero.

## Step Performed

1. Claimed the canonical A3 lease before durable assignment work.
2. Independently re-read `scripts/build-identity.js`, `tests/build-identity.test.js`, `.gitl/evidence/round-7/candidate-identity.json`, and ordinary CI wiring.
3. Verified that the candidate-versus-stable contract remains fail-closed: isolated candidate branch, stable `main` URL, `publishReady=false`, exact version-source agreement, deterministic generated parity, immutable payload hash set, and no extra/missing payload paths.
4. Bound ordinary CI to exact A3 lease-claim head `8e7aedb41b2e18c29ef366dd1ea6b78a201d4b02`.
5. Verified full unit/base/identity and browser E2E conclusions, including the four required BUILD-IDENTITY mutant families.
6. Cross-checked the immediately preceding ordinary run because its first attempt was red despite identical product/test/payload bytes. The same predecessor run passed on retry, demonstrating hosted timing-oracle variance that must not be hidden or repaired by weakening the accepted Round-5 threshold.

## Research Sources

None. Executable verification outranked research under maker v1.1 Delivery-Pressure.

## Changes

No product source, generated runtime, manifest, dependency, package-lock, version, channel, test assertion, or workflow semantics changed in A3.

The compare from exact A1 implementation head `ee7d79a286193de699e3dc049182492a6dbd5b1d` through exact A3 tested head `8e7aedb41b2e18c29ef366dd1ea6b78a201d4b02` contains only `.gitl` coordination/evidence changes. The immutable payload therefore remains the A1 payload:

- `ghost-in-the-loop.user.js`: `3493ccc31c97db9749768ab32fafc6dc89c2ebc23f043ebaf998aaf115ebf1df`
- `extension/manifest.json`: `1bd616e74988e820885ab210ade3afb031eb905bd522053768dae58650292489`
- `extension/content.js`: `2570d6f6e735ad9ecd0eb49a608c7fd36c79c1b0ed70c5fbf367fac8dadd6990`
- `extension/icon-48.png`: `d698ec8171597e6954d37016082bd5d4740ab91678769bf90e4a826be2037057`
- `extension/icon-96.png`: `05425051e2a49b1a896477c3c43d09f1458c99749149f331f4a89dc9a1a28815`

## Tests

### Exact A3 ordinary clean-head CI

Run: `31250442852`

Exact head: `8e7aedb41b2e18c29ef366dd1ea6b78a201d4b02`

Overall conclusion: **SUCCESS**.

#### Unit / base / identity

- Job `93085873656`: **SUCCESS**
- Node project runtime: `20.20.2`; npm `10.8.2`
- `cert:base`: PASS
- generated extension parity: PASS
- manifest audit / artifact index: PASS
- syntax/lint: PASS
- full Jest: **44/44 suites passed; 483 passed, 3 todo, 486 total**
- focused version + BUILD-IDENTITY suite: **15/15 passed**
- identity check: `Build identity oracle PASS (head-moved-payload-identical).`
- base artifact `9019830371`
- base artifact SHA-256 `2e66ce5895620acfeffa81e5a1dd055189fe576b100f6d8e9743a85d8507a902`

The focused suite kills the required deliberate mutants:

1. version-source drift — killed;
2. generated-content drift — killed;
3. payload-hash drift — killed;
4. candidate/stable-channel confusion — killed.

It also preserves the distinction between coordination-only Git head movement and shipped-payload movement.

#### Ordinary browser E2E

- Job `93085873700`: **SUCCESS**
- **231 collected; 221 passed; 10 skipped; 0 failed**
- E2E artifact `9019874811`
- E2E artifact SHA-256 `5b9c825c7342533185189193ace814fa7181e2b74453875996cfde1fe97e1789`
- Send/submit/input/keydown safety ledgers remained zero in the long-chat measurements.
- The preserved Round-5 A2 grouped-selector timing oracle passed on this exact head without any threshold change.

### Required dissent: immediately preceding same-payload ordinary run

Predecessor head: `0bc30f5188ba98c09453dd6ee0a304fff1d2cf72`.

Run `31250247148`, attempt 1: **FAILURE**. Unit/base passed; the sole E2E failure was the Chromium Round-5 A2 grouped-selector timing oracle. Playwright reported **220 passed, 10 skipped, 1 failed**. The failing assertion preserved the accepted small-case gate `small.p95Ms <= 0.875 ms`; attempt 1 measured approximately `0.9000000000232831 ms`, and its Playwright retry measured `2 ms`. No Send/CHOICE/route/lease/uncertainty or structural safety assertion failed.

Run `31250247148`, attempt 2 on the **same exact predecessor head**: **SUCCESS**.

The A3 exact-head run `31250442852` also passed the same preserved timing oracle, with its Chromium A2 row reporting small p95 about `0.7 ms` and 2000-turn p95 about `1.9 ms`.

Classification: this is direct evidence of hosted sub-millisecond wall-clock timing variance, not evidence of a product regression. It does not revoke the user-authorized bounded Round-5 certification, and it does not justify post-hoc threshold weakening. The final BUILD-IDENTITY auditor must carry this variance as a release-evidence risk rather than cherry-picking only a green run.

### Tooling-runtime observation

GitHub warns that `actions/checkout@v4`, `actions/setup-node@v4`, and `actions/upload-artifact@v4` target the deprecated Node-20 action runtime and are being forced onto Node 24. Project commands themselves execute under setup-node Node `20.20.2`. No causal link to the timing variance is established.

## Acceptance Criteria

- Version-drift mutant killed: **PASS**
- Generated-content mutant killed: **PASS**
- Payload-hash mutant killed: **PASS**
- Channel-confusion mutant killed: **PASS**
- Ordinary clean-head CI passes on exact A3 candidate head: **PASS** (`31250442852`)
- Identity oracle passes on exact A3 candidate head: **PASS** (`head-moved-payload-identical`)
- No failed identity mutant required repair: **PASS / N/A**
- Exact head/run/job/artifact/log conclusions recorded: **PASS**
- A2 dependency disposition preserved: **PASS**
- `publishReady=false`: **PASS**

## Safety Checks

No change to `main`; no merge/auto-merge; no tag; no publication/release; no stable-channel mutation.

No Send replacement/interception weakening, CHOICE weakening, route weakening, lease weakening, uncertainty weakening, exact-identity weakening, or other fail-closed safeguard change occurred.

No Round-5 performance threshold was changed to obtain green CI.

The A2 dependency disposition remains bounded: `brace-expansion@1.1.15` and `js-yaml@3.14.2` are lockfile-bound indirect Jest development nodes; `npm audit --omit=dev` is clean; no concrete path into immutable shipped payload bytes was established; shipped exploitability remains UNKNOWN / not claimed; no dependency upgrade was made.

## Risks and Limits

1. **Hosted timing reproducibility risk:** the immediate predecessor's first ordinary attempt failed only the preserved sub-millisecond R5 A2 timing oracle, while a retry on the same exact head and the A3 exact-head run passed. A3 therefore proves an exact clean pass but not universal hosted timing reproducibility. Final audit must represent both observations.
2. **Identity provenance model:** the committed identity record intentionally binds immutable payload hashes and a provenance head older than later `.gitl` coordination commits; the oracle reports `head-moved-payload-identical` rather than pretending coordination HEAD is immutable payload identity. A4 must decide whether the final candidate/test binding is unambiguous enough for BUILD-IDENTITY closure.
3. **Dependency limits:** A2's two high advisories remain real in development tooling; shipped exploitability is not universally disproven, only unsupported by the evidenced production graph/payload path.
4. **Live/platform limits:** exact current live ChatGPT/Claude insertion, physical Android/WebView, GeckoView, real IME/browser-toolbar combinations, real assistive-technology mappings, and calibrated low-end-device performance remain uncertified.
5. **Actions runtime hygiene:** legacy v4 action runtimes are currently forced onto Node 24 while project commands are Node 20.20.2; this remains release/tooling hygiene evidence, not a demonstrated product defect.

## Recommended Next Action

Submit A3 and expose `R7-A4-BUILD-IDENTITY-FINAL-AUDIT` under a fresh lease.

A4 must independently verify the immutable payload/provenance/test binding, the A2 dependency disposition, all required mutant sensitivity, exact A3 CI evidence, and the contradictory-but-explained timing observations from run `31250247148` attempt 1 versus attempt 2 / A3 run `31250442852`. It must not silently discard the red attempt, loosen R5 thresholds, or promote live/physical claims.

If A4 determines the timing variance or provenance relation prevents a bounded BUILD-IDENTITY closure, it should expose only the smallest evidence-linked recovery. Otherwise it may close BUILD-IDENTITY at its supported scope and expose DOCS-RECONCILIATION while keeping `publishReady=false`.

## Assignment Status

`R7-A3-BUILD-IDENTITY-REDTEAM-CI`: **submitted / PASS at exact A3 head, with explicit hosted timing-reproducibility dissent carried to A4**.
