#!/usr/bin/env bash
set -u

BRANCH='agent/8.8-repair-resume'
CANDIDATE='88b8b2a5ce31f6909e4efa5e90f5f1f723de45bc'
EVIDENCE='ce3f3cbec172903cd398aa2fd6730826f42036bd'
MODE="${1:-}"

fail() { echo "XA2X runner: $*" >&2; exit 1; }

claim_and_test() {
  set -euo pipefail
  test "${GITHUB_REF_NAME}" = "$BRANCH" || fail 'wrong branch'
  git fetch origin "$BRANCH"
  test "$(git rev-parse HEAD)" = "$(git rev-parse origin/$BRANCH)" || fail 'branch moved before XA2X claim'
  git merge-base --is-ancestor "$CANDIDATE" HEAD || fail 'candidate ancestry missing'
  git merge-base --is-ancestor "$EVIDENCE" HEAD || fail 'evidence ancestry missing'
  git diff --name-only "$CANDIDATE"..HEAD | tee /tmp/xa2x-descendants.txt
  if grep -Ev '^(\.gitl/|\.github/workflows/|\.github/xa2x-run\.sh$)' /tmp/xa2x-descendants.txt; then
    fail 'unexpected non-coordination descendant after XA2 candidate'
  fi

  node <<'NODE'
  const fs = require('fs');
  const state = JSON.parse(fs.readFileSync('.gitl/autopilot-state.json', 'utf8'));
  const plan = JSON.parse(fs.readFileSync('.gitl/orchestration/round-plan.json', 'utf8'));
  if (state.branch !== 'agent/8.8-repair-resume' || state.status !== 'active' || state.publishReady) throw new Error('state not eligible');
  if (state.lease && Date.parse(state.lease.expiresAt) > Date.now()) throw new Error(`valid conflicting lease ${state.lease.holder}`);
  const xa2 = plan.assignments.find(a => a.id === 'R6-XA2-CLAUDE-BLUE-PROTOTYPE');
  const xa2x = plan.assignments.find(a => a.id === 'R6-XA2X-CLAUDE-BLUE-PROTOTYPE-VERIFY');
  if (!xa2 || xa2.status !== 'blocked' || !xa2x || xa2x.status !== 'ready') throw new Error('XA2/XA2X plan changed');
NODE

  ACQUIRED=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
  EXPIRES=$(date -u -d '+45 minutes' +'%Y-%m-%dT%H:%M:%SZ')
  INSPECTED=$(git rev-parse HEAD)
  export ACQUIRED EXPIRES INSPECTED
  node <<'NODE'
  const fs = require('fs');
  const p = '.gitl/autopilot-state.json';
  const state = JSON.parse(fs.readFileSync(p, 'utf8'));
  const prior = state.lease;
  if (prior && Date.parse(prior.expiresAt) > Date.now()) throw new Error('lease became valid before claim');
  state.lease = {
    holder: `gha-r6-xa2x-${process.env.GITHUB_RUN_ID}`,
    assignmentId: 'R6-XA2X-CLAUDE-BLUE-PROTOTYPE-VERIFY',
    nominalWorker: 1,
    executedRole: 'successor-builder-test-verifier-with-supervisor-integrator-lens',
    acquiredAt: process.env.ACQUIRED,
    expiresAt: process.env.EXPIRES,
    inspectedHead: process.env.INSPECTED,
    recoveredExpiredLease: prior ? `${prior.holder}/${prior.assignmentId}/${prior.expiresAt}` : null,
    activeWorkCheck: 'Prior XA2 lease was expired; XA2 evidence was final; canonical plan had XA2 blocked/XA2X ready; branch was stable at registered-CI arm head.'
  };
  state.currentStep = 'R6-XA2X exact Claude Blue verification is active on a guarded registered-CI carrier after safe recovery of the expired XA2 handoff.';
  state.nextAction = 'Finish exact syntax/base/generated/lint/unit/focused-safety and Claude Blue Chromium+Firefox verification. Submit only on complete observable PASS; otherwise expose the smallest recovery.';
  state.automaticDispatch = {...(state.automaticDispatch||{}), enabled:true, scheduledFor:'active guarded carrier', nominalWorker:3, assignmentId:'R6-XA2X-CLAUDE-BLUE-PROTOTYPE-VERIFY', claimableByAnyEligibleWorker:true};
  state.researchFallback = {...(state.researchFallback||{}), temporarilyIneligible:true, reason:'XA2X exact verification is active; research may not compete.'};
  state.deliveryPressure = {...(state.deliveryPressure||{}), checkpointStatus:'claude-blue-exact-verification-active', researchOnlyWakesSinceLastProductTestPackageArtifact:0, researchFallbackTemporarilyIneligible:true, nextArtifactAssignment:'R6-XA2X-CLAUDE-BLUE-PROTOTYPE-VERIFY', lastDeliveryDecision:'Recover expired XA2 handoff and execute exact Claude Blue verification before research.'};
  fs.writeFileSync(p, JSON.stringify(state,null,2)+'\n');
NODE
  git config user.name 'github-actions[bot]'
  git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
  git add .gitl/autopilot-state.json
  git commit -m 'chore(gitl): claim XA2X exact verification lease'
  git push origin HEAD:"$BRANCH"
  TESTED_HEAD=$(git rev-parse HEAD)
  echo "TESTED_HEAD=$TESTED_HEAD" >> "$GITHUB_ENV"
  echo "CLAIMED_AT=$ACQUIRED" >> "$GITHUB_ENV"

  mkdir -p test-results/xa2x-carrier
  set +e
  npm ci 2>&1 | tee test-results/xa2x-carrier/npm-ci.log; DEPS=${PIPESTATUS[0]}
  node --check tests/e2e/claude-blue-prototype.spec.js 2>&1 | tee test-results/xa2x-carrier/spec-syntax.log; SPEC_SYNTAX=${PIPESTATUS[0]}
  npm run cert:base 2>&1 | tee test-results/xa2x-carrier/cert-base.log; BASE=${PIPESTATUS[0]}
  npm run lint 2>&1 | tee test-results/xa2x-carrier/lint.log; LINT=${PIPESTATUS[0]}
  npm run test:unit -- --runInBand 2>&1 | tee test-results/xa2x-carrier/unit.log; UNIT=${PIPESTATUS[0]}
  npx jest tests/sendtransaction.test.js tests/choice-state.test.js tests/repair-resume.test.js tests/tablock.test.js tests/sendsafety.test.js --runInBand 2>&1 | tee test-results/xa2x-carrier/focused-safety.log; FOCUSED=${PIPESTATUS[0]}
  npx playwright install --with-deps chromium firefox 2>&1 | tee test-results/xa2x-carrier/browser-install.log; BROWSERS=${PIPESTATUS[0]}
  npx playwright test tests/e2e/claude-blue-prototype.spec.js --project=chromium --project=firefox --output=test-results/xa2x-playwright 2>&1 | tee test-results/xa2x-carrier/claude-blue-playwright.log; BLUE=${PIPESTATUS[0]}
  set -e

  node - <<NODE
  const fs=require('fs');
  fs.writeFileSync('test-results/xa2x-carrier/gates.json', JSON.stringify({deps:$DEPS,specSyntax:$SPEC_SYNTAX,base:$BASE,lint:$LINT,unit:$UNIT,focused:$FOCUSED,browsers:$BROWSERS,blue:$BLUE},null,2)+'\n');
NODE
  exit 0
}

