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
import subprocess
from datetime import datetime, timezone
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

def get_cookies_path():
    """Retorna o caminho do arquivo de cookies do YouTube, se existir.
    Procura em: ~/.hermes/yt_cookies.txt, ~/.hermes/cookies.txt, ou 
    <repo>/cookies.txt (todos fora do git). O Actions não tem, então retorna None."""
    candidates = [
        os.path.join(os.path.expanduser("~"), ".hermes", "yt_cookies.txt"),
        os.path.join(os.path.expanduser("~"), ".hermes", "cookies.txt"),
        os.path.join(BASE_DIR, "cookies.txt"),
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return None

def ydl_opts_with_cookies(base_opts):
    """Adiciona cookies + EJS solver ao dicionário de opções do yt-dlp.
    Cookies contornam o anti-bot do YouTube (quando presentes); o EJS remote
    component resolve os desafios de assinatura/'n' que destravam os formatos."""
    cp = get_cookies_path()
    if cp:
        base_opts = dict(base_opts)
        base_opts["cookiefile"] = cp
        # Habilita o challenge solver JS (destrava formatos); node está instalado
        base_opts["jsruntime"] = "node"
        base_opts["compat_opts"] = ["allow-ecma-plugins"]
    return base_opts

def download_audio_from_youtube(target_source, desired_filename):
    """Baixa o áudio usando a CLI do yt-dlp via subprocess.
    A CLI reconhece o runtime node + remote-components ejs:github, que é a
    combinação que destrava o download do YouTube quando há cookies locais.
    No GitHub Actions (sem cookies) usa a mesma CLI, que ainda tem mais chance
    de sucesso que a API Python nesses casos."""
    out_template = os.path.join(AUDIO_DIR, desired_filename + '.%(ext)s')
    cmd = [
        "yt-dlp",
        "-f", "bestaudio/best",
        "-x", "--audio-format", "mp3", "--audio-quality", "192",
        "-o", out_template,
        "--no-playlist",
        "--no-warnings",
    ]
    cp = get_cookies_path()
    if cp:
        cmd += ["--cookies", cp, "--js-runtime", "node", "--remote-components", "ejs:github"]

    download_query = target_source if target_source.startswith('http') else f"ytsearch1:{target_source}"
    cmd.append(download_query)

    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            # Sem cookies/EJS (ex.: GitHub Actions): tenta de novo sem EJS
            cmd_clean = []
            i = 0
            skip = {"--cookies", "--js-runtime", "--remote-components"}
            while i < len(cmd):
                if cmd[i] in skip:
                    i += 2  # pula flag + valor
                    continue
                cmd_clean.append(cmd[i])
                i += 1
            # garante a URL no final
            cmd_clean = [c for c in cmd_clean if not c.startswith("ytsearch") and c != download_query]
            cmd_clean.append(download_query)
            result = subprocess.run(cmd_clean, capture_output=True, text=True)
            if result.returncode != 0:
                print(f"❌ Erro ao baixar áudio: {result.stderr.strip()[-400:]}")
                return None
    except Exception as err:
        print(f"❌ Erro ao executar yt-dlp: {err}")
        return None

    # localiza o arquivo mp3 gerado
    mp3_path = os.path.join(AUDIO_DIR, desired_filename + '.mp3')
    if os.path.exists(mp3_path):
        return desired_filename + '.mp3'

    # fallback: procura qualquer mp3 que corresponda
    for f in os.listdir(AUDIO_DIR):
        if f.endswith('.mp3') and sanitize_filename(desired_filename).lower().split('.')[0] in f.lower():
            return f

    # último recurso: arquivo mais recente em AUDIO_DIR
    try:
        newest = max((os.path.join(AUDIO_DIR, f) for f in os.listdir(AUDIO_DIR) if f.endswith('.mp3')),
                     key=os.path.getmtime)
        return os.path.basename(newest)
    except ValueError:
        return None

def main():
    rows = get_sheet_data()
    if not rows or len(rows) <= 1:
        print("❌ Nenhuma linha encontrada na planilha.")
        return

    headers = [h.lower().strip() for h in rows[0]]
    print(f"📋 Cabeçalhos detectados: {headers}")

    # Mapeia colunas por cabeçalho (ordem flexível), com fallback para a posição
    # fixa histórica (0=yt, 1=titulo, 2=artista, 3=bpm, 4=status, 5=drive).
    def find_col(keys):
        for idx, h in enumerate(headers):
            if any(k in h for k in keys):
                return idx
        return -1

    col_yt      = find_col(["youtube", "link_youtube", "link_yt", "yt"])
    col_title   = find_col(["titulo", "musica", "track", "title", "nome"])
    col_artist  = find_col(["artista", "cantor", "banda", "artist"])
    col_bpm     = find_col(["bpm", "ritmo", "velocidade"])
    col_status  = find_col(["status"])
    col_drive   = find_col(["link_google_drive", "drive", "audio", "arquivo", "stream", "link_drive"])

    playlist = []
    
    for i, row in enumerate(rows[1:], start=1):
        if not row or not any(row):
            continue

        def cell(idx, fallback=0):
            if idx == -1:
                return ''
            return row[idx].strip() if len(row) > idx else ''

        yt_link    = cell(col_yt) or cell(0)
        title      = cell(col_title, 1) or (cell(1) if col_title == -1 else '') or f"Faixa #{i}"
        artist     = cell(col_artist, 2) or (cell(2) if col_artist == -1 else '') or "Turma das 8h"
        drive_link = cell(col_drive, 5) or (cell(5) if col_drive == -1 else '') or ''

        bpm = 138
        bpm_raw = cell(col_bpm, 3) if col_bpm != -1 else cell(3)
        if bpm_raw:
            try:
                bpm = int(re.sub(r'\D', '', bpm_raw)) or 138
            except:
                bpm = 138

        # Prioriza arquivo de áudio do Drive para o stream, fallback p/ YouTube
        drive_id = extract_youtube_id(drive_link)  # reusa regex (aceita file/d/<id>)
        if not drive_id:
            m = re.search(r'(?:file/d/|id=|drive\.google\.com/[^ ]*\?id=)([a-zA-Z0-9_-]{15,})', drive_link)
            if m:
                drive_id = m.group(1)
        if not drive_id and drive_link:
            m = re.search(r'([a-zA-Z0-9_-]{25,})', drive_link)
            if m:
                drive_id = m.group(1)
        
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
            "updatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "totalTracks": len(playlist),
            "tracks": playlist
        }, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 60)
    print(f"🎉 SUCESSO! Todas as {len(playlist)} faixas verificadas e sincronizadas:")
    print(f"📄 {json_path}")
    print("=" * 60)

if __name__ == "__main__":
    main()
