'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const source = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

test('Ghost preserves existing UI after host page-body replacement without Send', () => {
  const start = source.indexOf('// Recover the EXISTING panel');
  const end = source.indexOf('\nrender();\nwindow.__GITL_V9__ = true;', start);
  expect(start).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(start);
  const recovery = source.slice(start, end);
  expect(recovery).not.toMatch(/sendOnce|setComposerText|requestSubmit|button\.click/);
  expect(recovery).toContain("ghostMountObserver.observe(document, { childList: true, subtree: true })");
  const hostA = { appendChild(node) { node.parentNode = this; node.isConnected = true; } };
  const hostB = { appendChild(node) { node.parentNode = this; node.isConnected = true; } };
  const root = { appendChild(node) { node.parentNode = this; node.isConnected = true; } };
  const style = { isConnected: true };
  const panel = { isConnected: true, parentNode: hostA, state: 'preserved' };
  const callbacks = [];
  const doc = {
    body: hostA,
    documentElement: root,
    hidden: false,
    addEventListener() {}
  };
  const listeners = {};
  const ctx = {
    document: doc,
    style, panel,
    log() {},
    MutationObserver: class { constructor(callback) { this.callback=callback; } observe() {} },
    setTimeout(callback) { callbacks.push(callback); },
    setInterval() {},
    window: { addEventListener(name, callback) { listeners[name] = callback; } },
    console
  };
  vm.runInNewContext(recovery + '\nthis.repair = ensureGhostMounted; this.queue = scheduleGhostRemount;', ctx);
  doc.body = hostB;
  panel.isConnected = false;
  ctx.queue('test-body-swap');
  expect(callbacks).toHaveLength(1);
  callbacks.shift()();
  expect(panel.parentNode).toBe(hostB);
  expect(panel.state).toBe('preserved');
  ctx.queue('already-mounted');
  expect(callbacks).toHaveLength(0);
  panel.isConnected = false; style.isConnected = false;
  ctx.queue('test-style-swap');
  callbacks.shift()();
  expect(style.isConnected).toBe(true);
  expect(panel.parentNode).toBe(hostB);
  expect(listeners.pageshow).toBeDefined();
});

test('published source remains one-Send and version-consistent', () => {
  expect(source).toContain('// @version      9.0.1-alpha.12');
  expect(source).toContain("const VER = '9.0.1-alpha.12'");
  expect((source.match(/button\.click\(\)/g) || []).length).toBe(1);
  expect(source).not.toContain('requestSubmit(');
});
