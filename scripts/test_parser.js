const SheetsManager = require('../js/sheets.js');

const mockCSV = `Link_YouTube,Titulo,Artista,BPM,Status,Link_Google_Drive
https://www.youtube.com/watch?v=dQw4w9WgXcQ,Never Gonna Give You Up,Rick Astley,115,OK,https://drive.google.com/file/d/1gEIOwDGpCtNSwVOehMKo9A1Arz9dMCOf/view
https://youtu.be/39_OmB-lO6k,Can't Be Touched,Roy Jones Jr,140,OK,https://drive.google.com/uc?export=download&id=1PmxduOBedkC9hxJx72s-7Oh6GpqYI5CB
`;

const tracks = SheetsManager.parseCSV(mockCSV);
console.log('✅ Resultado do Teste de Parse da Planilha:');
console.log(JSON.stringify(tracks, null, 2));

if (tracks.length === 2 && tracks[0].url.includes('drive.usercontent.google.com') && tracks[0].title === 'Never Gonna Give You Up') {
    console.log('\n🎉 TESTE PASSOU COM 100% DE SUCESSO!');
} else {
    console.error('❌ Falha no teste.');
    process.exit(1);
}
