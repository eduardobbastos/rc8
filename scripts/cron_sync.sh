#!/usr/bin/env bash
# ==============================================================================
# RC8 - Script de Sincronização Automática via Crontab
# Resenha do Cross Turma das 8 Horas
# ==============================================================================

# Diretório base do projeto
PROJECT_DIR="/home/ebastos/cr8"
cd "$PROJECT_DIR" || exit 1

# Garante que os caminhos do Python, Git e FFmpeg estejam disponíveis no ambiente do cron
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$HOME/.local/bin:$PATH"

# Cria pasta de logs
mkdir -p "$PROJECT_DIR/logs"
LOG_FILE="$PROJECT_DIR/logs/cron_sync.log"

echo "============================================================" >> "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🔄 Iniciando sincronização via Crontab..." >> "$LOG_FILE"

# 1. Executa o sincronizador de músicas
python3 scripts/sincronizar_musicas.py >> "$LOG_FILE" 2>&1

# 2. Verifica se houve novas músicas ou alteração nos metadados
STATUS=$(git status --porcelain audio/ data/playlist.json)

if [ -n "$STATUS" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚡ Novas músicas detectadas! Enviando ao GitHub..." >> "$LOG_FILE"
    git add audio/ data/playlist.json >> "$LOG_FILE" 2>&1
    git commit -m "auto: sincronizacao automatica da playlist via cron" >> "$LOG_FILE" 2>&1
    git push origin main >> "$LOG_FILE" 2>&1
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Sincronização e envio concluídos com sucesso!" >> "$LOG_FILE"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✨ Nenhuma música nova. Tudo já está 100% atualizado." >> "$LOG_FILE"
fi

echo "============================================================" >> "$LOG_FILE"
