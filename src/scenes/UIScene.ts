import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { DEBUG } from '../config/debug';
import { SETTINGS } from '../config/settings';
import { ORDER_LINES } from '../content/dialogue';
import { sfx } from '../systems/audio';
import { bus, EV } from '../systems/bus';
import { PHASE_LABEL } from '../systems/clock';
import { type Crop, CROP_LABEL } from '../systems/farm';
import { goToTitle, restartGame } from '../systems/flow';
import { pop } from '../systems/juice';
import type { GameState } from '../systems/state';
import { CSS, FONT_TITLE, FONT_UI, PAL } from '../style/palette';

type ServeCb = (choice: Crop | null, remainingFrac: number) => void;

const DRINK_LABEL: Record<Crop, string> = { erva: 'Chimarrão', cha: 'Matcha' };
const OPTIONS: Crop[] = ['erva', 'cha'];

function panel(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
  g.fillStyle(PAL.preto, 0.45).fillRoundedRect(x, y, w, h, 12);
}

export class UIScene extends Phaser.Scene {
  private state!: GameState;

  // HUD
  private dayText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private counts: Record<string, Phaser.GameObjects.Text> = {};
  private icons: Record<string, Phaser.GameObjects.Image> = {};
  private selG!: Phaser.GameObjects.Graphics;
  private coinsText!: Phaser.GameObjects.Text;
  private coinIcon!: Phaser.GameObjects.Image;
  private queueText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private hintBg!: Phaser.GameObjects.Graphics;
  private toastText!: Phaser.GameObjects.Text;
  private fpsText!: Phaser.GameObjects.Text;
  private hud!: Phaser.GameObjects.Container;
  private textCache: Record<string, string> = {};
  private displayCoins = 0;
  private flying = 0;

  // Diálogo
  private dlg!: Phaser.GameObjects.Container;
  private dlgName!: Phaser.GameObjects.Text;
  private dlgText!: Phaser.GameObjects.Text;
  private dlgArrow!: Phaser.GameObjects.Text;
  private dlgPages: string[] = [];
  private dlgPage = 0;
  private dlgTyped = 0;
  private dlgShown = -1;
  private dlgCb: (() => void) | null = null;

  // Mini-jogo de servir
  private srv!: Phaser.GameObjects.Container;
  private srvLine!: Phaser.GameObjects.Text;
  private srvCards: Phaser.GameObjects.Container[] = [];
  private srvCardBg: Phaser.GameObjects.Graphics[] = [];
  private srvLeafText: Phaser.GameObjects.Text[] = [];
  private srvBar!: Phaser.GameObjects.Rectangle;
  private srvMsg!: Phaser.GameObjects.Text;
  private srvSel = 0;
  private srvRemaining = 0;
  private srvLeaves: Record<Crop, number> = { erva: 0, cha: 0 };
  private srvCb: ServeCb | null = null;

  // Pausa / letreiro
  private pauseLayer!: Phaser.GameObjects.Container;
  private pauseMotion!: Phaser.GameObjects.Text;
  private paused = false;
  private bannerTitle!: Phaser.GameObjects.Text;
  private bannerSub!: Phaser.GameObjects.Text;

  private mode: 'none' | 'dialog' | 'serve' = 'none';
  private openedAt = 0;

  constructor() {
    super('UI');
  }

  init(data: { state: GameState }): void {
    this.state = data.state;
    this.textCache = {};
    this.counts = {};
    this.icons = {};
    this.srvCards = [];
    this.srvCardBg = [];
    this.srvLeafText = [];
    this.mode = 'none';
    this.paused = false;
    this.flying = 0;
    this.displayCoins = data.state.coins;
  }

