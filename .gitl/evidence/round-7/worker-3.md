# Round 7 Worker 3 — BUILD-IDENTITY Oracle

## Assignment

- Assignment: `R7-A1-BUILD-IDENTITY-ORACLE`
- Program: `BUILD-IDENTITY`
- Executed by: `scheduled-worker-5-r7-a1-build-identity-oracle-04`
- Role/method: builder-test-engineer successor with independent falsification checks
- Lease claim commit: `cc5d9362313c164ba67e5b01ec18ba67428cf05d`
- Isolated branch: `agent/8.8-repair-resume`
- Pre-claim inspected head: `20103facba359782ee5bfc6596772a0d279b7c22`

## Authority and Delivery-Pressure Decision

The canonical Personal-Forge maker v1.1 was read before project work. The explicit release-pressure directive remains authoritative: bounded Round-4 and Round-5 certifications stay accepted only at their recorded scopes; Round-6 read-only live inspection remains authorized; missing current live capture does not block deterministic repository-native delivery work. The Delivery-Pressure Checkpoint selected this executable falsifiable BUILD-IDENTITY artifact over research. No research-only fallback was used.

## Implementation

Durable implementation/test commits on the isolated branch:

1. `cfeb96121e9abf7f80ce09bd3580ca3a52077758` — added `scripts/build-identity.js`.
2. `280bb0e158bada963316f23b14a04be3fa1e6d65` — added `tests/build-identity.test.js` with falsification mutants.
3. `30c49f690afb14683014e0a7c40c5c2093aaba2a` — wired `identity:write`, `identity:check`, `identity:oracle`, and syntax checking in `package.json`.
4. `ba1d4c0b96420eba4843c867eae497f57b9936d9` — committed `.gitl/evidence/round-7/candidate-identity.json`.
5. `ee7d79a286193de699e3dc049182492a6dbd5b1d` — made the ordinary CI unit/base job execute `npm run identity:oracle`.

No product-runtime source, dependency version, semantic release version, stable userscript URL, or generated `extension/content.js` was changed by this assignment.

## Identity Contract Implemented

The machine-readable record uses schema `gitl-build-identity-v1` and binds:

- release target `8.8.0`;
- candidate branch `agent/8.8-repair-resume`;
- stable channel `main`;
- fail-closed publication classification `candidate-not-published` with `publishReady=false`;
- all repository version sources (`package.json`, lockfile root, userscript header, runtime `VER`, extension manifest);
- canonical source and deterministic extension-generation authority;
- exact immutable payload size and SHA-256 for the userscript, manifest, generated extension runtime, and both extension icons;
- Git provenance separately from payload identity.

Exact recorded shippable payload:

| Path | Bytes | SHA-256 |
|---|---:|---|
| `ghost-in-the-loop.user.js` | 375302 | `3493ccc31c97db9749768ab32fafc6dc89c2ebc23f043ebaf998aaf115ebf1df` |
| `extension/manifest.json` | 1589 | `1bd616e74988e820885ab210ade3afb031eb905bd522053768dae58650292489` |
| `extension/content.js` | 374443 | `2570d6f6e735ad9ecd0eb49a608c7fd36c79c1b0ed70c5fbf367fac8dadd6990` |
| `extension/icon-48.png` | 197 | `d698ec8171597e6954d37016082bd5d4740ab91678769bf90e4a826be2037057` |
| `extension/icon-96.png` | 352 | `05425051e2a49b1a896477c3c43d09f1458c99749149f331f4a89dc9a1a28815` |

The oracle deliberately distinguishes a coordination/test-infrastructure-only Git head movement from a shippable payload change: identical payload bytes with a later head are accepted only as `head-moved-payload-identical`, not misreported as an exact-head payload provenance match.

## Falsification Coverage

`tests/build-identity.test.js` adds six focused checks:

1. baseline candidate identity consistency;
2. deliberate semantic-version drift fails visibly;
3. deliberate generated-content drift is killed by the existing `scripts/build-extension.js --check` parity gate;
4. deliberate payload-hash drift fails visibly;
5. deliberate candidate-versus-stable userscript URL confusion fails visibly;
6. coordination-only head movement remains distinguishable from payload movement.

The new oracle reuses the existing `cert:base`, generated-parity, manifest-audit, artifact-index, and version-consistency contracts rather than replacing them with weaker logic.

