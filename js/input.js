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
