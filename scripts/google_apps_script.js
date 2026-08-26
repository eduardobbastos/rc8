/**
 * ==============================================================================
 * RC8 - AUTOMAÇÃO GOOGLE APPS SCRIPT (TURMA DAS 8 HORAS)
 * Planilha: RC8play (15ajmPTWT7Rz0TIOet-K8RCzHphrnAEYjpOeBWhuvFqY)
 * Pasta Drive: 1PmxduOBedkC9hxJx72s-7Oh6GpqYI5CB
 * ==============================================================================
 */

const FOLDER_ID = '1PmxduOBedkC9hxJx72s-7Oh6GpqYI5CB';

/**
 * Processa as linhas da planilha que ainda não possuem o link do Google Drive
 */
function processarMúsicasPendentes() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const folder = DriveApp.getFolderById(FOLDER_ID);

  if (data.length <= 1) {
    SpreadsheetApp.getUi().alert('A planilha está vazia. Adicione os links do YouTube na Coluna A.');
    return;
  }

  // Cabeçalhos (Linha 1)
  // Coluna A (0): Link_YouTube
  // Coluna B (1): Titulo
  // Coluna C (2): Artista
  // Coluna D (3): BPM
  // Coluna E (4): Status
  // Coluna F (5): Link_Google_Drive

  let processados = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const youtubeUrl = String(row[0] || '').trim();
    const driveLink = String(row[5] || '').trim();
    const status = String(row[4] || '').trim();

    // Processa se tem link do YouTube E ainda NÃO tem link do Google Drive na coluna F
    if (youtubeUrl && (!driveLink || driveLink === '' || status !== 'on')) {
      sheet.getRange(i + 1, 5).setValue('⏳ Processando...');
      SpreadsheetApp.flush();

      // Extrai ID e detalhes do vídeo do YouTube
      const videoInfo = obterInfoYouTube(youtubeUrl);
      
      // Auto-preenche título se estiver vazio
      if ((!row[1] || row[1] === '') && videoInfo.title) {
        sheet.getRange(i + 1, 2).setValue(videoInfo.title);
      }
      if ((!row[2] || row[2] === '') && videoInfo.author) {
        sheet.getRange(i + 1, 3).setValue(videoInfo.author);
      }
      if (!row[3] || row[3] === '') {
        sheet.getRange(i + 1, 4).setValue(140); // BPM padrão
      }

      // Tenta baixar áudio direto para o Drive
      const audioBlob = baixarAudioBlob(youtubeUrl, videoInfo.title || `RC8_Treino_${i}`);

      if (audioBlob) {
        const file = folder.createFile(audioBlob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        const fileUrl = `https://drive.google.com/file/d/${file.getId()}/view?usp=drive_link`;

        // Grava o link do Drive na Coluna F e Status 'on' na Coluna E
        sheet.getRange(i + 1, 5).setValue('on');
        sheet.getRange(i + 1, 6).setValue(fileUrl);
        processados++;
      } else {
        // Se a API na nuvem sofrer bloqueio de IP do YouTube, sinaliza para usar o script local
        sheet.getRange(i + 1, 5).setValue('Pendente (Terminal)');
      }
    }
  }

  if (processados > 0) {
    SpreadsheetApp.getUi().alert(`🎉 Sucesso! ${processados} músicas processadas e adicionadas ao Google Drive!`);
  } else {
    SpreadsheetApp.getUi().alert('Todas as músicas já possuem link do Google Drive ou estão atualizadas.');
  }
}

/**
 * Obtém título e artista do YouTube via oEmbed oficial (sempre funciona)
 */
function obterInfoYouTube(url) {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = UrlFetchApp.fetch(oembedUrl, { muteHttpExceptions: true });
    if (res.getResponseCode() === 200) {
      const json = JSON.parse(res.getContentText());
      return {
        title: json.title || '',
        author: json.author_name || ''
      };
    }
  } catch (e) {}
  return { title: '', author: '' };
}

/**
 * Tenta baixar o arquivo binário de áudio via instâncias de streaming
 */
function baixarAudioBlob(youtubeUrl, titulo) {
  const match = youtubeUrl.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
  if (!match) return null;
  const videoId = match[1];

  const endpoints = [
    `https://inv.nadeko.net/api/v1/videos/${videoId}`,
    `https://invidious.nerdvpn.de/api/v1/videos/${videoId}`,
    `https://vid.puffyan.us/api/v1/videos/${videoId}`
  ];

  for (let i = 0; i < endpoints.length; i++) {
    try {
      const res = UrlFetchApp.fetch(endpoints[i], { muteHttpExceptions: true });
      if (res.getResponseCode() === 200) {
        const json = JSON.parse(res.getContentText());
        const formats = json.adaptiveFormats || [];
        const audioFormat = formats.find(f => (f.type && f.type.includes('audio')) || f.audioQuality);
        
        if (audioFormat && audioFormat.url) {
          const audioRes = UrlFetchApp.fetch(audioFormat.url, { muteHttpExceptions: true });
          const blob = audioRes.getBlob();
          blob.setName(`${titulo.replace(/[/\\?%*:|"<>]/g, '')}.mp3`);
          blob.setContentType('audio/mp3');
          return blob;
        }
      }
    } catch (err) {
      Logger.log(`Falha no endpoint ${endpoints[i]}: ${err}`);
    }
  }

  return null;
}

/**
 * Cria o menu exclusivo na sua planilha
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📻 RC8 Rádio')
    .addItem('⚡ Processar Músicas Novas do YouTube -> Google Drive', 'processarMúsicasPendentes')
    .addToUi();
}
