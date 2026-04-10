// game.js - Lógica principal do jogo

let canvas, ctx, floorY;
let player, enemy;

function getCharacterById(id) {
    return characterRoster.find((char) => char.id === id) || characterRoster[0];
}

function createFighterFromSelection(slot, cfg) {
    return new Fighter({
        id: cfg.id,
        name: cfg.name,
        archetype: cfg.archetype,
        accent: cfg.accent,
        position: { x: slot === 'p1' ? canvas.width * 0.2 : canvas.width * 0.8 - 60, y: 0 },
        color: cfg.color,
        baseColor: cfg.baseColor,
        skinColor: cfg.skinColor,
        isFacingRight: slot === 'p1',
        uiPrefix: slot === 'p1' ? 'player' : 'enemy'
    });
}

function setupSelectedFighters() {
    const p1Config = getCharacterById(selectedCharacters.p1);
    const p2Config = getCharacterById(selectedCharacters.p2);

    player = createFighterFromSelection('p1', p1Config);
    enemy = createFighterFromSelection('p2', p2Config);

    if (p1Config.id === p2Config.id) {
        enemy.applyColorShade(0.72);
    }
}

function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    floorY = canvas.height - 120;
    
    setupSelectedFighters();
    
    updateKeyMaps();
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        floorY = canvas.height - 120;
    });
}

