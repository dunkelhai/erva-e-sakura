import Phaser from 'phaser';
import { RES } from '../config/layout';
import { PAL } from '../style/palette';
import { Pen } from './pen';

const T = PAL.tinta;
const OUT = 0.85; // alpha do contorno

export type Dir = 'down' | 'up' | 'side';

interface CharOpts {
  skin: number;
  hair: number;
  hairStyle: 'short' | 'bun' | 'long';
  top: number;
  bottom: number;
  hat: number | null;
  scarf: number | null;
  belt?: number;
  cuia?: boolean;
}

export const CHAR_W = 26;
export const CHAR_H = 38;

export const CUSTOMER_LOOKS: CharOpts[] = [
  {
    skin: PAL.pele,
    hair: PAL.tinta,
    hairStyle: 'short',
    top: PAL.musgo,
    bottom: PAL.madeira,
    hat: PAL.madeira,
    scarf: PAL.terracota,
  },
  {
    skin: PAL.peleMorena,
    hair: PAL.madeira,
    hairStyle: 'long',
    top: PAL.terracota,
    bottom: PAL.tinta,
    hat: null,
    scarf: PAL.taipa,
  },
  {
    skin: PAL.pele,
    hair: PAL.tinta,
    hairStyle: 'bun',
    top: PAL.cerejeira,
    bottom: PAL.musgoFundo,
    hat: null,
    scarf: null,
    belt: PAL.musgoFundo,
  },
];

export const PLAYER_LOOK: CharOpts = {
  skin: PAL.pele,
  hair: PAL.tinta,
  hairStyle: 'short',
  top: PAL.ceuAgua,
  bottom: PAL.madeira,
  hat: PAL.jogador,
  scarf: PAL.jogador,
};

export const NPC_LOOK: CharOpts = {
  skin: PAL.pele,
  hair: PAL.cabeloBranco,
  hairStyle: 'bun',
  top: PAL.cerejeiraViva,
  bottom: PAL.cerejeiraViva,
  hat: null,
  scarf: null,
  belt: PAL.musgoFundo,
  cuia: true,
};

/** Silhueta: círculos de contorno desenhados atrás (contorno só na borda externa). */
function blob(p: Pen, circles: Array<[number, number, number, number]>): void {
  p.fill(T, OUT);
  for (const [x, y, r] of circles) p.circle(x, y, r + 1.4);
  for (const [x, y, r, c] of circles) p.fill(c).circle(x, y, r);
}

