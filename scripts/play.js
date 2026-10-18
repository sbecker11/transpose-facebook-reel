#!/usr/bin/env node
// Plays a generated mp3: latest in output/ by default, or a given reel id / path.
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'output');

const args = process.argv.slice(2);
const useQuickTime = args.includes('--quicktime');
const target = args.find((a) => !a.startsWith('--'));

function latestMp3() {
  if (!existsSync(OUT_DIR)) return null;
  return readdirSync(OUT_DIR)
    .filter((f) => f.endsWith('.mp3'))
    .map((f) => path.join(OUT_DIR, f))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0] ?? null;
}

const mp3 = target
  ? (target.endsWith('.mp3') ? path.resolve(target) : path.join(OUT_DIR, `${target}.mp3`))
  : latestMp3();

if (!mp3 || !existsSync(mp3)) {
  console.error('✖ No mp3 found. Run `npm start -- <url>` first, or pass a reel id.');
  process.exit(1);
}

const [cmd, cmdArgs] = useQuickTime
  ? ['open', ['-a', 'QuickTime Player', mp3]]
  : ['afplay', [mp3]];

console.log(`▶ Playing ${path.basename(mp3)}${useQuickTime ? ' in QuickTime Player' : ' (Ctrl+C to stop)'}`);
spawn(cmd, cmdArgs, { stdio: 'inherit' }).on('close', (c) => process.exit(c ?? 0));
