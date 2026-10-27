# Erva e Sakura

Cozy sim top-down numa vila onde o casario missioneiro gaúcho (taipa, telha capa-e-canal, cuia) se mistura a um vilarejo japonês (torii, lanternas de pedra, cerejeiras). Você cultiva **erva-mate** e **chá verde**, conversa com a Dona Kiyoe e atende os fregueses da casa de chá servindo **chimarrão** ou **matcha**. A meta: juntar **50 moedas até o fim do Dia 3**.

**Jogue no navegador:** https://dunkelhai.github.io/erva-e-sakura/

Feito com Phaser 3 + TypeScript + Vite. Toda a arte é gerada por código (sem imagens externas).

## Controles

| Tecla                    | Ação                                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| Setas / WASD             | andar                                                                                              |
| Z / Espaço               | ação no que está à frente: plantar, regar, colher, conversar, atender no balcão; avançar diálogo   |
| X / Shift                | trocar a semente selecionada (erva-mate ⇄ chá verde)                                               |
| ← / → + Espaço           | no mini-jogo da casa de chá: escolher e servir a bebida                                            |
| X / Shift (no mini-jogo) | dispensar o freguês                                                                                |
| Esc                      | pausa (na pausa: **R** reinicia, **X** liga/desliga "reduzir tremor/flash", **M** volta ao título) |
| R                        | reiniciar nas telas de vitória/derrota (lá também ←/→ + Espaço e mouse)                            |

## Como jogar

1. Na horta (cercado a sudoeste), fique de frente para um canteiro: **Z** planta a semente selecionada, **Z** de novo rega.
2. A planta tem 3 estágios (broto → crescendo → madura). Ela **só cresce enquanto estiver regada naquele dia**: à meia-noite todos os canteiros secam e precisam de água de novo. Planta sem água fica amarelada e mostra um ícone de gota.
3. Madura (brilhinho dourado), **Z** colhe: +3 folhas do tipo e +1 semente de volta.
4. Fregueses chegam à casa de chá (nordeste) ao longo do dia e esperam ao lado do balcão com um balão do pedido e uma barrinha de paciência. Vá até a frente do balcão e aperte **Z**.
5. No mini-jogo, escolha a bebida pedida antes de o tempo acabar. Servir gasta 1 folha do tipo escolhido. Acerto dá moedas (mais rápido = mais moedas); erro gasta a folha e não paga.
6. 50 moedas = vitória (pode acontecer em qualquer dia). Se o Dia 3 terminar antes disso, derrota.

## Como rodar

```bash
npm install
npm run dev
```

Abra http://localhost:5173/erva-e-sakura/ (com atalhos de debug: http://localhost:5173/erva-e-sakura/?debug=1).

### Scripts

| Script            | O que faz                                                         |
| ----------------- | ----------------------------------------------------------------- |
| `npm run dev`     | servidor de desenvolvimento (Vite)                                |
| `npm run build`   | checagem de tipos (`tsc --noEmit`) + build de produção em `dist/` |
| `npm run preview` | serve o build de `dist/`                                          |
| `npm run lint`    | ESLint + Prettier (checagem)                                      |
| `npm run format`  | formata com Prettier                                              |

O deploy no GitHub Pages é feito pelo workflow `.github/workflows/deploy.yml` a cada push na `main`.

## Debug (`?debug=1`)

| Tecla | Efeito                                                                                          |
| ----- | ----------------------------------------------------------------------------------------------- |
| F1    | vitória imediata                                                                                |
| F2    | derrota imediata                                                                                |
| F3    | avança 1 hora de jogo (aplica crescimento, chegada e paciência dos fregueses; pode virar o dia) |
| F4    | +10 moedas (com a animação das moedas voando; dispara vitória ao chegar em 50)                  |
| F5    | mostra/esconde o FPS                                                                            |

Sem `?debug=1` nenhum desses atalhos fica ativo. Para testes automatizados, o jogo expõe `window.__game` (o `Phaser.Game`); o estado da partida fica em `__game.scene.getScene('Game').state`.

## Estrutura

```
src/
  main.ts                 # aguarda fontes, cria o Phaser.Game, expõe window.__game
  config/balance.ts       # TODAS as constantes de balanceamento
  config/layout.ts        # tamanho do mapa, zoom, profundidades
  content/dialogue.ts     # falas da NPC e pedidos dos fregueses
  style/palette.ts        # paleta do guia de estilo
  entities/               # Player, Walker (visual + sombra), Customer
  systems/                # relógio, horta, estado, texturas, mapa, áudio, juice
  scenes/                 # Boot, Title, Game, UI (HUD/diálogo/mini-jogo/pausa), End
```

## Créditos