finalize() {
  set -euo pipefail
  test -n "${TESTED_HEAD:-}" || fail 'no tested head from lease-claim step'
  test -f test-results/xa2x-carrier/gates.json || fail 'missing gate ledger'
  git fetch origin "$BRANCH"
  test "$(git rev-parse origin/$BRANCH)" = "$TESTED_HEAD" || fail 'branch changed during XA2X lease; refusing competing handoff'

  eval "$(node - <<'NODE'
  const g=require('./test-results/xa2x-carrier/gates.json');
  for (const [k,v] of Object.entries(g)) console.log(`${k.toUpperCase()}=${Number(v)}`);
NODE
)"
  UPLOAD_CODE="${UPLOAD_CODE:-1}"
  RESULT=PASS
  for code in "$DEPS" "$SPECSYNTAX" "$BASE" "$LINT" "$UNIT" "$FOCUSED" "$BROWSERS" "$BLUE" "$UPLOAD_CODE"; do
    [ "$code" -eq 0 ] || RESULT=FAIL
  done

  API="https://api.github.com/repos/${GITHUB_REPOSITORY}"
  AUTH="Authorization: Bearer ${GH_TOKEN}"
  ARTIFACT_NAME="r6-xa2x-${GITHUB_RUN_ID}"
  JOB_ID=''; ARTIFACT_ID=''; ARTIFACT_DIGEST=''
  for i in 1 2 3 4 5 6 7 8; do
    JOB_JSON=$(curl -fsSL -H "$AUTH" -H 'X-GitHub-Api-Version: 2022-11-28' "$API/actions/runs/${GITHUB_RUN_ID}/jobs") || JOB_JSON='{}'
    JOB_ID=$(printf '%s' "$JOB_JSON" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);const x=(j.jobs||[]).find(v=>v.name==='XA2X Claude Blue Exact Verification');process.stdout.write(x?String(x.id):'')}catch{}})")
    ART_JSON=$(curl -fsSL -H "$AUTH" -H 'X-GitHub-Api-Version: 2022-11-28' "$API/actions/runs/${GITHUB_RUN_ID}/artifacts") || ART_JSON='{}'
    ARTIFACT_ID=$(printf '%s' "$ART_JSON" | ART_NAME="$ARTIFACT_NAME" node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);const x=(j.artifacts||[]).find(v=>v.name===process.env.ART_NAME);process.stdout.write(x?String(x.id):'')}catch{}})")
    ARTIFACT_DIGEST=$(printf '%s' "$ART_JSON" | ART_NAME="$ARTIFACT_NAME" node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);const x=(j.artifacts||[]).find(v=>v.name===process.env.ART_NAME);process.stdout.write(x&&x.digest?String(x.digest):'')}catch{}})")
    [ -n "$JOB_ID" ] && [ -n "$ARTIFACT_ID" ] && break
    sleep 2
  done
  if [ -z "$JOB_ID" ] || [ -z "$ARTIFACT_ID" ]; then RESULT=FAIL; fi

  FINISHED=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
  export RESULT FINISHED JOB_ID ARTIFACT_ID ARTIFACT_DIGEST ARTIFACT_NAME DEPS SPECSYNTAX BASE LINT UNIT FOCUSED BROWSERS BLUE UPLOAD_CODE
  mkdir -p .gitl/evidence/round-6
  cat > .gitl/evidence/round-6/xa2x-claude-blue-carrier-result.md <<EOF
