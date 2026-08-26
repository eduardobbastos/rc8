/**
 * RC8 - Audio Visualizer & Dynamic Motion Effects
 * Resenha do Cross Turma das 8 Horas
 */

class VisualizerEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.bufferLength = 0;
        this.source = null;
        this.audioElement = null;

        this.isPlaying = false;
        this.animationFrameId = null;
        
        // Configurações visuais
        this.themeColor1 = '#00FF87'; // Neon Green
        this.themeColor2 = '#60EFFF'; // Electric Cyan
        this.themeColor3 = '#FF6B00'; // Fiery Orange
        
        this.particles = [];
        this.numParticles = 45;
        this.bassValue = 0;
        this.simulatedTime = 0;

        this.initCanvasSize();
        this.initParticles();
        window.addEventListener('resize', () => this.initCanvasSize());
    }

    initCanvasSize() {
        if (!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio || window.innerWidth * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio || 280 * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    initParticles() {
        this.particles = [];
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);

        for (let i = 0; i < this.numParticles; i++) {
            this.particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 2.5 + 1,
                vx: (Math.random() - 0.5) * 1.2,
                vy: (Math.random() - 0.5) * 1.2,
                color: Math.random() > 0.5 ? this.themeColor1 : this.themeColor2,
                baseAlpha: Math.random() * 0.6 + 0.2
            });
        }
    }

    connectAudio(audioElement) {
        if (this.source) return; // Já conectado
        this.audioElement = audioElement;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!this.audioContext) {
                this.audioContext = new AudioContext();
            }

            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;

            this.source = this.audioContext.createMediaElementSource(audioElement);
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

            this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);
        } catch (e) {
            console.warn('AudioContext cross-origin ou restrição do navegador. Usando modo de animação simulada inteligente:', e);
            this.analyser = null;
        }
    }

    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    start() {
        this.isPlaying = true;
        this.resumeAudioContext();
        if (!this.animationFrameId) {
            this.render();
        }
    }

    stop() {
        this.isPlaying = false;
    }

    render() {
        this.animationFrameId = requestAnimationFrame(() => this.render());

        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);

        // Limpeza suave para criar efeito de rastro
        this.ctx.fillStyle = 'rgba(10, 14, 22, 0.28)';
        this.ctx.fillRect(0, 0, width, height);

        let frequencies = [];
        this.simulatedTime += 0.05;

        // Se o analyser real do Web Audio API estiver ativo
        if (this.analyser && this.isPlaying) {
            this.analyser.getByteFrequencyData(this.dataArray);
            frequencies = Array.from(this.dataArray);
            
            // Calcula nível de graves (sub-bass)
            let bassSum = 0;
            for (let i = 0; i < 8; i++) {
                bassSum += this.dataArray[i];
            }
            this.bassValue = (bassSum / 8) / 255;
        } else if (this.isPlaying) {
            // Modo simulado com batidas de alta energia para manter a tela sempre espetacular
            const count = 64;
            const beatPulse = Math.sin(this.simulatedTime * 3) * 0.5 + 0.5;
            this.bassValue = beatPulse * 0.8 + 0.2;

            for (let i = 0; i < count; i++) {
                const wave = Math.sin(this.simulatedTime * 2 + i * 0.2) * 40;
                const wave2 = Math.cos(this.simulatedTime * 1.5 + i * 0.1) * 30;
                const val = Math.min(255, Math.max(20, (beatPulse * 180 + wave + wave2)));
                frequencies.push(val);
            }
        } else {
            // Mudo / Parado: animação suave em repouso
            this.bassValue = 0.05;
            for (let i = 0; i < 48; i++) {
                frequencies.push(10 + Math.sin(this.simulatedTime + i * 0.3) * 8);
            }
        }

        // Renderiza elementos
        this.drawParticles(width, height, this.bassValue);
        this.drawBars(width, height, frequencies);
        this.drawWaveforms(width, height, frequencies);
        this.drawGlowPulse(width, height, this.bassValue);
    }

    drawParticles(width, height, bassMultiplier) {
        const speedBoost = this.isPlaying ? 1 + bassMultiplier * 2.5 : 0.5;

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            p.x += p.vx * speedBoost;
            p.y += p.vy * speedBoost;

            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            const radius = p.radius * (1 + bassMultiplier * 1.2);
            const alpha = Math.min(1, p.baseAlpha + bassMultiplier * 0.4);

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = alpha;
            this.ctx.shadowBlur = 10 * bassMultiplier;
            this.ctx.shadowColor = p.color;
            this.ctx.fill();
        }
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1.0;
    }

    drawBars(width, height, frequencies) {
        const barCount = Math.min(48, frequencies.length);
        const barWidth = (width / barCount) - 3;
        const centerY = height * 0.65;

        for (let i = 0; i < barCount; i++) {
            const val = (frequencies[i] || 0) / 255;
            const barHeight = Math.max(4, val * (height * 0.55));
            const x = i * (barWidth + 3) + 2;
            const y = centerY - (barHeight / 2);

            // Gradiente vibrante para as barras
            const grad = this.ctx.createLinearGradient(x, y, x, y + barHeight);
            grad.addColorStop(0, this.themeColor2);
            grad.addColorStop(0.5, this.themeColor1);
            grad.addColorStop(1, 'rgba(0, 255, 135, 0.1)');

            this.ctx.fillStyle = grad;
            this.ctx.shadowColor = this.themeColor1;
            this.ctx.shadowBlur = this.isPlaying ? 8 * (val + 0.2) : 0;

            // Barras arredondadas modernas
            this.roundRect(x, y, barWidth, barHeight, barWidth / 2);
            this.ctx.fill();
        }
        this.ctx.shadowBlur = 0;
    }

    drawWaveforms(width, height, frequencies) {
        if (!this.isPlaying) return;

        this.ctx.beginPath();
        this.ctx.lineWidth = 2.5;
        this.ctx.strokeStyle = this.themeColor2;
        this.ctx.shadowColor = this.themeColor2;
        this.ctx.shadowBlur = 12;

        const sliceWidth = width / frequencies.length;
        let x = 0;

        for (let i = 0; i < frequencies.length; i++) {
            const v = frequencies[i] / 128.0;
            const y = (v * height * 0.25) + (height * 0.35);

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
            x += sliceWidth;
        }

        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }

    drawGlowPulse(width, height, bass) {
        if (!this.isPlaying || bass < 0.2) return;

        const radius = Math.min(width, height) * 0.4 * (1 + bass * 0.3);
        const grad = this.ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, radius);
        grad.addColorStop(0, `rgba(0, 255, 135, ${bass * 0.15})`);
        grad.addColorStop(0.7, `rgba(96, 239, 255, ${bass * 0.06})`);
        grad.addColorStop(1, 'rgba(10, 14, 22, 0)');

        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    roundRect(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.arcTo(x + w, y, x + w, y + h, r);
        this.ctx.arcTo(x + w, y + h, x, y + h, r);
        this.ctx.arcTo(x, y + h, x, y, r);
        this.ctx.arcTo(x, y, x + w, y, r);
        this.ctx.closePath();
    }
}

window.VisualizerEngine = VisualizerEngine;
