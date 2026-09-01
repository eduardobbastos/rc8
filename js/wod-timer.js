/**
 * RC8 - WOD & Workout Timer Companion
 * Cronômetro e Temporizador Integrado de Treino (CrossFit / HIIT)
 */

class WodTimer {
    constructor() {
        this.mode = 'tabata'; // 'tabata', 'emom', 'amrap', 'stopwatch', 'custom'
        this.status = 'idle'; // 'idle', 'running', 'paused', 'countdown'
        this.interval = null;
        
        // Estado do timer
        this.currentTime = 0;
        this.currentRound = 1;
        this.totalRounds = 8;
        this.isWorkPhase = true; // Tabata/Custom (true = fase de trabalho)
        this.countdownValue = 10; // 10s prep
        
        // Configs padrão
        this.settings = {
            tabataWork: 20,
            tabataRest: 10,
            tabataRounds: 8,
            emomMinutes: 10,
            amrapMinutes: 12,
            // Modo CUSTOM programável (persistido em localStorage)
            customWork: 30,
            customRest: 15,
            customRounds: 8
        };
        this.storageKey = 'rc8_custom_timer';
        this.loadCustomSettings();

        this.onTick = null;
        this.onStateChange = null;
        this.audioCtx = null;
    }

    // Carrega as configurações custom salvas no navegador
    loadCustomSettings() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                const n = (x, d) => (Number.isFinite(+x) && +x > 0 ? +x : d);
                this.settings.customWork = n(parsed.work, 30);
                this.settings.customRest = n(parsed.rest, 15);
                this.settings.customRounds = n(parsed.rounds, 8);
            }
        } catch (e) {
            console.error('Erro ao ler timer custom:', e);
        }
    }

    // Salva as configurações custom (programável)
    saveCustomSettings(work, rest, rounds) {
        this.settings.customWork = Math.max(1, Math.round(+work || 30));
        this.settings.customRest = Math.max(0, Math.round(+rest || 0));
        this.settings.customRounds = Math.max(1, Math.round(+rounds || 8));
        try {
            localStorage.setItem(this.storageKey, JSON.stringify({
                work: this.settings.customWork,
                rest: this.settings.customRest,
                rounds: this.settings.customRounds
            }));
        } catch (e) {
            console.error('Erro ao salvar timer custom:', e);
        }
    }

    getCustomSettings() {
        return {
            work: this.settings.customWork,
            rest: this.settings.customRest,
            rounds: this.settings.customRounds
        };
    }

    initAudio() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        }
    }

    playBeep(freq = 880, duration = 0.15, count = 1) {
        try {
            this.initAudio();
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            for (let i = 0; i < count; i++) {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                
                osc.type = 'sine';
                osc.frequency.value = freq;
                
                const startTime = this.audioCtx.currentTime + (i * 0.2);
                gain.gain.setValueAtTime(0.3, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);

                osc.start(startTime);
                osc.stop(startTime + duration);
            }
        } catch (e) {
            console.log('Beep áudio não permitido antes de interação:', e);
        }
    }

    setMode(mode) {
        this.reset();
        this.mode = mode;
        this.notifyState();
    }

    start() {
        this.initAudio();
        if (this.status === 'paused') {
            this.resume();
            return;
        }

        // Inicia com contagem regressiva de preparação de 10s (Padrão CrossFit)
        this.status = 'countdown';
        this.countdownValue = 5;
        this.notifyState();
        this.playBeep(440, 0.1);

        this.interval = setInterval(() => {
            this.countdownValue--;
            if (this.countdownValue > 0) {
                this.playBeep(440, 0.1);
            } else {
                clearInterval(this.interval);
                this.playBeep(880, 0.4); // Bip longo de GO!
                this.startMainRoutine();
            }
            this.notifyState();
        }, 1000);
    }

    startMainRoutine() {
        this.status = 'running';
        this.currentRound = 1;

        if (this.mode === 'tabata') {
            this.isWorkPhase = true;
            this.currentTime = this.settings.tabataWork;
        } else if (this.mode === 'custom') {
            this.isWorkPhase = true;
            this.currentTime = this.settings.customWork;
            this.totalRounds = this.settings.customRounds;
        } else if (this.mode === 'emom') {
            this.currentTime = 60;
            this.totalRounds = this.settings.emomMinutes;
        } else if (this.mode === 'amrap') {
            this.currentTime = this.settings.amrapMinutes * 60;
        } else if (this.mode === 'stopwatch') {
            this.currentTime = 0;
        }

        this.notifyState();

        this.interval = setInterval(() => {
            this.tick();
        }, 1000);
    }

    tick() {
        if (this.mode === 'custom') {
            this.currentTime--;
            
            // Beeps de 3, 2, 1
            if (this.currentTime <= 3 && this.currentTime > 0) {
                this.playBeep(520, 0.1);
            }

            if (this.currentTime <= 0) {
                if (this.isWorkPhase) {
                    // Termina fase de trabalho
                    if (this.settings.customRest > 0) {
                        this.isWorkPhase = false;
                        this.currentTime = this.settings.customRest;
                        this.playBeep(700, 0.25); // beep de descanso
                    } else {
                        // Sem descanso: avança round direto
                        this.currentRound++;
                        if (this.currentRound > this.settings.customRounds) {
                            this.finish();
                            return;
                        }
                        this.currentTime = this.settings.customWork;
                        this.playBeep(880, 0.35); // beep de trabalho
                    }
                } else {
                    // Termina fase de descanso -> próximo round
                    this.currentRound++;
                    if (this.currentRound > this.settings.customRounds) {
                        this.finish();
                        return;
                    }
                    this.isWorkPhase = true;
                    this.currentTime = this.settings.customWork;
                    this.playBeep(880, 0.35); // beep de trabalho
                }
            }
        } else if (this.mode === 'tabata') {
            this.currentTime--;
            
            // Beeps de 3, 2, 1
            if (this.currentTime <= 3 && this.currentTime > 0) {
                this.playBeep(520, 0.1);
            }

            if (this.currentTime <= 0) {
                if (this.isWorkPhase) {
                    this.isWorkPhase = false;
                    this.currentTime = this.settings.tabataRest;
                    this.playBeep(700, 0.25); // Rest beep
                } else {
                    this.currentRound++;
                    if (this.currentRound > this.settings.tabataRounds) {
                        this.finish();
                        return;
                    }
                    this.isWorkPhase = true;
                    this.currentTime = this.settings.tabataWork;
                    this.playBeep(880, 0.35); // Work beep
                }
            }
        } else if (this.mode === 'emom') {
            this.currentTime--;
            if (this.currentTime <= 3 && this.currentTime > 0) {
                this.playBeep(520, 0.1);
            }
            if (this.currentTime <= 0) {
                this.currentRound++;
                if (this.currentRound > this.settings.emomMinutes) {
                    this.finish();
                    return;
                }
                this.currentTime = 60;
                this.playBeep(880, 0.4); // New minute beep
            }
        } else if (this.mode === 'amrap') {
            this.currentTime--;
            if (this.currentTime <= 5 && this.currentTime > 0) {
                this.playBeep(520, 0.1);
            }
            if (this.currentTime <= 0) {
                this.finish();
                return;
            }
        } else if (this.mode === 'stopwatch') {
            this.currentTime++;
        }

        this.notifyState();
    }

    pause() {
        if (this.status === 'running' || this.status === 'countdown') {
            clearInterval(this.interval);
            this.status = 'paused';
            this.notifyState();
        }
    }

    resume() {
        if (this.status === 'paused') {
            this.status = 'running';
            this.interval = setInterval(() => {
                this.tick();
            }, 1000);
            this.notifyState();
        }
    }

    reset() {
        clearInterval(this.interval);
        this.status = 'idle';
        this.currentTime = 0;
        this.currentRound = 1;
        this.isWorkPhase = true;
        this.notifyState();
    }

    finish() {
        clearInterval(this.interval);
        this.status = 'idle';
        this.playBeep(980, 0.6, 2);
        this.notifyState();
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 400]);
        }
    }

    notifyState() {
        if (this.onStateChange) {
            let totalRounds = this.settings.tabataRounds;
            if (this.mode === 'emom') totalRounds = this.settings.emomMinutes;
            else if (this.mode === 'custom') totalRounds = this.settings.customRounds;
            this.onStateChange({
                mode: this.mode,
                status: this.status,
                currentTime: this.currentTime,
                currentRound: this.currentRound,
                totalRounds,
                isWorkPhase: this.isWorkPhase,
                countdownValue: this.countdownValue,
                formattedTime: this.formatTime(this.currentTime)
            });
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

window.WodTimer = WodTimer;
