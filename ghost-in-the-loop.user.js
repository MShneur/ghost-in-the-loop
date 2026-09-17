// ==UserScript==
// @name         Ghost in the Loop
// @namespace    https://github.com/MShneur/ghost-in-the-loop
// @version      9.0.0-alpha.2
// @description  Perpetual Play + truthful Export. External protocol activators. No controller-side reasoning.
// @author       Michael S (CTRL-AI)
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://www.perplexity.ai/*
// @match        https://gemini.google.com/*
// @match        https://claude.ai/*
// @match        https://grok.com/*
// @match        https://chat.deepseek.com/*
// @match        https://copilot.microsoft.com/*
// @match        https://chat.mistral.ai/*
// @match        https://kimi.com/*
// @match        https://www.kimi.com/*
// @match        https://chat.qwen.ai/*
// @match        https://poe.com/*
// @match        https://duck.ai/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_setClipboard
// @grant        GM_notification
// @run-at       document-idle
// @noframes
// @license      AGPL-3.0
// ==/UserScript==

(() => {
'use strict';
if (window.__GITL_V9__ === true) return;
if (window.__GITL_V9_BOOTING__ && Date.now() - window.__GITL_V9_BOOTING__ < 15000) return;
window.__GITL_V9_BOOTING__ = Date.now();

const VER = '9.0.0-alpha.2';
const TICK_MS = 1000;
const VALID_QUIET_MS = 1400;
const DRIFT_QUIET_MS = 9000;
const WRITE_VERIFY_MS = 1800;
const SEND_WAIT_MS = 2200;
const SEND_CONFIRM_MS = 16000;
const STALL_SOFT_MS = 5 * 60 * 1000;
const STALL_GRACE_MS = 2 * 60 * 1000;
const STOP_CONFIRM_MS = 5000;
const STOP_RETRY_DELAY_MS = 1500;
const STOP_MAX_ATTEMPTS = 3;
const TOP_MAX_PASSES = 24;
const TOP_WAIT_MS = 500;
const TOP_STABLE_PASSES = 2;

const G = Object.freeze({
  proceed: '[[GITL::PROCEED]]',
  human: '[[GITL::HUMAN]]',
  halt: '[[GITL::HALT]]'
});
const A = Object.freeze({
  proceed: '[[AOA::CONTINUE]]',
  human: '[[AOA::HUMAN]]',
  halt: '[[AOA::HALT]]'
});

const AOA_BRANCH = 'feature/plex-universal-model-relay';
const ACT = Object.freeze({
  plex: ['PLEX', `https://raw.githubusercontent.com/MShneur/Agents-of-AI/${AOA_BRANCH}/modes/plex.md`],
  relay: ['Model Relay', `https://raw.githubusercontent.com/MShneur/Agents-of-AI/${AOA_BRANCH}/workflows/model-relay.md`],
  human: ['Human Gate', 'https://raw.githubusercontent.com/MShneur/Agents-of-AI/main/workflows/human-gate-committee.md'],
  cleanerz: ['Cleanerz', 'https://raw.githubusercontent.com/MShneur/Agents-of-AI/main/workflows/cleanerz.md'],
  quorum: ['Quorum', 'https://raw.githubusercontent.com/MShneur/Agents-of-AI/main/workflows/quorum.md'],
  ctrl: ['CTRL-AI', 'https://raw.githubusercontent.com/MShneur/CTRL-AI/main/llms-full.txt'],
  rduck: ['R-Duck', 'https://raw.githubusercontent.com/MShneur/R-Duck/main/AGENTS.md']
});

const PROFILES = [
  {
    id: 'perplexity',
    host: /perplexity\.ai$/i,
    input: ['#ask-input[contenteditable="true"][data-lexical-editor="true"]', '#ask-input[contenteditable="true"]'],
    send: ['button[aria-label="Submit"]'],
    stop: ['button[aria-label="Stop"]', 'button[aria-label*="Stop response" i]', '[data-testid="stop-button"]'],
    user: ['.group\\/user-bubble'],
    assistant: ['[data-workflow-final-text]']
  },
  {
    id: 'chatgpt',
    host: /chatgpt\.com$|chat\.openai\.com$/i,
    input: ['#prompt-textarea', 'textarea[data-id="root"]'],
    send: ['#composer-submit-button', 'button[data-testid="send-button"]', 'button[aria-label="Send prompt"]', 'button[aria-label="Send message"]'],
    stop: ['button[data-testid="stop-button"]', 'button[aria-label="Stop generating"]', 'button[aria-label="Stop streaming"]'],
    user: ['[data-message-author-role="user"]'],
    assistant: ['[data-message-author-role="assistant"]']
  },
  {
    id: 'generic',
    host: /.*/,
    input: ['div[contenteditable="true"][role="textbox"]', 'textarea[placeholder]', 'textarea'],
    send: ['button[aria-label*="Send" i]', 'button[aria-label="Submit"]', 'button[type="submit"]'],
    stop: ['button[aria-label*="Stop" i]', '[data-testid*="stop" i]'],
    user: ['[data-message-author-role="user"]', '[data-role="user"]'],
    assistant: ['[data-message-author-role="assistant"]', '[data-role="assistant"]']
  }
];
const HOST = PROFILES.find(p => p.host.test(location.hostname)) || PROFILES[2];

const S = {
  mode: 'IDLE', detail: 'Ready', round: 0,
  max: Math.max(1, Math.min(100, Number(GM_getValue('v9.max', 25)) || 25)),
  sending: false, uncertain: false, lastHandled: '', awaitingFrom: '', stableHash: '', stableSince: 0,
  drift: 0, bootstrapped: false, relay: '', timer: null,
  generationStartedAt: 0, lastProgressAt: 0, lastProgressFingerprint: '',
  stallState: 'IDLE', stopAttempts: 0, recoveryCount: 0, watchdogBusy: false,
  topBusy: false,
  tab: String(GM_getValue('v9.tab', 'play') || 'play'), events: [], lastError: null
};
const ON = {};
for (const key of Object.keys(ACT)) ON[key] = !!GM_getValue(`v9.act.${key}`, false);
let custom = String(GM_getValue('v9.custom', '') || '');

let _ttPolicy = null;
try { if (window.trustedTypes?.createPolicy) _ttPolicy = window.trustedTypes.createPolicy('gitl9-ui', { createHTML: s => s }); } catch (_) {}
const trustedHTML = s => _ttPolicy ? _ttPolicy.createHTML(s) : s;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const now = () => Date.now();
const displayText = value => String(value ?? '').replace(/\u00a0/g, ' ').replace(/\r/g, '').trim();
const semanticText = value => displayText(value).replace(/\s+/g, ' ').trim();
const visible = el => !!el && el.isConnected && !el.disabled && el.getAttribute('aria-disabled') !== 'true' && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);

function queryFirst(selectors, root = document, requireVisible = true) {
  for (const selector of selectors || []) {
    try {
      const nodes = [...root.querySelectorAll(selector)];
      const el = requireVisible ? nodes.find(visible) : nodes[0];
      if (el) return el;
    } catch (_) {}
  }
  return null;
}
function queryAll(selectors) {
  const out = [], seen = new Set();
  for (const selector of selectors || []) {
    try {
      for (const el of document.querySelectorAll(selector)) {
        if (!seen.has(el)) { seen.add(el); out.push(el); }
      }
    } catch (_) {}
  }
  return out;
}
function composer() { return queryFirst(HOST.input); }
function nodeText(el) { return displayText(el?.innerText ?? el?.textContent ?? el?.value ?? ''); }
function assistantText() {
  const nodes = queryAll(HOST.assistant).filter(el => el.isConnected && nodeText(el));
  return nodes.length ? nodeText(nodes[nodes.length - 1]) : '';
}
function userCount() { return queryAll(HOST.user).filter(el => el.isConnected).length; }
function generating() { return !!queryFirst(HOST.stop); }
function visibleStopButtons() { return queryAll(HOST.stop).filter(visible); }
function hash(value) {
  const s = String(value || ''); let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return `${s.length}:${(h >>> 0).toString(16)}`;
}
function finalLine(text) {
  const lines = String(text || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  return lines.length ? lines[lines.length - 1] : '';
}
function terminalCandidate(text) {
  const source = String(text || '').trim();
  const line = finalLine(source);
  const exact = [G.proceed, G.human, G.halt, A.proceed, A.human, A.halt];
  if (exact.includes(line) || /^\[\[AOA::RELAY:([^\]\r\n]{1,80})\]\]$/.test(line)) {
    return { raw: line || '(empty)', normalized: false };
  }
  const suffix = source.match(/(?:^|\s)(\[\[(?:GITL::(?:PROCEED|HUMAN|HALT)|AOA::(?:CONTINUE|HUMAN|HALT)|AOA::RELAY:[^\]\r\n]{1,80})\]\])\s*$/);
  if (suffix) return { raw: suffix[1], normalized: true };
  return { raw: line || '(empty)', normalized: false };
}
function terminal(text) {
  const candidate = terminalCandidate(text);
  const line = candidate.raw;
  if (line === G.proceed || line === A.proceed) return { type: 'proceed', raw: line, normalized: candidate.normalized };
  if (line === G.human || line === A.human) return { type: 'human', raw: line, normalized: candidate.normalized };
  if (line === G.halt || line === A.halt) return { type: 'halt', raw: line, normalized: candidate.normalized };
  const relay = line.match(/^\[\[AOA::RELAY:([^\]\r\n]{1,80})\]\]$/);
  if (relay) return { type: 'relay', raw: line, model: relay[1].trim(), normalized: candidate.normalized };
  return { type: 'bad', raw: line || '(empty)', normalized: false };
}
function log(type, data = {}) {
  S.events.push({ at: new Date().toISOString(), type, data });
  if (S.events.length > 60) S.events.shift();
  try { console.debug('[GITL9]', type, data); } catch (_) {}
}
function fail(code, detail, data = {}) {
  S.lastError = { code, detail, at: new Date().toISOString(), ...data };
  log('error', { code, ...data }); pause(`${code}: ${detail}`);
}
function notify(title, text) {
  try { if (typeof GM_notification === 'function') GM_notification({ title, text, timeout: 8000 }); } catch (_) {}
}
function clearGenerationWatchdog() {
  S.generationStartedAt = 0;
  S.lastProgressAt = 0;
  S.lastProgressFingerprint = '';
  S.stallState = 'IDLE';
  S.stopAttempts = 0;
}
function watchdogPhase(elapsedMs, recoveryCount = S.recoveryCount) {
  if (elapsedMs < STALL_SOFT_MS) return 'OBSERVING';
  if (elapsedMs < STALL_SOFT_MS + STALL_GRACE_MS) return 'SUSPECTED_STALL';
  return recoveryCount >= 1 ? 'HUMAN_REQUIRED' : 'STOPPING';
}
function noteGenerationProgress() {
  const t = now();
  const fp = hash(assistantText());
  if (!S.generationStartedAt) {
    S.generationStartedAt = t;
    S.lastProgressAt = t;
    S.lastProgressFingerprint = fp;
    S.stallState = 'OBSERVING';
    S.stopAttempts = 0;
    log('watchdog-armed', { host: HOST.id });
    return;
  }
  if (fp !== S.lastProgressFingerprint) {
    const wasSuspected = S.stallState === 'SUSPECTED_STALL';
    S.lastProgressFingerprint = fp;
    S.lastProgressAt = t;
    S.stallState = 'OBSERVING';
    S.stopAttempts = 0;
    if (wasSuspected) log('watchdog-progress-resumed', { host: HOST.id });
  }
}