function drawBackground() {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, floorY);
    skyGrad.addColorStop(0, '#0a0a2a');
    skyGrad.addColorStop(1, '#2b1b17');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, floorY);

    ctx.save();
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 150, 60, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffe0';
    ctx.shadowBlur = 50;
    ctx.shadowColor = '#ffffe0';
    ctx.fill();
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.arc(canvas.width / 2 - 20, 130, 15, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(canvas.width / 2 + 10, 170, 20, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#0f0f15';
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(200, floorY - 300);
    ctx.lineTo(400, floorY - 150);
    ctx.lineTo(700, floorY - 400);
    ctx.lineTo(canvas.width, floorY - 100);
    ctx.lineTo(canvas.width, floorY);
    ctx.fill();

    ctx.fillStyle = '#3a3a40';
    ctx.fillRect(0, floorY, canvas.width, canvas.height - floorY);
    
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 4;
    for(let i = -canvas.width; i < canvas.width * 2; i+= 150) {
        ctx.beginPath();
        ctx.moveTo(i, floorY);
        ctx.lineTo(i - (canvas.width/2 - i)*0.5, canvas.height);
        ctx.stroke();
    }
    
    ctx.fillStyle = '#2a2a30';
    ctx.fillRect(0, floorY, canvas.width, 15);

    if (matchState === 'finish_him' || matchState === 'fatality') {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function checkMatchState() {
    if (matchState !== 'fighting') return;
    if (player.health <= 0 || enemy.health <= 0) {
        if(player.health <= 0 && enemy.health <= 0) {
            endGameWithWinner(null, false);
            return;
        }
        matchState = 'finish_him';
        finishHimTimerFrames = 30 * 60;

        let loser = player.health <= 0 ? player : enemy;
        loser.health = 0.1;
        loser.stunTimer = Infinity;
        loser.velocity.x = 0;

        clearTimeout(timerId);
        showCentralMessage("FINISH HIM!", 3000);
        playSfx('finish_him');
        document.getElementById('blood-overlay').style.display = 'block';
    }
}

function endGameWithWinner(winner, isFatality) {
    matchState = 'game_over';
    const msg = document.getElementById('central-message');
    if (!winner) {
        msg.innerHTML = 'EMPATE';
    } else {
        msg.innerHTML = `${winner.name.toUpperCase()} WINS` + (isFatality ? '<br><span style="font-size:40px; color:#f00; text-shadow: 0 0 20px #f00;">FATALITY</span>' : '');
        let loser = winner === player ? enemy : player;
        if(!isFatality) {
            loser.isDead = true;
            loser.health = 0;
        }
    }
    msg.style.display = 'block';
    if (winner) playSfx('win');
    setTimeout(() => {
        if(!isPaused) quitToMenu();
    }, 6000);
}

function executeBackendFrioFatality(winner, loser) {
    matchState = 'fatality';
    winner.velocity = {x:0, y:0};
    loser.velocity = {x:0, y:0};
    showCentralMessage("ICE SHATTER!", 1400);
    winner.isFacingRight = winner.position.x < loser.position.x;

    setTimeout(() => {
        winner.isAttacking = true;
        winner.attackType = 'special';
        loser.freezeTimer = Infinity;
        loser.color = '#aaffff';
        loser.skinColor = '#aaffff';
        loser.baseColor = '#55aaaa';
        
        for(let i=0; i<40; i++) {
            particles.push(new Particle(loser.position.x+30, loser.position.y+90, '#aaffff', 'glow'));
        }

        setTimeout(() => {
            winner.attackType = 'uppercut';
            setTimeout(() => {
                loser.isShattered = true;
                for(let i=0; i<120; i++) {
                    particles.push(new Particle(loser.position.x+30, loser.position.y+90, '#aaffff', 'shatter', 3));
                    particles.push(new Particle(loser.position.x+30, loser.position.y+90, '#ff0000', 'blood', 1.5));
                }
                setTimeout(() => { endGameWithWinner(winner, true); }, 2000);
            }, 200);
        }, 1200);
    }, 300);
}

function executeFrontendQuenteFatality(winner, loser) {
    matchState = 'fatality';
    winner.velocity = {x:0, y:0};
    loser.velocity = {x:0, y:0};
    showCentralMessage("HELL FIRE!", 1400);
    winner.isFacingRight = winner.position.x < loser.position.x;

    setTimeout(() => {
        winner.isMaskless = true;
        winner.isAttacking = true;
        winner.attackType = 'special';

        let fireInterval = setInterval(() => {
            projectiles.push(new Projectile({
                position: { x: winner.position.x + (winner.isFacingRight ? 40 : -10), y: winner.position.y - 10 },
                velocity: { x: winner.isFacingRight ? 12 + Math.random()*8 : -12 - Math.random()*8, y: Math.random()*4 - 1 },
                color: '#ff4400',
                type: 'fire',
                owner: winner
            }));
        }, 40);

        setTimeout(() => {
            clearInterval(fireInterval);
            winner.isAttacking = false;
            loser.isBurned = true;
            loser.color = '#111';
            loser.skinColor = '#222';
            loser.baseColor = '#000';
            loser.isKnockedDown = true;
            loser.knockdownTimer = Infinity;
            loser.velocity.y = -5;
            loser.velocity.x = loser.isFacingRight ? -3 : 3;

            for(let i=0; i<80; i++) {
                particles.push(new Particle(loser.position.x+30, loser.position.y+90, '#ff4400', 'fire', 2));
            }

            setTimeout(() => { endGameWithWinner(winner, true); }, 2000);
        }, 2000);
    }, 500);
}

function executePythonTrovaoFatality(winner, loser) {
    matchState = 'fatality';
    winner.velocity = {x:0, y:0};
    loser.velocity = {x:0, y:0};
    showCentralMessage("THUNDER GOD!", 1400);
    winner.isFacingRight = winner.position.x < loser.position.x;

    setTimeout(() => {
        winner.isAttacking = true;
        winner.attackType = 'special';
        let strikes = 0;
        const strikeFx = setInterval(() => {
            strikes++;
            loser.isHit = true;
            loser.hitTimer = 10;
            for(let i=0; i<22; i++) {
                particles.push(new Particle(
                    loser.position.x + 30 + (Math.random() - 0.5) * 50,
                    loser.position.y + 20 + Math.random() * 120,
                    '#bfe8ff',
                    'spark',
                    1.5
                ));
            }
            if (strikes >= 7) {
                clearInterval(strikeFx);
                loser.isKnockedDown = true;
                loser.knockdownTimer = Infinity;
                loser.velocity.y = -10;
                loser.velocity.x = winner.isFacingRight ? 8 : -8;
                setTimeout(() => endGameWithWinner(winner, true), 1300);
            }
        }, 170);
    }, 350);
}

function executeLoopDragaoFatality(winner, loser) {
    matchState = 'fatality';
    winner.velocity = {x:0, y:0};
    loser.velocity = {x:0, y:0};
    showCentralMessage("DRAGON FATALITY!", 1700);
    winner.isFacingRight = winner.position.x < loser.position.x;
    winner.isAttacking = true;
    winner.attackType = 'special';

    setTimeout(() => {
        playSfx('fire_cast');
        for (let i = 0; i < 40; i++) {
            particles.push(new Particle(loser.position.x + 30, loser.position.y + 80, '#ff7a00', 'fire', 2.2));
        }
        setTimeout(() => {
            loser.isShattered = true;
            for (let i = 0; i < 140; i++) {
                particles.push(new Particle(loser.position.x + 30, loser.position.y + 80, '#ff5f00', 'fire', 2.2));
                particles.push(new Particle(loser.position.x + 30, loser.position.y + 80, '#ff0000', 'blood', 1.5));
            }
            setTimeout(() => endGameWithWinner(winner, true), 1400);
        }, 900);
    }, 350);
}

function executeGitanaFatality(winner, loser) {
    matchState = 'fatality';
    winner.velocity = {x:0, y:0};
    loser.velocity = {x:0, y:0};
    showCentralMessage("FAN STORM!", 1300);
    winner.isFacingRight = winner.position.x < loser.position.x;
    winner.isAttacking = true;
    winner.attackType = 'special';
    let slashes = 0;
    const fx = setInterval(() => {
        slashes++;
        for(let i=0; i<18; i++) {
            particles.push(new Particle(loser.position.x + 30, loser.position.y + 50, '#9ad0ff', 'spark', 1.2));
            particles.push(new Particle(loser.position.x + 30, loser.position.y + 50, '#ff0000', 'blood', 1.2));
        }
        if (slashes >= 6) {
            clearInterval(fx);
            loser.isShattered = true;
            setTimeout(() => endGameWithWinner(winner, true), 900);
        }
    }, 150);
}

function executeMilenaByteFatality(winner, loser) {
    matchState = 'fatality';
    winner.velocity = {x:0, y:0};
    loser.velocity = {x:0, y:0};
    showCentralMessage("BYTE RUSH!", 1300);
    winner.isFacingRight = winner.position.x < loser.position.x;
    winner.isAttacking = true;
    winner.attackType = 'mileena_rush';
    let stabs = 0;
    const fx = setInterval(() => {
        stabs++;
        for(let i=0; i<20; i++) {
            particles.push(new Particle(loser.position.x + 30, loser.position.y + 70, '#f057ff', 'glow', 1.2));
            particles.push(new Particle(loser.position.x + 30, loser.position.y + 70, '#ff0000', 'blood', 1.3));
        }
        if (stabs >= 7) {
            clearInterval(fx);
            loser.isKnockedDown = true;
            loser.knockdownTimer = Infinity;
            setTimeout(() => endGameWithWinner(winner, true), 1000);
        }
    }, 145);
}

function attackCollision({ attacker, target }) {
    if(target.isShattered) return false;
    const aBox = attacker.attackBox;
    let aX = attacker.isFacingRight ? attacker.position.x : attacker.position.x - aBox.width + attacker.width;
    let aY = attacker.position.y + aBox.baseOffset.y;
    const tBox = target.hurtBox;
    return (aX + aBox.width >= tBox.x && aX <= tBox.x + tBox.width && aY + aBox.height >= tBox.y && aY <= tBox.y + tBox.height);
}

function resolveCharacterCollision(p1, p2) {
    if (matchState === 'fatality' || p1.isShattered || p2.isShattered) return;

    if (p1.position.y + p1.height < p2.position.y + 20 || p2.position.y + p2.height < p1.position.y + 20) return;

    let center1 = p1.position.x + p1.width / 2;
    let center2 = p2.position.x + p2.width / 2;
    let dist = Math.abs(center1 - center2);
    let minDist = (p1.width + p2.width) / 2;

    if (dist < minDist) {
        let overlap = minDist - dist;

        if (center1 < center2) {
            p1.position.x -= overlap / 2;
            p2.position.x += overlap / 2;
        } else {
            p1.position.x += overlap / 2;
            p2.position.x -= overlap / 2;
        }

        let fixBounds = (fighter) => {
            if (fighter.position.x < 0) fighter.position.x = 0;
            if (fighter.position.x + fighter.width > canvas.width) fighter.position.x = canvas.width - fighter.width;
        };
        fixBounds(p1);
        fixBounds(p2);

        if (p2.position.x + p2.width >= canvas.width && center1 < center2) {
            p1.position.x = p2.position.x - p1.width;
        } else if (p2.position.x <= 0 && center1 > center2) {
            p1.position.x = p2.position.x + p2.width;
        }
        if (p1.position.x + p1.width >= canvas.width && center2 < center1) {
            p2.position.x = p1.position.x - p2.width;
        } else if (p1.position.x <= 0 && center2 > center1) {
            p2.position.x = p1.position.x + p1.width;
        }
    }
}

function decreaseTimer() {
    if (!gameActive || isPaused || gameConfig.timeLimit === Infinity || matchState !== 'fighting') return;
    if (timer > 0) {
        timer--;
        document.querySelector('#timer').innerHTML = timer;
    }
    if (timer === 0) {
        endGameWithWinner(player.health === enemy.health ? null : (player.health > enemy.health ? player : enemy), false);
    }
    if (gameActive && matchState === 'fighting') {
        timerId = setTimeout(decreaseTimer, 1000);
    }
}

function processMovement(fighter, keys) {
    if (matchState === 'fatality') return;
    if (fighter.dashTimer > 0) return;

    let moveLeft = keys['left'];
    let moveRight = keys['right'];
    if (moveLeft && moveRight) {
        moveLeft = false;
        moveRight = false;
    }

    if (!fighter.isImmobilized) {
        fighter.isCrouching = keys['down'] && !fighter.isAirborne;
        fighter.isBlocking = keys['block'] && !fighter.isAirborne && !fighter.isAttacking;

        if (!fighter.isCrouching && !fighter.isAttacking && !fighter.isAirborne && !fighter.isBlocking && !fighter.isHit) {
            if (moveLeft) fighter.velocity.x = -6;
            else if (moveRight) fighter.velocity.x = 6;
            else fighter.velocity.x = 0;
        } else if (fighter.isAirborne && !fighter.isAttacking && !fighter.isHit) {
            if (moveLeft) fighter.velocity.x -= 0.5;
            if (moveRight) fighter.velocity.x += 0.5;
        }
    }

    if (fighter.isImmobilized || fighter.isCrouching || fighter.isAttacking || fighter.isBlocking || fighter.isHit || (!moveLeft && !moveRight)) {
        fighter.velocity.x *= 0.85;
        if (Math.abs(fighter.velocity.x) < 0.5) fighter.velocity.x = 0;
    }

    if (fighter.velocity.x > 15) fighter.velocity.x = 15;
    if (fighter.velocity.x < -15) fighter.velocity.x = -15;
}

function handleAction(fighter, cmd) {
    if (fighter.isImmobilized || fighter.isBlocking || matchState === 'game_over') return;
    let forward = fighter.isFacingRight ? 'right' : 'left';
    let back = fighter.isFacingRight ? 'left' : 'right';
    let opponent = fighter === player ? enemy : player;

    // FATALITIES
    if (matchState === 'finish_him' && fighter.health > 0) {
        let isClose = Math.abs(fighter.position.x - opponent.position.x) < 140;
        if (fighter.id === 'backend-frio' && fighter.checkCombo([forward, forward, 'punch']) && isClose) {
            executeBackendFrioFatality(fighter, opponent);
            return;
        } else if (fighter.id === 'frontend-quente' && fighter.checkCombo(['down', 'down', 'punch'])) {
            executeFrontendQuenteFatality(fighter, opponent);
            return;
        } else if (fighter.id === 'php-storm' && fighter.checkCombo([forward, forward, 'kick']) && isClose) {
            executePythonTrovaoFatality(fighter, opponent);
            return;
        } else if (fighter.id === 'loop-dragao' && fighter.checkCombo([forward, forward, 'kick']) && isClose) {
            executeLoopDragaoFatality(fighter, opponent);
            return;
        } else if (fighter.id === 'git.ana' && fighter.checkCombo([back, back, 'kick']) && isClose) {
            executeGitanaFatality(fighter, opponent);
            return;
        } else if (fighter.id === 'ada-byte' && fighter.checkCombo(['down', 'down', 'kick']) && isClose) {
            executeMilenaByteFatality(fighter, opponent);
            return;
        }
    }

    if (cmd === 'up' && !fighter.isAirborne && !fighter.isAttacking) {
        fighter.velocity.y = -22;
    } else if (cmd === 'punch') {
        if (!fighter.isAirborne && fighter.id === 'backend-frio' && fighter.checkCombo(['down', forward, 'punch'])) {
            playSfx('ice_cast');
            fighter.specialIceball();
        } else if (!fighter.isAirborne && fighter.id === 'frontend-quente' && fighter.checkCombo([back, back, 'punch'])) {
            const canSpear = !opponent.isPulled && !opponent.isKnockedDown && !opponent.isDead && Math.abs(opponent.position.y - fighter.position.y) < 60;
            if (canSpear) {
                playSfx('spear_cast');
                fighter.specialSpear();
            }
        } else if (!fighter.isAirborne && fighter.id === 'php-storm' && fighter.checkCombo(['down', forward, 'punch'])) {
            playSfx('thunder_cast');
            fighter.specialLightning();
        } else if (!fighter.isAirborne && fighter.id === 'loop-dragao' && fighter.checkCombo(['down', forward, 'punch'])) {
            playSfx('fire_cast');
            fighter.specialFireball();
        } else if (!fighter.isAirborne && fighter.id === 'git.ana' && fighter.checkCombo([back, back, 'punch'])) {
            playSfx('fan_cast');
            fighter.specialFanBlade();
        } else if (!fighter.isAirborne && fighter.id === 'ada-byte' && fighter.checkCombo([back, back, 'punch'])) {
            playSfx('orb_cast');
            fighter.specialSaiOrb();
        } else {
            playSfx('punch');
            fighter.attackPunch();
        }
    } else if (cmd === 'kick') {
        if (!fighter.isAirborne && fighter.id === 'backend-frio' && fighter.checkCombo([back, forward, 'kick'])) {
            playSfx('slide_cast');
            fighter.specialSlideDash();
        } else if (!fighter.isAirborne && fighter.id === 'frontend-quente' && fighter.checkCombo(['down', back, 'kick'])) {
            playSfx('teleport_cast');
            fighter.specialTeleportStrike(opponent);
        } else if (!fighter.isAirborne && fighter.id === 'php-storm' && fighter.checkCombo([back, forward, 'kick'])) {
            playSfx('slide_cast');
            fighter.specialSlideDash();
        } else if (!fighter.isAirborne && fighter.id === 'loop-dragao' && fighter.checkCombo([forward, forward, 'kick'])) {
            playSfx('fire_cast');
            fighter.specialFlyingKick();
        } else if (!fighter.isAirborne && fighter.id === 'git.ana' && fighter.checkCombo(['down', forward, 'kick'])) {
            playSfx('fan_cast');
            fighter.specialSpinDash();
        } else if (!fighter.isAirborne && fighter.id === 'ada-byte' && fighter.checkCombo(['down', forward, 'kick'])) {
            playSfx('orb_cast');
            fighter.specialMileenaRush();
        } else {
            playSfx('kick');
            fighter.attackKick();
        }
    }
}

function animate() {
    if (!gameActive) return;
    animationFrameId = window.requestAnimationFrame(animate);
    if (isPaused) return;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    player.update(ctx, canvas, floorY);
    enemy.update(ctx, canvas, floorY);

    if (matchState === 'finish_him') {
        finishHimTimerFrames--;
        if(finishHimTimerFrames <= 0) {
            let loser = player.health <= 0 ? player : enemy;
            loser.stunTimer = 0;
            loser.isDead = true;
            loser.isKnockedDown = true;
            loser.knockdownTimer = Infinity;
            endGameWithWinner(player.health > 0 ? player : enemy, false);
        }
    }

    if (!player.isDead && !enemy.isDead && !player.isAirborne && !enemy.isAirborne && !player.isKnockedDown && !enemy.isKnockedDown && matchState === 'fighting') {
        player.isFacingRight = player.position.x < enemy.position.x;
        enemy.isFacingRight = !player.isFacingRight;
    }

    processMovement(player, keysStateP1);
    processMovement(enemy, keysStateP2);

    resolveCharacterCollision(player, enemy);

    // Partículas
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(ctx);
        if (particles[i].alpha <= 0) particles.splice(i, 1);
    }

    // Projéteis
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let proj = projectiles[i];
        proj.update(ctx);
        if(!proj.active) continue;

        let target = proj.owner === player ? enemy : player;
        if (!target.isShattered && proj.position.x + proj.width >= target.hurtBox.x && proj.position.x <= target.hurtBox.x + target.hurtBox.width &&
            proj.position.y + proj.height >= target.hurtBox.y && proj.position.y <= target.hurtBox.y + target.hurtBox.height) {

            if (target.isBlocking && !target.isAirborne && matchState === 'fighting') {
                target.takeHit(2, 'normal');
                playSfx('hit');
                proj.active = false;
            } else if (proj.type !== 'fire') {
                if (proj.type === 'ice') target.freezeTimer = 70;
                else if (proj.type === 'spear') {
                    if (!target.isKnockedDown && !target.isDead) {
                        target.isPulled = true;
                        target.pulledBy = proj.owner;
                        target.takeHit(5, 'normal');
                    }
                } else if (proj.type === 'lightning') {
                    target.takeHit(11, 'normal');
                } else if (proj.type === 'fireball_red') {
                    target.takeHit(13, 'normal');
                } else if (proj.type === 'green_arc') {
                    target.takeHit(12, 'normal');
                } else if (proj.type === 'fan_blade') {
                    target.takeHit(12, 'normal');
                } else if (proj.type === 'sai_orb') {
                    target.takeHit(11, 'normal');
                }
                if (proj.type === 'spear') playSfx('spear_hit');
                else if (proj.type === 'ice') playSfx('ice_hit');
                else if (proj.type === 'lightning') playSfx('thunder_hit');
                else if (proj.type === 'fireball_red') playSfx('fire_hit');
                else if (proj.type === 'fan_blade') playSfx('fan_hit');
                else if (proj.type === 'sai_orb') playSfx('orb_hit');
                else playSfx('hit');
                for(let j=0; j<15; j++) {
                    particles.push(new Particle(proj.position.x, proj.position.y, proj.color, 'glow'));
                }
                proj.active = false;
            }
            if(!proj.active) projectiles.splice(i, 1);
            updateHealthUI(target, target === player ? '#player-health' : '#enemy-health');
        } else if (proj.position.x < -100 || proj.position.x > canvas.width + 100) {
            projectiles.splice(i, 1);
        }
    }

    // Colisão de ataques
    if(matchState === 'fighting' || matchState === 'finish_him') {
        const fighters = [
            {atk: player, def: enemy, ui: '#enemy-health'},
            {atk: enemy, def: player, ui: '#player-health'}
        ];
        fighters.forEach(({atk, def, ui}) => {
            if (atk.isAttacking && !atk.hasHit && attackCollision({ attacker: atk, target: def }) && (!def.isDead || matchState === 'finish_him')) {
                atk.hasHit = true;
                def.takeHit(atk.attackDamage, atk.attackType);
                playSfx('hit');
                if ((atk.attackType === 'slide_dash' || atk.attackType === 'spin_dash') && atk.dashStopsOnHit) atk.stopDashSpecial();
                updateHealthUI(def, ui);
            }
        });
    }
}

function resetGameState() {
    player.resetState();
    enemy.resetState();
    player.position.x = canvas.width * 0.2;
    player.position.y = floorY - player.height;
    enemy.position.x = canvas.width * 0.8 - enemy.width;
    enemy.position.y = floorY - enemy.height;
    player.isFacingRight = true;
    enemy.isFacingRight = false;

    matchState = 'fighting';
    document.getElementById('blood-overlay').style.display = 'none';

    timer = gameConfig.timeLimit;
    document.querySelector('#timer').innerHTML = timer === Infinity ? '∞' : timer;
    clearTimeout(timerId);

    updateHealthUI(player, '#player-health');
    updateHealthUI(enemy, '#enemy-health');
    particles = [];
    projectiles = [];
    for(let k in keysStateP1) keysStateP1[k] = false;
    for(let k in keysStateP2) keysStateP2[k] = false;
}

function startGame() {
    if (typeof canStartMatch === 'function' && !canStartMatch()) {
        showCentralMessage('Os dois jogadores precisam ficar PRONTOS.', 1600);
        return;
    }
    setupSelectedFighters();
    applySelectedCharacterUI();
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('character-select-menu').style.display = 'none';
    document.getElementById('pause-commands-panel').style.display = 'none';
    document.getElementById('ui-layer').style.display = 'flex';
    resetGameState();

    showCentralMessage("FIGHT!", 1500);
    playSfx('fight_start');

    setTimeout(() => {
        gameActive = true;
        isPaused = false;
        if(gameConfig.timeLimit !== Infinity) decreaseTimer();
        animate();
    }, 1500);
}

function togglePause() {
    if (!gameActive || matchState !== 'fighting') return;
    isPaused = !isPaused;
    playSfx(isPaused ? 'pause' : 'resume');
    document.getElementById('pause-menu').style.display = isPaused ? 'flex' : 'none';
    if (isPaused) renderPauseCommandList();
    else closePauseCommandList();
    if(!isPaused && gameConfig.timeLimit !== Infinity) decreaseTimer();
}

function quitToMenu() {
    isPaused = false;
    gameActive = false;
    window.cancelAnimationFrame(animationFrameId);
    clearTimeout(timerId);
    document.getElementById('pause-menu').style.display = 'none';
    document.getElementById('pause-commands-panel').style.display = 'none';
    document.getElementById('character-select-menu').style.display = 'none';
    document.getElementById('ui-layer').style.display = 'none';
    document.getElementById('central-message').style.display = 'none';
    document.getElementById('blood-overlay').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
}
