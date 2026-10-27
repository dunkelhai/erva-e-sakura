/** Nome e falas da NPC (inventados). Uma fala por dia, com páginas. */
export const NPC_NAME = 'Dona Kiyoe';

export const NPC_LINES: string[][] = [
  [
    'Buenas, tchê! Eu sou a Dona Kiyoe, a moradora mais antiga desta vila.',
    'Na tua horta: Z planta a semente, Z de novo rega. X ou Shift troca entre erva-mate e chá verde.',
    'Sem água naquele dia a planta emburra e não cresce. Rega todo santo dia!',
    'Depois leva as folhas pra casa de chá. Junta 50 moedas até o fim do terceiro dia, combinado?',
  ],
  [
    'Que cheiro bom de erva nova no ar hoje!',
    'Os fregueses andam apressados: quanto mais ligeiro servires, mais moedinhas caem no pote.',
    'E presta atenção no balão deles. Bebida errada não rende nada e ainda gasta folha.',
  ],
  [
    'Hoje é o último dia da festa das cerejeiras!',
    'Junta 50 moedas antes da meia-noite e a vila inteira vai brindar contigo, com cuia e com chawan.',
    'Vai com calma, mas sem moleza. Eu confio em ti!',
  ],
];

export const ORDER_LINES = {
  erva: [
    'Um chimarrão bem quentinho, por favor!',
    'Me vê uma cuia de mate, tchê?',
    'Chimarrão, sem pressa... mas com pressa!',
  ],
  cha: [
    'Um matcha bem verdinho, por favor!',
    'Uma tigela de chá verde, onegai!',
    'Matcha espumante, se puder!',
  ],
} as const;
