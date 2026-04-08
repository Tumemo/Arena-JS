// fighter.js - Classe do lutador/personagem

class Fighter {
    constructor({ name, position, color, isFacingRight, uiPrefix }) {
        this.name = name;
        this.position = position;
        this.velocity = { x: 0, y: 0 };
        this.width = 60;
        this.height = 180;
        this.color = color;
        this.isFacingRight = isFacingRight;
        this.uiPrefix = uiPrefix;
        this.originalBaseColor = '#111';
        this.originalSkinColor = '#ffccaa';
        this.originalColor = color;
        this.resetState();
    }

    resetState() {
        this.health = 100;
        this.isDead = false;
        this.velocity = { x: 0, y: 0 };
        this.isCrouching = false;
        this.isBlocking = false;
        this.freezeTimer = 0;
        this.stunTimer = 0;
        this.isPulled = false;
        this.pulledBy = null;
        this.isKnockedDown = false;
        this.knockdownTimer = 0;
        this.inputs = [];
        this.specialCooldown = 0;
        this.maxSpecialCooldown = 180;
        this.isAttacking = false;
        this.attackType = 'punch';
        this.attackDamage = 10;
        this.attackCooldown = false;
        this.hasHit = false;
        this.isHit = false;
        this.hitTimer = 0;
        this.attackBox = { width: 100, height: 40, baseOffset: { x: 0, y: 30 } };
        this.isShattered = false;
        this.isBurned = false;
        this.isMaskless = false;
        this.baseColor = this.originalBaseColor;
        this.skinColor = this.originalSkinColor;
        this.color = this.originalColor;
    }

    get isAirborne() {
        return this.position.y + this.height < floorY;
    }

    get hurtBox() {
        if (this.isKnockedDown && !this.isAirborne) {
            return { x: this.position.x, y: this.position.y + 140, width: this.width, height: 40 };
        }
        if (this.isCrouching && !this.isAirborne) {
            return { x: this.position.x, y: this.position.y + 60, width: this.width, height: this.height - 60 };
        }
        return { x: this.position.x, y: this.position.y, width: this.width, height: this.height };
    }

    get isImmobilized() {
        return this.isDead || this.freezeTimer > 0 || this.stunTimer > 0 || this.isPulled || this.isKnockedDown || matchState === 'fatality' || (matchState === 'finish_him' && this.health <= 0);
    }

    addInput(cmd) {
        this.inputs.push(cmd);
        if (this.inputs.length > 5) this.inputs.shift();
        clearTimeout(this.inputTimer);
        this.inputTimer = setTimeout(() => { this.inputs = []; }, 500);
    }

    checkCombo(sequence) {
        const seqStr = sequence.join(',');
        const inputStr = this.inputs.join(',');
        if (inputStr.endsWith(seqStr)) {
            this.inputs = [];
            return true;
        }
        return false;
    }

    executeAttack(w, h, offset, type, damage, cooldownTime = 500) {
        if (this.attackCooldown || this.isImmobilized || this.isBlocking) return;
        this.isAttacking = true;
        this.hasHit = false;
        this.attackType = type;
        this.attackDamage = damage;
        this.attackBox.width = w;
        this.attackBox.height = h;
        this.attackBox.baseOffset = offset;
        this.attackCooldown = true;

        setTimeout(() => {
            if(!isPaused && matchState !== 'fatality') this.isAttacking = false;
        }, 250);
        setTimeout(() => {
            if(!isPaused) this.attackCooldown = false;
        }, cooldownTime);
    }

    attackPunch() {
        if (this.isAirborne) this.executeAttack(80, 40, {x: 0, y: 80}, 'jump_punch', 12);
        else if (this.isCrouching) this.executeAttack(80, 100, {x: 0, y: -30}, 'uppercut', 20, 800);
        else this.executeAttack(110, 25, {x: 0, y: 30}, 'punch', 10);
    }

    attackKick() {
        if (this.isAirborne) this.executeAttack(110, 40, {x: 0, y: 100}, 'jump_kick', 15);
        else if (this.isCrouching) this.executeAttack(140, 30, {x: 0, y: 150}, 'sweep', 10, 800);
        else this.executeAttack(130, 25, {x: 0, y: 60}, 'kick', 15);
    }