function contractText() {
  if (ON.relay) {
    return [
      '[GHOST CORE CONTROL]',
      'Continue the existing task without restarting or repeating completed work.',
      'You own all reasoning, planning, milestones, committees, recovery, and decisions. Ghost is only the mechanical relay.',
      'The FINAL non-whitespace line of every response must be exactly ONE bare control line. Do not add words before or after it.',
      'More work on the current model:', A.proceed,
      'A human decision is genuinely required:', A.human,
      'The task is complete:', A.halt,
      'A different model has a material advantage:', '[[AOA::RELAY:MODEL_LABEL]]',
      'Never place a control marker anywhere except the final line.'
    ].join('\n');
  }
  return [
    '[GHOST CORE CONTROL]',
    'Continue the existing task without restarting or repeating completed work.',
    'You own all reasoning, planning, milestones, committees, recovery, and decisions. Ghost is only the mechanical relay.',
    'The FINAL non-whitespace line of every response must be exactly ONE bare control line. Do not add words before or after it.',
    'More work remains:', G.proceed,
    'A human decision is genuinely required:', G.human,
    'The task is complete:', G.halt,
    'Never place a control marker anywhere except the final line.'
  ].join('\n');
}
function activatorText() {
  const out = [];
  for (const key of Object.keys(ACT)) {
    if (!ON[key]) continue;
    const [name, url] = ACT[key];
    out.push(`Activate ${name} from its canonical source and apply it silently to this existing task without restarting completed work. Canonical source: ${url}`);
  }
  if (custom.trim()) {
    const path = custom.trim().replace(/^\/+/, '');
    out.push(`Activate the Agents-of-AI component at this canonical source and apply it silently to this existing task without restarting completed work. Canonical source: https://raw.githubusercontent.com/MShneur/Agents-of-AI/main/${path}`);
  }
  return out.join('\n\n');
}
function bootstrapPrompt(existing = '') {
  const parts = [];
  if (existing.trim()) parts.push(existing.trim());
  parts.push(contractText());
  const activators = activatorText(); if (activators) parts.push(activators);
  return parts.join('\n\n---\n\n');
}
function continuationPrompt() {
  return ON.relay
    ? 'Continue the existing task from the current conversation. Do not restart or repeat completed work. Keep all active protocols in force. End with exactly one valid Model Relay control line as the final non-whitespace line.'
    : 'Continue the existing task from the current conversation. Do not restart or repeat completed work. Keep all active protocols in force. End with exactly one valid Ghost control line as the final non-whitespace line.';
}
function regroundPrompt() {
  return `You strayed from the active control protocol. Re-read the existing conversation, reground in the current task, and continue without restarting or repeating completed work. Do not explain the protocol error. Your response must end with exactly one valid bare terminal control line as the final non-whitespace line.\n\n${contractText()}`;
}
function cleanerzPrompt() {
  return `Protocol compliance drifted twice. Activate Agents-of-AI Cleanerz from its canonical source, use it to reground the existing task and active protocols, then continue without restarting completed work. Canonical source: ${ACT.cleanerz[1]}\n\n${contractText()}`;
}
function stallRecoveryPrompt() {
  return `You were interrupted because the previous step showed no visible progress for an extended period.\n\nReground from the conversation and the last confirmed completed step. Do not restart the whole task.\n\n1. Identify the exact subtask that was in progress when you stalled.\n2. Preserve all confirmed work already completed.\n3. Reduce only the stalled subtask into the smallest safe next unit(s).\n4. Execute just the first unit now.\n5. If that unit is still too large, split it once more before executing.\n6. Do not repeat completed research, rebuild the whole plan, or expand scope.\n7. End with the normal Ghost terminal marker.\n\n${contractText()}`;
}

