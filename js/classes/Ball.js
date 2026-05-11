export default class Ball {
    /**
     * @param {number} canvasWidth 
     * @param {number} canvasHeight 
     */
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        this.radius = Math.max(6, canvasWidth * 0.008);
        this.reset();
        
        // Trail effect
        this.history = [];
        this.historyMaxLength = 10;
        
        this.color = '#fff';
    }

    reset() {
        this.x = this.canvasWidth / 2;
        this.y = this.canvasHeight / 2;
        
        const speed = this.canvasWidth * 0.4; // Base speed
        const angle = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * Math.PI / 4); // Random angle between -45 and 45 deg, left or right
        
        const direction = Math.random() > 0.5 ? 1 : -1;
        
        this.vx = Math.cos(angle) * speed * direction;
        this.vy = Math.sin(angle) * speed;
        
        this.history = [];
        this.lastHitByP1 = null; // null = nobody, true = P1, false = P2
    }

    /**
     * @param {number} width 
     * @param {number} height 
     */
    resize(width, height) {
        // Adjust position proportionally
        this.x = (this.x / this.canvasWidth) * width;
        this.y = (this.y / this.canvasHeight) * height;
        
        // Adjust velocity proportionally
        this.vx = (this.vx / this.canvasWidth) * width;
        this.vy = (this.vy / this.canvasHeight) * height;

        this.canvasWidth = width;
        this.canvasHeight = height;
        this.radius = Math.max(6, width * 0.008);
    }

    /**
     * @param {number} dt 
     * @param {Array} anomalies Active anomalies
     */
    update(dt, anomalies = []) {
        // Record history for trail
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > this.historyMaxLength) {
            this.history.shift();
        }

        // Apply Gravity Well effect if any anomaly has it active
        let gx = 0;
        let gy = 0;
        for (let a of anomalies) {
            if (a.active && a.type === 'gravity') {
                const dx = a.x - this.x;
                const dy = a.y - this.y;
                const distSq = dx * dx + dy * dy;
                if (distSq > 0) {
                    const force = 100000 / distSq; // Arbitrary gravity strength
                    const dist = Math.sqrt(distSq);
                    gx += (dx / dist) * force;
                    gy += (dy / dist) * force;
                }
            }
        }

        this.vx += gx * dt;
        this.vy += gy * dt;

        // Apply velocity
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Wall collisions (Top/Bottom)
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy *= -1;
            return 'wall'; // Signal for juice
        } else if (this.y + this.radius > this.canvasHeight) {
            this.y = this.canvasHeight - this.radius;
            this.vy *= -1;
            return 'wall';
        }

        return null;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} rallyCount
     */
    draw(ctx, rallyCount = 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        
        // Color based on who hit it last and rally count
        let trailColor = '#fff';
        if (this.lastHitByP1 === true) trailColor = '#0ff';
        else if (this.lastHitByP1 === false) trailColor = '#f0f';

        // Override color if rally is high
        if (rallyCount >= 13) {
            trailColor = '#f00'; // Deep Red
        } else if (rallyCount >= 8) {
            trailColor = '#f80'; // Orange
        } else if (rallyCount >= 4) {
            trailColor = '#ff0'; // Yellow
        }

        // Draw trail
        if (this.history.length > 0) {
            ctx.beginPath();
            ctx.moveTo(this.history[0].x, this.history[0].y);
            for (let i = 1; i < this.history.length; i++) {
                ctx.lineTo(this.history[i].x, this.history[i].y);
            }
            ctx.strokeStyle = trailColor;
            ctx.lineWidth = this.radius * 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // Fading trail effect via shadow and alpha
            ctx.shadowBlur = rallyCount >= 13 ? 20 : 10;
            ctx.shadowColor = trailColor;
            ctx.globalAlpha = 0.5;
            ctx.stroke();
        }

        // Draw actual ball
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = rallyCount >= 13 ? 30 : 20;
        ctx.shadowColor = trailColor;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