  create(): void {
    this.buildHud();
    this.buildDialog();
    this.buildServe();
    this.buildPause();
    this.bannerTitle = this.add
      .text(640, 300, '', { fontFamily: FONT_TITLE, fontSize: '96px', color: CSS.taipa })
      .setOrigin(0.5)
      .setStroke(CSS.tinta, 8)
      .setAlpha(0)
      .setDepth(40);
    this.bannerSub = this.add
      .text(640, 384, '', { fontFamily: FONT_UI, fontSize: '26px', color: CSS.cerejeira })
      .setOrigin(0.5)
      .setStroke(CSS.tinta, 5)
      .setAlpha(0)
      .setDepth(40);

    const kb = this.input.keyboard!;
    kb.addCapture('SPACE,UP,DOWN,LEFT,RIGHT,SHIFT');
    kb.on('keydown', (e: KeyboardEvent) => {
      if (!e.repeat) this.onKey(e.code);
    });

    bus.on(EV.INVENTORY, (keys: string[]) => {
      this.refreshHud();
      for (const k of keys) if (this.icons[k]) pop(this, this.icons[k]);
    });
    bus.on(EV.COINS_EARNED, (d: { amount: number; x: number; y: number }) =>
      this.flyCoins(d.amount, d.x, d.y),
    );
    bus.on(EV.TOAST, (msg: string) => this.toast(msg));
    bus.on(EV.HINT, (msg: string) => this.setHint(msg));
    this.refreshHud();
    bus.emit('ui-ready');
  }

  // ---------------------------------------------------------------- HUD
  private text(x: number, y: number, s: string, size: number, color: string = CSS.branco) {
    return this.add
      .text(x, y, s, { fontFamily: FONT_UI, fontSize: `${size}px`, color, fontStyle: '700' })
      .setOrigin(0, 0.5)
      .setShadow(0, 3, CSS.preto, 0, true, true);
  }

  private buildHud(): void {
    this.hud = this.add.container(0, 0).setDepth(10);
    const g = this.add.graphics();
    panel(g, 32, 12, 344, 60);
    panel(g, 420, 12, 440, 60);
    panel(g, 1040, 12, 208, 60);
    g.fillStyle(PAL.branco, 0.25).fillRect(622, 24, 2, 36);
    this.hud.add(g);

    this.dayText = this.text(52, 42, '', 22);
    this.timeText = this.text(156, 42, '', 28);
    this.phaseText = this.text(252, 42, '', 20, CSS.cerejeira);
    this.hud.add([this.dayText, this.timeText, this.phaseText]);

    this.selG = this.add.graphics();
    this.hud.add(this.selG);
    const slots: Array<[string, number]> = [
      ['seed_erva', 462],
      ['seed_cha', 562],
      ['leaf_erva', 682],
      ['leaf_cha', 782],
    ];
    for (const [key, x] of slots) {
      const icon = this.add.image(x, 42, `icon_${key}`);
      const t = this.text(x + 22, 42, '0', 28);
      this.icons[key] = icon;
      this.counts[key] = t;
      this.hud.add([icon, t]);
    }

    this.coinIcon = this.add.image(1076, 42, 'icon_coin');
    this.icons.coin = this.coinIcon;
    this.coinsText = this.text(1232, 42, '', 28, CSS.moeda).setOrigin(1, 0.5);
    this.queueText = this.text(1232, 96, '', 20, CSS.taipa).setOrigin(1, 0.5);
    this.hud.add([this.coinIcon, this.coinsText, this.queueText]);

    this.hintBg = this.add.graphics().setDepth(10);
    this.hintText = this.add
      .text(640, 682, '', { fontFamily: FONT_UI, fontSize: '20px', color: CSS.branco })
      .setOrigin(0.5)
      .setDepth(11)
      .setShadow(0, 2, CSS.preto, 0, true, true);
    this.toastText = this.add
      .text(640, 618, '', { fontFamily: FONT_UI, fontSize: '22px', color: CSS.taipa })
      .setOrigin(0.5)
      .setStroke(CSS.tinta, 5)
      .setDepth(12)
      .setAlpha(0);
    this.fpsText = this.text(48, 96, '', 16, CSS.taipa).setVisible(false);
  }

  private setIf(key: string, obj: Phaser.GameObjects.Text, value: string): boolean {
    if (this.textCache[key] === value) return false;
    this.textCache[key] = value;
    obj.setText(value);
    return true;
  }

