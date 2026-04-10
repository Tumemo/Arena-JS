// fighter.js - Classe do lutador/personagem

class Fighter {
    constructor({ id, name, archetype, accent, position, color, baseColor, skinColor, isFacingRight, uiPrefix }) {
        this.id = id;
        this.name = name;
        this.archetype = archetype || 'ninja';
        this.accent = accent || '#ffffff';
        this.position = position;
        this.velocity = { x: 0, y: 0 };
        this.width = 60;
        this.height = 180;
        this.color = color;
        this.isFacingRight = isFacingRight;
        this.uiPrefix = uiPrefix;
        this.originalBaseColor = baseColor || '#111';
        this.originalSkinColor = skinColor || '#ffccaa';
        this.originalColor = color;
        this.colorShade = 1;
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
        this.maxSpecialCooldown = 110;
        this.isAttacking = false;
        this.attackType = 'punch';
        this.attackDamage = 10;
        this.attackCooldown = false;
        this.hasHit = false;
        this.isHit = false;
        this.hitTimer = 0;
        this.attackBox = { width: 100, height: 40, baseOffset: { x: 0, y: 30 } };
        this.dashTimer = 0;
        this.dashSpeed = 0;
        this.dashDamage = 0;
        this.specialKind = null;
        this.dashStopsOnHit = false;
        this.isShattered = false;
        this.isBurned = false;
        this.isMaskless = false;
        this.baseColor = this.originalBaseColor;
        this.skinColor = this.originalSkinColor;
        this.color = this.originalColor;
        this.applyColorShade(this.colorShade);
        this.lastLightAttackAt = 0;
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

    executeAttack(w, h, offset, type, damage, cooldownTime = 500, activeTime = 220) {
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
        }, activeTime);
        setTimeout(() => {
            if(!isPaused) this.attackCooldown = false;
        }, cooldownTime);
    }

    canUseLightAttack(minGapMs = 120) {
        const now = Date.now();
        if ((now - this.lastLightAttackAt) < minGapMs) return false;
        this.lastLightAttackAt = now;
        return true;
    }

    attackPunch() {
        if (this.isAirborne) this.executeAttack(80, 40, {x: 0, y: 80}, 'jump_punch', 12, 420, 210);
        else if (this.isCrouching) this.executeAttack(80, 100, {x: 0, y: -30}, 'uppercut', 20, 800, 280);
        else if (this.canUseLightAttack()) this.executeAttack(110, 25, {x: 0, y: 30}, 'punch', 8, 220, 150);
    }

    attackKick() {
        if (this.isAirborne) this.executeAttack(110, 40, {x: 0, y: 100}, 'jump_kick', 15, 450, 210);
        else if (this.isCrouching) this.executeAttack(140, 30, {x: 0, y: 150}, 'sweep', 10, 800, 280);
        else if (this.canUseLightAttack()) this.executeAttack(130, 25, {x: 0, y: 60}, 'kick', 12, 260, 170);
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

    specialLightning() {
        if(this.attackCooldown || this.isImmobilized || this.specialCooldown > 0 || this.isBlocking) return;
        this.executeAttack(0,0,{x:0,y:0}, 'special', 0, 850);
        this.specialCooldown = this.maxSpecialCooldown;
        projectiles.push(new Projectile({
            position: { x: this.position.x + (this.isFacingRight ? this.width : -30), y: this.position.y + 25 },
            velocity: { x: this.isFacingRight ? 18 : -18, y: 0 },
            color: '#a9d9ff',
            type: 'lightning',
            owner: this
        }));
    }

    specialLaserOrb() {
        if(this.attackCooldown || this.isImmobilized || this.specialCooldown > 0 || this.isBlocking) return;
        this.executeAttack(0,0,{x:0,y:0}, 'special', 0, 850);
        this.specialCooldown = this.maxSpecialCooldown;
        projectiles.push(new Projectile({
            position: { x: this.position.x + (this.isFacingRight ? this.width : -30), y: this.position.y + 45 },
            velocity: { x: this.isFacingRight ? 20 : -20, y: 0 },
            color: '#ff2b2b',
            type: 'laser',
            owner: this
        }));
    }

    specialFireball() {
        if(this.attackCooldown || this.isImmobilized || this.specialCooldown > 0 || this.isBlocking) return;
        this.executeAttack(0,0,{x:0,y:0}, 'special', 0, 820);
        this.specialCooldown = this.maxSpecialCooldown;
        projectiles.push(new Projectile({
            position: { x: this.position.x + (this.isFacingRight ? this.width : -30), y: this.position.y + 40 },
            velocity: { x: this.isFacingRight ? 18 : -18, y: 0 },
            color: '#ff4a00',
            type: 'fireball_red',
            owner: this
        }));
    }

    specialGreenArc() {
        if(this.attackCooldown || this.isImmobilized || this.specialCooldown > 0 || this.isBlocking) return;
        this.executeAttack(0,0,{x:0,y:0}, 'special', 0, 900);
        this.specialCooldown = this.maxSpecialCooldown;
        projectiles.push(new Projectile({
            position: { x: this.position.x + (this.isFacingRight ? this.width : -30), y: this.position.y + 35 },
            velocity: { x: this.isFacingRight ? 12 : -12, y: -11 },
            color: '#4cff61',
            type: 'green_arc',
            owner: this
        }));
    }

    specialFanBlade() {
        if(this.attackCooldown || this.isImmobilized || this.specialCooldown > 0 || this.isBlocking) return;
        this.executeAttack(0,0,{x:0,y:0}, 'special', 0, 850);
        this.specialCooldown = this.maxSpecialCooldown;
        projectiles.push(new Projectile({
            position: { x: this.position.x + (this.isFacingRight ? this.width : -30), y: this.position.y + 35 },
            velocity: { x: this.isFacingRight ? 16 : -16, y: 0 },
            color: '#9ad0ff',
            type: 'fan_blade',
            owner: this
        }));
    }

    specialSaiOrb() {
        if(this.attackCooldown || this.isImmobilized || this.specialCooldown > 0 || this.isBlocking) return;
        this.executeAttack(0,0,{x:0,y:0}, 'special', 0, 850);
        this.specialCooldown = this.maxSpecialCooldown;
        projectiles.push(new Projectile({
            position: { x: this.position.x + (this.isFacingRight ? this.width : -30), y: this.position.y + 45 },
            velocity: { x: this.isFacingRight ? 14 : -14, y: -6 },
            color: '#f057ff',
            type: 'sai_orb',
            owner: this
        }));
    }

    beginDashSpecial(kind, speed, damage, duration, stopOnHit = false) {
        if (this.attackCooldown || this.isImmobilized || this.specialCooldown > 0 || this.isBlocking) return;
        this.executeAttack(130, 70, { x: 0, y: 70 }, kind, damage, 1000);
        this.specialCooldown = this.maxSpecialCooldown;
        this.dashSpeed = this.isFacingRight ? speed : -speed;
        this.dashDamage = damage;
        this.dashTimer = duration;
        this.specialKind = kind;
        this.dashStopsOnHit = stopOnHit;
    }

    specialSlideDash() {
        this.beginDashSpecial('slide_dash', 17, 18, 60, true);
    }

    specialSpinDash() {
        this.beginDashSpecial('spin_dash', 14, 20, 22, true);
    }

    specialFlyingKick() {
        this.beginDashSpecial('liu_flying_kick', 15, 19, 28, true);
    }

    specialShadowKick() {
        this.beginDashSpecial('cage_shadow_kick', 16, 18, 22, true);
    }

    specialMileenaRush() {
        this.beginDashSpecial('mileena_rush', 15, 19, 60, true);
    }

    stopDashSpecial() {
        this.dashTimer = 0;
        this.dashSpeed = 0;
        this.dashDamage = 0;
        this.specialKind = null;
        this.dashStopsOnHit = false;
        this.isAttacking = false;
    }

    toHexChannel(value) {
        const clamped = Math.max(0, Math.min(255, Math.round(value)));
        return clamped.toString(16).padStart(2, '0');
    }

    shadeHexColor(hex, factor) {
        if (!hex || hex[0] !== '#' || hex.length !== 7) return hex;
        const r = parseInt(hex.slice(1, 3), 16) * factor;
        const g = parseInt(hex.slice(3, 5), 16) * factor;
        const b = parseInt(hex.slice(5, 7), 16) * factor;
        return `#${this.toHexChannel(r)}${this.toHexChannel(g)}${this.toHexChannel(b)}`;
    }

    applyColorShade(factor = 1) {
        this.colorShade = factor;
        this.color = this.shadeHexColor(this.originalColor, factor);
        this.baseColor = this.shadeHexColor(this.originalBaseColor, factor);
        this.skinColor = this.shadeHexColor(this.originalSkinColor, factor);
    }

    drawUniqueDetails(ctx, drawY) {
        if (this.archetype === 'storm_python') {
            // Chapeu em cone para lembrar o visual classico
            ctx.fillStyle = '#d9e6ff';
            ctx.beginPath();
            ctx.moveTo(0, drawY - 18);
            ctx.lineTo(-30, drawY + 10);
            ctx.lineTo(30, drawY + 10);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#9ec2ff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.strokeStyle = this.accent;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-14, drawY + 18);
            ctx.lineTo(-2, drawY + 26);
            ctx.lineTo(-10, drawY + 36);
            ctx.lineTo(4, drawY + 47);
            ctx.stroke();
            ctx.fillStyle = '#dff4ff';
            ctx.fillRect(-18, drawY + 4, 36, 6);
        } else if (this.archetype === 'cyber_commando') {
            // Placa peitoral estilo MK1
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(-22, drawY + 32, 44, 22);
            ctx.fillStyle = '#2c2c2c';
            ctx.fillRect(-18, drawY + 36, 36, 12);
            ctx.fillStyle = this.accent;
            ctx.fillRect(-20, drawY + 38, 40, 5);
        } else if (this.archetype === 'shaolin') {
            // Loop-Dragao: cabelo longo, sem camisa, calca preta e botas brancas
            ctx.fillStyle = '#101010';
            ctx.fillRect(-14, drawY - 3, 28, 9);
            ctx.fillRect(-20, drawY + 7, 6, 28);
            ctx.fillRect(14, drawY + 7, 6, 28);
            ctx.fillStyle = '#000000';
            ctx.fillRect(-22, drawY + 68, 44, 30);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-22, drawY + 126, 10, 12);
            ctx.fillRect(12, drawY + 126, 10, 12);
        } else if (this.archetype === 'kitana_style') {
            // Git.Ana: visual classico com cabelo longo, maio, luvas e botas
            ctx.fillStyle = '#0b1730';
            ctx.fillRect(-14, drawY - 3, 28, 9);
            ctx.fillRect(-20, drawY + 7, 6, 30);
            ctx.fillRect(14, drawY + 7, 6, 30);
            ctx.fillStyle = this.color;
            ctx.fillRect(-14, drawY + 56, 28, 30);
            ctx.fillStyle = '#dceeff';
            ctx.fillRect(-26, drawY + 72, 10, 12);
            ctx.fillRect(16, drawY + 72, 10, 12);
            ctx.fillStyle = '#8fc6ff';
            ctx.fillRect(-22, drawY + 122, 10, 16);
            ctx.fillRect(12, drawY + 122, 10, 16);
            ctx.fillStyle = '#c9e5ff';
            ctx.fillRect(-9, drawY + 60, 18, 4);
        } else if (this.archetype === 'mileena_style') {
            // Ada-Byte: visual classico com cabelo longo, maio, luvas e botas
            ctx.fillStyle = '#2a0e3d';
            ctx.fillRect(-14, drawY - 3, 28, 9);
            ctx.fillRect(-20, drawY + 7, 6, 30);
            ctx.fillRect(14, drawY + 7, 6, 30);
            ctx.fillStyle = this.color;
            ctx.fillRect(-14, drawY + 56, 28, 30);
            ctx.fillStyle = '#ffd2ff';
            ctx.fillRect(-26, drawY + 72, 10, 12);
            ctx.fillRect(16, drawY + 72, 10, 12);
            ctx.fillStyle = '#f057ff';
            ctx.fillRect(-22, drawY + 122, 10, 16);
            ctx.fillRect(12, drawY + 122, 10, 16);
            ctx.fillStyle = '#ffb6ff';
            ctx.fillRect(-9, drawY + 60, 18, 4);
        }
    }

    drawLimb(ctx, cfg) {
        ctx.save();
        ctx.translate(cfg.pivotX, cfg.pivotY);
        ctx.rotate(cfg.angle || 0);
        ctx.fillStyle = cfg.baseColor;
        ctx.fillRect(-cfg.width / 2, cfg.offsetY || 0, cfg.width, cfg.height);
        if (cfg.detailColor) {
            ctx.fillStyle = cfg.detailColor;
            ctx.fillRect(-(cfg.width / 2) - 1, (cfg.offsetY || 0) + cfg.detailY, cfg.width + 2, cfg.detailHeight);
        }
        if (cfg.bootColor) {
            ctx.fillStyle = cfg.bootColor;
            ctx.fillRect(-cfg.width / 2, (cfg.offsetY || 0) + cfg.height - cfg.bootHeight, cfg.width, cfg.bootHeight);
        }
        ctx.restore();
    }

    drawClassicFemaleSprite(ctx, drawY, pose, palette) {
        const bodyTop = drawY + 32;
        const hipsY = drawY + 88;
        const legHeight = 82;
        const armHeight = 58;
        const legWidth = 18;
        const armWidth = 16;

        // Cabelo longo (traseiro)
        ctx.fillStyle = palette.hair;
        ctx.fillRect(-18, drawY + 3, 36, 46);

        // Perna traseira
        this.drawLimb(ctx, {
            pivotX: 10,
            pivotY: hipsY,
            angle: pose.legBackAngle,
            width: legWidth,
            height: legHeight,
            baseColor: palette.stocking,
            detailColor: palette.bootTop,
            detailY: 42,
            detailHeight: 24,
            bootColor: palette.boot,
            bootHeight: 16
        });

        // Braço traseiro
        this.drawLimb(ctx, {
            pivotX: 16,
            pivotY: bodyTop + 10,
            angle: pose.armBackAngle,
            width: armWidth,
            height: armHeight,
            baseColor: palette.skin,
            detailColor: palette.glove,
            detailY: 18,
            detailHeight: 30
        });

        // Tronco/maio
        ctx.fillStyle = palette.skin;
        ctx.fillRect(-17, bodyTop, 34, 22);
        ctx.fillStyle = palette.suit;
        ctx.fillRect(-20, bodyTop + 18, 40, 54);
        ctx.fillStyle = palette.accent;
        ctx.fillRect(-14, bodyTop + 24, 28, 6);
        ctx.fillRect(-22, bodyTop + 50, 44, 5);

        // Cabeca
        ctx.fillStyle = palette.skin;
        ctx.fillRect(-14, drawY, 28, 28);
        ctx.fillStyle = palette.mask;
        ctx.fillRect(-15, drawY + 15, 30, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(1, drawY + 9, 7, 4);

        // Franja
        ctx.fillStyle = palette.hair;
        ctx.fillRect(-15, drawY - 2, 30, 8);

        // Perna frente
        this.drawLimb(ctx, {
            pivotX: -10,
            pivotY: hipsY,
            angle: pose.legFrontAngle,
            width: legWidth,
            height: legHeight,
            baseColor: palette.stocking,
            detailColor: palette.bootTop,
            detailY: 42,
            detailHeight: 24,
            bootColor: palette.boot,
            bootHeight: 16
        });

        // Braço frente
        this.drawLimb(ctx, {
            pivotX: -16,
            pivotY: bodyTop + 10,
            angle: pose.armFrontAngle,
            width: armWidth,
            height: armHeight,
            baseColor: palette.skin,
            detailColor: palette.glove,
            detailY: 18,
            detailHeight: 30
        });
    }

    drawLoopDragonSprite(ctx, drawY, pose) {
        const bodyTop = drawY + 32;
        const hipsY = drawY + 92;

        // Cabelo longo
        ctx.fillStyle = '#0f0f0f';
        ctx.fillRect(-17, drawY + 2, 34, 42);
        ctx.fillRect(-22, drawY + 12, 6, 26);
        ctx.fillRect(16, drawY + 12, 6, 26);

        // Perna traseira
        this.drawLimb(ctx, {
            pivotX: 10,
            pivotY: hipsY,
            angle: pose.legBackAngle,
            width: 19,
            height: 80,
            baseColor: '#151515',
            detailColor: '#0a0a0a',
            detailY: 30,
            detailHeight: 30,
            bootColor: '#ffffff',
            bootHeight: 16
        });

        // Braço traseiro
        this.drawLimb(ctx, {
            pivotX: 14,
            pivotY: bodyTop + 8,
            angle: pose.armBackAngle,
            width: 17,
            height: 58,
            baseColor: this.skinColor,
            detailColor: '#0f0f0f',
            detailY: 20,
            detailHeight: 20
        });

        // Tronco sem camisa
        ctx.fillStyle = this.skinColor;
        ctx.fillRect(-19, bodyTop, 38, 44);
        ctx.fillStyle = '#101010';
        ctx.fillRect(-22, bodyTop + 42, 44, 28);
        ctx.fillStyle = '#ff6a00';
        ctx.fillRect(-20, bodyTop + 44, 40, 5);

        // Cabeca
        ctx.fillStyle = this.skinColor;
        ctx.fillRect(-14, drawY, 28, 28);
        ctx.fillStyle = '#0f0f0f';
        ctx.fillRect(-15, drawY - 2, 30, 8);
        ctx.fillStyle = '#222';
        ctx.fillRect(-15, drawY + 16, 30, 10);
        ctx.fillStyle = '#fff';
        ctx.fillRect(1, drawY + 9, 7, 4);

        // Perna frente
        this.drawLimb(ctx, {
            pivotX: -10,
            pivotY: hipsY,
            angle: pose.legFrontAngle,
            width: 19,
            height: 80,
            baseColor: '#151515',
            detailColor: '#0a0a0a',
            detailY: 30,
            detailHeight: 30,
            bootColor: '#ffffff',
            bootHeight: 16
        });

        // Braço frente
        this.drawLimb(ctx, {
            pivotX: -14,
            pivotY: bodyTop + 8,
            angle: pose.armFrontAngle,
            width: 17,
            height: 58,
            baseColor: this.skinColor,
            detailColor: '#0f0f0f',
            detailY: 20,
            detailHeight: 20
        });
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
            legFrontAngle = -0.55;
            legBackAngle = 0.55;
            legFrontY = -18;
            legBackY = -18;
            armFrontAngle = -0.45;
            armBackAngle = -0.15;
            drawY = -145;
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
            else if (this.attackType === 'liu_flying_kick') {
                drawY = -150;
                legFrontAngle = -1.4;
                legBackAngle = -0.2;
                armFrontAngle = -0.9;
                armBackAngle = -0.7;
                ctx.rotate(-0.08);
            }
            else if (this.attackType === 'cage_shadow_kick') {
                drawY = -153;
                legFrontAngle = -1.55;
                legBackAngle = 0.2;
                armFrontAngle = -0.4;
                armBackAngle = 0.1;
            }
            else if (this.attackType === 'mileena_rush') {
                drawY = -150;
                legFrontAngle = -1.1;
                legBackAngle = -0.7;
                armFrontAngle = -1.4;
                armBackAngle = -1.1;
                ctx.rotate(-0.05);
            }
            else if (this.attackType === 'slide_dash') {
                drawY = -148;
                legFrontAngle = -1.05;
                legBackAngle = -0.9;
                legFrontY = 12;
                legBackY = 14;
                armFrontAngle = -1.8;
                armBackAngle = -1.75;
                ctx.translate(0, -6);
                ctx.rotate(-0.1);
            } else if (this.attackType === 'spin_dash') {
                drawY = -165;
                legFrontAngle = Math.sin(Date.now() / 55) * 1.8;
                legBackAngle = -Math.sin(Date.now() / 55) * 1.8;
                armFrontAngle = Math.sin(Date.now() / 55) * 2.2;
                armBackAngle = -Math.sin(Date.now() / 55) * 2.2;
                ctx.translate(0, -30);
                ctx.rotate(Date.now() / 70);
            }
        }

        const pose = { armFrontAngle, armBackAngle, legFrontAngle, legBackAngle };
        if (this.archetype === 'kitana_style') {
            this.drawClassicFemaleSprite(ctx, drawY, pose, {
                skin: this.skinColor,
                suit: '#3e74d8',
                accent: '#9ad0ff',
                glove: '#d8ecff',
                bootTop: '#8fc6ff',
                boot: '#5ba9ff',
                stocking: '#24437d',
                mask: '#4a7ddc',
                hair: '#0f1a2d'
            });
            if (this.isBlocking && !this.isBurned) {
                ctx.beginPath();
                ctx.arc(0, drawY + 50, 70, -Math.PI / 2, Math.PI / 2);
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 5;
                ctx.stroke();
            }
            ctx.restore();
            return;
        }
        if (this.archetype === 'mileena_style') {
            this.drawClassicFemaleSprite(ctx, drawY, pose, {
                skin: this.skinColor,
                suit: '#9229c7',
                accent: '#f057ff',
                glove: '#ffd7ff',
                bootTop: '#ff92ff',
                boot: '#db53ff',
                stocking: '#4f2069',
                mask: '#b64af4',
                hair: '#1a0d23'
            });
            if (this.isBlocking && !this.isBurned) {
                ctx.beginPath();
                ctx.arc(0, drawY + 50, 70, -Math.PI / 2, Math.PI / 2);
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 5;
                ctx.stroke();
            }
            ctx.restore();
            return;
        }
        if (this.archetype === 'shaolin') {
            this.drawLoopDragonSprite(ctx, drawY, pose);
            if (this.isBlocking && !this.isBurned) {
                ctx.beginPath();
                ctx.arc(0, drawY + 50, 70, -Math.PI / 2, Math.PI / 2);
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 5;
                ctx.stroke();
            }
            ctx.restore();
            return;
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

        if (this.archetype === 'shaolin' || this.archetype === 'movie_star') {
            // Tronco sem camisa e calca distinta
            ctx.fillStyle = this.skinColor;
            ctx.fillRect(-18, drawY + 32, 36, 30);
            ctx.fillStyle = this.archetype === 'shaolin' ? '#101010' : this.color;
            ctx.fillRect(-22, drawY + 62, 44, 38);
        }

        if (this.archetype === 'kitana_style' || this.archetype === 'mileena_style') {
            // Mantem visual com maiô no tronco e pernas
            ctx.fillStyle = this.color;
            ctx.fillRect(-16, drawY + 50, 32, 42);
            ctx.fillStyle = this.skinColor;
            ctx.fillRect(-12, drawY + 34, 24, 18);
        }

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
                if (this.archetype === 'cyber_commando') {
                    ctx.fillStyle = '#220000';
                    ctx.fillRect(-14, drawY + 6, 28, 8);
                    ctx.fillStyle = '#ff1a1a';
                    ctx.fillRect(5, drawY + 7, 7, 5);
                    ctx.shadowColor = '#ff1a1a';
                    ctx.shadowBlur = 12;
                    ctx.fillRect(5, drawY + 7, 7, 5);
                    ctx.shadowBlur = 0;
                }
            }
        }

        this.drawUniqueDetails(ctx, drawY);

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

        if (this.dashTimer > 0) {
            this.dashTimer--;
            this.isAttacking = true;
            this.isCrouching = false;
            this.isBlocking = false;
            if (this.position.y + this.height >= floorY) this.position.y = floorY - this.height;
            this.velocity.x = this.dashSpeed;
            this.attackDamage = this.dashDamage;
            this.attackType = this.specialKind || this.attackType;
            if (Math.random() < 0.4) {
                particles.push(new Particle(
                    this.position.x + this.width / 2,
                    this.position.y + this.height - 10,
                    this.archetype === 'storm_python' ? '#bfe8ff' : '#ff3a3a',
                    'glow'
                ));
            }
            if (this.dashTimer <= 0) {
                this.stopDashSpecial();
                this.velocity.x *= 0.4;
            }
        }

        if (this.isPulled && this.pulledBy) {
            this.velocity.x = this.position.x > this.pulledBy.position.x ? -15 : 15;
            if (Math.abs(this.position.x - this.pulledBy.position.x) < 80) {
                this.isPulled = false;
                if(matchState !== 'finish_him') this.stunTimer = 70;
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
            if (this.dashTimer > 0) this.stopDashSpecial();
        }
        if (this.position.x + this.width > canvas.width) {
            this.position.x = canvas.width - this.width;
            this.velocity.x = 0;
            if (this.dashTimer > 0) this.stopDashSpecial();
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
        if (matchState === 'fighting' && this.isKnockedDown && !this.isAirborne) {
            return;
        }
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