    specialIceball() {
        if(this.attackCooldown || this.isImmobilized || this.specialCooldown > 0 || this.isBlocking) return;
        this.executeAttack(0,0,{x:0,y:0}, 'special', 0, 800);
        this.specialCooldown = this.maxSpecialCooldown;
        projectiles.push(new Projectile({
            position: { x: this.position.x + (this.isFacingRight ? this.width : -30), y: this.position.y + 40 },
            velocity: { x: this.isFacingRight ? 15 : -15, y: 0 },
            color: '#00ffff',
            type: 'ice',
            owner: this
        }));
    }

    specialSpear() {
        if(this.attackCooldown || this.isImmobilized || this.specialCooldown > 0 || this.isBlocking) return;
        this.executeAttack(0,0,{x:0,y:0}, 'special', 0, 800);
        this.specialCooldown = this.maxSpecialCooldown;
        projectiles.push(new Projectile({
            position: { x: this.position.x + (this.isFacingRight ? this.width : -30), y: this.position.y + 40 },
            velocity: { x: this.isFacingRight ? 25 : -25, y: 0 },
            color: '#ffcc00',
            type: 'spear',
            owner: this
        }));
    }

    draw(ctx, canvas, floorY) {
        if (this.isShattered) return;

        ctx.save();

        if (this.isHit) ctx.filter = 'brightness(200%) sepia(100%) hue-rotate(-50deg) saturate(500%)';
        else if (this.freezeTimer > 0) ctx.filter = 'brightness(150%) sepia(100%) hue-rotate(150deg) saturate(300%)';
        else if (this.isBlocking) ctx.filter = 'brightness(80%)';

        let isCrouched = this.isCrouching && !this.isAirborne;
        let bobY = 0;
        let isMovingBackward = (this.velocity.x < 0 && this.isFacingRight) || (this.velocity.x > 0 && !this.isFacingRight);
        let walkDir = isMovingBackward ? -1 : 1;
        let walkCycle = Date.now() / 150;

        if (Math.abs(this.velocity.x) > 0 && !this.isAirborne && !isCrouched && !this.isKnockedDown) {
            bobY = Math.abs(Math.sin(walkCycle)) * 6;
        }

        ctx.translate(this.position.x + this.width / 2, this.position.y + this.height - bobY);
        if (!this.isFacingRight) ctx.scale(-1, 1);

        let drawY = isCrouched ? -120 : -180;

        if (this.freezeTimer > 0) {
            ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00ffff';
            ctx.fillRect(-40, drawY - 10, 80, this.height + 20);
            ctx.shadowBlur = 0;
        }

        let armFrontAngle = 0, armBackAngle = 0;
        let legFrontAngle = 0, legBackAngle = 0;
        let legFrontY = 0, legBackY = 0;

        // Estados de animação
        if (this.isDead || this.isKnockedDown) {
            if (!this.isAirborne) {
                ctx.translate(0, 40);
                ctx.rotate(-Math.PI / 2);
                drawY = -120;
                armFrontAngle = -3.0;
                armBackAngle = -3.0;
                legFrontAngle = -0.2;
                legBackAngle = 0.2;
            } else {
                ctx.rotate(-Math.PI / 4);
                armFrontAngle = -2.5;
                armBackAngle = -1.5;
                legFrontAngle = 0.5;
                legBackAngle = 1.0;
            }
        } else if (this.stunTimer > 0) {
            let sway = Math.sin(Date.now() / 150) * 0.3;
            armFrontAngle = -0.3 + sway;
            armBackAngle = 0.3 - sway;
            ctx.rotate(sway * 0.5);
        } else if (isCrouched) {
            legFrontAngle = -1.0;
            legBackAngle = 1.0;
            legFrontY = -40;
            legBackY = -40;
            armFrontAngle = -0.3;
            drawY = -120;
        } else if (this.isAirborne) {
            legFrontAngle = -0.2;
            legBackAngle = 0.5;
            legFrontY = -20;
            if (this.isAttacking && this.attackType === 'jump_kick') {
                legFrontAngle = -1.5;
                armFrontAngle = 0.5;
            }
        } else if (Math.abs(this.velocity.x) > 0) {
            legFrontAngle = Math.sin(walkCycle * walkDir) * 0.6;
            legBackAngle = -Math.sin(walkCycle * walkDir) * 0.6;
            armFrontAngle = -Math.sin(walkCycle * walkDir) * 0.5;
            armBackAngle = Math.sin(walkCycle * walkDir) * 0.5;
        }

        if (this.isBlocking && !this.isAttacking && !this.isImmobilized) {
            armFrontAngle = -2.2;
            armBackAngle = -2.2;
            if(!isCrouched) drawY += 5;
        }

        if (this.isAttacking && (!this.isImmobilized || matchState === 'fatality') && !this.isBlocking) {
            if (this.attackType === 'punch' || this.attackType === 'jump_punch') { armFrontAngle = -1.5; }
            else if (this.attackType === 'uppercut') { armFrontAngle = -3.0; drawY += 10; }
            else if (this.attackType === 'kick') { legFrontAngle = -1.5; armFrontAngle = -0.5; }
            else if (this.attackType === 'sweep') {
                legFrontAngle = -1.8;
                legBackAngle = 1.2;
                armFrontAngle = -0.2;
                armBackAngle = -0.5;
                drawY = -100;
                legFrontY = -20;
            }
            else if (this.attackType === 'special') { armFrontAngle = -1.5; armBackAngle = -1.5; }
        }

        // Desenho corpo
        ctx.fillStyle = this.baseColor;
        ctx.save();
        ctx.translate(10, drawY + 90);
        ctx.rotate(legBackAngle);
        ctx.fillRect(-10, legBackY, 20, 90 + (bobY*0.5));
        ctx.restore();

        ctx.fillStyle = this.baseColor;
        ctx.save();
        ctx.translate(15, drawY + 40);
        ctx.rotate(armBackAngle);
        ctx.fillRect(-10, 0, 20, 60);
        ctx.restore();

        ctx.fillStyle = this.baseColor;
        ctx.fillRect(-20, drawY + 30, 40, 70);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(-20, drawY + 30);
        ctx.lineTo(20, drawY + 30);
        ctx.lineTo(25, drawY + 100);
        ctx.lineTo(-25, drawY + 100);
        ctx.fill();

        if(!this.isBurned) {
            ctx.fillStyle = '#000';
            ctx.fillRect(-26, drawY + 80, 52, 10);
            ctx.fillStyle = this.color;
            ctx.fillRect(-22, drawY + 82, 44, 6);
        }

        // Cabeça
        if (this.isMaskless) {
            ctx.fillStyle = '#ddd';
            ctx.fillRect(-15, drawY, 30, 30);
            ctx.fillStyle = '#000';
            ctx.fillRect(-8, drawY + 8, 8, 8);
            ctx.fillRect(8, drawY + 8, 8, 8);
            ctx.fillRect(-10, drawY + 22, 20, 4);
        } else {
            ctx.fillStyle = this.skinColor;
            ctx.fillRect(-15, drawY, 30, 30);
            if(!this.isBurned) {
                ctx.fillStyle = this.baseColor;
                ctx.fillRect(-16, drawY - 2, 32, 12);
                ctx.fillStyle = this.color;
                ctx.fillRect(-16, drawY + 18, 32, 14);
                ctx.fillStyle = '#fff';
                ctx.fillRect(2, drawY + 10, 8, 4);
                ctx.shadowBlur = 5;
                ctx.shadowColor = '#fff';
                ctx.fillRect(2, drawY + 10, 8, 4);
                ctx.shadowBlur = 0;
            }
        }

        // Perna frente
        ctx.fillStyle = this.baseColor;
        ctx.save();
        ctx.translate(-10, drawY + 90);
        ctx.rotate(legFrontAngle);
        ctx.fillRect(-10, legFrontY, 20, 90 + (bobY*0.5));
        ctx.fillStyle = this.color;
        ctx.fillRect(-11, legFrontY + 40, 22, 40);
        ctx.restore();

        // Braço frente
        ctx.fillStyle = this.skinColor;
        ctx.save();
        ctx.translate(-15, drawY + 40);
        ctx.rotate(armFrontAngle);
        ctx.fillRect(-10, 0, 20, 65);
        if(!this.isBurned) {
            ctx.fillStyle = this.baseColor;
            ctx.fillRect(-11, -2, 22, 45);
            ctx.fillStyle = this.color;
            ctx.fillRect(-12, 30, 24, 20);
        }
        ctx.restore();

        if(this.isBlocking && !this.isBurned) {
            ctx.beginPath();
            ctx.arc(0, drawY + 50, 70, -Math.PI/2, Math.PI/2);
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 5;
            ctx.stroke();
        }

        ctx.restore();
    }

