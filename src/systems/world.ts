import Phaser from 'phaser';
import { DEPTH, RES, TILE, WORLD_H, WORLD_W } from '../config/layout';
import { PAL } from '../style/palette';
import { Pen } from './pen';

/** Layout fixo da vila (coordenadas de mundo em px lógicos; tile = 32). */
export const LAYOUT = {
  playerSpawn: { x: 192, y: 300 },
  house: { x: 192, y: 272 },
  houseLantern: { x: 268, y: 290 },
  road: { y0: 432, y1: 480 },
  housePath: { x0: 176, x1: 208, y0: 262, y1: 440 },
  garden: { x0: 64, x1: 400, y0: 528, y1: 816, gate0: 208, gate1: 272 },
  gardenPath: { x0: 208, x1: 272, y0: 470, y1: 540 },
  plotCols: [136, 232, 328],
  plotRows: [608, 720],
  npc: { x: 600, y: 404 },
  teaHouse: { x: 1000, y: 272 },
  counter: { x: 1000, y: 318 },
  counterPoint: { x: 1000, y: 338 },
  plaza: { x0: 896, x1: 1104, y0: 262, y1: 436 },
  torii: { x: 1000, y: 426 },
  queue: [
    { x: 1070, y: 322 },
    { x: 1104, y: 340 },
    { x: 1138, y: 358 },
  ],
  customerEntry: { x: WORLD_W + 30, y: 458 },
  lake: { x: 980, y: 740, w: 440, h: 250 },
  lanterns: [
    { x: 880, y: 300 },
    { x: 1120, y: 296 },
    { x: 736, y: 650 },
    { x: 1222, y: 770 },
    { x: 268, y: 290 },
    { x: 548, y: 420 },
  ],
  lilies: [
    { x: 900, y: 700 },
    { x: 1052, y: 790 },
    { x: 990, y: 680 },
    { x: 1110, y: 724 },
    { x: 850, y: 780 },
  ],
  sakuras: [
    { x: 664, y: 392 },
    { x: 480, y: 250 },
    { x: 770, y: 226 },
    { x: 640, y: 660 },
    { x: 1226, y: 560 },
    { x: 560, y: 880 },
    { x: 60, y: 420 },
    { x: 420, y: 370 },
  ],
  trees: [
    { x: 40, y: 80 },
    { x: 120, y: 64 },
    { x: 330, y: 74 },
    { x: 420, y: 60 },
    { x: 560, y: 84 },
    { x: 640, y: 62 },
    { x: 1240, y: 70 },
    { x: 1180, y: 110 },
    { x: 28, y: 300 },
    { x: 26, y: 880 },
    { x: 70, y: 950 },
    { x: 170, y: 958 },
    { x: 270, y: 946 },
    { x: 370, y: 958 },
    { x: 460, y: 950 },
    { x: 700, y: 952 },
    { x: 1250, y: 950 },
    { x: 1254, y: 220 },
    { x: 1254, y: 370 },
    { x: 1254, y: 660 },
    { x: 760, y: 120 },
  ],
  bushes: [
    { x: 432, y: 560 },
    { x: 432, y: 780 },
    { x: 40, y: 600 },
    { x: 820, y: 418 },
    { x: 1160, y: 418 },
    { x: 300, y: 418 },
    { x: 510, y: 600 },
    { x: 860, y: 900 },
  ],
} as const;

export interface World {
  solids: Phaser.Physics.Arcade.StaticGroup;
  water: Phaser.GameObjects.TileSprite;
  lanternLights: Phaser.GameObjects.Image[];
  plotSprites: Phaser.GameObjects.Image[];
  plotCenters: Array<{ x: number; y: number }>;
}

/** Imagem de mundo com textura em alta resolução e origem nos pés. */
export function worldImage(
  scene: Phaser.Scene,
  x: number,
  y: number,
  key: string,
  originY = 1,
): Phaser.GameObjects.Image {
  const img = scene.add
    .image(x, y, key)
    .setOrigin(0.5, originY)
    .setScale(1 / RES);
  img.setDepth(y);
  return img;
}

function solid(
  group: Phaser.Physics.Arcade.StaticGroup,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const z = group.scene.add.zone(x + w / 2, y + h / 2, w, h);
  group.add(z);
}

