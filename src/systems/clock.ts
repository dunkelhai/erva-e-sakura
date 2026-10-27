import { BALANCE } from '../config/balance';
import { PAL } from '../style/palette';

export type Phase = 'manha' | 'tarde' | 'entardecer' | 'noite';

export const PHASE_LABEL: Record<Phase, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  entardecer: 'Entardecer',
  noite: 'Noite',
};

/** Relógio do jogo: dia (1..N) e minutos desde 00:00. */
export class Clock {
  day = 1;
  minutes: number = BALANCE.DAY_START_MIN;

  get hour(): number {
    return this.minutes / 60;
  }

  get phase(): Phase {
    return phaseAt(this.hour);
  }

  get isNight(): boolean {
    return this.hour >= 19.25;
  }

  /** Texto "06:30" (arredondado para baixo a cada 10 min). */
  get label(): string {
    const total = Math.floor(this.minutes / 10) * 10;
    const h = Math.floor(total / 60) % 24;
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}

export function phaseAt(hour: number): Phase {
  if (hour < 11) return 'manha';
  if (hour < 16) return 'tarde';
  if (hour < 19) return 'entardecer';
  return 'noite';
}

/** Pontos-chave do tint (hora → cor). Interpolação linear entre eles. */
const TINT_KEYS: ReadonlyArray<readonly [number, number]> = [
  [6, PAL.tintManha],
  [10.5, PAL.tintManha],
  [11.5, PAL.tintTarde],
  [15.5, PAL.tintTarde],
  [16.75, PAL.tintEntardecer],
  [18.5, PAL.tintEntardecer],
  [19.75, PAL.tintNoite],
  [24, PAL.tintNoite],
];

function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

export function tintAt(hour: number): number {
  if (hour <= TINT_KEYS[0][0]) return TINT_KEYS[0][1];
  for (let i = 0; i < TINT_KEYS.length - 1; i++) {
    const [h0, c0] = TINT_KEYS[i];
    const [h1, c1] = TINT_KEYS[i + 1];
    if (hour <= h1) return lerpColor(c0, c1, (hour - h0) / (h1 - h0));
  }
  return TINT_KEYS[TINT_KEYS.length - 1][1];
}
