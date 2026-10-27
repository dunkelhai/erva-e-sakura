import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { DEBUG } from '../config/debug';
import { initAudio, sfx } from '../systems/audio';
import { CSS, FONT_TITLE, FONT_UI, PAL } from '../style/palette';

export class TitleScene extends Phaser.Scene {
  private starting = false;

  constructor() {
    super('Title');
  }

  create(): void {
    this.starting = false;
    const sky = this.add.graphics();
    sky.fillGradientStyle(PAL.ceuAgua, PAL.ceuAgua, PAL.cerejeiraClara, PAL.cerejeiraClara, 1);
    sky.fillRect(0, 0, 1280, 720);
    // colinas
    const hills = this.add.graphics();
    hills.fillStyle(PAL.musgo, 1).fillEllipse(260, 760, 900, 320);
    hills.fillStyle(PAL.musgo, 1).fillEllipse(1050, 780, 1000, 340);
    hills.fillStyle(PAL.musgoClaro, 1).fillEllipse(640, 820, 1600, 300);
    // cenário (texturas do mundo exibidas em escala de tela)
    this.add.image(118, 420, 'sakura').setOrigin(0.5, 1).setScale(1.5);
    this.add.image(1164, 420, 'sakura').setOrigin(0.5, 1).setScale(1.5);
    this.add.image(1210, 712, 'torii').setOrigin(0.5, 1).setScale(0.9);
    this.add.image(120, 712, 'house').setOrigin(0.5, 1).setScale(0.6);
    this.add.image(1100, 712, 'lantern').setOrigin(0.5, 1).setScale(1.1);
    this.add.image(250, 712, 'bush').setOrigin(0.5, 1).setScale(1.2);
    this.add.image(1030, 712, 'bush').setOrigin(0.5, 1).setScale(1.2);

    this.add.particles(0, 0, 'petal', {
      x: { min: -100, max: 1280 },
      y: -20,
      lifespan: { min: 7000, max: 10000 },
      speedY: { min: 30, max: 60 },
      speedX: { min: 10, max: 40 },
      rotate: { min: 0, max: 360 },
      scale: { min: 1, max: 1.5 },
      frequency: 160,
      maxAliveParticles: 40,
    });

    const panel = this.add.graphics();
    panel.fillStyle(PAL.preto, 0.45).fillRoundedRect(200, 480, 880, 176, 12);

    const title = this.add
      .text(640, 220, 'Erva e Sakura', {
        fontFamily: FONT_TITLE,
        fontSize: '104px',
        color: CSS.cerejeiraViva,
      })
      .setOrigin(0.5)
      .setStroke(CSS.tinta, 8)
      .setShadow(0, 4, '#00000055', 0, true, true);
    this.tweens.add({
      targets: title,
      y: 228,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.add
      .text(640, 306, 'Uma vila de erva-mate, chá verde e cerejeiras', {
        fontFamily: FONT_UI,
        fontSize: '28px',
        color: CSS.taipa,
        fontStyle: '700',
      })
      .setOrigin(0.5)
      .setStroke(CSS.tinta, 5);

    const press = this.add
      .text(640, 420, 'Pressione Espaço para começar', {
        fontFamily: FONT_UI,
        fontSize: '32px',
        color: CSS.branco,
        fontStyle: '700',
      })
      .setOrigin(0.5)
      .setStroke(CSS.tinta, 6);
    this.tweens.add({
      targets: press,
      scale: 1.06,
      alpha: 0.7,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    const controls = [
      'Setas/WASD — andar   ·   Z/Espaço — plantar, regar, colher, conversar, servir',
      'X/Shift — trocar semente (erva-mate ⇄ chá verde)   ·   ←/→ — escolher a bebida',
      'Esc — pausa   ·   R — reiniciar (na pausa e no fim)',
      `Meta: ${BALANCE.GOAL_COINS} moedas na casa de chá até o fim do Dia ${BALANCE.TOTAL_DAYS}`,
    ];
    controls.forEach((c, i) => {
      this.add
        .text(640, 508 + i * 40, c, {
          fontFamily: FONT_UI,
          fontSize: '20px',
          color: i === 3 ? CSS.cerejeira : CSS.taipa,
          fontStyle: i === 3 ? '700' : '500',
        })
        .setOrigin(0.5);
    });
    this.add
      .text(
        640,
        690,
        `v0.1 · arte gerada por código · fontes Kaisei Decol e Zen Maru Gothic${DEBUG ? ' · DEBUG' : ''}`,
        { fontFamily: FONT_UI, fontSize: '16px', color: CSS.tinta },
      )
      .setOrigin(0.5)
      .setAlpha(0.5);

    this.cameras.main.fadeIn(250);
    const kb = this.input.keyboard!;
    kb.addCapture('SPACE');
    kb.on('keydown-SPACE', () => this.start());
  }

  private start(): void {
    if (this.starting) return;
    this.starting = true;
    initAudio();
    sfx.select();
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('Game');
    });
  }
}
