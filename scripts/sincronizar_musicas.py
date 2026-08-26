#!/usr/bin/env python3
"""
RC8 - Sincronizador Inteligente de Músicas e Metadados
Resenha do Cross Turma das 8 Horas
"""

import os
import sys
import csv
import json
import re
import urllib.request
import yt_dlp

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(BASE_DIR, "audio")
DATA_DIR = os.path.join(BASE_DIR, "data")
SHEET_ID = "15ajmPTWT7Rz0TIOet-K8RCzHphrnAEYjpOeBWhuvFqY"

os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

print("=" * 60)
print("📻 RC8 - SINCRONIZADOR INTELIGENTE DE MÚSICAS (GITHUB AUDIO)")
print("=" * 60)
print(f"📁 Pasta de Áudio: {AUDIO_DIR}")
print(f"📄 Arquivo de Metadados: {os.path.join(DATA_DIR, 'playlist.json')}")
print(f"📊 Planilha Oficial: https://docs.google.com/spreadsheets/d/{SHEET_ID}\n")

def sanitize_filename(name):
    clean = re.sub(r'[\\/*?:"<>|]', "", name).strip()
    return clean

def extract_youtube_id(url):
    if not url:
        return ""
    # Padrões comuns de URL do YouTube
    match = re.search(r'(?:v=|\/embed\/|\/watch\?v=|\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})', url)
    if match:
        return match.group(1)
    return ""

def search_youtube_for_id(query):
    try:
        ydl_opts = {'quiet': True, 'no_warnings': True, 'extract_flat': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            res = ydl.extract_info(f"ytsearch1:{query}", download=False)
            if res and 'entries' in res and len(res['entries']) > 0:
                return res['entries'][0].get('id', '')
    except Exception as e:
        print(f"⚠️ Erro ao buscar ID do YouTube para '{query}': {e}")
    return ""

def get_sheet_data():
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            content = response.read().decode('utf-8')
            reader = csv.reader(content.splitlines())
            return list(reader)
    except Exception as e:
        print(f"⚠️ Erro ao ler planilha via web: {e}")
        return []

def find_existing_audio_file(title, artist):
    existing_files = os.listdir(AUDIO_DIR)
    title_clean = re.sub(r'[^a-zA-Z0-9]', '', title.lower())
    
    if not title_clean:
        return None

    for f in existing_files:
        if not f.endswith('.mp3'):
            continue
        f_clean = re.sub(r'[^a-zA-Z0-9]', '', f.lower())
        if title_clean in f_clean:
            return f
            
    return None

def download_audio_from_youtube(target_source, desired_filename):
    out_template = os.path.join(AUDIO_DIR, desired_filename + '.%(ext)s')
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'outtmpl': out_template,
        'noplaylist': True,
        'quiet': False,
        'no_warnings': True
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            download_query = target_source if target_source.startswith('http') else f"ytsearch1:{target_source}"
            info = ydl.extract_info(download_query, download=True)
            mp3_path = os.path.join(AUDIO_DIR, desired_filename + '.mp3')
            if os.path.exists(mp3_path):
                return desired_filename + '.mp3'
            
            if 'entries' in info and len(info['entries']) > 0:
                info = info['entries'][0]
                
            base_name = ydl.prepare_filename(info)
            actual_mp3 = os.path.splitext(base_name)[0] + '.mp3'
            if os.path.exists(actual_mp3):
                return os.path.basename(actual_mp3)
            return None
        except Exception as err:
            print(f"❌ Erro ao baixar áudio: {err}")
            return None

def main():
    rows = get_sheet_data()
    if not rows or len(rows) <= 1:
        print("❌ Nenhuma linha encontrada na planilha.")
        return

    headers = [h.lower().strip() for h in rows[0]]
    print(f"📋 Cabeçalhos detectados: {headers}")

    playlist = []
    
    for i, row in enumerate(rows[1:], start=1):
        if not row or not any(row):
            continue

        yt_link = row[0].strip() if len(row) > 0 else ''
        title = row[1].strip() if len(row) > 1 and row[1].strip() else f"Faixa #{i}"
        artist = row[2].strip() if len(row) > 2 and row[2].strip() else "Turma das 8h"
        
        bpm = 138
        if len(row) > 3 and row[3].strip():
            try:
                bpm = int(re.sub(r'\D', '', row[3])) or 138
            except:
                bpm = 138

        status = row[4].strip() if len(row) > 4 else 'OK'
        drive_link = row[5].strip() if len(row) > 5 else ''
        
        # 1. Extrai ou busca o ID do YouTube
        yt_id = extract_youtube_id(yt_link)
        if not yt_id and (title or yt_link):
            search_term = yt_link if not yt_link.startswith('http') and len(yt_link) > 3 else f"{artist} - {title}"
            yt_id = search_youtube_for_id(search_term)

        clean_title = sanitize_filename(title)
        clean_artist = sanitize_filename(artist)
        preferred_filename = f"{clean_artist} - {clean_title}"

        # 2. Verifica se o áudio já existe na pasta audio/
        audio_file = find_existing_audio_file(title, artist)

        # 3. Se não existir, baixa automaticamente
        if not audio_file:
            target = yt_link if yt_link.startswith('http') else (f"https://www.youtube.com/watch?v={yt_id}" if yt_id else f"{artist} - {title}")
            print(f"\n⬇️ [{i}] Baixando para audio/: {title} ({artist})...")
            audio_file = download_audio_from_youtube(target, preferred_filename)
        else:
            print(f"⚡ [{i}] Áudio OK em audio/: {audio_file}")

        # 4. Capa oficial em HD
        cover_url = f"https://img.youtube.com/vi/{yt_id}/hqdefault.jpg" if yt_id else "assets/icon.svg"

        track_data = {
            "id": f"rc8-{i}",
            "title": title,
            "artist": artist,
            "bpm": bpm,
            "genre": "Workout Rock / CrossFit",
            "audioFile": f"audio/{audio_file}" if audio_file else "",
            "url": f"audio/{audio_file}" if audio_file else (yt_link or drive_link),
            "cover": cover_url,
            "youtubeUrl": f"https://www.youtube.com/watch?v={yt_id}" if yt_id else yt_link,
            "youtubeId": yt_id,
            "driveUrl": drive_link,
            "dedication": "Resenha das 8h"
        }
        playlist.append(track_data)

    # 5. Salva no arquivo de metadados data/playlist.json
    json_path = os.path.join(DATA_DIR, "playlist.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "updatedAt": json_path,
            "totalTracks": len(playlist),
            "tracks": playlist
        }, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 60)
    print(f"🎉 SUCESSO! Todas as {len(playlist)} faixas verificadas e sincronizadas:")
    print(f"📄 {json_path}")
    print("=" * 60)

if __name__ == "__main__":
    main()