function drawGround(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  const p = new Pen(g, RES);
  const rnd = new Phaser.Math.RandomDataGenerator(['erva-e-sakura']);
  p.fill(PAL.musgoClaro).rect(0, 0, WORLD_W, WORLD_H);
  // manchas suaves de grama escura
  for (let i = 0; i < 40; i++) {
    p.fill(PAL.musgo, 0.12).ellipse(rnd.between(0, WORLD_W), rnd.between(0, WORLD_H), 140, 70);
  }
  // tufos em "v"
  p.line(1.4, PAL.musgo, 0.9);
  for (let ty = 0; ty < WORLD_H / TILE; ty++) {
    for (let tx = 0; tx < WORLD_W / TILE; tx++) {
      const n = rnd.between(2, 4);
      for (let k = 0; k < n; k++) {
        const x = tx * TILE + rnd.between(3, 29);
        const y = ty * TILE + rnd.between(4, 29);
        p.seg(x - 2.5, y - 3, x, y).seg(x, y, x + 2.5, y - 3);
      }
    }
  }
  // florzinhas
  for (let i = 0; i < 90; i++) {
    const c = rnd.pick([PAL.cerejeira, PAL.branco, PAL.moedaClara]);
    p.fill(c, 0.9).circle(rnd.between(0, WORLD_W), rnd.between(0, WORLD_H), 1.8);
  }
  // caminhos de terra (taipa)
  const path = (x0: number, y0: number, x1: number, y1: number) => {
    p.fill(PAL.musgo, 0.35).rrect(x0 - 3, y0 - 3, x1 - x0 + 6, y1 - y0 + 6, 14);
    p.fill(PAL.taipa).rrect(x0, y0, x1 - x0, y1 - y0, 12);
  };
  const L = LAYOUT;
  path(-20, L.road.y0, WORLD_W + 20, L.road.y1);
  path(L.housePath.x0, L.housePath.y0, L.housePath.x1, L.housePath.y1);
  path(L.gardenPath.x0, L.gardenPath.y0, L.gardenPath.x1, L.gardenPath.y1);
  path(L.npc.x - 70, L.npc.y - 46, L.npc.x + 50, L.road.y0 + 10);
  // pedrinhas
  for (let i = 0; i < 160; i++) {
    const x = rnd.between(0, WORLD_W);
    const y = rnd.between(L.road.y0 + 6, L.road.y1 - 6);
    p.fill(PAL.taipaSombra).ellipse(x, y, rnd.between(3, 6), rnd.between(2, 4));
  }
  // praça de tijolos da casa de chá
  const pz = L.plaza;
  p.fill(PAL.musgo, 0.35).rrect(pz.x0 - 3, pz.y0 - 3, pz.x1 - pz.x0 + 6, pz.y1 - pz.y0 + 6, 16);
  p.fill(PAL.taipa).rrect(pz.x0, pz.y0, pz.x1 - pz.x0, pz.y1 - pz.y0, 14);
  for (let y = pz.y0 + 6; y < pz.y1 - 10; y += 12) {
    const off = ((y - pz.y0) / 12) % 2 === 0 ? 0 : 12;
    for (let x = pz.x0 + 6 + off; x < pz.x1 - 24; x += 24) {
      p.fill(PAL.terracota, 0.55).rrect(x, y, 21, 9, 2);
    }
  }
  // interior da horta
  const gd = L.garden;
  p.fill(PAL.musgo, 0.28).rrect(gd.x0 + 6, gd.y0 + 8, gd.x1 - gd.x0 - 12, gd.y1 - gd.y0 - 12, 10);
  // margem do lago
  const lk = L.lake;
  p.fill(PAL.musgoFundo, 0.35).ellipse(lk.x, lk.y + 4, lk.w + 40, lk.h + 36);
  p.fill(PAL.taipa).ellipse(lk.x, lk.y, lk.w + 28, lk.h + 26);
  p.fill(PAL.taipaSombra).ellipse(lk.x, lk.y + 4, lk.w + 6, lk.h + 6);
  g.generateTexture('ground', WORLD_W * RES, WORLD_H * RES);
  g.destroy();
}

