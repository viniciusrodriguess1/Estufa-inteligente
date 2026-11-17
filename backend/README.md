# ⚙️ Backend API — Estufa Inteligente & Planta Robótica Biomimética (PIBIC)

API REST e servidor WebSocket desenvolvidos em **FastAPI**, **SQLModel (SQLAlchemy 2.1)** e **Uvicorn**, responsáveis por receber os pacotes de telemetria da **ESP32** e transmiti-los em tempo real para o frontend.

---

## 🗄️ Banco de Dados e Semeadura Automática (`seed.py`)

No startup da aplicação (`on_startup`), o backend executa `seed_db()`:
- Tenta conectar ao banco `DATABASE_URL` (PostgreSQL no Render) com timeout rápido de 5 segundos; caso o banco externo tenha expirado ou não esteja acessível, ativa automaticamente o fallback para **SQLite local (`pibic.db`)**.
- Garante a existência automática das entidades:
  - **Estufa (`ID = 1`)**: `"Estufa Inteligente"`
  - **Microcontrolador (`ID = 1`)**: `"ESP32-Estufa-01"`
  - **Planta Robótica (`ID = 1`)**: `"Mimosa Biomimética v1"`
  - **Sensores de Luminosidade LDR**:
    - **`ID = 1`**: `Sensor LDR Esquerdo` (`Lux`)
    - **`ID = 2`**: `Sensor LDR Direito` (`Lux`)

---

## 🔌 Principais Rotas de Telemetria e Administração

- `GET /api/planta`: Retorna o estado completo da planta robótica (`estado`, `ldr_esquerdo`, `ldr_direito`, `posicao_haste`, `posicao_servo`, `direcao_luz`).
- `POST /api/planta/movimentos`: Recebe o pacote de telemetria da ESP32, atualiza o estado em tempo real e transmite via WebSocket (`/ws`).
- `POST /api/leituras`: Registra leituras individuais dos sensores LDR (`id_sensor = 1` e `id_sensor = 2`).
- `GET /api/admin/tabelas-resumo`: Exibe um resumo completo de todas as tabelas do banco de dados (`usuarios`, `sensores`, `estufas`, `microcontroladores`, `plantas_roboticas`, `leituras_recentes`, `movimentos_recentes`).
- `GET /api/admin/status-banco`: Verifica a contagem de registros e a última leitura/movimento recebido da ESP32.
- `GET /docs`: Interface interativa Swagger UI.

---

## 🚀 Como Executar Localmente

```bash
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
