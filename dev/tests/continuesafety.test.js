const originalHasFocus = document.hasFocus;

function visibleButton(text, parent = document.body) {
  const button = document.createElement('button');
  button.textContent = text;
  button.setAttribute('data-continue-test', '1');
  button.getBoundingClientRect = () => ({
    left: 10, top: 10, right: 90, bottom: 50, width: 80, height: 40
  });
  parent.appendChild(button);
  return button;
}

describe('reviewed Continue control safety', () => {
  beforeEach(() => {
    document.querySelectorAll('[data-continue-test]').forEach(el => el.remove());
    GM_setValue(_tabLockKey(), '');
    GHOST.ui.unattended = false;
    SafetyPolicy.setGlobalEnabled(true);
    SafetyPolicy.setSiteEnabled(true);
    document.hasFocus = () => true;
  });

  afterEach(() => {
    GHOST.loop.state = 'IDLE';
    document.hasFocus = originalHasFocus;
    document.querySelectorAll('[data-continue-test]').forEach(el => el.remove());
  });

  test('never actuates a Continue-labelled control in Ghost UI', () => {
    const own = visibleButton('Continue', document.getElementById('gitl'));
    let clicks = 0;
    own.addEventListener('click', () => { clicks++; });

    expect(Adapter.clickContinue()).toBe(false);
    expect(clicks).toBe(0);
  });

  test('refuses two distinct visible host Continue controls', () => {
    const first = visibleButton('Continue');
    const second = visibleButton('Continue generating');
    let clicks = 0;
    first.addEventListener('click', () => { clicks++; });
    second.addEventListener('click', () => { clicks++; });

    expect(Adapter.clickContinue()).toBe(false);
    expect(clicks).toBe(0);
  });

  test('clicks one exact, visible, enabled host control', () => {
    const button = visibleButton('Continue generating');
    let clicks = 0;
    button.addEventListener('click', () => { clicks++; });

    expect(Adapter.clickContinue()).toBe(true);
    expect(clicks).toBe(1);
  });

  test('unrelated page mutations do not refresh watchdog activity', async () => {
    GHOST.loop.state = 'RUNNING';
    GHOST.loop.lastActivity = 123;
    const unrelated = document.createElement('div');
    unrelated.setAttribute('data-continue-test', '1');
    document.body.appendChild(unrelated);

    await new Promise(resolve => setTimeout(resolve, 400));
    expect(GHOST.loop.lastActivity).toBe(123);
  });
});