function drawChar(p: Pen, o: CharOpts, dir: Dir, frame: number): void {
  const oy = 2;
  p.line(1.4, T, OUT);
  // pernas
  p.fill(o.bottom);
  if (dir === 'side') {
    const spread = frame === 1 ? 3 : 0;
    p.rrect(10 - spread, 27 + oy, 5, 8, 2, true);
    p.rrect(12 + spread, 27 + oy, 5, 8, 2, true);
  } else {
    const l = frame === 1 ? -1.5 : 0;
    const r = frame === 1 ? 0 : 0;
    p.rrect(8, 27 + oy, 4.5, 8 + l, 2, true);
    p.rrect(13.5, 27 + oy, 4.5, 8 + r - (frame === 1 ? 0 : 0), 2, true);
  }
  // coque atrás da cabeça
  if (o.hairStyle === 'bun') p.fill(o.hair).circle(13, 2.5 + oy, 3.6, true);
  // corpo
  p.fill(o.top).rrect(5.5, 17 + oy, 15, 13, 5, true);
  if (o.belt !== undefined) p.fill(o.belt).rect(6, 24 + oy, 14, 2.5);
  // braços
  p.fill(o.top);
  if (dir === 'side') {
    p.rrect(11, 19 + oy, 5, 9, 2.5, true);
  } else {
    p.rrect(3, 19 + oy, 4.5, 9, 2.2, true);
    p.rrect(18.5, 19 + oy, 4.5, 9, 2.2, true);
  }
  if (o.scarf !== null && dir !== 'up')
    p.fill(o.scarf).tri(8.5, 17.5 + oy, 17.5, 17.5 + oy, 13, 23 + oy);
  // cuia na mão (NPC)
  if (o.cuia && dir !== 'up') {
    p.fill(PAL.madeira).circle(21, 27 + oy, 3, true);
    p.fill(PAL.musgo).ellipse(21, 24.6 + oy, 4.6, 1.8);
    p.line(1, PAL.pedra, 1).seg(21.5, 25 + oy, 23.5, 20.5 + oy);
    p.line(1.4, T, OUT);
  }
  // cabeça
  p.fill(o.skin).circle(13, 11 + oy, 8.6, true);
  // cabelo
  p.fill(o.hair);
  if (dir === 'up') {
    p.circle(13, 11 + oy, 8.6, true);
    if (o.hairStyle === 'long') p.rrect(5, 11 + oy, 16, 10, 4, true);
  } else if (dir === 'side') {
    p.ellipse(11.5, 6.8 + oy, 16, 8.5);
    p.circle(7.5, 10.5 + oy, 4.6);
    if (o.hairStyle === 'long') p.rrect(4.5, 9 + oy, 7, 12, 3);
  } else {
    p.ellipse(13, 6.6 + oy, 17.5, 8.5);
    p.circle(6.2, 10 + oy, 3);
    p.circle(19.8, 10 + oy, 3);
    if (o.hairStyle === 'long') {
      p.rrect(3.6, 9 + oy, 4.5, 12, 2);
      p.rrect(17.9, 9 + oy, 4.5, 12, 2);
    }
  }
  // olhos e bochechas
  if (dir === 'down') {
    p.fill(T)
      .ellipse(9.6, 12.6 + oy, 2.6, 3.6)
      .ellipse(16.4, 12.6 + oy, 2.6, 3.6);
    p.fill(PAL.branco)
      .circle(10, 11.8 + oy, 0.7)
      .circle(16.8, 11.8 + oy, 0.7);
    p.fill(PAL.cerejeira, 0.8)
      .ellipse(7.4, 15.4 + oy, 3, 1.6)
      .ellipse(18.6, 15.4 + oy, 3, 1.6);
  } else if (dir === 'side') {
    p.fill(T).ellipse(17.2, 12.6 + oy, 2.6, 3.6);
    p.fill(PAL.branco).circle(17.6, 11.8 + oy, 0.7);
    p.fill(PAL.cerejeira, 0.8).ellipse(18.6, 15.6 + oy, 3, 1.6);
  }
  // chapéu
  if (o.hat !== null) {
    p.line(1.4, T, OUT);
    p.fill(o.hat).ellipse(13, 5 + oy, 24, 6.5, true);
    p.rrect(7.5, -1.5 + oy, 11, 6.5, 3, true);
    p.fill(T, 0.35).rect(7.8, 3 + oy, 10.4, 1.4);
  }
}

function bakeChar(p: Pen, prefix: string, o: CharOpts): void {
  for (const dir of ['down', 'up', 'side'] as Dir[]) {
    for (const f of [0, 1]) {
      drawChar(p, o, dir, f);
      p.bake(`${prefix}_${dir}_${f}`, CHAR_W, CHAR_H);
    }
  }
}

/** Telhado trapézio com telha capa-e-canal. */
function roof(p: Pen, x0: number, x1: number, yTop: number, yBot: number, inset: number): void {
  p.line(2, T, OUT);
  p.fill(PAL.terracota).poly([x0, yBot, x1, yBot, x1 - inset, yTop, x0 + inset, yTop], true);
  p.line(1.5, PAL.telhaSombra, 1);
  for (let x = x0 + 6; x < x1 - 2; x += 6) {
    let top = yTop;
    if (x < x0 + inset) top = yBot - (yBot - yTop) * ((x - x0) / inset);
    if (x > x1 - inset) top = yBot - (yBot - yTop) * ((x1 - x) / inset);
    p.seg(x, top + 2.5, x, yBot - 2);
  }
  p.line(2, T, OUT);
}

function drawHouse(p: Pen): void {
  p.fill(PAL.musgoFundo, 0.3).ellipse(96, 152, 196, 18);
  p.line(2, T, OUT);
  p.fill(PAL.taipa).rrect(12, 66, 168, 86, 6, true);
  p.fill(PAL.taipaSombra).rect(14, 132, 164, 18);
  p.fill(PAL.madeira).rect(13, 70, 166, 5);
  // porta arredondada
  p.fill(PAL.madeira).rrect(80, 98, 32, 54, 14, true);
  p.fill(T, 0.25).rect(95.5, 104, 1.5, 46);
  p.fill(PAL.moedaClara).circle(105, 128, 2);
  // janelas
  for (const wx of [30, 134]) {
    p.fill(PAL.madeira).rrect(wx, 90, 28, 26, 5, true);
    p.fill(T, 0.55).rrect(wx + 4, 94, 20, 18, 3);
    p.fill(PAL.madeira)
      .rect(wx + 13, 94, 2, 18)
      .rect(wx + 4, 102, 20, 2);
    p.fill(PAL.cerejeira)
      .circle(wx + 6, 118, 3)
      .circle(wx + 14, 117, 3.5)
      .circle(wx + 22, 118, 3);
  }
  roof(p, 0, 192, 6, 76, 26);
  p.fill(PAL.telhaSombra).rrect(24, 2, 144, 8, 4, true);
  p.fill(T, 0.22).rect(12, 76, 168, 5);
}

