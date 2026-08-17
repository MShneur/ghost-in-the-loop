// ==UserScript==
// @name         GITL Endurance + Failover Tester - ChatGPT + Perplexity
// @namespace    https://github.com/MShneur/ghost-in-the-loop
// @version      0.4.0
// @description  One-button 10-cycle mobile endurance tester with pre-send fallback methods for ChatGPT and Perplexity.
// @match        https://www.perplexity.ai/*
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @run-at       document-idle
// @grant        GM_setClipboard
// @noframes
// ==/UserScript==
(() => {
  'use strict';

  const V = '0.4.0';
  const TOTAL_CYCLES = 10;
  const STAGE_TIMEOUT = 6000;
  const ACK_TIMEOUT = 18000;
  const READY_TIMEOUT = 90000;
  const POLL = 150;

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const now = () => new Date().toISOString();
  const norm = v => String(v ?? '').replace(/\s+/g, ' ').trim();
  const low = v => norm(v).toLowerCase();
  const text = e => String(e?.value ?? e?.innerText ?? e?.textContent ?? '');
  const platform = () => /perplexity\.ai$/i.test(location.hostname)
    ? 'perplexity'
    : (/chatgpt\.com$|chat\.openai\.com$/i.test(location.hostname) ? 'chatgpt' : 'unknown');
  const visible = e => {
    if (!e || !e.isConnected) return false;
    const r = e.getBoundingClientRect();
    const s = getComputedStyle(e);
    return r.width > 1 && r.height > 1 && s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity || 1) > 0;
  };

  const ids = new WeakMap();
  let nextId = 1;
  const id = e => {
    if (!e) return null;
    if (!ids.has(e)) ids.set(e, nextId++);
    return ids.get(e);
  };
  const sig = e => {
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return {
      id: id(e),
      tag: (e.tagName || '').toLowerCase(),
      role: norm(e.getAttribute?.('role')) || null,
      aria: norm(e.getAttribute?.('aria-label')) || null,
      testid: norm(e.getAttribute?.('data-testid')) || null,
      disabled: Boolean(e.disabled) || e.getAttribute?.('aria-disabled') === 'true' || e.hasAttribute?.('data-disabled'),
      box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]
    };
  };

  function editorSelectors() {
    const siteSpecific = platform() === 'chatgpt'
      ? ['#prompt-textarea', '[data-testid="prompt-textarea"]', 'div.ProseMirror[contenteditable="true"]']
      : platform() === 'perplexity'
        ? ['textarea[placeholder*="Ask" i]', '[contenteditable="true"][data-lexical-editor="true"]']
        : [];
    return [...siteSpecific, 'textarea', '[contenteditable="true"]', '[role="textbox"][contenteditable="true"]', '[data-lexical-editor="true"]'];
  }

  function editors() {
    const set = new Set();
    for (const q of editorSelectors()) {
      try {
        document.querySelectorAll(q).forEach(e => {
          if (!visible(e)) return;
          const a = `${low(e.getAttribute('aria-label'))} ${low(e.getAttribute('placeholder'))}`;
          if (/(search settings|rename|filter|search chats|search conversations)/.test(a)) return;
          set.add(e);
        });
      } catch (_) {}
    }
    return [...set];
  }

  function editorScore(e) {
    const r = e.getBoundingClientRect();
    const a = `${low(e.getAttribute('aria-label'))} ${low(e.getAttribute('placeholder'))}`;
    let n = r.bottom + r.width / 20;
    if (document.activeElement === e || e.contains?.(document.activeElement)) n += 100000;
    if (/ask|message|prompt|follow|anything|chat/.test(a)) n += 8000;
    if (e.id === 'prompt-textarea' || e.getAttribute('data-testid') === 'prompt-textarea') n += 12000;
    if (e.closest('form')) n += 2500;
    if (r.top > innerHeight * 0.4) n += 1500;
    return n;
  }

  function findEditor() {
    const all = editors().sort((a, b) => editorScore(b) - editorScore(a));
    return { editor: all[0] || null, count: all.length, all };
  }

  function sendSelectors() {
    const siteSpecific = platform() === 'chatgpt'
      ? ['button[data-testid="send-button"]', 'button[aria-label*="Send" i]']
      : platform() === 'perplexity'
        ? ['button[aria-label*="Submit" i]', 'button[aria-label*="Send" i]']
        : [];
    return [...siteSpecific, 'button[type="submit"]', 'button[data-testid*="send" i]', 'button[data-testid*="submit" i]', 'button[aria-label*="send" i]', 'button[aria-label*="submit" i]', '[role="button"][aria-label*="send" i]', '[role="button"][aria-label*="submit" i]'];
  }

  const enabled = e => Boolean(e) && visible(e) && !e.disabled && e.getAttribute('aria-disabled') !== 'true' && !e.hasAttribute('data-disabled');

  function sendScore(e, ed) {
    if (!visible(e)) return -1e9;
    const r = e.getBoundingClientRect();
    const a = `${low(e.getAttribute('aria-label'))} ${low(e.getAttribute('data-testid'))} ${low(e.textContent)}`;
    const t = low(e.getAttribute('type'));
    let n = 0;
    if (/send message|send prompt|(^|[-_ ])send($|[-_ ])/.test(a)) n += 100;
    if (/submit prompt|(^|[-_ ])submit($|[-_ ])/.test(a)) n += 85;
    if (t === 'submit') n += 35;
    if (ed && e.closest('form') && ed.closest('form') === e.closest('form')) n += 65;
    if (ed) {
      const x = ed.getBoundingClientRect();
      if (Math.abs(r.left - x.right) < 300 && Math.abs(r.top - x.top) < 250) n += 25;
    }
    if (r.top > innerHeight * 0.4) n += 10;
    if (/feedback|report|share|upload|voice|mic|search/.test(a)) n -= 120;
    return n;
  }

  function sends(ed = findEditor().editor) {
    const set = new Set();
    for (const q of sendSelectors()) {
      try { document.querySelectorAll(q).forEach(e => visible(e) && set.add(e)); } catch (_) {}
    }
    return [...set]
      .map(e => ({ e, score: sendScore(e, ed) }))
      .filter(x => x.score >= 50)
      .sort((a, b) => b.score - a.score);
  }

  function authority(ed = findEditor().editor) {
    const c = sends(ed);
    const en = c.filter(x => enabled(x.e));
    const a = en[0];
    const b = en[1];
    const amb = Boolean(a && b && a.score - b.score < 20);
    return { c, en, amb, button: a && !amb ? a.e : null, count: c.length, enabledCount: en.length, top: a?.score ?? null };
  }

  function generationElements() {
    const set = new Set();
    const qs = ['button[aria-label*="stop" i]', 'button[data-testid*="stop" i]', '[role="button"][aria-label*="stop" i]', 'button[aria-label*="cancel" i]'];
    for (const q of qs) {
      try { document.querySelectorAll(q).forEach(e => visible(e) && set.add(e)); } catch (_) {}
    }
    return [...set].filter(e => !/stop sharing|stop listening/i.test(norm(e.getAttribute('aria-label'))));
  }
  const generating = () => generationElements().length > 0;

  function siteState() {
    const f = findEditor();
    const a = authority(f.editor);
    return {
      at: now(),
      url: `${location.origin}${location.pathname}`,
      title: document.title,
      viewport: [innerWidth, innerHeight, devicePixelRatio || 1],
      editorCount: f.count,
      editor: sig(f.editor),
      send: { candidates: a.count, enabled: a.enabledCount, ambiguous: a.amb, top: a.top },
      generating: generating()
    };
  }

  function setVal(e, v) {
    if (e instanceof HTMLTextAreaElement) {
      const s = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
      s ? s.call(e, v) : (e.value = v);
    } else if (e instanceof HTMLInputElement) {
      const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      s ? s.call(e, v) : (e.value = v);
    } else {
      e.textContent = '';
      e.appendChild(document.createTextNode(v));
    }
  }

  function input(e, type, data) {
    try {
      e.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: type, data }));
    } catch (_) {
      e.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    }
  }

  function clear(e) {
    if (!e) return;
    try {
      e.focus();
      setVal(e, '');
      input(e, 'deleteContentBackward', null);
      e.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (_) {}
  }

  function selectAll(e) {
    e.focus();
    if (e instanceof HTMLTextAreaElement || e instanceof HTMLInputElement) {
      e.select?.();
      return;
    }
    const s = getSelection();
    if (!s) return;
    const r = document.createRange();
    r.selectNodeContents(e);
    s.removeAllRanges();
    s.addRange(r);
  }

  async function nativeSetter(e, v) {
    e.focus();
    setVal(e, v);
    input(e, 'insertText', v);
    e.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function execCommandMethod(e, v) {
    e.focus();
    selectAll(e);
    let ok = false;
    try { ok = document.execCommand('insertText', false, v); } catch (_) {}
    if (!ok || !norm(text(e)).includes(v)) setVal(e, v);
    input(e, 'insertText', v);
  }

  async function beforeInput(e, v) {
    e.focus();
    clear(e);
    try {
      e.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, composed: true, cancelable: true, inputType: 'insertText', data: v }));
    } catch (_) {}
    setVal(e, v);
    input(e, 'insertText', v);
  }

  async function rangeInput(e, v) {
    e.focus();
    if (e instanceof HTMLTextAreaElement || e instanceof HTMLInputElement) return nativeSetter(e, v);
    selectAll(e);
    const s = getSelection();
    const r = s?.rangeCount ? s.getRangeAt(0) : null;
    if (!r) return nativeSetter(e, v);
    r.deleteContents();
    const n = document.createTextNode(v);
    r.insertNode(n);
    r.setStartAfter(n);
    r.collapse(true);
    s.removeAllRanges();
    s.addRange(r);
    input(e, 'insertText', v);
  }

  async function pasteInput(e, v) {
    e.focus();
    clear(e);
    try {
      const d = new DataTransfer();
      d.setData('text/plain', v);
      e.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, composed: true, cancelable: true, clipboardData: d }));
    } catch (_) {}
    setVal(e, v);
    input(e, 'insertFromPaste', v);
  }

  async function keyCycle(e, v) {
    e.focus();
    clear(e);
    try { e.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, composed: true, key: 'a' })); } catch (_) {}
    setVal(e, v);
    input(e, 'insertText', v);
    try { e.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, composed: true, key: 'a' })); } catch (_) {}
    e.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function compositionInput(e, v) {
    e.focus();
    clear(e);
    try {
      e.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
      e.dispatchEvent(new CompositionEvent('compositionupdate', { bubbles: true, data: v }));
    } catch (_) {}
    setVal(e, v);
    try { e.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: v })); } catch (_) {}
    input(e, 'insertCompositionText', v);
  }

  const METHODS = [
    ['native-setter', nativeSetter],
    ['execcommand', execCommandMethod],
    ['beforeinput', beforeInput],
    ['range-input', rangeInput],
    ['paste-input', pasteInput],
    ['keycycle-input', keyCycle],
    ['composition-input', compositionInput]
  ];
  const methodByName = new Map(METHODS);

  function preferredForCycle(cycle) {
    if (cycle <= 4) return 'native-setter';
    return ['execcommand', 'beforeinput', 'range-input', 'paste-input', 'keycycle-input', 'native-setter'][cycle - 5] || 'native-setter';
  }

  function orderFor(preferred) {
    const names = METHODS.map(x => x[0]);
    return [preferred, ...names.filter(n => n !== preferred)];
  }

  async function waitForEnabledSend(ed) {
    const end = Date.now() + STAGE_TIMEOUT;
    let a = authority(ed);
    while (Date.now() < end) {
      a = authority(findEditor().editor || ed);
      if (a.amb) return { ok: false, stop: true, reason: 'AMBIGUOUS_SEND', ...a };
      if (a.button) return { ok: true, stop: false, ...a };
      await sleep(POLL);
    }
    a = authority(findEditor().editor || ed);
    return { ok: false, stop: false, reason: a.amb ? 'AMBIGUOUS_SEND' : 'SEND_DISABLED_TIMEOUT', ...a };
  }

  async function waitAck(ed, marker, value) {
    const end = Date.now() + ACK_TIMEOUT;
    while (Date.now() < end) {
      const cur = findEditor().editor || ed;
      const ct = norm(text(cur));
      const cleared = ct !== norm(value) && !ct.includes(marker);
      const outside = cleared && norm(document.body?.innerText).includes(marker);
      const active = generating();
      const replaced = cur !== ed;
      if (cleared && (outside || active)) return { ok: true, cleared, outside, active, replaced, editorAfter: id(cur) };
      await sleep(POLL);
    }
    const cur = findEditor().editor || ed;
    return {
      ok: false,
      cleared: !norm(text(cur)).includes(marker),
      outside: norm(document.body?.innerText).includes(marker),
      active: generating(),
      replaced: cur !== ed,
      editorAfter: id(cur)
    };
  }

  async function waitReady() {
    const end = Date.now() + READY_TIMEOUT;
    let seenGeneration = generating();
    let quietSince = null;
    while (Date.now() < end) {
      const active = generating();
      if (active) {
        seenGeneration = true;
        quietSince = null;
      } else {
        if (quietSince === null) quietSince = Date.now();
        const f = findEditor();
        if (f.editor && Date.now() - quietSince >= (seenGeneration ? 900 : 2200)) {
          return { ok: true, seenGeneration, editor: id(f.editor) };
        }
      }
      await sleep(250);
    }
    return { ok: false, seenGeneration, active: generating(), editor: id(findEditor().editor) };
  }

  async function runCycle(cycle) {
    const preferred = preferredForCycle(cycle);
    const valueMarker = `GITL-ENDURANCE-${Date.now().toString(36)}-${cycle}`;
    const value = `Proceed - ${valueMarker}. Reply only: OK-${cycle}`;
    const record = {
      cycle,
      preferred,
      result: 'FAIL',
      reason: null,
      selectedMethod: null,
      attempts: [],
      before: siteState(),
      after: null,
      clicked: false,
      ack: null,
      ready: null,
      elapsed: null
    };
    const started = Date.now();

    for (const methodName of orderFor(preferred)) {
      const method = methodByName.get(methodName);
      const f = findEditor();
      if (!f.editor) {
        record.reason = 'NO_EDITOR';
        break;
      }
      const ed = f.editor;
      const attempt = {
        method: methodName,
        editor: id(ed),
        stageVisible: false,
        send: null,
        reason: null
      };
      record.attempts.push(attempt);

      clear(ed);
      await sleep(120);
      try {
        await method(ed, value);
      } catch (e) {
        attempt.reason = `STAGE_EXCEPTION:${String(e?.message || e).slice(0, 80)}`;
        clear(findEditor().editor || ed);
        await sleep(180);
        continue;
      }
      await sleep(220);

      const reacquired = findEditor().editor || ed;
      attempt.editorAfterStage = id(reacquired);
      attempt.editorReplacedDuringStage = reacquired !== ed;
      attempt.stageVisible = norm(text(reacquired)).includes(valueMarker);
      if (!attempt.stageVisible) {
        attempt.reason = 'TEXT_NOT_VISIBLE';
        clear(reacquired);
        await sleep(180);
        continue;
      }

      const a = await waitForEnabledSend(reacquired);
      attempt.send = { candidates: a.count, enabled: a.enabledCount, ambiguous: a.amb, top: a.top };
      if (!a.ok) {
        attempt.reason = a.reason;
        if (a.stop) {
          record.reason = a.reason;
          record.result = 'STOPPED';
          record.after = siteState();
          record.elapsed = Date.now() - started;
          return record;
        }
        clear(findEditor().editor || reacquired);
        await sleep(220);
        continue;
      }

      // Safety boundary: once this click happens, no alternate method may be tried for this cycle.
      record.selectedMethod = methodName;
      a.button.click();
      record.clicked = true;

      record.ack = await waitAck(reacquired, valueMarker, value);
      if (!record.ack.ok) {
        record.result = 'STOPPED';
        record.reason = 'SEND_ACK_TIMEOUT';
        record.after = siteState();
        record.elapsed = Date.now() - started;
        return record;
      }

      record.ready = await waitReady();
      if (!record.ready.ok) {
        record.result = 'STOPPED';
        record.reason = record.ready.active ? 'READY_TIMEOUT_GENERATING' : 'READY_TIMEOUT_AFTER_ACK';
        record.after = siteState();
        record.elapsed = Date.now() - started;
        return record;
      }

      record.result = 'PASS';
      record.after = siteState();
      record.elapsed = Date.now() - started;
      return record;
    }

    record.reason = record.reason || 'ALL_METHODS_FAILED_PRE_SEND';
    record.after = siteState();
    record.elapsed = Date.now() - started;
    return record;
  }

  const state = {
    version: V,
    platform: platform(),
    host: location.hostname,
    totalCycles: TOTAL_CYCLES,
    running: false,
    started: null,
    finished: null,
    final: 'NOT RUN',
    cycles: [],
    stopped: false
  };

  let host, shadow, status, runBtn, copyBtn, againBtn;
  const setStatus = s => { if (status) status.textContent = s; };

  async function run() {
    if (state.running) return;
    state.running = true;
    state.started = now();
    state.finished = null;
    state.final = 'RUNNING';
    state.cycles = [];
    state.stopped = false;
    runBtn.disabled = true;
    copyBtn.hidden = true;
    againBtn.hidden = true;

    try {
      for (let cycle = 1; cycle <= TOTAL_CYCLES; cycle++) {
        setStatus(`Cycle ${cycle}/${TOTAL_CYCLES}: preferred ${preferredForCycle(cycle)}...`);
        const rec = await runCycle(cycle);
        state.cycles.push(rec);

        if (rec.result !== 'PASS') {
          state.stopped = true;
          state.final = `${rec.result}: cycle ${cycle} - ${rec.reason}`;
          break;
        }

        const fallbackNote = rec.attempts.length > 1 ? ` (fallback ${rec.selectedMethod})` : '';
        setStatus(`Cycle ${cycle}/${TOTAL_CYCLES} PASS via ${rec.selectedMethod}${fallbackNote}`);
        await sleep(700);
      }

      if (!state.stopped) {
        const fallbackCycles = state.cycles.filter(c => c.attempts.length > 1);
        const methodsUsed = [...new Set(state.cycles.map(c => c.selectedMethod))];
        const backupsDirectlyProven = [...new Set(state.cycles.filter(c => c.cycle >= 5).map(c => c.selectedMethod))];
        state.final = `PASS: ${state.cycles.length}/${TOTAL_CYCLES} cycles; used ${methodsUsed.join(', ')}; backup phase ${backupsDirectlyProven.join(', ') || 'none'}; fallback events ${fallbackCycles.length}`;
      }
    } catch (e) {
      state.stopped = true;
      state.final = `TESTER ERROR: ${String(e?.message || e).slice(0, 120)}`;
    } finally {
      state.finished = now();
      state.running = false;
      runBtn.disabled = false;
      copyBtn.hidden = false;
      againBtn.hidden = false;
      setStatus(state.final);
    }
  }

  function report() {
    const lines = [
      `GITL ENDURANCE BOTH v${V}`,
      `Host: ${state.host} (${state.platform})`,
      `Final: ${state.final}`,
      `Started: ${state.started || '-'}`,
      `Finished: ${state.finished || '-'}`,
      ''
    ];
    for (const c of state.cycles) {
      const tries = c.attempts.map(a => `${a.method}:${a.reason || (a.stageVisible ? 'READY' : 'NO_STAGE')}`).join(' > ');
      lines.push(`C${c.cycle} | ${c.result} | preferred=${c.preferred} | used=${c.selectedMethod || '-'} | tries=${c.attempts.length} | clicked=${c.clicked ? 'Y' : 'N'} | reason=${c.reason || 'OK'} | ${c.elapsed || 0}ms`);
      lines.push(`    ${tries}`);
    }
    lines.push('', 'DETAIL JSON:', JSON.stringify(state, null, 2));
    return lines.join('\n');
  }

  async function copyReport() {
    const r = report();
    try {
      if (typeof GM_setClipboard === 'function') {
        GM_setClipboard(r, 'text');
        setStatus('Report copied. Paste it into ChatGPT.');
        return;
      }
    } catch (_) {}
    try {
      await navigator.clipboard.writeText(r);
      setStatus('Report copied. Paste it into ChatGPT.');
    } catch (_) {
      setStatus('Copy blocked. Run window.__GITL_ENDURANCE_REPORT__()');
    }
  }

  function mount() {
    if (document.getElementById('gitl-endurance-both-host')) return;
    host = document.createElement('div');
    host.id = 'gitl-endurance-both-host';
    host.style.cssText = 'position:fixed;right:8px;bottom:8px;z-index:2147483647;width:min(300px,calc(100vw - 16px));max-width:300px;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif';
    document.documentElement.appendChild(host);
    shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>*{box-sizing:border-box}.c{background:#111;color:#fff;border:1px solid #444;border-radius:12px;padding:10px;box-shadow:0 8px 26px #0006;font-size:13px}.t{font-weight:700;margin-bottom:6px}.s{background:#1b1b1b;border-radius:8px;padding:8px;margin-bottom:8px;max-height:84px;overflow:auto;word-break:break-word}.r{display:flex;gap:6px;flex-wrap:wrap}button{border:0;border-radius:9px;padding:10px 12px;font-weight:700;font-size:13px;min-height:40px;cursor:pointer;flex:1}button:disabled{opacity:.5}button[hidden]{display:none}.h{font-size:11px;color:#bbb;margin-top:7px}</style><div class="c"><div class="t">GITL Endurance Tester v${V}</div><div class="s" id="s">Ready on ${platform()}. Runs ${TOTAL_CYCLES} consecutive cycles.</div><div class="r"><button id="p">RUN 10 CYCLES</button><button id="c" hidden>COPY REPORT</button><button id="a" hidden>RUN AGAIN</button></div><div class="h">First 4 cycles stress the same native method. Later cycles directly exercise backups. Fallbacks happen only before Send. Any uncertain post-click state stops the test.</div></div>`;
    status = shadow.getElementById('s');
    runBtn = shadow.getElementById('p');
    copyBtn = shadow.getElementById('c');
    againBtn = shadow.getElementById('a');
    runBtn.onclick = run;
    copyBtn.onclick = copyReport;
    againBtn.onclick = run;
  }

  window.__GITL_ENDURANCE_REPORT__ = report;
  mount();
})();