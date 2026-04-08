// config.js - Configurações gerais do jogo

let gameConfig = { timeLimit: 60 };
const characterRoster = [
    {
        id: 'backend-frio',
        name: 'Backend-Frio',
        color: '#0066cc',
        baseColor: '#111',
        skinColor: '#ffccaa',
        accent: '#00e1ff',
        archetype: 'ninja'
    },
    {
        id: 'frontend-quente',
        name: 'Frontend-Quente',
        color: '#ffaa00',
        baseColor: '#1a0d00',
        skinColor: '#f7c79a',
        accent: '#ff5500',
        archetype: 'ninja'
    },
    {
        id: 'python-trovao',
        name: 'Python-Trovao',
        color: '#f3f7ff',
        baseColor: '#2f3f68',
        skinColor: '#d8c1a6',
        accent: '#87c8ff',
        archetype: 'storm_python'
    },
    {
        id: 'kernel-corte',
        name: 'Kernel-Corte',
        color: '#3a3a3a',
        baseColor: '#0f0f0f',
        skinColor: '#bca285',
        accent: '#ff1a1a',
        archetype: 'cyber_commando'
    }
];
let selectedCharacters = {
    p1: characterRoster[0].id,
    p2: characterRoster[1].id
};
let p1Keys = { up: 'w', down: 's', left: 'a', right: 'd', punch: ' ', kick: 'e', block: 'q' };
let p2Keys = { up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright', punch: 'enter', kick: 'shift', block: 'backspace' };
let keyMapP1 = {}; 
let keyMapP2 = {};
const keysStateP1 = { up:false, down:false, left:false, right:false, punch:false, kick:false, block:false };
const keysStateP2 = { up:false, down:false, left:false, right:false, punch:false, kick:false, block:false };
const actionLabels = { up: 'Pular', down: 'Agachar', left: 'Esquerda', right: 'Direita', punch: 'Soco', kick: 'Chute', block: 'Defesa' };

const globalGravity = 1.2;
let particles = [];
let projectiles = [];

// Estados do jogo
let matchState = 'fighting'; // fighting, finish_him, fatality, game_over
let finishHimTimerFrames = 0;

// Variáveis de controle
let timer = 60;
let timerId;
let gameActive = false;
let isPaused = false;
let animationFrameId;
let listeningKeyBtn = null;
