import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { DEPTH, RES } from '../config/layout';
import type { Crop } from '../systems/farm';
import { PAL } from '../style/palette';
import { Walker } from './Walker';

export type CustomerState = 'arriving' | 'waiting' | 'serving' | 'leaving' | 'gone';

const SPEED = 70;

/** Cliente da casa de chá: anda até a fila, mostra o pedido num balão e espera. */
export class Customer {
  readonly walker: Walker;
  readonly bubble: Phaser.GameObjects.Image;
  readonly icon: Phaser.GameObjects.Image;
  readonly barBg: Phaser.GameObjects.Rectangle;
  readonly bar: Phaser.GameObjects.Rectangle;
  state: CustomerState = 'arriving';
  waited = 0;
  x: number;
  y: number;
  private path: Array<{ x: number; y: number }> = [];
  private onArrive: (() => void) | null = null;

  constructor(
    readonly scene: Phaser.Scene,
    readonly order: Crop,
    look: number,
    start: { x: number; y: number },
  ) {
    this.x = start.x;
    this.y = start.y;
    this.walker = new Walker(scene, `cust${look}`, start.x, start.y);
    this.bubble = scene.add
      .image(0, 0, 'bubble')
      .setOrigin(0.5, 1)
      .setScale(1 / RES)
      .setDepth(DEPTH.worldUi)
      .setVisible(false);
    this.icon = scene.add
      .image(0, 0, `ord_${order}`)
      .setScale(1 / RES)
      .setDepth(DEPTH.worldUi + 1)
      .setVisible(false);
    this.barBg = scene.add
      .rectangle(0, 0, 22, 4, PAL.tinta, 0.6)
      .setDepth(DEPTH.worldUi)
      .setVisible(false);
    this.bar = scene.add
      .rectangle(0, 0, 20, 2, PAL.musgo)
      .setOrigin(0, 0.5)
      .setDepth(DEPTH.worldUi + 1)
      .setVisible(false);
  }

  walkTo(points: Array<{ x: number; y: number }>, onArrive?: () => void): void {
    this.path = points.slice();
    this.onArrive = onArrive ?? null;
  }

  get patienceFrac(): number {
    return Math.max(0, 1 - this.waited / BALANCE.CUSTOMER_PATIENCE_MIN);
  }

  setOrderVisible(v: boolean): void {
    this.bubble.setVisible(v);
    this.icon.setVisible(v);
    this.barBg.setVisible(v && this.state === 'waiting');
    this.bar.setVisible(v && this.state === 'waiting');
  }

  update(dtMs: number): void {
    if (this.state === 'gone') return;
    let moving = false;
    if (this.path.length > 0) {
      const target = this.path[0];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);
      const step = (SPEED * dtMs) / 1000;
      if (dist <= step) {
        this.x = target.x;
        this.y = target.y;
        this.path.shift();
        if (this.path.length === 0 && this.onArrive) {
          const cb = this.onArrive;
          this.onArrive = null;
          cb();
          if ((this.state as CustomerState) === 'gone') return;
        }
      } else {
        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step;
        this.walker.face(dx, dy);
        moving = true;
      }
    } else if (this.state === 'waiting' || this.state === 'serving') {
      this.walker.dir = 'side';
      this.walker.flip = true;
    }
    this.walker.place(this.x, this.y, moving, dtMs);
    const by = this.y - 40;
    this.bubble.setPosition(this.x, by);
    this.icon.setPosition(this.x, by - 11);
    this.barBg.setPosition(this.x, by + 4);
    this.bar.setPosition(this.x - 10, by + 4);
    const f = this.patienceFrac;
    this.bar.width = 20 * f;
    this.bar.fillColor = f < 0.3 ? PAL.perigoSuave : PAL.musgo;
  }

  destroy(): void {
    this.walker.destroy();
    this.bubble.destroy();
    this.icon.destroy();
    this.barBg.destroy();
    this.bar.destroy();
    this.state = 'gone';
  }
}