    update(ctx, canvas, floorY) {
        this.draw(ctx, canvas, floorY);
        if (this.isDead && matchState !== 'fatality') return;

        if (this.specialCooldown > 0) {
            this.specialCooldown--;
            document.getElementById(`${this.uiPrefix}-special`).style.width = `${100 - ((this.specialCooldown / this.maxSpecialCooldown) * 100)}%`;
        } else {
            document.getElementById(`${this.uiPrefix}-special`).style.width = `100%`;
        }

        if (this.hitTimer > 0) {
            this.hitTimer--;
            if(this.hitTimer === 0) this.isHit = false;
        }

        if (this.freezeTimer > 0 && this.freezeTimer !== Infinity) {
            this.freezeTimer--;
            this.velocity.x = 0;
        }

        if (this.knockdownTimer > 0 && this.knockdownTimer !== Infinity) {
            this.knockdownTimer--;
            if(this.knockdownTimer === 0) this.isKnockedDown = false;
        }

        if (this.stunTimer > 0) {
            if(this.stunTimer !== Infinity) this.stunTimer--;
            this.velocity.x = 0;
            if (Math.random() < 0.2) {
                particles.push(new Particle(
                    this.position.x + this.width/2 + (Math.random()-0.5)*40,
                    this.position.y - 20,
                    '#ffff00',
                    'spark'
                ));
            }
        }

        if (this.isPulled && this.pulledBy) {
            this.velocity.x = this.position.x > this.pulledBy.position.x ? -15 : 15;
            if (Math.abs(this.position.x - this.pulledBy.position.x) < 80) {
                this.isPulled = false;
                if(matchState !== 'finish_him') this.stunTimer = 120;
                this.velocity.x = 0;
            }
        }

        // Física e gravidade
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // Restrição das bordas
        if (this.position.x < 0) {
            this.position.x = 0;
            this.velocity.x = 0;
        }
        if (this.position.x + this.width > canvas.width) {
            this.position.x = canvas.width - this.width;
            this.velocity.x = 0;
        }

        let currentGravity = (this.isKnockedDown && this.isAirborne) ? globalGravity * 0.4 : globalGravity;

        if (this.position.y + this.height + this.velocity.y >= floorY) {
            this.velocity.y = 0;
            this.position.y = floorY - this.height;
            if (this.isBurned) this.velocity.x = 0;
        } else {
            this.velocity.y += currentGravity;
        }
    }