function buildFences(scene: Phaser.Scene, solids: Phaser.Physics.Arcade.StaticGroup): void {
  const gd = LAYOUT.garden;
  const hLine = (y: number, x0: number, x1: number) => {
    for (let x = x0; x < x1; x += TILE) {
      worldImage(scene, x + 16, y + 11, 'fenceH');
    }
    worldImage(scene, x1 + 1, y + 11, 'post');
    solid(solids, x0, y + 2, x1 - x0 + 4, 10);
  };
  hLine(gd.y0, gd.x0, gd.gate0);
  hLine(gd.y0, gd.gate1, gd.x1);
  hLine(gd.y1, gd.x0, gd.x1);
  for (const x of [gd.x0, gd.x1]) {
    for (let y = gd.y0 + 10; y < gd.y1; y += TILE) {
      worldImage(scene, x + 4, y + 32, 'fenceV');
    }
    solid(solids, x - 3, gd.y0, 12, gd.y1 - gd.y0 + 10);
  }
}

export function buildWorld(scene: Phaser.Scene): World {
  drawGround(scene);
  scene.add
    .image(0, 0, 'ground')
    .setOrigin(0)
    .setScale(1 / RES)
    .setDepth(DEPTH.ground);
  const solids = scene.physics.add.staticGroup();
  const L = LAYOUT;

  // Lago (água animada com máscara elíptica)
  const lk = L.lake;
  const water = scene.add
    .tileSprite(lk.x, lk.y, (lk.w + 8) * RES, (lk.h + 8) * RES, 'water')
    .setScale(1 / RES)
    .setDepth(DEPTH.water);
  const mg = scene.make.graphics({}, false);
  mg.fillStyle(0xffffff).fillEllipse(lk.x, lk.y, lk.w, lk.h, 40);
  water.setMask(mg.createGeometryMask());
  for (const l of L.lilies) worldImage(scene, l.x, l.y, 'lily', 0.5).setDepth(DEPTH.water + 1);
  // colisão do lago em faixas horizontais
  const strips = 10;
  for (let i = 0; i < strips; i++) {
    const y0 = lk.y - lk.h / 2 + (i * lk.h) / strips;
    const yc = y0 + lk.h / strips / 2;
    const dy = (yc - lk.y) / (lk.h / 2);
    const half = (lk.w / 2) * Math.sqrt(Math.max(0, 1 - dy * dy)) - 6;
    solid(solids, lk.x - half, y0, half * 2, lk.h / strips);
  }

  // Casa missioneira do jogador
  worldImage(scene, L.house.x, L.house.y, 'house');
  solid(solids, L.house.x - 86, L.house.y - 84, 172, 78);

  // Casa de chá + balcão + torii
  worldImage(scene, L.teaHouse.x, L.teaHouse.y, 'teahouse');
  solid(solids, L.teaHouse.x - 112, L.teaHouse.y - 92, 224, 86);
  worldImage(scene, L.counter.x, L.counter.y, 'counter');
  solid(solids, L.counter.x - 48, L.counter.y - 22, 96, 18);
  worldImage(scene, L.torii.x, L.torii.y, 'torii');
  solid(solids, L.torii.x - 31, L.torii.y - 10, 12, 8);
  solid(solids, L.torii.x + 21, L.torii.y - 10, 12, 8);

  // Horta
  buildFences(scene, solids);
  const plotSprites: Phaser.GameObjects.Image[] = [];
  const plotCenters: Array<{ x: number; y: number }> = [];
  for (const y of L.plotRows) {
    for (const x of L.plotCols) {
      plotCenters.push({ x, y });
      plotSprites.push(worldImage(scene, x, y, 'soil', 0.5).setDepth(DEPTH.plot));
    }
  }

  // Vegetação
  for (const t of L.trees) {
    worldImage(scene, t.x, t.y, 'tree');
    solid(solids, t.x - 8, t.y - 12, 16, 8);
  }
  for (const t of L.sakuras) {
    worldImage(scene, t.x, t.y, 'sakura');
    solid(solids, t.x - 8, t.y - 12, 16, 8);
  }
  for (const b of L.bushes) {
    worldImage(scene, b.x, b.y, 'bush');
    solid(solids, b.x - 12, b.y - 10, 24, 8);
  }

  // Lanternas de pedra (luz ADD acesa à noite, acima do overlay)
  const lanternLights: Phaser.GameObjects.Image[] = [];
  for (const l of L.lanterns) {
    worldImage(scene, l.x, l.y, 'lantern');
    solid(solids, l.x - 7, l.y - 8, 14, 7);
    const light = scene.add
      .image(l.x, l.y - 22, 'light')
      .setScale(1.5 / RES)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(PAL.lanterna)
      .setAlpha(0)
      .setDepth(DEPTH.glow);
    lanternLights.push(light);
  }

  solids.refresh();
  return { solids, water, lanternLights, plotSprites, plotCenters };
}
