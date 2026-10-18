#!/usr/bin/env node
// Stops mp3 playback started by `npm start` / `npm run play`: afplay processes and QuickTime documents from output/.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'output');

const ps = spawnSync('ps', ['-axo', 'pid=,args='], { encoding: 'utf8' });
const pids = ps.stdout
  .split('\n')
  .map((line) => line.trim().match(/^(\d+)\s+(.*)$/))
  .filter((m) => m && /^(\S*\/)?afplay\s/.test(m[2]) && m[2].includes(OUT_DIR))
  .map((m) => Number(m[1]));

for (const pid of pids) {
  try { process.kill(pid, 'SIGTERM'); } catch { /* already exited */ }
}

const qtScript = `
if application "QuickTime Player" is running then
  tell application "QuickTime Player"
    set n to 0
    repeat with d in (get documents)
      try
        if (POSIX path of (file of d as alias)) starts with ${JSON.stringify(OUT_DIR + '/')} then
          close d
          set n to n + 1
        end if
      end try
    end repeat
    return n
  end tell
end if
return 0`;
const qt = spawnSync('osascript', ['-e', qtScript], { encoding: 'utf8' });
const qtClosed = Number(qt.stdout?.trim()) || 0;

const stopped = pids.length + qtClosed;
console.log(stopped ? `■ Stopped ${stopped} playing mp3${stopped > 1 ? 's' : ''}` : 'Nothing is playing');
