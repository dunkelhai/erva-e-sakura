/** Efeitos sonoros sintetizados com Web Audio (iniciados após gesto do usuário). */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;

export function initAudio(): void {
  if (ctx) {
    void ctx.resume();
    return;
  }
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = 0.35;
  master.connect(ctx.destination);
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, delay = 0, slide = 0) {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide !== 0) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  plant: () => {
    tone(330, 0.12, 'triangle', 0.5);
    tone(440, 0.1, 'triangle', 0.35, 0.06);
  },
  water: () => {
    tone(900, 0.25, 'sine', 0.25, 0, -500);
    tone(700, 0.2, 'sine', 0.2, 0.08, -350);
  },
  harvest: () => {
    [523, 659, 784].forEach((f, i) => tone(f, 0.16, 'triangle', 0.4, i * 0.06));
  },
  coin: () => {
    tone(988, 0.07, 'square', 0.12);
    tone(1319, 0.12, 'square', 0.1, 0.05);
  },
  wrong: () => {
    tone(220, 0.25, 'triangle', 0.4, 0, -80);
  },
  type: () => tone(660 + Math.random() * 120, 0.03, 'sine', 0.06),
  select: () => tone(520, 0.06, 'triangle', 0.25),
  bell: () => {
    tone(784, 0.6, 'sine', 0.3);
    tone(1175, 0.5, 'sine', 0.15, 0.02);
  },
  day: () => {
    [392, 523, 659, 784].forEach((f, i) => tone(f, 0.35, 'sine', 0.3, i * 0.12));
  },
  win: () => {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.3, 'triangle', 0.35, i * 0.12));
  },
  lose: () => {
    [392, 349, 311, 262].forEach((f, i) => tone(f, 0.4, 'triangle', 0.3, i * 0.18));
  },
};
