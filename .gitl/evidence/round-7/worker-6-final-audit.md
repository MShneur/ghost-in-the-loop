# Round 7 Worker 6 — BUILD-IDENTITY Final Audit

## Identity

- Round: 7
- Worker evidence slot: 6
- Intended role: Devil's Advocate / release auditor
- Executed by: `scheduled-successor-r7-a4-final-audit-03`
- Assignment ID: `R7-A4-BUILD-IDENTITY-FINAL-AUDIT`
- Branch: `agent/8.8-repair-resume`
- Started at: `2026-08-08T09:41:30Z`
- Finished at: `2026-08-08T09:47:19Z`
- Starting / inspected head: `75b0a7c9aedce61f09b953d3f452e832a03d4fa7`
- Lease claim commit: `012012dab52408f4a0a51b73d8a785602f661897`

## State Read

The canonical Personal-Forge maker v1.1 was read before Ghost repository work. I then re-read canonical state, the Round-7 plan, orchestration README, universal task prompt, evidence contract, succession rule, deferred-question queue, explicit `2026-08-07-release-pressure.md` directive, and all A4-mandatory Round-7 evidence.

Controlling authority remains unchanged:

- Round 4 lifecycle and Round 5 long-chat certifications are accepted only at their recorded bounded scopes.
- Round 6 read-only authenticated ChatGPT inspection is authorized whenever a functioning carrier exists, but exact current live ChatGPT/Claude structural insertion remains uncertified until qualifying live evidence is obtained.
- Missing live capture limits live-host claims; it is not a blanket blocker on deterministic repository work.
- Publication remains forbidden. `publishReady` must remain false.
- Send, CHOICE, route, lease, uncertainty, exact identity, structural demotion/fallback, and other fail-closed safeguards may not be weakened.

At assignment selection, state was active, A2 and A3 were submitted, A4 was the earliest ready assignment, no lease was active, and no branch workflow was in progress. The Delivery-Pressure ledger recorded zero research-only wakes and a recent testable artifact, so research was ineligible while this executable final audit existed.

## Step Performed

I independently audited the BUILD-IDENTITY chain rather than accepting the predecessor narrative at face value:

1. Re-read the supervisor's selected identity model, the A1 machine-readable record/oracle implementation and mutant tests, A2 raw dependency audit plus disposition, and A3 Red-Team evidence.
2. Inspected `scripts/build-identity.js` and `tests/build-identity.test.js` to confirm the oracle actually fails version drift, generated-content drift, payload-hash drift, and candidate/stable-channel confusion rather than merely documenting them.
3. Compared the identity-record provenance head through the current candidate and separately compared the exact A3 tested head through this audit lease claim to detect payload or test-semantic movement.
4. Re-checked ordinary CI on the latest pre-claim handoff head rather than relying only on A3's earlier green run.
5. Searched for contradictory CI evidence and found an additional timing-only red ordinary run on the immediately preceding coordination head; this is retained below rather than cherry-picked away.
6. Reconciled the dependency findings, the older identity-record provenance head, and hosted timing variance against the exact A4 acceptance criteria.

No product, dependency, test, workflow, version, generated artifact, channel, or publication mutation was made by this audit.

## Research Sources

No external research was required. Executable repository/CI verification outranked research under maker v1.1 Delivery-Pressure.

Repository evidence used:

- `.gitl/evidence/round-7/worker-1.md`
- `.gitl/evidence/round-7/worker-3.md`
- `.gitl/evidence/round-7/candidate-identity.json`
- `.gitl/evidence/round-7/dependency-audit.json`
- `.gitl/evidence/round-7/worker-6-dependency-audit.md`
- `.gitl/evidence/round-7/worker-4.md`
- `scripts/build-identity.js`
- `tests/build-identity.test.js`
- `package.json`
- GitHub compare and Actions evidence listed below.

## Independent Identity Audit

### Candidate identity is unambiguous at the bounded non-published scope

The selected contract is not semver-only and not raw-HEAD-only. It binds release target `8.8.0` to:

