// config.js - Configurações gerais do jogo

let gameConfig = { timeLimit: 60 };
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
