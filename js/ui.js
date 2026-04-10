// ui.js - Interface de usuário e configurações

function formatKeyName(key) {
    if(key === ' ') return 'ESPAÇO';
    if (key && key.startsWith('gp_btn_')) return `GP BTN ${key.replace('gp_btn_', '')}`;
    if (key === 'gp_axis_left') return 'GP ANALOGICO ESQ';
    if (key === 'gp_axis_right') return 'GP ANALOGICO DIR';
    if (key === 'gp_axis_up') return 'GP ANALOGICO CIMA';
    if (key === 'gp_axis_down') return 'GP ANALOGICO BAIXO';
    if(key.startsWith('arrow')) return 'SETA ' + key.replace('arrow', '').toUpperCase();
    return key.toUpperCase();
}

function saveSettingsToStorage() {
    const payload = {
        timeLimit: gameConfig.timeLimit,
        p1Keys,
        p2Keys,
        inputSource,
        sfxEnabled
    };
    localStorage.setItem('arena-js-settings', JSON.stringify(payload));
}

function loadSettingsFromStorage() {
    const raw = localStorage.getItem('arena-js-settings');
    if (!raw) return;
    try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.timeLimit !== undefined) {
            gameConfig.timeLimit = parsed.timeLimit;
            const timeSelect = document.getElementById('time-select');
            if (timeSelect) timeSelect.value = String(parsed.timeLimit);
        }
        if (parsed && parsed.p1Keys) p1Keys = { ...p1Keys, ...parsed.p1Keys };
        if (parsed && parsed.p2Keys) p2Keys = { ...p2Keys, ...parsed.p2Keys };
        if (parsed && parsed.inputSource) inputSource = { ...inputSource, ...parsed.inputSource };
        if (parsed && parsed.sfxEnabled !== undefined) sfxEnabled = !!parsed.sfxEnabled;
        updateKeyMaps();
        syncInputSourceSelects();
    } catch (err) {
        console.warn('Falha ao carregar settings salvas.', err);
    }
}

function getCharacterByIdUI(id) {
    return characterRoster.find((char) => char.id === id) || characterRoster[0];
}

let selectionActiveSlot = 'p1';
let selectionCursor = { p1: 0, p2: 1 };
let selectedReady = { p1: false, p2: false };
let inputSource = { p1: 'auto', p2: 'keyboard' };
let sfxContext = null;
let sfxEnabled = true;

function getSfxContext() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!sfxContext) sfxContext = new Ctx();
    if (sfxContext.state === 'suspended') sfxContext.resume();
    return sfxContext;
}

function unlockSfxContext() {
    const audio = getSfxContext();
    if (!audio) return;
    if (audio.state === 'suspended') audio.resume();
}

function playTone(freq = 440, duration = 0.08, type = 'square', volume = 0.03, sweepTo = null) {
    const audio = getSfxContext();
    if (!audio) return;
    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, sweepTo), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
}

