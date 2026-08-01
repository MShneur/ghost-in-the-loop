// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * MOBILE SEND E2E (v8.7.0 — Tracks A + G)
 *
 * The SEND-001 field failure (Android/Firefox, chatgpt.com) could not be
 * reproduced from CI: desktop projects never see the mobile DOM, where a
 * dictation control occupies the Send slot. These specs run ONLY in the
 * mobile projects (touch + narrow viewport + Android UA) and serve
 * host-accurate mock pages through route interception, so the REAL ChatGPT /
 * Perplexity profiles engage (reviewed adapters, declared Enter fallback).
 *
 * They prove, in both engines:
 *   1. Buttonless mobile ChatGPT → the reviewed Enter path submits, exactly
 *      ONE keydown, send confirmed by evidence (the 8.6.1 path, now proven).
 *   2. An enabled reviewed button beats Enter on mobile too (tier order).
 *   3. A composer that silently drops injection is stopped by the
 *      pre-dispatch evidence gate — zero dispatches, loud pause.
 *   4. Perplexity mobile (textarea, buttonless) → reviewed Enter, one keydown.
 */

const RAW = fs.readFileSync(path.join(__dirname, '../../ghost-in-the-loop.user.js'), 'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');
const EXPOSE = `
  window.__GITL_Adapter = Adapter;
  window.__GITL_GHOST = GHOST;
  window.__GITL_DIAG = DIAG;
  window.__GITL_engineSend = engineSend;
  window.__GITL_engineTick = engineTick;
`;
const SCRIPT = /\n\} catch\(__gitlBootErr\)/.test(RAW)
  ? RAW.replace(/\n\} catch\(__gitlBootErr\)/, '\n' + EXPOSE + '\n} catch(__gitlBootErr)')
  : RAW.replace(/(\}\)\(\)\s*;?\s*)$/, EXPOSE + '\n$1');

const GM = `
  window.__gmStore = { unattended: true };
  window.GM_getValue = (k, d) => (window.__gmStore[k] !== undefined ? window.__gmStore[k] : d);
  window.GM_setValue = (k, v) => { window.__gmStore[k] = v; };
  window.GM_addStyle = (css) => { const s=document.createElement('style'); s.textContent=css; (document.head||document.documentElement).appendChild(s); };
  window.GM_notification = () => {};
`;

/* Mobile ChatGPT shape: ProseMirror composer; the Send slot holds a dictation
   button until a native keystroke (exactly the field DOM). The page script
   simulates the site's own submit-on-Enter behavior. */
const CHATGPT_BUTTONLESS = `<!doctype html><html><body><main>
  <div class="conversation"></div>
  <div class="composer">
    <div id="prompt-textarea" class="ProseMirror" contenteditable="true" data-placeholder="Message ChatGPT" role="textbox"></div>
    <button aria-label="Dictate" id="dictate-btn">🎙</button>
  </div>
  <script>
    window.__stats = { enters: 0, dictateClicks: 0 };
    document.getElementById('dictate-btn').addEventListener('click', () => { window.__stats.dictateClicks++; });
    document.getElementById('prompt-textarea').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      window.__stats.enters++;
      const ta = e.currentTarget;
      setTimeout(() => {
        ta.textContent = '';
        const m = document.createElement('div');
        m.setAttribute('data-message-author-role', 'assistant');
        m.textContent = 'Understood — continuing. [[GITL::PROCEED]]';
        document.querySelector('.conversation').appendChild(m);
      }, 120);
    });
  </script>
</main></body></html>`;

/* Same, but the reviewed Send button IS present and enabled (post-staging),
   e.g. after the site's input handler enabled it. */
const CHATGPT_WITH_BUTTON = `<!doctype html><html><body><main>
  <div class="conversation"></div>
  <div class="composer">
    <div id="prompt-textarea" class="ProseMirror" contenteditable="true" data-placeholder="Message ChatGPT" role="textbox"></div>
    <button aria-label="Dictate" id="dictate-btn">🎙</button>
    <button data-testid="send-button" aria-label="Send prompt" id="real-send">↑</button>
  </div>
  <script>
    window.__stats = { enters: 0, sendClicks: 0, dictateClicks: 0 };
    document.getElementById('dictate-btn').addEventListener('click', () => { window.__stats.dictateClicks++; });
    document.getElementById('prompt-textarea').addEventListener('keydown', () => { window.__stats.enters++; });
    document.getElementById('real-send').addEventListener('click', () => {
      window.__stats.sendClicks++;
      const ta = document.getElementById('prompt-textarea');
      setTimeout(() => {
        ta.textContent = '';
        const m = document.createElement('div');
        m.setAttribute('data-message-author-role', 'assistant');
        m.textContent = 'Reply via button. [[GITL::PROCEED]]';
        document.querySelector('.conversation').appendChild(m);
      }, 120);
    });
  </script>
</main></body></html>`;

/* A composer that silently drops injection: matches #prompt-textarea but is
   not editable and never changes content (the strict-editor failure class). */
const CHATGPT_BROKEN_COMPOSER = `<!doctype html><html><body><main>
  <div class="conversation"></div>
  <div class="composer">
    <div id="prompt-textarea" data-placeholder="Message ChatGPT" role="textbox"></div>
    <button aria-label="Dictate">🎙</button>
  </div>
  <script>
    window.__stats = { enters: 0 };
    document.getElementById('prompt-textarea').addEventListener('keydown', () => { window.__stats.enters++; });
  </script>
</main></body></html>`;

