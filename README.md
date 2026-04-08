# Mortal Kombat JS - V8 Colisão

Um jogo de luta em 2D desenvolvido com JavaScript puro e Canvas HTML5.

## 📁 Estrutura do Projeto

```
PortalFreela/
├── index.html              # Arquivo HTML principal com estrutura do jogo
├── styles.css              # Estilos CSS do jogo
├── js/
│   ├── config.js           # Configurações e variáveis globais
│   ├── particle.js         # Sistema de partículas (sangue, fogo, etc)
│   ├── projectile.js       # Sistema de projéteis (gelo, arpão, fogo)
│   ├── fighter.js          # Classe do lutador/personagem
│   ├── ui.js               # Interface do usuário e configurações
│   ├── game.js             # Lógica principal do jogo
│   └── input.js            # Sistema de entrada de teclado
└── README.md               # Este arquivo
```

## 🎮 Personagens

### Sub-Zero
- **Cor:** Azul (#0066cc)
- **Habilidade Especial:** Projétil de Gelo
- **Fatality:** Soco de congelamento duplo

### Scorpion
- **Cor:** Laranja (#ffaa00)
- **Habilidade Especial:** Arpão (puxa o inimigo)
- **Fatality:** Jato de fogo

## ⌨️ Controles Padrão

### Player 1 (Sub-Zero)
- **W** - Pular
- **A/D** - Mover esquerda/direita
- **S** - Agachar
- **ESPAÇO** - Soco
- **E** - Chute
- **Q** - Defesa/Bloquear

### Player 2 (Scorpion)
- **SETA CIMA** - Pular
- **SETA ESQ/DIR** - Mover esquerda/direita
- **SETA BAIXO** - Agachar
- **ENTER** - Soco
- **SHIFT** - Chute
- **BACKSPACE** - Defesa/Bloquear

## 🎯 Combos

### Sub-Zero
- **Gelo:** Baixo + Frente + Soco
- **Fatality:** Frente + Frente + Soco (próximo do inimigo)

### Scorpion
- **Arpão:** Trás + Trás + Soco
- **Fatality:** Baixo + Baixo + Soco (qualquer lugar)

## 📋 Descrição dos Arquivos

### index.html
Estrutura HTML do jogo com:
- Menu principal
- Menu de pausa
- Menu de configurações
- Interface do jogo (barras de saúde, timer)
- Canvas para renderização
- Importação dos arquivos JavaScript

### styles.css
Estilos completos do jogo:
- Layout dos elementos
- Estilo dos botões
- Barras de saúde e energia
- Animações (piscar, efeitos)
- Temas de cores

### config.js
Configurações globais:
- Mapeamento de teclas para P1 e P2
- Estado das teclas pressionadas
- Variáveis de controle do jogo
- Configurações gerais (gravidade, tempo, etc)

### particle.js
Sistema de partículas:
- Classe `Particle` para efeitos visuais
- Tipos: sangue, fogo, brilho, faísca, estilhaço
- Física de partículas (gravidade, velocidade)
- Renderização com efeitos visuais

### projectile.js
Sistema de projéteis:
- Classe `Projectile` para objetos lançados
- Tipos: gelo, arpão, fogo
- Renderização customizada por tipo
- Movimento e detecção de colisão

### fighter.js
Classe principal do lutador:
- Propriedades: saúde, posição, velocidade
- Estados: pulando, agachado, bloqueando, atacando
- Animações completas
- Sistema de ataques (soco, chute, especiais)
- Fatalities (movimentos finais)
- Efeitos especiais (congelamento, queimadura)

### ui.js
Interface e Configurações:
- Menu de controles
- Detecção de atalhos de teclado
- Atualização da barra de saúde
- Mensagens centrais
- Funções de abrir/fechar menus

### game.js
Lógica principal do jogo:
- Loop de animação
- Física e gravidade
- Detecção de colisões
- Resolução de ataques
- Estados do jogo (luta, finish him, fatality)
- Funções de início/pausa/fim
- Renderização do cenário

### input.js
Sistema de entrada:
- Event listeners para teclado
- Mapeamento de teclas para ações
- Integração com o sistema de combos

## 🔧 Como Adicionar Novos Personagens

1. Abra `fighter.js` e crie uma nova instância em `game.js`
2. Customize em `config.js` os controles e cores
3. Adicione as funções de fatality em `game.js`
4. Atualize a animação de desenho em `fighter.js`

## 🐛 Manutenção

Os arquivos estão bem separados por responsabilidade, facilitando:
- **Correção de bugs:** Identificar exatamente qual arquivo alternar
- **Novas features:** Adicionar funcionalidades em arquivos específicos
- **Performance:** Otimizar arquivos individuais
- **Reutilização:** Importar classes em outros projetos

## 🚀 Melhorias Futuras

- [ ] Adicionar mais personagens
- [ ] Expandir combos e especiais
- [ ] Sistema de ranking/pontuação
- [ ] Modo single player com IA
- [ ] Sons e música
- [ ] Temas de cenários diferentes
- [ ] Mobile touch controls

## 📝 Licença

Projeto educacional de demonstração.
