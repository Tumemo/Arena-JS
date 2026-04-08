// ui.js - Interface de usuário e configurações

function formatKeyName(key) {
    if(key === ' ') return 'ESPAÇO';
    if(key.startsWith('arrow')) return 'SETA ' + key.replace('arrow', '').toUpperCase();
    return key.toUpperCase();
}

function applySettings() {
    const timeSelect = document.getElementById('time-select');
    const timeValue = timeSelect.value;
    gameConfig.timeLimit = timeValue === 'Infinity' ? Infinity : parseInt(timeValue);
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