function drawTeaHouse(p: Pen): void {
  p.fill(PAL.musgoFundo, 0.3).ellipse(128, 186, 250, 18);
  p.line(2, T, OUT);
  p.fill(PAL.taipa).rrect(22, 92, 212, 92, 6, true);
  p.fill(PAL.madeira, 0.55).rect(24, 156, 208, 26);
  p.fill(PAL.madeira);
  for (const x of [22, 74, 174, 226]) p.rect(x, 92, 8, 92);
  // shoji
  for (const wx of [36, 186]) {
    p.fill(PAL.shoji).rrect(wx, 106, 34, 40, 3, true);
    p.line(1.2, PAL.madeira, 1);
    p.seg(wx + 11, 106, wx + 11, 146).seg(wx + 23, 106, wx + 23, 146);
    p.seg(wx, 119, wx + 34, 119).seg(wx, 132, wx + 34, 132);
    p.line(2, T, OUT);
  }
  // entrada com noren
  p.fill(T, 0.7).rrect(100, 106, 56, 78, 4);
  p.fill(PAL.cerejeira).rrect(100, 106, 56, 30, 3, true);
  p.line(1.4, T, 0.5).seg(118.6, 108, 118.6, 136).seg(137.3, 108, 137.3, 136);
  p.fill(PAL.branco).circle(128, 120, 5);
  p.fill(PAL.cerejeiraViva).circle(128, 120, 2.2);
  p.line(2, T, OUT);
  // telhado inferior com pontas
  p.fill(PAL.terracota).tri(0, 104, 22, 92, 18, 104);
  p.tri(256, 104, 234, 92, 238, 104);
  roof(p, 4, 252, 44, 102, 34);
  p.fill(PAL.terracota).poly([0, 104, 14, 96, 22, 102], true);
  p.poly([256, 104, 242, 96, 234, 102], true);
  // telhado superior
  roof(p, 54, 202, 6, 50, 26);
  p.fill(PAL.telhaSombra).rrect(70, 2, 116, 7, 3.5, true);
  p.fill(PAL.telhaSombra).circle(70, 5, 4, true).circle(186, 5, 4, true);
  // placa
  p.fill(PAL.madeira).rrect(108, 56, 40, 20, 4, true);
  p.fill(PAL.taipa).rect(114, 62, 28, 2).rect(114, 68, 20, 2);
  // lanternas de papel penduradas
  p.fill(T, 0.22).rect(22, 102, 212, 5);
  for (const lx of [58, 198]) {
    p.line(1.2, T, 0.8).seg(lx, 102, lx, 108);
    p.line(1.6, T, OUT);
    p.fill(PAL.cerejeiraViva).ellipse(lx, 117, 14, 18, true);
    p.fill(T, 0.6)
      .rect(lx - 4, 107.5, 8, 2)
      .rect(lx - 4, 125, 8, 2);
  }
}

function drawCounter(p: Pen): void {
  p.fill(PAL.musgoFundo, 0.3).ellipse(48, 30, 100, 8);
  p.line(2, T, OUT);
  p.fill(PAL.madeira).rrect(2, 10, 92, 20, 5, true);
  p.fill(T, 0.2).rect(4, 22, 88, 2);
  p.fill(PAL.taipa).rrect(0, 4, 96, 10, 4, true);
  // cuia e tigela
  p.line(1.4, T, OUT);
  p.fill(PAL.madeira).circle(24, 4, 4.5, true);
  p.fill(PAL.musgo).ellipse(24, 1.5, 6, 2);
  p.fill(PAL.taipa).ellipse(70, 4, 12, 7, true);
  p.fill(PAL.musgoClaro).ellipse(70, 2.4, 9, 2.6);
}

