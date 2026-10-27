import Phaser from 'phaser';
import { SETTINGS } from '../config/settings';
import { PAL } from '../style/palette';

/** Shake leve (STYLE_GUIDE §1.3). Respeita "reduzir tremor/flash". */
export function shakeLight(cam: Phaser.Cameras.Scene2D.Camera): void {
  if (!SETTINGS.reduceMotion) cam.shake(90, 0.003);
}

export function shakeStrong(cam: Phaser.Cameras.Scene2D.Camera): void {
  if (!SETTINGS.reduceMotion) cam.shake(180, 0.007);
}

/** Hit-flash branco de 80 ms. */
export function hitFlash(
  scene: Phaser.Scene,
  obj: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
): void {
  if (SETTINGS.reduceMotion) {
    obj.setTint(PAL.flashSuave);
  } else {
    obj.setTintFill(PAL.branco);
  }
  scene.time.delayedCall(80, () => obj.clearTint());
}

/** Pop de UI 1.0 → 1.1 → 1.0 em 140 ms. */
export function pop(
  scene: Phaser.Scene,
  obj: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject,
  base = 1,
): void {
  scene.tweens.killTweensOf(obj);
  obj.setScale(base);
  scene.tweens.add({
    targets: obj,
    scale: base * 1.1,
    duration: 140,
    ease: 'Quad.easeOut',
    yoyo: true,
  });
}
