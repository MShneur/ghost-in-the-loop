// ==UserScript==
// @name         GITL Proceed Endurance Canary
// @namespace    https://github.com/MShneur/ghost-in-the-loop
// @version      0.3.0
// @description  Mobile-first 3/5-cycle endurance and Ghost-loop watcher for Proceed failures.
// @match        https://chatgpt.com/*
// @match        https://www.perplexity.ai/*
// @grant        GM_info
// @grant        GM_setClipboard
// ==/UserScript==

(() => {
  'use strict';

  const VERSION = '0.3.0';
  const HOST = location.hostname.includes('perplexity') ? 'Perplexity' : 'ChatGPT';
  const RID = 'gitl-proceed-endurance-canary';
  const CK = `gitl-endurance-v03-checkpoint-${HOST.toLowerCase()}`;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const now = () => new Date().toISOString();
  const text = (el) => (el?.innerText || el?.textContent || el?.value || '').trim();

  const REPORT = {
    tool: 'GITL Proceed Endurance Canary',
    version: VERSION,
    startedAt: now(),
    host: HOST,
    manager: typeof GM_info === 'object' ? {
      name: GM_info.scriptHandler || 'unknown',
      version: GM_info.version || 'unknown',
      injectInto: GM_info.injectInto || 'unknown'
    } : null,
    environment: {
      mobile: matchMedia('(pointer: coarse)').matches || innerWidth <= 700,
      viewportWidth: innerWidth,
      viewportHeight: innerHeight
    },
    ghostAtStart: ghostSnapshot(),
    recoveredCheckpoint: loadCheckpoint(),
    runs: []
  };

  let currentRun = null;
  let stopped = false;
  let busy = false;
  let UI = null;

  function visible(el) {
    if (!el || !el.isConnected) return false;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0' && r.width > 0 && r.height > 0;
  }

  function enabled(el) {
    return !!el && !el.disabled && el.getAttribute('aria-disabled') !== 'true';
  }

  function safeButton(el) {
    return visible(el) && enabled(el) && el.getAttribute('aria-haspopup') !== 'menu' && !el.closest(`#${RID}`) && !el.closest('#gitl');
  }

  function composerCandidates() {
    const selectors = HOST === 'Perplexity'
      ? ['textarea', '[contenteditable="true"][role="textbox"]', '[contenteditable="true"]']
      : ['#prompt-textarea', 'textarea', '[contenteditable="true"][role="textbox"]'];
    return [...new Set(selectors.flatMap((s) => [...document.querySelectorAll(s)]))]
      .filter((el) => visible(el) && !el.closest(`#${RID}`) && !el.closest('#gitl'));
  }

  function composer() {
    const all = composerCandidates();
    if (HOST === 'ChatGPT') {
      const preferred = all.find((el) => el.id === 'prompt-textarea');
      if (preferred) return { el: preferred, count: all.length, preferred: true };
    }
    return { el: all.length === 1 ? all[0] : null, count: all.length, preferred: false };
  }

  function reviewedSend() {
    const selectors = HOST === 'Perplexity'
      ? [
          'button[aria-label="Submit"]',
          'button[aria-label="Send"]',
          'button[aria-label="Send message"]',
          'button[type="submit"]'
        ]
      : [
          'button#composer-submit-button',
          'button[data-testid="send-button"]',
          'button[aria-label="Send prompt"]',
          'button[aria-label="Send message"]',
          'button[aria-label="Submit"]'
        ];
    return [...new Set(selectors.flatMap((s) => [...document.querySelectorAll(s)]))].filter(safeButton);
  }

  function semanticSend() {
    const c = composer().el;
    const scope = c?.closest('form') || c?.parentElement?.parentElement || document;
    return [...scope.querySelectorAll('button')].filter((b) => {
      if (!safeButton(b)) return false;
      const n = `${b.getAttribute('aria-label') || ''} ${b.getAttribute('title') || ''} ${text(b)}`.trim();
      return /^(send|send prompt|send message|submit|ask)$/i.test(n);
    });
  }

  function authorityUnion() {
    return [...new Set([...reviewedSend(), ...semanticSend()])];
  }

  function stopButtons() {
    return [...document.querySelectorAll('button')].filter((b) => {
      if (!visible(b) || b.closest(`#${RID}`) || b.closest('#gitl')) return false;
      const n = `${b.getAttribute('aria-label') || ''} ${b.getAttribute('title') || ''} ${text(b)}`;
      return /\bstop\b/i.test(n);
    });
  }

  function generationActive() {
    return stopButtons().length > 0;
  }

  function ghostSnapshot() {
    const panel = document.querySelector('#gitl');
    const controls = panel ? [...panel.querySelectorAll('button')] : [];
    const known = controls.map((b) => `${b.getAttribute('aria-label') || ''} ${text(b)}`.trim())
      .filter((s) => /\b(play|proceed|pause|stop|commit)\b/i.test(s))
      .slice(0, 8)
      .map((s) => s.replace(/\s+/g, ' ').slice(0, 40));
    return {
      boot: document.documentElement.getAttribute('data-gitl-boot') || null,
      panelPresent: !!panel,
      knownControls: known,
      disabledKnownControls: panel ? controls.filter((b) => !enabled(b) && /\b(play|proceed|pause|stop|commit)\b/i.test(`${b.getAttribute('aria-label') || ''} ${text(b)}`)).length : 0
    };
  }

  function loadCheckpoint() {
    try {
      const raw = localStorage.getItem(CK);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function saveCheckpoint(data) {
    try { localStorage.setItem(CK, JSON.stringify(data)); } catch (_) {}
  }

  function clearCheckpoint() {
    try { localStorage.removeItem(CK); } catch (_) {}
  }

  function snapshot(stage, extra = {}) {
    const c = composer();
    const s = {
      at: now(),
      stage,
      cycle: currentRun?.cycle || 0,
      composerCandidates: c.count,
      composerPresent: !!c.el,
      composerPreferred: c.preferred,
      composerChars: text(c.el).length,
      reviewedSendCount: reviewedSend().length,
      semanticSendCount: semanticSend().length,
      authorityUnionCount: authorityUnion().length,
      generationActive: generationActive(),
      stopButtonCount: stopButtons().length,
      ghost: ghostSnapshot(),
      ...extra
    };
    currentRun?.stages.push(s);
    saveCheckpoint({
      version: VERSION,
      host: HOST,
      runId: currentRun?.id || null,
      mode: currentRun?.mode || null,
      cycle: currentRun?.cycle || 0,
      stage,
      at: s.at,
      extra
    });
    status(`${currentRun?.mode || ''} C${currentRun?.cycle || 0} · ${stage}`);
    return s;
  }

  function status(msg, kind = 'info') {
    if (!UI) return;
    UI.status.textContent = msg;
    UI.status.dataset.kind = kind;
  }

  function setBusy(v) {
    busy = v;
    if (!UI) return;
    for (const b of UI.actionButtons) b.disabled = v;
    UI.stop.disabled = !v;
  }

  function markerFor(cycle) {
    const nonce = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `GITL-END-${HOST === 'Perplexity' ? 'PX' : 'CG'}-C${cycle}-${nonce}`;
  }

  function setEditorText(el, value) {
    if (!el) return false;
    try { el.focus(); } catch (_) {}

    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) setter.call(el, value); else el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      return true;
    }

    if (el.isContentEditable) {
      try {
        const sel = getSelection();
        const range = document.createRange();
        range.selectNodeContents(el);
        sel.removeAllRanges();
        sel.addRange(range);
        if (document.execCommand?.('selectAll', false, null) !== false && document.execCommand?.('insertText', false, value)) {
          el.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: value, bubbles: true, composed: true }));
          return true;
        }
      } catch (_) {}

      try {
        el.replaceChildren(document.createTextNode(value));
        el.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: value, bubbles: true, composed: true }));
        return true;
      } catch (_) {}
    }
    return false;
  }

  async function waitForStableIdle(timeoutMs = 180000) {
    snapshot('WAIT-IDLE-BEGIN');
    const end = Date.now() + timeoutMs;
    let stable = 0;
    while (Date.now() < end && !stopped) {
      const c = composer();
      const active = generationActive();
      if (c.el && !active) stable += 1; else stable = 0;
      if (stable >= 4) {
        snapshot('IDLE-STABLE', { stablePolls: stable });
        return { ok: true, composer: c.el };
      }
      await sleep(350);
    }
    snapshot('HALT-IDLE-TIMEOUT');
    return { ok: false, code: stopped ? 'STOPPED' : 'IDLE-TIMEOUT' };
  }

  async function stageAndReacquire(marker) {
    const c0 = composer();
    snapshot('STAGE-BEGIN', { marker });
    if (!c0.el) return { ok: false, code: `COMPOSER-${c0.count === 0 ? 'MISSING' : 'AMBIGUOUS'}` };
    if (text(c0.el)) return { ok: false, code: 'COMPOSER-NOT-EMPTY' };
    if (!setEditorText(c0.el, marker)) return { ok: false, code: 'STAGE-SETTER-FAILED' };

    await sleep(220);
    const staged = composerCandidates().filter((el) => text(el).includes(marker));
    snapshot(staged.length === 1 ? 'STAGE-OK' : 'HALT-STAGE', {
      marker,
      exactMarkerComposerCount: staged.length,
      nodeChanged: staged.length === 1 && staged[0] !== c0.el
    });
    if (staged.length !== 1) return { ok: false, code: `STAGE-MATCH-${staged.length}` };

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await sleep(HOST === 'Perplexity' ? 300 : 180);
    const reacquired = composerCandidates().filter((el) => text(el).includes(marker));
    snapshot(reacquired.length === 1 ? 'REACQUIRE-OK' : 'HALT-REACQUIRE', {
      marker,
      exactMarkerComposerCount: reacquired.length,
      nodeChanged: reacquired.length === 1 && reacquired[0] !== staged[0]
    });
    if (reacquired.length !== 1) return { ok: false, code: `REACQUIRE-MATCH-${reacquired.length}` };
    return { ok: true, composer: reacquired[0] };
  }

  async function waitAuthority(timeoutMs = 8000) {
    snapshot('WAIT-AUTHORITY-BEGIN');
    const end = Date.now() + timeoutMs;
    let last = -1;
    while (Date.now() < end && !stopped) {
      const union = authorityUnion();
      last = union.length;
      if (union.length === 1) {
        snapshot('AUTHORITY-READY', { candidateCount: 1 });
        return { ok: true, button: union[0] };
      }
      await sleep(180);
    }
    snapshot('HALT-AUTHORITY', { candidateCount: last });
    return { ok: false, code: stopped ? 'STOPPED' : `AUTHORITY-${last}` };
  }

  async function dispatchAndConfirm(marker, button) {
    snapshot('PRE-ACTUATION', { marker, buttonConnected: !!button?.isConnected });
    if (!button || !button.isConnected) return { ok: false, code: 'BUTTON-STALE' };
    button.click();
    snapshot('ACTUATED', { marker, method: 'exact-one union HTMLElement.click' });

    const end = Date.now() + 12000;
    let sawStart = false;
    let sawClear = false;
    while (Date.now() < end && !stopped) {
      await sleep(150);
      const c = composer().el;
      sawClear ||= !!c && !text(c).includes(marker);
      sawStart ||= generationActive();
      if (sawStart && sawClear) {
        snapshot('DISPATCH-CONFIRMED', { marker, generationStarted: true, composerCleared: true });
        return { ok: true };
      }
    }
    snapshot('HALT-DISPATCH', { marker, generationStarted: sawStart, composerCleared: sawClear });
    return { ok: false, code: stopped ? 'STOPPED' : 'DISPATCH-NOT-CONFIRMED' };
  }

  async function waitGenerationEnd(timeoutMs = 240000) {
    snapshot('WAIT-GENERATION-END-BEGIN');
    const end = Date.now() + timeoutMs;
    let hadActive = generationActive();
    let stableIdle = 0;
    while (Date.now() < end && !stopped) {
      await sleep(400);
      const active = generationActive();
      hadActive ||= active;
      if (hadActive && !active && composer().el) stableIdle += 1; else if (active) stableIdle = 0;
      if (hadActive && stableIdle >= 4) {
        snapshot('GENERATION-END', { stableIdlePolls: stableIdle });
        return { ok: true };
      }
    }
    snapshot('HALT-GENERATION-END', { hadActive });
    return { ok: false, code: stopped ? 'STOPPED' : hadActive ? 'GENERATION-END-TIMEOUT' : 'GENERATION-NEVER-STARTED' };
  }

  async function cleanupOwnMarker(marker) {
    const c = composer().el;
    if (c && text(c).includes(marker)) {
      setEditorText(c, '');
      await sleep(120);
    }
    snapshot('CLEANUP', { markerStillPresent: !!composer().el && text(composer().el).includes(marker) });
  }

  async function runEndurance(cycles) {
    if (busy) return;
    stopped = false;
    currentRun = {
      id: `E${cycles}-${Date.now()}`,
      mode: `E${cycles}-HOST`,
      cyclesRequested: cycles,
      cycle: 0,
      startedAt: now(),
      stages: [],
      result: 'running'
    };
    REPORT.runs.push(currentRun);
    setBusy(true);
    clearCheckpoint();

    try {
      for (let i = 1; i <= cycles; i += 1) {
        currentRun.cycle = i;
        snapshot('CYCLE-BEGIN');

        const idle = await waitForStableIdle();
        if (!idle.ok) throw new Error(`C${i}:${idle.code}`);
        if (text(idle.composer)) throw new Error(`C${i}:COMPOSER-NOT-EMPTY`);

        const marker = markerFor(i);
        const staged = await stageAndReacquire(marker);
        if (!staged.ok) {
          await cleanupOwnMarker(marker);
          throw new Error(`C${i}:${staged.code}`);
        }

        const authority = await waitAuthority(HOST === 'Perplexity' ? 10000 : 7000);
        if (!authority.ok) {
          await cleanupOwnMarker(marker);
          throw new Error(`C${i}:${authority.code}`);
        }

        const sent = await dispatchAndConfirm(marker, authority.button);
        if (!sent.ok) {
          if (!generationActive()) await cleanupOwnMarker(marker);
          throw new Error(`C${i}:${sent.code}`);
        }

        const ended = await waitGenerationEnd();
        if (!ended.ok) throw new Error(`C${i}:${ended.code}`);

        snapshot('CYCLE-PASS', { cyclePassed: i });
      }

      currentRun.result = 'success';
      currentRun.finishedAt = now();
      currentRun.code = `E${cycles}-ALL-CYCLES-PASS`;
      clearCheckpoint();
      status(`E${cycles} ✓ ${cycles}/${cycles} cycles`, 'ok');
    } catch (err) {
      currentRun.result = stopped ? 'stopped' : 'failed';
      currentRun.finishedAt = now();
      currentRun.code = String(err?.message || err);
      snapshot('RUN-HALT', { haltCode: currentRun.code });
      status(`${currentRun.mode} ✕ ${currentRun.code}`, 'fail');
    } finally {
      setBusy(false);
    }
  }

  async function waitForNextGenerationStart(timeoutMs) {
    const end = Date.now() + timeoutMs;
    let composerHadText = false;
    let sendAppeared = false;
    while (Date.now() < end && !stopped) {
      await sleep(250);
      const c = composer().el;
      composerHadText ||= !!c && text(c).length > 0;
      sendAppeared ||= authorityUnion().length === 1;
      if (generationActive()) {
        snapshot('WATCH-GENERATION-START', { composerHadText, sendAppeared });
        return { ok: true };
      }
    }
    snapshot('WATCH-HALT-BEFORE-GENERATION', { composerHadText, sendAppeared });
    return { ok: false, code: stopped ? 'STOPPED' : 'NO-NEXT-GENERATION' };
  }

  async function watchGhost(cycles = 3) {
    if (busy) return;
    stopped = false;
    currentRun = {
      id: `G${cycles}-${Date.now()}`,
      mode: `G${cycles}-WATCH`,
      cyclesRequested: cycles,
      cycle: 0,
      startedAt: now(),
      stages: [],
      result: 'running'
    };
    REPORT.runs.push(currentRun);
    setBusy(true);
    clearCheckpoint();

    try {
      snapshot('WATCH-ARMED', { instruction: 'Tap Ghost Play/Proceed now. Watcher does not actuate host controls.' });
      for (let i = 1; i <= cycles; i += 1) {
        currentRun.cycle = i;
        snapshot('WATCH-CYCLE-BEGIN');
        const started = await waitForNextGenerationStart(i === 1 ? 90000 : 120000);
        if (!started.ok) throw new Error(`C${i}:${started.code}`);
        const ended = await waitGenerationEnd(300000);
        if (!ended.ok) throw new Error(`C${i}:${ended.code}`);
        snapshot('WATCH-CYCLE-PASS', { cycleObserved: i });
      }
      currentRun.result = 'success';
      currentRun.finishedAt = now();
      currentRun.code = `G${cycles}-OBSERVED`;
      clearCheckpoint();
      status(`G${cycles} ✓ observed ${cycles} cycles`, 'ok');
    } catch (err) {
      currentRun.result = stopped ? 'stopped' : 'failed';
      currentRun.finishedAt = now();
      currentRun.code = String(err?.message || err);
      snapshot('WATCH-RUN-HALT', { haltCode: currentRun.code });
      status(`${currentRun.mode} ✕ ${currentRun.code}`, 'fail');
    } finally {
      setBusy(false);
    }
  }

  function copyReport() {
    const payload = JSON.stringify(REPORT, null, 2);
    try {
      if (typeof GM_setClipboard === 'function') GM_setClipboard(payload, 'text');
      else navigator.clipboard?.writeText(payload);
      status('Report copied', 'ok');
    } catch (_) {
      status('Copy failed — use JSON', 'fail');
    }
  }

  function downloadReport() {
    try {
      const blob = new Blob([JSON.stringify(REPORT, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `gitl-endurance-v03-${HOST.toLowerCase()}-${Date.now()}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      status('JSON downloaded', 'ok');
    } catch (_) {
      status('Download failed — use COPY', 'fail');
    }
  }

  function resetReport() {
    if (busy) return;
    REPORT.runs.length = 0;
    REPORT.recoveredCheckpoint = null;
    clearCheckpoint();
    status('Report + checkpoint cleared');
  }

  function build() {
    if (document.getElementById(RID)) return;
    const host = document.createElement('div');
    host.id = RID;
    host.style.cssText = 'position:fixed;top:max(8px,env(safe-area-inset-top));right:8px;z-index:2147483647;pointer-events:none;font-family:system-ui,-apple-system,sans-serif;';
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        *{box-sizing:border-box}button{font:inherit}.pill{pointer-events:auto;height:36px;min-width:62px;padding:0 11px;border:1px solid #777;border-radius:18px;background:#151515;color:#fff;font-weight:800;box-shadow:0 3px 12px #0007}.panel{pointer-events:auto;display:none;width:min(304px,calc(100vw - 12px));padding:7px;border:1px solid #666;border-radius:11px;background:#111;color:#eee;box-shadow:0 6px 24px #0009}.open{display:block}.head{display:flex;gap:6px;align-items:center}.title{flex:1;font-size:12px;font-weight:800}.meta{font-size:9px;opacity:.75}.x{width:30px;height:30px;border:0;border-radius:8px;background:#292929;color:#fff}.status{min-height:38px;margin:6px 0;padding:6px 7px;border-radius:8px;background:#242424;font-size:10.5px;line-height:1.25}.status[data-kind="ok"]{outline:1px solid #428a4c}.status[data-kind="fail"]{outline:1px solid #a64848}.actions{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.a{height:42px;border:1px solid #555;border-radius:9px;background:#1d1d1d;color:#fff;font-size:11px;font-weight:800}.a:disabled,.mini:disabled{opacity:.38}.foot{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:6px}.mini{height:32px;border:1px solid #555;border-radius:8px;background:#202020;color:#eee;font-size:9.5px;font-weight:700}.hint{margin-top:5px;font-size:9px;line-height:1.2;opacity:.72}
      </style>
      <button class="pill" type="button">E TEST</button>
      <div class="panel">
        <div class="head"><div class="title">Proceed Endurance v${VERSION}</div><div class="meta"></div><button class="x" type="button">×</button></div>
        <div class="status" data-kind="info">Ready · E3/E5 sends test markers; G3 only watches Ghost</div>
        <div class="actions">
          <button class="a e3" type="button">E3 HOST</button>
          <button class="a e5" type="button">E5 HOST</button>
          <button class="a g3" type="button">G3 WATCH</button>
        </div>
        <div class="foot">
          <button class="mini stop" type="button">STOP</button>
          <button class="mini copy" type="button">COPY</button>
          <button class="mini json" type="button">JSON</button>
          <button class="mini reset" type="button">RESET</button>
        </div>
        <div class="hint">E3/E5 waits for each generation to FINISH before the next send. G3: tap it, then tap Ghost Play/Proceed; it watches 3 cycles without sending anything itself.</div>
      </div>`;
    document.documentElement.appendChild(host);

    const pill = root.querySelector('.pill');
    const panel = root.querySelector('.panel');
    const statusEl = root.querySelector('.status');
    const e3 = root.querySelector('.e3');
    const e5 = root.querySelector('.e5');
    const g3 = root.querySelector('.g3');
    const stop = root.querySelector('.stop');
    root.querySelector('.meta').textContent = `${HOST === 'Perplexity' ? 'PX' : 'CG'} · ${document.querySelector('#gitl') ? 'G:ON' : 'G:OFF'}`;

    UI = { status: statusEl, stop, actionButtons: [e3, e5, g3] };
    stop.disabled = true;
    pill.onclick = () => panel.classList.toggle('open');
    root.querySelector('.x').onclick = () => panel.classList.remove('open');
    e3.onclick = () => runEndurance(3);
    e5.onclick = () => runEndurance(5);
    g3.onclick = () => watchGhost(3);
    stop.onclick = () => { stopped = true; status('Stopping after current safe observation…', 'fail'); };
    root.querySelector('.copy').onclick = copyReport;
    root.querySelector('.json').onclick = downloadReport;
    root.querySelector('.reset').onclick = resetReport;

    if (REPORT.recoveredCheckpoint) {
      const r = REPORT.recoveredCheckpoint;
      status(`Recovered ${r.mode || 'run'} C${r.cycle || 0} after ${r.stage || 'unknown stage'}`, 'fail');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build, { once: true });
  else build();
})();
