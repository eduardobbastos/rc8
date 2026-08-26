#!/usr/bin/env python3
"""
RC8 - Baixador e Sincronizador Automático (Atalho para sincronizar_musicas.py)
"""
import subprocess
import sys
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
sync_script = os.path.join(script_dir, "sincronizar_musicas.py")

if __name__ == "__main__":
    result = subprocess.run([sys.executable, sync_script] + sys.argv[1:])
    sys.exit(result.returncode)
