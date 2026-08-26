/**
 * ==============================================================================
 * RC8 - AUTOMAÇÃO GOOGLE APPS SCRIPT (100% JAVASCRIPT NA NUVEM)
 * Baixa áudio do YouTube da Planilha e salva direto na pasta do Google Drive
 * ==============================================================================
 * 
 * Como usar:
 * 1. Abra a sua Planilha de Pedidos do YouTube:
 *    https://docs.google.com/spreadsheets/d/1QU6J8zvAGVeWFzglui0fJ8NiHgmOY9PtTcMedN1cmA0/edit
 * 2. No menu superior, clique em: Extensões > Apps Script
 * 3. Apague qualquer código existente, cole este código completo e clique em Salvar (ícone de disquete).
 * 4. Clique no botão "Executar" na função "processarPedidosYouTube" ou crie um gatilho de tempo!
 */

// ID da pasta do Google Drive onde os MP3s serão salvos
const FOLDER_ID = '1PmxduOBedkC9hxJx72s-7Oh6GpqYI5CB';

// ID da planilha da Rádio Oficial (onde a rádio lê as músicas finais)
// Pode ser a mesma ou a planilha principal da RC8
const SPREADSHEET_ID = '1QU6J8zvAGVeWFzglui0fJ8NiHgmOY9PtTcMedN1cmA0';

/**
 * Função principal que lê os links do YouTube e salva o áudio no Google Drive
 */
function processarPedidosYouTube() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const folder = DriveApp.getFolderById(FOLDER_ID);

  if (data.length <= 1) {
    Logger.log('Nenhum dado encontrado na planilha.');
    return;
  }

  // Identifica as colunas (Link_YouTube, Status, Link_Drive, Titulo, Artista, etc.)
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  let urlIdx = headers.findIndex(h => h.includes('youtube') || h.includes('link') || h.includes('url'));
  let statusIdx = headers.findIndex(h => h.includes('status') || h.includes('processado'));
  let driveIdx = headers.findIndex(h => h.includes('drive') || h.includes('audio') || h.includes('arquivo'));
  let titleIdx = headers.findIndex(h => h.includes('titulo') || h.includes('musica') || h.includes('nome'));

  // Se não existirem colunas de status ou drive, cria nos cabeçalhos
  if (urlIdx === -1) urlIdx = 0; // Assume coluna A
  if (statusIdx === -1) {
    statusIdx = headers.length;
    sheet.getRange(1, statusIdx + 1).setValue('Status');
  }
  if (driveIdx === -1) {
    driveIdx = statusIdx + 1;
    sheet.getRange(1, driveIdx + 1).setValue('Link_Google_Drive');
  }

  Logger.log(`Iniciando processamento... Pasta Destino: ${folder.getName()}`);

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const youtubeUrl = String(row[urlIdx] || '').trim();
    const status = String(row[statusIdx] || '').trim();

    // Se a linha tem link do YouTube e ainda não foi processada
    if (youtubeUrl && (youtubeUrl.includes('youtube.com') || youtubeUrl.includes('youtu.be')) && status !== 'OK') {
      try {
        Logger.log(`Baixando áudio da linha ${i + 1}: ${youtubeUrl}`);
        sheet.getRange(i + 1, statusIdx + 1).setValue('Processando...');

        // Usa API de extração de áudio MP3
        const audioInfo = extrairAudioYouTube(youtubeUrl);

        if (audioInfo && audioInfo.blob) {
          // Salva o arquivo MP3 na pasta do Google Drive
          const file = folder.createFile(audioInfo.blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          
          const fileUrl = file.getUrl();
          const directStreamUrl = `https://docs.google.com/uc?export=download&id=${file.getId()}`;

          // Atualiza a planilha com o link do Drive e Status OK
          sheet.getRange(i + 1, statusIdx + 1).setValue('OK');
          sheet.getRange(i + 1, driveIdx + 1).setValue(fileUrl);
          
          if (titleIdx !== -1 && (!row[titleIdx] || row[titleIdx] === '')) {
            sheet.getRange(i + 1, titleIdx + 1).setValue(audioInfo.title || file.getName());
          }

          Logger.log(`✅ Sucesso! Arquivo salvo no Drive: ${file.getName()} (${fileUrl})`);
        } else {
          sheet.getRange(i + 1, statusIdx + 1).setValue('Erro: API Indisponível');
        }
      } catch (err) {
        Logger.log(`❌ Erro na linha ${i + 1}: ${err.toString()}`);
        sheet.getRange(i + 1, statusIdx + 1).setValue(`Erro: ${err.message}`);
      }
    }
  }
}

/**
 * Extrai a stream de áudio do YouTube usando API de conversão
 */
function extrairAudioYouTube(youtubeUrl) {
  try {
    // Cobalt API pública para extração de áudio
    const apiUrl = 'https://api.cobalt.tools/api/json';
    const payload = JSON.stringify({
      url: youtubeUrl,
      isAudioOnly: true,
      aFormat: 'mp3'
    });

    const response = UrlFetchApp.fetch(apiUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: payload,
      muteHttpExceptions: true,
      headers: {
        'Accept': 'application/json'
      }
    });

    const json = JSON.parse(response.getContentText());

    if (json && json.url) {
      // Baixa o arquivo binário do áudio
      const audioResponse = UrlFetchApp.fetch(json.url);
      const blob = audioResponse.getBlob();
      
      // Gera nome limpo para o arquivo MP3
      const videoIdMatch = youtubeUrl.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : Date.now();
      blob.setName(`RC8_Treino_${videoId}.mp3`);
      blob.setContentType('audio/mp3');

      return {
        blob: blob,
        title: `Música YouTube (${videoId})`
      };
    }
  } catch (e) {
    Logger.log('Tentando endpoint alternativo de download...', e);
  }

  return null;
}

/**
 * Cria um menu interativo dentro do Google Sheets chamado "📻 RC8 Rádio"
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📻 RC8 Rádio')
    .addItem('⚡ Baixar Músicas do YouTube para o Google Drive', 'processarPedidosYouTube')
    .addToUi();
}