# Round 6 XA2X Claude Blue Exact-Repository Carrier Result

- Result: **${RESULT}**
- Exact tested head: \`${TESTED_HEAD}\`
- Required XA2 candidate ancestor: \`${CANDIDATE}\`
- Required XA2 evidence ancestor: \`${EVIDENCE}\`
- GitHub Actions run ID: \`${GITHUB_RUN_ID}\`
- Job ID: \`${JOB_ID:-UNKNOWN}\`
- Artifact ID: \`${ARTIFACT_ID:-UNKNOWN}\`
- Artifact name: \`${ARTIFACT_NAME}\`
- Artifact digest: \`${ARTIFACT_DIGEST:-UNKNOWN}\`
- npm ci exit: \`${DEPS}\`
- Claude Blue spec syntax exit: \`${SPECSYNTAX}\`
- cert:base/generated parity exit: \`${BASE}\`
- repository lint exit: \`${LINT}\`
- full unit suite exit: \`${UNIT}\`
- focused Send/CHOICE/route/lease/uncertainty exit: \`${FOCUSED}\`
- browser install exit: \`${BROWSERS}\`
- Claude Blue Chromium+Firefox matrix exit: \`${BLUE}\`
- artifact upload exit: \`${UPLOAD_CODE}\`

The carrier preserves the fixture-only/live-uncertified boundary and changes no production source.
EOF

  cat > .gitl/evidence/round-6/claude-blue-prototype-verify.md <<EOF
# Ghost Worker Evidence — R6 XA2X Claude Blue Prototype Verification

## Identity
- Round: 6
- Nominal worker: 1
- Executed role: successor builder-test verifier with supervisor-integrator dissent lens
- Executed by: \`gha-r6-xa2x-${GITHUB_RUN_ID}\`
- Assignment: \`R6-XA2X-CLAUDE-BLUE-PROTOTYPE-VERIFY\`
- Lease claimed: \`${CLAIMED_AT}\`
- Finished: \`${FINISHED}\`
- Exact tested head: \`${TESTED_HEAD}\`

## State Read
The predecessor XA2 lease was expired, XA2 bounded build evidence was final, and canonical plan had already advanced XA2 to blocked with XA2X ready. Stable-head checks passed before claim. R4/R5 bounded acceptance and live-host UNKNOWN limits remain unchanged.

## Step Performed
Executed the predeclared exact-head repository verification matrix. No research fallback and no live Claude activation occurred.

## Tests
- npm ci: **$([ "$DEPS" -eq 0 ] && echo PASS || echo FAIL)**
- Claude Blue spec syntax: **$([ "$SPECSYNTAX" -eq 0 ] && echo PASS || echo FAIL)**
- cert:base/generated parity: **$([ "$BASE" -eq 0 ] && echo PASS || echo FAIL)**
- repository lint: **$([ "$LINT" -eq 0 ] && echo PASS || echo FAIL)**
- full unit suite: **$([ "$UNIT" -eq 0 ] && echo PASS || echo FAIL)**
- focused Send/CHOICE/route/lease/uncertainty: **$([ "$FOCUSED" -eq 0 ] && echo PASS || echo FAIL)**
- Chromium+Firefox installation: **$([ "$BROWSERS" -eq 0 ] && echo PASS || echo FAIL)**
- Claude Blue Chromium+Firefox: **$([ "$BLUE" -eq 0 ] && echo PASS || echo FAIL)**
- Run/job/artifact: \`${GITHUB_RUN_ID}\` / \`${JOB_ID:-UNKNOWN}\` / \`${ARTIFACT_ID:-UNKNOWN}\`
- Artifact digest: \`${ARTIFACT_DIGEST:-UNKNOWN}\`

## Acceptance Criteria
- Observable exact-head carrier: **${RESULT}**
- Exact run/job/artifact binding: **$([ -n "$JOB_ID" ] && [ -n "$ARTIFACT_ID" ] && echo PASS || echo FAIL)**
- Live Claude structure: **UNKNOWN / NOT CLAIMED**
- Live ChatGPT structure: **UNKNOWN / NOT CLAIMED**

## Safety Checks
Send authority, CHOICE, route, lease, uncertainty, and rail fail-closed behavior were not weakened. No main/merge/auto-merge/tag/publish/release action occurred.

## Risks and Limits
Deterministic fixture evidence is not live-site certification. Physical Android/WebView/GeckoView, real IME/AT, calibrated hardware, and current live ChatGPT/Claude insertion remain uncertified. Existing npm audit findings remain for final dependency review; no blanket upgrade was performed.

## Recommended Next Action
$([ "$RESULT" = PASS ] && echo 'Execute R6-XA3-CROSS-ADAPTER-REDTEAM immediately; research remains ineligible.' || echo 'Execute R6-XA2Y-CLAUDE-BLUE-VERIFICATION-RECOVERY and make only the smallest candidate-or-carrier repair from the exact failed gate/log.')

## Assignment Status
- **$([ "$RESULT" = PASS ] && echo submitted || echo blocked)**
EOF

  node <<'NODE'
  const fs=require('fs');
  const result=process.env.RESULT, pass=result==='PASS';
  const run=Number(process.env.GITHUB_RUN_ID), job=process.env.JOB_ID?Number(process.env.JOB_ID):null, artifact=process.env.ARTIFACT_ID?Number(process.env.ARTIFACT_ID):null;
  const testedHead=process.env.TESTED_HEAD, finished=process.env.FINISHED;
  const summary=`deps=${process.env.DEPS}, syntax=${process.env.SPECSYNTAX}, base=${process.env.BASE}, lint=${process.env.LINT}, unit=${process.env.UNIT}, focused=${process.env.FOCUSED}, browsers=${process.env.BROWSERS}, blue=${process.env.BLUE}, upload=${process.env.UPLOAD_CODE}`;
  const pp='.gitl/orchestration/round-plan.json', plan=JSON.parse(fs.readFileSync(pp,'utf8'));
  const xa2=plan.assignments.find(a=>a.id==='R6-XA2-CLAUDE-BLUE-PROTOTYPE');
  const xa2x=plan.assignments.find(a=>a.id==='R6-XA2X-CLAUDE-BLUE-PROTOTYPE-VERIFY');
  const xa3=plan.assignments.find(a=>a.id==='R6-XA3-CROSS-ADAPTER-REDTEAM');
  Object.assign(xa2x,{executedBy:`gha-r6-xa2x-${run}`,testedHead,runId:run,jobId:job,artifactId:artifact,artifactDigest:process.env.ARTIFACT_DIGEST||null,evidencePath:'.gitl/evidence/round-6/claude-blue-prototype-verify.md'});
  if(pass){
    xa2.status='submitted'; delete xa2.blockedReason; xa2.verificationEvidence='.gitl/evidence/round-6/claude-blue-prototype-verify.md'; xa2x.status='submitted'; xa3.status='ready';
    plan.dispatch={...(plan.dispatch||{}),nextWake:'earliest eligible wake',nominalWorker:4,assignmentId:'R6-XA3-CROSS-ADAPTER-REDTEAM',automatic:true,claimableByAnyEligibleWorker:true,instruction:'Red-Team ChatGPT and Claude deterministic specialized-first runners before mobile/performance work.'};
    plan.deliveryPressure={...(plan.deliveryPressure||{}),checkpointStatus:'claude-blue-verified-cross-adapter-redteam-ready',researchOnlyWakesSinceLastProductTestPackageArtifact:0,researchFallbackTemporarilyIneligible:true,checkpointDecision:`XA2X exact run ${run} passed; advance directly to XA3.`};
  } else {
    xa2.status='blocked'; xa2x.status='blocked'; xa2x.blockedReason=`XA2X run ${run} failed required gate(s): ${summary}`;
    const id='R6-XA2Y-CLAUDE-BLUE-VERIFICATION-RECOVERY'; let r=plan.assignments.find(a=>a.id===id);
    if(!r){r={id,worker:3,claimableByAnyEligibleWorker:true,intendedRole:'builder-test-verifier',status:'ready',program:'MOBILE-SHELL-STRUCTURAL',goal:'Use exact XA2X logs to classify candidate versus carrier failure and make only the smallest repair, then rerun XA2X.',dependencies:['R6-XA2X-CLAUDE-BLUE-PROTOTYPE-VERIFY:blocked'],allowedFiles:['tests/**','.github/workflows/**','.gitl/evidence/round-6/**','.gitl/orchestration/round-plan.json','.gitl/autopilot-state.json'],prohibitedActions:['live Claude activation','weakening Send/CHOICE/route/lease/uncertainty','weakening demotion/clipping/exact identity','main/merge/auto-merge/tag/release/publish'],acceptanceCriteria:['classify exact failed gate','smallest repair only','rerun exact XA2X matrix','record exact head/run/job/artifact'],requiredTests:['failed gate','full XA2X matrix'],fallbackWork:'Infrastructure-only failure repairs only the carrier.',evidencePath:'.gitl/evidence/round-6/claude-blue-prototype-verify-recovery.md'};plan.assignments.push(r)}else r.status='ready';
    plan.dispatch={...(plan.dispatch||{}),nextWake:'earliest eligible wake',nominalWorker:3,assignmentId:id,automatic:true,claimableByAnyEligibleWorker:true,instruction:'Perform smallest exact-gate XA2Y recovery; do not research.'};
    plan.deliveryPressure={...(plan.deliveryPressure||{}),checkpointStatus:'claude-blue-exact-verification-failed-recovery-ready',researchOnlyWakesSinceLastProductTestPackageArtifact:0,researchFallbackTemporarilyIneligible:true,checkpointDecision:`XA2X run ${run} failed a concrete gate; execute XA2Y before research.`};
  }
  fs.writeFileSync(pp,JSON.stringify(plan,null,2)+'\n');

  const sp='.gitl/autopilot-state.json', state=JSON.parse(fs.readFileSync(sp,'utf8'));
  state.currentStep=pass?`R6-XA2X exact run ${run} passed. XA2/XA2X submitted at deterministic fixture scope; R6-XA3-CROSS-ADAPTER-REDTEAM ready. Live Claude/ChatGPT structural insertion remains UNKNOWN.`:`R6-XA2X run ${run} exposed concrete failed gate(s): ${summary}. XA2/XA2X blocked; XA2Y recovery ready.`;
  state.nextAction=pass?'Execute R6-XA3-CROSS-ADAPTER-REDTEAM before any research.':'Execute R6-XA2Y-CLAUDE-BLUE-VERIFICATION-RECOVERY before any research.';
  state.automaticDispatch={...(state.automaticDispatch||{}),enabled:true,scheduledFor:'next eligible wake',nominalWorker:pass?4:3,assignmentId:pass?'R6-XA3-CROSS-ADAPTER-REDTEAM':'R6-XA2Y-CLAUDE-BLUE-VERIFICATION-RECOVERY',claimableByAnyEligibleWorker:true};
  state.researchFallback={...(state.researchFallback||{}),temporarilyIneligible:true,reason:pass?'XA3 is executable; research may not compete.':'XA2Y recovery is executable; research may not compete.'};
  state.deliveryPressure={...(state.deliveryPressure||{}),checkpointStatus:pass?'claude-blue-verified-cross-adapter-redteam-ready':'claude-blue-exact-verification-failed-recovery-ready',researchOnlyWakesSinceLastProductTestPackageArtifact:0,researchFallbackTemporarilyIneligible:true,nextArtifactAssignment:pass?'R6-XA3-CROSS-ADAPTER-REDTEAM':'R6-XA2Y-CLAUDE-BLUE-VERIFICATION-RECOVERY',lastTestableArtifactAt:finished,lastDeliveryDecision:pass?`XA2X run ${run} passed; advance to XA3.`:`XA2X run ${run} exposed a concrete failure; execute XA2Y.`,evidence:'.gitl/evidence/round-6/claude-blue-prototype-verify.md'};
  state.programStatus={...(state.programStatus||{}),'MOBILE-SHELL-STRUCTURAL':pass?'active-cross-adapter-claude-blue-verified-redteam-ready-live-certification-pending':'active-cross-adapter-claude-blue-verification-failed-recovery-ready-live-certification-pending'};
  state.completedSteps=state.completedSteps||[]; const type=pass?'round-6-xa2x-claude-blue-exact-pass':'round-6-xa2x-claude-blue-exact-failure';
  if(!state.completedSteps.some(x=>x.type===type&&String(x.result||'').includes(String(run)))) state.completedSteps.push({type,result:pass?`XA2X run ${run}/job ${job}/artifact ${artifact} passed exact repository gates on ${testedHead}; live-host claims remain UNKNOWN.`:`XA2X run ${run}/job ${job||'UNKNOWN'}/artifact ${artifact||'UNKNOWN'} failed required gate(s): ${summary}.`});
  state.findings=state.findings||[]; const ft=pass?'claude-xa2-deterministic-blue-exact-pass':'claude-xa2-exact-verification-failure';
  if(!state.findings.some(x=>x.type===ft&&String(x.finding||'').includes(String(run)))) state.findings.push({worker:1,type:ft,finding:pass?`Claude Blue fixture-gated specialized runner passed exact repository verification on run ${run}; specialized->standard->rail, exact Send, and fail-closed scope preserved. Live Claude remains uncertified.`:`XA2X run ${run} exposed a concrete verification failure (${summary}); no PASS inferred and XA2Y is ready.`});
  state.testEvidence=state.testEvidence||[]; for(const p of ['.gitl/evidence/round-6/claude-blue-prototype.md','.gitl/evidence/round-6/claude-blue-prototype-verify.md','.gitl/evidence/round-6/xa2x-claude-blue-carrier-result.md']) if(!state.testEvidence.includes(p)) state.testEvidence.push(p);
  state.verificationSummary={...(state.verificationSummary||{}),verdict:pass?'claude-blue-deterministic-exact-verified-cross-adapter-redteam-ready-live-certification-pending':'claude-blue-exact-verification-failed-recovery-ready-live-certification-pending',nextAssignment:pass?'R6-XA3-CROSS-ADAPTER-REDTEAM':'R6-XA2Y-CLAUDE-BLUE-VERIFICATION-RECOVERY',xa2ClaudeStatus:pass?'submitted-exact-repository-verified':'blocked-exact-verification-failed',xa2ClaudeCandidateCommit:'88b8b2a5ce31f6909e4efa5e90f5f1f723de45bc',xa2ClaudeEvidenceCommit:'ce3f3cbec172903cd398aa2fd6730826f42036bd',xa2ClaudeTestedHead:testedHead,xa2ClaudeRun:run,xa2ClaudeJob:job,xa2ClaudeArtifact:artifact,xa2ClaudeArtifactDigest:process.env.ARTIFACT_DIGEST||null,xa2ClaudeGateOutcomes:summary,xa2ClaudeLiveStructure:'UNKNOWN-NOT-OBTAINED'};
  state.lease=null;
  fs.writeFileSync(sp,JSON.stringify(state,null,2)+'\n');
NODE

  git checkout "${GITHUB_SHA}^" -- .github/workflows/test.yml
  git rm -f .github/xa2x-run.sh .github/workflows/r6-xa2x-claude-blue-verify.yml .gitl/evidence/round-6/xa2x-claude-blue-trigger.md || true
  git add .github/workflows/test.yml .gitl/autopilot-state.json .gitl/orchestration/round-plan.json .gitl/evidence/round-6/claude-blue-prototype-verify.md .gitl/evidence/round-6/xa2x-claude-blue-carrier-result.md
  git commit -m "test(gitl): record XA2X Claude Blue exact verification ${RESULT,,}"
  git push origin HEAD:"$BRANCH"
  [ "$RESULT" = PASS ] || exit 1
}

case "$MODE" in
  test) claim_and_test ;;
  finalize) finalize ;;
  *) fail 'mode must be test or finalize' ;;
esac