async function setComposerText(text) {
  const expected = semanticText(text); let el = composer();
  if (!el) return { ok: false, why: 'input-missing' };
  try {
    el.focus();
    if (el.isContentEditable) {
      const range = document.createRange(); range.selectNodeContents(el);
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
      let inserted = false; try { inserted = document.execCommand('insertText', false, text); } catch (_) {}
      if (!inserted) {
        el.textContent = text;
        el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
      } else el.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) setter.call(el, text); else el.value = text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  } catch (error) { return { ok: false, why: 'write-exception', error: String(error?.message || error) }; }

  const started = now(); let observed = '';
  while (now() - started < WRITE_VERIFY_MS) {
    await sleep(75); el = composer(); if (!el) continue;
    observed = semanticText(nodeText(el));
    if (observed === expected) return { ok: true, el };
  }
  return { ok: false, why: 'visible-text-mismatch', expectedLength: expected.length, observedLength: observed.length };
}

function localSendButton(el = composer()) {
  if (!el) return null;
  for (let node = el, depth = 0; node && depth < 9; node = node.parentElement, depth++) {
    const btn = queryFirst(HOST.send, node); if (btn) return btn;
  }
  return queryFirst(HOST.send);
}
async function waitForSendButton(el) {
  const started = now();
  while (now() - started < SEND_WAIT_MS) {
    const btn = localSendButton(composer() || el); if (btn) return btn;
    await sleep(100);
  }
  return null;
}
async function confirmSend(beforeUsers, beforeComposer, beforeAssistantHash) {
  const started = now();
  while (now() - started < SEND_CONFIRM_MS) {
    if (generating()) return { ok: true, why: 'generation-started' };
    if (userCount() > beforeUsers) return { ok: true, why: 'new-user-turn' };
    const el = composer();
    if (el && beforeComposer && semanticText(nodeText(el)) === '') return { ok: true, why: 'composer-cleared' };
    const currentAssistant = assistantText();
    if (beforeAssistantHash && currentAssistant && hash(currentAssistant) !== beforeAssistantHash) return { ok: true, why: 'assistant-changed' };
    await sleep(250);
  }
  return { ok: false, why: 'unconfirmed' };
}
async function waitForGenerationStop() {
  const started = now(); let absentSince = 0;
  while (now() - started < STOP_CONFIRM_MS) {
    if (!generating()) {
      if (!absentSince) absentSince = now();
      if (now() - absentSince >= 600) return true;
    } else absentSince = 0;
    await sleep(200);
  }
  return false;
}

