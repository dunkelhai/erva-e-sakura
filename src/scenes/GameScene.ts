import Phaser from 'phaser';
import { BALANCE, GAME_MIN_PER_SEC } from '../config/balance';
import { DEBUG } from '../config/debug';
import { DEPTH, RES, WORLD_H, WORLD_W, ZOOM } from '../config/layout';
import { NPC_LINES, NPC_NAME } from '../content/dialogue';
import { Customer } from '../entities/Customer';
import { type MoveKeys, Player } from '../entities/Player';
import { Walker } from '../entities/Walker';
import { sfx } from '../systems/audio';
import { bus, EV } from '../systems/bus';
import { tintAt } from '../systems/clock';
import { type Crop, CROP_LABEL, isRipe, newDayPlot, plotAction, tickPlot } from '../systems/farm';
import { hitFlash, pop, shakeLight } from '../systems/juice';
import { GameState } from '../systems/state';
import { buildWorld, LAYOUT, type World, worldImage } from '../systems/world';
import { CSS, FONT_UI, PAL } from '../style/palette';
import type { UIScene } from './UIScene';

type Mode = 'play' | 'busy' | 'ended';

interface Target {
  kind: 'plot' | 'npc' | 'counter';
  index: number;
  x: number;
  y: number;
}

interface PlotView {
  crop: Phaser.GameObjects.Image;
  need: Phaser.GameObjects.Image;
  ripe: Phaser.GameObjects.Image;
  shownKey: string;
}

export class GameScene extends Phaser.Scene {
  state!: GameState;
  private world!: World;
  private player!: Player;
  private ui!: UIScene;
  private mode: Mode = 'busy';
  private keys!: MoveKeys;
  private pendingAction = false;
  private pendingAlt = false;
  private inputLockUntil = 0;
  private overlay!: Phaser.GameObjects.Rectangle;
  private overlayColor = -1;
  private petals!: Phaser.GameObjects.Particles.ParticleEmitter;
  private fireflies!: Phaser.GameObjects.Particles.ParticleEmitter;
  private stars!: Phaser.GameObjects.Particles.ParticleEmitter;
  private leafBurst!: Phaser.GameObjects.Particles.ParticleEmitter;
  private drops!: Phaser.GameObjects.Particles.ParticleEmitter;
  private plotViews: PlotView[] = [];
  private npc!: Walker;
  private npcBubble!: Phaser.GameObjects.Text;
  private prompt!: Phaser.GameObjects.Text;
  private target: Target | null = null;
  private queue: Customer[] = [];
  private leaving: Customer[] = [];
  private nextSpawnMin: number = BALANCE.CUSTOMER_FIRST_MIN;

  constructor() {
    super('Game');
  }

