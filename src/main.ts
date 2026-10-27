import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { EndScene } from './scenes/EndScene';
import { GameScene } from './scenes/GameScene';
import { TitleScene } from './scenes/TitleScene';
import { UIScene } from './scenes/UIScene';

async function waitFonts(): Promise<void> {
  const loads = Promise.all([
    document.fonts.load('700 48px "Kaisei Decol"'),
    document.fonts.load('500 20px "Zen Maru Gothic"'),
    document.fonts.load('700 20px "Zen Maru Gothic"'),
  ]).then(() => document.fonts.ready);
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 4000));
  try {
    await Promise.race([loads, timeout]);
  } catch {
    // Sem rede: segue com a fonte de fallback.
  }
}

function boot(): void {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 1280,
    height: 720,
    backgroundColor: '#a7c47a',
    antialias: true,
    roundPixels: true,
    fps: { target: 60 },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: [BootScene, TitleScene, GameScene, UIScene, EndScene],
  };
  const game = new Phaser.Game(config);
  (window as unknown as { __game: Phaser.Game }).__game = game;
}

void waitFonts().then(boot);