function playSfx(name) {
    if (!sfxEnabled) return;
    if (name === 'menu_move') playTone(560, 0.06, 'square', 0.08, 700);
    else if (name === 'menu_confirm') playTone(820, 0.08, 'triangle', 0.12, 560);
    else if (name === 'ready') {
        playTone(780, 0.06, 'square', 0.11, 980);
        setTimeout(() => playTone(980, 0.08, 'square', 0.12, 1200), 50);
    } else if (name === 'fight_start') {
        playTone(280, 0.10, 'sawtooth', 0.13, 420);
        setTimeout(() => playTone(420, 0.14, 'sawtooth', 0.13, 760), 80);
    } else if (name === 'punch') playTone(160, 0.06, 'square', 0.12, 120);
    else if (name === 'kick') playTone(130, 0.08, 'square', 0.13, 100);
    else if (name === 'special') playTone(240, 0.14, 'sawtooth', 0.14, 520);
    else if (name === 'hit') playTone(95, 0.06, 'square', 0.15, 70);
    else if (name === 'block_hit') playTone(210, 0.05, 'triangle', 0.12, 170);
    else if (name === 'spear_cast') playTone(760, 0.08, 'square', 0.16, 220);
    else if (name === 'spear_hit') playTone(120, 0.07, 'square', 0.18, 80);
    else if (name === 'ice_cast') playTone(640, 0.1, 'triangle', 0.14, 410);
    else if (name === 'ice_hit') playTone(420, 0.07, 'triangle', 0.15, 300);
    else if (name === 'thunder_cast') playTone(300, 0.14, 'sawtooth', 0.17, 90);
    else if (name === 'thunder_hit') playTone(180, 0.12, 'sawtooth', 0.18, 70);
    else if (name === 'fire_cast') playTone(520, 0.1, 'sawtooth', 0.15, 250);
    else if (name === 'fire_hit') playTone(260, 0.08, 'sawtooth', 0.16, 130);
    else if (name === 'fan_cast') playTone(880, 0.06, 'triangle', 0.14, 560);
    else if (name === 'fan_hit') playTone(450, 0.05, 'triangle', 0.15, 260);
    else if (name === 'orb_cast') playTone(700, 0.08, 'square', 0.15, 430);
    else if (name === 'orb_hit') playTone(320, 0.07, 'square', 0.16, 180);
    else if (name === 'slide_cast') playTone(190, 0.08, 'square', 0.15, 120);
    else if (name === 'teleport_cast') playTone(980, 0.07, 'triangle', 0.14, 280);
    else if (name === 'pause') playTone(310, 0.08, 'triangle', 0.1, 240);
    else if (name === 'resume') playTone(260, 0.08, 'triangle', 0.1, 360);
    else if (name === 'finish_him') {
        playTone(170, 0.12, 'sawtooth', 0.14, 140);
        setTimeout(() => playTone(120, 0.14, 'sawtooth', 0.14, 90), 90);
    } else if (name === 'win') {
        playTone(520, 0.08, 'triangle', 0.12, 680);
        setTimeout(() => playTone(680, 0.10, 'triangle', 0.12, 920), 80);
    }
}

function renderCharacterSelection() {
    const p1Container = document.getElementById('p1-char-list');
    const p2Container = document.getElementById('p2-char-list');
    const sameCharWarning = document.getElementById('same-char-warning');
    const startBtn = document.getElementById('start-match-btn');
    const p1SlotBtn = document.getElementById('slot-p1-btn');
    const p2SlotBtn = document.getElementById('slot-p2-btn');
    const p1ReadyEl = document.getElementById('p1-ready-status');
    const p2ReadyEl = document.getElementById('p2-ready-status');
    if (!p1Container || !p2Container || !startBtn) return;

    const createCard = (char, slot) => {
        const isSelected = selectedCharacters[slot] === char.id;
        const cursorIndex = selectionCursor[slot];
        const thisIndex = characterRoster.findIndex((item) => item.id === char.id);
        const isFocused = selectionActiveSlot === slot && cursorIndex === thisIndex;
        const portrait = getCharacterPortraitHTML(char);
        return `<button class="char-card ${isSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''}" onclick="selectCharacter('${slot}', '${char.id}')" style="--char-main:${char.color}; --char-base:${char.baseColor}; --char-skin:${char.skinColor}; --char-accent:${char.accent};">
            ${portrait}
            <span class="char-name">${char.name}</span>
            <span class="char-special">${getSpecialText(char.id)}</span>
        </button>`;
    };

    p1Container.innerHTML = characterRoster.map((char) => createCard(char, 'p1')).join('');
    p2Container.innerHTML = characterRoster.map((char) => createCard(char, 'p2')).join('');

    const sameCharacter = selectedCharacters.p1 === selectedCharacters.p2;
    sameCharWarning.style.display = sameCharacter ? 'block' : 'none';
    const canStart = canStartMatch();
    startBtn.disabled = !canStart;
    startBtn.innerText = canStart ? 'INICIAR LUTA' : 'AGUARDANDO PRONTOS';
    if (p1ReadyEl) p1ReadyEl.innerText = selectedReady.p1 ? 'PRONTO' : 'ESCOLHENDO';
    if (p2ReadyEl) p2ReadyEl.innerText = selectedReady.p2 ? 'PRONTO' : 'ESCOLHENDO';
    if (p1SlotBtn && p2SlotBtn) {
        p1SlotBtn.classList.toggle('active-slot', selectionActiveSlot === 'p1');
        p2SlotBtn.classList.toggle('active-slot', selectionActiveSlot === 'p2');
    }
    renderCharacterPreview();
}

