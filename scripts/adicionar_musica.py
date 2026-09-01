#!/usr/bin/env python3
"""
RC8 - Portaria de Músicas
Dado um link do YouTube, extrai título/artista via oEmbed e insere a linha
na planilha RC8play (aba Lista). O GitHub Actions (a cada 30min) baixa o MP3
e publica a rádio.

Uso:
    python3 adicionar_musica.py "https://youtu.be/XXXX" [BPM]

Exemplos:
    python3 adicionar_musica.py "https://youtu.be/_CL6n0FJZpk"
    python3 adicionar_musica.py "https://www.youtube.com/watch?v=_CL6n0FJZpk" 140
"""
import json
import os
import re
import sys
import urllib.parse
import urllib.request

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

SHEET_ID = "15ajmPTWT7Rz0TIOet-K8RCzHphrnAEYjpOeBWhuvFqY"
SHEET_NAME = "Lista"
HEADERS_FALLBACK = ["Link_YouTube", "Titulo", "Artista", "BPM"]

# ---------------------------------------------------------------------------
# YouTube helpers
# ---------------------------------------------------------------------------

def extract_video_id(url):
    """Extrai o ID de 11 chars de qualquer URL do YouTube."""
    if not url:
        return ""
    m = re.search(r'(?:v=|/embed/|/watch\?v=|/shorts/|youtu\.be/)([a-zA-Z0-9_-]{11})', url)
    return m.group(1) if m else ""


def get_yt_meta(url):
    """Retorna {title, author} via oEmbed (sem baixar áudio)."""
    api = "https://www.youtube.com/oembed?format=json&url=" + urllib.parse.quote(url, safe='')
    req = urllib.request.Request(api, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as r:
        data = json.loads(r.read().decode("utf-8"))
    return {
        "title": data.get("title", "").strip(),
        "author": data.get("author_name", "").strip(),
    }


def split_artist_title(display_title, author):
    """Tenta separar 'Artista - Título' do título do YouTube."""
    # ex.: "Dr. Dre - Still D.R.E. ft. Snoop Dogg"
    m = re.match(r'^(.+?)\s*-\s*(.+)$', display_title)
    if m:
        # usa a parte antes do '-' como artista se parecer razoável
        possible_artist = m.group(1).strip()
        rest = m.group(2).strip()
        # evita dividir quando a parte antes parece parte do título
        if len(possible_artist) > 1 and len(possible_artist) < 60:
            return possible_artist, rest
    return author or "Turma das 8h", display_title


# ---------------------------------------------------------------------------
# Google Sheets
# ---------------------------------------------------------------------------

def get_creds():
    tok = json.load(open(os.path.expanduser("~/.hermes/google_token.json")))
    return Credentials(
        token=tok.get("token"),
        refresh_token=tok.get("refresh_token"),
        client_id=tok.get("client_id"),
        client_secret=tok.get("client_secret"),
        token_uri=tok.get("token_uri", "https://oauth2.googleapis.com/token"),
    )


def read_sheet(svc):
    """Lê todo o conteúdo da aba Lista. Retorna lista de linhas."""
    res = svc.spreadsheets().values().get(
        spreadsheetId=SHEET_ID, range=f"{SHEET_NAME}!A1:D500"
    ).execute()
    return res.get("values", [])


def row_exists(rows, video_id):
    """Checa se o video_id já está na coluna Link_YouTube (deduplicação)."""
    for row in rows[1:]:
        if not row:
            continue
        cell = row[0] if row else ""
        if extract_video_id(cell) == video_id:
            return True
    return False


def append_row(svc, values):
    """Insere uma nova linha no fim da tabela."""
    svc.spreadsheets().values().append(
        spreadsheetId=SHEET_ID,
        range=f"{SHEET_NAME}!A1:D1",
        valueInputOption="USER_ENTERED",
        insertDataOption="INSERT_ROWS",
        body={"values": [values]},
    ).execute()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if len(sys.argv) < 2:
        print("Uso: adicionar_musica.py '<URL do YouTube>' [BPM]")
        sys.exit(1)

    url = sys.argv[1].strip()
    bpm_arg = sys.argv[2].strip() if len(sys.argv) > 2 else ""
    bpm = 138
    if bpm_arg:
        try:
            bpm = int(re.sub(r"\D", "", bpm_arg)) or 138
        except ValueError:
            bpm = 138

    video_id = extract_video_id(url)
    if not video_id:
        print(f"❌ Não consegui extrair o ID do YouTube de: {url}")
        sys.exit(1)

    clean_url = f"https://www.youtube.com/watch?v={video_id}"

    # 1. Extrai metadados via oEmbed
    print(f"🎬 Extraindo metadados de {clean_url} ...")
    try:
        meta = get_yt_meta(clean_url)
    except Exception as e:
        print(f"❌ Falha ao buscar metadados do vídeo ({e}).")
        print(f"   O link '{clean_url}' parece inválido ou bloqueado.")
        print("   Nada foi inserido na planilha. Verifique o link do YouTube.")
        sys.exit(2)

    # Segurança: nunca inserir placeholder. Se o oEmbed não retornou um
    # título utilizável, aborta para não poluir a planilha.
    if not meta.get("title") or not meta.get("author"):
        print("❌ oEmbed não retornou título/artista válidos. Abortando (nada inserido).")
        sys.exit(2)

    artist, title = split_artist_title(meta["title"], meta["author"])
    print(f"   📝 Título: {title}")
    print(f"   🎤 Artista: {artist}")
    print(f"   🎵 BPM: {bpm}")

    # 2. Conecta na planilha
    svc = build("sheets", "v4", credentials=get_creds())
    rows = read_sheet(svc)
    print(f"   📋 Planilha lida: {len(rows)-1} músicas existentes")

    # 3. Deduplicação
    if row_exists(rows, video_id):
        print(f"ℹ️  A música '{title}' já está na planilha. Nada a fazer.")
        sys.exit(0)

    # 4. Insere
    new_row = [clean_url, title, artist, str(bpm)]
    append_row(svc, new_row)
    print(f"✅ Música inserida na planilha RC8play (aba Lista):")
    print(f"   {clean_url} | {title} | {artist} | {bpm} BPM")
    print(f"\n🔄 Próximo passo: o GitHub Actions (a cada 30min) vai baixar o MP3 "
          f"e publicar na rádio.")


if __name__ == "__main__":
    main()