- canonical source `ghost-in-the-loop.user.js`;
- deterministic generated runtime `extension/content.js` via `scripts/build-extension.js`;
- exact shippable payload hashes;
- a Git provenance head recorded separately from payload identity;
- exact certification/test bindings;
- explicit candidate-versus-stable channel classification;
- fail-closed publication state `candidate-not-published`, `publishReady=false`.

The committed payload hash set is:

- `ghost-in-the-loop.user.js`: `3493ccc31c97db9749768ab32fafc6dc89c2ebc23f043ebaf998aaf115ebf1df`
- `extension/manifest.json`: `1bd616e74988e820885ab210ade3afb031eb905bd522053768dae58650292489`
- `extension/content.js`: `2570d6f6e735ad9ecd0eb49a608c7fd36c79c1b0ed70c5fbf367fac8dadd6990`
- `extension/icon-48.png`: `d698ec8171597e6954d37016082bd5d4740ab91678769bf90e4a826be2037057`
- `extension/icon-96.png`: `05425051e2a49b1a896477c3c43d09f1458c99749149f331f4a89dc9a1a28815`

The identity record's provenance head is `30c49f690afb14683014e0a7c40c5c2093aaba2a`, while later exact tested/coordination heads are newer. This is not silently treated as an exact-head match: the oracle deliberately emits `head-moved-payload-identical` when the Git head moves while every recorded shipped byte remains identical.

A compare from provenance head `30c49f690afb14683014e0a7c40c5c2093aaba2a` through pre-audit head `75b0a7c9aedce61f09b953d3f452e832a03d4fa7` shows only `.gitl/**` evidence/coordination files plus the two-line ordinary-CI wiring that invokes the BUILD-IDENTITY oracle. No userscript, manifest, generated extension runtime, icon, package, lockfile, product source, or browser-test semantic changed.

A second compare from exact A3 tested head `8e7aedb41b2e18c29ef366dd1ea6b78a201d4b02` through A4 lease claim `012012dab52408f4a0a51b73d8a785602f661897` shows only `.gitl/autopilot-state.json`, `.gitl/evidence/round-7/worker-4.md`, and `.gitl/orchestration/round-plan.json` changes. Thus the exact A3-tested payload remains the current payload at A4 claim time.

**Audit conclusion:** the provenance relation is explicit and reproducible enough for the selected bounded BUILD-IDENTITY contract. It would be incorrect to call the older record provenance an exact current coordination HEAD; it is equally incorrect to treat `.gitl`-only head movement as a new shipped build when the payload hashes remain identical.

### Red-Team sensitivity is substantive

The implementation/test review confirms visible failure behavior for all four required mutant families:

1. version-source divergence — rejected by version consistency;
2. generated extension drift — rejected by the existing generated-parity checker;
3. shipped payload hash drift — rejected by record validation;
4. candidate/stable-channel confusion — rejected when stable userscript URLs no longer identify `main`.

The oracle also rejects unexpected payload path-set changes and keeps `publishReady=false` as a validation requirement. A coordination-only head change is reported distinctly rather than disguised as exact provenance.

## Dependency Audit Disposition

A2 captured exact lockfile-bound evidence under run `31250069277`, job `93084916423`:

- full `npm audit --json`: exactly 2 high findings;
- `brace-expansion@1.1.15`: indirect Jest development graph;
- `js-yaml@3.14.2`: indirect Jest development graph;
- root `package.json`: no production `dependencies`;
- `npm audit --omit=dev --json`: zero vulnerabilities;
- no concrete package path into A1's immutable shipped userscript/extension payload was established.

The raw `npm explain` evidence traces the vulnerable nodes through Jest tooling to root dev dependencies. This supports an **evidence-bounded non-shipped release disposition** for the current candidate. It does not prove the upstream advisories harmless, and it does not prove development-tooling exploitability impossible.

**Shipped exploitability remains `UNKNOWN / NOT CLAIMED`.** No blind dependency upgrade is justified or authorized by this audit.

## Tests and CI

### A3 exact candidate verification

