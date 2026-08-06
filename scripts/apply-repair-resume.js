'use strict';

const fs = require('fs');
const path = require('path');
const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

function replaceOnce(file, before, after, label) {
  let source = fs.readFileSync(file, 'utf8');
  if (source.includes(after)) return;
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one marker, found ${count}`);
  source = source.replace(before, after);
  fs.writeFileSync(file, source, 'utf8');
}

const sourceFile = path.join(root, 'ghost-in-the-loop.user.js');

const repairFunctions = String.raw`
function _tabLeaseStatus(now=Date.now()) {
  try {
    const raw=GM_getValue(_tabLockKey(), null);
    const lock=raw ? JSON.parse(raw) : null;
    if (!lock || !lock.tabId || now-(Number(lock.ts)||0)>=8000) return 'available';
    return lock.tabId===GITL_TAB_ID ? 'owned' : 'other';
  } catch(_) {
    return 'unknown';
  }
}

/* Side-effect-free runtime service snapshot. Unlike adapter capability health,
   this describes Ghost's own schedulers, lease, bus, caches, observer, panel,
   route, network witness, and Send journal. Optional overrides keep the model
   independently testable without weakening production inference. */
function runtimeServiceHealth(overrides={}) {
  const L=GHOST.loop;
  const has=key=>Object.prototype.hasOwnProperty.call(overrides,key);
  const state=String(has('runtimeState') ? overrides.runtimeState : (L.state||'IDLE'));
  const activeContext=['RUNNING','PAUSED','CHOICE','LIMIT'].includes(state);
  const tickerMode=String(has('tickerMode') ? overrides.tickerMode : Ticker.mode);
  const heartbeat=has('heartbeat') ? !!overrides.heartbeat : !!_tabLockInterval;
  const leaseStatus=String(has('leaseStatus') ? overrides.leaseStatus : _tabLeaseStatus());
  const busConnected=has('busConnected') ? !!overrides.busConnected : !!GhostBus.channel;
  const cachedInput=has('cachedInput') ? overrides.cachedInput : _cache.get('in');
  const cacheConnected=!cachedInput || cachedInput.isConnected!==false;
  const input=has('input') ? overrides.input : Adapter.peekInput();
  const inputConnected=!!input && input.isConnected!==false;
  const redetectActive=has('redetectActive') ? !!overrides.redetectActive
    : !!(_redetectWatch.obs || _redetectWatch.timer);
  const panelConnected=has('panelConnected') ? !!overrides.panelConnected
    : !!(panel && panel.isConnected && document.getElementById('gitl')===panel);
  const networkActive=has('networkActive') ? !!overrides.networkActive : !!GITL_NET.active;
  const routeChanged=has('routeChanged') ? !!overrides.routeChanged
    : !!(_wakeRecovery.routeClass && _wakeRecovery.routeClass!==_safeRouteClass());
  const journalSafe=has('journalSafe') ? !!overrides.journalSafe
    : !(L.sendPending || L.isSending || L.sendTxn?.state==='dispatching' || L.sendTxn?.state==='uncertain');

  const repairable=[];
  const blocked=[];
  if (state==='RUNNING' && tickerMode==='none') repairable.push('ticker');
  if (!heartbeat) repairable.push('heartbeat');
  if (leaseStatus==='available' || leaseStatus==='unknown') repairable.push('tab-lease');
  if (!busConnected) repairable.push('ghost-bus');
  if (!cacheConnected) repairable.push('composer-cache');
  if (activeContext && !inputConnected && !redetectActive) repairable.push('composer-observer');
  if (!panelConnected) repairable.push('panel');
  if (activeContext && !networkActive) repairable.push('network-observer');
  if (!journalSafe) blocked.push('send-journal');
  if (routeChanged) blocked.push('route-changed');
  if (leaseStatus==='other') blocked.push('tab-lock-held');

  return {
    state,
    services:{
      ticker:tickerMode,
      heartbeat:heartbeat?'active':'missing',
      lease:leaseStatus,
      bus:busConnected?'active':'missing',
      composerCache:cacheConnected?'current':'stale',
      composerObserver:inputConnected?'resolved':redetectActive?'watching':'missing',
      panel:panelConnected?'mounted':'missing',
      networkObserver:networkActive?'active':'missing',
      route:routeChanged?'changed':'current',
      sendJournal:journalSafe?'safe':'blocked'
    },
    repairable,
    blocked,
    needsRepair:repairable.length>0,
    canRepairAndResume:state==='PAUSED' && !L.needsPayload && repairable.length>0 && blocked.length===0
  };
}

/* Manual service repair with no prompt injection and no immediate actuator.
   A repaired paused run only rearms observation/scheduling; the normal ticker
   decides what happens later. Uncertain Send, route changes, and another tab's
   live lease remain hard blocks. */
function repairAndResume() {
  const L=GHOST.loop;
  const priorState=L.state;
  const before=runtimeServiceHealth();
  if (before.blocked.length) {
    Ticker.stop();
    L.timer=null;
    L.state='PAUSED';
    L.phase=before.blocked.includes('send-journal')?'error':'paused';
    const reason=before.blocked[0];
    L.detail=reason==='send-journal'
      ? 'Repair blocked — prior Send is uncertain; reconcile it first'
      : reason==='route-changed'
        ? 'Repair blocked — conversation route changed while suspended'
        : 'Repair blocked — another tab owns this conversation';
    GHOST.lastRepair={at:Date.now(),source:'manual',repaired:[],resumed:false,blocked:before.blocked.slice()};
    Timeline.record('repair_resume_blocked',{reason,state:priorState});
    render();
    return {ok:false,resumed:false,repaired:[],blocked:before.blocked.slice()};
  }

  const repaired=[];
  const mark=name=>{ if (!repaired.includes(name)) repaired.push(name); };
  const needed=name=>before.repairable.includes(name);

  _clearElementCaches();
  if (needed('composer-cache') || needed('composer-observer')) mark('composer');

  Ticker.stop();
  L.timer=null;
  if (needed('ticker')) mark('ticker');

  if (_tabLockInterval) { clearInterval(_tabLockInterval); _tabLockInterval=null; }
  startTabHeartbeat();
  if (needed('heartbeat')) mark('heartbeat');

  const ownsLease=claimTabLock();
  if (!ownsLease) {
    Ticker.stop();
    L.timer=null;
    L.state='PAUSED';
    L.phase='paused';
    L.detail='Repair blocked — another tab acquired this conversation';
    GHOST.lastRepair={at:Date.now(),source:'manual',repaired:repaired.slice(),resumed:false,blocked:['tab-lock-held']};
    Timeline.record('repair_resume_blocked',{reason:'tab-lock-held',state:priorState,repairs:repaired});
    render();
    return {ok:false,resumed:false,repaired,blocked:['tab-lock-held']};
  }
  if (needed('tab-lease')) mark('tab-lease');

  try { GhostBus.channel?.close(); } catch(_) {}
  GhostBus.channel=null;
  GhostBus.peers.clear();
  GhostBus.init();
  if (needed('ghost-bus')) mark('ghost-bus');

  if (!GITL_NET.active) {
    GITL_NET.install();
    mark('network-observer');
  }

  if (!panel.isConnected || document.getElementById('gitl')!==panel) {
    _panelMounted=false;
    mountPanel();
    SKIN.apply();
    mark('panel');
  }
  if (GHOST.ui.position==='rail') startRailTracker();

  reDetect();
  const shouldRun=priorState==='RUNNING' || (priorState==='PAUSED' && !L.needsPayload);
  const resumed=priorState==='PAUSED' && shouldRun;
  if (shouldRun) {
    L.state='RUNNING';
    L.phase='waiting-output';
    L.lastActivity=Date.now();
    L.staleTicks=0;
    L.replyKey='';
    L.replyStableTicks=0;
    L.timer=Ticker.start(engineTick,2500);
    if (needed('ticker')) mark('ticker');
  } else {
    L.state=priorState;
  }

  const label=repaired.length ? repaired.join(', ') : 'runtime services';
  L.detail=resumed ? '🛠 Repaired '+label+' — resumed safely' : '🛠 Repaired '+label;
  GHOST.lastRepair={at:Date.now(),source:'manual',repaired:repaired.slice(),resumed,blocked:[]};
  Timeline.record('repair_resume',{state:priorState,resumed,repairs:repaired,ticker:Ticker.mode});
  render();
  return {ok:true,resumed,repaired,blocked:[]};
}
`;

replaceOnce(
  sourceFile,
  "\n}\n\nfunction rebootGhost(){",
  "\n}\n" + repairFunctions + "\nfunction rebootGhost(){",
  'repair functions insertion'
);

replaceOnce(
  sourceFile,
  "function renderRunTab() {\n  const L = GHOST.loop, p = L.lastProgress, pct = p ? Math.round((p.step/p.total)*100) : 0;",
  "function renderRunTab() {\n  const L = GHOST.loop, p = L.lastProgress, pct = p ? Math.round((p.step/p.total)*100) : 0;\n  const repairHealth = typeof runtimeServiceHealth === 'function' ? runtimeServiceHealth() : null;\n  const showRepairResume = !!(repairHealth && repairHealth.canRepairAndResume);",
  'run-tab health gate'
);

replaceOnce(
  sourceFile,
  "      <button class=\"g-btn st${idle?' g-dim':''}\" id=\"g-stop\" title=\"Stop automation and preserve progress (Alt+S)\">■ Stop</button>\n    </div>\n    </div>",
  "      <button class=\"g-btn st${idle?' g-dim':''}\" id=\"g-stop\" title=\"Stop automation and preserve progress (Alt+S)\">■ Stop</button>\n    </div>\n    ${showRepairResume ? `<div class=\"g-btns\" style=\"padding-top:0\"><button class=\"g-btn go\" id=\"g-repair-resume\" title=\"Repair Ghost runtime services and resume without sending anything immediately\">🛠 Repair &amp; Resume</button></div>` : ''}\n    </div>",
  'repair button rendering'
);

