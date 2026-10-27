/** Dimensões do mundo (não é balanceamento). */
export const TILE = 32;
export const MAP_W = 40;
export const MAP_H = 30;
export const WORLD_W = TILE * MAP_W; // 1280
export const WORLD_H = TILE * MAP_H; // 960
/** Câmera do mundo: 1 tile lógico de 32 px aparece com 48 px na tela. */
export const ZOOM = 1.5;
/** Resolução das texturas do mundo (igual ao zoom, para ficar nítido). */
export const RES = ZOOM;

export const VIEW_W = 1280;
export const VIEW_H = 720;

/** Profundidades. */
export const DEPTH = {
  ground: 0,
  water: 1,
  plot: 2,
  overlay: 20_000,
  glow: 20_001,
  worldUi: 20_010,
} as const;