function drawTorii(p: Pen): void {
  p.fill(PAL.musgoFundo, 0.3).ellipse(18, 80, 18, 6).ellipse(70, 80, 18, 6);
  p.line(2, T, OUT);
  p.fill(PAL.pedra).rrect(11, 72, 14, 8, 2, true).rrect(63, 72, 14, 8, 2, true);
  p.fill(PAL.torii).rect(14, 16, 8, 58).rect(66, 16, 8, 58);
  p.g.strokeRect(14 * p.s, 16 * p.s, 8 * p.s, 58 * p.s);
  p.g.strokeRect(66 * p.s, 16 * p.s, 8 * p.s, 58 * p.s);
  p.fill(PAL.torii).rrect(6, 26, 76, 7, 2, true);
  p.fill(PAL.torii).poly([0, 6, 88, 6, 82, 16, 6, 16], true);
  p.fill(T, 0.9).poly([0, 6, 88, 6, 86, 2, 2, 2]);
  p.fill(PAL.madeira).rrect(38, 16, 12, 10, 2, true);
}

function drawLantern(p: Pen): void {
  p.fill(PAL.musgoFundo, 0.3).ellipse(10, 36, 18, 5);
  p.line(1.5, T, OUT);
  p.fill(PAL.pedra).rrect(3, 28, 14, 8, 2, true);
  p.rrect(7, 19, 6, 10, 2, true);
  p.rrect(3, 11, 14, 10, 3, true);
  p.fill(PAL.lanterna).rrect(6.5, 13.5, 7, 5, 1.5);
  p.fill(PAL.pedra).poly([0, 12, 20, 12, 14, 5, 6, 5], true);
  p.circle(10, 3.5, 2.2, true);
}

function drawLight(p: Pen): void {
  for (let i = 0; i < 20; i++) p.fill(PAL.branco, 0.045).circle(32, 32, 32 - i * 1.55);
}

function drawSakura(p: Pen): void {
  p.fill(PAL.musgoFundo, 0.3).ellipse(36, 84, 56, 12);
  p.line(1.8, T, OUT);
  p.fill(PAL.madeira).rrect(31, 50, 10, 34, 4, true);
  blob(p, [
    [26, 50, 12, PAL.cerejeiraViva],
    [46, 50, 12, PAL.cerejeiraViva],
    [22, 40, 17, PAL.cerejeira],
    [50, 40, 17, PAL.cerejeira],
    [36, 25, 19, PAL.cerejeiraClara],
  ]);
  p.fill(PAL.branco, 0.6).circle(30, 18, 4).circle(44, 30, 2.5).circle(18, 36, 2.5);
}

function drawTree(p: Pen): void {
  p.fill(PAL.musgoFundo, 0.3).ellipse(32, 76, 50, 10);
  p.line(1.8, T, OUT);
  p.fill(PAL.madeira).rrect(27, 46, 10, 30, 4, true);
  blob(p, [
    [32, 44, 22, PAL.musgoFundo],
    [30, 33, 19, PAL.musgo],
  ]);
  p.fill(PAL.musgoClaro).circle(26, 24, 11);
  p.fill(PAL.branco, 0.25).circle(22, 20, 4);
}

function drawBush(p: Pen): void {
  p.fill(PAL.musgoFundo, 0.3).ellipse(16, 21, 30, 6);
  blob(p, [
    [10, 14, 7, PAL.musgo],
    [22, 14, 7, PAL.musgo],
    [16, 10, 8, PAL.musgo],
  ]);
  p.fill(PAL.musgoClaro).circle(14, 8, 4);
  p.fill(PAL.cerejeira).circle(9, 12, 1.6).circle(21, 10, 1.6).circle(17, 16, 1.6);
}

function drawFenceH(p: Pen): void {
  p.line(1.4, T, OUT);
  p.fill(PAL.madeira).rect(0, 7, 32, 3).rect(0, 14, 32, 3);
  p.fill(T, 0.3).rect(0, 10, 32, 1).rect(0, 17, 32, 1);
  p.fill(PAL.madeira).rrect(1, 2, 6, 19, 2, true);
}

function drawFenceV(p: Pen): void {
  p.line(1.4, T, OUT);
  p.fill(PAL.madeira).rect(3, 0, 3, 32).rect(8, 0, 3, 32);
  p.fill(PAL.madeira).rrect(4, 2, 6, 14, 2, true);
}

