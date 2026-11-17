# 🌱 Estufa Inteligente & Planta Robótica Biomimética (PIBIC)

Este repositório contém o código completo do ecossistema **Estufa Inteligente & Planta Robótica Biomimética**, desenvolvido como projeto de Iniciação Científica (**PIBIC**). O sistema integra fotorreceptores (**LDR Esquerdo** e **LDR Direito**), uma interface web de **Telemetria Científica em Tempo Real** (React + TypeScript + Tailwind) e uma planta robótica controlada por **ESP32** que realiza **fototropismo/heliotropismo** utilizando motor de passo (`AccelStepper`) e servomotor (`ESP32Servo`).

---

## 📋 Principais Funcionalidades

1. **Painel de Telemetria Científica (`Planta Robótica`)**:
   - **Gêmeo Digital 2D Mecânico**: Representação esquemática interativa da estrutura física do robô (base marrom vazada com motor de passo `28BYJ-48` visível no interior, cilindro verde com rosca vertical, haste retangular marrom interna que sobe e desce conforme `posicao_haste`, suporte em "T" branco sempre acima do cilindro com os 2 sensores LDR nas pontas e o girassol apontado para cima no centro, além do servomotor lateral `SG90` com engrenagem acoplada à engrenagem da base do cilindro).
   - **Status Operacional (Batimento Cardíaco)**: Badge dinâmico indicando `"RASTREANDO LUZ"` (`estado = 1`, com pulso verde animado) ou `"EM REPOUSO"` (`estado = 0`).
   - **Sensores Fotoreceptores LDR (Cores Semânticas)**: Mostradores circulares para `ldr_esquerdo` e `ldr_direito` que brilham em amarelo/laranja quando a luminosidade ultrapassa o limiar (`> 1000`).
   - **Motor de Passo (Barra Vertical)**: Indicador vertical de elevação da haste (`posicao_haste`), mapeando de `0` a `40.960` passos (`0%` a `100%`).
   - **Servomotor (Mostrador Angular)**: Dial circular graduado (`40°` a `140°`) com ponteiro rotativo em tempo real acompanhando `posicao_servo`.
2. **Dashboard & Histórico Analítico**:
   - Monitoramento comparativo entre **Sensor LDR Esquerdo (`ID = 1`)** e **Sensor LDR Direito (`ID = 2`)**, cálculo de diferencial fototrópico ($\Delta$ LDR) e séries temporais (24h, 7d e 30d) com Recharts e WebSockets.
3. **Semeadura Automática do Banco (`seed.py`)**:
   - Ao iniciar, o backend cria e garante automaticamente a Estufa, o Microcontrolador ESP32, a Planta Robótica e os **2 sensores LDR** (`Sensor LDR Esquerdo` e `Sensor LDR Direito`), com fallback automático entre PostgreSQL (Render) e SQLite local (`pibic.db`).

---

## 🚀 Como Executar Localmente com Um Só Comando

O projeto possui um inicializador automatizado na raiz (`run.py`) que sobe o **Backend (FastAPI)**, o **Frontend (Vite/React)** e o **Simulador de Telemetria ESP32** simultaneamente.

### Pré-requisitos
* **Python 3.11+** (com `uv` instalado)
* **Node.js 18+**

### Execução
Na raiz do projeto, execute:
```bash
python run.py
```

---

## 🔑 Credenciais Padrão de Acesso

O banco de dados é inicializado automaticamente com o usuário administrador:
* **E-mail / Matrícula**: `admin@estufa.edu.br` (ou `2026123456`)
* **Senha**: `admin123`

---

## 🛠️ Execução Manual dos Módulos

### 1. Backend (FastAPI + SQLModel)
```bash
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend (React + TypeScript + Vite)
```bash
cd frontend
npm install
npm run dev
```

---

## 📡 Firmware da ESP32 (`hardware/esp32_firmware/esp32_firmware.ino`)

O código da placa física está em `hardware/esp32_firmware/esp32_firmware.ino` e utiliza arquitetura **Dual-Core (FreeRTOS)**:
* **Core 1 (`loop`)**: Executa a leitura acelerada dos LDRs com média móvel exponencial e o controle não-bloqueante do motor de passo (`AccelStepper`) e do servomotor (`ESP32Servo`).
* **Core 0 (`taskTelemetriaHTTP`)**: Gerencia a conexão Wi-Fi e realiza os envios HTTPS (`POST /api/leituras` e `POST /api/planta/movimentos`) para o servidor no Render (`https://estufa-inteligente.onrender.com`) a cada 5 segundos, sem travar o movimento dos motores.

### Pinagem Oficial no Hardware (ESP32):
| Componente | Pino ESP32 | Detalhes |
| :--- | :--- | :--- |
| **LDR Esquerdo** (`ID = 1`) | `GPIO 34` | Entrada Analógica (ADC1) |
| **LDR Direito** (`ID = 2`) | `GPIO 35` | Entrada Analógica (ADC1) |
| **Servomotor (SG90)** | `GPIO 23` | PWM (Faixa: `40°` a `140°`, Centro: `90°`) |
| **Motor de Passo 28BYJ-48 (`IN1`)** | `GPIO 19` | Driver ULN2003 (`HALF4WIRE`) |
| **Motor de Passo 28BYJ-48 (`IN2`)** | `GPIO 18` | Driver ULN2003 (`HALF4WIRE`) |
| **Motor de Passo 28BYJ-48 (`IN3`)** | `GPIO 5` | Driver ULN2003 (`HALF4WIRE`) |
| **Motor de Passo 28BYJ-48 (`IN4`)** | `GPIO 17` | Driver ULN2003 (`HALF4WIRE`) |

### Como Gravar na Placa:
1. Instale as bibliotecas **`AccelStepper`** e **`ESP32Servo`** na Arduino IDE.
2. Abra `hardware/esp32_firmware/esp32_firmware.ino`.
3. Altere as constantes `ssid` e `password` com os dados da sua rede Wi-Fi.
4. Carregue o sketch na ESP32 (os sensores `ID 1` e `ID 2` e a planta `ID 1` já estão pré-cadastrados automaticamente no servidor).
