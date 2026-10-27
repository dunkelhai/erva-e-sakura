/** Paleta do jogo (STYLE_GUIDE §3). Nunca use hex solto nas cenas. */
export const PAL = {
  musgoClaro: 0xa7c47a,
  musgo: 0x6f9a52,
  musgoFundo: 0x3f6b45,
  cerejeira: 0xf4b6c2,
  cerejeiraClara: 0xf8cdd6,
  cerejeiraViva: 0xe57d98,
  terracota: 0xc46a45,
  telhaSombra: 0xa4553a,
  taipa: 0xe8d2a8,
  taipaSombra: 0xd4bb8e,
  madeira: 0x8a5a3b,
  ceuAgua: 0x9fd3e0,
  jogador: 0xf2a33a,
  tinta: 0x3d2e2a,
  perigoSuave: 0xd9534f,
  // Derivadas (detalhes de cenário citados no guia)
  torii: 0xc9473b,
  pedra: 0xb9b1a3,
  cabeloBranco: 0xe9e4da,
  lanterna: 0xffc27a,
  vagalume: 0xeaff8a,
  terra: 0x9a6a48,
  terraMolhada: 0x6b4a36,
  pele: 0xf6d7b8,
  peleMorena: 0xe9b98f,
  shoji: 0xfbf3e2,
  plantaSeca: 0xd8cfa8,
  flashSuave: 0xfff4f4,
  moeda: 0xf2c14e,
  moedaClara: 0xffe08a,
  branco: 0xffffff,
  preto: 0x000000,
  // Tints do ciclo dia/noite (MULTIPLY)
  tintManha: 0xfff4e0,
  tintTarde: 0xffffff,
  tintEntardecer: 0xffb88a,
  tintNoite: 0x5a6aa8,
} as const;

/** Versões string para Phaser.Text. */
export const CSS = {
  tinta: '#3d2e2a',
  taipa: '#e8d2a8',
  cerejeira: '#f4b6c2',
  cerejeiraViva: '#e57d98',
  jogador: '#f2a33a',
  musgoFundo: '#3f6b45',
  musgo: '#6f9a52',
  perigoSuave: '#d9534f',
  moeda: '#f2c14e',
  branco: '#ffffff',
  preto: '#000000',
  musgoClaro: '#a7c47a',
  sombraSuave: '#00000055',
  ceuAgua: '#9fd3e0',
} as const;

export const FONT_TITLE = '"Kaisei Decol", serif';
export const FONT_UI = '"Zen Maru Gothic", sans-serif';
