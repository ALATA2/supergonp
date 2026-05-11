export default class SoundManager {
    constructor() {
        // Will be initialized on first user interaction
        this.ctx = null;
        this.initialized = false;
        
        // Master volume
        this.masterGain = null;
    }

    init() {
        if (this.initialized) return;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.5; // Default volume
            this.masterGain.connect(this.ctx.destination);
            
            this.initialized = true;
        } catch(e) {
            console.warn('Web Audio API not supported in this browser');
        }
    }

    playTone(freq, type, duration, vol = 1.0) {
        if (!this.initialized || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playPaddleHit() {
        // Bassy, punchy square wave
        this.playTone(150, 'square', 0.1, 0.8);
        setTimeout(() => this.playTone(100, 'sine', 0.1, 0.6), 50);
    }

    playWallHit() {
        // Short high-pitched beep
        this.playTone(400, 'triangle', 0.05, 0.5);
    }

    playGoal() {
        if (!this.initialized || !this.ctx) return;
        
        // Descending synth sweep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.5);
        
        gain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }

    playAnomalyGlitch() {
        if (!this.initialized || !this.ctx) return;
        
        // Harsh frequency modulated sound
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        // Random rapidly changing frequencies to sound glitchy
        for (let i = 0; i < 10; i++) {
            osc.frequency.setValueAtTime(200 + Math.random() * 800, this.ctx.currentTime + (i * 0.02));
        }
        
        gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playObstacleBreak() {
        if (!this.initialized || !this.ctx) return;
        
        // White noise burst
        const bufferSize = this.ctx.sampleRate * 0.2; // 0.2 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1; // Noise
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        // Add a lowpass filter to make it sound like an impact rather than pure static
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        noise.start();
    }

    playAnomalySpawn() {
        if (!this.initialized || !this.ctx) return;
        
        // Eerie rising synth tone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 1.0);
        
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.5);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.0);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 1.0);
    }

    playObstacleSpawn() {
        if (!this.initialized || !this.ctx) return;
        
        // Heavy digitized "clunk"
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        
        // Slight filter for the clunk
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 500;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }
}
