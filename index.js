#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'output');
const MODEL = process.env.WHISPER_MODEL || 'mlx-community/whisper-small-mlx';
const COOKIES_BROWSER = process.env.FB_COOKIES_BROWSER;

const args = process.argv.slice(2);
const noPlay = args.includes('--no-play');
const url = args.find((a) => !a.startsWith('--'));
if (!url || !/facebook\.com|fb\.watch/.test(url)) {
  console.error('Usage: npm start -- <facebook-reel-url> [--no-play]');
  process.exit(1);
}

function which(cmd) {
  const r = spawnSync('sh', ['-c', `command -v ${cmd}`], { encoding: 'utf8' });
  if (r.status === 0) return r.stdout.trim();
  const local = path.join(homedir(), '.local', 'bin', cmd);
  return existsSync(local) ? local : null;
}
function requireBin(cmd) {
  const bin = which(cmd);
  if (!bin) { console.error(`✖ ${cmd} not found. Run \`npm run setup\` first.`); process.exit(1); }
  return bin;
}
function run(cmd, cmdArgs) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, cmdArgs, { stdio: 'inherit' });
    p.on('error', reject);
    p.on('close', (c) => (c === 0 ? resolve() : reject(new Error(`${path.basename(cmd)} exited with code ${c}`))));
  });
}

async function main() {
  const ytdlp = requireBin('yt-dlp');
  const whisper = requireBin('mlx_whisper');
  mkdirSync(OUT_DIR, { recursive: true });
  const id = url.match(/reel\/(\d+)/)?.[1] ?? `reel-${Date.now()}`;
  const mp3 = path.join(OUT_DIR, `${id}.mp3`);
  const txt = path.join(OUT_DIR, `${id}.txt`);

  if (existsSync(mp3)) {
    console.log(`✔ Audio already downloaded: ${mp3}`);
  } else {
    console.log('▶ Downloading audio…');
    const dl = ['-x', '--audio-format', 'mp3', '-o', path.join(OUT_DIR, `${id}.%(ext)s`)];
    if (COOKIES_BROWSER) dl.push('--cookies-from-browser', COOKIES_BROWSER);
    await run(ytdlp, [...dl, url]);
  }

  console.log(`▶ Transcribing with ${MODEL}…`);
  await run(whisper, [mp3, '--model', MODEL, '--output-dir', OUT_DIR, '--output-format', 'txt']);
  if (existsSync(txt)) {
    console.log('\n──────── Transcript ────────\n');
    console.log(readFileSync(txt, 'utf8').trim());
    console.log(`\n────────────────────────────\nSaved: ${txt}\n`);
  }

  if (!noPlay) { console.log('▶ Playing audio (Ctrl+C to stop)…'); await run('afplay', [mp3]); }
}
main().catch((e) => { console.error(`✖ ${e.message}`); process.exit(1); });
