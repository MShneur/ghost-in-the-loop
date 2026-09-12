#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const write = (p, s) => fs.writeFileSync(path.join(root, p), s);

function replaceOne(text, from, to, label) {
  const count = text.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one match, found ${count}`);
  console.log(`patch: ${label}`);
  return text.replace(from, to);
}

let src = read('ghost-in-the-loop.user.js');
src = replaceOne(src, '@version      8.8.5', '@version      8.8.6', 'userscript header version');
src = replaceOne(src, "const VER = '8.8.5';", "const VER = '8.8.6';", 'runtime version');

const lifecycle = String.raw`
/* ── 8.8.6 host lifecycle controller ────────────────────────────
   Read-only host/composer invalidation tracking. This layer may reacquire and
   verify reviewed controls BEFORE dispatch; it never actuates Send and never
   authorizes heuristic/learned selectors. The 8.8.5 at-most-once transaction
   remains the only dispatch authority. */
const HOST_LIFECYCLE = {
  epoch: 0,
  routeEpoch: 0,
  composer: null,
  observer: null,
  started: false,
  pending: false,
  lastHref: String(location.href || ''),
  lastReason: 'boot'
};

function _hostLifecycleRecord(reason, extra = {}) {
  HOST_LIFECYCLE.lastReason = String(reason || 'unknown');
  Timeline.record('host_lifecycle', {
    reason: HOST_LIFECYCLE.lastReason,
    epoch: HOST_LIFECYCLE.epoch,
    route_epoch: HOST_LIFECYCLE.routeEpoch,
    composer_replaced: !!extra.composerReplaced,
    composer_connected: !!extra.composerConnected,
    route_changed: !!extra.routeChanged,
    failure_stage: extra.failureStage || null,
    failure_code: extra.failureCode || null
  });
}

function _hostLifecycleRefresh(reason = 'poll') {
  const previous = HOST_LIFECYCLE.composer;
  const current = Adapter.peekInput();
  const replaced = !!previous && previous !== current;
  const disconnected = !!previous && previous.isConnected === false;
  if (replaced || disconnected) {
    HOST_LIFECYCLE.epoch += 1;
    _hostLifecycleRecord(reason, {
      composerReplaced: true,
      composerConnected: !!current && current.isConnected !== false
    });
  }
  HOST_LIFECYCLE.composer = current || null;
  return { input: current || null, replaced: replaced || disconnected, epoch: HOST_LIFECYCLE.epoch };
}

function _hostLifecycleRouteChanged(reason = 'spa') {
  const href = String(location.href || '');
  if (href === HOST_LIFECYCLE.lastHref) return false;
  HOST_LIFECYCLE.lastHref = href;
  HOST_LIFECYCLE.routeEpoch += 1;
  HOST_LIFECYCLE.epoch += 1;
  HOST_LIFECYCLE.composer = null;
  _hostLifecycleRecord(reason, { routeChanged: true });
  return true;
}

function _hostLifecycleSchedule(reason = 'mutation') {
  if (HOST_LIFECYCLE.pending) return;
  HOST_LIFECYCLE.pending = true;
  const run = () => {
    HOST_LIFECYCLE.pending = false;
    _hostLifecycleRouteChanged(reason);
    _hostLifecycleRefresh(reason);
  };
  if (typeof queueMicrotask === 'function') queueMicrotask(run);
  else Promise.resolve().then(run);
}

function startHostLifecycleController() {
  if (HOST_LIFECYCLE.started) return;
  HOST_LIFECYCLE.started = true;
  HOST_LIFECYCLE.composer = Adapter.peekInput() || null;

  if (typeof MutationObserver === 'function' && document.documentElement) {
    HOST_LIFECYCLE.observer = new MutationObserver(() => _hostLifecycleSchedule('mutation'));
    HOST_LIFECYCLE.observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  for (const name of ['popstate', 'hashchange']) {
    window.addEventListener(name, () => _hostLifecycleSchedule('spa'), { passive: true });
  }

  for (const method of ['pushState', 'replaceState']) {
    const original = history?.[method];
    if (typeof original !== 'function' || original.__gitl886Wrapped) continue;
    const wrapped = function(...args) {
      const result = original.apply(this, args);
      _hostLifecycleSchedule('spa');
      return result;
    };
    try { Object.defineProperty(wrapped, '__gitl886Wrapped', { value: true }); } catch(_) {}
    history[method] = wrapped;
  }

  window.addEventListener('pagehide', () => {
    try { HOST_LIFECYCLE.observer?.disconnect(); } catch(_) {}
    HOST_LIFECYCLE.observer = null;
    HOST_LIFECYCLE.started = false;
  }, { once: true });
}

async function _verifyLifecycleComposer(stagedInput, expectedText) {
  const before = _hostLifecycleRefresh('pre-dispatch');
  const current = before.input || stagedInput;
  if (!current || current.isConnected === false) {
    _hostLifecycleRecord('pre-dispatch-failure', {
      composerReplaced: true,
      composerConnected: false,
      failureStage: 'pre-dispatch-reacquire',
      failureCode: 'COMPOSER-MISSING'
    });
    return { ok: false, input: null, replaced: true, polls: 0, epoch: before.epoch, failureCode: 'COMPOSER-MISSING' };
  }
  const staged = await _awaitStagedComposer(current, expectedText, 900);
  if (!staged.ok) {
    _hostLifecycleRecord('pre-dispatch-failure', {
      composerReplaced: !!(before.replaced || staged.replaced),
      composerConnected: current.isConnected !== false,
      failureStage: 'pre-dispatch-reverify',
      failureCode: 'COMPOSER-UNVERIFIED'
    });
  }
  return {
    ...staged,
    replaced: !!(before.replaced || staged.replaced),
    epoch: HOST_LIFECYCLE.epoch,
    routeEpoch: HOST_LIFECYCLE.routeEpoch,
    failureCode: staged.ok ? null : 'COMPOSER-UNVERIFIED'
  };
}

startHostLifecycleController();
`;

src = replaceOne(
  src,
  'async function engineSend(text, skipDelay) {',
  lifecycle + '\nasync function engineSend(text, skipDelay) {',
  'host lifecycle insertion'
);

src = replaceOne(
  src,
  'const finalStage = await _awaitStagedComposer(stagedInput, text, 1200);',
  'const finalStage = await _verifyLifecycleComposer(stagedInput, text);',
  'pre-dispatch lifecycle verification'
);

src = replaceOne(
  src,
  'suppressed_routes: Number(strategy?.preflight?.suppressedRoutes || 0)\n    });',
  'suppressed_routes: Number(strategy?.preflight?.suppressedRoutes || 0),\n      lifecycle_epoch: HOST_LIFECYCLE.epoch,\n      route_epoch: HOST_LIFECYCLE.routeEpoch\n    });',
  'route lifecycle telemetry'
);

write('ghost-in-the-loop.user.js', src);

for (const p of ['package.json', 'package-lock.json']) {
  const j = JSON.parse(read(p));
  j.version = '8.8.6';
  if (p === 'package-lock.json' && j.packages?.['']) j.packages[''].version = '8.8.6';
  write(p, JSON.stringify(j, null, 2) + '\n');
}
const manifest = JSON.parse(read('extension/manifest.json'));
manifest.version = '8.8.6';
write('extension/manifest.json', JSON.stringify(manifest, null, 2) + '\n');

let changelog = read('CHANGELOG.md');
const entry = `## [8.8.6] — host lifecycle and composer remount hardening\n\n- Add a read-only host lifecycle controller that observes composer subtree replacement and SPA navigation without gaining Send authority.\n- Reacquire and re-verify the exact staged composer immediately before the existing 8.8.5 route-selection boundary. If the live editor cannot prove the intended text, fail before dispatch.\n- Reset bounded lifecycle state on SPA route changes and clean up the mutation observer on pagehide.\n- Record redacted lifecycle epoch/remount/route-change metadata and exact pre-dispatch lifecycle failure stage without prompts, selectors, URLs, conversation IDs, or user-agent strings.\n- Preserve Perplexity single-write staging and the 8.8.5 at-most-once rule: after an actuator may have fired or delivery is ambiguous, no second automatic actuator is attempted.\n\n`;
if (!changelog.includes('## [8.8.6]')) changelog = changelog.replace(/^# Changelog\s*\n/, m => m + '\n' + entry);
write('CHANGELOG.md', changelog);

console.log('Applied 8.8.6 host lifecycle hardening.');