  private refreshHud(): void {
    const s = this.state;
    this.setIf('day', this.dayText, `Dia ${s.clock.day}/${BALANCE.TOTAL_DAYS}`);
    this.setIf('time', this.timeText, s.clock.label);
    this.setIf('phase', this.phaseText, PHASE_LABEL[s.clock.phase]);
    this.setIf('seed_erva', this.counts.seed_erva, String(s.seeds.erva));
    this.setIf('seed_cha', this.counts.seed_cha, String(s.seeds.cha));
    this.setIf('leaf_erva', this.counts.leaf_erva, String(s.leaves.erva));
    this.setIf('leaf_cha', this.counts.leaf_cha, String(s.leaves.cha));
    if (this.flying === 0) this.displayCoins = s.coins;
    this.setIf('coins', this.coinsText, `${this.displayCoins} / ${BALANCE.GOAL_COINS}`);
    if (this.textCache.sel !== s.selectedSeed) {
      this.textCache.sel = s.selectedSeed;
      const x = s.selectedSeed === 'erva' ? 462 : 562;
      this.selG.clear();
      this.selG.lineStyle(3, PAL.cerejeiraViva, 1).strokeRoundedRect(x - 24, 18, 86, 48, 10);
    }
  }

  setQueueCount(n: number): void {
    const v = n > 0 ? `Fregueses esperando: ${n}` : '';
    if (this.setIf('queue', this.queueText, v) && n > 0) pop(this, this.queueText);
  }

  private setHint(msg: string): void {
    if (this.textCache.hint === msg) return;
    this.textCache.hint = msg;
    this.hintText.setText(msg);
    this.hintBg.clear();
    if (msg) {
      const w = this.hintText.width + 40;
      panel(this.hintBg, 640 - w / 2, 662, w, 40);
    }
  }

  toast(msg: string): void {
    this.toastText.setText(msg).setAlpha(1).setY(626);
    this.tweens.killTweensOf(this.toastText);
    this.tweens.add({ targets: this.toastText, y: 610, duration: 200, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: this.toastText, alpha: 0, delay: 1800, duration: 400 });
  }

  // ------------------------------------------------------------- moedas
  private flyCoins(amount: number, wx: number, wy: number): void {
    const cam = this.scene.get('Game').cameras.main;
    const sx = (wx - cam.worldView.x) * cam.zoom;
    const sy = (wy - cam.worldView.y) * cam.zoom;
    const n = Math.max(1, Math.min(amount, 8));
    let given = 0;
    this.flying += 1;
    for (let i = 0; i < n; i++) {
      const share = i === n - 1 ? amount - given : Math.floor(amount / n);
      given += share;
      const c = this.add
        .image(sx + Phaser.Math.Between(-16, 16), sy + Phaser.Math.Between(-10, 10), 'icon_coin')
        .setScale(0.8)
        .setDepth(30);
      this.tweens.chain({
        targets: c,
        tweens: [
          { y: c.y - 36, duration: 200, ease: 'Quad.easeOut', delay: i * 70 },
          { x: 1076, y: 42, scale: 0.6, duration: 480, ease: 'Cubic.easeIn' },
        ],
        onComplete: () => {
          c.destroy();
          this.displayCoins += share;
          if (i === n - 1) {
            this.flying -= 1;
            if (this.flying === 0) this.displayCoins = this.state.coins;
          }
          this.setIf('coins', this.coinsText, `${this.displayCoins} / ${BALANCE.GOAL_COINS}`);
          pop(this, this.coinIcon);
          pop(this, this.coinsText);
          sfx.coin();
        },
      });
    }
  }

  // ------------------------------------------------------------ diálogo
  private buildDialog(): void {
    this.dlg = this.add.container(0, 0).setDepth(20).setVisible(false);
    const g = this.add.graphics();
    g.fillStyle(PAL.tinta, 0.35).fillRoundedRect(100, 526, 1088, 168, 18);
    g.fillStyle(PAL.taipa, 0.97).fillRoundedRect(96, 518, 1088, 168, 18);
    g.lineStyle(4, PAL.madeira, 1).strokeRoundedRect(96, 518, 1088, 168, 18);
    g.fillStyle(PAL.cerejeiraViva, 1).fillRoundedRect(124, 496, 220, 44, 12);
    g.lineStyle(3, PAL.tinta, 0.85).strokeRoundedRect(124, 496, 220, 44, 12);
    this.dlgName = this.add
      .text(234, 518, '', {
        fontFamily: FONT_UI,
        fontSize: '22px',
        color: CSS.branco,
        fontStyle: '700',
      })
      .setOrigin(0.5)
      .setStroke(CSS.tinta, 4);
    this.dlgText = this.add.text(132, 556, '', {
      fontFamily: FONT_UI,
      fontSize: '22px',
      color: CSS.tinta,
      fontStyle: '500',
      wordWrap: { width: 1010 },
      lineSpacing: 8,
    });
    this.dlgArrow = this.add
      .text(1150, 662, '▼ Espaço', {
        fontFamily: FONT_UI,
        fontSize: '18px',
        color: CSS.cerejeiraViva,
        fontStyle: '700',
      })
      .setOrigin(1, 0.5);
    this.tweens.add({ targets: this.dlgArrow, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });
    this.dlg.add([g, this.dlgName, this.dlgText, this.dlgArrow]);
  }

