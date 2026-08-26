/**
 * RC8 - Gerenciador de Integração com Google Planilhas e Google Drive
 * Resenha do Cross Turma das 8 Horas
 */

const SheetsManager = {
    // Configurações padrão
    defaultSheetId: '1gEIOwDGpCtNSwVOehMKo9A1Arz9dMCOf', // ID extraído da URL fornecida ou customizável
    storageKey: 'rc8_sheet_config',
    cacheKey: 'rc8_cached_playlist',
    
    // Configuração atual
    config: {
        sheetUrl: '',
        sheetId: '',
        sheetName: '',
        autoSyncIntervalMinutes: 5,
        directAudioFallback: true
    },

    // Músicas demo de alta energia (Workout / CrossFit) para teste imediato
    demoTracks: [
        {
            id: 'demo-1',
            title: 'Can\'t Be Touched (Roy Jones Jr Remix)',
            artist: 'Roy Jones Jr / Bodybuilder Gym',
            url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=workout-electronic-future-bass-113264.mp3',
            bpm: 135,
            genre: 'Workout Bass',
            duration: '03:12',
            cover: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80',
            dedication: 'Turma das 8h - Aquecimento Pesado'
        },
        {
            id: 'demo-2',
            title: 'Beast Mode On (Hard Electro)',
            artist: 'Cyber Athlete',
            url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=sport-electro-future-bass-10874.mp3',
            bpm: 140,
            genre: 'CrossFit Electro',
            duration: '02:48',
            cover: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
            dedication: 'Box RC8 - No Pain No Gain'
        },
        {
            id: 'demo-3',
            title: 'Hardcore WOD Energy',
            artist: 'Heavy Power Beat',
            url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_341f237bf3.mp3?filename=action-sport-rock-power-11881.mp3',
            bpm: 150,
            genre: 'Gym Rock / Beat',
            duration: '03:05',
            cover: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&q=80',
            dedication: 'Murph WOD - Resenha Pura'
        },
        {
            id: 'demo-4',
            title: 'Adrenaline Rush (Trap Metal)',
            artist: 'Titanium Workout',
            url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=energetic-hip-hop-trap-9860.mp3',
            bpm: 145,
            genre: 'Trap Workout',
            duration: '02:30',
            cover: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&q=80',
            dedication: 'Coach 8:00 - Foco Total'
        },
        {
            id: 'demo-5',
            title: 'Midnight PR Heavy Drop',
            artist: 'Kettlebell Kings',
            url: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=ticking-clock-action-trailer-122971.mp3',
            bpm: 160,
            genre: 'High Intensity',
            duration: '02:55',
            cover: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80',
            dedication: 'Sprint Final 8h'
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
    },

    saveConfig(config) {
        this.config = { ...this.config, ...config };
        localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    },

    /**
     * Extrai o ID de uma URL do Google Sheets ou Drive
     */
    extractSheetId(input) {
        if (!input) return '';
        input = input.trim();
        // Se for uma URL completa de planilha
        const matchSheet = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (matchSheet) return matchSheet[1];
        
        // Se for uma URL de pasta do Google Drive
        const matchFolder = input.match(/\/folders\/([a-zA-Z0-9-_]+)/);
        if (matchFolder) return matchFolder[1];

        // Se for URL de arquivo do drive
        const matchFile = input.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
        if (matchFile) return matchFile[1];

        // Se já for o ID puro
        if (/^[a-zA-Z0-9-_]{20,}$/.test(input)) {
            return input;
        }

        return input;
    },

    /**
     * Converte links do Google Drive para stream direto de áudio
     */
    convertGoogleDriveLink(url) {
        if (!url) return '';
        url = url.trim();

        // Se já for uma URL direta de MP3 ou áudio
        if (url.startsWith('http') && (url.includes('.mp3') || url.includes('.m4a') || url.includes('.wav') || url.includes('.ogg'))) {
            return url;
        }

        // Tenta extrair o ID do arquivo do Drive
        let fileId = '';
        const matchFile = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
        if (matchFile) {
            fileId = matchFile[1];
        } else {
            const matchIdParam = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
            if (matchIdParam) {
                fileId = matchIdParam[1];
            } else if (/^[a-zA-Z0-9-_]{25,}$/.test(url)) {
                fileId = url;
            }
        }

        if (fileId) {
            // URL de download direto do Google Drive que funciona perfeitamente com a tag <audio>
            return `https://docs.google.com/uc?export=download&id=${fileId}`;
        }

        return url;
    },

    /**
     * Busca a lista de músicas a partir da planilha pública
     */
    async fetchPlaylist(customSheetId = null) {
        const sheetId = customSheetId || this.config.sheetId || this.extractSheetId(this.config.sheetUrl);

        // Se não tiver planilha configurada, retorna as músicas demo com indicação
        if (!sheetId) {
            return {
                source: 'demo',
                tracks: this.demoTracks,
                message: 'Usando playlist demo oficial RC8. Adicione sua planilha nas configurações para sincronizar suas músicas!'
            };
        }

        // Constrói endpoints de consulta CSV do Google Sheets
        // Formato 1: gviz tq (funciona para qualquer planilha compartilhada com "Qualquer pessoa com o link pode ler")
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${this.config.sheetName ? `&sheet=${encodeURIComponent(this.config.sheetName)}` : ''}`;
        
        // Formato 2: pub?output=csv (para planilhas publicadas na web)
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

            return {
                source: 'demo',
                tracks: this.demoTracks,
                message: 'Planilha não acessível publicamente. Exibindo faixas de treino RC8!'
            };
        }

        // Faz parse do CSV
        const parsedTracks = this.parseCSV(csvData);

        if (parsedTracks.length > 0) {
            localStorage.setItem(this.cacheKey, JSON.stringify(parsedTracks));
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
            
            // Escolhe a melhor URL disponível (Drive > Generic > YouTube)
            let rawUrl = '';
            if (driveUrlIdx !== -1 && r[driveUrlIdx] && r[driveUrlIdx].startsWith('http')) {
                rawUrl = r[driveUrlIdx];
            } else if (genericUrlIdx !== -1 && r[genericUrlIdx] && r[genericUrlIdx].startsWith('http')) {
                rawUrl = r[genericUrlIdx];
            } else if (youtubeUrlIdx !== -1 && r[youtubeUrlIdx] && r[youtubeUrlIdx].startsWith('http')) {
                rawUrl = r[youtubeUrlIdx];
            } else {
                const foundUrl = r.find(col => col.startsWith('http') || col.includes('drive.google.com') || /^[a-zA-Z0-9-_]{25,}$/.test(col));
                if (foundUrl) rawUrl = foundUrl;
            }

            if (!rawUrl) continue;

            const streamUrl = this.convertGoogleDriveLink(rawUrl);
            const title = (titleIdx !== -1 && r[titleIdx]) ? r[titleIdx] : `Faixa #${i}`;
            const artist = (artistIdx !== -1 && r[artistIdx]) ? r[artistIdx] : 'Turma das 8h';
            const bpm = (bpmIdx !== -1 && r[bpmIdx]) ? parseInt(r[bpmIdx], 10) || 140 : 138;
            const genre = (genreIdx !== -1 && r[genreIdx]) ? r[genreIdx] : 'Workout';
            const cover = (coverIdx !== -1 && r[coverIdx] && r[coverIdx].startsWith('http')) ? r[coverIdx] : this.getDynamicCover(i);
            const dedication = (dedicateIdx !== -1 && r[dedicateIdx]) ? r[dedicateIdx] : 'Resenha RC8';

            tracks.push({
                id: `sheet-${i}-${Date.now().toString(36)}`,
                title,
                artist,
                url: streamUrl,
                bpm,
                genre,
                cover,
                dedication,
                rawDriveUrl: rawUrl
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
