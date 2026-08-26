# 📻 RC8 - Rádio Resenha do Cross (Turma das 8 Horas)
> **Rádio Online Coletiva com Efeitos Visuais Dinâmicos, WOD Timer Integrado e Sincronização em Tempo Real com Google Planilhas & Google Drive.**

---

## ⚡ Como Publicar no GitHub Pages (Passo a Passo)

1. Suba este repositório para o seu GitHub:
   ```bash
   git add .
   git commit -m "feat: lancamento da radio online RC8"
   git push origin main
   ```
2. No seu repositório no GitHub, clique na aba **Settings** (Configurações).
3. No menu lateral esquerdo, clique em **Pages**.
4. Em **Build and deployment** > **Branch**, selecione a branch `main` e a pasta `/ (root)`.
5. Clique em **Save**. Em 1 minuto, seu site estará no ar no link: `https://seu-usuario.github.io/cr8`!

---

## 📊 Como Configurar a Planilha do Google Sheets

A rádio lê as músicas diretamente de uma planilha do Google. Qualquer música que você adicionar na planilha vai aparecer automaticamente no site da rádio para toda a turma!

### 1. Criar a Planilha
Crie uma nova planilha no [Google Sheets](https://sheets.new) com as seguintes colunas na primeira linha (linha 1):

| Titulo | Artista | Link_Drive_ou_Audio | BPM | Genero | Dedicado_Por |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Can't Be Touched | Roy Jones Jr | `https://drive.google.com/file/d/SEU_ID/view` | 140 | Workout Bass | Treino das 8h |
| Till I Collapse | Eminem | `https://drive.google.com/file/d/...` | 170 | Hip Hop Gym | Coach Marcelo |

### 2. Compartilhar a Planilha como Pública
1. No canto superior direito da planilha, clique no botão verde **Compartilhar**.
2. Em **Acesso geral**, mude de "Restrito" para **"Qualquer pessoa com o link"** (como **Leitor**).
3. Copie o link da planilha.

### 3. Como Colocar Músicas do Google Drive
1. Na sua pasta pública do Google Drive: `https://drive.google.com/drive/folders/1gEIOwDGpCtNSwVOehMKo9A1Arz9dMCOf`
2. Clique com o botão direito no arquivo de áudio (`.mp3`, `.m4a`, etc.) > **Compartilhar** > **Copiar link**.
3. Cole esse link na coluna `Link_Drive_ou_Audio` da planilha.
4. O sistema do site converte o link do Drive automaticamente para streaming de áudio direto!

### 4. Conectar a Planilha no Site
1. Abra o site da rádio RC8.
2. Clique no ícone de engrenagem ⚙️ (Configurações) no topo ou na barra inferior.
3. Cole o link da sua planilha e clique em **Salvar e Sincronizar**.

---

## 📱 Como Usar no Celular (Mobile PWA)

- **iPhone (iOS Safari)**: Abra o site, toque no botão de compartilhar (quadrado com seta para cima) e selecione **"Adicionar à Tela de Início"**.
- **Android (Chrome)**: Abra o site, toque nos 3 pontinhos e selecione **"Instalar Aplicativo"** ou **"Adicionar à Tela Inicial"**.

---

## 🛠️ Recursos Incluídos

- 🎵 **Player Contínuo / Modo Rádio Ao Vivo**: Reprodução ininterrupta no celular com tela de bloqueio integrada (MediaSession API).
- 🌊 **Audio Visualizer em Canvas**: Partículas de neon reativas, barras de equalizador e anéis pulsantes com vibração táctil.
- ⏱️ **WOD Timer Integrado**: Modos **Tabata** (20s/10s), **EMOM**, **AMRAP** e Cronômetro com bips sonoros embutidos.
- 💡 **Wake Lock API**: Mantém a tela do celular sempre acesa durante o treino.
- 🔄 **Auto-Sincronização**: Atualização automática a cada 5 minutos das novas músicas adicionadas na planilha.
