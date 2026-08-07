// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Round-6 A1 deterministic STRUCTURE PROBE.
 *
 * This file is deliberately NOT a claim about the current live ChatGPT DOM.
 * The unattended browser connector could not inspect the authenticated live page,
 * so A1 needs a durable, no-actuation capture contract for the next exact-evidence
 * recovery wake. The fixture encodes only independently observed/adopted anchors:
 *   - #prompt-textarea / ProseMirror editor
 *   - [data-testid="composer"] or form[data-type="unified-composer"]
 *   - button[data-testid="send-button"]
 *   - an in-flow flex/grid action row around native composer controls
 *
 * The probe is read-only. It never clicks, submits, types, reorders host nodes,
 * or inserts Ghost UI. A live capture may use the same probe logic but MUST
 * record the actual current DOM signatures before any product selector is chosen.
 */

const CHATGPT_FIXTURE = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font: 14px system-ui; min-height: 100vh; display: grid; grid-template-rows: auto 1fr auto; }
  header { min-height: 52px; display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; }
  [data-fixture="header-actions"] { display: flex; align-items: center; gap: 8px; }
  main { min-height: 400px; }
  [data-fixture="composer-stack"] { display: flex; flex-direction: column; width: min(760px, calc(100vw - 24px)); margin: 0 auto 12px; }
  form[data-type="unified-composer"] { display: flex; flex-direction: column; gap: 8px; border: 1px solid #999; border-radius: 22px; padding: 10px; }
  #prompt-textarea { min-height: 54px; outline: none; }
  [data-testid="composer-actions"] { display: flex; align-items: center; gap: 8px; min-height: 40px; }
  [data-testid="composer-actions"] button { width: 36px; height: 36px; }
  [data-testid="model-selector-dropdown"] { width: auto !important; }
  [data-testid="send-button"] { margin-left: auto; }
  [data-fixture="native-footer-note"] { min-height: 24px; padding: 4px 10px; }
  [data-fixture="hidden-composer"] { display: none; }
  @media (max-width: 480px) {
    [data-fixture="composer-stack"] { width: calc(100vw - 12px); margin-bottom: 6px; }
    form[data-type="unified-composer"] { padding: 8px; }
    [data-testid="composer-actions"] { flex-wrap: wrap; }
  }
</style>
</head>
<body>
<header role="banner">
  <button aria-label="Open navigation">☰</button>
  <div data-fixture="header-actions">
    <button data-testid="share-button">Share</button>
    <button aria-label="Account menu">Me</button>
  </div>
</header>
<main><article>fixture conversation</article></main>
<div data-fixture="composer-stack">
  <form data-testid="composer" data-type="unified-composer">
    <div id="prompt-textarea" class="ProseMirror" contenteditable="true" role="textbox" aria-label="Message ChatGPT"></div>
    <div data-testid="composer-actions">
      <button data-testid="composer-attachment-button" type="button" aria-label="Add files">+</button>
      <button data-testid="model-selector-dropdown" type="button" aria-label="Model selector">Instant</button>
      <button data-testid="send-button" type="button" aria-label="Send prompt">↑</button>
    </div>
  </form>
  <div data-fixture="native-footer-note">ChatGPT can make mistakes.</div>
</div>
<div data-fixture="hidden-composer">
  <form data-testid="composer"><textarea id="prompt-textarea-hidden"></textarea><button data-testid="send-button">hidden send</button></form>
</div>
<script>
  window.__probeEvents = { click: 0, submit: 0, input: 0, keydown: 0 };
  for (const type of Object.keys(window.__probeEvents)) {
    document.addEventListener(type, () => { window.__probeEvents[type]++; }, true);
  }
  window.__fixtureSend = document.querySelector('form[data-type="unified-composer"] button[data-testid="send-button"]');
</script>
</body>
</html>`;

function probeSource() {
  return `(() => {
    const isVisible = (el) => {
      if (!(el instanceof Element) || !el.isConnected) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };

    const sig = (el) => {
      if (!(el instanceof Element)) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        testid: el.getAttribute('data-testid'),
        type: el.getAttribute('data-type'),
        fixture: el.getAttribute('data-fixture'),
        role: el.getAttribute('role'),
        className: String(el.className || '').slice(0, 180),
        display: cs.display,
        position: cs.position,
        flexDirection: cs.flexDirection,
        flexWrap: cs.flexWrap,
        gridTemplateColumns: cs.gridTemplateColumns,
        rect: { x: r.x, y: r.y, width: r.width, height: r.height }
      };
    };

    const firstVisible = (selectors, root = document) => {
      for (const selector of selectors) {
        try {
          for (const el of root.querySelectorAll(selector)) {
            if (isVisible(el)) return el;
          }
        } catch (_) {}
      }
      return null;
    };

    // Resolve from the editor outwards. Never accept a Send control from an
    // unrelated/hidden composer elsewhere in the document.
    const input = firstVisible([
      'form[data-type="unified-composer"] #prompt-textarea',
      '[data-testid="composer"] #prompt-textarea',
      '#prompt-textarea.ProseMirror[contenteditable="true"]',
      '#prompt-textarea'
    ]);
    const composer = input && input.closest('form[data-type="unified-composer"], [data-testid="composer"], form');
    const send = composer && firstVisible([
      'button[data-testid="send-button"]',
      'button[aria-label="Send prompt"]',
      'button[aria-label="Send"]'
    ], composer);

    const ancestors = (seed, stop) => {
      const out = [];
      let el = seed;
      for (let depth = 0; el && el !== stop && depth < 10; depth++, el = el.parentElement) {
        out.push(el);
      }
      return out;
    };

    const actionCandidates = send && composer
      ? ancestors(send.parentElement, composer.parentElement)
          .filter((el) => composer.contains(el))
          .map((el) => ({
            node: sig(el),
            directControls: Array.from(el.children).filter((c) => c.matches?.('button,[role="button"],input[type="submit"]')).length,
            totalControls: el.querySelectorAll('button,[role="button"],input[type="submit"]').length,
            containsInput: !!(input && el.contains(input)),
            containsSend: el.contains(send)
          }))
      : [];

    const stackCandidates = composer
      ? ancestors(composer.parentElement, document.body).slice(0, 5).map((el) => ({
          node: sig(el),
          composerDirectChild: composer.parentElement === el,
          childCount: el.children.length
        }))
      : [];

    const headers = Array.from(document.querySelectorAll('header,[role="banner"]'))
      .filter(isVisible)
      .map((el) => ({ node: sig(el), controls: el.querySelectorAll('button,[role="button"]').length }));

    return {
      viewport: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        visualWidth: window.visualViewport?.width ?? null,
        visualHeight: window.visualViewport?.height ?? null
      },
      input: sig(input),
      composer: sig(composer),
      send: sig(send),
      sendInsideComposer: !!(send && composer && composer.contains(send)),
      actionCandidates,
      stackCandidates,
      headers,
      eventCounts: { ...(window.__probeEvents || {}) },
      sendIdentityPreserved: !!(send && window.__fixtureSend && send === window.__fixtureSend)
    };
  })()`;
}

async function runProbe(page) {
  return page.evaluate((src) => eval(src), probeSource());
}

test.describe('Round-6 mobile-shell structural capture contract', () => {
  test('desktop fixture maps composer-local action/stack candidates without actuation', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.setContent(CHATGPT_FIXTURE);

    const result = await runProbe(page);

    expect(result.input?.id).toBe('prompt-textarea');
    expect(result.composer?.type).toBe('unified-composer');
    expect(result.send?.testid).toBe('send-button');
    expect(result.sendInsideComposer).toBe(true);
    expect(result.sendIdentityPreserved).toBe(true);
    expect(result.actionCandidates.some((c) => c.node.testid === 'composer-actions' && c.node.display === 'flex')).toBe(true);
    expect(result.stackCandidates.some((c) => c.node.fixture === 'composer-stack' && c.composerDirectChild && c.node.display === 'flex' && c.node.flexDirection === 'column')).toBe(true);
    expect(result.headers.length).toBeGreaterThan(0);
    expect(result.eventCounts).toEqual({ click: 0, submit: 0, input: 0, keydown: 0 });
  });

  test('narrow fixture stays in-flow and ignores a hidden duplicate composer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 });
    await page.setContent(CHATGPT_FIXTURE);

    const before = await page.evaluate(() => ({
      hasSend: !!window.__fixtureSend,
      sendConnected: !!window.__fixtureSend?.isConnected
    }));
    const result = await runProbe(page);
    const after = await page.evaluate(() => ({
      sameSend: window.__fixtureSend === document.querySelector('form[data-type="unified-composer"] button[data-testid="send-button"]'),
      hiddenSendVisible: (() => {
        const el = document.querySelector('[data-fixture="hidden-composer"] button[data-testid="send-button"]');
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      })(),
      events: window.__probeEvents
    }));

    expect(before).toEqual({ hasSend: true, sendConnected: true });
    expect(result.viewport.innerWidth).toBe(390);
    expect(result.input?.id).toBe('prompt-textarea');
    expect(result.send?.testid).toBe('send-button');
    expect(result.sendIdentityPreserved).toBe(true);
    expect(result.actionCandidates.some((c) => c.node.testid === 'composer-actions' && c.node.flexWrap === 'wrap')).toBe(true);
    expect(after.sameSend).toBe(true);
    expect(after.hiddenSendVisible).toBe(false);
    expect(after.events).toEqual({ click: 0, submit: 0, input: 0, keydown: 0 });
  });
});
