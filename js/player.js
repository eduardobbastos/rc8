/**
 * RC8 - Dual Audio & YouTube Engine Player
 * Resenha do Cross Turma das 8 Horas
 */

class RC8Player {
    constructor() {
        this.htmlAudio = new Audio();
        this.htmlAudio.preload = 'auto';

        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isShuffle = false;
        this.isRadioMode = true;
        this.volume = 0.9;
        this.htmlAudio.volume = this.volume;

        this.hasUserInteracted = false;
        this.activeEngine = 'html5'; // 'html5' ou 'youtube'

        // YouTube IFrame Player
        this.ytPlayer = null;
        this.isYtReady = false;
        this.ytTimer = null;
        this.initYouTubeApi();

        // Visualizer engine reference
        this.visualizer = null;

        // Listeners
        this.onTrackChange = null;
        this.onPlayStateChange = null;
        this.onTimeUpdate = null;
        this.onError = null;
        this.onPlaylistUpdate = null;

        this.setupHtmlAudioListeners();
        this.setupMediaSession();
    }

    initYouTubeApi() {
        window.onYouTubeIframeAPIReady = () => {
            try {
                this.ytPlayer = new YT.Player('yt-player', {
                    height: '10',
                    width: '10',
                    playerVars: {
                        playsinline: 1,
                        controls: 0,
                        disablekb: 1,
                        fs: 0,
                        rel: 0,
                        modestbranding: 1
                    },
                    events: {
                        onReady: () => {
                            this.isYtReady = true;
                            if (this.ytPlayer.setVolume) this.ytPlayer.setVolume(this.volume * 100);
                        },
                        onStateChange: (event) => {
                            this.handleYtStateChange(event.data);
                        },
                        onError: (e) => {
                            console.warn('Erro no YouTube Player:', e);
                            if (this.playlist.length > 1) {
                                setTimeout(() => this.next(true), 2500);
                            }
                        }
                    }
                });
            } catch (e) {
                console.warn('Falha ao inicializar YouTube Player:', e);
            }
        };

        // Se a API do YouTube já tiver carregado antes do constructor
        if (window.YT && window.YT.Player) {
            window.onYouTubeIframeAPIReady();
        }
    }

    handleYtStateChange(state) {
        // YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
        if (state === 1) { // PLAYING
            this.isPlaying = true;
            if (this.visualizer) this.visualizer.start();
            if (this.onPlayStateChange) this.onPlayStateChange(true);
            this.updateMediaSessionState();
            this.startYtProgressTimer();
        } else if (state === 2 || state === 0) { // PAUSED ou ENDED
            this.isPlaying = false;
            if (this.visualizer) this.visualizer.stop();
            if (this.onPlayStateChange) this.onPlayStateChange(false);
            this.updateMediaSessionState();
            this.stopYtProgressTimer();

            if (state === 0) { // Auto-avança ao terminar
                this.next(true);
            }
        }
    }

    startYtProgressTimer() {
        this.stopYtProgressTimer();
        this.ytTimer = setInterval(() => {
            if (this.ytPlayer && this.ytPlayer.getCurrentTime && this.isPlaying) {
                const current = this.ytPlayer.getCurrentTime() || 0;
                const duration = this.ytPlayer.getDuration() || 0;
                if (this.onTimeUpdate) {
                    this.onTimeUpdate({
                        currentTime: current,
                        duration: duration,
                        progress: duration ? (current / duration) * 100 : 0,
                        formattedCurrent: this.formatTime(current),
                        formattedDuration: this.formatTime(duration)
                    });
                }
            }
        }, 300);
    }

    stopYtProgressTimer() {
        if (this.ytTimer) {
            clearInterval(this.ytTimer);
            this.ytTimer = null;
        }
    }

    setVisualizer(visualizer) {
        this.visualizer = visualizer;
        this.visualizer.connectAudio(this.htmlAudio);
    }

