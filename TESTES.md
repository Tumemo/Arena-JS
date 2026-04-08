// CHECKLIST DE VERIFICAÇÃO E TESTES

✅ ESTRUTURA DE ARQUIVOS:

index.html                - HTML principal com estrutura
styles.css               - CSS separado
js/
  ├── config.js         - Configurações e variáveis globais ✓
  ├── particle.js       - Sistema de partículas ✓
  ├── projectile.js     - Sistema de projéteis ✓
  ├── fighter.js        - Classe do lutador ✓
  ├── ui.js             - Interface do usuário ✓
  ├── game.js           - Lógica principal ✓
  └── input.js          - Sistema de entrada ✓

README.md                - Documentação do projeto ✓
ESTRUTURA.md             - Documentação técnica ✓

// TESTES A REALIZAR:

1. CARREGAMENTO:
   □ Abrir index.html no navegador
   □ Verificar se carrega sem erros no console
   □ Verificar se canvas está visível

2. MENU PRINCIPAL:
   □ "JOGAR" deve iniciar o jogo
   □ "CONFIGURAÇÕES" deve abrir menu de configurações
   □ Botões têm hover effect

3. GAMEPLAY:
   □ Personagens aparecem na tela
   □ Player 1 (Backend-Frio) responde às teclas W/A/D/S/E/Q
   □ Player 2 (Frontend-Quente) responde às setas/Enter/Shift/Backspace
   □ Gravidade está funcionando (personagens caem)
   □ Colisão com personagens funciona
   □ Barras de saúde desaparecem com dano
   □ Timer reduz a cada segundo

4. COMBATE:
   □ Soco (E/Enter) gira o braço
   □ Chute (Shift/Chute) gira a perna
   □ Bloquear (Q/Backspace) reduz dano em 90%
   □ Agachar (S/Seta Baixo) altera hitbox
   □ Pulo (W/Seta Cima) faz personagem pular

5. HABILIDADES ESPECIAIS:
   □ Backend-Frio: Baixo + Frente + Soco = gelo
   □ Frontend-Quente: Trás + Trás + Soco = arpão
   □ Projéteis se movem corretamente
   □ Congelamento funciona (Backend-Frio no inimigo)
   □ Puxão funciona (Frontend-Quente puxa inimigo)

6. FATALITY:
   □ Quando saúde = 0, aparece "FINISH HIM!"
   □ Backend-Frio: Frente + Frente + Soco = congelamento + soco
   □ Frontend-Quente: Baixo + Baixo + Soco = jato de fogo
   □ Tela fica mais escura durante fatality
   □ Mensagem "WINS" + "FATALITY" aparece

7. CONFIGURAÇÕES:
   □ Abrir configurações
   □ Todos os botões de controle aparecem
   □ Clicar em botão permite remapear tecla
   □ Tempo de round pode ser alterado
   □ VOLTAR E SALVAR fecha e aplica mudanças

8. UI:
   □ Barra de saúde se atualiza em tempo real
   □ Barra especial (energy) se carrega/descarrega
   □ Nome dos lutadores aparece
   □ Timer conta para baixo
   □ Mensagens centrais ("FIGHT!", "FINISH HIM!", winner)
   □ Overlay de sangue aparece em finish him

9. PAUSA:
   □ Pressionar ESC ou P pausa o jogo
   □ Menu de pausa aparece
   □ "CONTINUAR" retoma o jogo
   □ "MENU PRINCIPAL" volta para início

10. RESPONSIVIDADE:
    □ Jogo redimensiona com a janela
    □ Personagens permanecem dentro da tela
    □ Canvas escala corretamente

11. CONSOLE:
    □ Nenhum erro "not defined"
    □ Nenhum erro de importação de módulos
    □ Nenhum erro de null pointer

// PROBLEMAS CONHECIDOS A VERIFICAR:

- Se fighter.update() é chamado corretamente em game.js
- Se Canvas context é passado para draw()
- Se particles recebem ctx em update()
- Se o timer está sincronizado com gameConfig.timeLimit

// PERFORMANCE:

□ FPS mantido em 60 com 100+ partículas
□ Sem lag ao lançar múltiplos projéteis
□ Memória não cresce indefinidamente
□ Partículas removidas quando alpha = 0
□ Projéteis removidos quando saem da tela

// ACESSIBILIDADE:

□ Controles podem ser remapeados
□ Texto legível em todo o jogo
□ Cores contrastantes
□ Feedback visual dos ataques

// PRÓXIMAS MELHORIAS RECOMENDADAS:

1. Adicionar suporte a gamepad
2. Sistema de sons e música
3. Mais personagens
4. IA para single player
5. Leaderboard/pontuação
6. Temas de cenários
7. More fatalities por personagem
8. Combos mais complexos
