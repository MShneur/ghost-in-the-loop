const fs = require('fs');

const path = 'ghost-in-the-loop.user.js';
let source = fs.readFileSync(path, 'utf8');

function replaceOnce(label, from, to) {
  const first = source.indexOf(from);
  if (first < 0) throw new Error(`${label}: expected source fragment missing`);
  if (source.indexOf(from, first + from.length) >= 0) throw new Error(`${label}: source fragment is not unique`);
  source = source.slice(0, first) + to + source.slice(first + from.length);
}

replaceOnce(
  'native takeover header',
  `/* Native site takeover — ChatGPT production slice.\n   Promotes the Round-6 deterministic in-flow primitive into the real product,\n   but only behind a strict reviewed structural contract. The native host never\n   moves, wraps, clones, replaces, or clicks Send. Any loss of certainty removes\n   only Ghost's node and restores the pre-existing panel/rail. */\nconst NativeSiteMount = (() => {\n  const MOUNT_SELECTOR = '[data-gitl-native-mount="chatgpt"]';\n  let host = null, row = null, send = null;`,
  `/* Native site takeover — reviewed ChatGPT + bounded Claude production slice.\n   Promotes the Round-6 deterministic in-flow primitive into the real product,\n   but only behind strict reviewed structural contracts. The native host never\n   moves, wraps, clones, replaces, or clicks Send. Any loss of certainty removes\n   only Ghost's node and restores the pre-existing panel/rail. */\nconst NativeSiteMount = (() => {\n  const MOUNT_SELECTOR = '[data-gitl-native-mount]';\n  let host = null, row = null, send = null, mountSite = null;`
);

replaceOnce(
  'resolver insertion anchor',
  `    return { ok:true, input, composer, row:actionRow, send:exactSend };\n  };\n\n  const restorePanel = () => {`,
  `    return { ok:true, site:'chatgpt', input, composer, row:actionRow, send:exactSend };\n  };\n\n  const resolveClaude = () => {\n    if (!PLAT || PLAT.key !== 'claude' || !PLAT.reviewed) return { ok:false, reason:'site-not-reviewed-claude' };\n    const input = Adapter.peekInput();\n    if (!visible(input)) return { ok:false, reason:'composer-input-missing' };\n    if (!(input.matches && input.matches('div.ProseMirror[contenteditable="true"]'))) return { ok:false, reason:'claude-editor-signature-missing' };\n    const composer = input.closest && input.closest('form');\n    if (!(composer instanceof window.Element) || !composer.isConnected) return { ok:false, reason:'claude-composer-missing' };\n\n    const sends = new Set();\n    for (const selector of PLAT.send || []) {\n      try {\n        for (const el of composer.querySelectorAll(selector)) {\n          if (visible(el) && !el.disabled && el.getAttribute('aria-disabled') !== 'true' && _sendLooksSafe(el)) sends.add(el);\n        }\n      } catch(_) {}\n    }\n    if (sends.size !== 1) return { ok:false, reason:sends.size ? 'send-ambiguous' : 'send-missing' };\n    const exactSend = [...sends][0];\n    if (Adapter.getSendBtn() !== exactSend) return { ok:false, reason:'reviewed-send-identity-mismatch' };\n\n    const rows = [];\n    let candidate = exactSend.parentElement;\n    while (candidate && candidate !== composer) {\n      if (visible(candidate) && !candidate.contains(input)) {\n        let display = '';\n        try { display = getComputedStyle(candidate).display; } catch(_) {}\n        if (['flex','inline-flex','grid','inline-grid'].includes(display) && withinBounds(exactSend, candidate)) {\n          const interactive = candidate.querySelectorAll('button,[role="button"]');\n          if (interactive.length >= 2) rows.push(candidate);\n        }\n      }\n      candidate = candidate.parentElement;\n    }\n    if (rows.length !== 1) return { ok:false, reason:rows.length ? 'claude-action-row-ambiguous' : 'claude-action-row-missing' };\n    const actionRow = rows[0];\n    if (!composer.contains(input) || !composer.contains(actionRow)) return { ok:false, reason:'claude-ownership-mismatch' };\n    if (!actionRow.contains(exactSend)) return { ok:false, reason:'send-outside-actions' };\n    if (!withinBounds(exactSend, actionRow)) return { ok:false, reason:'send-clipped' };\n    return { ok:true, site:'claude', input, composer, row:actionRow, send:exactSend };\n  };\n\n  const resolveCurrent = () => {\n    if (PLAT?.key === 'chatgpt') return resolveChatGPT();\n    if (PLAT?.key === 'claude') return resolveClaude();\n    return { ok:false, reason:'site-not-native-enabled' };\n  };\n\n  const restorePanel = () => {`
);

let resolverCalls = 0;
source = source.replace(/const cap = resolveChatGPT\(\);/g, () => {
  resolverCalls++;
  return 'const cap = resolveCurrent();';
});
if (resolverCalls !== 3) throw new Error(`resolver dispatch: expected 3 replacements, got ${resolverCalls}`);

replaceOnce(
  'fail closed site recording',
  `  const failClosed = (reason) => {\n    verified = false;\n    closedReason = reason;\n    generation++;\n    disconnectResources();\n    dropHost();\n    row = send = null;\n    panelExplicit = false;\n    restorePanel();\n    try { Timeline.record('native_mount_demoted', { site:'chatgpt', reason }); } catch(_) {}\n    return { status:'rail', reason, fallback:'rail', attemptedStructural:true };\n  };`,
  `  const failClosed = (reason) => {\n    const site = mountSite || PLAT?.key || 'unknown';\n    verified = false;\n    closedReason = reason;\n    generation++;\n    disconnectResources();\n    dropHost();\n    row = send = null;\n    mountSite = null;\n    panelExplicit = false;\n    restorePanel();\n    try { Timeline.record('native_mount_demoted', { site, reason }); } catch(_) {}\n    return { status:'rail', reason, fallback:'rail', attemptedStructural:true };\n  };`
);

replaceOnce(
  'site-aware host builder',
  `  const buildHost = () => {\n    const el = document.createElement('div');\n    el.setAttribute('data-gitl-native-mount', 'chatgpt');`,
  `  const buildHost = (site) => {\n    const el = document.createElement('div');\n    el.setAttribute('data-gitl-native-mount', site);`
);

replaceOnce(
  'mount assignment',
  `    generation++;\n    row = cap.row;\n    send = cap.send;\n    row.append(buildHost());\n    verified = true;`,
  `    generation++;\n    row = cap.row;\n    send = cap.send;\n    mountSite = cap.site || PLAT?.key || null;\n    row.append(buildHost(mountSite));\n    verified = true;`
);

replaceOnce(
  'active timeline',
  `    try { Timeline.record('native_mount_active', { site:'chatgpt' }); } catch(_) {}`,
  `    try { Timeline.record('native_mount_active', { site:mountSite || PLAT?.key || 'unknown' }); } catch(_) {}`
);

replaceOnce(
  'stop cleanup',
  `    dropHost();\n    row = send = null;\n    panelExplicit = false;\n    restorePanel();\n  };\n  const ownsRail`,
  `    dropHost();\n    row = send = null;\n    mountSite = null;\n    panelExplicit = false;\n    restorePanel();\n  };\n  const ownsRail`
);

replaceOnce(
  'state site exposure',
  `state:() => ({ verified, closedReason, panelExplicit })`,
  `state:() => ({ verified, closedReason, panelExplicit, site:mountSite })`
);

fs.writeFileSync(path, source);
console.log('Applied bounded Claude native takeover promotion.');