  openDialog(name: string, pages: string[], onClose: () => void): void {
    this.mode = 'dialog';
    this.openedAt = this.time.now;
    this.dlgPages = pages;
    this.dlgPage = 0;
    this.dlgTyped = 0;
    this.dlgShown = -1;
    this.dlgCb = onClose;
    this.dlgName.setText(name);
    this.dlgText.setText('');
    this.dlg.setVisible(true).setAlpha(0).setY(20);
    this.tweens.add({ targets: this.dlg, alpha: 1, y: 0, duration: 200, ease: 'Quad.easeOut' });
    this.setHint('');
  }

  private advanceDialog(): void {
    const page = this.dlgPages[this.dlgPage];
    if (this.dlgTyped < page.length) {
      this.dlgTyped = page.length;
      return;
    }
    sfx.select();
    this.dlgPage += 1;
    this.dlgTyped = 0;
    this.dlgShown = -1;
    if (this.dlgPage >= this.dlgPages.length) {
      this.mode = 'none';
      this.tweens.add({
        targets: this.dlg,
        alpha: 0,
        duration: 150,
        onComplete: () => this.dlg.setVisible(false),
      });
      const cb = this.dlgCb;
      this.dlgCb = null;
      cb?.();
    }
  }

  // ------------------------------------------------------ servir (mini-jogo)
  private buildServe(): void {
    this.srv = this.add.container(640, 380).setDepth(20).setVisible(false);
    const g = this.add.graphics();
    g.fillStyle(PAL.tinta, 0.35).fillRoundedRect(-316, -206, 640, 420, 22);
    g.fillStyle(PAL.taipa, 0.98).fillRoundedRect(-320, -212, 640, 420, 22);
    g.lineStyle(4, PAL.madeira, 1).strokeRoundedRect(-320, -212, 640, 420, 22);
    const title = this.add
      .text(0, -176, 'Pedido na casa de chá', {
        fontFamily: FONT_TITLE,
        fontSize: '32px',
        color: CSS.tinta,
      })
      .setOrigin(0.5);
    this.srvLine = this.add
      .text(0, -128, '', {
        fontFamily: FONT_UI,
        fontSize: '22px',
        color: CSS.cerejeiraViva,
        fontStyle: '700',
        align: 'center',
        wordWrap: { width: 580 },
      })
      .setOrigin(0.5);
    this.srv.add([g, title, this.srvLine]);
    OPTIONS.forEach((crop, i) => {
      const card = this.add.container(i === 0 ? -140 : 140, 6);
      const bg = this.add.graphics();
      const icon = this.add.image(0, -22, `drink_${crop}`);
      const label = this.add
        .text(0, 46, DRINK_LABEL[crop], {
          fontFamily: FONT_UI,
          fontSize: '24px',
          color: CSS.tinta,
          fontStyle: '700',
        })
        .setOrigin(0.5);
      const leaves = this.add
        .text(0, 76, '', { fontFamily: FONT_UI, fontSize: '18px', color: CSS.musgoFundo })
        .setOrigin(0.5);
      card.add([bg, icon, label, leaves]);
      this.srvCards.push(card);
      this.srvCardBg.push(bg);
      this.srvLeafText.push(leaves);
      this.srv.add(card);
    });
    const barBg = this.add.rectangle(0, 128, 520, 14, PAL.tinta, 0.25);
    this.srvBar = this.add.rectangle(-260, 128, 520, 14, PAL.musgo).setOrigin(0, 0.5);
    this.srvMsg = this.add
      .text(0, 170, '←/→ escolher · Espaço servir · X dispensar', {
        fontFamily: FONT_UI,
        fontSize: '18px',
        color: CSS.tinta,
      })
      .setOrigin(0.5);
    this.srv.add([barBg, this.srvBar, this.srvMsg]);
  }

