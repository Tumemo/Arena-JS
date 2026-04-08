// particle.js - Sistema de partículas do jogo

class Particle {
    constructor(x, y, color, type = 'blood', sizeMod = 1) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        this.velocity = { x: (Math.random() - 0.5) * 15, y: (Math.random() - 0.5) * 15 };
        
        if(this.type === 'fire') { 
            this.velocity.y = -(Math.random() * 5 + 2); 
            this.velocity.x *= 0.5; 
        } else if(this.type === 'shatter') { 
            this.velocity.y -= Math.random() * 10; 
            this.velocity.x *= 1.5; 
        }
        
        this.radius = (Math.random() * 4 + 2) * sizeMod;
        this.alpha = 1;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        
        if(this.type === 'glow' || this.type === 'spark' || this.type === 'fire' || this.type === 'shatter') {
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
        }
        
        ctx.fill();
        ctx.restore();
    }

    update(ctx) {
        this.draw(ctx);
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        
        if (this.type === 'fire') this.alpha -= 0.03;
        else this.alpha -= (this.type === 'glow' ? 0.08 : 0.02);
        
        if(this.type !== 'fire' && this.type !== 'glow') this.velocity.y += 0.5; // Gravidade na partícula
    }
}
