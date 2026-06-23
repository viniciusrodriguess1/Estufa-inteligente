# 🌱 Estufa Inteligente & Planta Robótica Biomimética

Este repositório contém o código completo do ecossistema de **Estufa Inteligente** desenvolvido para projetos de pesquisa. O sistema integra sensores ambientais e de luminosidade, um painel administrativo completo em React (Vite) e uma planta robótica física controlada por ESP32 que realiza heliotropismo (seguimento solar).

---

## 📋 Funcionalidades
1. **Dashboard em Tempo Real**: Métricas de temperatura, umidade do solo, umidade do ar, luminosidade (LDRs) e gases (CO₂ e O₂) via WebSockets.
2. **Simulador de Planta**: Pré-visualização gráfica 2D esquemática das coordenadas de Pan (horizontal) e Elevação (vertical) do helióstato.
3. **Histórico e Tendências**: Gráficos analíticos estruturados em Recharts (24 horas, 7 dias ou 30 dias).
4. **Gerenciamento IoT**: Cadastro de novas estufas, placas microcontroladoras (ESP32) e sensores individuais.
5. **Alertas Dinâmicos**: Definição dinâmica de limites de tolerância para temperatura, umidade e CO₂ no banco de dados SQLite.

---

## 🚀 Como Iniciar Tudo com Um Só Comando

O projeto possui um inicializador automatizado na raiz ([run.py](file:///C:/Users/vinic/OneDrive/Área de Trabalho/pibic/run.py)). Ele realiza a instalação de dependências do frontend e inicializa o Backend, o Frontend e o Simulador de ESP32 concorrentemente em uma única janela de terminal.

### Pré-requisitos
* **Python 3.10+** (com gerenciador `uv` instalado para carregamento rápido)
* **Node.js** (versão 18 ou superior)

### Execução
Basta abrir um terminal na pasta raiz do projeto e rodar:
```bash
python run.py
```
> [!NOTE]
> Se o seu terminal Windows apresentar restrições de permissões do PowerShell, inicialize usando:
> `powershell -ExecutionPolicy Bypass -Command "python run.py"`

---

## 🔑 Credenciais Administrativas de Testes (Padrão)

O banco de dados é gerado e semeado automaticamente na primeira execução com os seguintes dados de login:
* **Usuário / E-mail**: `admin@estufa.edu.br` (ou matrícula `2026123456`)
* **Senha**: `admin123`

---

## 🛠️ Instalação Manual dos Componentes

Caso prefira rodar cada serviço em um terminal separado:

### 1. Backend (FastAPI + SQLModel)
O backend gerencia o banco de dados SQLite (`pibic.db`) e fornece endpoints HTTP e conexões WebSocket.
```bash
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend (React + TypeScript + Vite)
O dashboard administrativo consome os dados e permite gerenciar o sistema.
```bash
cd frontend
npm install
npm run dev
```

---

## 📡 Integração com a ESP32 Física

O firmware original de testes para a ESP32 está localizado em [esp32_firmware.ino](file:///C:/Users/vinic/OneDrive/Área de Trabalho/pibic/hardware/esp32_firmware/esp32_firmware.ino).

### Pinagem Padrão Recomendada:
* **LDR Esquerdo**: Pino `GPIO 34` (Entrada Analógica)
* **LDR Direito**: Pino `GPIO 35` (Entrada Analógica)
* **Potenciômetro (Velocidade)**: Pino `GPIO 25` (Entrada Analógica)
* **Servo Horizontal (Pan)**: Pino `GPIO 27` (Saída PWM)
* **Servo Vertical (Tilt)**: Pino `GPIO 26` (Saída PWM)

### Como configurar e testar:
1. Abra o arquivo [esp32_firmware.ino](file:///C:/Users/vinic/OneDrive/Área de Trabalho/pibic/hardware/esp32_firmware/esp32_firmware.ino) na Arduino IDE.
2. Configure seu Wi-Fi (`ssid` e `password`) e insira o endereço IP do seu computador no campo `serverIp`.
3. No painel de controle do site, vá em **Configurações > Cadastrar Sensores** e adicione um novo sensor de tipo **Luminosidade** chamado `"LDR Direito"`.
4. Pegue o ID gerado para este sensor no banco de dados e ajuste a variável `ID_LDR_DIR` no código da placa.
5. Grave o código na ESP32. Ela enviará as leituras e a rotação dos motores em tempo real a cada 5 segundos.
