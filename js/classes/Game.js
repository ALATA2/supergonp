import Paddle from './Paddle.js';
import Ball from './Ball.js';
import Particle from './Particle.js';
import Anomaly from './Anomaly.js';
import Obstacle from './Obstacle.js';
import SoundManager from './SoundManager.js';

export default class Game {
    /**
     * @param {HTMLCanvasElement} canvas 
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.soundManager = new SoundManager();
        this.state = 'BOOT'; // BOOT, START, PLAYING, GAMEOVER, HIGHSCORE
        this.bgm = document.getElementById('bgm-intro');
        this.bgmGameplay = document.getElementById('bgm-gameplay');
        
        this.paddles = [];
        this.balls = [];
        this.particles = [];
        this.anomalies = [];
        this.obstacles = [];
        
        this.keys = {};
        
        this.shakeMagnitude = 0;
        this.rallyCount = 0;
        
        // Time tracking for dt
        this.lastTime = 0;
        this.anomalySpawnTimer = 0;
        
        this.init();
        this.bindEvents();
    }

    init() {
        this.resize();
        
        this.paddles = [
            new Paddle(true, this.canvas.width, this.canvas.height),
            new Paddle(false, this.canvas.width, this.canvas.height)
        ];
        
        this.balls = [new Ball(this.canvas.width, this.canvas.height)];
        this.particles = [];
        this.anomalies = [];
        this.obstacles = [];
        this.rallyCount = 0;
        this.obstacleSpawnTimer = 10;
        
        this.updateScoreUI();
    }

    start(mode = 1) {
        if (this.bgm) this.bgm.pause();
        if (this.bgmGameplay) {
            this.bgmGameplay.currentTime = 0;
            this.bgmGameplay.playbackRate = 1.0;
            this.bgmGameplay.volume = 0.5;
            this.bgmGameplay.play().catch(e => console.warn(e));
        }
        
        // Mode logic: 1 = vs AI, 2 = vs Human
        this.paddles[1].isAI = (mode === 1);
        
        this.soundManager.init(); // Must be called after user gesture
        this.state = 'PLAYING';
        document.getElementById('start-screen').classList.remove('active');
        document.getElementById('game-over-screen').classList.remove('active');
        this.init();
        
        // Start loop if not already running
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            requestAnimationFrame((time) => this.loop(time));
        }
    }

    resize() {
        // Match container size
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
        
        if (this.paddles) {
            this.paddles.forEach(p => p.resize(this.canvas.width, this.canvas.height));
        }
        if (this.balls) {
            this.balls.forEach(b => b.resize(this.canvas.width, this.canvas.height));
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());
        
        // Boot screen handler
        const initBoot = () => {
            if (this.state === 'BOOT') {
                this.state = 'START';
                document.getElementById('boot-screen').classList.remove('active');
                document.getElementById('start-screen').classList.add('active');
                this.updateLeaderboardUI();
                if (this.bgm) {
                    this.bgm.volume = 0.5;
                    this.bgm.play().catch(e => console.warn(e));
                }
            }
        };
        window.addEventListener('click', initBoot);
        window.addEventListener('touchstart', initBoot, {passive: true});

        // Mode Selection
        const startMode = (mode) => {
            initBoot(); // ensure system initialized
            if (this.state === 'START') this.start(mode);
        };
        document.getElementById('btn-1p').addEventListener('click', () => startMode(1));
        document.getElementById('btn-1p').addEventListener('touchstart', (e) => { e.preventDefault(); startMode(1); }, {passive: false});
        document.getElementById('btn-2p').addEventListener('click', () => startMode(2));
        document.getElementById('btn-2p').addEventListener('touchstart', (e) => { e.preventDefault(); startMode(2); }, {passive: false});
        
        // Keyboard
        window.addEventListener('keydown', (e) => {
            initBoot();
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Touch Virtual Buttons
        const bindBtn = (id, pIdx, dir) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            
            const startMove = (e) => {
                e.preventDefault(); // Prevent zoom/scroll
                if (this.state === 'PLAYING') {
                    if (pIdx === 1) this.paddles[1].isAI = false; // Disable AI if Player 2 uses touch buttons
                    this.paddles[pIdx].vy = dir * this.paddles[pIdx].speed;
                }
            };
            
            const stopMove = (e) => {
                e.preventDefault();
                if (this.state === 'PLAYING') {
                    // Only stop if moving in the same direction (prevents glitching if sliding between buttons)
                    if (Math.sign(this.paddles[pIdx].vy) === Math.sign(dir)) {
                        this.paddles[pIdx].vy = 0;
                    }
                }
            };

            btn.addEventListener('touchstart', startMove, {passive: false});
            btn.addEventListener('touchend', stopMove, {passive: false});
            btn.addEventListener('touchcancel', stopMove, {passive: false});
            // Also support mouse clicks for testing on desktop
            btn.addEventListener('mousedown', startMove);
            btn.addEventListener('mouseup', stopMove);
            btn.addEventListener('mouseleave', stopMove);
        };

        bindBtn('p1-up', 0, -1);
        bindBtn('p1-down', 0, 1);
        bindBtn('p2-up', 1, -1);
        bindBtn('p2-down', 1, 1);

        // Touch Virtual Buttons binding done above.

        // Name entry save button
        document.getElementById('save-score-btn').addEventListener('click', () => {
            this.saveScore();
        });
    }

    triggerShake(magnitude) {
        this.shakeMagnitude = Math.max(this.shakeMagnitude, magnitude);
    }

    spawnParticles(x, y, color, count = 10, speed = 1) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, speed));
        }
    }

    checkCollisions() {
        // Paddle & Ball collisions
        for (let i = this.balls.length - 1; i >= 0; i--) {
            let b = this.balls[i];
            
            this.paddles.forEach((p, pIdx) => {
                // AABB Collision check
                if (b.x - b.radius < p.x + p.width &&
                    b.x + b.radius > p.x &&
                    b.y - b.radius < p.y + p.height &&
                    b.y + b.radius > p.y) {
                    
                    // Hit detected
                    this.soundManager.playPaddleHit();
                    this.rallyCount++;
                    this.triggerShake(5 + this.rallyCount);
                    this.spawnParticles(b.x, b.y, p.color, 15, 1.5);
                    
                    // FRENZY: Increase music speed
                    if (this.bgmGameplay) {
                        this.bgmGameplay.playbackRate = Math.min(1.0 + (this.rallyCount * 0.05), 1.5);
                    }

                    // SUDDEN DEATH / OVERCHARGE
                    if (this.rallyCount === 8) {
                        // Shrink paddles
                        this.paddles.forEach(pad => pad.height *= 0.7);
                        // Spawn a chaos ball
                        const chaosBall = new Ball(this.canvas.width, this.canvas.height);
                        chaosBall.vx *= 1.5;
                        chaosBall.vy *= 1.5;
                        this.balls.push(chaosBall);
                        this.triggerShake(30);
                    }
                    
                    // Set ownership
                    b.lastHitByP1 = (pIdx === 0);

                    // Adjust angle based on where it hit the paddle
                    const hitPos = (b.y - p.y) / p.height; // 0 to 1
                    const angleOffset = (hitPos - 0.5) * Math.PI / 2; // -45 to 45 degrees
                    
                    // Base speed + acceleration on each hit, higher cap for high rally
                    const currentSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                    const speedMultiplier = 1.05 + (this.rallyCount * 0.005);
                    const speedCap = this.canvas.width * (1.5 + (this.rallyCount * 0.1));
                    const newSpeed = Math.min(currentSpeed * speedMultiplier, speedCap); 
                    
                    const direction = pIdx === 0 ? 1 : -1;
                    b.vx = Math.cos(angleOffset) * newSpeed * direction;
                    b.vy = Math.sin(angleOffset) * newSpeed;
                    
                    // Push out of paddle to prevent sticking
                    b.x = pIdx === 0 ? p.x + p.width + b.radius : p.x - b.radius;
                }
            });

            // Scoring
            if (b.x < 0) {
                this.scoreGoal(1); // P2 scores
                this.balls.splice(i, 1);
            } else if (b.x > this.canvas.width) {
                this.scoreGoal(0); // P1 scores
                this.balls.splice(i, 1);
            }
        }

        // Ensure there is always at least one ball if playing
        if (this.balls.length === 0 && this.state === 'PLAYING') {
            this.balls.push(new Ball(this.canvas.width, this.canvas.height));
        }

        // Obstacle & Ball Collisions
        this.obstacles.forEach(o => {
            if (!o.active) return;
            this.balls.forEach(b => {
                // AABB check for ball (circle) vs rect (simplified)
                const nearX = Math.max(o.x, Math.min(b.x, o.x + o.width));
                const nearY = Math.max(o.y, Math.min(b.y, o.y + o.height));
                const dx = b.x - nearX;
                const dy = b.y - nearY;
                
                if (dx * dx + dy * dy < b.radius * b.radius) {
                    // Hit obstacle!
                    this.soundManager.playObstacleBreak();
                    o.active = false;
                    this.triggerShake(10);
                    this.spawnParticles(o.x + o.width/2, o.y + o.height/2, o.color, 30, 2);
                    
                    // Bounce off (simple reflection)
                    // If hit left/right side mostly
                    if (Math.abs(dx) > Math.abs(dy)) {
                        b.vx *= -1;
                    } else {
                        b.vy *= -1;
                    }
                }
            });
        });

        // Anomaly & Ball Collisions
        this.anomalies.forEach(a => {
            if (!a.active) return;
            this.balls.forEach(b => {
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < b.radius + a.radius) {
                    this.triggerAnomaly(a, b);
                    a.active = false;
                }
            });
        });
    }

    triggerAnomaly(anomaly, ball) {
        this.soundManager.playAnomalyGlitch();
        this.triggerShake(15);
        this.spawnParticles(anomaly.x, anomaly.y, anomaly.color, 40, 3);
        
        // Find who hit it last to reward them
        const hitterIdx = ball.lastHitByP1 === true ? 0 : (ball.lastHitByP1 === false ? 1 : -1);

        switch(anomaly.type) {
            case 'multiball':
                // Spawn 2 more balls
                for(let i=0; i<2; i++) {
                    const newBall = new Ball(this.canvas.width, this.canvas.height);
                    newBall.x = ball.x;
                    newBall.y = ball.y;
                    // Slightly varied velocities
                    newBall.vx = ball.vx;
                    newBall.vy = ball.vy * (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random());
                    newBall.lastHitByP1 = ball.lastHitByP1;
                    this.balls.push(newBall);
                }
                break;
            case 'hyperdash':
                if (hitterIdx !== -1) {
                    this.paddles[hitterIdx].activateHyperDash();
                } else {
                    // Random if nobody hit it yet
                    this.paddles[Math.random() > 0.5 ? 0 : 1].activateHyperDash();
                }
                break;
            case 'gravity':
                // Effect applied in Ball.js update based on active anomalies
                // Handled implicitly by leaving it active? No, we consume it.
                // To keep gravity, we shouldn't consume it immediately, but for consistency we do.
                // Let's spawn a persistent invisible gravity well instead, or just let multiball/hyperdash carry it.
                // ACTUALLY: Let's not consume 'gravity' immediately, or give it a short life.
                // Fix: if it's gravity, keep it active but change state so it doesn't trigger again,
                // but Ball.js checks active anomalies. We can add a "consumed" flag.
                break;
        }

        if (anomaly.type === 'gravity') {
             // Turn into a pure gravity well that doesn't trigger collisions anymore
             anomaly.radius = 0; // hide core
             // Re-activate but flag it
             anomaly.active = true;
             anomaly.type = 'gravity_active'; 
             // Will die on its own timeElapsed
        }
    }

    scoreGoal(scoringPlayerIdx) {
        this.soundManager.playGoal();
        this.triggerShake(20);
        this.rallyCount = 0; // Reset rally
        
        // Reset Frenzy
        if (this.bgmGameplay) this.bgmGameplay.playbackRate = 1.0;
        this.paddles.forEach(p => p.resize(this.canvas.width, this.canvas.height));
        
        this.paddles[scoringPlayerIdx].score++;
        this.updateScoreUI();
        
        // Effects on goal side
        const x = scoringPlayerIdx === 0 ? this.canvas.width : 0;
        const color = this.paddles[scoringPlayerIdx].color;
        this.spawnParticles(x, this.canvas.height/2, color, 50, 4);

        if (this.paddles[scoringPlayerIdx].score >= 7) { // Play to 7
            this.gameOver(scoringPlayerIdx);
        }
    }

    updateScoreUI() {
        document.getElementById('score-p1').innerText = this.paddles[0].score;
        document.getElementById('score-p2').innerText = this.paddles[1].score;
    }

    gameOver(winnerIdx) {
        this.state = 'GAMEOVER';
        const screen = document.getElementById('game-over-screen');
        const text = document.getElementById('winner-text');
        text.innerText = `PLAYER ${winnerIdx + 1} WINS`;
        text.style.color = this.paddles[winnerIdx].color;
        text.style.textShadow = `0 0 10px ${this.paddles[winnerIdx].color}`;
        screen.classList.add('active');

        // Calculate score
        this.finalScore = (this.paddles[winnerIdx].score * 1000);
        
        if (this.bgmGameplay) this.bgmGameplay.pause();

        setTimeout(() => {
            screen.classList.remove('active');
            this.state = 'HIGHSCORE';
            document.getElementById('score-display').innerText = `SCORE: ${this.finalScore}`;
            document.getElementById('name-entry-screen').classList.add('active');
            document.getElementById('player-name').focus();
            if (this.bgm) {
                this.bgm.currentTime = 0;
                this.bgm.play().catch(e => {});
            }
        }, 3000);
    }

    saveScore() {
        if (this.state !== 'HIGHSCORE') return;
        
        let name = document.getElementById('player-name').value.trim().toUpperCase();
        if (!name) name = 'AAA';
        
        let scores = JSON.parse(localStorage.getItem('super_gonp_scores') || '[]');
        scores.push({ name: name, score: this.finalScore });
        scores.sort((a, b) => b.score - a.score);
        scores = scores.slice(0, 5); // Keep top 5
        
        localStorage.setItem('super_gonp_scores', JSON.stringify(scores));
        
        document.getElementById('name-entry-screen').classList.remove('active');
        this.state = 'START';
        document.getElementById('start-screen').classList.add('active');
        this.updateLeaderboardUI();
    }

    updateLeaderboardUI() {
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = '';
        let scores = JSON.parse(localStorage.getItem('super_gonp_scores') || '[]');
        
        if (scores.length === 0) {
            list.innerHTML = '<li>--- 0</li>';
        } else {
            scores.forEach(s => {
                const li = document.createElement('li');
                li.innerText = `${s.name} - ${s.score}`;
                list.appendChild(li);
            });
        }
    }

    update(dt) {
        if (this.state !== 'PLAYING') return;

        // Input
        // P1
        if (!('ontouchstart' in window) || Object.values(this.keys).some(v=>v)) {
            // Only process keyboard if active (fallback)
            this.paddles[0].vy = 0;
            if (this.keys['KeyW']) this.paddles[0].vy = -this.paddles[0].speed;
            if (this.keys['KeyS']) this.paddles[0].vy = this.paddles[0].speed;

            // P2 (AI fallback if no keys)
            this.paddles[1].vy = 0;
            if (this.keys['ArrowUp']) {
                this.paddles[1].vy = -this.paddles[1].speed;
            } else if (this.keys['ArrowDown']) {
                this.paddles[1].vy = this.paddles[1].speed;
            } else {
                // Simple AI: follow nearest ball
                let closestBall = null;
                let minDist = Infinity;
                this.balls.forEach(b => {
                    // Only care if ball is moving towards AI
                    if (b.vx > 0) {
                        const dist = this.canvas.width - b.x;
                        if (dist < minDist) {
                            minDist = dist;
                            closestBall = b;
                        }
                    }
                });

                if (closestBall) {
                    const center = this.paddles[1].y + this.paddles[1].height / 2;
                    if (closestBall.y < center - 10) this.paddles[1].vy = -this.paddles[1].speed * 0.7; // AI speed limit
                    else if (closestBall.y > center + 10) this.paddles[1].vy = this.paddles[1].speed * 0.7;
                }
            }
        }

        this.paddles.forEach(p => p.update(dt));
        
        this.balls.forEach(b => {
            const hit = b.update(dt, this.anomalies);
            if (hit === 'wall') {
                this.soundManager.playWallHit();
                this.triggerShake(2);
                this.spawnParticles(b.x, b.y, '#fff', 5, 0.5);
            }
        });

        // Anomalies
        this.anomalySpawnTimer -= dt;
        if (this.anomalySpawnTimer <= 0) {
            this.anomalySpawnTimer = 5 + Math.random() * 10; // Spawn every 5-15s
            this.anomalies.push(new Anomaly(this.canvas.width, this.canvas.height));
            this.soundManager.playAnomalySpawn();
        }

        // Obstacles
        this.obstacleSpawnTimer -= dt;
        if (this.obstacleSpawnTimer <= 0) {
            this.obstacleSpawnTimer = 10 + Math.random() * 5; // Spawn every 10-15s
            this.obstacles.push(new Obstacle(this.canvas.width, this.canvas.height));
            this.soundManager.playObstacleSpawn();
        }

        this.anomalies.forEach(a => a.update(dt));
        // Clean dead anomalies
        this.anomalies = this.anomalies.filter(a => a.active || a.type === 'gravity_active');
        // Actually, gravity_active needs to die when time elapsed
        this.anomalies = this.anomalies.filter(a => a.timeElapsed < a.lifeTime);

        // Clean dead obstacles
        this.obstacles = this.obstacles.filter(o => o.active);

        this.particles.forEach(p => p.update(dt));
        this.particles = this.particles.filter(p => !p.isDead());

        this.checkCollisions();

        // Decay shake
        if (this.shakeMagnitude > 0) {
            this.shakeMagnitude -= dt * 30; // Decay speed
            if (this.shakeMagnitude < 0) this.shakeMagnitude = 0;
        }
    }

    draw() {
        // Clear with slight trailing effect for background
        this.ctx.globalCompositeOperation = 'source-over';
        
        // Pulsing background based on rallyCount
        let bgAlpha = 0.3;
        let redTint = 5;
        if (this.rallyCount > 4) {
            const pulse = Math.sin(performance.now() / 100) * 0.5 + 0.5;
            redTint = Math.min(50 + (this.rallyCount * 10), 200) * pulse;
        }
        
        this.ctx.fillStyle = `rgba(${redTint}, 5, 5, ${bgAlpha})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        
        // Apply Screen Shake
        if (this.shakeMagnitude > 0) {
            const dx = (Math.random() - 0.5) * this.shakeMagnitude;
            const dy = (Math.random() - 0.5) * this.shakeMagnitude;
            this.ctx.translate(dx, dy);
        }

        // Draw middle line
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([15, 15]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]); // reset

        this.anomalies.forEach(a => {
            // If it's a gravity active, draw a black hole effect
            if (a.type === 'gravity_active') {
                const time = performance.now() / 200;
                
                // Outer glow pulse
                const pulse = Math.sin(time) * 10;
                this.ctx.globalCompositeOperation = 'lighter';
                this.ctx.beginPath();
                this.ctx.arc(a.x, a.y, 60 + pulse, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(0, 255, 100, 0.1)';
                this.ctx.fill();
                
                // Swirling energy arcs
                this.ctx.save();
                this.ctx.translate(a.x, a.y);
                this.ctx.rotate(time * 2);
                this.ctx.lineWidth = 3;
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = '#0f0';
                for (let i = 0; i < 4; i++) {
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `hsla(${(time * 50 + i * 90) % 360}, 100%, 50%, 0.8)`;
                    this.ctx.arc(0, 0, 40 + i * 5, i * Math.PI/2, i * Math.PI/2 + Math.PI);
                    this.ctx.stroke();
                }
                this.ctx.restore();

                // Core Black Hole (Opaque, Source-over to punch a hole)
                this.ctx.globalCompositeOperation = 'source-over';
                this.ctx.beginPath();
                this.ctx.arc(a.x, a.y, 25, 0, Math.PI * 2);
                this.ctx.fillStyle = '#000'; // Pure black
                this.ctx.fill();
                
                // Event Horizon thin glowing ring
                this.ctx.globalCompositeOperation = 'lighter';
                this.ctx.beginPath();
                this.ctx.arc(a.x, a.y, 25, 0, Math.PI * 2);
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#0f0';
                this.ctx.stroke();
            } else {
                a.draw(this.ctx);
            }
        });
        
        this.obstacles.forEach(o => o.draw(this.ctx));
        
        this.paddles.forEach(p => p.draw(this.ctx));
        this.balls.forEach(b => b.draw(this.ctx, this.rallyCount));
        this.particles.forEach(p => p.draw(this.ctx));

        this.ctx.restore();
    }

    loop(time) {
        // dt calculation in seconds
        let dt = (time - this.lastTime) / 1000;
        this.lastTime = time;

        // Cap dt to prevent huge jumps if tab is inactive
        if (dt > 0.1) dt = 0.1;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }
}
