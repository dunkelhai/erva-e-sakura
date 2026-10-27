import Phaser from 'phaser';
import { RES } from '../config/layout';
import type { Dir } from '../systems/textures';

/** Visual de personagem: sprite com origem nos pés + sombra suave + animação de passo. */
export class Walker {
  readonly sprite: Phaser.GameObjects.Image;
  readonly shadow: Phaser.GameObjects.Image;
  dir: Dir = 'down';
  flip = false;
  private stepTimer = 0;
  private frame = 0;

  constructor(
    readonly scene: Phaser.Scene,
    readonly prefix: string,
    x: number,
    y: number,
  ) {
    this.shadow = scene.add
      .image(x, y + 3, 'shadow')
      .setScale(1 / RES)
      .setAlpha(0.25);
    this.sprite = scene.add
      .image(x, y, `${prefix}_down_0`)
      .setOrigin(0.5, 1)
      .setScale(1 / RES);
  }

  /** Atualiza posição (pés em x,y), direção e animação. */
  place(x: number, y: number, moving: boolean, dtMs: number): void {
    if (moving) {
      this.stepTimer += dtMs;
      if (this.stepTimer > 150) {
        this.stepTimer = 0;
        this.frame = 1 - this.frame;
      }
    } else {
      this.frame = 0;
      this.stepTimer = 0;
    }
    const bob = moving && this.frame === 1 ? 1 : 0;
    this.sprite.setTexture(`${this.prefix}_${this.dir}_${this.frame}`);
    this.sprite.setFlipX(this.dir === 'side' && this.flip);
    this.sprite.setPosition(x, y - bob);
    this.sprite.setDepth(y);
    const s = moving && this.frame === 1 ? 0.9 : 1;
    this.shadow.setPosition(x, y + 3).setScale(s / RES, 1 / RES);
    this.shadow.setDepth(y - 1);
  }

  face(dx: number, dy: number): void {
    if (Math.abs(dx) > Math.abs(dy)) {
      this.dir = 'side';
      this.flip = dx < 0;
    } else if (dy !== 0) {
      this.dir = dy < 0 ? 'up' : 'down';
    }
  }

  destroy(): void {
    this.sprite.destroy();
    this.shadow.destroy();
  }
}
