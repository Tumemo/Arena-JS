// MAPA DE DEPENDÊNCIAS E ORGANIZAÇÃO DO PROJETO

/*
FLUXO DE CARREGAMENTO:

1. index.html carrega primeiramente todos os JS em ordem:
   - config.js (variáveis globais)
   - particle.js (classe Particle)
   - projectile.js (classe Projectile)
   - fighter.js (classe Fighter)
   - ui.js (funções de UI)
   - game.js (lógica principal)
   - input.js (listeners de teclado)

2. Após DOM ready, inicia:
   - initGame() -> cria canvas e lutadores
   - drawBackground() -> desenha cenário
   - buildSettingsUI() -> constrói menu de controles

3. Fluxo de jogo:
   - startGame() -> inicia match
   - animate() -> loop principal
   - handleAction() -> processa ações dos jogadores
   - takeHit() -> aplica dano
   - animate() chama:
     * player.update()
     * enemy.update()
     * particle updates
     * projectile updates
     * collision detection
*/

// ESTRUTURA DE ARQUIVOS:

config.js:
  - Variáveis de configuração globais
  - Estados das teclas
  - Mapas de teclado
  - Constantes do jogo

particle.js:
  - Classe Particle
  - Tipos: blood, fire, glow, spark, shatter
  - Métodos: draw(), update()

projectile.js:
  - Classe Projectile
  - Tipos: ice, spear, fire
  - Métodos: draw(), update()

fighter.js:
  - Classe Fighter (MAIOR ARQUIVO)
  - Estados, animações, combate
  - Métodos: attackPunch(), attackKick(), specialIceball(), specialSpear()
  - Métodos: draw(), update(), takeHit()

ui.js:
  - Funções de interface
  - formatKeyName(), buildSettingsUI()
  - applySettings(), openSettings(), closeSettings()
  - listenForKey(), updateKeyMaps()
  - showCentralMessage(), updateHealthUI()

game.js:
  - Variáveis: canvas, ctx, floorY, player, enemy
  - Função initGame() - inicializa o jogo
  - drawBackground() - renderiza cenário
  - checkMatchState() - verifica estado da partida
  - endGameWithWinner() - finaliza jogo
  - executeBackendFrioFatality(), executeFrontendQuenteFatality()
  - attackCollision(), resolveCharacterCollision()
  - decreaseTimer(), processMovement(), handleAction()
  - animate() - LOOP PRINCIPAL
  - resetGameState(), startGame(), togglePause(), quitToMenu()

input.js:
  - Listeners de keydown/keyup
  - Mapeia teclas para ações
  - Integração com combos

// COMO ADICIONAR NOVOS ELEMENTOS:

NOVO PERSONAGEM:
  1. Expandir Fighter com novas propriedades em fighter.js
  2. Adicionar controles em config.js
  3. Criar instância em game.js (na função initGame)
  4. Adicionar fatality em game.js
  5. Adicionar animações em fighter.js::draw()

NOVO TIPO DE PARTÍCULA:
  1. Adicionar tipo em particle.js constructor
  2. Customizar velocidade e cor
  3. Usar: particles.push(new Particle(...))

NOVO TIPO DE PROJÉTIL:
  1. Adicionar tipo em projectile.js draw()
  2. Criar renderização customizada
  3. Usar: projectiles.push(new Projectile(...))

NOVO ATAQUE ESPECIAL:
  1. Criar método em Fighter (ex: specialFireball())
  2. Chamar em handleAction() com combo detection
  3. Usar projectiles.push() para lançar

// VARIÁVEIS GLOBAIS IMPORTANTES (config.js):

gameConfig { timeLimit }           - Configuração de tempo
matchState                         - Estado atual (fighting, finish_him, fatality, game_over)
particles []                       - Array de partículas ativas
projectiles []                     - Array de projéteis ativos
canvas, ctx, floorY                - Elementos do jogo
player, enemy                      - Instâncias dos lutadores
timer                              - Tempo restante
gameActive, isPaused               - Estados de controle

// OTIMIZAÇÕES POSSÍVEIS:

- Usar object pooling para partículas (reutilizar em vez de criar/deletar)
- Cache de sprites/imagens em vez de desenhar geometrias
- Webworkers para physics
- RequestAnimationFrame já otimizado
- Remover partículas e projéteis antigos do array
- Usar bit flags para estados de lutador

// ORDEM DE PRIORIDADE NA EDIÇÃO:

1. Prioritário: game.js (lógica)
2. Importante: fighter.js (mecânicas)
3. Importante: config.js (valores)
4. Moderado: ui.js (interface)
5. Menor: particle.js, projectile.js (efeitos)
6. Menor: input.js (muito simples)
