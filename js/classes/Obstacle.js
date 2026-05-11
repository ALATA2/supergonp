export default class Obstacle {
    /**
     * @param {number} canvasWidth 
     * @param {number} canvasHeight 
     */
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth * 0.015;
        this.height = canvasHeight * 0.15;
        
        // Spawn roughly in the center
        this.x = canvasWidth / 2 - this.width / 2;
        // Random Y position, but not too close to the very top/bottom
        this.y = (canvasHeight * 0.2) + Math.random() * (canvasHeight * 0.6 - this.height);
        
        this.color = '#ff0'; // Yellow/Neon Gold
        this.active = true;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = this.color;
        
        // Outer Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Inner intense core
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
        const padding = 2;
        ctx.fillRect(this.x + padding, this.y + padding, this.width - padding*2, this.height - padding*2);

        ctx.restore();
    }
}
