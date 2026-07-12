/**
 * EXPORT ROW LIST TESTS (d11)
 * The four export actions (Export / Capsule / Handoff / Backup Handoff) are
 * rendered as a "sunken row" list: icon-button + bold name + small
 * description, each row semantically colored. Verifies structure, that
 * existing ids/listeners survived the markup change, and no leftover
 * "Emergency Handoff" naming.
 */

function switchToExportTab() {
  GHOST.ui.tab = 'export';
  render();
}

describe('Export tab — sunken row list', () => {
  test('renders four rows with the original action ids intact', () => {
    switchToExportTab();
    for (const id of ['g-export', 'g-capsule', 'g-handoff', 'g-rescue']) {
      const el = document.getElementById(id);
      expect(el).not.toBeNull();
      expect(el.classList.contains('g-xrow')).toBe(true);
    }
  });

  test('each row carries a distinct semantic color class', () => {
    switchToExportTab();
    expect(document.getElementById('g-export').classList.contains('g-xrow-accent')).toBe(true);
    expect(document.getElementById('g-capsule').classList.contains('g-xrow-muted')).toBe(true);
    expect(document.getElementById('g-handoff').classList.contains('g-xrow-ok')).toBe(true);
    expect(document.getElementById('g-rescue').classList.contains('g-xrow-warn')).toBe(true);
  });

  test('each row has an icon and a name+description block', () => {
    switchToExportTab();
    for (const id of ['g-export', 'g-capsule', 'g-handoff', 'g-rescue']) {
      const el = document.getElementById(id);
      expect(el.querySelector('.g-xicon')).not.toBeNull();
      const text = el.querySelector('.g-xtext');
      expect(text.querySelector('b').textContent.length).toBeGreaterThan(0);
      expect(text.querySelector('span').textContent.length).toBeGreaterThan(10);
    }
  });

  test('rows stay clickable at the original ids (listeners still attach)', () => {
    switchToExportTab();
    let fired = 0;
    const row = document.getElementById('g-handoff');
    row.addEventListener('click', () => fired++);
    row.click();
    expect(fired).toBe(1);
  });

  test('no leftover "Emergency" wording anywhere in the panel', () => {
    switchToExportTab();
    const html = document.getElementById('gitl').innerHTML;
    expect(html).not.toMatch(/Emergency/i);
    expect(html).toMatch(/Backup Handoff/);
  });
});

describe('Accent color swatches', () => {
  test('setup tab renders six one-tap swatches', () => {
    GHOST.ui.tab = 'settings';
    render();
    const swatches = document.querySelectorAll('.g-swatch');
    expect(swatches.length).toBe(6);
  });

  test('clicking a swatch sets accentHue and applies it', () => {
    GHOST.ui.tab = 'settings';
    render();
    const swatch = document.querySelector('.g-swatch[data-hue="185"]');
    expect(swatch).not.toBeNull();
    swatch.click();
    expect(GHOST.ui.accentHue).toBe(185);
    expect(document.getElementById('gitl').style.getPropertyValue('--g-accent')).toMatch(/^hsl\(185 /);
  });
});
