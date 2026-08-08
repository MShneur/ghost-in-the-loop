// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Round-6 XA3 cross-adapter Red Team.
 *
 * This spec does not create a new structural implementation. It pins and
 * cross-checks the already verified ChatGPT and Claude deterministic fixtures,
 * then measures one predeclared architecture claim against the weakest generic
 * H2 baseline: document-global first-visible-editor inference.
 *
 * The carrier for XA3 executes the real ChatGPT/Claude prototype and Red-Team
 * specs alongside this meta-oracle. Passing fallback is never counted as a
 * specialized-runner PASS, and no fixture result authorizes live-host binding.
 */

const ROOT = path.join(__dirname, '..', '..');
const FILES = {
  chatgptBlue: path.join(__dirname, 'mobile-shell-blue-prototype.spec.js'),
  chatgptRed: path.join(__dirname, 'mobile-shell-blue-redteam.spec.js'),
  claudeContract: path.join(__dirname, 'claude-structure-contract.spec.js'),
  claudeBlue: path.join(__dirname, 'claude-blue-prototype.spec.js'),
};

const EXPECTED_BLOBS = {
  chatgptBlue: '53cc902428a3fc1496a83ad1bf0bd1bbe6752c84',
  chatgptRed: 'b8b5048dbc042626294423e28b337eb27d6c6b63',
  claudeContract: 'd6fbadcdf80b7c7e212b9278bfa88f1418ca00fe',
  claudeBlue: '88277ddbcb268e7a25a9b2f54197f8fc08c4ddcc',
};

function gitBlobSha1(buffer) {
  return crypto
    .createHash('sha1')
    .update(Buffer.from(`blob ${buffer.length}\0`))
    .update(buffer)
    .digest('hex');
}

function read(name) {
  return fs.readFileSync(FILES[name], 'utf8');
}

function visible(el) {
  if (!(el instanceof Element) || !el.isConnected) return false;
  const cs = getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

test.describe('Round-6 XA3 cross-adapter Red Team', () => {
  test('pins the exact accepted ChatGPT and Claude deterministic fixture blobs', async () => {
    for (const [name, expected] of Object.entries(EXPECTED_BLOBS)) {
      const bytes = fs.readFileSync(FILES[name]);
      expect(gitBlobSha1(bytes), `${name} fixture drifted`).toBe(expected);
    }
  });

  test('measures adapter-owned locality against generic global-first editor inference', async ({ page }) => {
    const fixtures = [
      {
        site: 'chatgpt',
        html: `<!doctype html><style>#hidden{display:none}</style>
          <body data-site="chatgpt">
            <form data-certified="chatgpt"><div id="chatgpt-real" contenteditable="true">real</div></form>
            <div id="hidden"><div contenteditable="true">hidden</div></div>
          </body>`,
        expected: 'chatgpt-real',
      },
      {
        site: 'claude',
        html: `<!doctype html><body data-site="claude">
          <section><div id="claude-decoy" contenteditable="true">artifact editor decoy</div></section>
          <form data-certified="claude"><div id="claude-real" contenteditable="true">real</div></form>
          </body>`,
        expected: 'claude-real',
      },
    ];

    let genericErrors = 0;
    let adapterErrors = 0;
    const observations = [];

    for (const fixture of fixtures) {
      await page.setContent(fixture.html);
      const observed = await page.evaluate(({ site, expected }) => {
        const isVisible = (el) => {
          if (!(el instanceof Element) || !el.isConnected) return false;
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0;
        };
        const generic = Array.from(document.querySelectorAll('[contenteditable="true"]')).find(isVisible) || null;
        const certified = document.querySelector(`form[data-certified="${site}"]`);
        const scoped = certified
          ? Array.from(certified.querySelectorAll('[contenteditable="true"]')).filter(isVisible)
          : [];
        const adapter = document.body.getAttribute('data-site') === site && scoped.length === 1 ? scoped[0] : null;
        return {
          expected,
          genericId: generic?.id || null,
          adapterId: adapter?.id || null,
        };
      }, { site: fixture.site, expected: fixture.expected });
      if (observed.genericId !== fixture.expected) genericErrors++;
      if (observed.adapterId !== fixture.expected) adapterErrors++;
      observations.push(observed);
    }

    // This is a bounded false-positive measurement against the explicitly
    // challenged generic H2 baseline, not a performance claim against a future
    // stronger standard adapter-aware protocol.
    expect(genericErrors).toBe(1);
    expect(adapterErrors).toBe(0);
    expect(observations.find(x => x.expected === 'claude-real')?.genericId).toBe('claude-decoy');
  });

  test('cross-adapter source ledger contains the required fail-closed mutant families', async () => {
    const chatgptBlue = read('chatgptBlue');
    const chatgptRed = read('chatgptRed');
    const claudeContract = read('claudeContract');
    const claudeBlue = read('claudeBlue');

    // ChatGPT: clipping, stale container/rerender, duplicate mount, exact Send.
    for (const needle of [
      'send-clipped',
      'mount-clipped',
      'container-unverified',
      'duplicate-mount',
      'send-identity-changed',
    ]) expect(chatgptBlue + chatgptRed).toContain(needle);
    expect(chatgptRed).toContain('whole verified-row replacement must fail closed');

    // Claude: wrong site, visible decoy/ambiguity, exact Send replacement,
    // clipping, fixed mutant, standard then rail demotion.
    for (const needle of [
      'site-identity-mismatch',
      'active-composer-ambiguous',
      'exact-send-identity-mismatch',
      'send-clipped',
      'mount-not-in-flow',
      'standard-adapter-aware-structural-protocol',
      'existing-rail-fallback',
    ]) expect(claudeContract + claudeBlue).toContain(needle);
    expect(claudeContract + claudeBlue).toContain('decoy');
  });

  test('resource and passive-actuation ledgers are explicit on both adapter candidates', async () => {
    const chatgpt = read('chatgptBlue') + read('chatgptRed');
    const claude = read('claudeBlue');

    for (const source of [chatgpt, claude]) {
      expect(source).toContain('mutationObserverConnected');
      expect(source).toContain('resizeObserverConnected');
      expect(source).toContain('pendingRepair');
      expect(source).toContain('cleanupCount');
      expect(source).toContain('sendClicks');
      expect(source).toContain("['click', 'submit', 'input', 'keydown']");
    }
  });

  test('specialized-first policy fails closed on identity/signature uncertainty', async ({ page }) => {
    await page.setContent('<body data-site="claude"></body>');
    const decisions = await page.evaluate(() => {
      const select = ({ requestedSite, bodySite, signature, standardAvailable }) => {
        if (requestedSite === bodySite && signature === 'certified-current') {
          return 'certified-site-specific-runner';
        }
        return standardAvailable
          ? 'standard-adapter-aware-structural-protocol'
          : 'existing-rail-fallback';
      };
      return {
        valid: select({ requestedSite: 'claude', bodySite: 'claude', signature: 'certified-current', standardAvailable: true }),
        wrongSite: select({ requestedSite: 'chatgpt', bodySite: 'claude', signature: 'certified-current', standardAvailable: true }),
        stale: select({ requestedSite: 'claude', bodySite: 'claude', signature: 'stale', standardAvailable: true }),
        noStandard: select({ requestedSite: 'claude', bodySite: 'claude', signature: 'stale', standardAvailable: false }),
      };
    });

    expect(decisions).toEqual({
      valid: 'certified-site-specific-runner',
      wrongSite: 'standard-adapter-aware-structural-protocol',
      stale: 'standard-adapter-aware-structural-protocol',
      noStandard: 'existing-rail-fallback',
    });
  });
});
