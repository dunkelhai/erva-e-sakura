import { BALANCE } from '../config/balance';

export type Crop = 'erva' | 'cha';

export const CROP_LABEL: Record<Crop, string> = { erva: 'Erva-mate', cha: 'Chá verde' };

export interface Plot {
  crop: Crop | null;
  /** 0 = vazio, 1 = broto, 2 = crescendo, 3 = maduro. */
  stage: number;
  /** Minutos regados acumulados no estágio atual. */
  growth: number;
  /** Regado hoje? Zera ao virar o dia. */
  watered: boolean;
}

export function emptyPlot(): Plot {
  return { crop: null, stage: 0, growth: 0, watered: false };
}

export function isRipe(p: Plot): boolean {
  return p.crop !== null && p.stage >= BALANCE.MAX_STAGE;
}

/** Avança o crescimento. Só cresce se tiver cultivo, não estiver maduro e foi regado hoje. */
export function tickPlot(p: Plot, dm: number): boolean {
  if (p.crop === null || !p.watered || isRipe(p)) return false;
  p.growth += dm;
  let changed = false;
  while (p.growth >= BALANCE.GROW_MIN_PER_STAGE && p.stage < BALANCE.MAX_STAGE) {
    p.growth -= BALANCE.GROW_MIN_PER_STAGE;
    p.stage += 1;
    changed = true;
  }
  if (isRipe(p)) p.growth = 0;
  return changed;
}

export function newDayPlot(p: Plot): void {
  p.watered = false;
}

export type PlotAction = 'plant' | 'water' | 'harvest' | 'wait' | 'noseed';

/** Qual ação o Z faz neste canteiro? */
export function plotAction(p: Plot, seedsOfSelected: number): PlotAction {
  if (p.crop === null) return seedsOfSelected > 0 ? 'plant' : 'noseed';
  if (isRipe(p)) return 'harvest';
  if (!p.watered) return 'water';
  return 'wait';
}