## Exact Ordinary CI Evidence

Exact tested implementation head:

`ee7d79a286193de699e3dc049182492a6dbd5b1d`

Ordinary workflow:

- Workflow: `Ghost in the Loop — CI`
- Run: `31249049293`
- Event: `push`
- Conclusion: **SUCCESS**
- Completed: `2026-08-08T08:48:42Z`

### Unit / Base / Identity Job

- Job: `93082348817`
- Conclusion: **SUCCESS**
- `npm run cert:base`: PASS
- generated parity: PASS
- manifest audit/artifact indexing: PASS
- syntax/lint: PASS
- full unit suite: **44/44 suites passed; 483 passed, 3 todo, 486 total**
- focused version + BUILD-IDENTITY suite: **2/2 suites passed; 15/15 tests passed**
- exact identity check output: `Build identity oracle PASS (head-moved-payload-identical).`
- base certification artifact: `9019411850`
- artifact ZIP SHA-256: `c281904cf69a147c7f6e6d4b969486acda5f21f2a4c6584c261e4cac0bd64523`

### Browser E2E Job

- Job: `93082348718`
- Conclusion: **SUCCESS**
- Playwright collected: 231
- **221 passed, 10 skipped, 0 failed**
- E2E artifact: `9019454463`
- artifact ZIP SHA-256: `c80050621de4a39b036dba468085d2632d3b901a8c682bc5c09cb5a607495715`

The preserved Round-5 A2 Chromium timing oracle passed on this exact head; no performance threshold was changed. The emitted baseline retained `smallP95Ms=0.7` and `largeP95Ms=2.3`, while the selected 180-turn candidate p95 was about `0.6000000000058208 ms` and the 2000-turn candidate p95 about `1.6000000000058208 ms` with selector match count 2001.

## Safety and Scope

- No Send assertion or actuator authority changed.
- No CHOICE, route, lease, uncertainty, exact-identity, clipping/demotion, or fail-closed safeguard was weakened.
- No dependency was upgraded or added.
- No version was bumped.
- Stable `@updateURL` / `@downloadURL` remain pinned to `main`.
- `publishReady` remains false.
- No `main`, merge, auto-merge, tag, publish, release, or store action occurred.

## Risks and Explicit Limits

1. `npm ci` still reports **two high-severity vulnerabilities**. Their exact affected package paths, shipped-payload reachability, exploitability, and correct remediation remain UNKNOWN and are intentionally deferred to `R7-A2-DEPENDENCY-AUDIT`. No blanket `npm audit fix` is authorized.
2. GitHub Actions warns that `actions/checkout@v4`, `actions/setup-node@v4`, and `actions/upload-artifact@v4` target the deprecated Node 20 action runtime and are being forced onto Node 24. Project commands themselves ran under setup-node's Node `20.20.2`. This is release/tooling hygiene evidence, not proof of a product defect or of causality for any prior timing variance.
3. The committed identity record's provenance head is `30c49f690afb14683014e0a7c40c5c2093aaba2a`, while the exact tested implementation head is `ee7d79a286193de699e3dc049182492a6dbd5b1d`. The intervening changes are identity test/evidence/ordinary-CI wiring and do not alter the recorded shippable payload. The oracle explicitly reports `head-moved-payload-identical`. This is sufficient for A1's payload-versus-coordination distinction, but **not** a final exact-head release-candidate binding; `R7-A3` must independently bind the exact final clean candidate.
4. Exact current live ChatGPT and Claude insertion remain uncertified. Physical Android, Android WebView, Firefox-Android/GeckoView, real IME/browser-toolbar combinations, real assistive-technology mappings, and calibrated low-end-device performance remain uncertified.

## Verdict and Handoff

**R7-A1-BUILD-IDENTITY-ORACLE: PASS / SUBMITTED.**

The repository now has a machine-readable, falsifiable BUILD-IDENTITY oracle, explicit immutable payload identity, stable-versus-candidate channel separation, negative-mutant coverage, and exact current-head ordinary CI evidence. The next dependency-ready assignment is `R7-A2-DEPENDENCY-AUDIT`; it must identify and disposition the two lockfile-bound high-severity findings without blind upgrades and without changing publication state.
