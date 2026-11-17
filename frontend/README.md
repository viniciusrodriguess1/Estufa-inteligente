# 🖥️ Frontend — Estufa Inteligente & Planta Robótica Biomimética (PIBIC)

Interface web de **Telemetria Científica e Gêmeo Digital 2D** construída em **React 19**, **TypeScript**, **Vite**, **Recharts** e **Tailwind CSS**.

---

## 📊 Módulos da Interface

1. **Planta Robótica (`src/pages/PlantaRobotica.tsx`)**:
   - **Cabeçalho com Status de Batimento Cardíaco (`estado`)**: Exibe `"RASTREANDO LUZ"` (`1`, com indicador verde `animate-pulse`) ou `"EM REPOUSO"` (`0`, cinza estático).
   - **Gêmeo Digital 2D Mecânico**: Representação visual fiel da estrutura física:
     - **Base Marrom Vazada** exibindo o **Motor de Passo (`28BYJ-48`)** no seu interior conectado à rosca sem-fim vertical.
     - **Cilindro Verde Externo** com visão em corte da rosca e do **Retângulo Marrom Interno (Êmbolo)** acoplado a ela.
     - **Suporte em "T" Branco** posicionado acima do cilindro verde, trazendo os **2 Olhos LDR** nas extremidades e o **Girassol Biomimético** apontado para cima no centro.
     - **Servomotor Lateral (`SG90`)** com sua engrenagem pinhão encostada na engrenagem da base do cilindro verde.
     - Movimento vertical sincronizado em tempo real da haste (`Girassol -> Suporte em T -> Retângulo Marrom`) sem inclinação lateral.
   - **Sensores Fotoreceptores LDR (`ldr_esquerdo` e `ldr_direito`)**: Mostradores circulares com cores semânticas dinâmicas (`> 1000` em amarelo/laranja brilhante, `<= 1000` escuro).
   - **Barra Vertical do Motor de Passo (`posicao_haste`)**: Barra graduada de `0%` a `100%` (`0` a `40.960` passos).
   - **Mostrador Circular do Servomotor (`posicao_servo`)**: Medidor angular de `40°` a `140°` (centro `90°`) com ponteiro rotativo via CSS `transform: rotate(...)`.
2. **Dashboard Principal (`src/pages/Dashboard.tsx`)**:
   - Leitura instantânea do **Sensor LDR Esquerdo (`ID = 1`)**, **Sensor LDR Direito (`ID = 2`)**, diferencial fototrópico ($\Delta$ LDR) e gráfico comparativo das últimas 24 horas.
3. **Sensores & Histórico (`src/pages/Sensores.tsx`, `src/pages/Historico.tsx`)**:
   - Monitoramento dedicado exclusivamente aos 2 sensores LDR com filtros temporais (`24h`, `7d`, `30d`).

---

## 🚀 Como Executar

```bash
cd frontend
npm install
npm run dev
```

Para gerar o build de produção:
```bash
npm run build
```