    setupHtmlAudioListeners() {
        this.htmlAudio.addEventListener('play', () => {
            this.isPlaying = true;
            this.hasUserInteracted = true;
            if (this.visualizer) this.visualizer.start();
            if (this.onPlayStateChange) this.onPlayStateChange(true);
            this.updateMediaSessionState();
        });

        this.htmlAudio.addEventListener('pause', () => {
            this.isPlaying = false;
            if (this.visualizer) this.visualizer.stop();
            if (this.onPlayStateChange) this.onPlayStateChange(false);
            this.updateMediaSessionState();
        });

        this.htmlAudio.addEventListener('ended', () => {
            this.next(true);
        });

        this.htmlAudio.addEventListener('timeupdate', () => {
            if (this.activeEngine === 'html5' && this.onTimeUpdate) {
                this.onTimeUpdate({
                    currentTime: this.htmlAudio.currentTime,
                    duration: this.htmlAudio.duration || 0,
                    progress: (this.htmlAudio.currentTime / (this.htmlAudio.duration || 1)) * 100,
                    formattedCurrent: this.formatTime(this.htmlAudio.currentTime),
                    formattedDuration: this.formatTime(this.htmlAudio.duration || 0)
                });
            }
        });

        this.htmlAudio.addEventListener('error', (e) => {
            const track = this.getCurrentTrack();
            console.warn('HTML5 áudio falhou:', track?.title);
            
            // Se falhar e a música tiver link do YouTube, faz fallback instantâneo para o YouTube!
            if (track && track.youtubeId && this.activeEngine !== 'youtube') {
                console.log('🔄 Fazendo fallback automático para reprodução via YouTube!');
                this.playViaYouTube(track.youtubeId);
                return;
            }

            this.isPlaying = false;
            if (this.visualizer) this.visualizer.stop();
            if (this.onPlayStateChange) this.onPlayStateChange(false);

            if (this.onError) {
                this.onError({ track, error: e });
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
                if (details.seekTime) {
                    this.seekToTime(details.seekTime);
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
                { src: track.cover || 'assets/icon.svg', sizes: '512x512', type: 'image/svg+xml' }
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

        if (this.onTrackChange) {
            this.onTrackChange(track, this.currentIndex);
        }

        this.updateMediaSessionMetadata();

        // Para reprodução HTML5 se estiver tocando
        this.htmlAudio.pause();

        // Se a faixa possui ID do YouTube (prioridade máxima para evitar qualquer bloqueio de CORS/Drive)
        if (track.youtubeId) {
            this.activeEngine = 'youtube';
            if (this.ytPlayer && this.ytPlayer.loadVideoById) {
                if (autoPlay && this.hasUserInteracted) {
                    this.ytPlayer.loadVideoById(track.youtubeId);
                } else if (this.ytPlayer.cueVideoById) {
                    this.ytPlayer.cueVideoById(track.youtubeId);
                }
            }
        } else {
            this.activeEngine = 'html5';
            if (this.ytPlayer && this.ytPlayer.pauseVideo) {
                this.ytPlayer.pauseVideo();
            }
            this.htmlAudio.src = track.url;
            this.htmlAudio.load();

            if (autoPlay && this.hasUserInteracted) {
                this.htmlAudio.play().catch(e => console.log('Play pendente:', e));
            }
        }
    }

    playViaYouTube(videoId) {
        this.activeEngine = 'youtube';
        if (this.ytPlayer && this.ytPlayer.loadVideoById) {
            this.ytPlayer.loadVideoById(videoId);
        }
    }

    async play() {
        this.hasUserInteracted = true;
        const track = this.getCurrentTrack();

        if (this.visualizer) {
            this.visualizer.resumeAudioContext();
        }

        if (track && track.youtubeId) {
            this.activeEngine = 'youtube';
            if (this.ytPlayer) {
                if (this.ytPlayer.playVideo && this.ytPlayer.getPlayerState && this.ytPlayer.getPlayerState() !== -1) {
                    this.ytPlayer.playVideo();
                } else if (this.ytPlayer.loadVideoById) {
                    this.ytPlayer.loadVideoById(track.youtubeId);
                }
            }
            // Atualiza estado de reprodução
            this.isPlaying = true;
            if (this.visualizer) this.visualizer.start();
            if (this.onPlayStateChange) this.onPlayStateChange(true);
            this.startYtProgressTimer();
        } else {
            this.activeEngine = 'html5';
            try {
                await this.htmlAudio.play();
            } catch (err) {
                console.warn('Erro ao tocar HTML5:', err);
            }
        }
    }

    pause() {
        if (this.activeEngine === 'youtube' && this.ytPlayer && this.ytPlayer.pauseVideo) {
            this.ytPlayer.pauseVideo();
        } else {
            this.htmlAudio.pause();
        }
        this.isPlaying = false;
        if (this.visualizer) this.visualizer.stop();
        if (this.onPlayStateChange) this.onPlayStateChange(false);
        this.stopYtProgressTimer();
        this.updateMediaSessionState();
    }

    togglePlay() {
        this.hasUserInteracted = true;
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
            this.loadTrack(nextIdx, this.hasUserInteracted || isAuto);
        } else {
            const nextIdx = (this.currentIndex + 1) % this.playlist.length;
            this.loadTrack(nextIdx, this.hasUserInteracted || isAuto);
        }

        if (navigator.vibrate) navigator.vibrate(30);
    }

    previous() {
        if (this.playlist.length === 0) return;

        let prevIdx = this.currentIndex - 1;
        if (prevIdx < 0) prevIdx = this.playlist.length - 1;
        this.loadTrack(prevIdx, this.hasUserInteracted);

        if (navigator.vibrate) navigator.vibrate(30);
    }

    seek(percent) {
        if (this.activeEngine === 'youtube' && this.ytPlayer && this.ytPlayer.getDuration) {
            const duration = this.ytPlayer.getDuration() || 0;
            const target = (percent / 100) * duration;
            this.ytPlayer.seekTo(target, true);
        } else if (this.htmlAudio.duration) {
            this.htmlAudio.currentTime = (percent / 100) * this.htmlAudio.duration;
        }
    }

    seekToTime(seconds) {
        if (this.activeEngine === 'youtube' && this.ytPlayer && this.ytPlayer.seekTo) {
            this.ytPlayer.seekTo(seconds, true);
        } else if (this.htmlAudio.duration) {
            this.htmlAudio.currentTime = seconds;
        }
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        this.htmlAudio.volume = this.volume;
        if (this.ytPlayer && this.ytPlayer.setVolume) {
            this.ytPlayer.setVolume(this.volume * 100);
        }
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

if (typeof window !== 'undefined') {
    window.RC8Player = RC8Player;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RC8Player;
}
