// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Round-6 XA2 delivery-pressure artifact.
 *
 * This is a deterministic, fixture-gated Claude Blue prototype. It is not a
 * live Claude binding. The site-specific runner may mount only when the
 * adapter-owned fixture capability signature passes; every failure demotes to
 * the standard adapter-aware structural protocol or the existing rail.
 *
 * Hard invariants:
 *   - ordinary in-flow host with one open ShadowRoot;
 *   - DOM-built internals only (no HTML-string sink);
 *   - exact caller-recorded Send node identity, never moved/wrapped/cloned;
 *   - zero passive Send/submit/input/keydown actuation;
 *   - one scoped MutationObserver and one ResizeObserver;
 *   - coalesced, generation-guarded repair that moves only Ghost;
 *   - specialized signature failure is visible and fail-closed;
 *   - no live selector or live Claude activation.
 */

const CLAUDE_PROOF = 'fixture-claude-blue-v1';
const MOUNT_SELECTOR = '[data-gitl-mount="claude-blue-prototype"]';

const FIXTURE = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font: 14px system-ui; min-height: 100vh; }
  #gitl { position: fixed; right: 8px; bottom: 8px; width: 44px; height: 44px; }
  [data-fixture="page"] { width: min(760px, calc(100vw - 24px)); margin: 28px auto; }
  [data-fixture="decoy-editor"] { min-height: 48px; border: 1px dashed #999; }
  form[data-claude-composer="active"] { display: flex; flex-direction: column; gap: 8px; padding: 10px; }
  [data-claude-editor] { min-height: 56px; outline: none; }
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
<body data-site="claude">
  <div id="gitl" data-fixture="existing-rail" aria-label="Existing Ghost rail"></div>
  <main data-fixture="page">
    <section data-fixture="decoy-shell">
      <div class="ProseMirror" contenteditable="true" aria-label="Edit artifact" data-fixture="decoy-editor"></div>
      <button type="button" aria-label="Send Message" data-fixture="decoy-send">decoy send</button>
    </section>

    <form data-claude-composer="active" data-gitl-claude-blue-contract="${CLAUDE_PROOF}">
      <div class="ProseMirror" contenteditable="true" aria-label="Message Claude" data-claude-editor="active" tabindex="0"></div>
      <div data-claude-actions="active">
        <button type="button" aria-label="Attach file" data-native="attach">+</button>
        <button type="button" aria-label="Tools" data-native="tools">Tools</button>
        <button type="submit" aria-label="Send Message" data-claude-send="active">Send</button>
      </div>
    </form>

    <section data-fixture="hidden-secondary">
      <form data-claude-composer="secondary" data-gitl-claude-blue-contract="not-approved">
        <div class="ProseMirror" contenteditable="true" aria-label="Message Claude"></div>
        <div data-claude-actions="secondary">
          <button type="submit" aria-label="Send Message" data-claude-send="secondary">Send</button>
        </div>
      </form>
    </section>
  </main>
<script>
  window.__xa2Events = { click: 0, submit: 0, input: 0, keydown: 0, sendClicks: 0 };
  for (const type of ['click', 'submit', 'input', 'keydown']) {
    document.addEventListener(type, () => { window.__xa2Events[type]++; }, true);
  }
  window.__xa2Send = document.querySelector('[data-claude-send="active"]');
  window.__xa2Send.addEventListener('click', () => { window.__xa2Events.sendClicks++; });
  window.__xa2GhostActions = { toggle: 0, menu: 0 };
</script>
</body>
</html>`;

async function installPrototype(page) {
  await page.evaluate(({ proof, mountSelector }) => {
    const visible = (el) => {
      if (!(el instanceof Element) || !el.isConnected) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };

    const clippedBy = (el, container) => {
      if (!(el instanceof Element) || !(container instanceof Element)) return true;
      const cs = getComputedStyle(container);
      const clipsX = ['hidden', 'clip'].includes(cs.overflowX);
      const clipsY = ['hidden', 'clip'].includes(cs.overflowY);
      if (!clipsX && !clipsY) return false;
      const er = el.getBoundingClientRect();
      const cr = container.getBoundingClientRect();
      const px = 1; // deterministic rounding tolerance only
      return (clipsX && (er.left < cr.left - px || er.right > cr.right + px)) ||
             (clipsY && (er.top < cr.top - px || er.bottom > cr.bottom + px));
    };

    const demote = (reason, standardAvailable) => ({
      eligible: false,
      reason,
      runner: standardAvailable ? 'standard-adapter-aware-structural-protocol' : 'existing-rail-fallback',
      composer: null,
      editor: null,
      row: null,
      send: null,
    });

    const resolveClaudeCapability = ({ site = 'claude', standardAvailable = true } = {}) => {
      if (site !== 'claude' || document.body.getAttribute('data-site') !== 'claude') {
        return demote('site-identity-mismatch', standardAvailable);
      }

      const composers = Array.from(document.querySelectorAll(
        `form[data-gitl-claude-blue-contract="${proof}"]`
      )).filter(visible);
      if (composers.length !== 1) {
        return demote(composers.length ? 'active-composer-ambiguous' : 'structural-signature-missing', standardAvailable);
      }
      const composer = composers[0];

      const editors = Array.from(composer.querySelectorAll('div.ProseMirror[contenteditable="true"]')).filter(visible);
      if (editors.length !== 1) {
        return demote(editors.length ? 'active-editor-ambiguous' : 'active-editor-missing', standardAvailable);
      }
      const editor = editors[0];

      const rows = Array.from(composer.querySelectorAll('[data-claude-actions]')).filter(visible);
      if (rows.length !== 1) {
        return demote(rows.length ? 'action-row-ambiguous' : 'action-row-missing', standardAvailable);
      }
      const row = rows[0];

      const sendCandidates = Array.from(composer.querySelectorAll(
        'button[aria-label="Send Message"],button[type="submit"],button[aria-label*="Send"]'
      )).filter(visible);
      if (sendCandidates.length !== 1) {
        return demote(sendCandidates.length ? 'send-ambiguous' : 'send-missing', standardAvailable);
      }
      const send = sendCandidates[0];

      if (send !== window.__xa2Send) return demote('exact-send-identity-mismatch', standardAvailable);
      if (!row.contains(send)) return demote('send-outside-action-row', standardAvailable);
      if (!composer.contains(editor) || !composer.contains(row)) return demote('ownership-mismatch', standardAvailable);
      const display = getComputedStyle(row).display;
      if (display !== 'flex' && display !== 'grid') return demote('action-row-not-structural', standardAvailable);
      if (clippedBy(send, row)) return demote('send-clipped', standardAvailable);

      return {
        eligible: true,
        reason: null,
        runner: 'certified-site-specific-runner',
        composer,
        editor,
        row,
        send,
      };
    };

    const createManager = ({
      site = 'claude',
      standardAvailable = true,
      actions,
      mutantPosition = 'static',
    } = {}) => {
      const resource = {
        generation: 0,
        mutations: 0,
        ignoredOwnMutations: 0,
        resizes: 0,
        repairs: 0,
        pendingRepair: false,
        mutationObserverConnected: false,
        resizeObserverConnected: false,
        listenerCount: 0,
        cleanupCount: 0,
      };
      let mount = null;
      let row = null;
      let send = null;
      let mutationObserver = null;
      let resizeObserver = null;
      let raf = 0;
      let closedReason = null;
      let finalRunner = null;
      let suppressNextMutation = false;

      const disconnectResources = () => {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        resource.pendingRepair = false;
        mutationObserver?.disconnect();
        resizeObserver?.disconnect();
        resource.mutationObserverConnected = false;
        resource.resizeObserverConnected = false;
      };

      const dropMount = () => {
        if (mount?.isConnected) mount.remove();
        mount = null;
        resource.listenerCount = 0;
      };

      const currentDemotion = (reason) => ({
        status: 'demoted',
        reason,
        runner: standardAvailable ? 'standard-adapter-aware-structural-protocol' : 'existing-rail-fallback',
        attemptedStructural: true,
      });

      const failClosed = (reason) => {
        closedReason = reason;
        finalRunner = standardAvailable ? 'standard-adapter-aware-structural-protocol' : 'existing-rail-fallback';
        disconnectResources();
        dropMount();
        resource.cleanupCount++;
        return currentDemotion(reason);
      };

      const verifyMount = () => {
        const capability = resolveClaudeCapability({ site, standardAvailable });
        if (!capability.eligible) return capability.reason;
        if (capability.row !== row || capability.send !== send) return 'capability-target-changed';
        if (!(mount instanceof Element) || !mount.isConnected || mount.parentElement !== row) return 'mount-disconnected';
        const position = getComputedStyle(mount).position;
        if (position === 'fixed' || position === 'absolute') return 'mount-not-in-flow';
        if (clippedBy(mount, row)) return 'mount-clipped';
        if (document.querySelectorAll(mountSelector).length !== 1) return 'duplicate-mount';
        if (window.__xa2Send !== send || !send.isConnected || !row.contains(send)) return 'send-identity-changed';
        return null;
      };

      const scheduleRepair = () => {
        if (resource.pendingRepair || closedReason) return;
        resource.pendingRepair = true;
        const generation = resource.generation;
        raf = requestAnimationFrame(() => {
          raf = 0;
          resource.pendingRepair = false;
          if (closedReason || generation !== resource.generation) return;

          const capability = resolveClaudeCapability({ site, standardAvailable });
          if (!capability.eligible) return void failClosed(capability.reason);
          if (capability.row !== row || capability.send !== send) return void failClosed('capability-target-changed');

          if (!mount?.isConnected || mount.parentElement !== row) {
            suppressNextMutation = true;
            row.append(mount);
          } else if (row.lastElementChild !== mount) {
            // Repair may reposition only the Ghost-owned node. Native controls,
            // including Send, are never moved, wrapped, cloned, or replaced.
            suppressNextMutation = true;
            row.append(mount);
          }
          resource.repairs++;
          const failure = verifyMount();
          if (failure) failClosed(failure);
        });
      };

      const buildShadowHost = () => {
        const host = document.createElement('div');
        host.setAttribute('data-gitl-mount', 'claude-blue-prototype');
        host.setAttribute('data-gitl-prototype-only', 'true');
        host.style.position = mutantPosition;
        host.style.display = 'inline-flex';
        host.style.alignItems = 'center';
        host.style.flex = '0 0 auto';

        const shadow = host.attachShadow({ mode: 'open', delegatesFocus: false });
        const style = document.createElement('style');
        style.textContent = ':host{font:inherit}.row{display:inline-flex;align-items:center;gap:4px}button{font:inherit;min-width:32px;min-height:32px}';
        const controls = document.createElement('div');
        controls.className = 'row';

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.setAttribute('aria-label', 'Toggle Ghost');
        toggle.textContent = 'G';
        toggle.addEventListener('click', () => actions?.toggle?.());
        resource.listenerCount++;

        const menu = document.createElement('button');
        menu.type = 'button';
        menu.setAttribute('aria-label', 'Open Ghost menu');
        menu.textContent = '+';
        menu.addEventListener('click', () => actions?.menu?.());
        resource.listenerCount++;

        controls.append(toggle, menu);
        shadow.append(style, controls);
        return host;
      };

      const mountNow = () => {
        const capability = resolveClaudeCapability({ site, standardAvailable });
        if (!capability.eligible) {
          finalRunner = capability.runner;
          return {
            status: 'demoted',
            reason: capability.reason,
            runner: capability.runner,
            attemptedStructural: false,
          };
        }

        const existing = document.querySelector(mountSelector);
        if (existing) return failClosed('duplicate-mount');

        row = capability.row;
        send = capability.send;
        resource.generation++;
        mount = buildShadowHost();
        row.append(mount);

        const firstFailure = verifyMount();
        if (firstFailure) return failClosed(firstFailure);

        mutationObserver = new MutationObserver(() => {
          resource.mutations++;
          if (suppressNextMutation) {
            suppressNextMutation = false;
            resource.ignoredOwnMutations++;
            return;
          }
          scheduleRepair();
        });
        mutationObserver.observe(row, { childList: true });
        resource.mutationObserverConnected = true;

        resizeObserver = new ResizeObserver(() => {
          resource.resizes++;
          scheduleRepair();
        });
        resizeObserver.observe(row);
        resizeObserver.observe(mount);
        resource.resizeObserverConnected = true;

        finalRunner = 'certified-site-specific-runner';
        return {
          status: 'structural',
          reason: null,
          runner: finalRunner,
          attemptedStructural: true,
        };
      };

      const unmount = () => {
        resource.generation++;
        disconnectResources();
        dropMount();
        resource.cleanupCount++;
        closedReason = 'unmounted';
        return { status: 'unmounted' };
      };

      const snapshot = () => ({
        ...resource,
        closedReason,
        finalRunner,
        mountCount: document.querySelectorAll(mountSelector).length,
        mountConnected: !!mount?.isConnected,
        mountIsFinalChild: !!(mount && mount.parentElement === row && row.lastElementChild === mount),
        sendIdentityPreserved: !!send && window.__xa2Send === send,
        sendConnected: !!window.__xa2Send?.isConnected,
        railConnected: !!document.querySelector('[data-fixture="existing-rail"]')?.isConnected,
      });

      return { mount: mountNow, unmount, snapshot, verify: verifyMount };
    };

    window.__claudeBluePrototype = {
      resolveClaudeCapability,
      createManager,
    };
  }, { proof: CLAUDE_PROOF, mountSelector: MOUNT_SELECTOR });
}

async function setup(page, width = 1280) {
  await page.setViewportSize({ width, height: width <= 480 ? 780 : 800 });
  await page.setContent(FIXTURE);
  await installPrototype(page);
}

async function createManager(page, options = {}) {
  return page.evaluate((opts) => {
    window.__activeClaudeBlue = window.__claudeBluePrototype.createManager({
      site: opts.site || 'claude',
      standardAvailable: opts.standardAvailable !== false,
      mutantPosition: opts.mutantPosition || 'static',
      actions: {
        toggle: () => { window.__xa2GhostActions.toggle++; },
        menu: () => { window.__xa2GhostActions.menu++; },
      },
    });
    return window.__activeClaudeBlue.mount();
  }, options);
}

async function snapshot(page) {
  return page.evaluate(() => window.__activeClaudeBlue?.snapshot());
}

async function settleRepair(page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

test.describe('Round-6 XA2 deterministic Claude Blue prototype', () => {
  test('mounts one in-flow open-Shadow Claude Blue cell with exact Send and zero passive actuation', async ({ page }) => {
    await setup(page, 1280);
    await page.focus('[data-claude-editor="active"]');
    const before = await page.evaluate(() => ({
      events: { ...window.__xa2Events },
      activeLabel: document.activeElement?.getAttribute('aria-label'),
      sendParent: window.__xa2Send?.parentElement?.getAttribute('data-claude-actions'),
    }));

    const result = await createManager(page);
    const after = await page.evaluate(() => {
      const host = document.querySelector('[data-gitl-mount="claude-blue-prototype"]');
      const buttons = host?.shadowRoot ? Array.from(host.shadowRoot.querySelectorAll('button')) : [];
      return {
        events: { ...window.__xa2Events },
        activeLabel: document.activeElement?.getAttribute('aria-label'),
        sendSame: window.__xa2Send === document.querySelector('[data-claude-send="active"]'),
        sendParent: window.__xa2Send?.parentElement?.getAttribute('data-claude-actions'),
        mountParent: host?.parentElement?.getAttribute('data-claude-actions'),
        mountPosition: host ? getComputedStyle(host).position : null,
        shadowOpen: !!host?.shadowRoot,
        delegatesFocus: host?.shadowRoot?.delegatesFocus ?? false,
        buttonTypes: buttons.map((button) => button.type),
        buttonNames: buttons.map((button) => button.getAttribute('aria-label')),
        railConnected: !!document.querySelector('[data-fixture="existing-rail"]')?.isConnected,
      };
    });

    expect(result).toMatchObject({ status: 'structural', runner: 'certified-site-specific-runner' });
    expect(after.events).toEqual(before.events);
    expect(after.activeLabel).toBe(before.activeLabel);
    expect(after.sendSame).toBe(true);
    expect(after.sendParent).toBe(before.sendParent);
    expect(after.mountParent).toBe('active');
    expect(after.mountPosition).not.toBe('fixed');
    expect(after.mountPosition).not.toBe('absolute');
    expect(after.shadowOpen).toBe(true);
    expect(after.delegatesFocus).toBe(false);
    expect(after.buttonTypes).toEqual(['button', 'button']);
    expect(after.buttonNames).toEqual(['Toggle Ghost', 'Open Ghost menu']);
    expect(after.railConnected).toBe(true);
  });

  test('narrow host growth repairs by moving only Ghost to the final position and keeps one mount', async ({ page }) => {
    await setup(page, 390);
    const beforeEvents = await page.evaluate(() => ({ ...window.__xa2Events }));
    await createManager(page);

    await page.evaluate(() => {
      const row = document.querySelector('[data-claude-actions="active"]');
      const native = document.createElement('button');
      native.type = 'button';
      native.setAttribute('data-native', 'late-tool');
      native.textContent = 'Late';
      row.append(native);
    });
    await settleRepair(page);

    const state = await snapshot(page);
    const after = await page.evaluate(() => ({
      events: { ...window.__xa2Events },
      sendSame: window.__xa2Send === document.querySelector('[data-claude-send="active"]'),
      nativeConnected: !!document.querySelector('[data-native="late-tool"]')?.isConnected,
      mountIsLast: document.querySelector('[data-claude-actions="active"]')?.lastElementChild?.matches('[data-gitl-mount="claude-blue-prototype"]'),
    }));

    expect(state.mountCount).toBe(1);
    expect(state.mountIsFinalChild).toBe(true);
    expect(state.repairs).toBeGreaterThanOrEqual(1);
    expect(after.mountIsLast).toBe(true);
    expect(after.nativeConnected).toBe(true);
    expect(after.sendSame).toBe(true);
    expect(after.events).toEqual(beforeEvents);
  });

  test('intentional Ghost activation invokes only the reviewed Ghost callback and never Send/submit', async ({ page }) => {
    await setup(page);
    await createManager(page);

    await page.locator('[data-gitl-mount="claude-blue-prototype"]').getByRole('button', { name: 'Toggle Ghost' }).click();
    const observed = await page.evaluate(() => ({
      events: { ...window.__xa2Events },
      actions: { ...window.__xa2GhostActions },
    }));

    expect(observed.actions).toEqual({ toggle: 1, menu: 0 });
    expect(observed.events.sendClicks).toBe(0);
    expect(observed.events.submit).toBe(0);
    expect(observed.events.input).toBe(0);
    expect(observed.events.keydown).toBe(0);
  });

  test('exact Send replacement after mount fails closed, removes Ghost, and demotes without actuation', async ({ page }) => {
    await setup(page);
    await createManager(page);
    const beforeEvents = await page.evaluate(() => ({ ...window.__xa2Events }));

    await page.evaluate(() => {
      const oldSend = window.__xa2Send;
      const replacement = oldSend.cloneNode(true);
      oldSend.replaceWith(replacement);
    });
    await settleRepair(page);

    const state = await snapshot(page);
    const events = await page.evaluate(() => ({ ...window.__xa2Events }));
    expect(state.mountCount).toBe(0);
    expect(state.closedReason).toBe('exact-send-identity-mismatch');
    expect(state.finalRunner).toBe('standard-adapter-aware-structural-protocol');
    expect(state.railConnected).toBe(true);
    expect(events).toEqual(beforeEvents);
  });

  test('ambiguous certified composers visibly demote before any structural mount', async ({ page }) => {
    await setup(page);
    await page.evaluate((proof) => {
      const original = document.querySelector('form[data-claude-composer="active"]');
      const clone = original.cloneNode(true);
      clone.setAttribute('data-claude-composer', 'second-visible');
      clone.setAttribute('data-gitl-claude-blue-contract', proof);
      clone.querySelector('[data-claude-send]')?.setAttribute('data-claude-send', 'second-visible');
      original.after(clone);
    }, CLAUDE_PROOF);

    const result = await createManager(page);
    const state = await snapshot(page);
    expect(result).toMatchObject({
      status: 'demoted',
      reason: 'active-composer-ambiguous',
      runner: 'standard-adapter-aware-structural-protocol',
      attemptedStructural: false,
    });
    expect(state.mountCount).toBe(0);
    expect(state.railConnected).toBe(true);
  });

  test('if specialized and standard capability are unavailable the existing rail is the final path', async ({ page }) => {
    await setup(page);
    await page.evaluate(() => {
      document.querySelector('form[data-claude-composer="active"]')?.removeAttribute('data-gitl-claude-blue-contract');
    });

    const result = await createManager(page, { standardAvailable: false });
    const state = await snapshot(page);
    expect(result).toMatchObject({
      status: 'demoted',
      reason: 'structural-signature-missing',
      runner: 'existing-rail-fallback',
      attemptedStructural: false,
    });
    expect(state.mountCount).toBe(0);
    expect(state.railConnected).toBe(true);
  });

  test('clipped narrow action row demotes rather than claiming a specialized Blue success', async ({ page }) => {
    await setup(page, 390);
    await page.evaluate(() => {
      const row = document.querySelector('[data-claude-actions="active"]');
      row.style.width = '92px';
      row.style.overflow = 'hidden';
      row.style.flexWrap = 'nowrap';
      for (let i = 0; i < 5; i++) {
        const native = document.createElement('button');
        native.type = 'button';
        native.textContent = `N${i}`;
        row.insertBefore(native, window.__xa2Send);
      }
    });

    const result = await createManager(page);
    const state = await snapshot(page);
    expect(result).toMatchObject({
      status: 'demoted',
      reason: 'send-clipped',
      runner: 'standard-adapter-aware-structural-protocol',
      attemptedStructural: false,
    });
    expect(state.mountCount).toBe(0);
    expect(state.railConnected).toBe(true);
  });

  test('an unsafe fixed-position specialized mutant fails visibly instead of passing through fallback', async ({ page }) => {
    await setup(page);
    const result = await createManager(page, { mutantPosition: 'fixed' });
    const state = await snapshot(page);

    expect(result).toMatchObject({
      status: 'demoted',
      reason: 'mount-not-in-flow',
      runner: 'standard-adapter-aware-structural-protocol',
      attemptedStructural: true,
    });
    expect(state.mountCount).toBe(0);
    expect(state.closedReason).toBe('mount-not-in-flow');
    expect(state.railConnected).toBe(true);
  });
});
