// input.js - Sistema de entrada de teclado

window.addEventListener('keydown', (event) => {
    if(listeningKeyBtn) return;
    let key = event.key.toLowerCase();
    
    if (key === 'escape' || key === 'p') {
        togglePause();
        return;
    }
    
    if(!gameActive || isPaused) return;

    let cmd1 = keyMapP1[key];
    let cmd2 = keyMapP2[key];
    
    if (cmd1 && !keysStateP1[cmd1]) {
        keysStateP1[cmd1] = true;
        if(cmd1 !== 'block') {
            player.addInput(cmd1);
            handleAction(player, cmd1);
        }
    }
    
    if (cmd2 && !keysStateP2[cmd2]) {
        keysStateP2[cmd2] = true;
        if(cmd2 !== 'block') {
            enemy.addInput(cmd2);
            handleAction(enemy, cmd2);
        }
    }
});

window.addEventListener('keyup', (event) => {
    if(listeningKeyBtn) return;
    let key = event.key.toLowerCase();
    
    if (keyMapP1[key]) keysStateP1[keyMapP1[key]] = false;
    if (keyMapP2[key]) keysStateP2[keyMapP2[key]] = false;
});

// =====================
// Suporte a Gamepad
// =====================
let p1GamepadIndex = null;
let p2GamepadIndex = null;
let previousButtonStatesByPad = {};
let previousMappedActionStateByPad = {};
let previousAxesByPad = {};
let menuCursorIndex = 0;
let lastMenuMoveAt = 0;
let lastGamepadTickAt = 0;
let lastMissingP2WarningAt = 0;
const gamepadDeadzone = 0.45;
const menuRepeatMs = 170;
let settingsCursor = { p1: 0, p2: 0 };

function getPreviousAxes(pad) {
    if (!pad) return { h: 0, v: 0 };
    if (!previousAxesByPad[pad.index]) previousAxesByPad[pad.index] = { h: 0, v: 0 };
    return previousAxesByPad[pad.index];
}

function updateGamepadStatusLabel() {
    const el = document.getElementById('gamepad-status');
    if (!el) return;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const p1Pad = p1GamepadIndex !== null ? pads[p1GamepadIndex] : null;
    const p2Pad = p2GamepadIndex !== null ? pads[p2GamepadIndex] : null;
    if (!p1Pad && !p2Pad) {
        el.innerText = 'CONTROLE: NAO CONECTADO (TECLADO ATIVO)';
        return;
    }
    const p1Label = p1Pad ? `P1 ${p1Pad.id.substring(0, 18).toUpperCase()}` : 'P1 SEM CONTROLE';
    const p2Label = p2Pad ? `P2 ${p2Pad.id.substring(0, 18).toUpperCase()}` : 'P2 SEM CONTROLE';
    el.innerText = `CONTROLE: ${p1Label} | ${p2Label}`;
}

function hasAnyPadInput(pad) {
    if (!pad) return false;
    const buttonPressed = pad.buttons.some((b) => !!b.pressed);
    const axisMoved = Math.abs(pad.axes[0] || 0) > gamepadDeadzone || Math.abs(pad.axes[1] || 0) > gamepadDeadzone;
    return buttonPressed || axisMoved;
}

function getVisibleOverlay() {
    const ids = ['pause-menu', 'character-select-menu', 'settings-menu', 'credits-menu', 'main-menu'];
    for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.style.display === 'flex') return el;
    }
    return null;
}

function getMenuButtons(overlay) {
    if (!overlay) return [];
    if (overlay.id === 'pause-menu') {
        const panel = document.getElementById('pause-commands-panel');
        if (panel && panel.style.display === 'block') {
            const panelButtons = Array.from(panel.querySelectorAll('button.btn, button.key-btn'));
            return panelButtons.filter((btn) => btn.offsetParent !== null && !btn.disabled);
        }
    }
    const buttons = Array.from(overlay.querySelectorAll('button.btn, button.key-btn'));
    return buttons.filter((btn) => btn.offsetParent !== null && !btn.disabled);
}

function highlightMenuButton(overlay) {
    const buttons = getMenuButtons(overlay);
    if (buttons.length === 0) return;
    if (menuCursorIndex < 0) menuCursorIndex = buttons.length - 1;
    if (menuCursorIndex >= buttons.length) menuCursorIndex = 0;
    buttons.forEach((btn, idx) => {
        btn.style.outline = idx === menuCursorIndex ? '3px solid #00ffff' : '';
        btn.style.outlineOffset = idx === menuCursorIndex ? '2px' : '';
    });
}

