import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { Walker } from './Walker';

export interface MoveKeys {
  up: Phaser.Input.Keyboard.Key[];
  down: Phaser.Input.Keyboard.Key[];
  left: Phaser.Input.Keyboard.Key[];
  right: Phaser.Input.Keyboard.Key[];
}

/** Jogador: corpo físico pequeno nos pés + visual Walker. */
export class Player {
  readonly body: Phaser.GameObjects.Zone;
  readonly walker: Walker;
  facing = new Phaser.Math.Vector2(0, 1);

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.body = scene.add.zone(x, y - 4, 14, 9);
    scene.physics.add.existing(this.body);
    const b = this.arcade;
    b.setCollideWorldBounds(true);
    this.walker = new Walker(scene, 'player', x, y);
  }

  get arcade(): Phaser.Physics.Arcade.Body {
    return this.body.body as Phaser.Physics.Arcade.Body;
  }

  /** Pés do personagem. */
  get x(): number {
    return this.body.x;
  }
  get y(): number {
    return this.body.y + 4;
  }

  /** Ponto à frente do jogador usado para interação. */
  get reachPoint(): { x: number; y: number } {
    return {
      x: this.x + this.facing.x * BALANCE.INTERACT_REACH,
      y: this.y - 6 + this.facing.y * BALANCE.INTERACT_REACH,
    };
  }

  update(keys: MoveKeys | null, dtMs: number): void {
    let dx = 0;
    let dy = 0;
    if (keys) {
      if (keys.left.some((k) => k.isDown)) dx -= 1;
      if (keys.right.some((k) => k.isDown)) dx += 1;
      if (keys.up.some((k) => k.isDown)) dy -= 1;
      if (keys.down.some((k) => k.isDown)) dy += 1;
    }
    const v = new Phaser.Math.Vector2(dx, dy);
    const moving = v.lengthSq() > 0;
    if (moving) {
      v.normalize();
      this.facing.copy(v);
      this.walker.face(dx, dy);
      v.scale(BALANCE.PLAYER_SPEED);
    }
    this.arcade.setVelocity(v.x, v.y);
    this.walker.place(this.x, this.y, moving && this.arcade.speed > 1, dtMs);
  }

  stop(): void {
    this.arcade.setVelocity(0, 0);
    this.walker.place(this.x, this.y, false, 0);
  }
}