function getCharacterPortraitHTML(char) {
    const hatClass = char.archetype === 'storm_python' ? 'with-hat' : '';
    const hairClass = (char.archetype === 'shaolin' || char.archetype === 'kitana_style' || char.archetype === 'mileena_style') ? 'with-hair' : '';
    return `<span class="char-portrait ${hatClass} ${hairClass}">
        <span class="portrait-head"></span>
        <span class="portrait-mask"></span>
        <span class="portrait-body"></span>
        <span class="portrait-belt"></span>
    </span>`;
}

function getSpecialText(characterId) {
    if (characterId === 'backend-frio') return 'Especial: gelo + freeze';
    if (characterId === 'frontend-quente') return 'Especial: arpao + puxao';
    if (characterId === 'php-storm') return 'Especial: raio + dash deitado';
    if (characterId === 'loop-dragao') return 'Especial: bola de fogo + voadora';
    if (characterId === 'git.ana') return 'Especial: leque + giro de corte';
    if (characterId === 'ada-byte') return 'Especial: orb roxa + rush';
    return 'Especial unico';
}

function getCommandListByCharacter(characterId) {
    if (characterId === 'backend-frio') {
        return [
            'Especial (gelo): Baixo -> Frente -> Soco',
            'Rasteira: Baixo + Chute',
            'Fatality (perto): Frente -> Frente -> Soco'
        ];
    }
    if (characterId === 'frontend-quente') {
        return [
            'Especial (arpao): Tras -> Tras -> Soco',
            'Rasteira: Baixo + Chute',
            'Fatality: Baixo -> Baixo -> Soco'
        ];
    }
    if (characterId === 'php-storm') {
        return [
            'Especial (raio): Baixo -> Frente -> Soco',
            'Especial (avanco deitado): Tras -> Frente -> Chute',
            'Fatality (perto): Frente -> Frente -> Chute'
        ];
    }
    if (characterId === 'loop-dragao') {
        return [
            'Especial (bola de fogo): Baixo -> Frente -> Soco',
            'Especial (voadora): Frente -> Frente -> Chute',
            'Fatality (perto): Frente -> Frente -> Chute'
        ];
    }
    if (characterId === 'git.ana') {
        return [
            'Especial (leque): Tras -> Tras -> Soco',
            'Especial (giro): Baixo -> Frente -> Chute',
            'Fatality (perto): Tras -> Tras -> Chute'
        ];
    }
    if (characterId === 'ada-byte') {
        return [
            'Especial (orb roxa): Tras -> Tras -> Soco',
            'Especial (rush): Baixo -> Frente -> Chute',
            'Fatality (perto): Baixo -> Baixo -> Chute'
        ];
    }
    return ['Sem comandos'];
}

function selectCharacter(slot, characterId) {
    selectedCharacters[slot] = characterId;
    selectionCursor[slot] = characterRoster.findIndex((char) => char.id === characterId);
    selectedReady[slot] = false;
    playSfx('menu_move');
    renderCharacterSelection();
}

function toggleReady(slot) {
    if (!selectedCharacters[slot]) return;
    selectedReady[slot] = !selectedReady[slot];
    playSfx(selectedReady[slot] ? 'ready' : 'menu_move');
    renderCharacterSelection();
    if (canStartMatch()) {
        setTimeout(() => {
            if (canStartMatch()) startGame();
        }, 180);
    }
}

