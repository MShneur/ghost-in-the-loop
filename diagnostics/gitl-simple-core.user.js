// ==UserScript==
// @name         Ghost in the Loop - Simple Core Canary
// @namespace    https://github.com/MShneur/ghost-in-the-loop/simple-core
// @version      0.1.0
// @description  Minimal auto-proceed canary: read marker -> stage once -> click one reviewed Send -> confirm once.
// @author       Michael S (CTRL-AI)
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://www.perplexity.ai/*
// @run-at       document-idle
// @grant        none
// @license      AGPL-3.0
// ==/UserScript==

(() => {
  'use strict';

  if (window.__GITL_SIMPLE_CORE__) return;
  window.__GITL_SIMPLE_CORE__ = true;

  const VERSION = '0.1.0';
  const MARK = Object.freeze({
    proceed: '[[GITL::PROCEED]]',
    choice: '[[GITL::CHOICE]]',
    halt: '[[GITL::HALT]]'
  });

  const CONTROL_PROTOCOL = `\n\n---\n[Ghost control protocol]\nKeep the user's existing task and instructions unchanged. Work in useful chunks. End every response with exactly one marker on its own line:\n${MARK.proceed} if more work remains\n${MARK.choice} if user input is required\n${MARK.halt} when the requested work is complete\n---`;

  const CONTINUE_PROMPT = `Continue the existing task without restarting it.\n\nEnd with exactly one marker on its own line: ${MARK.proceed}, ${MARK.choice}, or ${MARK.halt}.`;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const raf2 = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const visible = el => !!el && el.isConnected && !el.disabled && el.getAttribute('aria-disabled') !== 'true' && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  const clean = value => String(value || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  const editorText = el => clean(el?.innerText ?? el?.textContent ?? el?.value ?? '');

  function uniqueVisible(root, selectors) {
    const seen = new Set();
    const found = [];
    for (const selector of selectors) {
      let nodes = [];
      try { nodes = [...root.querySelectorAll(selector)]; } catch (_) {}
      for (const node of nodes) {
        if (seen.has(node) || !visible(node)) continue;
        seen.add(node);
        found.push(node);
      }
    }
    return found.length === 1 ? found[0] : null;
  }

  function nearestUniqueButton(input, selectors, maxHops = 8) {
    let node = input;
    for (let i = 0; node && i < maxHops; i++, node = node.parentElement) {
      const button = uniqueVisible(node, selectors);
      if (button) return button;
    }
    return uniqueVisible(document, selectors);
  }

  const PLATFORM = (() => {
    const host = location.hostname;
    if (/perplexity\.ai$/.test(host)) {
      return {
        id: 'perplexity',
        label: 'Perplexity',
        input() {
          return document.querySelector('#ask-input[contenteditable="true"], div[role="textbox"][data-lexical-editor="true"], div[contenteditable="true"][role="textbox"]');
        },
        send(input) {
          return nearestUniqueButton(input, ['button[aria-label="Submit"]']);
        },
        userNodes() {
          return [...document.querySelectorAll('.group\\/user-bubble')];
        },
        assistantNodes() {
          return [...document.querySelectorAll('[data-workflow-final-text]')];
        },
        generating() {
          return [...document.querySelectorAll('button[aria-label="Stop"], button[aria-label*="Stop response" i], [data-testid="stop-button"]')].some(visible);
        }
      };
    }

    if (/chatgpt\.com$|chat\.openai\.com$/.test(host)) {
      return {
        id: 'chatgpt',
        label: 'ChatGPT',
        input() {
          return document.querySelector('#prompt-textarea, textarea[data-id="root"], div[contenteditable="true"][id="prompt-textarea"]');
        },
        send(input) {
          const selectors = [
            '#composer-submit-button',
            'button[data-testid="send-button"]',
            'button[aria-label="Send prompt"]',
            'button[aria-label="Send message"]'
          ];
          const form = input?.closest('form');
          return (form && uniqueVisible(form, selectors)) || nearestUniqueButton(input, selectors);
        },
        userNodes() {
          return [...document.querySelectorAll('[data-message-author-role="user"]')];
        },
        assistantNodes() {
          return [...document.querySelectorAll('[data-message-author-role="assistant"]')];
        },
        generating() {
          return [...document.querySelectorAll('button[data-testid="stop-button"], button[aria-label="Stop generating"], button[aria-label="Stop streaming"]')].some(visible);
        }
      };
    }
    return null;
  })();

  if (!PLATFORM) return;

  const S = {
    mode: 'IDLE',
    round: 0,
    maxRounds: 25,
    sending: false,
    uncertain: false,
    lastHandled: '',
    stableText: '',
    stableTicks: 0,
    timer: null,
    detail: 'Ready',
    events: []
  };

  function log(type, data = {}) {
    S.events.push({ at: new Date().toISOString(), type, data });
    if (S.events.length > 40) S.events.shift();
    try { console.debug('[GITL Simple]', type, data); } catch (_) {}
  }

  function latestAssistantText() {
    const nodes = PLATFORM.assistantNodes().filter(el => el.isConnected);
    if (!nodes.length) return '';
    return clean(nodes[nodes.length - 1].innerText || nodes[nodes.length - 1].textContent || '');
  }

  function readMarker(text) {
    const tail = String(text || '').slice(-1200);
    const hits = [
      ['halt', tail.lastIndexOf(MARK.halt)],
      ['choice', tail.lastIndexOf(MARK.choice)],
      ['proceed', tail.lastIndexOf(MARK.proceed)]
    ].filter(([, pos]) => pos >= 0).sort((a, b) => b[1] - a[1]);
    return hits.length ? hits[0][0] : null;
  }

  async function writeEditor(text) {
    let input = PLATFORM.input();
    if (!input) return { ok: false, reason: 'input-missing' };
    input.focus();

    try {
      if (input.isContentEditable) {
        const range = document.createRange();
        range.selectNodeContents(input);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        let inserted = false;
        try { inserted = document.execCommand('insertText', false, text); } catch (_) {}
        if (!inserted) {
          input.textContent = text;
          input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
        } else {
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } else {
        const proto = input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (setter) setter.call(input, text); else input.value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } catch (error) {
      return { ok: false, reason: 'write-exception', error: String(error?.message || error) };
    }

    await raf2();
    await sleep(80);

    input = PLATFORM.input();
    if (!input) return { ok: false, reason: 'input-replaced-missing' };

    // Verify what the user can actually see in the current live editor. We do
    // not require the same DOM node or byte-identical whitespace to survive
    // framework reconciliation.
    const expected = clean(text);
    const observed = editorText(input);
    if (observed !== expected) {
      return { ok: false, reason: 'visible-text-mismatch', expectedLength: expected.length, observedLength: observed.length };
    }
    return { ok: true, input };
  }

  async function confirmDelivery(beforeUsers, beforeAssistant, timeoutMs = 14000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const users = PLATFORM.userNodes().filter(el => el.isConnected).length;
      if (users > beforeUsers) return { ok: true, evidence: 'new-user-turn' };
      if (PLATFORM.generating()) return { ok: true, evidence: 'generation-started' };
      const assistant = latestAssistantText();
      if (assistant && assistant !== beforeAssistant) return { ok: true, evidence: 'assistant-changed' };
      await sleep(250);
    }
    return { ok: false, evidence: 'unconfirmed' };
  }

  async function sendOnce(text, reason) {
    if (S.sending || S.uncertain || S.mode !== 'RUNNING') return false;
    if (document.querySelector('#gitl')) {
      pause('Disable the normal GITL 8.x userscript before testing Simple Core.');
      return false;
    }

    S.sending = true;
    S.detail = `Staging ${reason}...`;
    render();

    const beforeUsers = PLATFORM.userNodes().filter(el => el.isConnected).length;
    const beforeAssistant = latestAssistantText();
    const staged = await writeEditor(text);
    if (!staged.ok) {
      S.sending = false;
      pause(`Stage failed: ${staged.reason}`);
      log('stage_failed', staged);
      return false;
    }

    // Resolve one host-owned actuator only after the live editor contains the
    // intended semantic text. There is no Alpha/Beta/Gamma escalation chain.
    const button = PLATFORM.send(staged.input);
    if (!button) {
      S.sending = false;
      pause('No unique host Send button. Prompt is staged; send manually or reload.');
      log('send_missing', { platform: PLATFORM.id });
      return false;
    }

    log('send_click', { reason, round: S.round + 1, platform: PLATFORM.id });
    try {
      button.click();
    } catch (error) {
      S.sending = false;
      S.uncertain = true;
      pause('Send threw after actuation. Stopped to avoid a duplicate.');
      log('send_exception', { message: String(error?.message || error) });
      return false;
    }

    const confirmation = await confirmDelivery(beforeUsers, beforeAssistant);
    S.sending = false;
    if (!confirmation.ok) {
      S.uncertain = true;
      pause('Send could not be confirmed. No automatic retry. Check the chat first.');
      log('send_uncertain', { round: S.round + 1 });
      return false;
    }

    S.round += 1;
    S.detail = `Sent once - ${confirmation.evidence}`;
    log('send_confirmed', { round: S.round, evidence: confirmation.evidence });
    S.stableText = '';
    S.stableTicks = 0;
    render();
    return true;
  }

  async function handleStableAnswer(text) {
    if (!text || text === S.lastHandled || S.sending || S.mode !== 'RUNNING') return;
    S.lastHandled = text;
    const marker = readMarker(text);
    log('answer_stable', { marker, length: text.length });

    if (marker === 'halt') {
      complete('Task complete');
      return;
    }
    if (marker === 'choice') {
      pause('User choice/input required');
      return;
    }
    if (marker === 'proceed') {
      if (S.round >= S.maxRounds) {
        pause('Round limit reached');
        return;
      }
      await sendOnce(CONTINUE_PROMPT, 'continue');
      return;
    }
    pause('Latest completed answer has no control marker.');
  }

  async function tick() {
    if (S.mode !== 'RUNNING' || S.sending || S.uncertain) return;
    if (PLATFORM.generating()) {
      S.detail = 'Model is working...';
      S.stableTicks = 0;
      render();
      return;
    }

    const text = latestAssistantText();
    if (!text) {
      S.detail = 'Waiting for assistant output...';
      render();
      return;
    }

    if (text === S.stableText) S.stableTicks += 1;
    else {
      S.stableText = text;
      S.stableTicks = 1;
    }

    S.detail = S.stableTicks >= 2 ? 'Output stable - checking marker' : 'Output stopped - confirming stability';
    render();
    if (S.stableTicks >= 2) await handleStableAnswer(text);
  }

  async function startOrResume() {
    if (S.mode === 'RUNNING') return;
    if (S.uncertain) {
      S.detail = 'Uncertain prior Send. Reload page or inspect chat before continuing.';
      render();
      return;
    }
    if (document.querySelector('#gitl')) {
      S.detail = 'Disable normal GITL 8.x first - two automation engines must not run together.';
      render();
      return;
    }

    const input = PLATFORM.input();
    if (!input) {
      S.detail = 'Chat input not found.';
      render();
      return;
    }

    S.mode = 'RUNNING';
    S.detail = 'Starting...';
    render();

    const current = editorText(input);
    if (current) {
      const prompt = current.includes(MARK.proceed) || current.includes('[Ghost control protocol]') ? current : current + CONTROL_PROTOCOL;
      const ok = await sendOnce(prompt, 'initial');
      if (!ok) return;
    } else {
      // Existing conversation: do not invent a roadmap or workflow. Read the
      // latest completed answer and let its marker decide the next action.
      S.stableText = '';
      S.stableTicks = 0;
      await tick();
    }

    clearInterval(S.timer);
    S.timer = setInterval(() => { tick().catch(error => fail(error)); }, 1500);
  }

  function pause(detail) {
    S.mode = 'PAUSED';
    S.detail = detail;
    clearInterval(S.timer);
    S.timer = null;
    render();
  }

  function stop() {
    S.mode = 'IDLE';
    S.detail = 'Stopped';
    S.sending = false;
    S.uncertain = false;
    S.lastHandled = '';
    S.stableText = '';
    S.stableTicks = 0;
    clearInterval(S.timer);
    S.timer = null;
    log('stop');
    render();
  }

  function complete(detail) {
    S.mode = 'COMPLETE';
    S.detail = detail;
    clearInterval(S.timer);
    S.timer = null;
    log('complete', { round: S.round });
    render();
  }

  function fail(error) {
    S.mode = 'ERROR';
    S.detail = String(error?.message || error || 'Unknown error');
    clearInterval(S.timer);
    S.timer = null;
    log('error', { detail: S.detail });
    render();
  }

  const style = document.createElement('style');
  style.textContent = `
    #gitl-simple-core { position:fixed; z-index:2147483646; top:74px; right:8px; width:min(230px,calc(100vw - 16px)); background:#151417; color:#e7e4e9; border:1px solid #3a3840; border-radius:12px; box-shadow:0 8px 28px rgba(0,0,0,.38); font:12px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace; padding:9px; }
    #gitl-simple-core * { box-sizing:border-box; }
    #gitl-simple-core .h { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:7px; }
    #gitl-simple-core .t { font-weight:700; }
    #gitl-simple-core .m { font-size:10px; opacity:.65; }
    #gitl-simple-core .s { min-height:32px; padding:7px; background:#0e0d10; border-radius:8px; margin:6px 0; word-break:break-word; }
    #gitl-simple-core .b { display:grid; grid-template-columns:1fr 1fr 1fr; gap:5px; }
    #gitl-simple-core button { min-width:0; border:1px solid #45424c; border-radius:8px; background:#25232a; color:#eee; padding:7px 4px; font:inherit; }
    #gitl-simple-core button.go { background:#073f30; border-color:#0b7659; color:#69efc2; }
    #gitl-simple-core button.stop { background:#421417; border-color:#81282f; color:#ff9ca4; }
  `;
  document.documentElement.appendChild(style);

  const panel = document.createElement('div');
  panel.id = 'gitl-simple-core';
  (document.body || document.documentElement).appendChild(panel);

  function render() {
    panel.innerHTML = `
      <div class="h"><span class="t">GHOST CORE</span><span class="m">${PLATFORM.label} · v${VERSION}</span></div>
      <div class="m">${S.mode} · round ${S.round}/${S.maxRounds}</div>
      <div class="s"></div>
      <div class="b">
        <button class="go" data-a="run">▶ Resume</button>
        <button class="stop" data-a="stop">■ Stop</button>
        <button data-a="reload">↻ Page</button>
      </div>`;
    panel.querySelector('.s').textContent = S.detail;
    panel.querySelector('[data-a="run"]').addEventListener('click', () => startOrResume().catch(fail));
    panel.querySelector('[data-a="stop"]').addEventListener('click', stop);
    panel.querySelector('[data-a="reload"]').addEventListener('click', () => location.reload());
  }

  render();
  log('boot', { platform: PLATFORM.id, version: VERSION });
})();
