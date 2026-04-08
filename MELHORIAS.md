// MELHORIAS SUGERIDAS PARA O JOGO

// 1. SISTEMA DE PERSISTÊNCIA (LOCAL STORAGE)
function saveGameSettings() {
    const settings = {
        timeLimit: gameConfig.timeLimit,
        p1Keys: p1Keys,
        p2Keys: p2Keys,
        volume: 0.5, // futuro
        difficulty: 'normal' // futuro
    };
    localStorage.setItem('mortalKombatSettings', JSON.stringify(settings));
}

function loadGameSettings() {
    const saved = localStorage.getItem('mortalKombatSettings');
    if (saved) {
        const settings = JSON.parse(saved);
        gameConfig.timeLimit = settings.timeLimit;
        p1Keys = settings.p1Keys;
        p2Keys = settings.p2Keys;
        updateKeyMaps();
    }
}

// 2. SISTEMA DE COMBOS EXPANDIDO
class ComboSystem {
    constructor() {
        this.combos = {
            'subzero': {
                'iceball': ['down', 'forward', 'punch'],
                'fatality': ['forward', 'forward', 'punch'],
                'uppercut': ['down', 'punch'],
                'slide': ['back', 'down', 'kick']
            },
            'scorpion': {
                'spear': ['back', 'back', 'punch'],
                'fatality': ['down', 'down', 'punch'],
                'teleport': ['down', 'back', 'punch'],
                'fireball': ['down', 'forward', 'punch']
            }
        };
    }

    checkCombo(fighter, inputs) {
        const fighterCombos = this.combos[fighter.name.toLowerCase()];
        for (let comboName in fighterCombos) {
            const combo = fighterCombos[comboName];
            if (this.matchCombo(inputs, combo)) {
                return comboName;
            }
        }
        return null;
    }

    matchCombo(inputs, combo) {
        if (inputs.length < combo.length) return false;
        const lastInputs = inputs.slice(-combo.length);
        return lastInputs.every((input, index) => input === combo[index]);
    }
}

// 3. SISTEMA DE TEMPO DINÂMICO
class TimeManager {
    constructor() {
        this.roundTime = 60;
        this.currentTime = this.roundTime;
        this.isInfinite = false;
        this.speedMultiplier = 1.0;
        this.paused = false;
    }

    setTimeLimit(seconds) {
        this.roundTime = seconds;
        this.currentTime = seconds;
        this.isInfinite = seconds === Infinity;
    }

    update() {
        if (this.paused || this.isInfinite || matchState !== 'fighting') return;

        this.currentTime -= (1/60) * this.speedMultiplier; // 60 FPS
        if (this.currentTime <= 0) {
            this.currentTime = 0;
            // Timeout logic
        }
    }

    getDisplayTime() {
        if (this.isInfinite) return '∞';
        return Math.ceil(this.currentTime);
    }

    pause() { this.paused = true; }
    resume() { this.paused = false; }
    reset() { this.currentTime = this.roundTime; }
}

// 4. SISTEMA DE ATAQUES MELHORADO
class AttackSystem {
    constructor() {
        this.attacks = {
            'punch': {
                damage: 10,
                range: 110,
                speed: 0.3,
                stun: 5,
                type: 'normal'
            },
            'kick': {
                damage: 15,
                range: 130,
                speed: 0.4,
                stun: 8,
                type: 'normal'
            },
            'uppercut': {
                damage: 20,
                range: 80,
                speed: 0.5,
                stun: 15,
                type: 'launcher',
                launchHeight: 13
            },
            'sweep': {
                damage: 10,
                range: 140,
                speed: 0.6,
                stun: 20,
                type: 'knockdown'
            }
        };
    }

    getAttackData(attackType) {
        return this.attacks[attackType] || this.attacks['punch'];
    }

    calculateDamage(baseDamage, attacker, defender) {
        let multiplier = 1.0;

        // Modificadores de dano
        if (defender.isBlocking) multiplier *= 0.1;
        if (defender.isCrouching && attackType === 'uppercut') multiplier *= 1.5;
        if (attacker.isAirborne) multiplier *= 1.2;

        // Critical hits
        if (Math.random() < 0.05) multiplier *= 2.0; // 5% chance

        return Math.floor(baseDamage * multiplier);
    }
}

// 5. SISTEMA DE ÁUDIO (BASE)
class AudioManager {
    constructor() {
        this.volume = 0.5;
        this.sounds = {};
        this.music = null;
    }

    loadSound(name, url) {
        // Simulação - em produção usaria Web Audio API
        this.sounds[name] = { url, loaded: false };
    }