  private drawCards(): void {
    OPTIONS.forEach((crop, i) => {
      const bg = this.srvCardBg[i];
      const sel = i === this.srvSel;
      const has = this.srvLeaves[crop] > 0;
      bg.clear();
      bg.fillStyle(sel ? PAL.cerejeira : PAL.branco, has ? 0.95 : 0.5);
      bg.fillRoundedRect(-110, -96, 220, 196, 18);
      bg.lineStyle(sel ? 5 : 2, sel ? PAL.cerejeiraViva : PAL.madeira, 1);
      bg.strokeRoundedRect(-110, -96, 220, 196, 18);
      this.srvCards[i].setAlpha(has ? 1 : 0.5);
      this.srvLeafText[i].setText(has ? `folhas: ${this.srvLeaves[crop]}` : 'sem folhas');
    });
  }

  openServe(order: Crop, leaves: Record<Crop, number>, cb: ServeCb): void {
    this.mode = 'serve';
    this.openedAt = this.time.now;
    this.srvCb = cb;
    this.srvLeaves = { ...leaves };
    this.srvSel = leaves.erva > 0 ? 0 : 1;
    this.srvRemaining = BALANCE.SERVE_TIME_MS;
    this.srvLine.setText(`“${Phaser.Utils.Array.GetRandom([...ORDER_LINES[order]])}”`);
    this.srvMsg.setText('←/→ escolher · Espaço servir · X dispensar').setColor(CSS.tinta);
    this.drawCards();
    this.srv.setVisible(true).setScale(0.6).setAlpha(0);
    this.tweens.add({
      targets: this.srv,
      scale: 1,
      alpha: 1,
      duration: 260,
      ease: 'Back.easeOut',
    });
    this.setHint('');
    sfx.bell();
  }

  private moveServe(dir: number): void {
    const next = Phaser.Math.Clamp(this.srvSel + dir, 0, 1);
    if (next === this.srvSel) return;
    this.srvSel = next;
    sfx.select();
    this.drawCards();
    pop(this, this.srvCards[next]);
  }

  private confirmServe(): void {
    const crop = OPTIONS[this.srvSel];
    if (this.srvLeaves[crop] <= 0) {
      sfx.wrong();
      this.srvMsg
        .setText(`Sem folhas de ${CROP_LABEL[crop].toLowerCase()}!`)
        .setColor(CSS.perigoSuave);
      if (!SETTINGS.reduceMotion) {
        this.tweens.add({ targets: this.srv, x: 648, duration: 40, yoyo: true, repeat: 2 });
      }
      return;
    }
    this.finishServe(crop);
  }

  private finishServe(choice: Crop | null): void {
    this.mode = 'none';
    const frac = this.srvRemaining / BALANCE.SERVE_TIME_MS;
    this.tweens.add({
      targets: this.srv,
      scale: 0.8,
      alpha: 0,
      duration: 160,
      onComplete: () => this.srv.setVisible(false).setX(640),
    });
    const cb = this.srvCb;
    this.srvCb = null;
    cb?.(choice, frac);
  }

  // -------------------------------------------------------------- pausa
  private buildPause(): void {
    this.pauseLayer = this.add.container(0, 0).setDepth(50).setVisible(false);
    const bg = this.add.rectangle(640, 360, 1280, 720, PAL.preto, 0.6);
    const title = this.add
      .text(640, 260, 'Pausa', { fontFamily: FONT_TITLE, fontSize: '64px', color: CSS.cerejeira })
      .setOrigin(0.5)
      .setStroke(CSS.tinta, 6);
    const style = { fontFamily: FONT_UI, fontSize: '24px', color: CSS.taipa, fontStyle: '700' };
    const l1 = this.add.text(640, 370, 'Esc — continuar', style).setOrigin(0.5);
    const l2 = this.add.text(640, 414, 'R — reiniciar a partida', style).setOrigin(0.5);
    this.pauseMotion = this.add.text(640, 458, '', style).setOrigin(0.5);
    const l4 = this.add.text(640, 502, 'M — voltar ao título', style).setOrigin(0.5);
    this.pauseLayer.add([bg, title, l1, l2, this.pauseMotion, l4]);
  }