    takeHit(damage, hitType = 'normal') {
        if (matchState === 'finish_him' && this.health <= 0) {
            this.stunTimer = 0;
            this.isDead = true;
            this.isKnockedDown = true;
            this.knockdownTimer = Infinity;
            endGameWithWinner(this === player ? enemy : player, false);
            return;
        }

        if (this.isBlocking && !this.isAirborne && hitType !== 'sweep') {
            this.health -= damage * 0.1;
            this.velocity.x = this.isFacingRight ? -6 : 6;
            for(let i=0; i<10; i++) {
                particles.push(new Particle(
                    this.position.x + this.width/2,
                    this.position.y + 50,
                    '#aaffff',
                    'spark'
                ));
            }
        } else {
            this.health -= damage;
            this.isHit = true;
            this.hitTimer = 15;
            for(let i=0; i<20; i++) {
                particles.push(new Particle(
                    this.position.x + this.width/2,
                    this.position.y + 50,
                    '#ff0000',
                    'blood'
                ));
            }

            if (hitType === 'sweep') {
                this.isKnockedDown = true;
                this.knockdownTimer = 60;
                this.velocity.y = -2;
                this.velocity.x = 0;
            } else if (hitType === 'uppercut') {
                this.isKnockedDown = true;
                this.knockdownTimer = 80;
                this.velocity.y = -13;
                this.velocity.x = this.isFacingRight ? -3 : 3;
            } else if (hitType === 'jump_kick') {
                this.velocity.x = this.isFacingRight ? -10 : 10;
            } else {
                this.velocity.x = this.isFacingRight ? -4 : 4;
            }
        }

        if (this.health <= 0) this.health = 0;
        checkMatchState();
    }
}