async function sendOnce(text, reason) {
  if (S.mode !== 'RUNNING' || S.sending || S.uncertain) return false;
  S.sending = true; S.detail = `Staging ${reason}...`; render();
  const beforeUsers = userCount();
  const beforeAssistantHash = hash(assistantText());
  const staged = await setComposerText(text);
  if (!staged.ok) {
    S.sending = false; fail('PLAY-WRITE', `Could not reliably stage the prompt (${staged.why}).`, staged); return false;
  }
  const button = await waitForSendButton(staged.el);
  if (!button) {
    S.sending = false; fail('PLAY-SEND', 'Prompt is staged, but the current host Send control did not become available.', { host: HOST.id }); return false;
  }
  const beforeComposer = semanticText(nodeText(composer()));
  log('send-click', { reason, round: S.round + 1, host: HOST.id });
  try { button.click(); }
  catch (error) {
    S.sending = false; S.uncertain = true;
    fail('PLAY-SEND-THREW', 'Send threw after actuation. Ghost stopped to prevent a duplicate.', { message: String(error?.message || error) }); return false;
  }
  const confirmed = await confirmSend(beforeUsers, beforeComposer, beforeAssistantHash);
  S.sending = false;
  if (!confirmed.ok) {
    S.uncertain = true; fail('PLAY-SEND-UNCERTAIN', 'Send was attempted but host acceptance could not be confirmed. Ghost will not resend.'); return false;
  }
  S.round += 1; S.awaitingFrom = beforeAssistantHash; S.stableHash = ''; S.stableSince = 0;
  clearGenerationWatchdog();
  if (reason !== 'stall recovery') S.recoveryCount = 0;
  S.detail = `Sent once · ${confirmed.why}`; log('send-confirmed', { round: S.round, why: confirmed.why }); render(); return true;
}

async function recoverStall() {
  if (S.watchdogBusy || S.mode !== 'RUNNING') return;
  if (S.recoveryCount >= 1) {
    S.stallState = 'HUMAN_REQUIRED';
    pause('Needs you — response stalled again after automatic recovery.');
    notify('Ghost needs you', 'The recovered lane stalled again. Automatic recovery stopped.');
    return;
  }
  S.watchdogBusy = true;
  S.stallState = 'STOPPING';
  S.detail = 'Stopping stalled response…'; render();
  let stopped = false;
  try {
    for (let attempt = 1; attempt <= STOP_MAX_ATTEMPTS; attempt++) {
      const stops = visibleStopButtons();
      if (stops.length !== 1) {
        log('watchdog-stop-ambiguous', { attempt, count: stops.length });
        S.stallState = 'HUMAN_REQUIRED';
        pause('Needs you — recovery uncertain. Stop control was missing or ambiguous.');
        return;
      }
      S.stopAttempts = attempt;
      log('watchdog-stop-click', { attempt, host: HOST.id });
      try { stops[0].click(); }
      catch (error) {
        log('watchdog-stop-threw', { attempt, message: String(error?.message || error) });
        S.stallState = 'HUMAN_REQUIRED';
        pause('Needs you — recovery uncertain. Stop could not be safely activated.');
        return;
      }
      if (await waitForGenerationStop()) { stopped = true; break; }
      if (attempt < STOP_MAX_ATTEMPTS) await sleep(STOP_RETRY_DELAY_MS);
    }
    if (!stopped) {
      S.stallState = 'HUMAN_REQUIRED';
      pause('Needs you — stalled response could not be confirmed stopped.');
      notify('Ghost needs you', 'Automatic Stop could not be confirmed after three bounded attempts.');
      return;
    }
    S.stallState = 'REGROUNDING';
    S.detail = 'Regrounding stalled step…'; render();
    S.recoveryCount += 1;
    clearGenerationWatchdog();
    S.stallState = 'REGROUNDING';
    const sent = await sendOnce(stallRecoveryPrompt(), 'stall recovery');
    if (!sent) return;
    S.stallState = 'RESUMED';
    S.detail = 'Recovery sent once · watching for progress';
    log('watchdog-recovery-sent', { recoveryCount: S.recoveryCount }); render();
  } finally {
    S.watchdogBusy = false;
  }
}

