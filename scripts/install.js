#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

if (process.env.SKIP_SETUP) { console.log('SKIP_SETUP set — skipping.'); process.exit(0); }

const log = (m) => console.log(`\n▶ ${m}`);
function sh(cmd, args, { quiet = false } = {}) {
  const r = spawnSync(cmd, args, { stdio: quiet ? 'pipe' : 'inherit', encoding: 'utf8' });
  return { ok: r.status === 0, out: (r.stdout || '').trim() };
}
function which(cmd) {
  const r = sh('sh', ['-c', `command -v ${cmd}`], { quiet: true });
  if (r.ok) return r.out;
  const local = path.join(homedir(), '.local', 'bin', cmd);
  return existsSync(local) ? local : null;
}
function fail(m) { console.error(`\n✖ ${m}`); process.exit(1); }

if (process.platform !== 'darwin') fail('Requires macOS.');
if (process.arch !== 'arm64') fail('mlx-whisper requires Apple Silicon (arm64).');
if (!which('brew')) fail('Homebrew not found: https://brew.sh');

for (const { pkg, bin } of [
  { pkg: 'ffmpeg', bin: 'ffmpeg' },
  { pkg: 'yt-dlp', bin: 'yt-dlp' },
  { pkg: 'pipx', bin: 'pipx' },
  { pkg: 'python@3.12', bin: null },
]) {
  const installed = bin ? Boolean(which(bin)) : sh('brew', ['list', '--versions', pkg], { quiet: true }).ok;
  if (installed) { console.log(`✔ ${pkg} already installed`); continue; }
  log(`Installing ${pkg}…`);
  if (!sh('brew', ['install', pkg]).ok) fail(`brew install ${pkg} failed.`);
}

if (which('mlx_whisper')) {
  console.log('✔ mlx-whisper already installed');
} else {
  const prefix = sh('brew', ['--prefix', 'python@3.12'], { quiet: true }).out;
  const py312 = path.join(prefix, 'bin', 'python3.12');
  if (!existsSync(py312)) fail(`python3.12 not found at ${py312}`);
  log('Installing mlx-whisper with pipx (Python 3.12)…');
  if (!sh('pipx', ['install', '--python', py312, 'mlx-whisper']).ok) fail('pipx install mlx-whisper failed.');
  sh('pipx', ['ensurepath'], { quiet: true });
}
console.log('\n✅ Setup complete. Run:  npm start -- <facebook-reel-url>\n');