A3 exact head `8e7aedb41b2e18c29ef366dd1ea6b78a201d4b02`:

- ordinary run `31250442852`: **SUCCESS**
- unit/base/identity job `93085873656`: **SUCCESS**
- E2E job `93085873700`: **SUCCESS**
- Jest: 44/44 suites, 483 passed, 3 todo
- focused identity/version: 15/15 passed
- E2E: 221 passed, 10 skipped, 0 failed
- identity mutant families: all four killed
- base artifact `9019830371`, SHA-256 `2e66ce5895620acfeffa81e5a1dd055189fe576b100f6d8e9743a85d8507a902`
- E2E artifact `9019874811`, SHA-256 `5b9c825c7342533185189193ace814fa7181e2b74453875996cfde1fe97e1789`

### Latest pre-audit handoff head

Exact pre-audit head `75b0a7c9aedce61f09b953d3f452e832a03d4fa7`:

- ordinary run `31250770870`: **SUCCESS**
- unit/base/identity job `93086684148`: **SUCCESS**, including BUILD-IDENTITY oracle
- E2E job `93086684177`: **SUCCESS**
- base artifact `9019925369`, SHA-256 `343fe64d180bf6681443039f7261928393c879cdc4dc3d86fc34573c3d679001`
- E2E artifact `9019971885`, SHA-256 `c0ddfaa4b4334c2a65b286689de26228047234ba3d22ad96fa1c50837a63df30`

The successful current-head E2E artifact still contains useful dissent: its Round-5 A2 direct grouped-selector oracle passed on the first result (`small.p95` about `0.6 ms`, 2000-turn p95 about `2.0 ms`), but the separate heavy-DOM-replacement Long-Chat Red-Team timing case was flaky: an initial large-case measurement was about `2.5 ms` against the preserved `<2.3 ms` gate, then its retry passed.

### Additional contradictory ordinary run retained by A4

The immediately preceding coordination-only plan head `7fe9fd47885170bdda48e10348e5c410cf84e7df` had ordinary run `31250736801`: **FAILURE**.

- unit/base/identity job `93086597824`: **SUCCESS**, including BUILD-IDENTITY oracle;
- E2E job `93086597833`: **FAILURE**;
- E2E artifact `9019957654`, SHA-256 `d30f534c16f3d94ee5ba407066567288b1c1803faaffa9ddf69f7414191a7a5b`;
- base artifact `9019915956`, SHA-256 `436a8ff892037acf5deaad93042040f9ec56f5379ecf7b3adca618ed32055218`.

The E2E artifact contains 220 passed, 10 skipped, 1 failed. The sole failure is again the preserved Chromium Round-5 A2 grouped-selector timing oracle. The first result measured small-case p95 about `1.4 ms` against the existing `<=0.875 ms` gate; its Playwright retry measured about `3.6 ms` against the same gate. No identity, Send, CHOICE, route, lease, uncertainty, or structural assertion is identified as the failing gate.

This extends, rather than contradicts, A3's recorded timing dissent: predecessor run `31250247148` attempt 1 failed the same preserved timing family, while attempt 2 passed on the same exact predecessor head; A3 itself passed; `7fe9fd...` later failed; `75b0a7c...` then passed overall with one different Long-Chat timing test flaky. The relevant heads differ only by coordination/evidence movement after A3.

**Classification:** current evidence demonstrates hosted sub-millisecond/millisecond wall-clock reproducibility variance. It does not demonstrate a BUILD-IDENTITY defect or a product-byte regression. It does not revoke the user-authorized bounded Round-5 certification. It also does not justify weakening or silently removing the accepted timing thresholds. The red and green observations must remain in release evidence and be carried into final certification.

### Tooling-runtime observation

GitHub Actions warns that `actions/checkout@v4`, `actions/setup-node@v4`, and `actions/upload-artifact@v4` target the deprecated Node-20 action runtime and are being forced onto Node 24, while project commands execute under setup-node's Node `20.20.2`. No causal link to the timing variance or product behavior is established here.

## Acceptance Criteria

