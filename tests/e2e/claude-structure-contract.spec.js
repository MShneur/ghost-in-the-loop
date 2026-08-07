// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * Round-6 XA1 — Claude structural capability contract.
 *
 * This is a deterministic, read-only fixture oracle. It deliberately does NOT
 * authorize a live Claude mount. Current reviewed Claude input/Send selectors
 * are only anchor evidence; structural authority requires the fixture-owned
 * capability token plus exact active-composer/Send/layout checks below.
 *
 * Runner order under test:
 *   1. certified site-specific runner (only when the Claude signature passes)
 *   2. standard adapter-aware structural protocol
 *   3. existing rail fallback
 *
 * The oracle performs no click, submit, input, keydown, focus, style mutation,
 * node move, wrapper, clone, or Send replacement.
 */

const CLAUDE_PROOF = 'fixture-claude-structure-v1';
const SITE = 'claude';

const FIXTURE = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font: 14px system-ui; min-height: 100vh; }
  [data-fixture="page"] { width: min(760px, calc(100vw - 24px)); margin: 28px auto; }
  [data-fixture="decoy-editor"] { min-height: 48px; border: 1px dashed #999; }
  form[data-claude-composer="active"] { display: flex; flex-direction: column; gap: 8px; padding: 10px; }
  [data-claude-editor] { min-height: 56px; }
  [data-claude-actions] { display: flex; align-items: center; gap: 8px; min-height: 40px; overflow: visible; }
  [data-claude-actions] > button { min-width: 36px; min-height: 36px; }
  [data-claude-send] { margin-left: auto; }
  [data-fixture="hidden-secondary"] { display: none; }
  @media (max-width: 480px) {
    [data-fixture="page"] { width: calc(100vw - 12px); margin: 12px auto; }
    [data-claude-actions] { flex-wrap: wrap; }
  }
</style>
</head>
<body data-site="${SITE}">
  <main data-fixture="page">
    <!-- Visible editable decoy comes first to kill naive first-contenteditable authority. -->
    <section data-fixture="decoy-shell">
      <div class="ProseMirror" contenteditable="true" aria-label="Edit artifact" data-fixture="decoy-editor"></div>
      <button type="button" aria-label="Send Message" data-fixture="decoy-send">decoy send</button>
    </section>

    <form data-claude-composer="active" data-gitl-claude-contract="${CLAUDE_PROOF}">
      <div class="ProseMirror" contenteditable="true" aria-label="Message Claude" data-claude-editor="active"></div>
      <div data-claude-actions="active">
        <button type="button" aria-label="Attach file" data-native="attach">+</button>
        <button type="button" aria-label="Tools" data-native="tools">Tools</button>
        <button type="submit" aria-label="Send Message" data-claude-send="active">Send</button>
      </div>
    </form>

    <section data-fixture="hidden-secondary">
      <form data-claude-composer="secondary" data-gitl-claude-contract="not-approved">
        <div class="ProseMirror" contenteditable="true" aria-label="Message Claude"></div>
        <div data-claude-actions="secondary">
          <button type="submit" aria-label="Send Message" data-claude-send="secondary">Send</button>
        </div>
      </form>
    </section>
  </main>
<script>
  window.__xa1Events = { click: 0, submit: 0, input: 0, keydown: 0, sendClicks: 0 };
  for (const type of ['click', 'submit', 'input', 'keydown']) {
    document.addEventListener(type, () => { window.__xa1Events[type]++; }, true);
  }
  window.__xa1Send = document.querySelector('[data-claude-send="active"]');
  window.__xa1Send.addEventListener('click', () => { window.__xa1Events.sendClicks++; });
</script>
</body>
</html>`;

async function setup(page, width = 1280) {
  await page.setViewportSize({ width, height: width <= 480 ? 780 : 800 });
  await page.setContent(FIXTURE);
  await page.evaluate(({ proof }) => {
    const visible = (el) => {
      if (!(el instanceof Element) || !el.isConnected) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };

    const clippedBy = (el, container) => {
      const cs = getComputedStyle(container);
      const clipsX = ['hidden', 'clip'].includes(cs.overflowX);
      const clipsY = ['hidden', 'clip'].includes(cs.overflowY);
      if (!clipsX && !clipsY) return false;
      const er = el.getBoundingClientRect();
      const cr = container.getBoundingClientRect();
      const px = 1; // deterministic subpixel/rounding tolerance only
      return (clipsX && (er.left < cr.left - px || er.right > cr.right + px)) ||
             (clipsY && (er.top < cr.top - px || er.bottom > cr.bottom + px));
    };

    const resolve = ({ site = 'claude', standardAvailable = true } = {}) => {
      const before = {
        events: { ...window.__xa1Events },
        send: window.__xa1Send,
        html: document.documentElement.outerHTML,
      };

      const demote = (reason, detail = {}) => ({
        eligible: false,
        reason,
        runner: standardAvailable ? 'standard-adapter-aware-structural-protocol' : 'existing-rail-fallback',
        fixtureInsertionRule: null,
        ...detail,
      });

      if (site !== 'claude' || document.body.getAttribute('data-site') !== 'claude') {
        return { ...demote('site-identity-mismatch'), before };
      }

      const approved = Array.from(document.querySelectorAll(
        `form[data-gitl-claude-contract="${proof}"]`
      )).filter(visible);
      if (approved.length !== 1) return { ...demote(approved.length ? 'active-composer-ambiguous' : 'structural-signature-missing'), before };

      const composer = approved[0];
      const editors = Array.from(composer.querySelectorAll('div.ProseMirror[contenteditable="true"]')).filter(visible);
      if (editors.length !== 1) return { ...demote(editors.length ? 'active-editor-ambiguous' : 'active-editor-missing'), before };
      const editor = editors[0];

      const actions = Array.from(composer.querySelectorAll('[data-claude-actions]')).filter(visible);
      if (actions.length !== 1) return { ...demote(actions.length ? 'action-row-ambiguous' : 'action-row-missing'), before };
      const row = actions[0];

      const reviewedSendCandidates = Array.from(composer.querySelectorAll(
        'button[aria-label="Send Message"],button[type="submit"],button[aria-label*="Send"]'
      )).filter(visible);
      if (reviewedSendCandidates.length !== 1) return { ...demote(reviewedSendCandidates.length ? 'send-ambiguous' : 'send-missing'), before };
      const send = reviewedSendCandidates[0];

      if (send !== window.__xa1Send) return { ...demote('exact-send-identity-mismatch'), before };
      if (!row.contains(send)) return { ...demote('send-outside-action-row'), before };
      if (!composer.contains(editor) || !composer.contains(row)) return { ...demote('ownership-mismatch'), before };

      const display = getComputedStyle(row).display;
      if (display !== 'flex' && display !== 'grid') return { ...demote('action-row-not-structural'), before };
      if (clippedBy(send, row)) return { ...demote('send-clipped'), before };

      // A visible decoy or hidden/secondary editor is allowed to exist, but it
      // can never gain authority because resolution is scoped to the one
      // approved current capability signature.
      const visibleGlobalEditors = Array.from(document.querySelectorAll('div.ProseMirror[contenteditable="true"]')).filter(visible);
      const decoyCount = visibleGlobalEditors.filter((el) => !composer.contains(el)).length;

      return {
        eligible: true,
        reason: null,
        runner: 'certified-site-specific-runner',
        fixtureInsertionRule: 'append-final-child-of-verified-claude-action-row',
        composer,
        editor,
        row,
        send,
        decoyCount,
        before,
      };
    };

    const serial = (result) => ({
      eligible: result.eligible,
      reason: result.reason,
      runner: result.runner,
      fixtureInsertionRule: result.fixtureInsertionRule,
      decoyCount: result.decoyCount ?? null,
      sendIdentityPreserved: result.send ? result.send === window.__xa1Send : window.__xa1Send?.isConnected,
      sendConnected: !!window.__xa1Send?.isConnected,
      eventsUnchanged: JSON.stringify(window.__xa1Events) === JSON.stringify(result.before.events),
      events: { ...window.__xa1Events },
    });

    window.__claudeStructureContract = {
      resolve: (opts) => serial(resolve(opts)),
      rawResolve: resolve,
    };
  }, { proof: CLAUDE_PROOF });
}

async function inspect(page, opts = {}) {
  return page.evaluate((options) => window.__claudeStructureContract.resolve(options), opts);
}

test.describe('Round-6 XA1 Claude structural capability contract', () => {
  test('pins the current reviewed Claude anchors without treating them as structural authority', async () => {
    const source = fs.readFileSync(path.join(__dirname, '..', '..', 'ghost-in-the-loop.user.js'), 'utf8');
    expect(source).toContain("host: /claude\\.ai/");
    expect(source).toContain("div[contenteditable=\"true\"].ProseMirror");
    expect(source).toContain("button[aria-label=\"Send Message\"]");
    expect(source).toContain("button[type=\"submit\"]");
    expect(source).not.toContain('data-gitl-claude-contract');
  });

  test('desktop selects only the fixture-certified Claude composer despite a visible decoy and performs zero actuation', async ({ page }) => {
    await setup(page, 1280);
    const before = await page.evaluate(() => ({ ...window.__xa1Events }));
    const result = await inspect(page);
    const after = await page.evaluate(() => ({ ...window.__xa1Events }));

    expect(result.eligible).toBe(true);
    expect(result.runner).toBe('certified-site-specific-runner');
    expect(result.fixtureInsertionRule).toBe('append-final-child-of-verified-claude-action-row');
    expect(result.decoyCount).toBeGreaterThanOrEqual(1);
    expect(result.sendIdentityPreserved).toBe(true);
    expect(result.sendConnected).toBe(true);
    expect(result.eventsUnchanged).toBe(true);
    expect(after).toEqual(before);
  });

  test('narrow layout preserves exact Send and the same read-only specialized signature', async ({ page }) => {
    await setup(page, 390);
    const result = await inspect(page);
    expect(result).toMatchObject({
      eligible: true,
      runner: 'certified-site-specific-runner',
      sendIdentityPreserved: true,
      sendConnected: true,
      eventsUnchanged: true,
    });
  });

  test('two visible certified composers are ambiguous and demote immediately to the standard protocol', async ({ page }) => {
    await setup(page);
    await page.evaluate((proof) => {
      const original = document.querySelector('form[data-claude-composer="active"]');
      const clone = original.cloneNode(true);
      clone.setAttribute('data-claude-composer', 'second-visible');
      clone.setAttribute('data-gitl-claude-contract', proof);
      clone.querySelector('[data-claude-send]')?.setAttribute('data-claude-send', 'second-visible');
      original.after(clone);
    }, CLAUDE_PROOF);
    const result = await inspect(page);
    expect(result).toMatchObject({ eligible: false, reason: 'active-composer-ambiguous', runner: 'standard-adapter-aware-structural-protocol' });
    expect(result.eventsUnchanged).toBe(true);
  });

  test('ambiguous reviewed Send candidates inside the certified composer demote rather than guessing', async ({ page }) => {
    await setup(page);
    await page.evaluate(() => {
      const row = document.querySelector('[data-claude-actions="active"]');
      const second = document.createElement('button');
      second.type = 'submit';
      second.setAttribute('aria-label', 'Send Message');
      second.textContent = 'duplicate';
      row.append(second);
    });
    const result = await inspect(page);
    expect(result).toMatchObject({ eligible: false, reason: 'send-ambiguous', runner: 'standard-adapter-aware-structural-protocol' });
    expect(result.sendIdentityPreserved).toBe(true);
    expect(result.eventsUnchanged).toBe(true);
  });

  test('exact Send replacement is rejected even when the replacement matches reviewed selectors', async ({ page }) => {
    await setup(page);
    await page.evaluate(() => {
      const old = window.__xa1Send;
      const replacement = old.cloneNode(true);
      old.replaceWith(replacement);
    });
    const result = await inspect(page);
    expect(result).toMatchObject({ eligible: false, reason: 'exact-send-identity-mismatch', runner: 'standard-adapter-aware-structural-protocol' });
    expect(result.eventsUnchanged).toBe(true);
  });

  test('a clipping structural row demotes the specialized runner instead of claiming success', async ({ page }) => {
    await setup(page, 390);
    await page.evaluate(() => {
      const row = document.querySelector('[data-claude-actions="active"]');
      row.style.width = '92px';
      row.style.overflow = 'hidden';
      row.style.flexWrap = 'nowrap';
      for (let i = 0; i < 5; i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = `N${i}`;
        row.insertBefore(b, window.__xa1Send);
      }
    });
    const result = await inspect(page);
    expect(result).toMatchObject({ eligible: false, reason: 'send-clipped', runner: 'standard-adapter-aware-structural-protocol' });
    expect(result.sendIdentityPreserved).toBe(true);
    expect(result.eventsUnchanged).toBe(true);
  });

  test('wrong site identity cannot select the specialized Claude runner', async ({ page }) => {
    await setup(page);
    const result = await inspect(page, { site: 'chatgpt' });
    expect(result).toMatchObject({ eligible: false, reason: 'site-identity-mismatch', runner: 'standard-adapter-aware-structural-protocol' });
    expect(result.eventsUnchanged).toBe(true);
  });

  test('if specialized and standard structural capability both fail, the existing rail is the final path', async ({ page }) => {
    await setup(page);
    await page.evaluate(() => {
      document.querySelector('form[data-claude-composer="active"]')?.removeAttribute('data-gitl-claude-contract');
    });
    const result = await inspect(page, { standardAvailable: false });
    expect(result).toMatchObject({ eligible: false, reason: 'structural-signature-missing', runner: 'existing-rail-fallback' });
    expect(result.eventsUnchanged).toBe(true);
  });
});
