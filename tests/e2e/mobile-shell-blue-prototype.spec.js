// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Round-6 A2 DELIVERY-PRESSURE prototype.
 *
 * This is intentionally a deterministic fixture-owned structural candidate,
 * not a live ChatGPT binding. The prototype refuses to mount unless the host
 * container carries the fixture-only proof token below. This gives Builder and
 * Red Team real executable code to falsify while preserving the A1X rule that
 * current authenticated ChatGPT structure and the exact live insertion slot
 * remain UNKNOWN until captured.
 *
 * The candidate models the smallest Blue primitive:
 *   - ordinary in-flow host element;
 *   - one open ShadowRoot built entirely with DOM APIs (no innerHTML sink);
 *   - exact caller-supplied Send node identity, never moved/wrapped/cloned;
 *   - one scoped MutationObserver and one ResizeObserver;
 *   - coalesced generation-guarded repair that moves only Ghost;
 *   - no host style mutation;
 *   - fail-closed removal to the pre-existing rail state on verification loss;
 *   - direct callbacks supplied by the existing Ghost action/state authority.
 */

const PROOF = 'fixture-blue-v1';

const FIXTURE = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font: 14px system-ui; min-height: 100vh; }
  #gitl { position: fixed; right: 8px; bottom: 8px; width: 44px; height: 44px; }
  [data-fixture="composer-stack"] { display: flex; flex-direction: column; width: min(760px, calc(100vw - 24px)); margin: 40px auto; }
  form[data-type="unified-composer"] { display: flex; flex-direction: column; gap: 8px; border: 1px solid #999; border-radius: 22px; padding: 10px; }
  #prompt-textarea { min-height: 54px; outline: none; }
  [data-testid="composer-actions"] { display: flex; align-items: center; gap: 8px; min-height: 40px; }
  [data-testid="composer-actions"] > button { width: 36px; height: 36px; }
  [data-testid="send-button"] { margin-left: auto; }
  [data-fixture="hidden-composer"] { display: none; }
  @media (max-width: 480px) {
    [data-fixture="composer-stack"] { width: calc(100vw - 12px); margin: 20px auto; }
    [data-testid="composer-actions"] { flex-wrap: wrap; }
  }
</style>
</head>
<body>
<div id="gitl" data-fixture="existing-rail" aria-label="Existing Ghost rail"></div>
<div data-fixture="composer-stack">
  <form data-testid="composer" data-type="unified-composer">
    <div id="prompt-textarea" class="ProseMirror" contenteditable="true" role="textbox" tabindex="0" aria-label="Message ChatGPT"></div>
    <div data-testid="composer-actions" data-gitl-prototype-contract="${PROOF}">
      <button data-testid="composer-attachment-button" type="button" aria-label="Add files">+</button>
      <button data-testid="model-selector-dropdown" type="button" aria-label="Model selector">Instant</button>
      <button data-testid="send-button" type="button" aria-label="Send prompt">↑</button>
    </div>
  </form>
</div>
<div data-fixture="hidden-composer">
  <form data-testid="composer">
    <textarea></textarea>
    <div data-testid="composer-actions" data-gitl-prototype-contract="not-approved">
      <button data-testid="send-button" type="button">hidden send</button>
    </div>
  </form>
</div>
<script>
  window.__probeEvents = { click: 0, submit: 0, input: 0, keydown: 0, sendClicks: 0 };
  for (const type of ['click', 'submit', 'input', 'keydown']) {
    document.addEventListener(type, () => { window.__probeEvents[type]++; }, true);
  }
  const send = document.querySelector('form[data-type="unified-composer"] button[data-testid="send-button"]');
  send.addEventListener('click', () => { window.__probeEvents.sendClicks++; });
  window.__fixtureSend = send;
  window.__ghostActions = { toggle: 0, menu: 0 };
</script>
</body>
</html>`;

async function installPrototype(page) {
  await page.evaluate(({ proof }) => {
    const MOUNT_SELECTOR = '[data-gitl-mount="blue-prototype"]';

    const visible = (el) => {
      if (!(el instanceof Element) || !el.isConnected) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };

    const createManager = ({ enabled, container, send, actions, mutantPosition = 'static' }) => {
      const resource = {
        generation: 0,
        mutations: 0,
        resizes: 0,
        repairs: 0,
        pendingRepair: false,
        mutationObserverConnected: false,
        resizeObserverConnected: false,
        listenerCount: 0,
        cleanupCount: 0,
      };
      let mount = null;
      let mutationObserver = null;
      let resizeObserver = null;
      let raf = 0;
      let closedReason = null;
      const hostStyleBefore = container instanceof Element ? container.getAttribute('style') : null;

      const contractReason = () => {
        if (!enabled) return 'experimental-gate-disabled';
        if (!(container instanceof Element) || !container.isConnected) return 'container-disconnected';
        if (container.getAttribute('data-gitl-prototype-contract') !== proof) return 'container-unverified';
        if (!(send instanceof Element) || !send.isConnected || !container.contains(send)) return 'send-outside-container';
        if (!visible(send)) return 'send-not-visible';
        const display = getComputedStyle(container).display;
        if (display !== 'flex' && display !== 'grid') return 'container-not-structural-row';
        return null;
      };

      const verifyMount = () => {
        const contractFailure = contractReason();
        if (contractFailure) return contractFailure;
        if (!(mount instanceof Element) || !mount.isConnected || mount.parentElement !== container) return 'mount-disconnected';
        const position = getComputedStyle(mount).position;
        if (position === 'fixed' || position === 'absolute') return 'mount-not-in-flow';
        if (document.querySelectorAll(MOUNT_SELECTOR).length !== 1) return 'duplicate-mount';
        if (window.__fixtureSend !== send) return 'send-identity-changed';
        return null;
      };

      const disconnectResources = () => {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        resource.pendingRepair = false;
        mutationObserver?.disconnect();
        resizeObserver?.disconnect();
        resource.mutationObserverConnected = false;
        resource.resizeObserverConnected = false;
      };

      const failClosed = (reason) => {
        closedReason = reason;
        disconnectResources();
        if (mount?.isConnected) mount.remove();
        resource.cleanupCount++;
        return { status: 'rejected', reason, fallback: 'rail', attemptedStructural: true };
      };

      const scheduleRepair = () => {
        if (resource.pendingRepair || closedReason) return;
        resource.pendingRepair = true;
        const generation = resource.generation;
        raf = requestAnimationFrame(() => {
          raf = 0;
          resource.pendingRepair = false;
          if (closedReason || generation !== resource.generation) return;
          const contractFailure = contractReason();
          if (contractFailure) return void failClosed(contractFailure);
          if (!mount?.isConnected || mount.parentElement !== container) {
            container.append(mount);
          } else if (container.lastElementChild !== mount) {
            // Blue repair may move only the Ghost-owned host. Native controls,
            // including Send, are never moved or wrapped.
            container.append(mount);
          }
          resource.repairs++;
          const failure = verifyMount();
          if (failure) failClosed(failure);
        });
      };

      const buildShadow = () => {
        const host = document.createElement('div');
        host.setAttribute('data-gitl-mount', 'blue-prototype');
        host.setAttribute('data-gitl-prototype-only', 'true');
        host.style.position = mutantPosition;
        host.style.display = 'inline-flex';
        host.style.alignItems = 'center';
        host.style.flex = '0 0 auto';

        const shadow = host.attachShadow({ mode: 'open', delegatesFocus: false });
        const style = document.createElement('style');
        style.textContent = ':host{font:inherit} .row{display:inline-flex;align-items:center;gap:4px} button{font:inherit;min-width:32px;min-height:32px}';
        const row = document.createElement('div');
        row.className = 'row';

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.setAttribute('aria-label', 'Toggle Ghost');
        toggle.textContent = 'G';
        const onToggle = () => actions?.toggle?.();
        toggle.addEventListener('click', onToggle);
        resource.listenerCount++;

        const menu = document.createElement('button');
        menu.type = 'button';
        menu.setAttribute('aria-label', 'Open Ghost menu');
        menu.textContent = '+';
        const onMenu = () => actions?.menu?.();
        menu.addEventListener('click', onMenu);
        resource.listenerCount++;

        row.append(toggle, menu);
        shadow.append(style, row);
        return host;
      };

      const mountNow = () => {
        const contractFailure = contractReason();
        if (contractFailure) {
          return { status: 'rail', reason: contractFailure, fallback: 'rail', attemptedStructural: false };
        }
        const existing = document.querySelector(MOUNT_SELECTOR);
        if (existing) {
          if (existing === mount && mount?.parentElement === container) {
            return { status: 'structural', reason: null, reused: true };
          }
          return failClosed('duplicate-mount');
        }

        resource.generation++;
        mount = buildShadow();
        container.append(mount);

        const firstFailure = verifyMount();
        if (firstFailure) return failClosed(firstFailure);

        mutationObserver = new MutationObserver(() => {
          resource.mutations++;
          scheduleRepair();
        });
        mutationObserver.observe(container, { childList: true });
        resource.mutationObserverConnected = true;

        resizeObserver = new ResizeObserver(() => {
          resource.resizes++;
          scheduleRepair();
        });
        resizeObserver.observe(container);
        resizeObserver.observe(mount);
        resource.resizeObserverConnected = true;

        return { status: 'structural', reason: null, reused: false };
      };

      const unmount = () => {
        resource.generation++;
        disconnectResources();
        if (mount?.isConnected) mount.remove();
        resource.cleanupCount++;
        closedReason = 'unmounted';
        return {
          status: 'unmounted',
          hostStyleRestored: (container instanceof Element ? container.getAttribute('style') : null) === hostStyleBefore,
        };
      };

      const snapshot = () => ({
        ...resource,
        closedReason,
        mountCount: document.querySelectorAll(MOUNT_SELECTOR).length,
        mountConnected: !!mount?.isConnected,
        mountIsFinalChild: !!(mount && mount.parentElement === container && container.lastElementChild === mount),
        sendIdentityPreserved: window.__fixtureSend === send,
        sendConnected: !!send?.isConnected,
        hostStyleUnchanged: (container instanceof Element ? container.getAttribute('style') : null) === hostStyleBefore,
      });

      return { mount: mountNow, unmount, snapshot, verify: verifyMount };
    };

    window.__gitlBluePrototype = { createManager };
  }, { proof: PROOF });
}

async function setup(page, width = 1280) {
  await page.setViewportSize({ width, height: width <= 480 ? 780 : 800 });
  await page.setContent(FIXTURE);
  await installPrototype(page);
}

async function createApprovedManager(page, options = {}) {
  return page.evaluate((opts) => {
    const container = document.querySelector('form[data-type="unified-composer"] [data-testid="composer-actions"]');
    const send = window.__fixtureSend;
    window.__activeBlueManager = window.__gitlBluePrototype.createManager({
      enabled: opts.enabled !== false,
      container,
      send,
      mutantPosition: opts.mutantPosition || 'static',
      actions: {
        toggle: () => { window.__ghostActions.toggle++; },
        menu: () => { window.__ghostActions.menu++; },
      },
    });
    return window.__activeBlueManager.mount();
  }, options);
}

async function snapshot(page) {
  return page.evaluate(() => window.__activeBlueManager?.snapshot());
}

test.describe('Round-6 A2 deterministic Blue prototype', () => {
  test('mounts one in-flow open-Shadow Blue cell without passive actuation or Send mutation', async ({ page }) => {
    await setup(page, 1280);
    await page.focus('#prompt-textarea');
    const before = await page.evaluate(() => ({
      send: window.__fixtureSend,
      activeId: document.activeElement?.id,
      events: { ...window.__probeEvents },
      railConnected: document.querySelector('[data-fixture="existing-rail"]')?.isConnected,
      hostStyle: document.querySelector('[data-testid="composer-actions"]')?.getAttribute('style'),
    }));

    const result = await createApprovedManager(page);
    const after = await page.evaluate(() => {
      const host = document.querySelector('[data-gitl-mount="blue-prototype"]');
      const buttons = host?.shadowRoot ? Array.from(host.shadowRoot.querySelectorAll('button')) : [];
      return {
        activeId: document.activeElement?.id,
        sendSame: window.__fixtureSend === document.querySelector('form[data-type="unified-composer"] button[data-testid="send-button"]'),
        sendConnected: window.__fixtureSend?.isConnected,
        mountParent: host?.parentElement?.getAttribute('data-testid'),
        mountPosition: host ? getComputedStyle(host).position : null,
        shadowOpen: !!host?.shadowRoot,
        delegatesFocus: host?.shadowRoot?.delegatesFocus ?? false,
        buttonTypes: buttons.map((b) => b.type),
        buttonNames: buttons.map((b) => b.getAttribute('aria-label')),
        events: { ...window.__probeEvents },
        railConnected: document.querySelector('[data-fixture="existing-rail"]')?.isConnected,
        hostStyle: document.querySelector('[data-testid="composer-actions"]')?.getAttribute('style'),
      };
    });
    const resources = await snapshot(page);

    expect(result).toEqual({ status: 'structural', reason: null, reused: false });
    expect(before.activeId).toBe('prompt-textarea');
    expect(after.activeId).toBe('prompt-textarea');
    expect(after.sendSame).toBe(true);
    expect(after.sendConnected).toBe(true);
    expect(after.mountParent).toBe('composer-actions');
    expect(['static', 'relative']).toContain(after.mountPosition);
    expect(after.shadowOpen).toBe(true);
    expect(after.delegatesFocus).toBe(false);
    expect(after.buttonTypes).toEqual(['button', 'button']);
    expect(after.buttonNames).toEqual(['Toggle Ghost', 'Open Ghost menu']);
    expect(after.events).toEqual(before.events);
    expect(after.railConnected).toBe(true);
    expect(after.hostStyle).toBe(before.hostStyle);
    expect(resources.mountCount).toBe(1);
    expect(resources.sendIdentityPreserved).toBe(true);
    expect(resources.hostStyleUnchanged).toBe(true);
    expect(resources.mutationObserverConnected).toBe(true);
    expect(resources.resizeObserverConnected).toBe(true);
  });

  test('narrow host-control growth repairs by moving only the same Ghost host and cleans up exactly', async ({ page }) => {
    await setup(page, 390);
    await createApprovedManager(page);

    const identitiesBefore = await page.evaluate(() => ({
      send: window.__fixtureSend,
      mount: document.querySelector('[data-gitl-mount="blue-prototype"]'),
      hostStyle: document.querySelector('[data-testid="composer-actions"]')?.getAttribute('style'),
    }));

    await page.evaluate(() => {
      const row = document.querySelector('form[data-type="unified-composer"] [data-testid="composer-actions"]');
      const native = document.createElement('button');
      native.type = 'button';
      native.setAttribute('data-testid', 'new-native-control');
      native.textContent = 'N';
      row.append(native);
    });

    await expect.poll(async () => (await snapshot(page)).mountIsFinalChild).toBe(true);
    const afterRepair = await page.evaluate(() => ({
      sameSend: window.__fixtureSend === document.querySelector('form[data-type="unified-composer"] button[data-testid="send-button"]'),
      sameMount: window.__activeBlueManager && document.querySelector('[data-gitl-mount="blue-prototype"]'),
      mountCount: document.querySelectorAll('[data-gitl-mount="blue-prototype"]').length,
      newNativeConnected: document.querySelector('[data-testid="new-native-control"]')?.isConnected,
      events: { ...window.__probeEvents },
    }));
    const repairResources = await snapshot(page);

    expect(afterRepair.sameSend).toBe(true);
    expect(afterRepair.mountCount).toBe(1);
    expect(afterRepair.newNativeConnected).toBe(true);
    expect(repairResources.repairs).toBeGreaterThanOrEqual(1);
    expect(repairResources.pendingRepair).toBe(false);
    expect(repairResources.sendIdentityPreserved).toBe(true);
    expect(afterRepair.events.submit).toBe(0);
    expect(afterRepair.events.sendClicks).toBe(0);

    const unmount = await page.evaluate(() => window.__activeBlueManager.unmount());
    const final = await snapshot(page);
    const finalDom = await page.evaluate(() => ({
      mountCount: document.querySelectorAll('[data-gitl-mount="blue-prototype"]').length,
      sendSame: window.__fixtureSend === document.querySelector('form[data-type="unified-composer"] button[data-testid="send-button"]'),
      hostStyle: document.querySelector('[data-testid="composer-actions"]')?.getAttribute('style'),
    }));

    expect(unmount).toEqual({ status: 'unmounted', hostStyleRestored: true });
    expect(finalDom.mountCount).toBe(0);
    expect(finalDom.sendSame).toBe(true);
    expect(finalDom.hostStyle).toBe(identitiesBefore.hostStyle);
    expect(final.mutationObserverConnected).toBe(false);
    expect(final.resizeObserverConnected).toBe(false);
    expect(final.pendingRepair).toBe(false);
    expect(final.hostStyleUnchanged).toBe(true);
  });

  test('intentional Ghost activation calls existing callbacks once and never actuates Send or form submit', async ({ page }) => {
    await setup(page, 1280);
    await createApprovedManager(page);

    const host = page.locator('[data-gitl-mount="blue-prototype"]');
    await host.locator('button[aria-label="Toggle Ghost"]').click();
    await host.locator('button[aria-label="Open Ghost menu"]').click();

    const result = await page.evaluate(() => ({
      actions: { ...window.__ghostActions },
      events: { ...window.__probeEvents },
      sendSame: window.__fixtureSend === document.querySelector('form[data-type="unified-composer"] button[data-testid="send-button"]'),
    }));

    expect(result.actions).toEqual({ toggle: 1, menu: 1 });
    expect(result.events.submit).toBe(0);
    expect(result.events.sendClicks).toBe(0);
    expect(result.sendSame).toBe(true);
  });

  test('kills fixed-position and unverified-container mutants visibly instead of masking them as structural PASS', async ({ page }) => {
    await setup(page, 1280);
    const fixed = await createApprovedManager(page, { mutantPosition: 'fixed' });
    const fixedSnapshot = await snapshot(page);

    expect(fixed).toEqual({ status: 'rejected', reason: 'mount-not-in-flow', fallback: 'rail', attemptedStructural: true });
    expect(fixedSnapshot.mountCount).toBe(0);
    expect(fixedSnapshot.closedReason).toBe('mount-not-in-flow');
    expect(fixedSnapshot.sendIdentityPreserved).toBe(true);

    await page.evaluate(() => {
      const hiddenRow = document.querySelector('[data-fixture="hidden-composer"] [data-testid="composer-actions"]');
      const hiddenSend = hiddenRow.querySelector('[data-testid="send-button"]');
      window.__activeBlueManager = window.__gitlBluePrototype.createManager({
        enabled: true,
        container: hiddenRow,
        send: hiddenSend,
        actions: {},
      });
    });
    const hidden = await page.evaluate(() => window.__activeBlueManager.mount());
    const hiddenSnapshot = await snapshot(page);

    expect(hidden).toEqual({ status: 'rail', reason: 'container-unverified', fallback: 'rail', attemptedStructural: false });
    expect(hiddenSnapshot.mountCount).toBe(0);
    expect(hiddenSnapshot.sendIdentityPreserved).toBe(false);
    expect(await page.locator('[data-fixture="existing-rail"]').count()).toBe(1);
  });

  test('experimental gate disabled performs no structural mutation', async ({ page }) => {
    await setup(page, 1280);
    const before = await page.evaluate(() => ({
      childCount: document.querySelector('[data-testid="composer-actions"]').children.length,
      send: window.__fixtureSend,
      events: { ...window.__probeEvents },
    }));
    const result = await createApprovedManager(page, { enabled: false });
    const after = await page.evaluate(() => ({
      childCount: document.querySelector('[data-testid="composer-actions"]').children.length,
      sameSend: window.__fixtureSend === document.querySelector('form[data-type="unified-composer"] button[data-testid="send-button"]'),
      events: { ...window.__probeEvents },
      mountCount: document.querySelectorAll('[data-gitl-mount="blue-prototype"]').length,
    }));

    expect(result).toEqual({ status: 'rail', reason: 'experimental-gate-disabled', fallback: 'rail', attemptedStructural: false });
    expect(after.childCount).toBe(before.childCount);
    expect(after.sameSend).toBe(true);
    expect(after.events).toEqual(before.events);
    expect(after.mountCount).toBe(0);
  });
});
