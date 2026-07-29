/**
 * UNTRUSTED VALUES MUST STAY TEXT IN THE PANEL
 */
const PAYLOAD = '"><img id="gitl-injected" src=x onerror=alert(1)>';

afterEach(() => {
  document.getElementById('gitl-injected')?.remove();
  GHOST.project.name = '';
  GHOST.signals.customProceed = '';
  GHOST.signals.customStop = '';
  GHOST.ui.qDraft = [''];
  GHOST.ui.cfgAdv = false;
  GHOST.ui.showSites = false;
  GHOST.ui.showDiag = false;
  DIAG.lastTail = '';
  DIAG.errors = [];
  GM_setValue('customSites', '');
  GHOST.ui.tab = 'run';
  render();
});

describe('render escaping', () => {
  test('project and queue values cannot break out of input attributes', () => {
    GHOST.project.name = PAYLOAD;
    GHOST.ui.qDraft = [PAYLOAD];
    GHOST.ui.tab = 'auto';
    render();
    expect(document.getElementById('gitl-injected')).toBeNull();
    expect(document.getElementById('g-projname').value).toBe(PAYLOAD);
    expect(document.querySelector('.g-qin').value).toBe(PAYLOAD);
  });

  test('imported signal/custom-site values cannot create panel markup', () => {
    GHOST.signals.customProceed = PAYLOAD;
    GHOST.signals.customStop = PAYLOAD;
    GM_setValue('customSites', `</textarea>${PAYLOAD}`);
    GHOST.ui.tab = 'settings';
    GHOST.ui.cfgAdv = true;
    GHOST.ui.showSites = true;
    render();
    expect(document.getElementById('gitl-injected')).toBeNull();
    expect(document.getElementById('cfg-cp').value).toBe(PAYLOAD);
    expect(document.getElementById('cfg-cs').value).toBe(PAYLOAD);
    expect(document.getElementById('cfg-sites').value).toContain('</textarea>');
  });

  test('assistant tails and error strings remain text in Diagnostics', () => {
    DIAG.lastTail = PAYLOAD;
    DIAG.errors = [PAYLOAD];
    GHOST.ui.tab = 'settings';
    GHOST.ui.cfgAdv = true;
    GHOST.ui.showDiag = true;
    render();
    expect(document.getElementById('gitl-injected')).toBeNull();
    expect(document.querySelector('.g-diag').textContent).toContain('<img');
  });
});