    playSound(name) {
        if (!this.sounds[name]) return;
        // Simulação de reprodução
        console.log(`Playing sound: ${name}`);
    }

    playMusic(track) {
        // Simulação
        console.log(`Playing music: ${track}`);
    }

    setVolume(level) {
        this.volume = Math.max(0, Math.min(1, level));
    }
}

// 6. SISTEMA DE PARTÍCULAS MELHORADO
class ParticleManager {
    constructor() {
        this.particles = [];
        this.maxParticles = 200;
    }

    createParticle(x, y, type, color, count = 1) {
        if (this.particles.length >= this.maxParticles) return;

        for (let i = 0; i < count; i++) {
            const particle = new Particle(x, y, color, type);
            this.particles.push(particle);
        }
    }

    createBloodSplatter(x, y, intensity = 1) {
        const bloodCount = 15 * intensity;
        this.createParticle(x, y, 'blood', '#ff0000', bloodCount);
    }

    createImpactEffect(x, y, type) {
        switch(type) {
            case 'punch':
                this.createParticle(x, y, 'spark', '#ffff00', 8);
                break;
            case 'kick':
                this.createParticle(x, y, 'spark', '#ffaa00', 12);
                break;
            case 'special':
                this.createParticle(x, y, 'glow', '#00ffff', 20);
                break;
        }
    }

    update(ctx) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(ctx);
            if (this.particles[i].alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
}

// 7. SISTEMA DE IA BÁSICA (PARA SINGLE PLAYER)
class AIController {
    constructor(fighter, difficulty = 'easy') {
        this.fighter = fighter;
        this.difficulty = difficulty;
        this.reactionTime = this.getReactionTime();
        this.lastAction = 0;
        this.targetDistance = 100;
    }

    getReactionTime() {
        switch(this.difficulty) {
            case 'easy': return 500;
            case 'normal': return 300;
            case 'hard': return 150;
            default: return 300;
        }
    }

    update(opponent) {
        const now = Date.now();
        if (now - this.lastAction < this.reactionTime) return;

        const distance = Math.abs(this.fighter.position.x - opponent.position.x);
        const direction = this.fighter.position.x < opponent.position.x ? 'right' : 'left';

        // Lógica básica de IA
        if (distance > 200) {
            // Aproximar
            this.performAction(direction);
        } else if (distance < 80) {
            // Recuar
            this.performAction(direction === 'right' ? 'left' : 'right');
        } else {
            // Atacar
            if (Math.random() < 0.3) {
                this.performAction('punch');
            } else if (Math.random() < 0.1) {
                this.performAction('kick');
            }
        }

        this.lastAction = now;
    }

    performAction(action) {
        // Simular entrada do jogador
        handleAction(this.fighter, action);
    }
}

// 8. SISTEMA DE CENÁRIOS
class StageManager {
    constructor() {
        this.currentStage = 'arena';
        this.stages = {
            'arena': {
                background: 'radial-gradient(circle, #2a0000 0%, #000 100%)',
                floorColor: '#3a3a40',
                specialEffects: null
            },
            'temple': {
                background: 'linear-gradient(to bottom, #1a1a2a, #0a0a1a)',
                floorColor: '#2a2a30',
                specialEffects: 'temple'
            }
        };
    }

    setStage(stageName) {
        if (this.stages[stageName]) {
            this.currentStage = stageName;
            this.applyStageEffects();
        }
    }

    applyStageEffects() {
        const stage = this.stages[this.currentStage];
        document.body.style.background = stage.background;

        // Aplicar efeitos especiais do cenário
        switch(this.currentStage) {
            case 'temple':
                // Adicionar partículas de poeira ou efeitos especiais
                break;
        }
    }

    getFloorColor() {
        return this.stages[this.currentStage].floorColor;
    }
}

// 9. SISTEMA DE PONTUAÇÃO
class ScoreManager {
    constructor() {
        this.score = { player1: 0, player2: 0 };
        this.rounds = { player1: 0, player2: 0 };
        this.maxRounds = 3;
    }

    addPoints(player, points) {
        this.score[player] += points;
    }

    winRound(winner) {
        this.rounds[winner]++;
        this.addPoints(winner, 100);

        if (this.rounds[winner] >= this.maxRounds) {
            return true; // Game over
        }
        return false;
    }

    getWinner() {
        if (this.rounds.player1 > this.rounds.player2) return 'player1';
        if (this.rounds.player2 > this.rounds.player1) return 'player2';
        return null; // Tie
    }

