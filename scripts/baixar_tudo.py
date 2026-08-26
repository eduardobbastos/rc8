#!/usr/bin/env python3
"""
RC8 - Baixador Automático de Músicas do YouTube para a Turma das 8h
Lê a planilha, baixa os áudios em alta qualidade e organiza os arquivos.
"""

import os
import sys
import csv
import urllib.request
import yt_dlp

SHEET_ID = "1QU6J8zvAGVeWFzglui0fJ8NiHgmOY9PtTcMedN1cmA0"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "downloads")

os.makedirs(OUTPUT_DIR, exist_ok=True)

print("=" * 60)
print("📻 RC8 - BAIXADOR DE MÚSICAS DO YOUTUBE (TURMA DAS 8H)")
print("=" * 60)
print(f"📁 Pasta de destino: {OUTPUT_DIR}")
print(f"📊 Planilha: https://docs.google.com/spreadsheets/d/{SHEET_ID}\n")

def get_sheet_data():
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            content = response.read().decode('utf-8')
            reader = csv.reader(content.splitlines())
            return list(reader)
    except Exception as e:
        print(f"⚠️ Não foi possível ler a planilha automaticamente via web: {e}")
        return []

def baixar_musica(youtube_url, titulo_custom=None):
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'outtmpl': os.path.join(OUTPUT_DIR, '%(title)s.%(ext)s'),
        'noplaylist': True,
        'quiet': False,
        'no_warnings': True
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(youtube_url, download=True)
            # Nome do arquivo MP3 final convertido
            base_name = ydl.prepare_filename(info)
            mp3_name = os.path.splitext(base_name)[0] + '.mp3'
            print(f"✅ Áudio MP3 gerado com sucesso: {os.path.basename(mp3_name)}")
            return mp3_name
        except Exception as err:
            print(f"❌ Erro ao baixar áudio de {youtube_url}: {err}")
            return None

def main():
    rows = get_sheet_data()
    
    if not rows or len(rows) <= 1:
        print("💡 Digite o link do YouTube diretamente para baixar agora:")
        link = input("Link do YouTube: ").strip()
        if link:
            baixar_musica(link)
        return

    print(f"🔍 {len(rows)-1} linhas encontradas na planilha. Processando...\n")
    
    sucessos = 0
    for i, row in enumerate(rows[1:], start=2):
        yt_link = next((cell for cell in row if 'youtube.com' in cell or 'youtu.be' in cell), None)
        if yt_link:
            print(f"\n[Linha {i}] Baixando: {yt_link}")
            res = baixar_musica(yt_link)
            if res:
                sucessos += 1
                
    print("\n" + "=" * 60)
    print(f"🎉 Finalizado! {sucessos} áudios baixados com sucesso na pasta 'downloads/'!")
    print("👉 Agora basta arrastar os arquivos para a sua pasta do Google Drive:")
    print("   https://drive.google.com/drive/folders/1PmxduOBedkC9hxJx72s-7Oh6GpqYI5CB")
    print("=" * 60)

if __name__ == "__main__":
    main()
