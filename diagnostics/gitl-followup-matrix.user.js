// ==UserScript==
// @name         GITL Follow-up Matrix Tester
// @namespace    https://github.com/MShneur/ghost-in-the-loop
// @version      0.1.0
// @description  One-button field tester for first-send vs follow-up editor commitment and fallback paths.
// @match        https://www.perplexity.ai/*
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @run-at       document-idle
// @grant        GM_setClipboard
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const VERSION = '0.1.0';
  const STAGE_TIMEOUT = 6000;
  const SEND_ACK_TIMEOUT = 15000;
  const READY_TIMEOUT = 90000;
  const methods = [
    ['native-setter', stageNativeSetter],
    ['execcommand-inserttext', stageExecCommand],
    ['beforeinput-inputevent', stageBeforeInput],
    ['range-plus-input', stageRangeInput],
    ['paste-event-plus-input', stagePasteInput],
    ['composition-plus-input', stageCompositionInput],
  ];

  const state = {
    version: VERSION,
    startedAt: null,
    finishedAt: null,
    host: location.hostname,
    running: false,
    tests: [],
    events: [],
    final: 'NOT RUN',
    manualCheck: null,
  };

  let host, shadow, statusEl, playBtn, copyBtn;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const now = () => new Date().toISOString();
  const visible = el => {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity || 1) > 0;
  };
  const txt = el => String(el?.value ?? el?.innerText ?? el?.textContent ?? '');
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim();
  const log = (type, data = {}) => state.events.push({ at: now(), type, ...data });

  function platform() {
    if (/perplexity\.ai$/i.test(location.hostname)) return 'perplexity';
    if (/chatgpt\.com$|chat\.openai\.com$/i.test(location.hostname)) return 'chatgpt';
    return 'unknown';
  }

  function editorCandidates() {
    const q = [
      'textarea',
      '[contenteditable="true"]',
      '[role="textbox"][contenteditable="true"]',
      'div.ProseMirror[contenteditable="true"]'
    ].join(',');
    return [...document.querySelectorAll(q)].filter(visible).filter(el => {
      const a = norm(el.getAttribute('aria-label')).toLowerCase();
      return !/(search settings|rename|filter)/.test(a);
    });
  }

  function scoreEditor(el) {
    const r = el.getBoundingClientRect();
    let score = r.bottom + r.width / 1000;
    if (document.activeElement === el || el.contains(document.activeElement)) score += 100000;
    const ph = norm(el.getAttribute('placeholder')).toLowerCase();
    const aria = norm(el.getAttribute('aria-label')).toLowerCase();
    if (/ask|message|prompt|follow|anything/.test(ph + ' ' + aria)) score += 5000;
    if (el.closest('form')) score += 1000;
    return score;
  }

  function findEditor() {
    const all = editorCandidates().sort((a, b) => scoreEditor(b) - scoreEditor(a));
    return { editor: all[0] || null, count: all.length };
  }

  function sendCandidates() {
    const sels = [
      'button[type="submit"]',
      'button[data-testid*="send" i]',
      'button[data-testid*="submit" i]',
      'button[aria-label*="send" i]',
      'button[aria-label*="submit" i]',
      '[role="button"][aria-label*="send" i]',
      '[role="button"][aria-label*="submit" i]'
    ];
    const set = new Set();
    for (const s of sels) {
      try { document.querySelectorAll(s).forEach(el => visible(el) && set.add(el)); } catch (_) {}
    }
    return [...set];
  }

  function isEnabled(el) {
    return Boolean(el) && !el.disabled && el.getAttribute('aria-disabled') !== 'true' && !el.hasAttribute('data-disabled');
  }

  function uniqueEnabledSend() {
    const all = sendCandidates();
    const enabled = all.filter(isEnabled);
    return { allCount: all.length, enabledCount: enabled.length, button: enabled.length === 1 ? enabled[0] : null };
  }

  function nativeValueSet(el, value) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
      : el instanceof HTMLInputElement ? HTMLInputElement.prototype : null;
    const desc = proto && Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc?.set) desc.set.call(el, value);
    else if ('value' in el) el.value = value;
    else el.textContent = value;
  }

  function clearEditor(el) {
    try {
      el.focus();
      if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) nativeValueSet(el, '');
      else el.textContent = '';
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward', data: null }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (_) {}
  }

  function selectAllEditable(el) {
    el.focus();
    const sel = getSelection();
    if (!sel) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function setDomText(el, value) {
    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) nativeValueSet(el, value);
    else {
      el.textContent = '';
      el.appendChild(document.createTextNode(value));
    }
  }

  async function stageNativeSetter(el, value) {
    el.focus();
    setDomText(el, value);
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function stageExecCommand(el, value) {
    el.focus();
    if (el.isContentEditable) selectAllEditable(el); else el.select?.();
    let ok = false;
    try { ok = document.execCommand('insertText', false, value); } catch (_) {}
    if (!ok || norm(txt(el)) !== norm(value)) setDomText(el, value);
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
  }

  async function stageBeforeInput(el, value) {
    el.focus();
    clearEditor(el);
    el.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: value }));
    setDomText(el, value);
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
  }

  async function stageRangeInput(el, value) {
    el.focus();
    if (!el.isContentEditable) return stageNativeSetter(el, value);
    selectAllEditable(el);
    const sel = getSelection();
    const range = sel?.rangeCount ? sel.getRangeAt(0) : null;
    range?.deleteContents();
    const node = document.createTextNode(value);
    range?.insertNode(node);
    range?.setStartAfter(node);
    range?.collapse(true);
    if (range && sel) { sel.removeAllRanges(); sel.addRange(range); }
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
  }

  async function stagePasteInput(el, value) {
    el.focus();
    clearEditor(el);
    let dt = null;
    try { dt = new DataTransfer(); dt.setData('text/plain', value); } catch (_) {}
    try { el.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt })); } catch (_) {}
    setDomText(el, value);
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertFromPaste', data: value }));
  }

  async function stageCompositionInput(el, value) {
    el.focus();
    clearEditor(el);
    try { el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' })); } catch (_) {}
    try { el.dispatchEvent(new CompositionEvent('compositionupdate', { bubbles: true, data: value })); } catch (_) {}
    setDomText(el, value);
    try { el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: value })); } catch (_) {}
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertCompositionText', data: value }));
  }

  async function waitForEnabledSend(timeout = STAGE_TIMEOUT) {
    const end = Date.now() + timeout;
    let last = null;
    while (Date.now() < end) {
      last = uniqueEnabledSend();
      if (last.button) return { ok: true, ...last };
      if (last.enabledCount > 1) return { ok: false, reason: 'AMBIGUOUS_SEND', ...last };
      await sleep(150);
    }
    last = uniqueEnabledSend();
    return { ok: false, reason: last.enabledCount ? 'AMBIGUOUS_SEND' : 'SEND_DISABLED_TIMEOUT', ...last };
  }

  function generationActive() {
    const q = [
      'button[aria-label*="stop" i]',
      'button[data-testid*="stop" i]',
      '[role="button"][aria-label*="stop" i]'
    ].join(',');
    return [...document.querySelectorAll(q)].some(visible);
  }

  async function waitForSendAck(editor, sentText) {
    const end = Date.now() + SEND_ACK_TIMEOUT;
    while (Date.now() < end) {
      const { editor: current } = findEditor();
      const currentText = norm(txt(current || editor));
      if (currentText !== norm(sentText) || generationActive()) return true;
      await sleep(150);
    }
    return false;
  }

  async function waitForReady() {
    const end = Date.now() + READY_TIMEOUT;
    let everActive = false;
    while (Date.now() < end) {
      if (generationActive()) everActive = true;
      const s = uniqueEnabledSend();
      const { editor } = findEditor();
      if (!generationActive() && editor && (s.enabledCount === 1 || everActive)) return { ok: true, timedOut: false };
      await sleep(400);
    }
    return { ok: false, timedOut: true, active: generationActive() };
  }

  function promptFor(index, method, repeat = false) {
    return `GITL MATRIX ${index} ${method}${repeat ? ' REPEAT' : ''}. Reply with exactly: OK-${index}`;
  }

  async function runOne(methodName, stageFn, index, repeat = false) {
    setStatus(`Running ${index}: ${methodName}${repeat ? ' repeat' : ''}…`);
    const started = Date.now();
    const found = findEditor();
    const rec = {
      index, method: methodName, repeat, editorCandidates: found.count,
      stageVisible: false, sendEnabled: false, sent: false, sendAck: false,
      readyAfter: false, result: 'FAIL', reason: null, ms: null,
    };
    state.tests.push(rec);
    if (!found.editor) {
      rec.reason = 'NO_EDITOR'; rec.ms = Date.now() - started; return rec;
    }

    const value = promptFor(index, methodName, repeat);
    clearEditor(found.editor);
    await sleep(120);
    try { await stageFn(found.editor, value); }
    catch (e) { rec.reason = 'STAGE_EXCEPTION'; log('stage-exception', { method: methodName, name: e?.name || 'Error' }); rec.ms = Date.now() - started; return rec; }

    await sleep(180);
    const reacquired = findEditor();
    rec.editorCandidatesAfterStage = reacquired.count;
    rec.stageVisible = norm(txt(reacquired.editor || found.editor)).includes(`GITL MATRIX ${index}`);
    if (!rec.stageVisible) {
      rec.reason = 'TEXT_NOT_VISIBLE'; rec.ms = Date.now() - started; return rec;
    }

    const sendState = await waitForEnabledSend();
    rec.sendCandidates = sendState.allCount;
    rec.enabledSendCandidates = sendState.enabledCount;
    if (!sendState.ok) {
      rec.reason = sendState.reason;
      clearEditor(reacquired.editor || found.editor);
      rec.ms = Date.now() - started;
      return rec;
    }

    rec.sendEnabled = true;
    const button = sendState.button;
    button.click();
    rec.sent = true;
    const ack = await waitForSendAck(reacquired.editor || found.editor, value);
    rec.sendAck = ack;
    if (!ack) {
      rec.reason = 'SEND_ACK_TIMEOUT';
      rec.result = 'UNCERTAIN';
      rec.ms = Date.now() - started;
      return rec;
    }

    const ready = await waitForReady();
    rec.readyAfter = ready.ok;
    if (!ready.ok) {
      rec.reason = ready.active ? 'GENERATION_TIMEOUT_ACTIVE' : 'READY_TIMEOUT';
      rec.result = 'FAIL';
      rec.ms = Date.now() - started;
      return rec;
    }

    rec.result = 'PASS';
    rec.reason = null;
    rec.ms = Date.now() - started;
    return rec;
  }

  async function manualCommitCheck() {
    const found = findEditor();
    if (!found.editor) return null;
    const value = 'GITL MANUAL COMMIT CHECK';
    clearEditor(found.editor);
    await stageNativeSetter(found.editor, value);
    const before = uniqueEnabledSend();
    if (before.button) {
      clearEditor(found.editor);
      return { needed: false, beforeEnabled: true, afterEnabled: true };
    }

    setStatus('Manual check: type ONE normal character in the message box. Do not press Send.');
    const startText = norm(txt(found.editor));
    const end = Date.now() + 30000;
    let typed = false;
    while (Date.now() < end) {
      const cur = findEditor().editor || found.editor;
      if (norm(txt(cur)) !== startText) { typed = true; break; }
      await sleep(150);
    }
    const after = uniqueEnabledSend();
    clearEditor(findEditor().editor || found.editor);
    return { needed: true, typed, beforeEnabled: false, afterEnabled: Boolean(after.button), enabledCount: after.enabledCount };
  }

  async function runMatrix() {
    if (state.running) return;
    state.running = true;
    state.startedAt = now();
    state.finishedAt = null;
    state.tests = [];
    state.events = [];
    state.manualCheck = null;
    state.final = 'RUNNING';
    playBtn.disabled = true;
    copyBtn.hidden = true;

    try {
      const passes = [];
      let index = 1;
      for (const [name, fn] of methods) {
        const rec = await runOne(name, fn, index++, false);
        if (rec.result === 'UNCERTAIN') throw new Error('UNCERTAIN_SEND');
        if (rec.result === 'PASS') passes.push([name, fn]);
        if (rec.reason === 'GENERATION_TIMEOUT_ACTIVE') throw new Error('ACTIVE_GENERATION_TIMEOUT');
        await sleep(350);
      }

      const repeatTargets = passes.slice(0, 2);
      for (const [name, fn] of repeatTargets) {
        const rec = await runOne(name, fn, index++, true);
        if (rec.result === 'UNCERTAIN') throw new Error('UNCERTAIN_SEND');
        if (rec.reason === 'GENERATION_TIMEOUT_ACTIVE') throw new Error('ACTIVE_GENERATION_TIMEOUT');
        await sleep(350);
      }

      const followupPasses = state.tests.filter(t => t.index > 1 && t.result === 'PASS').length;
      if (followupPasses === 0) state.manualCheck = await manualCommitCheck();

      const stable = state.tests.filter(t => t.result === 'PASS' && (t.repeat || state.tests.some(x => x.repeat && x.method === t.method && x.result === 'PASS')));
      const anyPass = state.tests.some(t => t.result === 'PASS');
      state.final = stable.length ? `STABLE_METHOD_FOUND:${stable[0].method}` : anyPass ? 'PARTIAL_SUCCESS_NO_REPEAT_PROOF' : 'NO_PROGRAMMATIC_METHOD_WORKED';
    } catch (e) {
      state.final = `STOPPED:${e?.message || 'ERROR'}`;
      log('run-stop', { reason: e?.message || 'ERROR' });
    } finally {
      state.running = false;
      state.finishedAt = now();
      playBtn.disabled = false;
      playBtn.textContent = 'PLAY AGAIN';
      copyBtn.hidden = false;
      setStatus(summary());
    }
  }

  function report() {
    return {
      schema: 'gitl-followup-matrix-v1',
      version: VERSION,
      platform: platform(),
      host: state.host,
      startedAt: state.startedAt,
      finishedAt: state.finishedAt,
      final: state.final,
      manualCheck: state.manualCheck,
      tests: state.tests,
      events: state.events,
      privacy: 'No conversation text is collected. Only tester-owned canary prompts, state counts, timings, and pass/fail outcomes are reported.'
    };
  }

  function summary() {
    if (state.running) return 'Running…';
    if (!state.startedAt) return 'Press PLAY once. It will test multiple methods and follow-up sends automatically.';
    const p = state.tests.filter(t => t.result === 'PASS').length;
    const f = state.tests.filter(t => t.result === 'FAIL').length;
    const u = state.tests.filter(t => t.result === 'UNCERTAIN').length;
    return `${state.final}\nPASS ${p} · FAIL ${f} · UNCERTAIN ${u}\nPress COPY REPORT and paste it back into ChatGPT.`;
  }

  function setStatus(text) { statusEl.textContent = text; }

  function buildUi() {
    host = document.createElement('div');
    host.id = 'gitl-followup-matrix-host';
    host.style.cssText = 'all:initial;position:fixed;right:8px;bottom:max(8px,env(safe-area-inset-bottom));z-index:2147483647;display:block;pointer-events:auto;';
    shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = ':host{all:initial}.box{box-sizing:border-box;width:min(320px,calc(100vw - 16px));background:#0b1020;color:#fff;border:1px solid #64748b;border-radius:12px;padding:10px;box-shadow:0 8px 30px #0009;font:13px/1.35 system-ui,sans-serif}.title{font-weight:800;margin-bottom:7px}.status{white-space:pre-wrap;margin:0 0 8px}.row{display:flex;gap:7px}.btn{appearance:none;border:0;border-radius:9px;padding:10px 12px;font:800 14px system-ui,sans-serif;cursor:pointer;background:#fff;color:#111827;flex:1}.btn:disabled{opacity:.55;cursor:default}.copy{background:#cbd5e1}';
    const box = document.createElement('div'); box.className = 'box';
    const title = document.createElement('div'); title.className = 'title'; title.textContent = 'GITL FOLLOW-UP TEST';
    statusEl = document.createElement('div'); statusEl.className = 'status'; statusEl.textContent = summary();
    const row = document.createElement('div'); row.className = 'row';
    playBtn = document.createElement('button'); playBtn.className = 'btn'; playBtn.textContent = 'PLAY'; playBtn.type = 'button';
    copyBtn = document.createElement('button'); copyBtn.className = 'btn copy'; copyBtn.textContent = 'COPY REPORT'; copyBtn.type = 'button'; copyBtn.hidden = true;
    playBtn.addEventListener('click', runMatrix);
    copyBtn.addEventListener('click', async () => {
      const text = JSON.stringify(report(), null, 2);
      try { GM_setClipboard(text, 'text'); }
      catch (_) { try { await navigator.clipboard.writeText(text); } catch (_) {} }
      copyBtn.textContent = 'COPIED';
      setTimeout(() => { copyBtn.textContent = 'COPY REPORT'; }, 1500);
    });
    row.append(playBtn, copyBtn); box.append(title, statusEl, row); shadow.append(style, box);
    document.documentElement.appendChild(host);
  }

  buildUi();
})();