    reset() {
        this.score = { player1: 0, player2: 0 };
        this.rounds = { player1: 0, player2: 0 };
    }
}

// 10. MELHORIAS DE PERFORMANCE
class PerformanceManager {
    constructor() {
        this.fps = 60;
        this.frameCount = 0;
        this.lastTime = 0;
        this.frameTime = 1000 / 60;
    }

    update() {
        const now = performance.now();
        const delta = now - this.lastTime;

        if (delta >= this.frameTime) {
            this.frameCount++;
            this.lastTime = now - (delta % this.frameTime);
            return true; // Render frame
        }
        return false; // Skip frame
    }

    getFPS() {
        return Math.round(1000 / this.frameTime);
    }
}

// IMPLEMENTAÇÃO RECOMENDADA:

// 1. Adicionar ao config.js:
const comboSystem = new ComboSystem();
const timeManager = new TimeManager();
const attackSystem = new AttackSystem();
const audioManager = new AudioManager();
const particleManager = new ParticleManager();
const stageManager = new StageManager();
const scoreManager = new ScoreManager();
const performanceManager = new PerformanceManager();

// 2. Modificar initGame() em game.js:
function initGame() {
    // ... código existente ...
    loadGameSettings(); // Carregar configurações salvas
    timeManager.setTimeLimit(gameConfig.timeLimit);
    stageManager.setStage('arena');
}

// 3. Modificar save/load em ui.js:
function closeSettings() {
    applySettings();
    saveGameSettings(); // Salvar configurações
    document.getElementById('settings-menu').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
}

// 4. Modificar handleAction em game.js:
function handleAction(fighter, cmd) {
    // ... código existente ...

    // Verificar combos expandidos
    const comboResult = comboSystem.checkCombo(fighter, fighter.inputs);
    if (comboResult) {
        switch(comboResult) {
            case 'iceball':
                fighter.specialIceball();
                break;
            case 'spear':
                fighter.specialSpear();
                break;
            case 'slide':
                fighter.slideKick();
                break;
            // ... outros combos
        }
        return;
    }

    // ... resto do código ...
}

// 5. Modificar animate() em game.js:
function animate() {
    if (!gameActive) return;

    if (!performanceManager.update()) {
        animationFrameId = window.requestAnimationFrame(animate);
        return;
    }

    // ... código existente ...

    // Usar particleManager
    particleManager.update(ctx);

    // Atualizar tempo
    timeManager.update();
    document.querySelector('#timer').innerHTML = timeManager.getDisplayTime();

    // ... resto do código ...
}

// 6. Adicionar novos métodos ao Fighter:
Fighter.prototype.slideKick = function() {
    if (this.attackCooldown || this.isImmobilized) return;
    this.executeAttack(150, 30, {x: 0, y: 80}, 'slide', 18, 1000);
    this.velocity.x = this.isFacingRight ? 20 : -20;
};

// 7. Modificar takeHit para usar attackSystem:
takeHit(damage, hitType = 'normal') {
    const attackData = attackSystem.getAttackData(hitType);
    const actualDamage = attackSystem.calculateDamage(damage, attacker, this);

    // ... resto do código usando actualDamage ...
}

// 8. Adicionar efeitos sonoros:
function playHitSound(type) {
    switch(type) {
        case 'punch': audioManager.playSound('punch_hit'); break;
        case 'kick': audioManager.playSound('kick_hit'); break;
        case 'special': audioManager.playSound('special_hit'); break;
    }
}

// 9. Sistema de achievements básicos:
const achievements = {
    'first_blood': { name: 'Primeiro Sangue', description: 'Cause dano pela primeira vez', unlocked: false },
    'fatality_master': { name: 'Mestre da Morte', description: 'Execute 10 fatalities', unlocked: false, count: 0 },
    'combo_king': { name: 'Rei dos Combos', description: 'Faça um combo de 5 golpes', unlocked: false }
};

function checkAchievements(event) {
    switch(event) {
        case 'first_damage':
            if (!achievements.first_blood.unlocked) {
                achievements.first_blood.unlocked = true;
                showAchievement('first_blood');
            }
            break;
        case 'fatality':
            achievements.fatality_master.count++;
            if (achievements.fatality_master.count >= 10 && !achievements.fatality_master.unlocked) {
                achievements.fatality_master.unlocked = true;
                showAchievement('fatality_master');
            }
            break;
    }
}

function showAchievement(id) {
    const achievement = achievements[id];
    showCentralMessage(`🏆 ${achievement.name}!`, 3000);
    // Salvar no localStorage
    const savedAchievements = JSON.parse(localStorage.getItem('achievements') || '{}');
    savedAchievements[id] = true;
    localStorage.setItem('achievements', JSON.stringify(savedAchievements));
}

// 10. Menu de seleção de personagem (base):
function createCharacterSelect() {
    const characters = [
        { id: 'subzero', name: 'Sub-Zero', color: '#0066cc' },
        { id: 'scorpion', name: 'Scorpion', color: '#ffaa00' },
        // Futuros: { id: 'raiden', name: 'Raiden', color: '#ffff00' }
    ];

    // Criar UI de seleção
    // ...
}

// 11. Sistema de replay básico:
class ReplaySystem {
    constructor() {
        this.recording = false;
        this.frames = [];
        this.maxFrames = 3600; // 60 segundos
    }