replaceOnce(
  sourceFile,
  "  { sel:'#g-play',        name:'▶ Start · ⏸ Pause',  desc:'One toggle: ▶ starts (or resumes) the auto-continue loop; while running it becomes ⏸ Pause. The chat is untouched when paused — tap again to pick up where you left off.' },",
  "  { sel:'#g-play',        name:'▶ Start · ⏸ Pause',  desc:'One toggle: ▶ starts (or resumes) the auto-continue loop; while running it becomes ⏸ Pause. The chat is untouched when paused — tap again to pick up where you left off.' },\n  { sel:'#g-repair-resume', name:'🛠 Repair & Resume', desc:'Repairs Ghost’s ticker, lease, bus, caches, observer, panel, and network witness, then rearms a paused run without injecting or sending anything immediately.' },",
  'explain entry'
);

replaceOnce(
  sourceFile,
  "  $('#g-play')?.addEventListener('click', primaryAction);",
  "  $('#g-play')?.addEventListener('click', primaryAction);\n  $('#g-repair-resume')?.addEventListener('click', repairAndResume);",
  'repair button binding'
);

replaceOnce(
  sourceFile,
  "    <b>Buttons:</b> ▶ Start/Resume · ⏸ Pause · ■ Stop (preserves progress). Reground and Reset are separate under Advanced ▾.<br><br>",
  "    <b>Buttons:</b> ▶ Start/Resume · ⏸ Pause · ■ Stop (preserves progress). When Ghost detects damaged runtime services on a paused run, a separate <b>🛠 Repair &amp; Resume</b> appears; it repairs Ghost and rearms observation without sending anything immediately. Reground and Reset are separate under Advanced ▾.<br><br>",
  'run help text'
);

