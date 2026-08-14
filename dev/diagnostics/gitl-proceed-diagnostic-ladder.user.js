// ==UserScript==
// @name         GITL Proceed Diagnostic Ladder
// @namespace    https://github.com/MShneur/ghost-in-the-loop
// @version      0.1.0
// @description  Field diagnostic for Ghost in the Loop Proceed/Send failures. One explicit method per run; local redacted reports only.
// @match        https://chatgpt.com/*
// @match        https://www.perplexity.ai/*
// @grant        GM_info
// @grant        GM_setClipboard
// ==/UserScript==

(() => {
  'use strict';

  const VERSION = '0.1.0';
  const REPORT = {
    tool: 'GITL Proceed Diagnostic Ladder',
    version: VERSION,
    startedAt: new Date().toISOString(),
    host: location.hostname.includes('perplexity') ? 'Perplexity' : 'ChatGPT',
    manager: typeof GM_info === 'object' ? {
      name: GM_info.scriptHandler || 'unknown',
      version: GM_info.version || 'unknown',
      injectInto: GM_info.injectInto || 'unknown'
    } : null,
    ghostBoot: document.documentElement.getAttribute('data-gitl-boot') || null,
    ghostPanelPresent: !!document.querySelector('#gitl'),
    runs: []
  };

  let locked = false;
  let currentRun = null;

  const now = () => new Date().toISOString();
  const txt = (el) => (el?.innerText || el?.textContent || el?.value || '').trim();
  const visible = (el) => {
    if (!el || !el.isConnected) return false;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0' && r.width > 0 && r.height > 0;
  };
  const enabled = (el) => !!el && !el.disabled && el.getAttribute('aria-disabled') !== 'true';
  const safeButton = (el) => visible(el) && enabled(el) && el.getAttribute('aria-haspopup') !== 'menu';

  function fingerprint(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  function composerCandidates() {
    const selectors = location.hostname.includes('perplexity')
      ? ['textarea', '[contenteditable="true"][role="textbox"]', '[contenteditable="true"]']
      : ['#prompt-textarea', 'textarea', '[contenteditable="true"][role="textbox"]'];
    return [...new Set(selectors.flatMap(s => [...document.querySelectorAll(s)]))]
      .filter(el => visible(el) && !el.closest('#gitl') && !el.closest('#gitl-proceed-ladder'));
  }

  function exactComposer() {
    const c = composerCandidates();
    if (c.length !== 1) return { el: null, count: c.length };
    return { el: c[0], count: 1 };
  }

  function reviewedButtons() {
    const selectors = [
      'button#composer-submit-button',
      'button[data-testid="send-button"]',
      'button[aria-label="Send prompt"]',
      'button[aria-label="Send message"]',
      'button[aria-label="Submit"]'
    ];
    return [...new Set(selectors.flatMap(s => [...document.querySelectorAll(s)]))]
      .filter(b => safeButton(b) && !b.closest('#gitl') && !b.closest('#gitl-proceed-ladder'));
  }

  function semanticButtons(composer) {
    const scope = composer?.closest('form') || composer?.parentElement?.parentElement || document;
    return [...scope.querySelectorAll('button')].filter(b => {
      if (!safeButton(b) || b.closest('#gitl') || b.closest('#gitl-proceed-ladder')) return false;
      const name = `${b.getAttribute('aria-label') || ''} ${b.getAttribute('title') || ''} ${txt(b)}`.trim();
      return /^(send|send prompt|send message|submit)$/i.test(name);
    });
  }

  function snapshot(stage, extra = {}) {
    const c = exactComposer();
    const content = c.el ? txt(c.el) : '';
    const reviewed = reviewedButtons();
    const semantic = semanticButtons(c.el);
    const s = {
      at: now(), stage,
      composerCount: c.count,
      composerConnected: !!c.el?.isConnected,
      composerChars: content.length,
      composerFingerprint: content ? fingerprint(content) : null,
      reviewedSendCount: reviewed.length,
      semanticSendCount: semantic.length,
      ghostBoot: document.documentElement.getAttribute('data-gitl-boot') || null,
      ghostPanelPresent: !!document.querySelector('#gitl'),
      ...extra
    };
    currentRun?.stages.push(s);
    renderStatus(`${stage} | composer:${s.composerCount} reviewed:${s.reviewedSendCount} semantic:${s.semanticSendCount}`);
    return { snap: s, composer: c.el, reviewed, semantic };
  }

  async function observeAfterActuation(beforeText) {
    const beforeFp = fingerprint(beforeText || '');
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 200));
      const c = exactComposer();
      const nowText = c.el ? txt(c.el) : '';
      const stop = [...document.querySelectorAll('button')].some(b => safeButton(b) && /stop/i.test(`${b.getAttribute('aria-label') || ''} ${txt(b)}`));
      const changed = nowText !== beforeText;
      if (changed || stop) {
        snapshot('OBSERVE-CHANGED', { beforeFingerprint: beforeFp, composerChanged: changed, stopVisible: stop });
        return { changed, stop };
      }
    }
    snapshot('OBSERVE-TIMEOUT', { beforeFingerprint: beforeFp });
    return { changed: false, stop: false };
  }

  function begin(id, label) {
    if (locked) throw new Error('A method has already actuated in this page load. Reload before another method.');
    currentRun = { id, label, startedAt: now(), stages: [], result: 'running' };
    REPORT.runs.push(currentRun);
    snapshot('BEGIN');
  }

  function finish(result, code, note) {
    currentRun.result = result;
    currentRun.code = code;
    currentRun.note = note || '';
    currentRun.finishedAt = now();
    renderStatus(`${code} — ${note || result}`);
  }

  function requireOneComposer() {
    const { composer, snap } = snapshot('ACQUIRE');
    if (!composer) throw new Error(`COMPOSER-${snap.composerCount === 0 ? 'MISSING' : 'AMBIGUOUS'}`);
    return composer;
  }

  async function runMethod(id) {
    const def = METHODS[id - 1];
    begin(id, def.name);
    try {
      await def.run();
    } catch (e) {
      finish('failed', 'EXCEPTION', String(e?.message || e));
    }
  }

  const METHODS = [
    {
      name: '1. Observe only — manager/Ghost/composer/Send boundary',
      risk: 'none',
      run: async () => {
        snapshot('OBSERVE-ONLY');
        finish('complete', 'T1-OBSERVE', 'No input and no Send actuation. Use this first.');
      }
    },
    {
      name: '2. Injection survival — current composer identity/text stability',
      risk: 'no send',
      run: async () => {
        const c = requireOneComposer();
        const before = txt(c);
        const idBefore = c;
        await new Promise(r => setTimeout(r, 100));
        const a = exactComposer();
        await new Promise(r => setTimeout(r, 100));
        const b = exactComposer();
        snapshot('RECONCILE', {
          sameNodeObservation1: a.el === idBefore,
          sameNodeObservation2: b.el === a.el,
          exactTextSurvived: !!b.el && txt(b.el) === before,
          originalFingerprint: before ? fingerprint(before) : null
        });
        finish('complete', 'T2-SURVIVAL', 'No Send. If exactTextSurvived=true, injection is probably not the P0 boundary.');
      }
    },
    {
      name: '3. Reacquire after editor churn — exact staged text wins',
      risk: 'no send',
      run: async () => {
        const c = requireOneComposer();
        const expected = txt(c);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const matches = composerCandidates().filter(el => txt(el) === expected);
        snapshot('EXACT-TEXT-REACQUIRE', { exactPromptComposerCount: matches.length, reacquiredDifferentNode: matches.length === 1 && matches[0] !== c });
        finish('complete', matches.length === 1 ? 'T3-REACQUIRE-OK' : 'T3-REACQUIRE-FAIL', `Exact prompt-bearing composer count=${matches.length}`);
      }
    },
    {
      name: '4. Authority census — reviewed vs semantic Send candidates',
      risk: 'no send',
      run: async () => {
        const c = requireOneComposer();
        const r = reviewedButtons();
        const s = semanticButtons(c);
        snapshot('AUTHORITY-CENSUS', { reviewedExactOne: r.length === 1, semanticExactOne: s.length === 1, sameAuthority: r.length === 1 && s.length === 1 && r[0] === s[0] });
        finish('complete', 'T4-AUTHORITY', 'No Send. This tells us whether exact-one selector authority is the blocker.');
      }
    },
    {
      name: '5. Primary-like exact reviewed button .click()',
      risk: 'sends one message',
      run: async () => {
        const c = requireOneComposer();
        const before = txt(c);
        const r = reviewedButtons();
        snapshot('PRE-ACTUATION', { method: 'reviewed-click', candidateCount: r.length });
        if (r.length !== 1) return finish('failed', 'T5-AUTHORITY-NOT-EXACT', `Reviewed candidate count=${r.length}; nothing sent.`);
        locked = true;
        r[0].click();
        snapshot('ACTUATED', { method: 'HTMLElement.click' });
        const o = await observeAfterActuation(before);
        finish(o.changed || o.stop ? 'candidate-worked' : 'uncertain', o.changed || o.stop ? 'T5-DISPATCH-EVIDENCE' : 'T5-NO-DISPATCH-EVIDENCE', 'Reload before trying another send method.');
      }
    },
    {
      name: '6. Semantic exact-one button .click() within composer form',
      risk: 'sends one message',
      run: async () => {
        const c = requireOneComposer();
        const before = txt(c);
        const s = semanticButtons(c);
        snapshot('PRE-ACTUATION', { method: 'semantic-click', candidateCount: s.length });
        if (s.length !== 1) return finish('failed', 'T6-SEMANTIC-NOT-EXACT', `Semantic candidate count=${s.length}; nothing sent.`);
        locked = true;
        s[0].click();
        snapshot('ACTUATED', { method: 'semantic HTMLElement.click' });
        const o = await observeAfterActuation(before);
        finish(o.changed || o.stop ? 'candidate-worked' : 'uncertain', o.changed || o.stop ? 'T6-DISPATCH-EVIDENCE' : 'T6-NO-DISPATCH-EVIDENCE', 'Experimental diagnostic authority; do not promote unless field evidence supports it.');
      }
    },
    {
      name: '7. Exact reviewed button MouseEvent dispatch',
      risk: 'sends one message',
      run: async () => {
        const c = requireOneComposer();
        const before = txt(c);
        const r = reviewedButtons();
        if (r.length !== 1) return finish('failed', 'T7-AUTHORITY-NOT-EXACT', `Reviewed candidate count=${r.length}; nothing sent.`);
        locked = true;
        r[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true, view: window }));
        snapshot('ACTUATED', { method: 'MouseEvent(click)', isTrustedExpected: false });
        const o = await observeAfterActuation(before);
        finish(o.changed || o.stop ? 'candidate-worked' : 'uncertain', o.changed || o.stop ? 'T7-DISPATCH-EVIDENCE' : 'T7-NO-DISPATCH-EVIDENCE', 'Synthetic event test only; JavaScript cannot manufacture isTrusted=true.');
      }
    },
    {
      name: '8. Composer form requestSubmit(exact reviewed button)',
      risk: 'sends one message',
      run: async () => {
        const c = requireOneComposer();
        const before = txt(c);
        const r = reviewedButtons();
        const form = c.closest('form');
        snapshot('PRE-ACTUATION', { method: 'requestSubmit', hasForm: !!form, candidateCount: r.length });
        if (!form || r.length !== 1 || typeof form.requestSubmit !== 'function') return finish('failed', 'T8-NOT-AVAILABLE', 'Missing unique reviewed submitter/form/requestSubmit; nothing sent.');
        locked = true;
        form.requestSubmit(r[0]);
        snapshot('ACTUATED', { method: 'form.requestSubmit(submitter)' });
        const o = await observeAfterActuation(before);
        finish(o.changed || o.stop ? 'candidate-worked' : 'uncertain', o.changed || o.stop ? 'T8-DISPATCH-EVIDENCE' : 'T8-NO-DISPATCH-EVIDENCE', 'Diagnostic only; not a generic production fallback.');
      }
    },
    {
      name: '9. Synthetic Enter on authoritative composer',
      risk: 'may send one message',
      run: async () => {
        const c = requireOneComposer();
        const before = txt(c);
        locked = true;
        for (const type of ['keydown', 'keypress', 'keyup']) c.dispatchEvent(new KeyboardEvent(type, { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true, composed: true }));
        snapshot('ACTUATED', { method: 'synthetic Enter', isTrustedExpected: false });
        const o = await observeAfterActuation(before);
        finish(o.changed || o.stop ? 'candidate-worked' : 'uncertain', o.changed || o.stop ? 'T9-DISPATCH-EVIDENCE' : 'T9-NO-DISPATCH-EVIDENCE', 'Diagnostic only; expected to fail on hosts requiring trusted input.');
      }
    },
    {
      name: '10. Two-phase Proceed candidate — exact text + exact authority + one click',
      risk: 'sends one message',
      run: async () => {
        const first = requireOneComposer();
        const expected = txt(first);
        if (!expected) return finish('failed', 'T10-EMPTY', 'Composer is empty; nothing sent.');
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const exact = composerCandidates().filter(el => txt(el) === expected);
        snapshot('PHASE-1-RECONCILE', { exactPromptComposerCount: exact.length });
        if (exact.length !== 1) return finish('failed', 'T10-COMPOSER-NOT-EXACT', `Exact prompt-bearing composer count=${exact.length}; nothing sent.`);
        await new Promise(r => setTimeout(r, 80));
        const r = reviewedButtons();
        const s = semanticButtons(exact[0]);
        const union = [...new Set([...r, ...s])];
        snapshot('PHASE-2-AUTHORITY', { reviewedCount: r.length, semanticCount: s.length, unionCount: union.length });
        if (union.length !== 1) return finish('failed', 'T10-SEND-NOT-EXACT', `Authority union count=${union.length}; nothing sent.`);
        locked = true;
        union[0].click();
        snapshot('ACTUATED', { method: 'two-phase exact-one click' });
        const o = await observeAfterActuation(expected);
        finish(o.changed || o.stop ? 'candidate-worked' : 'uncertain', o.changed || o.stop ? 'T10-PROCEED-CANDIDATE' : 'T10-UNCERTAIN', 'This is the strongest production candidate if it works consistently in the field.');
      }
    }
  ];

  const host = document.createElement('div');
  host.id = 'gitl-proceed-ladder';
  host.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:2147483647;width:min(420px,calc(100vw - 20px));max-height:72vh;overflow:auto;background:#111;color:#eee;border:1px solid #777;border-radius:10px;padding:10px;font:13px/1.35 system-ui,sans-serif;box-shadow:0 4px 20px #0008';
  const title = document.createElement('div');
  title.textContent = `GITL Proceed Ladder v${VERSION}`;
  title.style.cssText = 'font-weight:700;margin-bottom:6px';
  host.appendChild(title);
  const warning = document.createElement('div');
  warning.textContent = 'Run 1–4 freely. Tests 5–10 may send exactly one message. After any send test, RELOAD before trying another method.';
  warning.style.cssText = 'padding:7px;background:#2a2100;border-radius:7px;margin-bottom:8px';
  host.appendChild(warning);
  const status = document.createElement('div');
  status.id = 'gitl-ladder-status';
  status.textContent = 'Ready. Start with Test 1.';
  status.style.cssText = 'margin:6px 0;padding:6px;background:#222;border-radius:6px;white-space:pre-wrap';
  host.appendChild(status);

  function renderStatus(s) { status.textContent = s; }

  for (let i = 0; i < METHODS.length; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = METHODS[i].name;
    b.style.cssText = 'display:block;width:100%;text-align:left;margin:5px 0;padding:7px;border:1px solid #555;border-radius:6px;background:#191919;color:#eee';
    b.addEventListener('click', () => runMethod(i + 1));
    host.appendChild(b);
  }

  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;gap:6px;margin-top:8px;flex-wrap:wrap';
  const copy = document.createElement('button');
  copy.type = 'button'; copy.textContent = 'Copy redacted report';
  const download = document.createElement('button');
  download.type = 'button'; download.textContent = 'Download JSON';
  for (const b of [copy, download]) b.style.cssText = 'padding:7px;border:1px solid #555;border-radius:6px;background:#222;color:#eee';
  copy.onclick = () => {
    const data = JSON.stringify(REPORT, null, 2);
    if (typeof GM_setClipboard === 'function') GM_setClipboard(data, 'text');
    else navigator.clipboard?.writeText(data);
    renderStatus('Report copied.');
  };
  download.onclick = () => {
    const blob = new Blob([JSON.stringify(REPORT, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gitl-proceed-${REPORT.host.toLowerCase()}-${Date.now()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    renderStatus('Report downloaded.');
  };
  actions.append(copy, download);
  host.appendChild(actions);
  document.documentElement.appendChild(host);
})();