function drawPost(p: Pen): void {
  p.line(1.4, T, OUT);
  p.fill(PAL.madeira).rrect(1, 2, 6, 19, 2, true);
}

function drawSoil(p: Pen, wet: boolean): void {
  p.line(2, T, 0.6);
  p.fill(wet ? PAL.terraMolhada : PAL.terra).rrect(2, 2, 60, 60, 10, true);
  p.fill(wet ? T : PAL.terraMolhada, wet ? 0.3 : 0.4);
  for (const y of [14, 29, 44]) p.rrect(9, y, 46, 6, 3);
  if (wet) p.fill(PAL.ceuAgua, 0.45).circle(16, 22, 1.6).circle(44, 38, 1.4).circle(30, 52, 1.2);
}

function drawErva(p: Pen, stage: number): void {
  p.line(1.4, T, OUT);
  if (stage === 1) {
    p.line(1.6, PAL.musgoFundo, 1).seg(24, 38, 24, 30);
    p.line(1.2, T, OUT);
    p.fill(PAL.musgo).ellipse(20.5, 29, 7, 4, true).ellipse(27.5, 28, 7, 4, true);
    return;
  }
  const big = stage === 3;
  const r = big ? 1 : 0.7;
  const leaves: Array<[number, number, number]> = [
    [14, 30, PAL.musgoFundo],
    [34, 30, PAL.musgoFundo],
    [24, 34, PAL.musgoFundo],
    [18, 22, PAL.musgo],
    [30, 22, PAL.musgo],
    [24, 15, PAL.musgo],
  ];
  p.fill(PAL.madeira).rrect(22.5, 32, 3, 8, 1.5, true);
  for (const [x, y, c] of leaves) {
    const lx = 24 + (x - 24) * r;
    const ly = 36 + (y - 36) * r;
    p.fill(c).ellipse(lx, ly, 11 * r + 2, 7 * r + 1.5, true);
  }
  p.fill(PAL.musgoClaro, 0.8).ellipse(22, 36 + (16 - 36) * r, 4 * r, 2 * r);
  if (big) {
    p.fill(PAL.terracota).circle(15, 25, 1.8).circle(32, 27, 1.8).circle(26, 19, 1.8);
    p.fill(PAL.perigoSuave).circle(20, 30, 1.6).circle(29, 33, 1.6);
  }
}

function drawCha(p: Pen, stage: number): void {
  p.line(1.4, T, OUT);
  if (stage === 1) {
    p.fill(PAL.musgoClaro).ellipse(20, 30, 5, 9, true).ellipse(28, 30, 5, 9, true);
    p.fill(PAL.musgo).ellipse(24, 28, 5, 10, true);
    return;
  }
  const big = stage === 3;
  const w = big ? 40 : 28;
  const h = big ? 26 : 18;
  p.fill(PAL.musgo).ellipse(24, 38 - h / 2, w, h, true);
  p.fill(PAL.musgoClaro).ellipse(24, 38 - h / 2 - h * 0.18, w * 0.8, h * 0.55);
  p.line(1, PAL.musgo, 0.9);
  for (let i = -2; i <= 2; i++) p.arc(24 + i * (w / 6), 38 - h / 2, 3, Math.PI, Math.PI * 2);
  if (big) {
    for (const [x, y] of [
      [12, 22],
      [22, 16],
      [33, 18],
      [38, 26],
      [18, 28],
    ]) {
      p.fill(PAL.branco).circle(x, y, 2.4);
      p.fill(PAL.moedaClara).circle(x, y, 1);
    }
  }
}

function drawShadow(p: Pen): void {
  p.fill(T).ellipse(10, 4, 19, 7);
}

function drawPetal(p: Pen): void {
  p.fill(PAL.cerejeira).ellipse(3, 2, 6, 4);
  p.fill(PAL.cerejeiraClara).ellipse(2.4, 1.6, 2.6, 1.6);
}

function drawFirefly(p: Pen): void {
  p.fill(PAL.vagalume, 0.3).circle(8, 8, 6);
  p.fill(PAL.vagalume).circle(8, 8, 1.6);
  p.fill(PAL.branco).circle(8, 8, 0.7);
}

function drawStar(p: Pen, color: number): void {
  p.fill(color).poly([5, 0, 6.3, 3.7, 10, 5, 6.3, 6.3, 5, 10, 3.7, 6.3, 0, 5, 3.7, 3.7]);
}

