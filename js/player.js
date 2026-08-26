/**
 * RC8 - Audio Player Engine & MediaSession Integration
 * Resenha do Cross Turma das 8 Horas
 */

class RC8Player {
    constructor() {
        this.audio = new Audio();
        this.audio.preload = 'auto';
        // Nao define crossOrigin para permitir streaming direto do Google Drive sem restricao de CORS

        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isShuffle = false;
        this.isRadioMode = true; // Modo Rádio Ao Vivo (fluxo contínuo)
        this.volume = 0.9;
        this.audio.volume = this.volume;

        // Visualizer engine reference
        this.visualizer = null;

        // Listeners
        this.onTrackChange = null;
        this.onPlayStateChange = null;
        this.onTimeUpdate = null;
        this.onError = null;
        this.onPlaylistUpdate = null;

        this.setupAudioListeners();
        this.setupMediaSession();
    }

    setVisualizer(visualizer) {
        this.visualizer = visualizer;
        this.visualizer.connectAudio(this.audio);
    }

    setupAudioListeners() {
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            if (this.visualizer) this.visualizer.start();
            if (this.onPlayStateChange) this.onPlayStateChange(true);
            this.updateMediaSessionState();
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            if (this.visualizer) this.visualizer.stop();
            if (this.onPlayStateChange) this.onPlayStateChange(false);
            this.updateMediaSessionState();
        });

        this.audio.addEventListener('ended', () => {
            this.next(true); // Auto avançar
        });

        this.audio.addEventListener('timeupdate', () => {
            if (this.onTimeUpdate) {
                this.onTimeUpdate({
                    currentTime: this.audio.currentTime,
                    duration: this.audio.duration || 0,
                    progress: (this.audio.currentTime / (this.audio.duration || 1)) * 100,
                    formattedCurrent: this.formatTime(this.audio.currentTime),
                    formattedDuration: this.formatTime(this.audio.duration || 0)
                });
            }
        });

        this.isErrorRecovering = false;

        this.audio.addEventListener('error', (e) => {
            const track = this.getCurrentTrack();
            console.warn('Falha na reprodução da faixa:', track?.title);
            
            this.isPlaying = false;
            if (this.visualizer) this.visualizer.stop();
            if (this.onPlayStateChange) this.onPlayStateChange(false);

            if (this.onError) {
                this.onError({
                    track: track,
                    error: e
                });
            }

            // Só avança para a próxima se houver mais de uma música na playlist
            if (this.playlist.length > 1 && !this.isErrorRecovering) {
                this.isErrorRecovering = true;
                setTimeout(() => {
                    this.isErrorRecovering = false;
                    this.next(false);
                }, 3000);
            }
        });
    }

    setupMediaSession() {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', () => this.play());
            navigator.mediaSession.setActionHandler('pause', () => this.pause());
            navigator.mediaSession.setActionHandler('previoustrack', () => this.previous());
            navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
            navigator.mediaSession.setActionHandler('seekto', (details) => {
                if (details.seekTime && this.audio.duration) {
                    this.audio.currentTime = details.seekTime;
                }
            });
        }
    }

    updateMediaSessionMetadata() {
        const track = this.getCurrentTrack();
        if (!track || !('mediaSession' in navigator)) return;

        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title || 'Música de Treino RC8',
            artist: track.artist || 'Turma das 8 Horas',
            album: 'Rádio RC8 - Resenha do Cross',
            artwork: [
                { src: track.cover || 'assets/icon-512.png', sizes: '512x512', type: 'image/png' }
            ]
        });
    }

    updateMediaSessionState() {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = this.isPlaying ? 'playing' : 'paused';
        }
    }

    setPlaylist(tracks, autoPlayIndex = 0) {
        if (!tracks || tracks.length === 0) return;
        this.playlist = tracks;
        this.currentIndex = Math.min(autoPlayIndex, tracks.length - 1);
        
        if (this.onPlaylistUpdate) {
            this.onPlaylistUpdate(this.playlist);
        }

        this.loadTrack(this.currentIndex, false);
    }

    loadTrack(index, autoPlay = true) {
        if (index < 0 || index >= this.playlist.length) return;
        this.currentIndex = index;
        const track = this.playlist[this.currentIndex];

        this.audio.src = track.url;
        this.audio.load();

        this.updateMediaSessionMetadata();

        if (this.onTrackChange) {
            this.onTrackChange(track, this.currentIndex);
        }

        if (autoPlay) {
            this.play();
        }
    }

    async play() {
        try {
            if (this.visualizer) {
                this.visualizer.resumeAudioContext();
            }
            await this.audio.play();
        } catch (err) {
            console.warn('Play foi bloqueado pelo navegador até primeira interação do usuário:', err);
        }
    }

    pause() {
        this.audio.pause();
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    next(isAuto = false) {
        if (this.playlist.length === 0) return;

        if (this.isShuffle) {
            let nextIdx;
            do {
                nextIdx = Math.floor(Math.random() * this.playlist.length);
            } while (nextIdx === this.currentIndex && this.playlist.length > 1);
            this.loadTrack(nextIdx, true);
        } else {
            const nextIdx = (this.currentIndex + 1) % this.playlist.length;
            this.loadTrack(nextIdx, true);
        }

        if (navigator.vibrate) navigator.vibrate(30);
    }

    previous() {
        if (this.playlist.length === 0) return;

        // Se já tocou mais de 3 segundos, volta pro início da mesma faixa
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }

        let prevIdx = this.currentIndex - 1;
        if (prevIdx < 0) prevIdx = this.playlist.length - 1;
        this.loadTrack(prevIdx, true);

        if (navigator.vibrate) navigator.vibrate(30);
    }

    seek(percent) {
        if (!this.audio.duration) return;
        this.audio.currentTime = (percent / 100) * this.audio.duration;
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        this.audio.volume = this.volume;
    }

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        return this.isShuffle;
    }

    toggleRadioMode() {
        this.isRadioMode = !this.isRadioMode;
        return this.isRadioMode;
    }

    getCurrentTrack() {
        return this.playlist[this.currentIndex] || null;
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

window.RC8Player = RC8Player;
