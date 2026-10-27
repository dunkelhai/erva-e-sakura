import Phaser from 'phaser';

function stopAll(scene: Phaser.Scene): void {
  const m = scene.game.scene;
  for (const key of ['End', 'UI', 'Game']) {
    if (m.isActive(key) || m.isPaused(key) || m.isSleeping(key)) m.stop(key);
  }
}

export function restartGame(scene: Phaser.Scene): void {
  stopAll(scene);
  scene.game.scene.start('Game');
}

export function goToTitle(scene: Phaser.Scene): void {
  stopAll(scene);
  scene.game.scene.start('Title');
}