function clickFocusedMenuButton(overlay) {
    const buttons = getMenuButtons(overlay);
    if (buttons.length === 0) return;
    if (menuCursorIndex >= buttons.length) menuCursorIndex = 0;
    buttons[menuCursorIndex].click();
}

function handleCharacterSelectGamepad(pad, pressedNow, slot) {
    if (!pad) return;
    const prevAxes = getPreviousAxes(pad);
    const h = pad.axes[0] || 0;
    const v = pad.axes[1] || 0;
    const now = Date.now();
    const right = pressedNow[15] || (h > gamepadDeadzone && prevAxes.h <= gamepadDeadzone);
    const left = pressedNow[14] || (h < -gamepadDeadzone && prevAxes.h >= -gamepadDeadzone);
    const down = pressedNow[13] || (v > gamepadDeadzone && prevAxes.v <= gamepadDeadzone);
    const up = pressedNow[12] || (v < -gamepadDeadzone && prevAxes.v >= -gamepadDeadzone);
    const canRepeat = (now - lastMenuMoveAt) > menuRepeatMs;

    if ((left || up) && canRepeat) {
        if (left) moveSelectionCursor(slot, -1, 0);
        if (up) moveSelectionCursor(slot, 0, -1);
        lastMenuMoveAt = now;
    }
    if ((right || down) && canRepeat) {
        if (right) moveSelectionCursor(slot, 1, 0);
        if (down) moveSelectionCursor(slot, 0, 1);
        lastMenuMoveAt = now;
    }
    if ((pressedNow[4] || pressedNow[5] || pressedNow[3]) && canRepeat) setSelectionSlot(slot);
    if (pressedNow[0]) toggleReady(slot); // A
    if (pressedNow[9] && canStartMatch()) startGame(); // Start
    if (pressedNow[1]) closeCharacterSelect(); // B
    prevAxes.h = h;
    prevAxes.v = v;
}

function getPadForPlayer(slot, p1Pad, p2Pad) {
    const source = (inputSource && inputSource[slot]) ? inputSource[slot] : (slot === 'p1' ? 'auto' : 'keyboard');
    if (source === 'keyboard') return null;
    if (source === 'pad1') return p1Pad || null;
    if (source === 'pad2') return p2Pad || null;
    if (slot === 'p1') return p1Pad || p2Pad || null;
    return p2Pad || null;
}

function handleOverlayGamepadNavigation(overlay, pad, pressedNow) {
    if (!overlay) return;

    if (overlay.id === 'character-select-menu') {
        handleCharacterSelectGamepad(pad, pressedNow, selectionActiveSlot);
        return;
    }

    const prevAxes = getPreviousAxes(pad);
    const now = Date.now();
    const v = pad.axes[1] || 0;
    const down = pressedNow[13] || (v > gamepadDeadzone && prevAxes.v <= gamepadDeadzone);
    const up = pressedNow[12] || (v < -gamepadDeadzone && prevAxes.v >= -gamepadDeadzone);
    const canRepeat = (now - lastMenuMoveAt) > menuRepeatMs;

    if (down && canRepeat) {
        menuCursorIndex++;
        lastMenuMoveAt = now;
    }
    if (up && canRepeat) {
        menuCursorIndex--;
        lastMenuMoveAt = now;
    }
    highlightMenuButton(overlay);

    if (pressedNow[0]) clickFocusedMenuButton(overlay); // A

    if (pressedNow[1]) { // B
        if (overlay.id === 'settings-menu') closeSettings();
        else if (overlay.id === 'credits-menu') closeCredits();
        else if (overlay.id === 'pause-menu') {
            const panel = document.getElementById('pause-commands-panel');
            if (panel && panel.style.display === 'block') closePauseCommandList();
            else togglePause();
        }
    }

    prevAxes.h = pad.axes[0] || 0;
    prevAxes.v = pad.axes[1] || 0;
}

function getSettingsControlsBySlot(slot) {
    const controls = [];
    const timeSelect = document.getElementById('time-select');
    const sfxSelect = document.getElementById('sfx-select');
    if (timeSelect) controls.push(timeSelect);
    if (sfxSelect) controls.push(sfxSelect);
    const sourceSelect = document.getElementById(slot === 'p1' ? 'p1-input-source' : 'p2-input-source');
    if (sourceSelect) controls.push(sourceSelect);
    const listId = slot === 'p1' ? 'p1-controls-list' : 'p2-controls-list';
    const list = document.getElementById(listId);
    if (list) {
        const keyButtons = Array.from(list.querySelectorAll('button.key-btn'));
        controls.push(...keyButtons);
    }
    const closeBtn = document.querySelector('#settings-menu button.btn');
    if (closeBtn) controls.push(closeBtn);
    return controls;
}