function drawLeafParticle(p: Pen): void {
  p.fill(PAL.musgo).ellipse(4, 2.5, 8, 4.5);
  p.fill(PAL.musgoClaro).ellipse(3, 2, 3, 1.4);
}

function drawDrop(p: Pen): void {
  p.fill(PAL.ceuAgua).ellipse(2, 3, 3.4, 5);
  p.fill(PAL.branco, 0.7).circle(1.5, 2.2, 0.7);
}

function drawWater(p: Pen): void {
  p.fill(PAL.ceuAgua).rect(0, 0, 64, 64);
  p.fill(PAL.branco, 0.25)
    .ellipse(14, 16, 16, 3)
    .ellipse(44, 40, 20, 3)
    .ellipse(30, 56, 12, 2.5)
    .ellipse(54, 10, 10, 2);
}

function drawLily(p: Pen): void {
  p.line(1.2, PAL.musgoFundo, 0.9);
  p.fill(PAL.musgo).ellipse(10, 7, 20, 13, true);
  p.fill(PAL.ceuAgua).tri(10, 7, 20, 3, 20, 9);
  p.fill(PAL.cerejeira).circle(7, 6, 2.6);
  p.fill(PAL.branco).circle(7, 6, 1);
}

function drawBubble(p: Pen): void {
  p.line(1.4, T, OUT);
  p.fill(PAL.branco).rrect(1, 1, 24, 19, 7, true);
  p.fill(PAL.branco).tri(9, 19, 15, 19, 11, 24);
  p.line(1.4, T, OUT).seg(9, 20, 11, 24).seg(11, 24, 15, 20);
}

function drawNeedWater(p: Pen): void {
  p.line(1.4, PAL.perigoSuave, 1);
  p.fill(PAL.branco).circle(7, 7, 6, true);
  p.fill(PAL.ceuAgua).circle(7, 8.4, 2.8);
  p.tri(4.6, 7.4, 9.4, 7.4, 7, 3);
}

function drawHeart(p: Pen): void {
  p.line(1.2, T, OUT);
  p.fill(PAL.cerejeiraViva).circle(3.6, 4, 3.2, true).circle(8.4, 4, 3.2, true);
  p.tri(0.6, 5, 11.4, 5, 6, 11);
  p.fill(PAL.cerejeiraViva).circle(3.6, 4, 2.6).circle(8.4, 4, 2.6);
}

// ---- ícones em caixa 32×32 lógica (reescalados por Pen) ----
function iconCoin(p: Pen): void {
  p.line(2, T, OUT);
  p.fill(PAL.moeda).circle(16, 16, 13, true);
  p.line(1.5, PAL.moedaClara, 1).arc(16, 16, 9, Math.PI * 0.9, Math.PI * 1.6);
  p.line(1.6, T, 0.7);
  p.fill(T, 0.55).rrect(12.5, 12.5, 7, 7, 1.5);
  p.fill(PAL.branco, 0.6).circle(10, 10, 2);
}

function iconLeaf(p: Pen, dark: boolean): void {
  p.line(2, T, OUT);
  p.fill(dark ? PAL.musgoFundo : PAL.musgo).poly(
    [16, 2, 26, 10, 27, 19, 16, 30, 5, 19, 6, 10],
    true,
  );
  p.line(1.4, dark ? PAL.musgo : PAL.musgoClaro, 1).seg(16, 5, 16, 28);
  p.seg(16, 14, 22, 10).seg(16, 14, 10, 10).seg(16, 21, 22, 17).seg(16, 21, 10, 17);
}

function iconSeed(p: Pen, dark: boolean): void {
  p.line(2, T, OUT);
  p.fill(PAL.taipa).rrect(6, 10, 20, 20, 8, true);
  p.fill(PAL.madeira).rrect(10, 6, 12, 6, 3, true);
  p.fill(dark ? PAL.musgoFundo : PAL.musgoClaro).circle(16, 20, 5, true);
}

function iconCuia(p: Pen): void {
  p.line(2, T, OUT);
  p.fill(PAL.madeira).circle(15, 21, 10, true);
  p.fill(PAL.terracota).rrect(6, 10, 18, 5, 2.5, true);
  p.fill(PAL.musgo).ellipse(15, 11.5, 14, 3.5);
  p.line(2.4, T, OUT).seg(17, 12, 24, 2);
  p.line(1.6, PAL.pedra, 1).seg(17, 12, 24, 2);
  p.fill(PAL.moedaClara, 0.8).circle(10, 22, 2);
}

