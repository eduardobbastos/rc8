/**
 * RC8 - Local Node.js Downloader: YouTube -> Google Drive MP3s
 * Resenha do Cross Turma das 8 Horas
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SHEET_ID = '1QU6J8zvAGVeWFzglui0fJ8NiHgmOY9PtTcMedN1cmA0';
const DRIVE_FOLDER_ID = '1PmxduOBedkC9hxJx72s-7Oh6GpqYI5CB';
const OUTPUT_DIR = path.join(__dirname, '..', 'downloads');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('📻 RC8 YouTube Downloader');
console.log(`Planilha: https://docs.google.com/spreadsheets/d/${SHEET_ID}`);
console.log(`Pasta Drive Destino: https://drive.google.com/drive/folders/${DRIVE_FOLDER_ID}`);
console.log(`Diretório local de saída: ${OUTPUT_DIR}\n`);

async function fetchSheetCSV() {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function parseCSV(text) {
    return text.split('\n')
        .map(line => line.split(',').map(cell => cell.replace(/^"(.*)"$/, '$1').trim()))
        .filter(row => row.some(cell => cell.length > 0));
}

async function run() {
    try {
        console.log('🔍 Buscando links na planilha...');
        const csv = await fetchSheetCSV();
        const rows = parseCSV(csv);

        if (rows.length <= 1) {
            console.log('⚠️ Nenhuma linha encontrada na planilha.');
            return;
        }

        console.log(`Encontradas ${rows.length - 1} linhas na planilha.\n`);
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const ytLink = row.find(c => c.includes('youtube.com') || c.includes('youtu.be'));
            
            if (ytLink) {
                console.log(`[Linha ${i + 1}] YouTube URL: ${ytLink}`);
            }
        }
    } catch (err) {
        console.error('Erro:', err.message);
    }
}

run();