function updateSettingsFocus(slot) {
    const controls = getSettingsControlsBySlot(slot);
    if (!controls.length) return;
    if (settingsCursor[slot] < 0) settingsCursor[slot] = controls.length - 1;
    if (settingsCursor[slot] >= controls.length) settingsCursor[slot] = 0;
    const color = slot === 'p1' ? '#00ffff' : '#ffcc00';
    controls.forEach((el, idx) => {
        el.style.outline = idx === settingsCursor[slot] ? `3px solid ${color}` : '';
        el.style.outlineOffset = idx === settingsCursor[slot] ? '2px' : '';
    });
}

function cycleSelectElement(selectEl, step) {
    const options = Array.from(selectEl.options || []);
    if (!options.length) return;
    let idx = options.findIndex((opt) => opt.value === selectEl.value);
    idx = Math.max(0, Math.min(options.length - 1, idx + step));
    selectEl.value = options[idx].value;
}

function handleSettingsGamepadBySlot(pad, pressedNow, slot) {
    if (!pad) return;
    const controls = getSettingsControlsBySlot(slot);
    if (!controls.length) return;
    const prevAxes = getPreviousAxes(pad);
    const now = Date.now();
    const v = pad.axes[1] || 0;
    const h = pad.axes[0] || 0;
    const down = pressedNow[13] || (v > gamepadDeadzone && prevAxes.v <= gamepadDeadzone);
    const up = pressedNow[12] || (v < -gamepadDeadzone && prevAxes.v >= -gamepadDeadzone);
    const left = pressedNow[14] || (h < -gamepadDeadzone && prevAxes.h >= -gamepadDeadzone);
    const right = pressedNow[15] || (h > gamepadDeadzone && prevAxes.h <= gamepadDeadzone);
    const canRepeat = (now - lastMenuMoveAt) > menuRepeatMs;

    if (down && canRepeat) {
        settingsCursor[slot]++;
        lastMenuMoveAt = now;
    }
    if (up && canRepeat) {
        settingsCursor[slot]--;
        lastMenuMoveAt = now;
    }
    updateSettingsFocus(slot);

    const focused = controls[Math.max(0, Math.min(controls.length - 1, settingsCursor[slot]))];
    if ((left || right) && canRepeat && focused && focused.tagName === 'SELECT') {
        cycleSelectElement(focused, left ? -1 : 1);
        lastMenuMoveAt = now;
    }
    if (pressedNow[0] && focused) focused.click();
    if (pressedNow[1]) closeSettings();

    prevAxes.h = h;
    prevAxes.v = v;
}

function getMappedPressed(pad, keyConfig, action) {
    const mapped = keyConfig[action];
    if (!mapped) return false;
    if (mapped.startsWith('gp_btn_')) {
        const idx = parseInt(mapped.replace('gp_btn_', ''), 10);
        return !!pad.buttons[idx]?.pressed;
    }
    if (mapped === 'gp_axis_left') return (pad.axes[0] || 0) < -gamepadDeadzone;
    if (mapped === 'gp_axis_right') return (pad.axes[0] || 0) > gamepadDeadzone;
    if (mapped === 'gp_axis_down') return (pad.axes[1] || 0) > gamepadDeadzone;
    if (mapped === 'gp_axis_up') return (pad.axes[1] || 0) < -gamepadDeadzone;
    if (mapped === 'arrowleft') return (pad.axes[0] || 0) < -gamepadDeadzone || !!pad.buttons[14]?.pressed;
    if (mapped === 'arrowright') return (pad.axes[0] || 0) > gamepadDeadzone || !!pad.buttons[15]?.pressed;
    if (mapped === 'arrowdown') return (pad.axes[1] || 0) > gamepadDeadzone || !!pad.buttons[13]?.pressed;
    if (mapped === 'arrowup') return (pad.axes[1] || 0) < -gamepadDeadzone || !!pad.buttons[12]?.pressed;
    return false;
}

