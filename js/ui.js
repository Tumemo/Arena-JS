// ui.js - Interface de usuário e configurações

function formatKeyName(key) {
    if(key === ' ') return 'ESPAÇO';
    if(key.startsWith('arrow')) return 'SETA ' + key.replace('arrow', '').toUpperCase();
    return key.toUpperCase();
}

function saveSettingsToStorage() {
    const payload = {
        timeLimit: gameConfig.timeLimit,
        p1Keys,
        p2Keys
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
        updateKeyMaps();
    } catch (err) {
        console.warn('Falha ao carregar settings salvas.', err);
    }
}

function getCharacterByIdUI(id) {
    return characterRoster.find((char) => char.id === id) || characterRoster[0];
}

let selectionActiveSlot = 'p1';
let selectionCursor = { p1: 0, p2: 1 };

function renderCharacterSelection() {
    const p1Container = document.getElementById('p1-char-list');
    const p2Container = document.getElementById('p2-char-list');
    const sameCharWarning = document.getElementById('same-char-warning');
    const startBtn = document.getElementById('start-match-btn');
    if (!p1Container || !p2Container || !startBtn) return;

    const createCard = (char, slot) => {
        const isSelected = selectedCharacters[slot] === char.id;
        const cursorIndex = selectionCursor[slot];
        const thisIndex = characterRoster.findIndex((item) => item.id === char.id);
        const isFocused = selectionActiveSlot === slot && cursorIndex === thisIndex;
        return `<button class="char-card ${isSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''}" onclick="selectCharacter('${slot}', '${char.id}')">
            <span class="char-name">${char.name}</span>
            <span class="char-special">${getSpecialText(char.id)}</span>
        </button>`;
    };

    p1Container.innerHTML = characterRoster.map((char) => createCard(char, 'p1')).join('');
    p2Container.innerHTML = characterRoster.map((char) => createCard(char, 'p2')).join('');

    const sameCharacter = selectedCharacters.p1 === selectedCharacters.p2;
    sameCharWarning.style.display = sameCharacter ? 'block' : 'none';
    startBtn.disabled = !selectedCharacters.p1 || !selectedCharacters.p2;
    renderCharacterPreview();
}

function getSpecialText(characterId) {
    if (characterId === 'backend-frio') return 'Especial: gelo + freeze';
    if (characterId === 'frontend-quente') return 'Especial: arpao + puxao';
    if (characterId === 'python-trovao') return 'Especial: raio + dash deitado';
    if (characterId === 'loop-dragao') return 'Especial: bola de fogo + voadora';
    if (characterId === 'gitana') return 'Especial: leque + giro de corte';
    if (characterId === 'milena-byte') return 'Especial: orb roxa + rush';
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
    if (characterId === 'python-trovao') {
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
    if (characterId === 'gitana') {
        return [
            'Especial (leque): Tras -> Tras -> Soco',
            'Especial (giro): Baixo -> Frente -> Chute',
            'Fatality (perto): Tras -> Tras -> Chute'
        ];
    }
    if (characterId === 'milena-byte') {
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
    renderCharacterSelection();
}

function renderCharacterPreview() {
    const p1 = getCharacterByIdUI(selectedCharacters.p1);
    const p2 = getCharacterByIdUI(selectedCharacters.p2);
    const p1Preview = document.getElementById('p1-char-preview');
    const p2Preview = document.getElementById('p2-char-preview');
    if (!p1Preview || !p2Preview) return;
    p1Preview.innerHTML = `<div class="preview-avatar" style="background:${p1.color}; border-color:${p1.accent};"></div><span>${p1.name}</span>`;
    p2Preview.innerHTML = `<div class="preview-avatar" style="background:${p2.color}; border-color:${p2.accent};"></div><span>${p2.name}</span>`;
}

function moveSelectionCursor(slot, direction) {
    const next = (selectionCursor[slot] + direction + characterRoster.length) % characterRoster.length;
    selectionCursor[slot] = next;
    selectedCharacters[slot] = characterRoster[next].id;
    renderCharacterSelection();
}

window.addEventListener('keydown', (event) => {
    const menu = document.getElementById('character-select-menu');
    if (!menu || menu.style.display !== 'flex') return;
    const key = event.key.toLowerCase();
    if (key === 'tab') {
        event.preventDefault();
        selectionActiveSlot = selectionActiveSlot === 'p1' ? 'p2' : 'p1';
        renderCharacterSelection();
        return;
    }
    if (key === 'w' || key === 's' || key === 'arrowup' || key === 'arrowdown') {
        selectionActiveSlot = selectionActiveSlot === 'p1' ? 'p2' : 'p1';
        renderCharacterSelection();
        return;
    }
    if (key === 'a' || key === 'arrowleft') moveSelectionCursor(selectionActiveSlot, -1);
    if (key === 'd' || key === 'arrowright') moveSelectionCursor(selectionActiveSlot, 1);
});

function openCharacterSelect() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('character-select-menu').style.display = 'flex';
    selectionActiveSlot = 'p1';
    selectionCursor.p1 = characterRoster.findIndex((char) => char.id === selectedCharacters.p1);
    selectionCursor.p2 = characterRoster.findIndex((char) => char.id === selectedCharacters.p2);
    renderCharacterSelection();
}

function closeCharacterSelect() {
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
    saveSettingsToStorage();
}

function openSettings() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('settings-menu').style.display = 'flex';
    buildSettingsUI();
}

function closeSettings() {
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
}

function listenForKey(btnElement, keyObj, action) {
    if(listeningKeyBtn) {
        listeningKeyBtn.classList.remove('listening');
        listeningKeyBtn.innerText = formatKeyName(listeningKeyBtn.dataset.originalKey);
    }
    
    listeningKeyBtn = btnElement;
    listeningKeyBtn.dataset.originalKey = keyObj[action];
    listeningKeyBtn.innerText = 'PRESSIONE...';
    listeningKeyBtn.classList.add('listening');

    const handler = (e) => {
        e.preventDefault();
        let newKey = e.key.toLowerCase();
        if(newKey === 'escape') newKey = listeningKeyBtn.dataset.originalKey;
        keyObj[action] = newKey;
        listeningKeyBtn.innerText = formatKeyName(newKey);
        listeningKeyBtn.classList.remove('listening');
        listeningKeyBtn = null;
        window.removeEventListener('keydown', handler);
        updateKeyMaps();
        saveSettingsToStorage();
    };
    window.addEventListener('keydown', handler);
}

function updateKeyMaps() {
    keyMapP1 = {};
    keyMapP2 = {};
    for(let action in p1Keys) keyMapP1[p1Keys[action]] = action;
    for(let action in p2Keys) keyMapP2[p2Keys[action]] = action;
}

function showCredits() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('settings-menu').style.display = 'none';
    document.getElementById('pause-menu').style.display = 'none';
    document.getElementById('credits-menu').style.display = 'flex';
}

function closeCredits() {
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
