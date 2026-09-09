#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const sourcePath = path.resolve('scripts/apply-885-perplexity-ui.mjs');
let code = fs.readFileSync(sourcePath, 'utf8');

const from = [
  'src = replaceOne(',
  '  src,',
  "  `  return !!rec && rec.outcome === 'uncertain' && Number.isFinite(rec.at)`,",
  "  `  return !!rec && (rec.outcome === 'uncertain' || rec.outcome === 'failed') && Number.isFinite(rec.at)`,",
  "  'suppress failed route after human review'",
  ');'
].join('\n');

const to = [
  '{',
  "  const needle = \"rec.outcome === 'uncertain'\";",
  '  const count = src.split(needle).length - 1;',
  "  if (count !== 1) throw new Error(`suppress failed route after human review: expected one health predicate, found ${count}`);",
  "  src = src.replace(needle, \"(rec.outcome === 'uncertain' || rec.outcome === 'failed')\");",
  '}'
].join('\n');

if (!code.includes(from)) {
  throw new Error('wrapper could not locate the stale health-predicate assembler block');
}
code = code.replace(from, to);

const tempPath = path.join(os.tmpdir(), `gitl-885-perplexity-${process.pid}.mjs`);
fs.writeFileSync(tempPath, code);
try {
  await import(pathToFileURL(tempPath).href + `?v=${Date.now()}`);
} finally {
  try { fs.unlinkSync(tempPath); } catch (_) {}
}
