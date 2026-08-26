#!/usr/bin/env python3
"""
RC8 - Agendador Local Contínuo de Sincronização
Executa a cada 30 minutos, verifica novidades na planilha, baixa áudios e envia ao GitHub.
"""

import os
import sys
import time
import subprocess
from datetime import datetime, timedelta

INTERVAL_MINUTES = 30
INTERVAL_SECONDS = INTERVAL_MINUTES * 60
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SYNC_SCRIPT = os.path.join(BASE_DIR, "scripts", "sincronizar_musicas.py")

def log(msg):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{now}] {msg}")

def run_sync_and_push():
    log("🔄 Verificando planilha do Google Sheets por novas músicas...")
    
    # 1. Executa o script de sincronização
    res = subprocess.run([sys.executable, SYNC_SCRIPT], cwd=BASE_DIR)
    if res.returncode != 0:
        log("⚠️ Erro ao executar sincronizar_musicas.py")
        return

    # 2. Verifica se houve alteração nos arquivos
    status = subprocess.run(["git", "status", "--porcelain", "audio", "data/playlist.json"], cwd=BASE_DIR, capture_output=True, text=True)
    
    if status.stdout.strip():
        log("⚡ Novas alterações detectadas! Comitando e enviando ao GitHub...")
        subprocess.run(["git", "add", "audio/", "data/playlist.json"], cwd=BASE_DIR)
        subprocess.run(["git", "commit", "-m", "auto: sincronizacao automatica da playlist a cada 30min"], cwd=BASE_DIR)
        push_res = subprocess.run(["git", "push", "origin", "main"], cwd=BASE_DIR)
        
        if push_res.returncode == 0:
            log("✅ Alterações enviadas com sucesso ao GitHub!")
        else:
            log("❌ Falha no git push. Verifique a conexão com o GitHub.")
    else:
        log("✨ Nenhuma alteração nova na planilha. Tudo 100% atualizado.")

def main():
    print("=" * 65)
    print("⏰ RC8 - AGENDADOR DE SINCRONIZAÇÃO AUTOMÁTICA (A CADA 30 MIN)")
    print("=" * 65)
    print(f"⏱️ Intervalo configurado: {INTERVAL_MINUTES} minutos")
    print(f"📂 Diretório: {BASE_DIR}")
    print("Pressione Ctrl + C para encerrar o agendador a qualquer momento.\n")

    while True:
        try:
            run_sync_and_push()
            next_run = datetime.now() + timedelta(seconds=INTERVAL_SECONDS)
            print("-" * 65)
            log(f"💤 Aguardando próximo ciclo em {INTERVAL_MINUTES} minutos (às {next_run.strftime('%H:%M:%S')})...\n")
            time.sleep(INTERVAL_SECONDS)
        except KeyboardInterrupt:
            print("\n🛑 Agendador finalizado pelo usuário.")
            sys.exit(0)
        except Exception as e:
            log(f"⚠️ Erro inesperado no ciclo: {e}")
            time.sleep(60)

if __name__ == "__main__":
    main()
