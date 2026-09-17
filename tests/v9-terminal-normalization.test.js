const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadTerminal() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'ghost-in-the-loop.user.js'), 'utf8');
  const start = src.indexOf('function finalLine(text)');
  const end = src.indexOf('function log(type, data = {})', start);
  if (start < 0 || end < 0) throw new Error('terminal parser block not found');

  const sandbox = {
    G: {
      proceed: '[[GITL::PROCEED]]',
      human: '[[GITL::HUMAN]]',
      halt: '[[GITL::HALT]]'
    },
    A: {
      proceed: '[[AOA::CONTINUE]]',
      human: '[[AOA::HUMAN]]',
      halt: '[[AOA::HALT]]'
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(`${src.slice(start, end)}\nthis.__terminal = terminal;`, sandbox);
  return sandbox.__terminal;
}

describe('v9 terminal suffix normalization', () => {
  const terminal = loadTerminal();

  test.each([
    ['[[GITL::PROCEED]]', 'proceed'],
    ['[[GITL::HUMAN]]', 'human'],
    ['[[GITL::HALT]]', 'halt'],
    ['[[AOA::CONTINUE]]', 'proceed'],
    ['[[AOA::HUMAN]]', 'human'],
    ['[[AOA::HALT]]', 'halt']
  ])('preserves exact final-line marker %s', (marker, type) => {
    expect(terminal(`Work completed\n${marker}`)).toMatchObject({ type, raw: marker, normalized: false });
  });

  test.each([
    ['Chunk 1 [[GITL::PROCEED]]', 'proceed', '[[GITL::PROCEED]]'],
    ['Chunk 1\t[[GITL::HUMAN]]   ', 'human', '[[GITL::HUMAN]]'],
    ['Chunk 1 [[AOA::HALT]]', 'halt', '[[AOA::HALT]]']
  ])('accepts a flattened final whitespace suffix', (input, type, raw) => {
    expect(terminal(input)).toMatchObject({ type, raw, normalized: true });
  });

  test('normalizes a final Model Relay suffix', () => {
    expect(terminal('Continue elsewhere [[AOA::RELAY:GPT-5.6]]')).toMatchObject({
      type: 'relay', raw: '[[AOA::RELAY:GPT-5.6]]', model: 'GPT-5.6', normalized: true
    });
  });

  test.each([
    'Before [[GITL::PROCEED]] after',
    'Before[[GITL::PROCEED]]',
    '[[GITL::PROCEED]] extra',
    'Before [[AOA::RELAY:GPT-5.6]] after'
  ])('rejects non-terminal or non-separated marker: %s', input => {
    expect(terminal(input).type).toBe('bad');
  });
});