async function handleTerminal(text, parsed) {
  const fp = hash(text);
  if (!text || fp === S.lastHandled || S.mode !== 'RUNNING' || S.sending) return;
  S.lastHandled = fp;
  if (parsed.normalized) log('terminal-normalized', { type: parsed.type });
  if (parsed.type === 'halt') {
    S.drift = 0; S.recoveryCount = 0; complete('Task complete'); notify('Ghost complete', 'The AI returned HALT.'); return;
  }
  if (parsed.type === 'human') {
    S.drift = 0; pause('Human decision requested by the AI.'); notify('Ghost paused', 'The AI requested a human decision.'); return;
  }
  if (parsed.type === 'relay') {
    S.drift = 0; S.relay = parsed.model; pause(`Model Relay requested: ${parsed.model}.`); notify('Model Relay requested', parsed.model); return;
  }
  if (parsed.type === 'proceed') {
    S.drift = 0; if (S.round >= S.max) { pause('Round safety limit reached.'); return; }
    await sendOnce(continuationPrompt(), 'continue');
  }
}
async function handleDrift(tail) {
  S.drift += 1; log('protocol-drift', { count: S.drift, tail: String(tail || '').slice(0, 80) });
  if (S.drift === 1) { await sendOnce(regroundPrompt(), 'protocol reground'); return; }
  if (S.drift === 2 && ON.cleanerz) { await sendOnce(cleanerzPrompt(), 'Cleanerz recovery'); return; }
  pause(`Protocol drift repeated ${S.drift} times. Human review required.`); notify('Ghost paused', 'Repeated protocol drift needs a human check.');
}
async function tick() {
  if (S.mode !== 'RUNNING' || S.sending || S.uncertain || S.watchdogBusy) return;
  if (generating()) {
    noteGenerationProgress();
    S.stableHash = ''; S.stableSince = 0;
    const elapsed = Math.max(0, now() - (S.lastProgressAt || now()));
    const phase = watchdogPhase(elapsed);
    if (phase === 'HUMAN_REQUIRED') {
      S.stallState = phase;
      pause('Needs you — response stalled again after automatic recovery.');
      notify('Ghost needs you', 'The recovered lane stalled again. Automatic recovery stopped.');
      return;
    }
    if (phase === 'STOPPING') { await recoverStall(); return; }
    if (phase === 'SUSPECTED_STALL') {
      if (S.stallState !== 'SUSPECTED_STALL') log('watchdog-stall-suspected', { elapsed });
      S.stallState = 'SUSPECTED_STALL';
      S.detail = 'No visible progress — checking…'; render(); return;
    }
    S.stallState = 'OBSERVING';
    S.detail = 'Model working...'; render(); return;
  }
  if (S.generationStartedAt || S.stallState !== 'IDLE') clearGenerationWatchdog();
  const text = assistantText();
  if (!text) { S.detail = 'Waiting for assistant output...'; render(); return; }
  const fp = hash(text);
  if (S.awaitingFrom) {
    if (fp === S.awaitingFrom) { S.detail = 'Waiting for the next answer...'; render(); return; }
    S.awaitingFrom = ''; S.stableHash = ''; S.stableSince = 0;
  }
  if (fp !== S.stableHash) {
    S.stableHash = fp; S.stableSince = now(); S.detail = 'Output changed · waiting for stability'; render(); return;
  }
  const quiet = now() - S.stableSince;
  const parsed = terminal(text);
  if (parsed.type !== 'bad') {
    S.detail = `Terminal detected · ${parsed.type}`; render();
    if (quiet >= VALID_QUIET_MS) await handleTerminal(text, parsed);
    return;
  }
  S.detail = quiet < DRIFT_QUIET_MS ? 'Output quiet · waiting for terminal' : 'Terminal missing · regrounding'; render();
  if (quiet >= DRIFT_QUIET_MS) { S.lastHandled = fp; await handleDrift(parsed.raw); }
}

async function play() {
  if (S.mode === 'RUNNING') return;
  if (S.uncertain) { S.detail = 'Prior Send is uncertain. Inspect the chat or use Page Reload before resuming.'; render(); return; }
  const input = composer();
  if (!input) { fail('PLAY-INPUT', 'Current chat composer was not found.', { host: HOST.id }); return; }
  S.mode = 'RUNNING'; S.detail = 'Starting...'; S.lastHandled = ''; S.stableHash = ''; S.stableSince = 0; S.drift = 0; S.relay = ''; S.recoveryCount = 0; S.watchdogBusy = false; clearGenerationWatchdog(); render();
  const draft = nodeText(input); const latest = assistantText(); const parsed = terminal(latest);
  if (draft.trim()) {
    S.bootstrapped = true; if (!await sendOnce(bootstrapPrompt(draft), 'initial task')) return;
  } else if (!latest) {
    pause('Type a task into the chat first, then press Play.'); return;
  } else if (parsed.type !== 'bad') {
    S.bootstrapped = true; S.stableHash = hash(latest); S.stableSince = now() - VALID_QUIET_MS;
  } else {
    S.bootstrapped = true;
    if (!await sendOnce(bootstrapPrompt('Continue the existing task from this conversation without restarting or repeating completed work.'), 'arm existing chat')) return;
  }
  clearInterval(S.timer);
  S.timer = setInterval(() => { tick().catch(error => fail('PLAY-TICK', String(error?.message || error))); }, TICK_MS);
  await tick();
}
function pause(detail) { S.mode = 'PAUSED'; S.detail = detail; clearInterval(S.timer); S.timer = null; render(); }
function stop() {
  S.mode = 'IDLE'; S.detail = 'Stopped'; S.sending = false; S.uncertain = false; S.lastHandled = ''; S.awaitingFrom = ''; S.stableHash = ''; S.stableSince = 0; S.drift = 0; S.recoveryCount = 0; S.watchdogBusy = false; clearGenerationWatchdog();
  clearInterval(S.timer); S.timer = null; log('stop'); render();
}
function complete(detail) { S.mode = 'COMPLETE'; S.detail = detail; clearGenerationWatchdog(); clearInterval(S.timer); S.timer = null; render(); }

