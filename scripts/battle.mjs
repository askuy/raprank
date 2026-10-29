#!/usr/bin/env node
// Local helper for battle media.
//   pnpm battle new <toolA> <toolB> <audio|video>   scaffold a battle JSON + media folder
//   pnpm battle check                               list which media files are present/missing
//   pnpm battle compress <file...>                  shrink raw exports for the web (needs ffmpeg)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const DATA = 'src/data/battles';
const tools = new Map(JSON.parse(readFileSync('src/data/tools.json', 'utf8')).map((t) => [t.id, t]));
const [cmd, ...args] = process.argv.slice(2);

function check() {
  let missing = 0;
  for (const f of readdirSync(DATA).filter((f) => f.endsWith('.json'))) {
    const b = JSON.parse(readFileSync(join(DATA, f), 'utf8'));
    const id = f.replace(/\.json$/, '');
    console.log(`\n${id}  (${b.mediaType})`);
    if ([...b.roast.a, ...b.roast.b].some((l) => l.startsWith('TODO'))) console.log('  ⚠️  roast lines still TODO');
    b.rounds.forEach((r, i) => {
      for (const side of ['a', 'b']) {
        const m = r[side].media;
        const ok = m && existsSync(join('public', m));
        if (!ok) missing++;
        console.log(`  ${ok ? '✅' : '❌'} round ${i + 1} ${b[side].padEnd(20)} public${m}`);
      }
    });
  }
  console.log(missing ? `\n${missing} file(s) missing. Rounds with missing files show "samples coming" on the site.` : '\nAll media present.');
}

function scaffold([a, b, type]) {
  if (!tools.has(a) || !tools.has(b)) throw new Error(`Unknown tool id. Use ids from src/data/tools.json`);
  if (!['audio', 'video'].includes(type)) throw new Error('Type must be audio or video');
  const id = `${a}-vs-${b}`;
  const file = join(DATA, `${id}.json`);
  if (existsSync(file)) throw new Error(`${file} already exists`);
  const ext = type === 'audio' ? 'mp3' : 'mp4';
  const battle = {
    a, b, mediaType: type,
    date: new Date().toISOString().slice(0, 7),
    intro: `TODO: one line on why ${tools.get(a).name} vs ${tools.get(b).name} matters.`,
    roast: { a: ['TODO', 'TODO', 'TODO', 'TODO'], b: ['TODO', 'TODO', 'TODO', 'TODO'] },
    rounds: [{
      title: 'TODO round title',
      prompt: 'TODO exact prompt used in both tools',
      inputs: 'TODO settings / uploaded files. First generation kept.',
      a: { media: `/battles/${id}/1-${a}.${ext}` },
      b: { media: `/battles/${id}/1-${b}.${ext}` },
    }],
  };
  writeFileSync(file, JSON.stringify(battle, null, 2) + '\n');
  mkdirSync(join('public/battles', id), { recursive: true });
  console.log(`Created ${file}\nPut media in public/battles/${id}/ (1-${a}.${ext}, 1-${b}.${ext}), then run: pnpm battle check`);
}

// 720p H.264 (CRF 28) + 128k AAC for video; 160k mp3 for audio. Original is kept as *.orig.<ext>.
function compress(files) {
  const mb = (f) => (statSync(f).size / 1e6).toFixed(1) + ' MB';
  for (const f of files) {
    const ext = extname(f).toLowerCase();
    const orig = f.replace(/(\.[^.]+)$/, '.orig$1');
    renameSync(f, orig);
    const args = ext === '.mp4'
      ? ['-i', orig, '-vf', 'scale=-2:min(720\\,ih)', '-c:v', 'libx264', '-crf', '28', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', f]
      : ['-i', orig, '-c:a', 'libmp3lame', '-b:a', '160k', f];
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args]);
    console.log(`${f}: ${mb(orig)} → ${mb(f)}  (original kept as ${orig})`);
  }
}

if (cmd === 'check') check();
else if (cmd === 'compress') compress(args);
else if (cmd === 'new') scaffold(args);
else console.log('Usage: pnpm battle new <toolA> <toolB> <audio|video> | pnpm battle check | pnpm battle compress <file...>');
