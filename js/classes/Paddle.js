export default class Paddle {
    /**
     * @param {boolean} isLeft - True for Player 1 (left), false for Player 2/AI (right)
     * @param {number} canvasWidth 
     * @param {number} canvasHeight 
     */
    constructor(isLeft, canvasWidth, canvasHeight) {
        this.isLeft = isLeft;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Dimensions responsive to canvas
        this.baseWidth = Math.max(10, canvasWidth * 0.015);
        this.baseHeight = Math.max(80, canvasHeight * 0.15);
        this.width = this.baseWidth;
        this.height = this.baseHeight;
        
        // Position
        this.x = isLeft ? canvasWidth * 0.05 : canvasWidth * 0.95 - this.width;
        this.y = canvasHeight / 2 - this.height / 2;

        this.color = isLeft ? '#0ff' : '#f0f'; // Cyan for P1, Magenta for P2
        
        // Movement
        this.vy = 0;
        this.speed = canvasHeight * 0.8; // Move up to 80% of screen per second
        this.score = 0;

        // Hyper-Dash status
        this.hyperDashTime = 0;
    }

    /**
     * @param {number} width 
     * @param {number} height 
     */
    resize(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.baseWidth = Math.max(10, width * 0.015);
        this.baseHeight = Math.max(80, height * 0.15);
        
        this.width = this.baseWidth;
        // Keep hyperdash height if active
        if (this.hyperDashTime <= 0) {
            this.height = this.baseHeight;
        }

        this.x = this.isLeft ? width * 0.05 : width * 0.95 - this.width;
        // Ensure within bounds
        this.y = Math.max(0, Math.min(this.y, height - this.height));
        this.speed = height * 0.8;
    }

    /**
     * Trigger Hyper-Dash effect
     */
    activateHyperDash() {
        this.hyperDashTime = 3.0; // 3 seconds
        this.height = this.baseHeight * 2;
        // Adjust y to keep center the same
        this.y -= this.baseHeight / 2; 
    }

    /**
     * @param {number} dt 
     */
    update(dt) {
        // Apply velocity
        this.y += this.vy * dt;

        // Clamp to screen bounds
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > this.canvasHeight) {
            this.y = this.canvasHeight - this.height;
        }

        // Handle Hyper-Dash expiration
        if (this.hyperDashTime > 0) {
            this.hyperDashTime -= dt;
            if (this.hyperDashTime <= 0) {
                // Restore normal height
                this.y += this.baseHeight / 2; // Adjust center back
                this.height = this.baseHeight;
                // Re-clamp just in case
                if (this.y + this.height > this.canvasHeight) {
                    this.y = this.canvasHeight - this.height;
                }
            }
        }
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = this.color;
        
        // Outer Glow
        ctx.shadowBlur = this.hyperDashTime > 0 ? 30 : 15;
        ctx.shadowColor = this.color;

        // Draw paddle with rounded corners (pseudo-rounded using lines if no roundRect support, but standard provides it now)
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(this.x, this.y, this.width, this.height, 5);
            ctx.fill();
        } else {
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        // Inner intense core
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
        const padding = 2;
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(this.x + padding, this.y + padding, this.width - padding*2, this.height - padding*2, 3);
            ctx.fill();
        } else {
            ctx.fillRect(this.x + padding, this.y + padding, this.width - padding*2, this.height - padding*2);
        }

        ctx.restore();
    }
}
