const fs = require('fs');
const path = require('path');
const vm = require('vm');

const content = fs.readFileSync(
  path.join(__dirname, '../extension/content.js'),
  'utf8'
);
const shimEnd = content.indexOf('function GM_addStyle');
const shim = content.slice(0, shimEnd) + `
globalThis.__shim = { GM_getValue, GM_setValue, cache: _cache };
`;

function bootShim(initial = {}) {
  const listeners = [];
  const writes = [];
  const storage = {
    local: {
      get: async () => ({ ...initial }),
      set: async value => { writes.push(value); }
    },
    onChanged: {
      addListener: fn => listeners.push(fn)
    }
  };
  const context = vm.createContext({ browser: { storage }, console });
  vm.runInContext(shim, context);
  return { api: context.__shim, listeners, writes };
}

describe('generated extension storage shim', () => {
  test('observes writes made by another extension tab', () => {
    const { api, listeners } = bootShim();
    expect(listeners).toHaveLength(1);

    listeners[0]({
      'gitl:lock:chat.example:/c/one': {
        newValue: '{"tabId":"other-tab","ts":123}'
      }
    }, 'local');

    expect(api.GM_getValue('gitl:lock:chat.example:/c/one', '')).toContain('other-tab');
  });

  test('ignores non-local changes and mirrors deletions', () => {
    const { api, listeners } = bootShim();
    api.GM_setValue('key', 'ours');
    listeners[0]({ key: { newValue: 'sync-value' } }, 'sync');
    expect(api.GM_getValue('key', '')).toBe('ours');

    listeners[0]({ key: { oldValue: 'ours' } }, 'local');
    expect(api.GM_getValue('key', 'fallback')).toBe('fallback');
  });
});
