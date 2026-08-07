const fs = require('fs');

const statePath = '.gitl/autopilot-state.json';
const planPath = '.gitl/orchestration/round-plan.json';
const workflowPath = '.github/workflows/r5-a1-handoff.yml';
const selfPath = 'scripts/test-r5-a1-handoff.cjs';
const evidencePath = '.gitl/evidence/round-5/worker-2.md';

const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJson = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');

const state = readJson(statePath);
const plan = readJson(planPath);

if (state.branch !== 'agent/8.8-repair-resume') throw new Error(`unexpected branch in state: ${state.branch}`);
if (state.status !== 'active' || state.round !== 5) throw new Error(`unexpected state: ${state.status} round ${state.round}`);
if (!state.lease || state.lease.holder !== 'scheduled-agent-2-longchat-baseline' || state.lease.assignmentId !== 'R5-A1-LONGCHAT-BASELINE') {
  throw new Error('R5-A1 lease is not owned by this handoff');
}
if (!fs.existsSync(evidencePath)) throw new Error('worker-2 evidence missing');

const a1 = plan.assignments.find(a => a.id === 'R5-A1-LONGCHAT-BASELINE');
const a2 = plan.assignments.find(a => a.id === 'R5-A2-LONGCHAT-BUILD');
if (!a1 || !a2) throw new Error('Round-5 A1/A2 assignments missing');
if (!['ready', 'retry-ready', 'in-progress'].includes(a1.status)) throw new Error(`unexpected A1 status: ${a1.status}`);
if (a2.status !== 'waiting') throw new Error(`unexpected A2 status: ${a2.status}`);

a1.status = 'submitted';
a1.executedBy = 'scheduled-agent-2-longchat-baseline';
a1.testedHead = '747031cc8160ba6febdd6fecb03d597fae36cd66';
a1.runId = 31165679128;
a1.jobId = 92825797473;
a1.artifactId = 8988876017;
a1.conclusion = 'Exact deterministic 180/500/1000/2000-turn Chromium baseline passed. Full-document assistant-match enumeration scales approximately linearly with retained history; no Send-adjacent events occurred. A2 should falsify a stateless grouped-selector tail collector before considering persistent observer state.';
a2.status = 'ready';
a2.activationReason = 'A1 exact baseline submitted with deterministic scaling evidence and a predeclared grouped-selector falsification criterion.';

state.completedWorkers = Array.from(new Set([...(state.completedWorkers || []), 2])).sort((a, b) => a - b);
state.currentStep = 'R5-A1-LONGCHAT-BASELINE exact-head Chromium evidence passed at head 747031cc8160ba6febdd6fecb03d597fae36cd66 (run 31165679128/job 92825797473/artifact 8988876017). Across 180/500/1000/2000 assistant turns, answer-selection full-document query matches scaled from 543 to 6003 per sample while p95 rose 0.70ms to 2.30ms; begin-Send p95 rose 0.90ms to 3.70ms and Send-evidence p95 1.00ms to 3.80ms. Newest-answer correctness and zero Send-adjacent actuation held. A1 selected a stateless grouped-selector tail collector as the smallest next falsifiable implementation, not a persistent observer/cache.';
state.nextAction = 'The next eligible wake claims R5-A2-LONGCHAT-BUILD regardless of nominal timer number. Implement only the semantics-preserving grouped-selector tail collector proposed by Worker 2, preserve lowest selectorIndex/fallback behavior and all Send/CHOICE/route/lease/uncertainty safeguards, then rerun the exact long-chat benchmark plus generated parity/unit/browser gates. Reject the change if it fails the predeclared query-work/correctness criteria; do not weaken assertions.';
state.headAtLastHandoff = process.env.GITHUB_SHA || state.headAtLastHandoff;
state.automaticDispatch = {
  ...(state.automaticDispatch || {}),
  enabled: true,
  scheduledFor: 'next eligible wake',
  nominalWorker: 3,
  assignmentId: 'R5-A2-LONGCHAT-BUILD',
  claimableByAnyEligibleWorker: true
};
state.lease = null;
state.blockedReason = null;
state.testEvidence = Array.from(new Set([...(state.testEvidence || []), evidencePath]));
state.completedSteps = [
  ...(state.completedSteps || []),
  {
    type: 'round-5-a1-longchat-baseline',
    result: 'Exact head 747031cc8160ba6febdd6fecb03d597fae36cd66 passed run 31165679128/job 92825797473. The 180/500/1000/2000-turn fixture preserved newest-answer and zero-actuation correctness while answer qSA returned-match work scaled 543 -> 6003 per sample. Artifact 8988876017 SHA-256 167fdef0bdfbb06a9f84f6a9a41bd3c4839ede6b0fa1bf698f87a933d9311952. R5-A2 activated for a grouped-selector tail-collector falsification.'
  }
];
state.findings = [
  ...(state.findings || []),
  {
    worker: 2,
    type: 'long-chat-linear-selector-enumeration',
    finding: 'Exact A1 measurement shows current ChatGPT answer selection performs 3 full-document assistant selector queries whose returned matches grow approximately linearly with retained history: 543/sample at 180 turns and 6003/sample at 2000 turns (11.06x). _beginSendAttempt and _sendEvidence each duplicate the expensive assistant-match enumeration. This is a measured Ghost hot path, not proof it dominates total host-page latency.'
  },
  {
    worker: 2,
    type: 'long-chat-minimal-falsifiable-repair',
    finding: 'A2 should first attempt a stateless grouped-selector tail collector that preserves per-selector last-48 semantics and selector priority while reducing full-document qSA returned-match work by at least 60% at 2000 turns. Persistent MutationObserver/cache state remains the competing fallback if the minimalist repair is falsified.'
  }
];
state.verificationSummary = {
  ...(state.verificationSummary || {}),
  round: 5,
  program: 'LONG-CHAT-PERF',
  verdict: 'in-progress',
  baselineAssignment: 'R5-A1-LONGCHAT-BASELINE',
  baselineEvidence: evidencePath,
  baselineTestedHead: '747031cc8160ba6febdd6fecb03d597fae36cd66',
  baselineRunId: 31165679128,
  baselineJobId: 92825797473,
  baselineArtifactId: 8988876017,
  nextAssignment: 'R5-A2-LONGCHAT-BUILD',
  performanceWinner: 'UNKNOWN until A2 grouped-selector implementation is measured against the A1 baseline'
};

writeJson(planPath, plan);
writeJson(statePath, state);

for (const p of [workflowPath, selfPath]) {
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

console.log('R5-A1 handoff prepared: A1 submitted, A2 ready, lease released, temporary handoff files removed.');
