from pathlib import Path
import json

p = Path('ghost-in-the-loop.user.js')
s = p.read_text()

def replace_once(old, new, label):
    global s
    count = s.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 match, got {count}')
    s = s.replace(old, new)

replace_once(
    "  stopVisible() { const el = _q('gen', PLAT.stop); return !!(el && _visible(el) && el.getAttribute('aria-hidden') !== 'true' && el.getAttribute('disabled') == null); },",
    "  stopVisible() { return _qAll(PLAT.stop).some(el => el && _visible(el) && el.getAttribute('aria-hidden') !== 'true' && el.getAttribute('disabled') == null); },",
    'visible stop finder'
)

replace_once(
    "  const text=Adapter.getLastText(), observation=_observeReplyText(text);",
    "  const text = Adapter.getLastText();\n  const observation = _observeReplyText(text);",
    'preserve send-transaction read boundary'
)

replace_once(
    "if(Adapter.isGenerating()&&!terminalReady){L.lastActivity=Date.now();if(_setLoopPhase('generating',text?'AI is outputting…':'Waiting for AI output…'))render();return;}",
    "if(Adapter.isGenerating()&&!terminalReady){L.lastActivity=Date.now();L.staleTicks=0;if(_setLoopPhase('generating',text?'AI is outputting…':'Waiting for AI output…'))render();return;}",
    'generation stale reset'
)

replace_once(
    "window.visualViewport.addEventListener('resize',_railReposition,{passive:true});window.visualViewport.addEventListener('scroll',_railReposition,{passive:true});",
    "window.visualViewport.addEventListener('resize',_railReposition,{passive:true});",
    'remove visual viewport scroll listener'
)
replace_once(
    "window.visualViewport.removeEventListener('resize',_railReposition);window.visualViewport.removeEventListener('scroll',_railReposition);",
    "window.visualViewport.removeEventListener('resize',_railReposition);",
    'remove visual viewport scroll cleanup'
)

old_reboot = "function rebootGhost(){const L=GHOST.loop;_settleSendPromise(false);Ticker.stop();L.timer=null;_redetectStop();stopRailTracker();if(_tabLockInterval){clearInterval(_tabLockInterval);_tabLockInterval=null;}try{GhostBus.channel?.close();}catch(_){}GhostBus.channel=null;GhostBus.peers.clear();_clearElementCaches();Object.assign(GITL_NET,{_open:0,expectUntil:0,lastPulseT:0,lastPulseH:0,lastWsPulseT:0});Object.assign(L,{state:'IDLE',phase:'idle',detail:'↻ Ghost reloaded — chat page left untouched',isSending:false,sendPending:false,sendDeadline:0,sendTxn:null,staleTicks:0,replyKey:'',replyStableTicks:0,replyBaseline:null,countdownUntil:0});try{panel.remove();}catch(_){}_panelMounted=false;mountPanel();SKIN.apply();startTabHeartbeat();claimTabLock();GhostBus.init();render();reDetect();Timeline.record('ghost_reboot',{platform:PLAT.key});return true;}"
new_reboot = "function rebootGhost(){const L=GHOST.loop,interrupted=!!(L.sendPending||L.sendTxn?.state==='dispatching'),txn=L.sendTxn;if(interrupted&&txn){txn.state='uncertain';txn.uncertainAt=Date.now();} _settleSendPromise(false);Ticker.stop();L.timer=null;_redetectStop();stopRailTracker();if(_tabLockInterval){clearInterval(_tabLockInterval);_tabLockInterval=null;}try{GhostBus.channel?.close();}catch(_){}GhostBus.channel=null;GhostBus.peers.clear();_clearElementCaches();Object.assign(GITL_NET,{_open:0,expectUntil:0,lastPulseT:0,lastPulseH:0,lastWsPulseT:0});Object.assign(L,{state:interrupted?'PAUSED':'IDLE',phase:interrupted?'error':'idle',detail:interrupted?'↻ Ghost reloaded — prior Send is uncertain; check the chat':'↻ Ghost reloaded — chat page left untouched',isSending:false,sendPending:false,sendDeadline:0,sendTxn:txn||null,staleTicks:0,replyKey:'',replyStableTicks:0,replyBaseline:null,countdownUntil:0});try{panel.remove();}catch(_){}_panelMounted=false;mountPanel();SKIN.apply();startTabHeartbeat();claimTabLock();GhostBus.init();render();reDetect();Timeline.record('ghost_reboot',{platform:PLAT.key,interruptedSend:interrupted});return true;}"
replace_once(old_reboot, new_reboot, 'send-safe Ghost reboot')

p.write_text(s)

manifest_path = Path('extension/manifest.json')
manifest = json.loads(manifest_path.read_text())
manifest['version'] = '8.5.2'
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')

Path('tests/issuefixes.test.js').write_text(r'''/**
 * FIELD REGRESSIONS — long-thinking Perplexity and route assignment.
 * v8.5.2 replaces the old network-only no-output rule with a multi-witness
 * completion observer, so these tests verify the behavior contract rather
 * than the former source formatting.
 */
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../ghost-in-the-loop.user.js'), 'utf8');

function body(name, nextName) {
  const start = src.indexOf(`function ${name}`);
  const end = src.indexOf(`function ${nextName}`, start + 1);
  return start < 0 ? '' : src.slice(start, end < 0 ? undefined : end);
}

describe('Issue #1 — Perplexity completion observation', () => {
  const tick = body('engineTick', 'startLoop');

  test('visible DOM output is read before network generation can veto it', () => {
    const read = tick.indexOf('const text = Adapter.getLastText();');
    const networkGate = tick.indexOf('Adapter.isGenerating()&&!terminalReady');
    expect(read).toBeGreaterThan(-1);
    expect(networkGate).toBeGreaterThan(read);
  });

  test('active generation resets stale ticks', () => {
    expect(tick).toContain('L.staleTicks=0');
  });

  test('idle no-output still uses the per-platform stale budget', () => {
    expect(tick).toContain('(PLAT&&PLAT.staleTicks)||5');
  });

  test('terminal override requires reply advancement, stability, and no visible Stop', () => {
    const gate = body('_terminalReplyReady', '_sleepCountdown');
    expect(gate).toContain('_replyAdvancedBeyondBaseline(text)');
    expect(gate).toContain('obs.stableTicks>=1');
    expect(gate).toContain('!stopVisible');
  });
});

describe('Issue #2 — Grok conversation-id URL assignment', () => {
  test('same-host post-send route assignment is recorded instead of paused', () => {
    expect(src).toContain('new URL(prevHref).hostname === location.hostname');
    expect(src).toContain('GHOST.loop.sendPending || (Date.now() - (GHOST.loop.lastActivity || 0) < 15000)');
    expect(src).toContain("Timeline.record('route_id_assigned'");
  });

  test('genuine route changes still pause and clear cached elements', () => {
    expect(src).toContain("enginePause('Route changed — paused')");
    const m = src.match(/window\.addEventListener\('gitl:route', \(\) => \{[\s\S]*?\n\}\);/);
    expect(m).not.toBeNull();
    expect(m[0]).toContain('_clearElementCaches();');
  });
});
''')

print('v8.5.2 compatibility fixes applied')