- Identity record is unambiguous and reproducible at the selected immutable-payload/candidate-channel scope: **PASS**.
- Exact payload hashes remain continuous through the exact A3-tested candidate and A4 claim head: **PASS**.
- Provenance/test relationship is explicit rather than falsely represented as exact-head identity: **PASS**.
- Dependency findings are evidenced outside the shipped production dependency graph with no concrete shipped-payload path: **PASS, bounded**; shipped exploitability remains UNKNOWN / not claimed.
- Red-Team mutants demonstrate identity-oracle sensitivity: **PASS**.
- Ordinary clean-head CI is green on exact A3 head: **PASS**.
- Ordinary CI is also green on the latest pre-audit handoff head: **PASS** (`31250770870`).
- Contradictory timing failures/retries are explicitly retained and reconciled without threshold weakening: **PASS**.
- Round-5 timing threshold weakened: **NO**.
- Product/runtime/dependency/channel semantics changed by A4: **NO**.
- `publishReady` remains false: **PASS**.
- Live/physical claims promoted beyond prior evidence: **NO**.
- Main/merge/auto-merge/tag/release/publish action: **NO**.

## Safety Checks

- Send authority unchanged.
- CHOICE behavior unchanged.
- Route and lease safety unchanged.
- Uncertainty and fail-closed structural demotion unchanged.
- Stable userscript update/download channel unchanged.
- No dependency upgrade.
- No version bump.
- No `main`, merge, auto-merge, tag, publication, store, or GitHub Release action.

## Risks and Limits

1. **Hosted timing reproducibility remains an explicit release-evidence risk.** Green exact-head runs coexist with timing-only red/flaky observations on identical payload semantics. Final certification must preserve this record and may not convert it into a universal calibrated-hardware performance claim.
2. **Development-tooling advisories remain real.** `brace-expansion@1.1.15` and `js-yaml@3.14.2` remain in the Jest development graph. The bounded release disposition is based on zero omit-dev vulnerabilities and no concrete shipped-payload path, not on a universal non-exploitability claim.
3. **Identity provenance is intentionally two-part.** The machine-readable record captures immutable payload identity at an earlier provenance head, while exact later CI heads are separately bound. `head-moved-payload-identical` is an explicit relation, not an exact current-head assertion.
4. **GitHub Actions runtime hygiene remains unresolved.** Legacy v4 action runtimes are forced onto Node 24 while project commands use Node 20.20.2; no product-failure causality is claimed.
5. Exact current live ChatGPT/Claude structural insertion remains uncertified. Physical Android, Android WebView, Firefox-Android/GeckoView, real IME/browser-toolbar combinations, real assistive-technology mappings, and calibrated low-end-device performance remain uncertified.

## Verdict

**ACCEPTED — BUILD-IDENTITY is complete at a bounded immutable-payload / explicit-provenance-and-test-binding / candidate-channel / non-published scope.**

This verdict establishes an evidence-backed identity for the isolated 8.8.0 candidate. It does **not** make the candidate public, stable, publish-ready, or universally certified. The timing-variance and development-tooling limitations above remain explicit release evidence.

`DOCS-RECONCILIATION` should now be exposed through the next supervisor planning assignment. Publication remains disabled, and FINAL-CERT-PACKAGE remains later work.

## Recommended Next Action

Open the smallest supervisor planning assignment for `DOCS-RECONCILIATION`. It should reconcile architecture/README/help/changelog/protocol/orchestration documentation against the accepted bounded 8.8 evidence, including:

- candidate/stable/non-published identity separation;
- bounded R4/R5/R6 claim limits;
- A2 development-tooling advisory disposition;
- hosted Long-Chat timing reproducibility dissent;
- exact live ChatGPT/Claude and physical-platform uncertified limits;
- continued `publishReady=false` and protected publication boundaries.

Do not reopen broad research and do not skip directly to publication or final release.

## Assignment Status

`R7-A4-BUILD-IDENTITY-FINAL-AUDIT`: **ACCEPTED at bounded non-published BUILD-IDENTITY scope**.