- Código e arte gerada por código: projeto próprio (licença MIT).
- Fontes: [Kaisei Decol](https://fonts.google.com/specimen/Kaisei+Decol) e [Zen Maru Gothic](https://fonts.google.com/specimen/Zen+Maru+Gothic), via Google Fonts (SIL Open Font License).
- Sons sintetizados em tempo real com a Web Audio API.
- Nenhum asset externo (Kenney ou outro) foi usado.

## Decisões

Escolhas tomadas sem consulta, para registro:

- **Tiles e câmera:** o mapa tem 40×30 tiles lógicos de 32 px (1280×960) e a câmera segue o jogador com **zoom 1,5**, então cada tile aparece com 48 px na tela, como pede o guia de estilo. As texturas do mundo são desenhadas em 1,5× e exibidas em escala 1/1,5 para ficarem nítidas. Personagens aparecem com ~40×56 px na tela.
- **Relógio:** um dia vai de 06:00 a 24:00 em 4 minutos reais (4,5 min de jogo por segundo). Fases: Manhã 06–11, Tarde 11–16, Entardecer 16–19, Noite 19–24; o tint MULTIPLY é interpolado entre as fases (~1 h de jogo por transição). À meia-noite o dia vira sozinho: fade, o jogador acorda em frente de casa às 06:00 e a fila da casa de chá é esvaziada.
- **O relógio para** durante diálogos, o mini-jogo, o letreiro "Dia N" e a pausa.
- **Regra de crescimento:** plantar coloca a planta no estágio 1. Ela acumula tempo de jogo **só enquanto o canteiro está regado hoje** e sobe um estágio a cada 150 min regados (madura em 5 h de jogo, ~67 s reais). Se a meia-noite chegar no meio do caminho, o progresso fica guardado, mas só continua depois de regar no dia seguinte. Colher deixa a terra molhada, então replantar no mesmo dia já cresce.
- **Plantar e regar** são dois toques de Z separados; Z num canteiro já regado só informa o estágio.
- **Economia:** começa com 3 sementes de cada e 1 folha de cada (para dar para atender os primeiros fregueses). Colheita = +3 folhas e +1 semente.
- **Fregueses:** chegam a cada 95 min de jogo das 07:30 às 19:00 (8 por dia), no máximo 3 na fila, paciência de 200 min de jogo (~44 s reais). Pedido sorteado 50/50.
- **Mini-jogo:** 6 s reais para escolher. Acerto paga `2 + round(4 × tempo restante)`, de 2 a 6 moedas. Erro gasta a folha e não paga; tempo esgotado ou dispensar (X) não gasta folha. Se não houver nenhuma folha, o mini-jogo nem abre (aviso na tela). A opção sem folhas aparece apagada e não pode ser servida.
- **Vitória** acontece no momento em que as moedas chegam a 50, em qualquer dia.
- **R** reinicia só na pausa e nas telas finais, para ninguém perder a partida apertando sem querer durante o jogo. Na pausa, **M** volta ao título.
- **FPS em F5** (o guia sugere F3, mas aqui F3 avança o tempo, como pedido no briefing).
- **NPC:** "Dona Kiyoe", com uma fala de várias páginas por dia (dia 1, 2, 3); um "!" aparece sobre ela quando há fala nova no dia.
- **Iluminação:** vinheta de câmera (postFX, intensidade 0,2) + sprites de luz aditivos nas 6 lanternas de pedra, acesos à noite acima do overlay. Não usei `addGlow` para economizar GPU.
- **Partículas:** pétalas (≤ 40, de dia), vagalumes (≤ 30, à noite), e bursts de estrelinhas, folhas e gotas; 5 emissores na cena principal.
- **Input:** a cena do jogo lê Z/Espaço/X/Shift por evento de `keydown` (e não por `JustDown`), para não perder toques muito rápidos. O delta de cada frame é limitado a 50 ms para que uma aba em segundo plano não faça o tempo saltar.
- **Acessibilidade:** a opção "reduzir tremor/flash" fica na pausa (X) e zera o shake e o hit-flash branco.
- **Áudio:** efeitos sintetizados com Web Audio, iniciados no Espaço da tela de título. Não há música.
- **Paleta centralizada:** todas as cores (inclusive as derivadas, como pele morena, papel do shoji, planta seca e sombras de texto) ficam em `src/style/palette.ts`; nenhuma cena ou sistema usa hex solto.

## Próximos passos

- Música ambiente suave e sons de passos/água.
- Mais cultivos, um ciclo de compra de sementes e pedidos combinados (ex.: chimarrão + doce).
- Animação de caminhada com mais quadros e expressões nos fregueses.
- Interior da casa de chá e da casa do jogador.
- Controles por toque/mouse para jogar no celular.
- Testes automatizados da lógica pura (`systems/farm.ts`, `systems/clock.ts`).

## Licença

MIT © 2026 dunkelhai
