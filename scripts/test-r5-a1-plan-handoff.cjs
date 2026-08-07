const fs = require('fs');
const planPath = '.gitl/orchestration/round-plan.json';
const statePath = '.gitl/autopilot-state.json';
const workflowPath = '.github/workflows/r5-a1-plan-handoff.yml';
const selfPath = 'scripts/test-r5-a1-plan-handoff.cjs';
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const a1 = plan.assignments.find(a => a.id === 'R5-A1-LONGCHAT-BASELINE');
const a2 = plan.assignments.find(a => a.id === 'R5-A2-LONGCHAT-BUILD');
if (state.lease !== null) throw new Error('coordination repair refused: a new lease is active');
if (!a1 || a1.status !== 'submitted') throw new Error('coordination repair refused: A1 is not submitted');
if (!a2 || a2.status !== 'ready') throw new Error('coordination repair refused: A2 is not ready');
plan.dispatch = {
  nextWake: 'earliest eligible wake',
  nominalWorker: 3,
  assignmentId: 'R5-A2-LONGCHAT-BUILD',
  automatic: true,
  claimableByAnyEligibleWorker: true,
  instruction: 'Claim R5-A2-LONGCHAT-BUILD regardless of timer number. Implement and falsify only the A1-selected grouped-selector tail collector before escalating to a persistent observer/cache.'
};
fs.writeFileSync(planPath, JSON.stringify(plan, null, 2) + '\n');
for (const p of [workflowPath, selfPath]) if (fs.existsSync(p)) fs.unlinkSync(p);
console.log('Round-5 dispatch repaired: A2 is the sole earliest-ready build assignment.');
