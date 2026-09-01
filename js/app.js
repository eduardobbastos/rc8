/**
 * RC8 - Main Application Controller
 * Resenha do Cross Turma das 8 Horas
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa Motores
    const visualizer = new VisualizerEngine('visualizer-canvas');
    const player = new RC8Player();
    const wodTimer = new WodTimer();
    
    player.setVisualizer(visualizer);
    SheetsManager.init();

    // 2. Elementos da Interface (DOM)
    const elements = {
        // Player
        albumCover: document.getElementById('album-cover'),
        discRing: document.getElementById('disc-ring'),
        trackTitle: document.getElementById('track-title'),
        trackArtist: document.getElementById('track-artist'),
        trackGenre: document.getElementById('track-genre'),
        trackDedication: document.getElementById('track-dedication'),
        trackBpmText: document.getElementById('track-bpm-text'),
        progressFill: document.getElementById('progress-fill'),
        progressWrapper: document.getElementById('progress-wrapper'),
        timeCurrent: document.getElementById('time-current'),
        timeTotal: document.getElementById('time-total'),
        
        // Controles
        btnPlay: document.getElementById('btn-play'),
        playIcon: document.getElementById('play-icon'),
        pauseIcon: document.getElementById('pause-icon'),
        btnNext: document.getElementById('btn-next'),
        btnPrev: document.getElementById('btn-prev'),
        btnShuffle: document.getElementById('btn-shuffle'),
        btnRadioMode: document.getElementById('btn-radio-mode'),
        volumeSlider: document.getElementById('volume-slider'),

        // Playlist & Abas
        tabPlaylistBtn: document.querySelector('.tab-btn[data-tab="playlist"]'),
        tabTimerBtn: document.querySelector('.tab-btn[data-tab="wod-timer"]'),
        tabPlaylistContent: document.getElementById('tab-playlist-content'),
        tabTimerContent: document.getElementById('tab-wod-timer-content'),
        playlistContainer: document.getElementById('playlist-container'),
        playlistCount: document.getElementById('playlist-count'),
        playlistSourceBadge: document.getElementById('playlist-source-badge'),
        searchInput: document.getElementById('search-input'),

        // Timer
        timerBox: document.getElementById('timer-box'),
        timerPhase: document.getElementById('timer-phase'),
        timerDigits: document.getElementById('timer-digits'),
        timerRound: document.getElementById('timer-round'),
        btnTimerStart: document.getElementById('btn-timer-start'),
        btnTimerPause: document.getElementById('btn-timer-pause'),
        btnTimerReset: document.getElementById('btn-timer-reset'),
        modeChips: document.querySelectorAll('.mode-chip'),
        timerCustomConfig: document.getElementById('timer-custom-config'),
        customWork: document.getElementById('custom-work'),
        customRest: document.getElementById('custom-rest'),
        customRounds: document.getElementById('custom-rounds'),
        btnSaveCustom: document.getElementById('btn-save-custom'),

        // Header & Modais
        btnSyncSheet: document.getElementById('btn-sync-sheet'),
        btnTheme: document.getElementById('btn-theme'),
        themePicker: document.getElementById('theme-picker'),
        themeOptions: document.querySelectorAll('.theme-option'),
        btnOpenSettings: document.getElementById('btn-open-settings'),
        btnCloseModal: document.getElementById('btn-close-modal'),
        settingsModal: document.getElementById('settings-modal'),
        inputSheetUrl: document.getElementById('input-sheet-url'),
        inputSheetName: document.getElementById('input-sheet-name'),
        btnSaveSheet: document.getElementById('btn-save-sheet'),
        btnTestSheet: document.getElementById('btn-test-sheet'),
        toastContainer: document.getElementById('toast-container'),

        // Bottom Nav
        navPlayer: document.getElementById('nav-player'),
        navTimer: document.getElementById('nav-timer'),
        navShare: document.getElementById('nav-share'),
        navSettings: document.getElementById('nav-settings')
    };

    let wakeLock = null;

    // 3. Funções Utilitárias & Toasts
    function showToast(message, duration = 3500) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Wake Lock para manter a tela acesa durante o treino
    async function requestWakeLock() {
        try {
            if ('wakeLock' in navigator && document.visibilityState === 'visible') {
                wakeLock = await navigator.wakeLock.request('screen');
            }
        } catch (err) {
            // Silencioso se bloqueado pelo navegador
        }
    }

    // 4. Integração do Player com a UI
    player.onTrackChange = (track) => {
        elements.trackTitle.textContent = track.title || 'Sem título';
        elements.trackArtist.textContent = track.artist || 'Turma das 8 Horas';
        elements.trackGenre.textContent = track.genre || 'WORKOUT';
        elements.trackBpmText.textContent = `${track.bpm || 140} BPM`;
        elements.albumCover.src = track.cover || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80';
        
        if (track.dedication) {
            elements.trackDedication.style.display = 'inline-flex';
            elements.trackDedication.innerHTML = `<span>🔥 ${track.dedication}</span>`;
        } else {
            elements.trackDedication.style.display = 'none';
        }

        renderPlaylist();
    };

    player.onLoadingState = (isLoading, track) => {
        if (isLoading) {
            elements.trackDedication.style.display = 'inline-flex';
            elements.trackDedication.innerHTML = `<span>⏳ Carregando áudio...</span>`;
        } else if (track) {
            if (track.dedication) {
                elements.trackDedication.style.display = 'inline-flex';
                elements.trackDedication.innerHTML = `<span>🔥 ${track.dedication}</span>`;
            } else {
                elements.trackDedication.style.display = 'none';
            }
        }
    };

    player.onPlayStateChange = (isPlaying) => {
        if (isPlaying) {
            elements.playIcon.style.display = 'none';
            elements.pauseIcon.style.display = 'block';
            elements.discRing.classList.remove('paused');
            elements.albumCover.classList.add('playing');
            requestWakeLock();
        } else {
            elements.playIcon.style.display = 'block';
            elements.pauseIcon.style.display = 'none';
            elements.discRing.classList.add('paused');
            elements.albumCover.classList.remove('playing');
        }
    };

    player.onTimeUpdate = (data) => {
        elements.progressFill.style.width = `${data.progress}%`;
        elements.timeCurrent.textContent = data.formattedCurrent;
        elements.timeTotal.textContent = data.formattedDuration;
    };

    player.onError = (info) => {
        showToast(`⚠️ Erro ao carregar faixa "${info.track?.title}". Avançando...`);
    };

    // 5. Renderização da Lista de Músicas
    function renderPlaylist(filterText = '') {
        elements.playlistContainer.innerHTML = '';
        const tracks = player.playlist;
        elements.playlistCount.textContent = tracks.length;

        const filtered = tracks.filter(t => {
            const search = filterText.toLowerCase();
            return (
                (t.title && t.title.toLowerCase().includes(search)) ||
                (t.artist && t.artist.toLowerCase().includes(search)) ||
                (t.dedication && t.dedication.toLowerCase().includes(search)) ||
                (t.genre && t.genre.toLowerCase().includes(search))
            );
        });

        if (filtered.length === 0) {
            elements.playlistContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #718096; font-size: 0.85rem;">
                    Nenhuma música encontrada com "${filterText}".
                </div>
            `;
            return;
        }

        filtered.forEach((track) => {
            const originalIndex = player.playlist.findIndex(t => t.id === track.id);
            const isCurrent = originalIndex === player.currentIndex;

            const item = document.createElement('div');
            item.className = `track-item ${isCurrent ? 'playing' : ''}`;
            item.innerHTML = `
                <img src="${track.cover}" class="track-item-cover" alt="${track.title}">
                <div class="track-item-details">
                    <div class="track-item-name">${track.title}</div>
                    <div class="track-item-sub">
                        <span>${track.artist}</span>
                        <span class="track-item-bpm">${track.bpm} BPM</span>
                    </div>
                </div>
                <div class="track-play-icon">
                    ${isCurrent && player.isPlaying ? '▶' : '♫'}
                </div>
            `;

            item.addEventListener('click', () => {
                player.loadTrack(originalIndex, true);
                if (navigator.vibrate) navigator.vibrate(20);
            });

            elements.playlistContainer.appendChild(item);
        });
    }

    // 6. Carregamento e Sincronização com Google Sheets
    async function syncSheetsData(isManual = false) {
        if (isManual) {
            elements.btnSyncSheet.style.animation = 'rotateDisc 1s linear infinite';
            showToast('🔄 Conectando ao Google Planilhas...');
        }

        try {
            const res = await SheetsManager.fetchPlaylist();
            player.setPlaylist(res.tracks, 0);

            if (res.source === 'github_metadata' || res.source === 'live_sheet') {
                elements.playlistSourceBadge.textContent = '● PLAYLIST OFICIAL RC8';
                elements.playlistSourceBadge.style.color = 'var(--neon-green)';
            } else if (res.source === 'cache') {
                elements.playlistSourceBadge.textContent = '● PLAYLIST OFICIAL RC8 (OFFLINE)';
                elements.playlistSourceBadge.style.color = 'var(--neon-orange)';
            } else {
                elements.playlistSourceBadge.textContent = '● PLAYLIST OFICIAL RC8';
                elements.playlistSourceBadge.style.color = 'var(--neon-green)';
            }

            if (isManual) {
                showToast(res.message);
            }
        } catch (e) {
            console.error('Erro na sincronização:', e);
            if (isManual) showToast('⚠️ Falha ao sincronizar. Verifique a planilha.');
        } finally {
            elements.btnSyncSheet.style.animation = '';
        }
    }

    // 7. Eventos do Player e Controles
    elements.btnPlay.addEventListener('click', () => {
        player.togglePlay();
    });

    elements.btnNext.addEventListener('click', () => {
        player.next();
    });

    elements.btnPrev.addEventListener('click', () => {
        player.previous();
    });

    elements.btnShuffle.addEventListener('click', () => {
        const isShuffle = player.toggleShuffle();
        elements.btnShuffle.classList.toggle('active', isShuffle);
        showToast(isShuffle ? '🔀 Modo Aleatório Ativado' : '🔁 Modo Sequencial');
    });

    elements.btnRadioMode.addEventListener('click', () => {
        const isRadio = player.toggleRadioMode();
        elements.btnRadioMode.classList.toggle('active', isRadio);
        showToast(isRadio ? '📻 Modo Rádio Ao Vivo (Fluxo Contínuo)' : '🎧 Modo Normal');
    });

    elements.progressWrapper.addEventListener('click', (e) => {
        const rect = elements.progressWrapper.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percent = (clickX / rect.width) * 100;
        player.seek(percent);
    });

    elements.volumeSlider.addEventListener('input', (e) => {
        player.setVolume(parseFloat(e.target.value));
    });

    elements.searchInput.addEventListener('input', (e) => {
        renderPlaylist(e.target.value);
    });

    // 8. Troca de Abas (Playlist / WOD Timer)
    function switchTab(tab) {
        if (tab === 'playlist') {
            elements.tabPlaylistBtn.classList.add('active');
            elements.tabTimerBtn.classList.remove('active');
            elements.tabPlaylistContent.style.display = 'flex';
            elements.tabTimerContent.style.display = 'none';
            elements.navPlayer.classList.add('active');
            elements.navTimer.classList.remove('active');
        } else {
            elements.tabTimerBtn.classList.add('active');
            elements.tabPlaylistBtn.classList.remove('active');
            elements.tabTimerContent.style.display = 'flex';
            elements.tabPlaylistContent.style.display = 'none';
            elements.navTimer.classList.add('active');
            elements.navPlayer.classList.remove('active');
        }
    }

    elements.tabPlaylistBtn.addEventListener('click', () => switchTab('playlist'));
    elements.tabTimerBtn.addEventListener('click', () => switchTab('wod-timer'));
    elements.navPlayer.addEventListener('click', () => {
        switchTab('playlist');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    elements.navTimer.addEventListener('click', () => {
        switchTab('wod-timer');
        elements.tabTimerContent.scrollIntoView({ behavior: 'smooth' });
    });

    // 9. WOD Timer Eventos
    wodTimer.onStateChange = (state) => {
        elements.timerDigits.textContent = state.formattedTime;

        if (state.mode === 'tabata') {
            elements.timerPhase.textContent = state.status === 'countdown' ? `PREP ${state.countdownValue}` : (state.isWorkPhase ? '🔥 WORK' : '💤 REST');
            elements.timerPhase.className = `timer-phase-tag ${state.isWorkPhase ? '' : 'rest'}`;
            elements.timerRound.textContent = `Round ${state.currentRound} de ${state.totalRounds}`;
            elements.timerBox.className = `timer-display-box ${state.isWorkPhase ? 'work-phase' : 'rest-phase'}`;
        } else if (state.mode === 'custom') {
            elements.timerPhase.textContent = state.status === 'countdown' ? `PREP ${state.countdownValue}` : (state.isWorkPhase ? '🔥 WORK' : '💤 REST');
            elements.timerPhase.className = `timer-phase-tag ${state.isWorkPhase ? '' : 'rest'}`;
            elements.timerRound.textContent = `Repetição ${state.currentRound} de ${state.totalRounds}`;
            elements.timerBox.className = `timer-display-box ${state.isWorkPhase ? 'work-phase' : 'rest-phase'}`;
        } else if (state.mode === 'emom') {
            elements.timerPhase.textContent = state.status === 'countdown' ? `PREP ${state.countdownValue}` : '⚡ EMOM';
            elements.timerRound.textContent = `Minuto ${state.currentRound} de ${state.totalRounds}`;
            elements.timerBox.className = 'timer-display-box work-phase';
        } else if (state.mode === 'amrap') {
            elements.timerPhase.textContent = state.status === 'countdown' ? `PREP ${state.countdownValue}` : '🏆 AMRAP';
            elements.timerRound.textContent = 'Contagem Regressiva';
            elements.timerBox.className = 'timer-display-box work-phase';
        } else if (state.mode === 'stopwatch') {
            elements.timerPhase.textContent = '⏱ CRONÔMETRO';
            elements.timerRound.textContent = 'Tempo Total';
            elements.timerBox.className = 'timer-display-box work-phase';
        }

        if (state.status === 'running' || state.status === 'countdown') {
            elements.btnTimerStart.style.display = 'none';
            elements.btnTimerPause.style.display = 'inline-flex';
        } else {
            elements.btnTimerStart.style.display = 'inline-flex';
            elements.btnTimerPause.style.display = 'none';
        }
    };

    elements.btnTimerStart.addEventListener('click', () => {
        wodTimer.start();
    });

    elements.btnTimerPause.addEventListener('click', () => {
        wodTimer.pause();
    });

    elements.btnTimerReset.addEventListener('click', () => {
        wodTimer.reset();
    });

    elements.modeChips.forEach(chip => {
        chip.addEventListener('click', () => {
            elements.modeChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            wodTimer.setMode(chip.dataset.mode);

            // Mostra/osconde o painel de programação do timer custom
            const customPanel = elements.timerCustomConfig;
            if (chip.dataset.mode === 'custom') {
                const s = wodTimer.getCustomSettings();
                elements.customWork.value = s.work;
                elements.customRest.value = s.rest;
                elements.customRounds.value = s.rounds;
                customPanel.style.display = 'flex';
                customPanel.style.flexDirection = 'column';
            } else {
                customPanel.style.display = 'none';
            }
        });
    });

    // Salva as configurações do timer custom (programável)
    elements.btnSaveCustom.addEventListener('click', () => {
        wodTimer.saveCustomSettings(
            elements.customWork.value,
            elements.customRest.value,
            elements.customRounds.value
        );
        showToast('⚙️ Timer custom programado e salvo!');
    });

    // 10. Compartilhar / Web Share API
    elements.navShare.addEventListener('click', async () => {
        const shareData = {
            title: 'RC8 - Rádio Online Coletiva',
            text: 'Bora treinar com a Rádio da Resenha do Cross - Turma das 8 Horas! 🏋️‍♂️🔥',
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (e) {}
        } else {
            navigator.clipboard.writeText(window.location.href);
            showToast('📋 Link da rádio copiado para a área de transferência!');
        }
    });

    // 11. Sincronização Manual pelo botão do Header
    if (elements.btnSyncSheet) {
        elements.btnSyncSheet.addEventListener('click', () => syncSheetsData(true));
    }

    // 11b. Seletor de Temas
    const THEME_KEY = 'rc8_theme';
    const applyTheme = (theme) => {
        if (theme && theme !== 'default') {
            document.documentElement.setAttribute('data-theme', theme);
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        try { localStorage.setItem(THEME_KEY, theme || 'default'); } catch (e) {}
    };
    // Carrega o tema salvo no carregamento
    try {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved) applyTheme(saved);
    } catch (e) {}

    const toggleThemePicker = (open) => {
        const picker = elements.themePicker;
        if (!picker) return;
        picker.style.display = open ? 'flex' : 'none';
    };

    if (elements.btnTheme) {
        elements.btnTheme.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = elements.themePicker.style.display !== 'none';
            toggleThemePicker(!isOpen);
        });
    }
    elements.themeOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            applyTheme(opt.dataset.themeVal);
            toggleThemePicker(false);
            showToast(opt.querySelector('.theme-name')?.textContent + ' ativado!');
        });
    });
    // Fecha ao clicar fora
    document.addEventListener('click', (e) => {
        if (elements.themePicker && elements.themePicker.style.display !== 'none' &&
            !e.target.closest('#btn-theme') && !e.target.closest('#theme-picker')) {
            toggleThemePicker(false);
        }
    });

    // 12. Inicialização e Auto-Sync
    syncSheetsData(false);

    // Auto-refresh a cada 5 minutos para carregar novas músicas que a turma postar
    setInterval(() => {
        syncSheetsData(false);
    }, 5 * 60 * 1000);
});