replaceOnce(
  path.join(root, 'tests', 'setup.js'),
  "    'capabilityState','platformHealth','assertInteractionSafe','claimTabLock','verifyTabLease','releaseTabLock',",
  "    'capabilityState','platformHealth','_tabLeaseStatus','runtimeServiceHealth','repairAndResume','assertInteractionSafe','claimTabLock','verifyTabLease','releaseTabLock',",
  'test export hook'
);

const testFile = path.join(root, 'tests', 'repair-resume.test.js');
const testContent = String.raw`const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

function body(name, nextName) {
  const start = src.indexOf('function ' + name);
  const end = src.indexOf('function ' + nextName, start + 1);
  return start < 0 ? '' : src.slice(start, end < 0 ? undefined : end);
}

const healthy = {
  tickerMode: 'none', heartbeat: true, leaseStatus: 'owned', busConnected: true,
  cachedInput: null, input: null, panelConnected: true, redetectActive: false,
  routeChanged: false, journalSafe: true, networkActive: true
};

describe('runtime service health', () => {
  test('idle absence is not runtime damage', () => {
    const h = runtimeServiceHealth({ runtimeState: 'IDLE', ...healthy });
    expect(h.needsRepair).toBe(false);
    expect(h.blocked).toEqual([]);
  });

  test('running without a ticker requires repair', () => {
    const h = runtimeServiceHealth({ runtimeState: 'RUNNING', ...healthy, input: {}, redetectActive: true });
    expect(h.repairable).toContain('ticker');
    expect(h.needsRepair).toBe(true);
  });

  test('paused damaged services expose a safe repair path', () => {
    const h = runtimeServiceHealth({
      runtimeState: 'PAUSED', ...healthy,
      heartbeat: false, leaseStatus: 'available', busConnected: false,
      input: null, redetectActive: false, panelConnected: false, networkActive: false
    });
    expect(h.repairable).toEqual(expect.arrayContaining([
      'heartbeat', 'tab-lease', 'ghost-bus', 'composer-observer', 'panel', 'network-observer'
    ]));
    expect(h.blocked).toEqual([]);
    expect(h.needsRepair).toBe(true);
  });

  test.each([
    ['unsafe journal', { journalSafe: false }, 'send-journal'],
    ['route change', { routeChanged: true }, 'route-changed'],
    ['other tab lease', { leaseStatus: 'other' }, 'tab-lock-held']
  ])('%s blocks repair and resume', (_label, patch, expected) => {
    const h = runtimeServiceHealth({ runtimeState: 'PAUSED', ...healthy, ...patch });
    expect(h.blocked).toContain(expected);
    expect(h.canRepairAndResume).toBe(false);
  });
});

describe('repair and resume safety contract', () => {
  test('repairs independent runtime layers', () => {
    const repair = body('repairAndResume', 'rebootGhost');
    for (const signal of [
      '_clearElementCaches()', 'Ticker.stop()', 'startTabHeartbeat()', 'claimTabLock()',
      'GhostBus.init()', 'GITL_NET.install()', 'mountPanel()', 'reDetect()',
      'Ticker.start(engineTick,2500)'
    ]) expect(repair).toContain(signal);
  });

  test('never becomes a Send actuator or prompt injector', () => {
    const repair = body('repairAndResume', 'rebootGhost');
    for (const forbidden of [
      'engineSend(', 'RESUME_TEXT', 'Adapter.clickContinue', 'regroundLoop', 'location.reload'
    ]) expect(repair).not.toContain(forbidden);
  });

  test('preserves hard blocks and only resumes a paused existing run', () => {
    const repair = body('repairAndResume', 'rebootGhost');
    expect(repair).toContain("before.blocked.includes('send-journal')");
    expect(repair).toContain("priorState==='PAUSED' && !L.needsPayload");
    expect(repair).toContain("L.state='PAUSED'");
  });

  test('UI keeps normal Resume and adds a separate health-gated repair action', () => {
    expect(src).toContain('id="g-play"');
    expect(src).toContain('id="g-repair-resume"');
    expect(src).toContain('repairHealth.canRepairAndResume');
    expect(src).toContain("addEventListener('click', repairAndResume)");
  });
});
`;
fs.writeFileSync(testFile, testContent, 'utf8');

replaceOnce(
  path.join(root, 'CHANGELOG.md'),
  "- Added context-aware adapter capability states so idle conditional controls do not create false ADAPTER-001 reports, while missing controls during required operations still fail closed.\n",
  "- Added context-aware adapter capability states so idle conditional controls do not create false ADAPTER-001 reports, while missing controls during required operations still fail closed.\n- Added a health-gated Repair & Resume action that rebuilds Ghost runtime services and rearms paused observation without injecting a prompt, clicking Continue, or opening a Send transaction itself.\n",
  'changelog entry'
);

console.log('Applied health-driven Repair & Resume implementation and tests.');
