/** TODAS as constantes de balanceamento do jogo ficam aqui. */
export const BALANCE = {
  // Tempo
  /** Duração real de um dia de jogo (06:00 → 24:00), em ms. */
  DAY_REAL_MS: 240_000,
  DAY_START_MIN: 6 * 60,
  DAY_END_MIN: 24 * 60,
  TOTAL_DAYS: 3,
  /** Pausa (ms reais) do letreiro "Dia N" entre os dias. */
  DAY_BANNER_MS: 2200,

  // Objetivo
  GOAL_COINS: 50,

  // Inventário inicial
  START_SEEDS_ERVA: 3,
  START_SEEDS_CHA: 3,
  START_LEAVES_ERVA: 1,
  START_LEAVES_CHA: 1,
  START_COINS: 0,

  // Horta
  /** Minutos de jogo regados para subir um estágio (1→2→3). */
  GROW_MIN_PER_STAGE: 150,
  MAX_STAGE: 3,
  HARVEST_LEAVES: 3,
  HARVEST_SEEDS_BACK: 1,

  // Casa de chá
  CUSTOMER_FIRST_MIN: 7 * 60 + 30,
  CUSTOMER_LAST_MIN: 19 * 60,
  CUSTOMER_INTERVAL_MIN: 95,
  CUSTOMER_PATIENCE_MIN: 200,
  CUSTOMER_MAX_QUEUE: 3,
  /** Tempo real para escolher a bebida, em ms. */
  SERVE_TIME_MS: 6000,
  SERVE_BASE_COINS: 2,
  SERVE_SPEED_BONUS_MAX: 4,

  // Jogador
  PLAYER_SPEED: 120,
  INTERACT_REACH: 18,
  INTERACT_RADIUS: 40,

  // Diálogo
  TYPE_CHARS_PER_SEC: 40,

  // Debug
  DEBUG_SKIP_MIN: 60,
  DEBUG_COINS: 10,
} as const;

/** Minutos de jogo por segundo real. */
export const GAME_MIN_PER_SEC =
  (BALANCE.DAY_END_MIN - BALANCE.DAY_START_MIN) / (BALANCE.DAY_REAL_MS / 1000);