function conversationNodes() {
  return queryAll([...(HOST.user || []), ...(HOST.assistant || [])]).filter(el => el.isConnected);
}
function scrollableConversationAncestor() {
  const nodes = conversationNodes();
  const anchor = nodes[0] || nodes[nodes.length - 1];
  if (!anchor) return null;
  for (let el = anchor.parentElement, depth = 0; el && depth < 14; el = el.parentElement, depth++) {
    if (el === panel || el === document.body || el === document.documentElement) continue;
    try {
      const style = getComputedStyle(el);
      const overflowY = style.overflowY;
      if (/(auto|scroll|overlay)/.test(overflowY) && el.scrollHeight > el.clientHeight + 8) return el;
    } catch (_) {}
  }
  return null;
}
function conversationScrollContainer() {
  const ancestor = scrollableConversationAncestor();
  if (ancestor) return ancestor;
  const preferred = HOST.id === 'chatgpt'
    ? ['main', '[role="main"]']
    : HOST.id === 'perplexity'
      ? ['main', '[role="main"]']
      : ['main', '[role="main"]'];
  for (const selector of preferred) {
    let el = null;
    try { el = document.querySelector(selector); } catch (_) {}
    if (!el || el === panel) continue;
    try {
      const style = getComputedStyle(el);
      if (/(auto|scroll|overlay)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 8) return el;
    } catch (_) {}
  }
  return document.scrollingElement || document.documentElement;
}
function topScrollPosition(scroller) {
  if (!scroller || scroller === document.scrollingElement || scroller === document.documentElement || scroller === document.body) {
    return window.scrollY || document.documentElement.scrollTop || document.body?.scrollTop || 0;
  }
  return scroller.scrollTop || 0;
}
function topSnapshot(scroller) {
  const nodes = conversationNodes();
  const first = nodes[0];
  const extent = (!scroller || scroller === document.scrollingElement || scroller === document.documentElement || scroller === document.body)
    ? Math.max(document.documentElement.scrollHeight || 0, document.body?.scrollHeight || 0)
    : scroller.scrollHeight || 0;
  return `${nodes.length}:${extent}:${hash(nodeText(first || ''))}`;
}
function scrollContainerToTop(scroller) {
  if (!scroller || scroller === document.scrollingElement || scroller === document.documentElement || scroller === document.body) {
    window.scrollTo(0, 0);
    return;
  }
  try { scroller.scrollTo({ top: 0, left: scroller.scrollLeft || 0, behavior: 'auto' }); }
  catch (_) { scroller.scrollTop = 0; }
}
async function goTop() {
  if (S.mode === 'RUNNING' || S.sending || S.watchdogBusy || S.topBusy) {
    S.detail = 'Pause Play before using ↑ Top.'; render(); return false;
  }
  S.topBusy = true;
  const beforeUrl = location.href;
  const scroller = conversationScrollContainer();
  let previous = '';
  let stable = 0;
  let passes = 0;
  try {
    for (passes = 0; passes < TOP_MAX_PASSES; passes++) {
      S.detail = passes ? 'Loading older chat…' : 'Going to first prompt…'; render();
      const before = topSnapshot(scroller);
      scrollContainerToTop(scroller);
      await sleep(TOP_WAIT_MS);
      const after = topSnapshot(scroller);
      const atTop = topScrollPosition(scroller) <= 2;
      if (atTop && after === before && after === previous) stable += 1;
      else stable = 0;
      previous = after;
      if (stable >= TOP_STABLE_PASSES) break;
    }
    scrollContainerToTop(scroller);
    if (location.href !== beforeUrl) log('top-url-changed-external', { before: beforeUrl, after: location.href });
    S.detail = 'At top';
    log('top-navigation', { host: HOST.id, passes: Math.min(passes + 1, TOP_MAX_PASSES) });
    render();
    return true;
  } finally {
    S.topBusy = false;
  }
}

