#!/usr/bin/env node
// Opens a transcript in less: latest .txt in output/ by default, or a given reel id / path.
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'output');
const target = process.argv.slice(2).find((a) => !a.startsWith('--'));

function latestTxt() {
  if (!existsSync(OUT_DIR)) return null;
  return readdirSync(OUT_DIR)
    .filter((f) => f.endsWith('.txt'))
    .map((f) => path.join(OUT_DIR, f))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0] ?? null;
}

const txt = target
  ? (target.endsWith('.txt') ? path.resolve(target) : path.join(OUT_DIR, `${target}.txt`))
  : latestTxt();

if (!txt || !existsSync(txt)) {
  console.error('✖ No transcript found. Run `npm start -- <url>` first, or pass a reel id.');
  process.exit(1);
}

spawn('less', [txt], { stdio: 'inherit' }).on('close', (c) => process.exit(c ?? 0));
