export default class Anomaly {
    /**
     * @param {number} canvasWidth 
     * @param {number} canvasHeight 
     */
    constructor(canvasWidth, canvasHeight) {
        // Spawn roughly in the center third of the screen
        this.x = canvasWidth / 2 + (Math.random() - 0.5) * (canvasWidth / 3);
        this.y = canvasHeight / 2 + (Math.random() - 0.5) * (canvasHeight / 2);
        
        this.baseRadius = 30 + Math.random() * 20;
        this.radius = this.baseRadius;
        this.color = '#0f0'; // Toxic Green
        
        const types = ['multiball', 'gravity', 'hyperdash'];
        this.type = types[Math.floor(Math.random() * types.length)];
        
        this.lifeTime = 10; // Exists for 10 seconds
        this.timeElapsed = 0;
        this.active = true;

        this.hue = Math.random() * 360;
        this.angle1 = 0;
        this.angle2 = 0;
        this.angle3 = 0;
    }

    /**
     * @param {number} dt 
     */
    update(dt) {
        if (!this.active) return;
        
        this.timeElapsed += dt;
        if (this.timeElapsed >= this.lifeTime) {
            this.active = false;
        }

        this.hue = (this.hue + dt * 150) % 360; // Fast color cycle
        this.angle1 += dt * 3.0; // Fast rotation
        this.angle2 -= dt * 1.5; // Reverse medium rotation
        this.angle3 += dt * 0.8; // Slow rotation

        // Glitch effect: rapid minor radius changes
        this.radius = this.baseRadius + (Math.random() - 0.5) * 8;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        
        // Dynamic hue
        const color = `hsl(${this.hue}, 100%, 50%)`;
        const innerColor = `hsl(${(this.hue + 180) % 360}, 100%, 70%)`; // Complementary
        
        ctx.shadowBlur = 25;
        ctx.shadowColor = color;
        ctx.globalAlpha = 0.8 + Math.random() * 0.2; // Slight flicker
        
        ctx.translate(this.x, this.y);

        // Outer Hexagon
        ctx.save();
        ctx.rotate(this.angle3);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const px = Math.cos(a) * this.radius * 1.5;
            const py = Math.sin(a) * this.radius * 1.5;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 10]); // Techy dashed line
        ctx.stroke();
        ctx.restore();

        // Middle Square
        ctx.save();
        ctx.rotate(this.angle2);
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            const px = Math.cos(a) * this.radius;
            const py = Math.sin(a) * this.radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = innerColor;
        ctx.lineWidth = 4;
        ctx.setLineDash([]);
        ctx.stroke();
        ctx.restore();

        // Inner Triangle
        ctx.save();
        ctx.rotate(this.angle1);
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            const a = (i / 3) * Math.PI * 2;
            const px = Math.cos(a) * (this.radius * 0.7);
            const py = Math.sin(a) * (this.radius * 0.7);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Solid core
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.restore();

        ctx.restore();
    }
}