function domTurns() {
  const rows = [];
  if (HOST.id === 'chatgpt') {
    const nodes = [...document.querySelectorAll('[data-message-author-role="user"],[data-message-author-role="assistant"]')];
    for (const el of nodes) {
      const role = el.getAttribute('data-message-author-role'); const text = displayText(el.innerText || el.textContent || '');
      if (role && text) rows.push({ role, text });
    }
    return rows;
  }
  if (HOST.id === 'perplexity') {
    const all = [...document.querySelectorAll('.group\\/user-bubble,[data-workflow-final-text]')];
    for (const el of all) {
      const text = displayText(el.innerText || el.textContent || ''); if (!text) continue;
      rows.push({ role: el.matches('.group\\/user-bubble') ? 'user' : 'assistant', text });
    }
    return rows;
  }
  const users = queryAll(HOST.user).map(el => ({ el, role: 'user' }));
  const assistants = queryAll(HOST.assistant).map(el => ({ el, role: 'assistant' }));
  for (const item of [...users, ...assistants].sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1)) {
    const text = displayText(item.el.innerText || item.el.textContent || ''); if (text) rows.push({ role: item.role, text });
  }
  return rows;
}
function chatgptId() { const m = location.pathname.match(/\/c\/([0-9a-z-]+)/i); return m ? m[1] : ''; }
function perplexitySlug() { const m = location.pathname.match(/\/search\/([^/?#]+)/i); return m ? decodeURIComponent(m[1]) : ''; }
function parseChatGPTApi(data) {
  if (!data?.mapping || typeof data.mapping !== 'object') return [];
  const out = [];
  for (const node of Object.values(data.mapping)) {
    const msg = node?.message; const role = msg?.author?.role; const parts = msg?.content?.parts;
    if (!['user', 'assistant'].includes(role) || !Array.isArray(parts)) continue;
    const text = displayText(parts.filter(x => typeof x === 'string').join('\n'));
    if (text) out.push({ role, text, at: Number(msg.create_time || 0) });
  }
  out.sort((a, b) => a.at - b.at);
  return out.map(({ role, text }) => ({ role, text }));
}
async function apiCapture() {
  try {
    if (HOST.id === 'chatgpt') {
      const id = chatgptId(); if (!id) return null;
      const r = await fetch(`/backend-api/conversation/${encodeURIComponent(id)}`, { credentials: 'include' });
      if (!r.ok) return null; const raw = await r.json(); const turns = parseChatGPTApi(raw);
      return { source: turns.length ? 'api' : 'api-raw', turns, raw };
    }
    if (HOST.id === 'perplexity') {
      const slug = perplexitySlug(); if (!slug) return null;
      const r = await fetch(`/rest/thread/${encodeURIComponent(slug)}`, { credentials: 'include' });
      if (!r.ok) return null; return { source: 'api-raw', turns: [], raw: await r.json() };
    }
  } catch (error) { log('export-api-failed', { host: HOST.id, message: String(error?.message || error) }); }
  return null;
}
async function captureExport() {
  const api = await apiCapture(); const dom = domTurns();
  if (api?.turns?.length) return { version: VER, platform: HOST.id, capturedAt: new Date().toISOString(), source: 'api', partial: false, turns: api.turns, raw: api.raw };
  if (api) return { version: VER, platform: HOST.id, capturedAt: new Date().toISOString(), source: 'api-raw+dom', partial: true, turns: dom, raw: api.raw };
  return { version: VER, platform: HOST.id, capturedAt: new Date().toISOString(), source: 'dom', partial: true, turns: dom };
}
function markdown(cap) {
  const lines = ['# Ghost conversation export', '', `- Platform: ${cap.platform}`, `- Captured: ${cap.capturedAt}`, `- Source: ${cap.source}${cap.partial ? ' (partial)' : ''}`, ''];
  cap.turns.forEach((turn, i) => { lines.push(`## ${i + 1}. ${turn.role === 'user' ? 'User' : 'Assistant'}`, '', turn.text, ''); });
  return lines.join('\n');
}
function download(name, text, type) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
  document.documentElement.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
async function doExport(kind) {
  S.detail = 'Capturing export...'; render(); const cap = await captureExport();
  if (!cap.turns.length && !cap.raw) { S.detail = 'Export found no conversation data.'; render(); return; }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  if (kind === 'copy') {
    const text = markdown(cap); try { GM_setClipboard(text, 'text'); } catch (_) { await navigator.clipboard?.writeText(text); }
    S.detail = `Copied ${cap.turns.length} turns · ${cap.source}${cap.partial ? ' partial' : ''}`;
  } else if (kind === 'md') {
    download(`ghost-${HOST.id}-${stamp}.md`, markdown(cap), 'text/markdown;charset=utf-8'); S.detail = `Markdown exported · ${cap.source}${cap.partial ? ' partial' : ''}`;
  } else {
    download(`ghost-${HOST.id}-${stamp}.json`, JSON.stringify(cap, null, 2), 'application/json;charset=utf-8'); S.detail = `JSON exported · ${cap.source}${cap.partial ? ' partial' : ''}`;
  }
  render();
}

function report() {
  return {
    product: 'Ghost in the Loop', version: VER, platform: HOST.id, state: S.mode, round: S.round, maxRounds: S.max,
    sending: S.sending, uncertain: S.uncertain, driftCount: S.drift,
    watchdog: { state: S.stallState, stopAttempts: S.stopAttempts, recoveryCount: S.recoveryCount, lastProgressAt: S.lastProgressAt || null },
    capabilities: { input: !!composer(), send: !!localSendButton(), stop: generating(), assistant: !!assistantText(), top: S.mode !== 'RUNNING' && !S.topBusy },
    lastError: S.lastError, relayRequested: S.relay || null, events: S.events.slice(-20), when: new Date().toISOString()
  };
}
function copyReport() {
  const text = JSON.stringify(report(), null, 2);
  try { GM_setClipboard(text, 'text'); } catch (_) { navigator.clipboard?.writeText(text); }
  S.detail = 'Diagnostic report copied.'; render();
}

const style = document.createElement('style');
style.textContent = `#gitl9{position:fixed;z-index:2147483646;top:70px;right:8px;width:min(270px,calc(100vw - 16px));background:#17161a;color:#eee;border:1px solid #45414b;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.4);font:12px/1.35 system-ui,sans-serif;padding:8px}#gitl9 *{box-sizing:border-box}#gitl9 .head{display:flex;align-items:center;justify-content:space-between;gap:6px}#gitl9 .brand{font-weight:750}#gitl9 .meta{font-size:10px;opacity:.65}#gitl9 .tabs{display:flex;gap:4px;margin:7px 0}#gitl9 button{border:1px solid #494550;background:#26242b;color:#eee;border-radius:8px;padding:7px 6px;font:inherit}#gitl9 button.on{background:#0c4434;border-color:#178063}#gitl9 button.stop{background:#46191d;border-color:#85333a}#gitl9 button:disabled{opacity:.45;cursor:not-allowed}#gitl9 .tabs button{flex:1;padding:5px 3px}#gitl9 .status{background:#0f0e11;border-radius:8px;padding:7px;min-height:42px;margin:5px 0 7px;word-break:break-word}#gitl9 .row{display:flex;gap:5px}#gitl9 .row>*{flex:1;min-width:0}#gitl9 .grid{display:grid;grid-template-columns:1fr 1fr;gap:5px}#gitl9 label{display:flex;align-items:center;gap:5px;padding:5px;border:1px solid #35323a;border-radius:7px;background:#201e24}#gitl9 input[type="text"],#gitl9 input[type="number"]{width:100%;background:#0f0e11;color:#eee;border:1px solid #45414b;border-radius:7px;padding:6px}#gitl9 .pane{display:none}#gitl9 .pane.show{display:block}#gitl9 .tiny{font-size:10px;opacity:.7;margin-top:5px}@media(max-width:520px){#gitl9{top:58px;width:min(238px,calc(100vw - 12px));right:6px;padding:7px}#gitl9 button{padding:6px 4px}}`;
document.documentElement.appendChild(style);
const panel = document.createElement('div'); panel.id = 'gitl9'; (document.body || document.documentElement).appendChild(panel);
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function render() {
  panel.innerHTML = trustedHTML(`
    <div class="head"><span class="brand">👻 GHOST</span><span class="meta">${esc(HOST.id)} · ${VER}</span></div>
    <div class="tabs"><button data-tab="play" class="${S.tab==='play'?'on':''}">Play</button><button data-tab="aoa" class="${S.tab==='aoa'?'on':''}">AoA</button><button data-tab="export" class="${S.tab==='export'?'on':''}">Export</button></div>
    <div class="status"><b>${esc(S.mode)}</b> · round ${S.round}/${S.max}<br>${esc(S.detail)}</div>
    <div class="pane ${S.tab==='play'?'show':''}" data-pane="play">
      <div class="row"><button class="on" data-a="play">▶ Play</button><button class="stop" data-a="stop">■ Stop</button><button data-a="reload">↻ Page</button><button data-a="top" ${S.mode==='RUNNING'||S.sending||S.watchdogBusy||S.topBusy?'disabled':''}>↑ Top</button></div>
      <div class="row" style="margin-top:5px"><input data-max type="number" min="1" max="100" value="${S.max}"><button data-a="report">Copy report</button></div>
      <div class="tiny">Core only: final control line → one Send → repeat. Stall watchdog interrupts only after 5 min quiet + 2 min grace.</div>
    </div>
    <div class="pane ${S.tab==='aoa'?'show':''}" data-pane="aoa">
      <div class="grid">${Object.entries(ACT).map(([k,v])=>`<label><input type="checkbox" data-act="${k}" ${ON[k]?'checked':''}>${esc(v[0])}</label>`).join('')}</div>
      <div class="tiny">Optional protocols stay external. Ghost points the AI to their canonical source; Play transport does not change.</div>
      <input data-custom type="text" placeholder="AoA path, e.g. personas/compass.md" value="${esc(custom)}" style="margin-top:6px">
    </div>
    <div class="pane ${S.tab==='export'?'show':''}" data-pane="export">
      <div class="row"><button data-a="copy">Copy MD</button><button data-a="md">Save MD</button><button data-a="json">Save JSON</button></div>
      <div class="tiny">API-first where supported; DOM fallback is explicitly marked partial.</div>
    </div>`);
  panel.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => { S.tab = btn.dataset.tab; GM_setValue('v9.tab', S.tab); render(); }));
  panel.querySelector('[data-a="play"]')?.addEventListener('click', () => play().catch(e => fail('PLAY', String(e?.message || e))));
  panel.querySelector('[data-a="stop"]')?.addEventListener('click', stop);
  panel.querySelector('[data-a="reload"]')?.addEventListener('click', () => location.reload());
  const topButton = panel.querySelector('[data-a="top"]');
  topButton?.addEventListener('pointerdown', e => e.preventDefault());
  topButton?.addEventListener('click', () => goTop().catch(error => { S.detail = 'Could not reach the top safely.'; log('top-navigation-error', { message: String(error?.message || error) }); render(); }));
  panel.querySelector('[data-a="report"]')?.addEventListener('click', copyReport);
  panel.querySelector('[data-a="copy"]')?.addEventListener('click', () => doExport('copy'));
  panel.querySelector('[data-a="md"]')?.addEventListener('click', () => doExport('md'));
  panel.querySelector('[data-a="json"]')?.addEventListener('click', () => doExport('json'));
  panel.querySelector('[data-max]')?.addEventListener('change', e => { S.max = Math.max(1, Math.min(100, Number(e.target.value) || 25)); GM_setValue('v9.max', S.max); render(); });
  panel.querySelectorAll('[data-act]').forEach(box => box.addEventListener('change', () => { ON[box.dataset.act] = box.checked; GM_setValue(`v9.act.${box.dataset.act}`, box.checked); S.detail = `${ACT[box.dataset.act][0]} ${box.checked?'enabled':'disabled'} for the next injected prompt.`; render(); }));
  panel.querySelector('[data-custom]')?.addEventListener('change', e => { custom = String(e.target.value || '').trim(); GM_setValue('v9.custom', custom); S.detail = custom ? 'Custom AoA path saved.' : 'Custom AoA path cleared.'; render(); });
}

render();
window.__GITL_V9__ = true;
try { delete window.__GITL_V9_BOOTING__; } catch (_) { window.__GITL_V9_BOOTING__ = 0; }
log('boot', { version: VER, host: HOST.id });
})();