function canStartMatch() {
    return !!selectedCharacters.p1 && !!selectedCharacters.p2 && selectedReady.p1 && selectedReady.p2;
}

function setSelectionSlot(slot) {
    selectionActiveSlot = slot;
    playSfx('menu_move');
    renderCharacterSelection();
}

function renderCharacterPreview() {
    const p1 = getCharacterByIdUI(selectedCharacters.p1);
    const p2 = getCharacterByIdUI(selectedCharacters.p2);
    const p1Preview = document.getElementById('p1-char-preview');
    const p2Preview = document.getElementById('p2-char-preview');
    if (!p1Preview || !p2Preview) return;
    p1Preview.innerHTML = `<div class="preview-card" style="--char-main:${p1.color}; --char-base:${p1.baseColor}; --char-skin:${p1.skinColor}; --char-accent:${p1.accent};">${getCharacterPortraitHTML(p1)}<span>${p1.name}</span></div>`;
    p2Preview.innerHTML = `<div class="preview-card" style="--char-main:${p2.color}; --char-base:${p2.baseColor}; --char-skin:${p2.skinColor}; --char-accent:${p2.accent};">${getCharacterPortraitHTML(p2)}<span>${p2.name}</span></div>`;
}

function moveSelectionCursor(slot, dx, dy) {
    const cols = 2;
    const maxIndex = characterRoster.length - 1;
    const current = selectionCursor[slot];
    let row = Math.floor(current / cols);
    let col = current % cols;
    row += dy;
    col += dx;
    if (col < 0) col = cols - 1;
    if (col >= cols) col = 0;
    const maxRow = Math.floor(maxIndex / cols);
    if (row < 0) row = maxRow;
    if (row > maxRow) row = 0;
    let next = row * cols + col;
    if (next > maxIndex) next = maxIndex;
    selectionCursor[slot] = next;
    selectedCharacters[slot] = characterRoster[next].id;
    selectedReady[slot] = false;
    playSfx('menu_move');
    renderCharacterSelection();
}

window.addEventListener('keydown', (event) => {
    unlockSfxContext();
    const menu = document.getElementById('character-select-menu');
    if (!menu || menu.style.display !== 'flex') return;
    const key = event.key.toLowerCase();
    if (key === 'tab') {
        event.preventDefault();
        selectionActiveSlot = selectionActiveSlot === 'p1' ? 'p2' : 'p1';
        renderCharacterSelection();
        return;
    }
    if (key === 'w' || key === 'arrowup') moveSelectionCursor(selectionActiveSlot, 0, -1);
    if (key === 's' || key === 'arrowdown') moveSelectionCursor(selectionActiveSlot, 0, 1);
    if (key === 'a' || key === 'arrowleft') moveSelectionCursor(selectionActiveSlot, -1, 0);
    if (key === 'd' || key === 'arrowright') moveSelectionCursor(selectionActiveSlot, 1, 0);
    if (key === 'enter') toggleReady(selectionActiveSlot);
    if (key === '1') {
        selectionActiveSlot = 'p1';
        renderCharacterSelection();
    }
    if (key === '2') {
        selectionActiveSlot = 'p2';
        renderCharacterSelection();
    }
});

window.addEventListener('pointerdown', unlockSfxContext);

function openCharacterSelect() {
    playSfx('menu_confirm');
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('character-select-menu').style.display = 'flex';
    selectionActiveSlot = 'p1';
    selectedReady.p1 = false;
    selectedReady.p2 = false;
    selectionCursor.p1 = characterRoster.findIndex((char) => char.id === selectedCharacters.p1);
    selectionCursor.p2 = characterRoster.findIndex((char) => char.id === selectedCharacters.p2);
    renderCharacterSelection();
}

function closeCharacterSelect() {
    playSfx('menu_confirm');
    document.getElementById('character-select-menu').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
}