function handleFightGamepad(pad, fighter, keysState, keyConfig, pressedNow) {
    if (!previousMappedActionStateByPad[pad.index]) previousMappedActionStateByPad[pad.index] = {};
    const previousMapped = previousMappedActionStateByPad[pad.index];

    const isMappedDown = (action) => getMappedPressed(pad, keyConfig, action);
    const isMappedJustPressed = (action) => {
        const current = isMappedDown(action);
        const prev = !!previousMapped[action];
        previousMapped[action] = current;
        return current && !prev;
    };

    // Movimento e defesa baseado em mapeamento do jogador
    const h = pad.axes[0] || 0;
    const v = pad.axes[1] || 0;
    keysState.left = getMappedPressed(pad, keyConfig, 'left') || h < -gamepadDeadzone;
    keysState.right = getMappedPressed(pad, keyConfig, 'right') || h > gamepadDeadzone;
    keysState.down = getMappedPressed(pad, keyConfig, 'down') || v > gamepadDeadzone;
    keysState.up = false;
    keysState.block = getMappedPressed(pad, keyConfig, 'block');

    // Alimenta buffer de combo com direcoes no frame do clique
    if (isMappedJustPressed('down')) fighter.addInput('down');
    if (isMappedJustPressed('left')) fighter.addInput('left');
    if (isMappedJustPressed('right')) fighter.addInput('right');

    if (isMappedJustPressed('up')) handleAction(fighter, 'up');
    if (isMappedJustPressed('punch')) {
        fighter.addInput('punch');
        handleAction(fighter, 'punch');
    }
    if (isMappedJustPressed('kick')) {
        fighter.addInput('kick');
        handleAction(fighter, 'kick');
    }
    // Start = pause
    if (pressedNow[9]) togglePause();
}

function getPressedNow(pad) {
    if (!previousButtonStatesByPad[pad.index]) previousButtonStatesByPad[pad.index] = [];
    const previousButtonStates = previousButtonStatesByPad[pad.index];
    const pressedNow = [];
    for (let i = 0; i < pad.buttons.length; i++) {
        const pressed = !!pad.buttons[i].pressed;
        const prev = !!previousButtonStates[i];
        pressedNow[i] = pressed && !prev;
        previousButtonStates[i] = pressed;
    }
    return pressedNow;
}