    startRecording() {
        this.recording = true;
        this.frames = [];
    }

    recordFrame(frameData) {
        if (!this.recording) return;
        this.frames.push(frameData);
        if (this.frames.length > this.maxFrames) {
            this.frames.shift();
        }
    }

    stopRecording() {
        this.recording = false;
    }

    playReplay() {
        // Reproduzir frames gravados
        // ...
    }
}

// 12. Melhorias na UI:
function createHUD() {
    // Adicionar combo counter
    // Adicionar damage meter
    // Adicionar round indicator
    // Adicionar achievement notifications
}

// 13. Sistema de dificuldade dinâmica:
class DifficultyManager {
    constructor() {
        this.level = 'normal';
        this.adjustments = {
            'easy': { damage: 0.8, ai_reaction: 1.5, health: 1.2 },
            'normal': { damage: 1.0, ai_reaction: 1.0, health: 1.0 },
            'hard': { damage: 1.2, ai_reaction: 0.7, health: 0.8 }
        };
    }

    applyDifficulty() {
        const adj = this.adjustments[this.level];
        // Modificar dano, velocidade da IA, vida dos personagens
    }
}

// 14. Sistema de power-ups (futuro):
const powerUps = {
    'health_boost': { name: 'Poção de Vida', effect: 'health', value: 20 },
    'speed_boost': { name: 'Velocidade', effect: 'speed', value: 1.5, duration: 10000 },
    'damage_boost': { name: 'Força', effect: 'damage', value: 1.3, duration: 15000 }
};

// 15. Estatísticas do jogador:
class StatsManager {
    constructor() {
        this.stats = {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            totalDamage: 0,
            fatalities: 0,
            specialMoves: 0,
            playTime: 0
        };
    }

    loadStats() {
        const saved = localStorage.getItem('playerStats');
        if (saved) {
            this.stats = JSON.parse(saved);
        }
    }

    saveStats() {
        localStorage.setItem('playerStats', JSON.stringify(this.stats));
    }

    recordGame(won, damage, fatalities, specials, time) {
        this.stats.gamesPlayed++;
        if (won) this.stats.wins++;
        else this.stats.losses++;

        this.stats.totalDamage += damage;
        this.stats.fatalities += fatalities;
        this.stats.specialMoves += specials;
        this.stats.playTime += time;

        this.saveStats();
    }
}

// PRIORIDADE DE IMPLEMENTAÇÃO:

1. ✅ SISTEMA DE PERSISTÊNCIA (localStorage) - ESSENCIAL
2. 🔄 SISTEMA DE COMBOS EXPANDIDO - IMPORTANTE
3. 🔄 GERENCIADOR DE TEMPO MELHORADO - IMPORTANTE
4. 🔄 SISTEMA DE ATAQUES BALANCEADO - IMPORTANTE
5. 🔄 ÁUDIO BÁSICO - MELHORA QUALIDADE
6. 🔄 PARTÍCULAS OTIMIZADAS - PERFORMANCE
7. 🔄 IA BÁSICA - SINGLE PLAYER
8. 🔄 MÚLTIPLOS CENÁRIOS - VARIedade
9. 🔄 SISTEMA DE PONTUAÇÃO - COMPETIÇÃO
10. 🔄 OTIMIZAÇÃO DE PERFORMANCE - ESCALABILIDADE
11. 🔄 ACHIEVEMENTS - ENGAGEMENT
12. 🔄 SELEÇÃO DE PERSONAGEM - VARIedade
13. 🔄 SISTEMA DE REPLAY - ANÁLISE
14. 🔄 POWER-UPS - PROFUNDIDADE
15. 🔄 ESTATÍSTICAS - PROGRESSÃO

// CONCLUSÃO:
// Comece pelas melhorias 1-4 (persistência, combos, tempo, balanceamento)
// Elas são fundamentais para uma boa experiência de jogo.
// Depois adicione áudio e partículas para polimento visual.
// Por último, features avançadas como IA e achievements.