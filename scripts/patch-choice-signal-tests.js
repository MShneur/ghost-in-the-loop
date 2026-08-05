'use strict';

const fs = require('fs');
const path = require('path');

const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '..');
const file = path.join(root, 'tests', 'signal.test.js');
let source = fs.readFileSync(file, 'utf8');

function replaceOnce(before, after, label) {
  if (source.includes(after)) return;
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one marker, found ${count}`);
  source = source.replace(before, after);
}

replaceOnce(
`  test('fuzzy proceed: "shall i continue" contributes but needs threshold', () => {
    // Fuzzy alone scores 2, threshold is 3 — returns none without another signal
    const r = detectSignal(longPrefix + ' shall i continue');
    expect(['proceed', 'none']).toContain(r.signal);
    // Combined with sigil it crosses threshold
    const r2 = detectSignal(longPrefix + ' [[GITL::PROCEED]] shall i continue');
    expect(r2.signal).toBe('proceed');
  });`,
`  test('user-decision question enters CHOICE and beats a proceed cue', () => {
    const r = detectSignal(longPrefix + ' shall i continue');
    expect(r.signal).toBe('choice');
    const r2 = detectSignal(longPrefix + ' [[GITL::PROCEED]] shall i continue');
    expect(r2.signal).toBe('choice');
  });`,
  'fuzzy proceed contract'
);

replaceOnce(
`  test('combined sigil + fuzzy boosts confidence', () => {
    const combined = detectSignal(longPrefix + ' [[GITL::PROCEED]] shall i continue');
    const single   = detectSignal(longPrefix + ' [[GITL::PROCEED]]');
    expect(combined.confidence).toBeGreaterThan(single.confidence);
  });`,
`  test('explicit CHOICE marker is stronger than a fuzzy choice request', () => {
    const fuzzy = detectSignal(longPrefix + ' shall i continue');
    const explicit = detectSignal(longPrefix + ' [[GITL::CHOICE]]');
    expect(fuzzy.signal).toBe('choice');
    expect(explicit.signal).toBe('choice');
    expect(explicit.confidence).toBeGreaterThan(fuzzy.confidence);
  });`,
  'confidence contract'
);

fs.writeFileSync(file, source, 'utf8');
console.log('Aligned signal tests with the explicit CHOICE safety contract.');