function iconMatcha(p: Pen): void {
  p.line(2, T, OUT);
  p.fill(PAL.taipa).poly([3, 14, 29, 14, 25, 27, 7, 27], true);
  p.fill(PAL.cerejeiraViva).rect(5.5, 19, 21, 2.4);
  p.fill(PAL.musgoClaro).ellipse(16, 14, 26, 6, true);
  p.line(1.2, PAL.musgo, 1).arc(16, 14, 4, 0, Math.PI * 1.5);
  p.line(1.6, PAL.branco, 0.8).seg(11, 9, 12, 4).seg(18, 9, 19, 3);
}

/** Gera todas as texturas do jogo (uma vez, no Boot). */
export function generateTextures(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  const p = new Pen(g, RES);
  const ui = new Pen(g, 1);
  const big = new Pen(g, 3);
  const tiny = new Pen(g, RES * 0.5);

  drawHouse(p);
  p.bake('house', 192, 160);
  drawTeaHouse(p);
  p.bake('teahouse', 256, 192);
  drawCounter(p);
  p.bake('counter', 96, 32);
  drawTorii(p);
  p.bake('torii', 88, 82);
  drawLantern(p);
  p.bake('lantern', 20, 38);
  drawLight(p);
  p.bake('light', 64, 64);
  drawSakura(p);
  p.bake('sakura', 72, 90);
  drawTree(p);
  p.bake('tree', 64, 82);
  drawBush(p);
  p.bake('bush', 32, 24);
  drawFenceH(p);
  p.bake('fenceH', 32, 22);
  drawFenceV(p);
  p.bake('fenceV', 14, 32);
  drawPost(p);
  p.bake('post', 8, 22);
  drawSoil(p, false);
  p.bake('soil', 64, 64);
  drawSoil(p, true);
  p.bake('soilWet', 64, 64);
  for (const s of [1, 2, 3]) {
    drawErva(p, s);
    p.bake(`erva${s}`, 48, 42);
    drawCha(p, s);
    p.bake(`cha${s}`, 48, 42);
  }
  bakeChar(p, 'player', PLAYER_LOOK);
  bakeChar(p, 'npc', NPC_LOOK);
  CUSTOMER_LOOKS.forEach((look, i) => bakeChar(p, `cust${i}`, look));
  drawShadow(p);
  p.bake('shadow', 20, 8);
  drawPetal(p);
  p.bake('petal', 6, 4);
  drawFirefly(p);
  p.bake('firefly', 16, 16);
  drawStar(p, PAL.cerejeira);
  p.bake('star', 10, 10);
  drawStar(ui, PAL.cerejeira);
  ui.bake('starUi', 10, 10);
  drawLeafParticle(p);
  p.bake('leafp', 8, 5);
  drawDrop(p);
  p.bake('drop', 4, 6);
  drawWater(p);
  p.bake('water', 64, 64);
  drawLily(p);
  p.bake('lily', 20, 14);
  drawBubble(p);
  p.bake('bubble', 26, 25);
  drawHeart(p);
  p.bake('heart', 12, 12);
  drawNeedWater(p);
  p.bake('needWater', 14, 14);
  drawStar(p, PAL.moedaClara);
  p.bake('sparkle', 10, 10);

  // Ícones de UI (1×) e de bebida (3× para o mini-jogo, mundo para o balão)
  iconCoin(ui);
  ui.bake('icon_coin', 32, 32);
  iconLeaf(ui, true);
  ui.bake('icon_leaf_erva', 32, 32);
  iconLeaf(ui, false);
  ui.bake('icon_leaf_cha', 32, 32);
  iconSeed(ui, true);
  ui.bake('icon_seed_erva', 32, 32);
  iconSeed(ui, false);
  ui.bake('icon_seed_cha', 32, 32);
  iconCuia(big);
  big.bake('drink_erva', 32, 32);
  iconMatcha(big);
  big.bake('drink_cha', 32, 32);
  iconCuia(tiny);
  tiny.bake('ord_erva', 32, 32);
  iconMatcha(tiny);
  tiny.bake('ord_cha', 32, 32);
  iconCoin(tiny);
  tiny.bake('coinWorld', 32, 32);

  g.destroy();
}