  create(): void {
    bus.removeAllListeners();
    this.mode = 'busy';
    this.pendingAction = false;
    this.pendingAlt = false;
    this.queue = [];
    this.leaving = [];
    this.plotViews = [];
    this.target = null;
    this.overlayColor = -1;
    this.nextSpawnMin = BALANCE.CUSTOMER_FIRST_MIN;

    this.world = buildWorld(this);
    this.state = new GameState(this.world.plotCenters.length);
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    // NPC
    this.npc = new Walker(this, 'npc', LAYOUT.npc.x, LAYOUT.npc.y);
    this.npc.place(LAYOUT.npc.x, LAYOUT.npc.y, false, 0);
    this.tweens.add({
      targets: this.npc.sprite,
      scaleY: 1.03 / RES,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    const npcZone = this.add.zone(LAYOUT.npc.x, LAYOUT.npc.y - 5, 18, 10);
    this.world.solids.add(npcZone);
    this.world.solids.refresh();
    this.npcBubble = this.worldText(LAYOUT.npc.x, LAYOUT.npc.y - 44, '!', 16, CSS.cerejeiraViva);
    this.tweens.add({ targets: this.npcBubble, y: '-=4', duration: 600, yoyo: true, repeat: -1 });

    // Canteiros
    this.world.plotCenters.forEach((c) => {
      const crop = worldImage(this, c.x, c.y + 18, 'erva1').setVisible(false);
      crop.setDepth(c.y + 18);
      const need = worldImage(this, c.x + 22, c.y - 18, 'needWater', 0.5)
        .setDepth(DEPTH.worldUi)
        .setVisible(false);
      this.tweens.add({ targets: need, y: c.y - 22, duration: 500, yoyo: true, repeat: -1 });
      const ripe = worldImage(this, c.x + 16, c.y - 20, 'sparkle', 0.5)
        .setScale(1.6 / RES)
        .setDepth(DEPTH.worldUi)
        .setVisible(false);
      this.tweens.add({
        targets: ripe,
        alpha: 0.3,
        angle: 45,
        duration: 700,
        yoyo: true,
        repeat: -1,
      });
      this.plotViews.push({ crop, need, ripe, shownKey: '' });
    });

    // Jogador
    this.player = new Player(this, LAYOUT.playerSpawn.x, LAYOUT.playerSpawn.y);
    this.physics.add.collider(this.player.body, this.world.solids);

    // Câmera
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    cam.setZoom(ZOOM);
    cam.setRoundPixels(true);
    cam.startFollow(this.player.body, true, 0.12, 0.12);
    cam.setBackgroundColor(PAL.musgoClaro);
    if (this.renderer.type === Phaser.WEBGL) cam.postFX.addVignette(0.5, 0.5, 0.88, 0.2);
    cam.fadeIn(250);

    // Overlay dia/noite (MULTIPLY), acima do mundo e abaixo das luzes
    this.overlay = this.add
      .rectangle(640, 360, 1280, 720, PAL.tintManha)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setDepth(DEPTH.overlay);

    this.createParticles();

    this.prompt = this.worldText(0, 0, 'Z', 14, CSS.branco).setVisible(false);
    this.tweens.add({ targets: this.prompt, scale: 1.12, duration: 420, yoyo: true, repeat: -1 });

    this.createInput();

    bus.once('ui-ready', () => {
      this.ui.showBanner('Dia 1', 'Primavera na vila', 1500, () => {
        if (this.mode === 'ended') return;
        this.backToPlay();
        this.ui.toast('Dica: converse com Dona Kiyoe na praça (Z)');
      });
      sfx.day();
    });
    this.scene.launch('UI', { state: this.state });
    this.ui = this.scene.get('UI') as UIScene;
  }

  private worldText(x: number, y: number, s: string, size: number, color: string) {
    return this.add
      .text(x, y, s, { fontFamily: FONT_UI, fontSize: `${size}px`, color, fontStyle: '700' })
      .setOrigin(0.5)
      .setStroke(CSS.tinta, 4)
      .setResolution(3)
      .setDepth(DEPTH.worldUi + 5);
  }

  private createParticles(): void {
    const inv = 1 / RES;
    this.petals = this.add.particles(0, 0, 'petal', {
      emitZone: {
        type: 'random',
        source: new Phaser.Geom.Rectangle(-60, -40, WORLD_W, WORLD_H),
        quantity: 1,
      } as Phaser.Types.GameObjects.Particles.EmitZoneData,
      lifespan: { min: 4000, max: 7000 },
      speedY: { min: 20, max: 40 },
      speedX: { min: 10, max: 30 },
      rotate: {
        onEmit: () => Phaser.Math.Between(0, 360),
        onUpdate: (_p: Phaser.GameObjects.Particles.Particle, _k: string, _t: number, v: number) =>
          v + 1.5,
      },
      accelerationX: {
        onEmit: () => 0,
        onUpdate: (p: Phaser.GameObjects.Particles.Particle, _k: string, t: number) =>
          Math.sin(t * 10 + p.life * 0.01) * 18,
      },
      scale: inv,
      alpha: { start: 1, end: 0, ease: 'Quad.easeIn' },
      frequency: 150,
      maxAliveParticles: 40,
    });
    this.petals.setDepth(DEPTH.overlay - 1);

    this.fireflies = this.add.particles(0, 0, 'firefly', {
      emitZone: {
        type: 'random',
        source: new Phaser.Geom.Rectangle(0, 0, WORLD_W, WORLD_H),
        quantity: 1,
      } as Phaser.Types.GameObjects.Particles.EmitZoneData,
      lifespan: { min: 3500, max: 6000 },
      speed: { min: 4, max: 16 },
      angle: { min: 0, max: 360 },
      scale: inv * 1.2,
      alpha: {
        onEmit: () => 0.2,
        onUpdate: (p: Phaser.GameObjects.Particles.Particle, _k: string, t: number) =>
          0.2 + 0.8 * Math.abs(Math.sin(t * (p.life / 900) * Math.PI)),
      },
      accelerationX: {
        onEmit: () => 0,
        onUpdate: (p: Phaser.GameObjects.Particles.Particle, _k: string, t: number) =>
          Math.cos(t * 8 + p.life) * 10,
      },
      blendMode: Phaser.BlendModes.ADD,
      frequency: 120,
      maxAliveParticles: 30,
      emitting: false,
    });
    this.fireflies.setDepth(DEPTH.glow);

    const burst = (key: string, extra: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig) =>
      this.add.particles(0, 0, key, {
        emitting: false,
        speed: { min: 60, max: 140 },
        lifespan: { min: 250, max: 450 },
        angle: { min: 0, max: 360 },
        scale: { start: inv * 1.4, end: 0 },
        ...extra,
      });
    this.stars = burst('star', {});
    this.stars.setDepth(DEPTH.worldUi + 2);
    this.leafBurst = burst('leafp', {
      gravityY: 160,
      rotate: { min: 0, max: 360 },
      lifespan: { min: 350, max: 600 },
    });
    this.leafBurst.setDepth(DEPTH.worldUi + 1);
    this.drops = burst('drop', {
      speed: { min: 40, max: 90 },
      angle: { min: 200, max: 340 },
      gravityY: 300,
      scale: { start: inv * 1.6, end: inv * 0.6 },
    });
    this.drops.setDepth(DEPTH.worldUi + 1);
  }

  private createInput(): void {
    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    const k = (code: number) => kb.addKey(code);
    this.keys = {
      up: [k(K.UP), k(K.W)],
      down: [k(K.DOWN), k(K.S)],
      left: [k(K.LEFT), k(K.A)],
      right: [k(K.RIGHT), k(K.D)],
    };
    kb.addCapture('SPACE,SHIFT,UP,DOWN,LEFT,RIGHT');
    // Eventos (e não JustDown) para não perder toques rápidos.
    kb.on('keydown', (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'KeyZ' || e.code === 'Space') this.pendingAction = true;
      if (e.code === 'KeyX' || e.code === 'ShiftLeft' || e.code === 'ShiftRight')
        this.pendingAlt = true;
    });
    if (DEBUG) {
      kb.addCapture('F1,F2,F3,F4,F5');
      kb.on('keydown-F1', () => this.debugEnd(true));
      kb.on('keydown-F2', () => this.debugEnd(false));
      kb.on('keydown-F3', () => {
        if (this.mode === 'play') {
          this.advanceTime(BALANCE.DEBUG_SKIP_MIN);
          this.ui.toast('[debug] +1 hora');
        }
      });
      kb.on('keydown-F4', () => {
        if (this.mode !== 'ended')
          this.addCoins(BALANCE.DEBUG_COINS, this.player.x, this.player.y - 30);
      });
    }
  }

  private debugEnd(victory: boolean): void {
    if (this.mode === 'ended') return;
    if (victory) this.state.won = true;
    this.endGame(victory);
  }

  // ------------------------------------------------------------- loop
  update(time: number, rawDelta: number): void {
    const delta = Math.min(rawDelta, 50);
    const pressedAction = this.pendingAction;
    const pressedAlt = this.pendingAlt;
    this.pendingAction = false;
    this.pendingAlt = false;
    const canAct = this.mode === 'play' && time >= this.inputLockUntil;

    this.world.water.tilePositionX += 0.012 * delta * RES;

    if (this.mode === 'play') {
      this.player.update(this.keys, delta);
      this.advanceTime((delta / 1000) * GAME_MIN_PER_SEC);
    } else {
      this.player.stop();
    }

    for (const c of this.queue) c.update(delta);
    for (const c of this.leaving) c.update(delta);
    this.leaving = this.leaving.filter((c) => c.state !== 'gone');

    this.updateAmbience(time);
    this.updatePlotViews();
    this.updateTarget();

    if (canAct && pressedAlt) this.toggleSeed();
    if (canAct && pressedAction && this.target) this.interact(this.target);
  }

  // ------------------------------------------------------------- tempo
  advanceTime(dm: number): void {
    const s = this.state;
    while (dm > 0 && this.mode !== 'ended') {
      const step = Math.min(dm, BALANCE.DAY_END_MIN - s.clock.minutes);
      dm -= step;
      for (const p of s.plots) tickPlot(p, step);
      for (const c of this.queue) {
        if (c.state === 'waiting') {
          c.waited += step;
          if (c.waited >= BALANCE.CUSTOMER_PATIENCE_MIN) {
            this.customerLeaves(c, false);
            s.missed += 1;
            this.ui.toast('Um freguês cansou de esperar e foi embora...');
          }
        }
      }
      s.clock.minutes += step;
      while (
        s.clock.minutes >= this.nextSpawnMin &&
        this.nextSpawnMin <= BALANCE.CUSTOMER_LAST_MIN
      ) {
        this.spawnCustomer();
        this.nextSpawnMin += BALANCE.CUSTOMER_INTERVAL_MIN;
      }
      if (s.clock.minutes >= BALANCE.DAY_END_MIN) {
        this.endOfDay();
        return;
      }
    }
  }

  private endOfDay(): void {
    const s = this.state;
    s.clock.minutes = BALANCE.DAY_END_MIN;
    if (s.won) return;
    if (s.clock.day >= BALANCE.TOTAL_DAYS) {
      this.endGame(false);
      return;
    }
    this.mode = 'busy';
    const cam = this.cameras.main;
    cam.fadeOut(400, 0, 0, 0);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      s.clock.day += 1;
      s.clock.minutes = BALANCE.DAY_START_MIN;
      this.nextSpawnMin = BALANCE.CUSTOMER_FIRST_MIN;
      for (const p of s.plots) newDayPlot(p);
      for (const c of [...this.queue, ...this.leaving]) c.destroy();
      this.queue = [];
      this.leaving = [];
      this.ui.setQueueCount(0);
      this.player.body.setPosition(LAYOUT.playerSpawn.x, LAYOUT.playerSpawn.y - 4);
      this.player.arcade.reset(LAYOUT.playerSpawn.x, LAYOUT.playerSpawn.y - 4);
      this.player.facing.set(0, 1);
      this.player.walker.dir = 'down';
      this.npcBubble.setVisible(true);
      this.updateAmbience(this.time.now);
      cam.fadeIn(400);
      sfx.day();
      const left = BALANCE.GOAL_COINS - s.coins;
      const sub =
        s.clock.day === BALANCE.TOTAL_DAYS
          ? `Último dia! Faltam ${left} moedas`
          : `Os canteiros secaram. Faltam ${left} moedas`;
      this.ui.showBanner(`Dia ${s.clock.day}`, sub, 1600, () => this.backToPlay());
    });
  }

  // ---------------------------------------------------------- ambiente
  private updateAmbience(time: number): void {
    const hour = this.state.clock.hour;
    const color = tintAt(hour);
    if (color !== this.overlayColor) {
      this.overlayColor = color;
      this.overlay.fillColor = color;
    }
    const night = Phaser.Math.Clamp((hour - 18.5) / 1.25, 0, 1);
    this.world.lanternLights.forEach((l, i) => {
      l.setAlpha(night * (0.55 + 0.08 * Math.sin(time / 130 + i * 1.7)));
    });
    const wantFireflies = night > 0.6;
    if (wantFireflies !== this.fireflies.emitting) {
      if (wantFireflies) this.fireflies.start();
      else this.fireflies.stop();
    }
    const wantPetals = hour < 18.75;
    if (wantPetals !== this.petals.emitting) {
      if (wantPetals) this.petals.start();
      else this.petals.stop();
    }
  }

  // ------------------------------------------------------------ horta
  private updatePlotViews(): void {
    this.state.plots.forEach((p, i) => {
      const v = this.plotViews[i];
      const key = `${p.crop}-${p.stage}-${p.watered}`;
      if (key === v.shownKey) return;
      v.shownKey = key;
      this.world.plotSprites[i].setTexture(p.watered ? 'soilWet' : 'soil');
      if (p.crop) {
        v.crop.setTexture(`${p.crop}${p.stage}`).setVisible(true);
        if (!p.watered && !isRipe(p)) v.crop.setTint(PAL.plantaSeca);
        else v.crop.clearTint();
      } else {
        v.crop.setVisible(false);
      }
      v.need.setVisible(p.crop !== null && !p.watered && !isRipe(p));
      v.ripe.setVisible(isRipe(p));
    });
  }

  private toggleSeed(): void {
    const s = this.state;
    s.selectedSeed = s.selectedSeed === 'erva' ? 'cha' : 'erva';
    sfx.select();
    bus.emit(EV.INVENTORY, [`seed_${s.selectedSeed}`]);
    this.ui.toast(`Semente: ${CROP_LABEL[s.selectedSeed]}`);
  }

  private interactPlot(i: number): void {
    const s = this.state;
    const p = s.plots[i];
    const c = this.world.plotCenters[i];
    const v = this.plotViews[i];
    const sel = s.selectedSeed;
    switch (plotAction(p, s.seeds[sel])) {
      case 'plant':
        s.seeds[sel] -= 1;
        p.crop = sel;
        p.stage = 1;
        p.growth = 0;
        sfx.plant();
        this.leafBurst.explode(6, c.x, c.y + 6);
        this.updatePlotViews();
        v.crop.setScale(0);
        this.tweens.add({ targets: v.crop, scale: 1 / RES, duration: 260, ease: 'Back.easeOut' });
        bus.emit(EV.INVENTORY, [`seed_${sel}`]);
        break;
      case 'water':
        p.watered = true;
        sfx.water();
        this.drops.explode(12, c.x, c.y - 4);
        pop(this, this.world.plotSprites[i], 1 / RES);
        break;
      case 'harvest': {
        const crop = p.crop as Crop;
        s.leaves[crop] += BALANCE.HARVEST_LEAVES;
        s.seeds[crop] += BALANCE.HARVEST_SEEDS_BACK;
        s.harvests += 1;
        p.crop = null;
        p.stage = 0;
        p.growth = 0;
        sfx.harvest();
        shakeLight(this.cameras.main);
        this.leafBurst.explode(14, c.x, c.y);
        this.stars.explode(8, c.x, c.y - 6);
        this.floatText(c.x, c.y - 20, `+${BALANCE.HARVEST_LEAVES} folhas`, CSS.branco);
        // tween de escala ao colher (o sprite volta escondido ao fim)
        const ghost = worldImage(this, c.x, c.y + 18, `${crop}3`).setDepth(c.y + 19);
        hitFlash(this, ghost);
        this.tweens.add({
          targets: ghost,
          scale: 1.35 / RES,
          y: c.y + 6,
          alpha: 0,
          duration: 380,
          ease: 'Back.easeIn',
          onComplete: () => ghost.destroy(),
        });
        bus.emit(EV.INVENTORY, [`leaf_${crop}`, `seed_${crop}`]);
        break;
      }
      case 'wait':
        this.ui.toast(`Já regado hoje. Crescendo... (estágio ${p.stage}/3)`);
        break;
      case 'noseed':
        sfx.wrong();
        this.ui.toast(`Sem sementes de ${CROP_LABEL[sel]}. X/Shift troca a semente.`);
        break;
    }
  }

  // ------------------------------------------------------ interação
  private updateTarget(): void {
    if (this.mode !== 'play') {
      this.prompt.setVisible(false);
      this.target = null;
      if (this.mode === 'ended') bus.emit(EV.HINT, '');
      return;
    }
    const rp = this.player.reachPoint;
    let best: Target | null = null;
    let bestD = Infinity;
    const consider = (t: Target, radius: number = BALANCE.INTERACT_RADIUS) => {
      const d = Phaser.Math.Distance.Between(rp.x, rp.y, t.x, t.y);
      if (d < bestD && d < radius) {
        bestD = d;
        best = t;
      }
    };
    this.world.plotCenters.forEach((c, i) => consider({ kind: 'plot', index: i, x: c.x, y: c.y }));
    consider({ kind: 'npc', index: 0, x: LAYOUT.npc.x, y: LAYOUT.npc.y - 8 });
    consider(
      { kind: 'counter', index: 0, x: LAYOUT.counterPoint.x, y: LAYOUT.counterPoint.y },
      BALANCE.INTERACT_RADIUS + 8,
    );
    this.target = best;
    const t = this.target as Target | null;
    if (!t) {
      this.prompt.setVisible(false);
      bus.emit(
        EV.HINT,
        `Setas/WASD andar · Z/Espaço agir · X/Shift semente: ${CROP_LABEL[this.state.selectedSeed]} · Esc pausa`,
      );
      return;
    }
    const py = t.kind === 'plot' ? t.y - 34 : t.kind === 'npc' ? t.y - 50 : t.y - 52;
    this.prompt.setPosition(t.x, py).setVisible(true);
    bus.emit(EV.HINT, this.hintFor(t));
  }

  private hintFor(t: Target): string {
    const s = this.state;
    if (t.kind === 'npc') return `Z: conversar com ${NPC_NAME}`;
    if (t.kind === 'counter') {
      return this.queue.some((c) => c.state === 'waiting')
        ? 'Z: atender freguês'
        : 'Balcão da casa de chá — nenhum freguês esperando';
    }
    const p = s.plots[t.index];
    const sel = s.selectedSeed;
    switch (plotAction(p, s.seeds[sel])) {
      case 'plant':
        return `Z: plantar ${CROP_LABEL[sel]} · X/Shift: trocar semente`;
      case 'noseed':
        return `Sem sementes de ${CROP_LABEL[sel]} · X/Shift: trocar semente`;
      case 'water':
        return `Z: regar ${CROP_LABEL[p.crop as Crop]}`;
      case 'harvest':
        return `Z: colher ${CROP_LABEL[p.crop as Crop]}`;
      default:
        return `${CROP_LABEL[p.crop as Crop]} regada — crescendo (${p.stage}/3)`;
    }
  }

  private interact(t: Target): void {
    if (t.kind === 'plot') this.interactPlot(t.index);
    else if (t.kind === 'npc') this.talkNpc();
    else this.serveCounter();
  }

  private backToPlay(): void {
    if (this.mode === 'ended') return;
    this.mode = 'play';
    this.inputLockUntil = this.time.now + 180;
  }

  private talkNpc(): void {
    const day = this.state.clock.day;
    this.mode = 'busy';
    this.npc.dir = 'down';
    this.ui.openDialog(NPC_NAME, NPC_LINES[Math.min(day, NPC_LINES.length) - 1], () => {
      this.npcBubble.setVisible(false);
      this.backToPlay();
    });
    pop(this, this.npc.sprite, 1 / RES);
  }

  // -------------------------------------------------------- casa de chá
  private spawnCustomer(): void {
    if (this.queue.length >= BALANCE.CUSTOMER_MAX_QUEUE) return;
    const order: Crop = Math.random() < 0.5 ? 'erva' : 'cha';
    const c = new Customer(this, order, Phaser.Math.Between(0, 2), LAYOUT.customerEntry);
    this.queue.push(c);
    const spot = LAYOUT.queue[this.queue.length - 1];
    c.walkTo([{ x: 1180, y: 458 }, spot], () => this.arrived(c));
  }

  private customerLeaves(c: Customer, happy: boolean): void {
    this.queue = this.queue.filter((q) => q !== c);
    c.state = 'leaving';
    c.setOrderVisible(false);
    if (happy) {
      const heart = worldImage(this, c.x, c.y - 40, 'heart', 0.5).setDepth(DEPTH.worldUi + 3);
      this.tweens.add({
        targets: heart,
        y: c.y - 70,
        alpha: 0,
        duration: 900,
        ease: 'Cubic.easeOut',
        onComplete: () => heart.destroy(),
      });
    }
    c.walkTo([{ x: 1180, y: 458 }, LAYOUT.customerEntry], () => c.destroy());
    this.leaving.push(c);
    // reorganiza a fila
    this.queue.forEach((q, i) => {
      const spot = LAYOUT.queue[i];
      if (q.state === 'waiting') q.walkTo([spot]);
      else if (q.state === 'arriving') q.walkTo([spot], () => this.arrived(q));
    });
    this.ui.setQueueCount(this.queue.filter((q) => q.state === 'waiting').length);
  }

  private arrived(c: Customer): void {
    if (c.state !== 'arriving') return;
    c.state = 'waiting';
    c.setOrderVisible(true);
    c.bubble.setScale(0);
    this.tweens.add({ targets: c.bubble, scale: 1 / RES, duration: 260, ease: 'Back.easeOut' });
    sfx.bell();
    this.ui.toast('Um freguês chegou na casa de chá!');
    this.ui.setQueueCount(this.queue.filter((q) => q.state === 'waiting').length);
  }

  private serveCounter(): void {
    const s = this.state;
    const c = this.queue.find((q) => q.state === 'waiting');
    if (!c) {
      this.ui.toast(
        this.queue.length > 0 ? 'O freguês ainda está chegando...' : 'Nenhum freguês por enquanto.',
      );
      return;
    }
    if (s.leaves.erva + s.leaves.cha === 0) {
      sfx.wrong();
      this.ui.toast('Sem folhas para servir! Colha na horta primeiro.');
      return;
    }
    this.mode = 'busy';
    c.state = 'serving';
    c.setOrderVisible(true);
    this.ui.openServe(c.order, s.leaves, (choice, frac) => this.serveResult(c, choice, frac));
  }

  private serveResult(c: Customer, choice: Crop | null, frac: number): void {
    const s = this.state;
    if (choice === null) {
      s.missed += 1;
      sfx.wrong();
      this.ui.toast('O freguês foi embora sem a bebida...');
      this.customerLeaves(c, false);
    } else if (choice === c.order) {
      s.leaves[choice] -= 1;
      s.served += 1;
      const reward = GameState.serveReward(frac);
      this.stars.explode(12, c.x, c.y - 30);
      this.floatText(c.x, c.y - 48, `+${reward}`, CSS.moeda);
      this.ui.toast(frac > 0.6 ? 'Que rapidez! Freguês encantado.' : 'Freguês satisfeito!');
      this.customerLeaves(c, true);
      bus.emit(EV.INVENTORY, [`leaf_${choice}`]);
      this.addCoins(reward, c.x, c.y - 30);
    } else {
      s.leaves[choice] -= 1;
      s.missed += 1;
      sfx.wrong();
      shakeLight(this.cameras.main);
      hitFlash(this, c.walker.sprite);
      this.ui.toast('Ih... não era isso que o freguês pediu.');
      this.customerLeaves(c, false);
      bus.emit(EV.INVENTORY, [`leaf_${choice}`]);
    }
    this.backToPlay();
  }

  private addCoins(amount: number, x: number, y: number): void {
    const s = this.state;
    s.coins += amount;
    bus.emit(EV.COINS_EARNED, { amount, x, y });
    if (!s.won && s.coins >= BALANCE.GOAL_COINS) {
      s.won = true;
      this.time.delayedCall(1100, () => this.endGame(true));
    }
  }

  private floatText(x: number, y: number, s: string, color: string): void {
    const t = this.worldText(x, y, s, 14, color);
    this.tweens.add({
      targets: t,
      y: y - 27,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  // -------------------------------------------------------------- fim
  private endGame(victory: boolean): void {
    if (this.mode === 'ended') return;
    const s = this.state;
    this.mode = 'ended';
    s.ended = true;
    this.player.stop();
    this.physics.pause();
    this.ui.hideHudForEnd();
    bus.emit(EV.HINT, '');
    if (victory) {
      sfx.win();
      for (let i = 0; i < 4; i++) {
        this.time.delayedCall(i * 180, () =>
          this.stars.explode(12, this.player.x + Phaser.Math.Between(-40, 40), this.player.y - 40),
        );
      }
    } else {
      sfx.lose();
    }
    this.scene.launch('End', {
      victory,
      coins: s.coins,
      served: s.served,
      missed: s.missed,
      harvests: s.harvests,
      day: s.clock.day,
    });
  }
}
