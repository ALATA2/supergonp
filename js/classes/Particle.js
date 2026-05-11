export default class Particle {
    /**
     * @param {number} x - Start X position
     * @param {number} y - Start Y position
     * @param {string} color - Neon color of the particle
     * @param {number} speedMultiplier - How fast particles explode
     */
    constructor(x, y, color, speedMultiplier = 1) {
        this.x = x;
        this.y = y;
        this.color = color;
        
        // Random velocity in any direction
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 200 + 100) * speedMultiplier;
        
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.radius = Math.random() * 3 + 2;
        this.life = 1.0; // 1.0 to 0.0
        this.decay = Math.random() * 1.5 + 1.0; // How fast it dies
        this.friction = 0.95; // Fake friction
    }

    /**
     * @param {number} dt - Delta time
     */
    update(dt) {
        // Apply friction
        this.vx *= Math.pow(this.friction, dt * 60); 
        this.vy *= Math.pow(this.friction, dt * 60);

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.life -= this.decay * dt;
        if (this.life < 0) this.life = 0;

        // Shrink over time
        this.radius = Math.max(0, this.radius - 2 * dt);
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        if (this.life <= 0) return;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}