function applySelectedCharacterUI() {
    const p1 = getCharacterByIdUI(selectedCharacters.p1);
    const p2 = getCharacterByIdUI(selectedCharacters.p2);
    const p1Tag = document.getElementById('player-name-tag');
    const p2Tag = document.getElementById('enemy-name-tag');
    if (!p1Tag || !p2Tag) return;
    p1Tag.innerText = p1.name.toUpperCase();
    p2Tag.innerText = p2.name.toUpperCase();
    p1Tag.style.color = p1.accent;
    p2Tag.style.color = p2.accent;
    p1Tag.style.textShadow = `0 0 5px ${p1.accent}`;
    p2Tag.style.textShadow = `0 0 5px ${p2.accent}`;
}

function renderPauseCommandList() {
    const p1 = getCharacterByIdUI(selectedCharacters.p1);
    const p2 = getCharacterByIdUI(selectedCharacters.p2);
    const p1Name = document.getElementById('pause-p1-name');
    const p2Name = document.getElementById('pause-p2-name');
    const p1Commands = document.getElementById('pause-p1-commands');
    const p2Commands = document.getElementById('pause-p2-commands');
    if (!p1Name || !p2Name || !p1Commands || !p2Commands) return;

    p1Name.innerText = `P1 - ${p1.name.toUpperCase()}`;
    p2Name.innerText = `P2 - ${p2.name.toUpperCase()}`;
    p1Name.style.color = p1.accent;
    p2Name.style.color = p2.accent;

    p1Commands.innerHTML = getCommandListByCharacter(p1.id).map((cmd) => `<div class="cmd-item">${cmd}</div>`).join('');
    p2Commands.innerHTML = getCommandListByCharacter(p2.id).map((cmd) => `<div class="cmd-item" style="text-align:right;">${cmd}</div>`).join('');
}

function openPauseCommandList() {
    const panel = document.getElementById('pause-commands-panel');
    if (!panel) return;
    renderPauseCommandList();
    panel.style.display = 'block';
    if (typeof menuCursorIndex !== 'undefined') menuCursorIndex = 0;
}

function closePauseCommandList() {
    const panel = document.getElementById('pause-commands-panel');
    if (!panel) return;
    panel.style.display = 'none';
}

function applySettings() {
    const timeSelect = document.getElementById('time-select');
    const timeValue = timeSelect.value;
    gameConfig.timeLimit = timeValue === 'Infinity' ? Infinity : parseInt(timeValue);
    applyInputSourceSettings();
    const sfxSelect = document.getElementById('sfx-select');
    if (sfxSelect) sfxEnabled = sfxSelect.value === 'on';
    saveSettingsToStorage();
}

function openSettings() {
    playSfx('menu_confirm');
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('settings-menu').style.display = 'flex';
    buildSettingsUI();
}

function closeSettings() {
    playSfx('menu_confirm');
    applySettings();
    document.getElementById('settings-menu').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
}

function buildSettingsUI() {
    const buildList = (playerKeys, containerId) => {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        for (let action in actionLabels) {
            const row = document.createElement('div');
            row.className = 'key-bind-row';
            
            const label = document.createElement('span');
            label.className = 'key-bind-label';
            label.innerText = actionLabels[action];
            
            const btn = document.createElement('button');
            btn.className = 'key-btn';
            btn.innerText = formatKeyName(playerKeys[action]);
            btn.onclick = () => listenForKey(btn, playerKeys, action);
            
            row.appendChild(label);
            row.appendChild(btn);
            container.appendChild(row);
        }
    }
    buildList(p1Keys, 'p1-controls-list');
    buildList(p2Keys, 'p2-controls-list');
    syncInputSourceSelects();
}

function syncInputSourceSelects() {
    const p1Source = document.getElementById('p1-input-source');
    const p2Source = document.getElementById('p2-input-source');
    if (p1Source) p1Source.value = inputSource.p1;
    if (p2Source) p2Source.value = inputSource.p2;
    const sfxSelect = document.getElementById('sfx-select');
    if (sfxSelect) sfxSelect.value = sfxEnabled ? 'on' : 'off';
}

let listeningKeyObj = null;
let listeningKeyAction = null;
let listeningKeyHandler = null;
let listeningGamepadReady = false;