const PERP_BUTTONLESS = `<!doctype html><html><body><main>
  <div class="conversation"></div>
  <div class="composer">
    <textarea placeholder="Ask a follow-up" id="pplx-input"></textarea>
  </div>
  <script>
    window.__stats = { enters: 0 };
    document.getElementById('pplx-input').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      window.__stats.enters++;
      const ta = e.currentTarget;
      setTimeout(() => {
        ta.value = '';
        const m = document.createElement('div');
        m.className = 'prose answer';
        m.textContent = 'Perplexity answer. [[GITL::PROCEED]]';
        document.querySelector('.conversation').appendChild(m);
      }, 120);
    });
  </script>
</main></body></html>`;

async function boot(page, url, html) {
  await page.addInitScript(GM);
  await page.addInitScript(SCRIPT);
  await page.route(url + '**', (route) => route.fulfill({ contentType: 'text/html', body: html }));
  await page.goto(url);
  await page.waitForTimeout(700);
}

/** Drive one send: fire engineSend, then pump engineTick until the journal settles. */
async function driveSend(page, text) {
  await page.evaluate((t) => {
    window.__sendResult = null;
    window.__GITL_GHOST.loop.state = 'RUNNING';
    window.__GITL_engineSend(t, true).then((ok) => { window.__sendResult = ok; });
  }, text);
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(200);
    await page.evaluate(() => { try { window.__GITL_engineTick(); } catch (_) {} });
    const r = await page.evaluate(() => window.__sendResult);
    if (r !== null) return r;
  }
  return null;
}

test.describe('Mobile send — the SEND-001 field class, reproduced', () => {

  test('buttonless mobile ChatGPT: reviewed Enter submits, exactly one keydown, send confirmed', async ({ page }) => {
    await boot(page, 'https://chatgpt.com/', CHATGPT_BUTTONLESS);
    const ok = await driveSend(page, 'Continue — mobile round one');
    const stats = await page.evaluate(() => window.__stats);
    const snap = await page.evaluate(() => ({
      round: window.__GITL_GHOST.loop.round,
      path: window.__GITL_DIAG.sendPath,
      state: window.__GITL_GHOST.loop.state,
      composer: document.getElementById('prompt-textarea').textContent,
      answers: document.querySelectorAll('[data-message-author-role="assistant"]').length,
    }));
    expect(ok).toBe(true);                        // send confirmed by evidence
    expect(stats.enters).toBe(1);                 // at-most-once: ONE keydown
    expect(stats.dictateClicks).toBe(0);          // the vetoed dictation control is never touched
    expect(snap.path).toBe('reviewed-enter');
    expect(snap.round).toBe(1);
    expect(snap.state).toBe('RUNNING');
    expect(snap.composer).toBe('');               // the site cleared the composer on submit
    expect(snap.answers).toBe(1);
  });

  test('enabled reviewed button beats Enter on mobile (tier order), one click only', async ({ page }) => {
    await boot(page, 'https://chatgpt.com/', CHATGPT_WITH_BUTTON);
    const ok = await driveSend(page, 'Continue — mobile round with button');
    const stats = await page.evaluate(() => window.__stats);
    const snap = await page.evaluate(() => ({ path: window.__GITL_DIAG.sendPath, round: window.__GITL_GHOST.loop.round }));
    expect(ok).toBe(true);
    expect(stats.sendClicks).toBe(1);             // at-most-once: ONE click
    expect(stats.enters).toBe(0);                 // Enter tier never fired
    expect(stats.dictateClicks).toBe(0);
    expect(snap.path).toBe('reviewed-button');
    expect(snap.round).toBe(1);
  });

  test('a composer that drops injection is stopped by the evidence gate — zero dispatches, loud pause', async ({ page }) => {
    await boot(page, 'https://chatgpt.com/', CHATGPT_BROKEN_COMPOSER);
    const ok = await driveSend(page, 'Continue — should never dispatch');
    const stats = await page.evaluate(() => window.__stats);
    const snap = await page.evaluate(() => ({
      state: window.__GITL_GHOST.loop.state,
      detail: window.__GITL_GHOST.loop.detail,
      round: window.__GITL_GHOST.loop.round,
    }));
    expect(ok).toBe(false);
    expect(stats.enters).toBe(0);                 // nothing was dispatched
    expect(snap.state).toBe('PAUSED');            // loud, not silent
    expect(snap.detail).toMatch(/composer/i);
    expect(snap.round).toBe(0);                   // no round was consumed
  });

  test('buttonless mobile Perplexity: reviewed Enter submits, exactly one keydown', async ({ page }) => {
    await boot(page, 'https://www.perplexity.ai/', PERP_BUTTONLESS);
    const ok = await driveSend(page, 'Continue — perplexity mobile round');
    const stats = await page.evaluate(() => window.__stats);
    const snap = await page.evaluate(() => ({
      path: window.__GITL_DIAG.sendPath,
      round: window.__GITL_GHOST.loop.round,
      composer: document.getElementById('pplx-input').value,
    }));
    expect(ok).toBe(true);
    expect(stats.enters).toBe(1);
    expect(snap.path).toBe('reviewed-enter');
    expect(snap.round).toBe(1);
    expect(snap.composer).toBe('');
  });
});
