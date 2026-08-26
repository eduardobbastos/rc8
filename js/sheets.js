/**
 * RC8 - Gerenciador de Integração com Google Planilhas e Google Drive
 * Resenha do Cross Turma das 8 Horas
 */

const SheetsManager = {
    // Configuração permanente oficial da planilha da Rádio RC8
    defaultSheetId: '15ajmPTWT7Rz0TIOet-K8RCzHphrnAEYjpOeBWhuvFqY',
    defaultSheetUrl: 'https://docs.google.com/spreadsheets/d/15ajmPTWT7Rz0TIOet-K8RCzHphrnAEYjpOeBWhuvFqY/edit?gid=0#gid=0',
    storageKey: 'rc8_sheet_config',
    cacheKey: 'rc8_cached_playlist',
    
    // Configuração atual
    config: {
        sheetUrl: 'https://docs.google.com/spreadsheets/d/15ajmPTWT7Rz0TIOet-K8RCzHphrnAEYjpOeBWhuvFqY/edit?gid=0#gid=0',
        sheetId: '15ajmPTWT7Rz0TIOet-K8RCzHphrnAEYjpOeBWhuvFqY',
        sheetName: '',
        autoSyncIntervalMinutes: 5,
        directAudioFallback: true
    },

    // Músicas demo de alta energia (Workout / CrossFit) para teste imediato
    demoTracks: [
        {
            id: 'demo-1',
            title: 'The Kids Aren\'t Alright',
            artist: 'The Offspring',
            url: 'https://drive.usercontent.google.com/download?id=1TcJp7NxastosE_nQBQT7Sv-9g3Ow3unl&export=download',
            bpm: 138,
            genre: 'Workout Rock',
            duration: '02:59',
            cover: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80',
            dedication: 'Turma das 8h - Aquecimento'
        }
    ],

    init() {
        this.loadConfig();
    },

    loadConfig() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                this.config = { ...this.config, ...JSON.parse(saved) };
            } catch (e) {
                console.error('Erro ao ler config da planilha:', e);
            }
        }
        // Garante que o sheetId padrão sempre tenha precedência se estiver vazio
        if (!this.config.sheetId) {
            this.config.sheetId = this.defaultSheetId;
        }
    },

    saveConfig(config) {
        this.config = { ...this.config, ...config };
        localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    },

    /**
     * Extrai o ID de uma URL do Google Sheets ou Drive
     */
    extractSheetId(input) {
        if (!input) return this.defaultSheetId;
        input = input.trim();
        const matchSheet = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (matchSheet) return matchSheet[1];
        
        const matchFolder = input.match(/\/folders\/([a-zA-Z0-9-_]+)/);
        if (matchFolder) return matchFolder[1];

        const matchFile = input.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
        if (matchFile) return matchFile[1];

        if (/^[a-zA-Z0-9-_]{20,}$/.test(input)) {
            return input;
        }

        return this.defaultSheetId;
    },

    /**
     * Converte links do Google Drive para stream direto de áudio
     */
    convertGoogleDriveLink(url) {
        if (!url) return '';
        url = url.trim();

        // Se já for uma URL direta de áudio (.mp3, .m4a, etc.)
        if (url.startsWith('http') && (url.includes('.mp3') || url.includes('.m4a') || url.includes('.wav') || url.includes('.ogg'))) {
            return url;
        }

        // Extrai o ID do arquivo do Drive de qualquer formato de link
        let fileId = '';
        const matchFile = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
        if (matchFile) {
            fileId = matchFile[1];
        } else {
            const matchIdParam = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
            if (matchIdParam) {
                fileId = matchIdParam[1];
            } else {
                const matchGeneral = url.match(/([a-zA-Z0-9-_]{25,})/);
                if (matchGeneral) {
                    fileId = matchGeneral[1];
                }
            }
        }

        if (fileId) {
            // Endpoint oficial do Google Drive que entrega o MP3 com status 200
            return `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;
        }

        return url;
    },

    /**
     * Busca a lista de músicas:
     * 1. Carrega o arquivo de metadados oficial do GitHub (data/playlist.json)
     * 2. Faz fallback para a consulta ao vivo da planilha do Google Sheets
     */
    async fetchPlaylist(customSheetId = null) {
        // 1. Tenta carregar os metadados oficiais sincronizados no GitHub
        try {
            const resJson = await fetch('data/playlist.json?v=' + Date.now());
            if (resJson.ok) {
                const data = await resJson.json();
                if (data && data.tracks && data.tracks.length > 0) {
                    console.log(`✅ ${data.tracks.length} músicas carregadas do arquivo oficial de metadados do GitHub!`);
                    if (typeof localStorage !== 'undefined') {
                        localStorage.setItem(this.cacheKey, JSON.stringify(data.tracks));
                    }
                    return {
                        source: 'github_metadata',
                        tracks: data.tracks,
                        message: 'Playlist oficial RC8 sincronizada com o GitHub!'
                    };
                }
            }
        } catch (e) {
            console.log('Metadados locais não disponíveis, consultando planilha ao vivo...', e);
        }

        const sheetId = customSheetId || this.config.sheetId || this.extractSheetId(this.config.sheetUrl);

        // Se não tiver planilha configurada, retorna as músicas demo com indicação
        if (!sheetId) {
            return {
                source: 'demo',
                tracks: this.demoTracks,
                message: 'Usando playlist demo oficial RC8.'
            };
        }

        // Constrói endpoints de consulta CSV do Google Sheets
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${this.config.sheetName ? `&sheet=${encodeURIComponent(this.config.sheetName)}` : ''}`;
        const pubUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/pub?output=csv`;

        let csvData = null;

        try {
            const res = await fetch(gvizUrl);
            if (res.ok) {
                csvData = await res.text();
            } else {
                throw new Error('GViz respondeu com erro ' + res.status);
            }
        } catch (err) {
            console.warn('Tentando endpoint pub do Google Sheets...', err);
            try {
                const resPub = await fetch(pubUrl);
                if (resPub.ok) {
                    csvData = await resPub.text();
                }
            } catch (err2) {
                console.error('Falha ao conectar na planilha:', err2);
            }
        }

        if (!csvData || csvData.trim().length === 0 || csvData.includes('<!DOCTYPE html>')) {
            // Caso a planilha esteja privada ou formato inválido
            if (typeof localStorage !== 'undefined') {
                const cached = localStorage.getItem(this.cacheKey);
                if (cached) {
                    try {
                        const cachedTracks = JSON.parse(cached);
                        return {
                            source: 'cache',
                            tracks: cachedTracks,
                            message: 'Carregado do cache local. Verifique se a planilha está com acesso público.'
                        };
                    } catch(e){}
                }
            }

            return {
                source: 'demo',
                tracks: this.demoTracks,
                message: 'Planilha não acessível publicamente. Exibindo faixas de treino RC8!'
            };
        }

        // Faz parse do CSV
        const parsedTracks = this.parseCSV(csvData);

        if (parsedTracks.length > 0) {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(this.cacheKey, JSON.stringify(parsedTracks));
            }
            return {
                source: 'live_sheet',
                tracks: parsedTracks,
                message: `Sincronizado com sucesso! ${parsedTracks.length} músicas carregadas da planilha.`
            };
        } else {
            return {
                source: 'demo',
                tracks: this.demoTracks,
                message: 'A planilha foi lida, mas nenhuma linha com link de áudio válido foi encontrada. Usando demo.'
            };
        }
    },

    /**
     * Parser robusto de CSV com suporte a aspas e múltiplas colunas
     */
    parseCSV(csvText) {
        const lines = [];
        let row = [];
        let inQuotes = false;
        let currentValue = '';

        for (let i = 0; i < csvText.length; i++) {
            const char = csvText[i];
            const nextChar = csvText[i + 1];

            if (char === '"' && inQuotes && nextChar === '"') {
                currentValue += '"';
                i++;
            } else if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                row.push(currentValue.trim());
                currentValue = '';
            } else if ((char === '\r' || char === '\n') && !inQuotes) {
                if (char === '\r' && nextChar === '\n') {
                    i++;
                }
                row.push(currentValue.trim());
                if (row.some(val => val.length > 0)) {
                    lines.push(row);
                }
                row = [];
                currentValue = '';
            } else {
                currentValue += char;
            }
        }

        if (currentValue.length > 0 || row.length > 0) {
            row.push(currentValue.trim());
            if (row.some(val => val.length > 0)) {
                lines.push(row);
            }
        }

        if (lines.length <= 1) return [];

        // Identifica os cabeçalhos
        const headers = lines[0].map(h => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim());
        
        // Mapeia índices de colunas com prioridade inteligente
        const titleIdx = headers.findIndex(h => h.includes('titulo') || h.includes('musica') || h.includes('nome') || h.includes('track') || h.includes('title'));
        const artistIdx = headers.findIndex(h => h.includes('artista') || h.includes('cantor') || h.includes('banda') || h.includes('artist'));
        
        // Prioriza coluna de áudio direto / Google Drive
        let driveUrlIdx = headers.findIndex(h => (h.includes('drive') || h.includes('audio') || h.includes('arquivo') || h.includes('stream')) && !h.includes('youtube'));
        let youtubeUrlIdx = headers.findIndex(h => h.includes('youtube'));
        let genericUrlIdx = headers.findIndex(h => h.includes('link') || h.includes('url'));

        const bpmIdx = headers.findIndex(h => h.includes('bpm') || h.includes('ritmo') || h.includes('velocidade'));
        const genreIdx = headers.findIndex(h => h.includes('genero') || h.includes('estilo') || h.includes('style') || h.includes('genre'));
        const coverIdx = headers.findIndex(h => h.includes('capa') || h.includes('cover') || h.includes('foto') || h.includes('imagem') || h.includes('image'));
        const dedicateIdx = headers.findIndex(h => h.includes('dedicado') || h.includes('pedido') || h.includes('aluno') || h.includes('atleta') || h.includes('por'));

        const tracks = [];

        // Itera sobre as linhas de dados (a partir da linha 1)
        for (let i = 1; i < lines.length; i++) {
            const r = lines[i];
            
            // Prioridade total para o arquivo da coluna Link_Google_Drive
            let driveRawUrl = (driveUrlIdx !== -1 && r[driveUrlIdx]) ? r[driveUrlIdx].trim() : '';
            let youtubeRawUrl = (youtubeUrlIdx !== -1 && r[youtubeUrlIdx]) ? r[youtubeUrlIdx].trim() : '';
            
            // Extrai ID do Google Drive da coluna Link_Google_Drive
            let driveFileId = '';
            if (driveRawUrl) {
                const matchDrive = driveRawUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/) || driveRawUrl.match(/[?&]id=([a-zA-Z0-9-_]+)/) || driveRawUrl.match(/([a-zA-Z0-9-_]{25,})/);
                if (matchDrive) {
                    driveFileId = matchDrive[1];
                }
            }

            // Extrai ID do YouTube da coluna Link_YouTube
            let youtubeId = '';
            if (youtubeRawUrl) {
                const ytMatch = youtubeRawUrl.match(/(?:v=|\/embed\/|\/watch\?v=|\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                if (ytMatch) {
                    youtubeId = ytMatch[1];
                }
            }

            // URL principal de stream (Google Drive oficial)
            const streamUrl = driveFileId ? `https://drive.usercontent.google.com/download?id=${driveFileId}&export=download` : (driveRawUrl || youtubeRawUrl);
            
            const title = (titleIdx !== -1 && r[titleIdx]) ? r[titleIdx] : `Faixa #${i}`;
            const artist = (artistIdx !== -1 && r[artistIdx]) ? r[artistIdx] : 'Turma das 8h';
            const bpm = (bpmIdx !== -1 && r[bpmIdx]) ? parseInt(r[bpmIdx], 10) || 140 : 138;
            const genre = (genreIdx !== -1 && r[genreIdx]) ? r[genreIdx] : 'Workout Rock';
            
            // Capa oficial
            let cover = this.getDynamicCover(i);
            if (coverIdx !== -1 && r[coverIdx] && r[coverIdx].startsWith('http')) {
                cover = r[coverIdx];
            } else if (youtubeId) {
                cover = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
            }

            const dedication = (dedicateIdx !== -1 && r[dedicateIdx]) ? r[dedicateIdx] : 'Resenha RC8';

            tracks.push({
                id: `sheet-${i}-${Date.now().toString(36)}`,
                title,
                artist,
                url: streamUrl,
                driveFileId,
                driveUrl: driveRawUrl,
                driveStreamUrl: streamUrl,
                youtubeId,
                youtubeUrl: youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : '',
                bpm,
                genre,
                cover,
                dedication,
                rawDriveUrl: driveRawUrl
            });
        }

        return tracks;
    },

    getDynamicCover(index) {
        const covers = [
            'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80',
            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
            'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&q=80',
            'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&q=80',
            'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80',
            'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&q=80'
        ];
        return covers[index % covers.length];
    }
};

if (typeof window !== 'undefined') {
    window.SheetsManager = SheetsManager;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SheetsManager;
}