function gamepadLoop() {
    const now = Date.now();
    if ((now - lastGamepadTickAt) < 16) {
        window.requestAnimationFrame(gamepadLoop);
        return;
    }
    lastGamepadTickAt = now;

    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let p1Pad = p1GamepadIndex !== null ? pads[p1GamepadIndex] : null;
    let p2Pad = p2GamepadIndex !== null ? pads[p2GamepadIndex] : null;

    if (!p1Pad) {
        for (let i = 0; i < pads.length; i++) {
            if (pads[i] && i !== p2GamepadIndex) {
                p1GamepadIndex = i;
                p1Pad = pads[i];
                break;
            }
        }
    }
    if (!p2Pad) {
        for (let i = 0; i < pads.length; i++) {
            if (pads[i] && i !== p1GamepadIndex) {
                p2GamepadIndex = i;
                p2Pad = pads[i];
                break;
            }
        }
    }

    updateGamepadStatusLabel();

    if (listeningKeyBtn) {
        // Durante bind, nao navega menu: captura botao/axis do gamepad
        let sourcePad = null;
        if (listeningKeyObj === p1Keys) sourcePad = p1Pad || p2Pad;
        else if (listeningKeyObj === p2Keys) sourcePad = p2Pad || p1Pad || null;
        else sourcePad = p1Pad || p2Pad;
        if (!sourcePad && listeningKeyObj === p2Keys) {
            if (Date.now() - lastMissingP2WarningAt > 1400) {
                showCentralMessage('Conecte o controle do P2 para configurar.', 1200);
                lastMissingP2WarningAt = Date.now();
            }
        }
        if (sourcePad) {
            const prevAxes = getPreviousAxes(sourcePad);
            if (!listeningGamepadReady) {
                if (!hasAnyPadInput(sourcePad)) listeningGamepadReady = true;
            } else {
                const anyPressedIndex = sourcePad.buttons.findIndex((b) => !!b.pressed);
                if (anyPressedIndex >= 0 && captureGamepadBinding(anyPressedIndex)) {
                    prevAxes.h = sourcePad.axes[0] || 0;
                    prevAxes.v = sourcePad.axes[1] || 0;
                    window.requestAnimationFrame(gamepadLoop);
                    return;
                }
                const axisH = sourcePad.axes[0] || 0;
                const axisV = sourcePad.axes[1] || 0;
                if (axisH < -gamepadDeadzone && prevAxes.h >= -gamepadDeadzone && captureGamepadBinding('axis_left')) return window.requestAnimationFrame(gamepadLoop);
                if (axisH > gamepadDeadzone && prevAxes.h <= gamepadDeadzone && captureGamepadBinding('axis_right')) return window.requestAnimationFrame(gamepadLoop);
                if (axisV < -gamepadDeadzone && prevAxes.v >= -gamepadDeadzone && captureGamepadBinding('axis_up')) return window.requestAnimationFrame(gamepadLoop);
                if (axisV > gamepadDeadzone && prevAxes.v <= gamepadDeadzone && captureGamepadBinding('axis_down')) return window.requestAnimationFrame(gamepadLoop);
            }
            prevAxes.h = sourcePad.axes[0] || 0;
            prevAxes.v = sourcePad.axes[1] || 0;
        }
    } else if (p1Pad || p2Pad) {
        const pressedByPad = {};
        if (p1Pad) pressedByPad[p1Pad.index] = getPressedNow(p1Pad);
        if (p2Pad && !pressedByPad[p2Pad.index]) pressedByPad[p2Pad.index] = getPressedNow(p2Pad);

        let menuPad = null;
        if (p1Pad && p2Pad) {
            const p1Pressed = pressedByPad[p1Pad.index] || [];
            const p2Pressed = pressedByPad[p2Pad.index] || [];
            const p1Active = p1Pressed.some(Boolean) || Math.abs(p1Pad.axes[0] || 0) > gamepadDeadzone || Math.abs(p1Pad.axes[1] || 0) > gamepadDeadzone;
            const p2Active = p2Pressed.some(Boolean) || Math.abs(p2Pad.axes[0] || 0) > gamepadDeadzone || Math.abs(p2Pad.axes[1] || 0) > gamepadDeadzone;
            if (p2Active && !p1Active) menuPad = p2Pad;
            else if (p1Active && !p2Active) menuPad = p1Pad;
            else if (p2Active) menuPad = p2Pad;
            else menuPad = p1Pad;
        } else {
            menuPad = p1Pad || p2Pad;
        }
        const pressedNowMenu = menuPad ? (pressedByPad[menuPad.index] || []) : [];
        const overlay = getVisibleOverlay();
        if (overlay) {
            if (overlay.id === 'character-select-menu') {
                if (p1Pad && p2Pad && p1Pad.index !== p2Pad.index) {
                    handleCharacterSelectGamepad(p1Pad, pressedByPad[p1Pad.index] || [], 'p1');
                    handleCharacterSelectGamepad(p2Pad, pressedByPad[p2Pad.index] || [], 'p2');
                } else if (menuPad) {
                    handleCharacterSelectGamepad(menuPad, pressedNowMenu, selectionActiveSlot);
                }
            } else if (overlay.id === 'settings-menu') {
                if (p1Pad) handleSettingsGamepadBySlot(p1Pad, pressedByPad[p1Pad.index] || [], 'p1');
                if (p2Pad) handleSettingsGamepadBySlot(p2Pad, pressedByPad[p2Pad.index] || [], 'p2');
                if (!p1Pad && !p2Pad && menuPad) handleOverlayGamepadNavigation(overlay, menuPad, pressedNowMenu);
            } else {
                if (menuPad) handleOverlayGamepadNavigation(overlay, menuPad, pressedNowMenu);
            }
        } else if (gameActive && !isPaused) {
            const player1Pad = getPadForPlayer('p1', p1Pad, p2Pad);
            const player2Pad = getPadForPlayer('p2', p1Pad, p2Pad);

            if (player1Pad) {
                const pressedNowP1 = pressedByPad[player1Pad.index] || [];
                handleFightGamepad(player1Pad, player, keysStateP1, p1Keys, pressedNowP1);
            }
            if (player2Pad && (!player1Pad || player2Pad.index !== player1Pad.index)) {
                const pressedNowP2 = pressedByPad[player2Pad.index] || [];
                handleFightGamepad(player2Pad, enemy, keysStateP2, p2Keys, pressedNowP2);
            }
        }
    }

    window.requestAnimationFrame(gamepadLoop);
}

window.addEventListener('gamepadconnected', (event) => {
    if (p1GamepadIndex === null) p1GamepadIndex = event.gamepad.index;
    else if (p2GamepadIndex === null && event.gamepad.index !== p1GamepadIndex) p2GamepadIndex = event.gamepad.index;
    previousButtonStatesByPad[event.gamepad.index] = [];
    updateGamepadStatusLabel();
});

window.addEventListener('gamepaddisconnected', (event) => {
    if (event.gamepad.index === p1GamepadIndex) p1GamepadIndex = null;
    if (event.gamepad.index === p2GamepadIndex) p2GamepadIndex = null;
    delete previousButtonStatesByPad[event.gamepad.index];
    delete previousMappedActionStateByPad[event.gamepad.index];
    delete previousAxesByPad[event.gamepad.index];
    updateGamepadStatusLabel();
});

window.addEventListener('DOMContentLoaded', () => {
    updateGamepadStatusLabel();
    gamepadLoop();
});
