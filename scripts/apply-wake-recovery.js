const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'ghost-in-the-loop.user.js');
let src = fs.readFileSync(file, 'utf8');

if (src.includes('function recoverAfterWake(')) {
  console.log('wake recovery already present');
  process.exit(0);
}

const rebootMarker = 'function rebootGhost(){';
const rebootAt = src.indexOf(rebootMarker);
if (rebootAt < 0) throw new Error('rebootGhost marker not found');

const recovery = `/* Mobile/browser wake recovery (v8.7.1).
   Browsers may freeze page timers, workers, channels, observers, and stale DOM
   references while a phone is locked or the app is backgrounded. Recovery is
   layered and idempotent: stop ephemeral runtime services, rebuild each layer,
   then resume only when the prior loop was running and no Send is uncertain. */
const _wakeRecovery = { inFlight: false, lastAt: 0, hiddenAt: 0, routeClass: '' };

function recoverAfterWake(source='wake') {
  const L=GHOST.loop;
  if (document.visibilityState && document.visibilityState !== 'visible') return false;
  const now=Date.now();
  if (_wakeRecovery.inFlight || now-_wakeRecovery.lastAt<750) return false;
  _wakeRecovery.inFlight=true;
  _wakeRecovery.lastAt=now;
  try {
    const wasRunning=L.state==='RUNNING';
    const routeChanged=!!(_wakeRecovery.routeClass && _wakeRecovery.routeClass!==_safeRouteClass());
    const unsafeSend=!!(L.sendPending || L.isSending || L.sendTxn?.state==='dispatching' || L.sendTxn?.state==='uncertain');

    /* Rebuild independent runtime layers. Ticker.stop() makes repeated wake
       events safe; at most one ticker is started below. */
    _clearElementCaches();
    Ticker.stop();
    L.timer=null;
    if (_tabLockInterval) { clearInterval(_tabLockInterval); _tabLockInterval=null; }
    startTabHeartbeat();
    const ownsLease=claimTabLock();
    try { GhostBus.channel?.close(); } catch(_) {}
    GhostBus.channel=null;
    GhostBus.peers.clear();
    GhostBus.init();
    reDetect();

    /* A suspended dispatch can never be retried automatically. Preserve the
       journal, mark it uncertain, and require human reconciliation. */
    if (unsafeSend) {
      if (L.sendTxn && L.sendTxn.state==='dispatching') {
        L.sendTxn.state='uncertain';
        L.sendTxn.uncertainAt=now;
      }
      L.sendPending=false;
      L.sendDeadline=0;
      L.isSending=false;
      _settleSendPromise(false);
      L.state='PAUSED';
      L.phase='error';
      L.detail='Wake recovery paused — prior Send may be uncertain; check the chat';
      Timeline.record('wake_recovery_paused', { source, reason:'send-uncertain' });
      Reporter.capture('SEND-002', 'Wake recovery found an unresolved Send. Nothing was resent.');
      render();
      return false;
    }

    if (routeChanged) {
      L.state='PAUSED';
      L.phase='paused';
      L.detail='Wake recovery paused — conversation route changed while suspended';
      Timeline.record('wake_recovery_paused', { source, reason:'route-changed' });
      render();
      return false;
    }

    if (wasRunning && !ownsLease) {
      L.state='PAUSED';
      L.phase='paused';
      L.detail='Wake recovery paused — another tab owns this conversation';
      Timeline.record('wake_recovery_paused', { source, reason:'tab-lock-held' });
      render();
      return false;
    }

    L.lastActivity=now;
    L.staleTicks=0;
    L.replyKey='';
    L.replyStableTicks=0;
    if (wasRunning) {
      L.state='RUNNING';
      L.phase='waiting-output';
      L.detail='↻ Recovered after phone/app wake';
      L.timer=Ticker.start(engineTick, 2500);
      Timeline.record('wake_recovery', { source, resumed:true, ticker:Ticker.mode });
      render();
      setTimeout(() => { if (GHOST.loop.state==='RUNNING') engineTick(); }, 0);
      return true;
    }

    Timeline.record('wake_recovery', { source, resumed:false, state:L.state });
    render();
    return true;
  } finally {
    _wakeRecovery.inFlight=false;
  }
}

`;

src = src.slice(0, rebootAt) + recovery + src.slice(rebootAt);

const visibilityStart = src.indexOf('/* Silent self-heal (v8.1):');
const visibilityEnd = src.indexOf('/* Manual re-detect (v7.1, hardened v8.1):', visibilityStart);
if (visibilityStart < 0 || visibilityEnd < 0) {
  throw new Error('visibility self-heal block markers not found');
}

const lifecycle = `/* Mobile lifecycle recovery. visibilitychange is the most reliable mobile
   signal; pageshow covers BFCache restoration, focus covers app/tab return,
   and resume is used where the Page Lifecycle API exposes it. All routes pass
   through the same throttled, fail-closed recovery gate. */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') {
    _wakeRecovery.hiddenAt=Date.now();
    _wakeRecovery.routeClass=_safeRouteClass();
    return;
  }
  recoverAfterWake('visibilitychange');
});
window.addEventListener('pageshow', () => recoverAfterWake('pageshow'));
window.addEventListener('focus', () => recoverAfterWake('focus'));
try { document.addEventListener('resume', () => recoverAfterWake('resume')); } catch(_) {}

`;

src = src.slice(0, visibilityStart) + lifecycle + src.slice(visibilityEnd);
fs.writeFileSync(file, src, 'utf8');
console.log('applied wake recovery patch');
