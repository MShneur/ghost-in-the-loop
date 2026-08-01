// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * Real-browser proof for the pre-dispatch evidence gate. The first fixture
 * mimics a framework-controlled editor that accepts assignment calls but drops
 * the text. The second proves the same gate still allows one reviewed dispatch
 * when the prompt is actually staged.
 */

const RAW = fs.readFileSync(path.join(__dirname, '../../../ghost-in-the-loop.user.js'), 'utf8')
  .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/m, '');

const EXPOSE = `
  window.__GITL_TestSend = async text => {
    PLAT.reviewed = true;
    PLAT.input = ['#composer'];
    PLAT.send = ['#send'];
    PLAT.stop = ['#stop'];
    PLAT.assistant = ['#assistant'];
    PLAT.dispatchFallback = null;
    PLAT.useCE = false;
    PLAT.useNS = false;
    Object.assign(GHOST.loop, {
      state: 'RUNNING', phase: 'idle', isSending: false,
      sendPending: false, sendTxn: null, round: 0
    });
    claimTabLock();
    const pending = engineSend(text, true);
    setTimeout(() => {
      const observed = _sendEvidence();
      if (observed.confirmed) _confirmSend(observed.evidence);
    }, 800);
    return pending;
  };
  window.__GITL_TestState = () => ({
    round: GHOST.loop.round,
    path: GHOST.loop.sendTxn && GHOST.loop.sendTxn.path,
    pending: GHOST.loop.sendPending
  });
`;

const SCRIPT = /\n\} catch\(__gitlBootErr\)/.test(RAW)
  ? RAW.replace(/\n\} catch\(__gitlBootErr\)/, '\n' + EXPOSE + '\n} catch(__gitlBootErr)')
  : RAW.replace(/(\}\)\(\)\s*;?\s*)$/, EXPOSE + '\n$1');

const GM = `
  window.__gmStore = {};
  window.GM_getValue = (k, d) => (window.__gmStore[k] !== undefined ? window.__gmStore[k] : d);
  window.GM_setValue = (k, v) => { window.__gmStore[k] = v; };
  window.GM_addStyle = css => { const s=document.createElement('style'); s.textContent=css; (document.head||document.documentElement).appendChild(s); };
`;

const PAGE = `data:text/html,${encodeURIComponent(`<!doctype html><html><body>
  <main>
    <div id="assistant">Prior response.</div>
    <textarea id="composer"></textarea>
    <button id="send" aria-label="Send message">Send</button>
  </main>
</body></html>`)}`;

async function boot(page) {
  await page.addInitScript(GM);
  await page.addInitScript(SCRIPT);
  await page.goto(PAGE);
  await page.waitForTimeout(700);
}

test.describe('pre-dispatch composer evidence', () => {
  test('a host editor that drops injected text never reaches the actuator', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => {
      window.__sendClicks = 0;
      document.getElementById('send').addEventListener('click', () => { window.__sendClicks += 1; });
      const input = document.getElementById('composer');
      Object.defineProperty(input, 'value', {
        configurable: true,
        get: () => '',
        set: () => {}
      });
    });

    const delivered = await page.evaluate(() => window.__GITL_TestSend('Complete staged prompt'));
    const result = await page.evaluate(() => ({
      clicks: window.__sendClicks,
      state: window.__GITL_TestState(),
      report: window.__gmStore.lastDiagnostic || ''
    }));

    expect(delivered).toBe(false);
    expect(result.clicks).toBe(0);
    expect(result.state.pending).toBe(false);
    expect(result.report).toContain('COMPOSER-002');
  });

  test('a verified prompt dispatches through one reviewed button and confirms once', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => {
      window.__sendClicks = 0;
      document.getElementById('send').addEventListener('click', () => {
        window.__sendClicks += 1;
        document.getElementById('composer').value = '';
        const stop = document.createElement('button');
        stop.id = 'stop';
        stop.textContent = 'Stop';
        document.body.appendChild(stop);
      });
    });

    const delivered = await page.evaluate(() => window.__GITL_TestSend('Complete staged prompt'));
    const result = await page.evaluate(() => ({ clicks: window.__sendClicks, state: window.__GITL_TestState() }));

    expect(delivered).toBe(true);
    expect(result.clicks).toBe(1);
    expect(result.state).toEqual({ round: 1, path: 'reviewed-button', pending: false });
  });
});
