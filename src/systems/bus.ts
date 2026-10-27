import Phaser from 'phaser';

/** Barramento de eventos entre GameScene e UIScene. Limpo a cada partida. */
export const bus = new Phaser.Events.EventEmitter();

export const EV = {
  INVENTORY: 'inventory',
  COINS_EARNED: 'coins-earned',
  TOAST: 'toast',
  HINT: 'hint',
  DAY_START: 'day-start',
} as const;
