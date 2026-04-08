// projectile.js - Sistema de projéteis do jogo

class Projectile {
    constructor({ position, velocity, color, type, owner }) {
        this.position = { x: position.x, y: position.y };
        this.velocity = velocity;
        this.color = color;
        this.type = type;
        this.owner = owner;
        this.width = 30;
        this.height = 30;
        this.active = true;
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        
        if (this.type === 'spear') {
            ctx.beginPath();
            ctx.moveTo(this.position.x + 15, this.position.y + 15);
            let anchorX = this.owner.position.x + this.owner.width/2 + (this.owner.isFacingRight ? 20 : -20);
            ctx.lineTo(anchorX, this.owner.position.y + 60);
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            ctx.fillStyle = '#ccc';
            let tipX = this.velocity.x > 0 ? this.position.x + 20 : this.position.x - 10;
            ctx.fillRect(this.position.x, this.position.y + 10, 30, 10);
            
            ctx.fillStyle = this.color;
            ctx.fillRect(tipX, this.position.y + 5, 20, 20);
        } else if (this.type === 'fire') {
            ctx.beginPath();
            ctx.arc(this.position.x + 15, this.position.y + 15, 20 + Math.random()*10, 0, Math.PI * 2);
            ctx.fillStyle = '#ffaa00';
            ctx.fill();
            particles.push(new Particle(this.position.x + 15, this.position.y + 15, '#ff4400', 'fire', 2));
        } else if (this.type === 'lightning') {
            ctx.strokeStyle = '#c5e8ff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(this.position.x + 5, this.position.y + 2);
            ctx.lineTo(this.position.x + 20, this.position.y + 10);
            ctx.lineTo(this.position.x + 10, this.position.y + 18);
            ctx.lineTo(this.position.x + 25, this.position.y + 27);
            ctx.stroke();
            particles.push(new Particle(this.position.x + 15, this.position.y + 15, '#a9d9ff', 'spark'));
        } else if (this.type === 'laser') {
            ctx.beginPath();
            ctx.arc(this.position.x + 15, this.position.y + 15, 13, 0, Math.PI * 2);
            ctx.fillStyle = '#ff2b2b';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.position.x + 15, this.position.y + 15, 7, 0, Math.PI * 2);
            ctx.fillStyle = '#ffd6d6';
            ctx.fill();
            ctx.shadowColor = '#ff2b2b';
            ctx.shadowBlur = 28;
            ctx.beginPath();
            ctx.arc(this.position.x + 15, this.position.y + 15, 14, 0, Math.PI * 2);
            ctx.strokeStyle = '#ff2b2b';
            ctx.stroke();
            particles.push(new Particle(this.position.x + 15, this.position.y + 15, '#ff2b2b', 'glow'));
        } else if (this.type === 'fireball_red') {
            ctx.beginPath();
            ctx.arc(this.position.x + 15, this.position.y + 15, 14, 0, Math.PI * 2);
            ctx.fillStyle = '#ff4a00';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.position.x + 15, this.position.y + 15, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#ffd17a';
            ctx.fill();
            particles.push(new Particle(this.position.x + 15, this.position.y + 15, '#ff4a00', 'fire', 1.6));
        } else if (this.type === 'green_arc') {
            ctx.beginPath();
            ctx.arc(this.position.x + 15, this.position.y + 15, 12, 0, Math.PI * 2);
            ctx.fillStyle = '#4cff61';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.position.x + 15, this.position.y + 15, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#d8ffe0';
            ctx.fill();
            particles.push(new Particle(this.position.x + 15, this.position.y + 15, '#4cff61', 'glow', 1.2));
        } else if (this.type === 'fan_blade') {
            ctx.fillStyle = '#d9ebff';
            ctx.beginPath();
            ctx.moveTo(this.position.x + 2, this.position.y + 15);
            ctx.lineTo(this.position.x + 28, this.position.y + 4);
            ctx.lineTo(this.position.x + 28, this.position.y + 26);
            ctx.closePath();
            ctx.fill();
            particles.push(new Particle(this.position.x + 15, this.position.y + 15, '#9ad0ff', 'spark', 1.1));
        } else if (this.type === 'sai_orb') {
            ctx.beginPath();
            ctx.arc(this.position.x + 15, this.position.y + 15, 12, 0, Math.PI * 2);
            ctx.fillStyle = '#f057ff';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.position.x + 15, this.position.y + 15, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffd8ff';
            ctx.fill();
            particles.push(new Particle(this.position.x + 15, this.position.y + 15, '#f057ff', 'glow', 1.1));
        } else {
            ctx.beginPath();
            ctx.arc(this.position.x + 15, this.position.y + 15, 15, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(this.position.x + 15, this.position.y + 15, 18, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
            ctx.fill();
            
            particles.push(new Particle(this.position.x + 15, this.position.y + 15, this.color, 'glow'));
        }
        ctx.restore();
    }

    update(ctx) {
        this.draw(ctx);
        if (this.type === 'green_arc') this.velocity.y += 0.7;
        if (this.type === 'sai_orb') this.velocity.y += 0.45;
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}
