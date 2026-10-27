import { BALANCE } from '../config/balance';
import { Clock } from './clock';
import { type Crop, type Plot, emptyPlot } from './farm';

/** Estado de uma partida (recriado a cada reinício). */
export class GameState {
  clock = new Clock();
  coins: number = BALANCE.START_COINS;
  seeds: Record<Crop, number> = {
    erva: BALANCE.START_SEEDS_ERVA,
    cha: BALANCE.START_SEEDS_CHA,
  };
  leaves: Record<Crop, number> = {
    erva: BALANCE.START_LEAVES_ERVA,
    cha: BALANCE.START_LEAVES_CHA,
  };
  selectedSeed: Crop = 'erva';
  plots: Plot[] = [];
  served = 0;
  missed = 0;
  harvests = 0;
  won = false;
  ended = false;

  constructor(plotCount: number) {
    for (let i = 0; i < plotCount; i++) this.plots.push(emptyPlot());
  }

  /** Moedas por servir certo, com bônus proporcional ao tempo restante (0..1). */
  static serveReward(remainingFrac: number): number {
    const f = Math.max(0, Math.min(1, remainingFrac));
    return BALANCE.SERVE_BASE_COINS + Math.round(BALANCE.SERVE_SPEED_BONUS_MAX * f);
  }
}
