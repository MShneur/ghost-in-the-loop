const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'ghost-in-the-loop.user.js');
let src = fs.readFileSync(file, 'utf8');

const before = '#g-tc{position:relative}';
const after = '#g-tc{position:relative;padding-top:20px}';

if (src.includes(after)) {
  console.log('Tab-help overlap fix already applied');
  process.exit(0);
}
if (!src.includes(before)) {
  throw new Error('Expected #g-tc CSS marker not found; refusing broad replacement');
}

src = src.replace(before, after);
fs.writeFileSync(file, src, 'utf8');
console.log('Reserved a dedicated top strip for tab help controls');