  private updateMotionLabel(): void {
    this.pauseMotion.setText(`X — reduzir tremor/flash: ${SETTINGS.reduceMotion ? 'Sim' : 'Não'}`);
  }

  private togglePause(): void {
    if (this.state.ended) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.scene.pause('Game');
      this.updateMotionLabel();
      this.pauseLayer.setVisible(true).setAlpha(0);
      this.tweens.add({ targets: this.pauseLayer, alpha: 1, duration: 150 });
    } else {
      this.scene.resume('Game');
      this.pauseLayer.setVisible(false);
    }
  }

  // ----------------------------------------------------------- letreiro
  showBanner(title: string, sub: string, holdMs: number, onDone?: () => void): void {
    this.bannerTitle.setText(title).setScale(0.6).setAlpha(0);
    this.bannerSub.setText(sub).setAlpha(0);
    this.tweens.add({
      targets: this.bannerTitle,
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });
    this.tweens.add({ targets: this.bannerSub, alpha: 1, duration: 300, delay: 150 });
    this.tweens.add({
      targets: [this.bannerTitle, this.bannerSub],
      alpha: 0,
      delay: holdMs,
      duration: 400,
      onComplete: () => onDone?.(),
    });
  }

  hideHudForEnd(): void {
    this.setHint('');
    this.dlg.setVisible(false);
    this.srv.setVisible(false);
    this.mode = 'none';
  }

  // -------------------------------------------------------------- input
  private onKey(code: string): void {
    if (code === 'Escape') {
      this.togglePause();
      return;
    }
    if (this.paused) {
      if (code === 'KeyR') restartGame(this);
      else if (code === 'KeyM') goToTitle(this);
      else if (code === 'KeyX') {
        SETTINGS.reduceMotion = !SETTINGS.reduceMotion;
        this.updateMotionLabel();
        pop(this, this.pauseMotion);
      }
      return;
    }
    if (DEBUG && code === 'F5') {
      this.fpsText.setVisible(!this.fpsText.visible);
      return;
    }
    if (this.time.now - this.openedAt < 160) return;
    const action = code === 'KeyZ' || code === 'Space';
    if (this.mode === 'dialog' && action) {
      this.advanceDialog();
    } else if (this.mode === 'serve') {
      if (code === 'ArrowLeft' || code === 'KeyA') this.moveServe(-1);
      else if (code === 'ArrowRight' || code === 'KeyD') this.moveServe(1);
      else if (action) this.confirmServe();
      else if (code === 'KeyX' || code === 'ShiftLeft' || code === 'ShiftRight')
        this.finishServe(null);
    }
  }

  update(_time: number, rawDelta: number): void {
    // Limita o delta: aba em segundo plano não pode estourar o timer de uma vez.
    const delta = Math.min(rawDelta, 50);
    this.refreshHud();
    if (this.fpsText.visible) this.fpsText.setText(`FPS ${this.game.loop.actualFps.toFixed(0)}`);
    if (this.paused) return;
    if (this.mode === 'dialog') {
      const page = this.dlgPages[this.dlgPage];
      this.dlgTyped = Math.min(
        page.length,
        this.dlgTyped + (delta / 1000) * BALANCE.TYPE_CHARS_PER_SEC,
      );
      const shown = Math.floor(this.dlgTyped);
      if (shown !== this.dlgShown) {
        if (shown % 3 === 0 && shown < page.length) sfx.type();
        this.dlgShown = shown;
        this.dlgText.setText(page.slice(0, shown));
      }
      this.dlgArrow.setVisible(shown >= page.length);
    } else if (this.mode === 'serve') {
      this.srvRemaining -= delta;
      const f = Math.max(0, this.srvRemaining / BALANCE.SERVE_TIME_MS);
      this.srvBar.width = 520 * f;
      this.srvBar.fillColor = f < 0.3 ? PAL.perigoSuave : f < 0.6 ? PAL.jogador : PAL.musgo;
      if (this.srvRemaining <= 0) this.finishServe(null);
    }
  }
}