function finishListeningForKey(newKey) {
    if (!listeningKeyBtn || !listeningKeyObj || !listeningKeyAction) return;
    const duplicatedAction = Object.keys(listeningKeyObj).find((action) => action !== listeningKeyAction && listeningKeyObj[action] === newKey);
    if (duplicatedAction) {
        listeningKeyBtn.innerText = 'JA EM USO';
        showCentralMessage('Esse botao ja esta em uso nessa configuracao.', 1200);
        setTimeout(() => {
            if (listeningKeyBtn) listeningKeyBtn.innerText = 'PRESSIONE...';
        }, 350);
        return;
    }
    listeningKeyObj[listeningKeyAction] = newKey;
    listeningKeyBtn.innerText = formatKeyName(newKey);
    listeningKeyBtn.classList.remove('listening');
    listeningKeyBtn = null;
    listeningKeyObj = null;
    listeningKeyAction = null;
    if (listeningKeyHandler) {
        window.removeEventListener('keydown', listeningKeyHandler);
        listeningKeyHandler = null;
    }
    listeningGamepadReady = false;
    updateKeyMaps();
    saveSettingsToStorage();
}

function captureGamepadBinding(buttonIndex) {
    if (!listeningKeyBtn) return false;
    const value = typeof buttonIndex === 'number' ? `gp_btn_${buttonIndex}` : `gp_${buttonIndex}`;
    finishListeningForKey(value);
    return true;
}

function listenForKey(btnElement, keyObj, action) {
    if(listeningKeyBtn) {
        listeningKeyBtn.classList.remove('listening');
        listeningKeyBtn.innerText = formatKeyName(listeningKeyBtn.dataset.originalKey);
    }
    
    listeningKeyBtn = btnElement;
    listeningKeyObj = keyObj;
    listeningKeyAction = action;
    listeningGamepadReady = false;
    listeningKeyBtn.dataset.originalKey = keyObj[action];
    listeningKeyBtn.innerText = 'PRESSIONE...';
    listeningKeyBtn.classList.add('listening');

    listeningKeyHandler = (e) => {
        e.preventDefault();
        let newKey = e.key.toLowerCase();
        if(newKey === 'escape') newKey = listeningKeyBtn.dataset.originalKey;
        finishListeningForKey(newKey);
    };
    window.addEventListener('keydown', listeningKeyHandler);
}

function updateKeyMaps() {
    keyMapP1 = {};
    keyMapP2 = {};
    for(let action in p1Keys) keyMapP1[p1Keys[action]] = action;
    for(let action in p2Keys) keyMapP2[p2Keys[action]] = action;
}

function applyInputSourceSettings() {
    const p1Source = document.getElementById('p1-input-source');
    const p2Source = document.getElementById('p2-input-source');
    if (p1Source) inputSource.p1 = p1Source.value;
    if (p2Source) inputSource.p2 = p2Source.value;
}

function showCredits() {
    playSfx('menu_confirm');
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('settings-menu').style.display = 'none';
    document.getElementById('pause-menu').style.display = 'none';
    document.getElementById('credits-menu').style.display = 'flex';
}

function closeCredits() {
    playSfx('menu_confirm');
    document.getElementById('credits-menu').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
}

function showCentralMessage(text, duration = 2000) {
    const msg = document.getElementById('central-message');
    msg.innerHTML = text;
    msg.style.display = 'block';
    if (duration > 0) {
        setTimeout(() => {
            if(matchState !== 'game_over') msg.style.display = 'none';
        }, duration);
    }
}

function updateHealthUI(fighter, elementId) {
    let displayHealth = fighter.health < 0 ? 0 : fighter.health;
    document.querySelector(elementId).style.width = displayHealth + '%';
    if(displayHealth <= 50) document.querySelector(elementId).style.backgroundColor = '#ffcc00';
    if(displayHealth <= 20) document.querySelector(elementId).style.backgroundColor = '#ff0000';
    else document.querySelector(elementId).style.backgroundColor = '#00ff00';
}
