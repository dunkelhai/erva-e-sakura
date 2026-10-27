import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { sfx } from '../systems/audio';
import { goToTitle, restartGame } from '../systems/flow';
import { pop } from '../systems/juice';
import { CSS, FONT_TITLE, FONT_UI, PAL } from '../style/palette';

interface EndData {
  victory: boolean;
  coins: number;
  served: number;
  missed: number;
  harvests: number;
  day: number;
}

/** Overlay de vitória/derrota sobre o jogo congelado. */
export class EndScene extends Phaser.Scene {
  private sel = 0;
  private buttons: Array<{
    bg: Phaser.GameObjects.Graphics;
    label: Phaser.GameObjects.Text;
    x: number;
  }> = [];
  private readyAt = 0;

  constructor() {
    super('End');
  }

  create(data: EndData): void {
    this.sel = 0;
    this.buttons = [];
    this.readyAt = this.time.now + 500;
    const bg = this.add.rectangle(640, 360, 1280, 720, PAL.preto, 0.6).setAlpha(0);
    this.tweens.add({ targets: bg, alpha: 1, duration: 250 });

    if (data.victory) {
      this.add.particles(0, 0, 'petal', {
        x: { min: 0, max: 1280 },
        y: -20,
        lifespan: 6000,
        speedY: { min: 40, max: 90 },
        speedX: { min: -20, max: 40 },
        rotate: { min: 0, max: 360 },
        scale: { min: 1, max: 1.6 },
        frequency: 90,
        maxAliveParticles: 60,
      });
    }

    const title = this.add
      .text(640, 260, data.victory ? 'Vitória!' : 'A festa acabou...', {
        fontFamily: FONT_TITLE,
        fontSize: '64px',
        color: data.victory ? CSS.cerejeira : CSS.perigoSuave,
      })
      .setOrigin(0.5)
      .setStroke(CSS.tinta, 6)
      .setScale(0.6);
    this.tweens.add({ targets: title, scale: 1, duration: 300, ease: 'Back.easeOut' });

    const sub = data.victory
      ? 'A vila inteira brinda com cuia e chawan!'
      : `Faltaram ${Math.max(0, BALANCE.GOAL_COINS - data.coins)} moedas para a meta de ${BALANCE.GOAL_COINS}.`;
    const style = { fontFamily: FONT_UI, fontSize: '22px', color: CSS.taipa, fontStyle: '700' };
    const lines = [
      sub,
      `Moedas: ${data.coins} / ${BALANCE.GOAL_COINS}   ·   Dia ${data.day}`,
      `Fregueses servidos: ${data.served}   ·   Perdidos: ${data.missed}   ·   Colheitas: ${data.harvests}`,
    ];
    lines.forEach((l, i) => {
      const t = this.add
        .text(640, 360 + i * 48, l, style)
        .setOrigin(0.5)
        .setShadow(0, 3, '#000', 0, true, true)
        .setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, delay: 200 + i * 120, duration: 250 });
    });

    ['Tentar de novo', 'Menu'].forEach((label, i) => {
      const x = 640 + (i === 0 ? -136 : 136);
      const g = this.add.graphics();
      const t = this.add
        .text(x, 560, label, {
          fontFamily: FONT_UI,
          fontSize: '28px',
          color: CSS.tinta,
          fontStyle: '700',
        })
        .setOrigin(0.5);
      const zone = this.add.zone(x, 560, 240, 56).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => this.select(i));
      zone.on('pointerdown', () => this.activate(i));
      this.buttons.push({ bg: g, label: t, x });
    });
    this.add
      .text(640, 640, 'Espaço confirmar · ←/→ escolher · R jogar de novo', {
        fontFamily: FONT_UI,
        fontSize: '18px',
        color: CSS.taipa,
      })
      .setOrigin(0.5)
      .setAlpha(0.8);
    this.drawButtons();

    const kb = this.input.keyboard!;
    kb.on('keydown', (e: KeyboardEvent) => {
      if (e.repeat || this.time.now < this.readyAt) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.select(0);
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') this.select(1);
      else if (e.code === 'Space' || e.code === 'KeyZ' || e.code === 'Enter')
        this.activate(this.sel);
      else if (e.code === 'KeyR') this.activate(0);
    });
  }

  private select(i: number): void {
    if (i === this.sel) return;
    this.sel = i;
    sfx.select();
    this.drawButtons();
    pop(this, this.buttons[i].label);
  }

  private drawButtons(): void {
    this.buttons.forEach((b, i) => {
      const on = i === this.sel;
      b.bg.clear();
      b.bg
        .fillStyle(on ? PAL.cerejeiraViva : PAL.taipa, 1)
        .fillRoundedRect(b.x - 120, 532, 240, 56, 14);
      b.bg.lineStyle(3, PAL.tinta, 0.85).strokeRoundedRect(b.x - 120, 532, 240, 56, 14);
      b.label.setColor(on ? CSS.branco : CSS.tinta);
    });
  }

  private activate(i: number): void {
    if (this.time.now < this.readyAt) return;
    sfx.select();
    if (i === 0) restartGame(this);
    else goToTitle(this);
  }
}
