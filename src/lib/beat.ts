// WebAudio boom-bap loop (90 BPM), synthesized — no audio files.
// Browsers only allow audio after a user gesture, so call start() from a click.

const BPM = 90;
const STEP = 60 / BPM / 4;
const BASS: Record<number, number> = { 0: 55, 7: 55, 10: 65.4, 16: 49, 23: 49, 26: 58.3 };

let ctx: AudioContext | null = null;
let master: GainNode;
let noiseBuf: AudioBuffer;
let timer: ReturnType<typeof setInterval> | null = null;
let nextTime = 0;
let step = 0;
let muted = false;

function init() {
  if (ctx) return ctx;
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.6;
  master.connect(ctx.destination);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}

function kick(c: AudioContext, t: number) {
  const o = c.createOscillator(), g = c.createGain();
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
  g.gain.setValueAtTime(1, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.5);
}

function noise(c: AudioContext, t: number, dur: number, freq: number, vol: number) {
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = noiseBuf;
  f.type = 'highpass';
  f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f).connect(g).connect(master);
  s.start(t);
  s.stop(t + dur + 0.02);
}

function bass(c: AudioContext, t: number, freq: number) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = 'triangle';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.55);
}

function schedule(c: AudioContext) {
  while (nextTime < c.currentTime + 0.12) {
    const s = step % 32, s16 = s % 16;
    const t = nextTime + (s16 % 2 ? STEP * 0.18 : 0); // swing
    if (s16 === 0 || s16 === 7 || s16 === 10) kick(c, t);
    if (s16 === 4 || s16 === 12) noise(c, t, 0.22, 1500, 0.6);
    if (s16 % 2 === 0) noise(c, t, s16 === 14 ? 0.18 : 0.05, 7500, s16 === 14 ? 0.18 : 0.12);
    if (BASS[s]) bass(c, t, BASS[s]);
    nextTime += STEP;
    step++;
  }
}

export function startBeat() {
  const c = init();
  c.resume();
  if (timer) return;
  nextTime = c.currentTime + 0.05;
  step = 0;
  timer = setInterval(() => schedule(c), 25);
}

export function stopBeat() {
  if (timer) clearInterval(timer);
  timer = null;
}

export function setMuted(m: boolean) {
  muted = m;
  if (ctx) master.gain.setTargetAtTime(m ? 0 : 0.6, ctx.currentTime, 0.05);
}
