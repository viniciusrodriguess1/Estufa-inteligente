import React, { useState, useEffect, useCallback } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Activity,
  Sun,
  Compass,
  ArrowUpDown,
  RefreshCw,
  History,
  Cpu,
  Gauge,
  Radio,
  Layers,
} from "lucide-react";
import { API_BASE_URL } from "../api";

interface PlantaRoboticaProps {
  planta?: any;
  movimentos?: any[];
  onRefresh?: () => void;
}

const MAX_PASSOS_MOTOR = 40960;
const LIMITE_LUZ_LDR = 1000;
const SERVO_MIN_ANGULO = 40;
const SERVO_MAX_ANGULO = 140;

export const PlantaRobotica: React.FC<PlantaRoboticaProps> = ({
  planta: plantaProp,
  movimentos: movimentosProp,
  onRefresh,
}) => {
  const [plantaData, setPlantaData] = useState<any>(plantaProp || null);
  const [movimentosData, setMovimentosData] = useState<any[]>(
    movimentosProp || []
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<string>(() =>
    new Date().toLocaleTimeString("pt-BR")
  );

  // Sincroniza quando as props vindas do App.tsx (WebSocket / carga inicial) mudam
  useEffect(() => {
    if (plantaProp) {
      setPlantaData(plantaProp);
      setLastSync(new Date().toLocaleTimeString("pt-BR"));
    }
  }, [plantaProp]);

  useEffect(() => {
    if (movimentosProp) {
      setMovimentosData(movimentosProp);
    }
  }, [movimentosProp]);

  // Lógica de requisição da API para garantir telemetria atualizada
  const fetchTelemetria = useCallback(async () => {
    try {
      const [resPlanta, resMovimentos] = await Promise.all([
        fetch(`${API_BASE_URL}/api/planta`),
        fetch(`${API_BASE_URL}/api/planta/movimentos`),
      ]);

      if (resPlanta.ok) {
        const dataPlanta = await resPlanta.json();
        setPlantaData(dataPlanta);
      }

      if (resMovimentos.ok) {
        const dataMov = await resMovimentos.json();
        setMovimentosData(dataMov);
      }

      setLastSync(new Date().toLocaleTimeString("pt-BR"));
    } catch (err) {
      console.error("Erro ao sincronizar telemetria da Planta Robótica:", err);
    }
  }, []);

  useEffect(() => {
    fetchTelemetria();
    const interval = setInterval(fetchTelemetria, 5000);
    return () => clearInterval(interval);
  }, [fetchTelemetria]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    await fetchTelemetria();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // ============================================================================
  // EXTRAÇÃO E NORMALIZAÇÃO DAS VARIÁVEIS DE TELEMETRIA CIENTÍFICA
  // ============================================================================

  const leiturasLdrObj = plantaData?.leitura_ldrs || {};
  const valoresLdrArray = Object.values(leiturasLdrObj).map((v) => Number(v));

  // 2. Sensores LDR (ldr_esquerdo e ldr_direito)
  const ldr_esquerdo: number = Number(
    plantaData?.ldr_esquerdo ??
      leiturasLdrObj?.ldr_esquerdo ??
      leiturasLdrObj?.["Sensor LDR Esquerdo"] ??
      leiturasLdrObj?.["LDR Esquerdo"] ??
      valoresLdrArray[0] ??
      0
  );

  const ldr_direito: number = Number(
    plantaData?.ldr_direito ??
      leiturasLdrObj?.ldr_direito ??
      leiturasLdrObj?.["Sensor LDR Direito"] ??
      leiturasLdrObj?.["LDR Direito"] ??
      valoresLdrArray[1] ??
      valoresLdrArray[0] ??
      0
  );

  // 1. Status (Batimento Cardíaco): variável `estado` (1 = RASTREANDO LUZ, 0 = EM REPOUSO)
  const estado: number =
    plantaData?.estado !== undefined && plantaData?.estado !== null
      ? Number(plantaData.estado)
      : ldr_esquerdo > LIMITE_LUZ_LDR ||
        ldr_direito > LIMITE_LUZ_LDR ||
        plantaData?.status === "Ativa"
      ? 1
      : 0;

  // 3. Motor de Passo (Barra Vertical e Altura do Modelo 2D): `posicao_haste` (0 a 40960 passos)
  const posicao_haste: number = Number(
    plantaData?.posicao_haste ?? plantaData?.angulo_vertical ?? 0
  );
  const percentualAltura: number = Math.min(
    100,
    Math.max(0, (posicao_haste / MAX_PASSOS_MOTOR) * 100)
  );
  // Altura dinâmica do retângulo marrom: 126px (0%, ficando 6px acima do cilindro de 120px) até 216px (100%)
  const alturaEmboloPx: number = Math.round(126 + percentualAltura * 0.9);

  // 4. Servomotor (Medidor de Ângulo e Rotação do Modelo 2D): `posicao_servo` (40° a 140°)
  const posicao_servo: number = Number(
    plantaData?.posicao_servo ?? plantaData?.angulo_horizontal ?? 90
  );
  const anguloServoClamped = Math.min(
    SERVO_MAX_ANGULO,
    Math.max(SERVO_MIN_ANGULO, posicao_servo)
  );
  // Mapeia 40°..140° (centro 90°) para rotação do ponteiro (-50° a +50°)
  const rotacaoPonteiro = anguloServoClamped - 90;
  // Inclinação visual e deslocamento de dentes das engrenagens engatadas
  const rotacaoModelo2D = (anguloServoClamped - 90) * 0.4;
  const deslocamentoDentesCoroa = (anguloServoClamped - 90) * 0.65;
  const deslocamentoDentesPinhao = -deslocamentoDentesCoroa;

  // Preparação de dados históricos para o gráfico científico
  const graphData = [...movimentosData]
    .reverse()
    .map((m) => ({
      time: new Date(m.data_hora).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      "Servo (graus)": m.angulo_horizontal,
      "Haste (passos)": m.angulo_vertical,
    }));

  const isLdrEsqAtivo = ldr_esquerdo > LIMITE_LUZ_LDR;
  const isLdrDirAtivo = ldr_direito > LIMITE_LUZ_LDR;

  return (
    <div className="telemetry-wrapper min-h-screen bg-slate-950 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
      {/* =====================================================================
          CABEÇALHO DE TELEMETRIA CIENTÍFICA + BADGE DE BATIMENTO CARDÍACO
      ===================================================================== */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-start sm:items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Cpu size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-400">
              <Radio size={14} />
              <span>Telemetria Científica IoT &bull; PIBIC</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
              {plantaData?.nome || "Planta Robótica Biomimética"}
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1">
              ESP32 Heliotropismo Ativo &bull; Última sincronização: {lastSync}
            </p>
          </div>
        </div>

        {/* 1. STATUS (BATIMENTO CARDÍACO) */}
        <div className="flex items-center gap-3 self-start md:self-center">
          <div
            className={`inline-flex items-center gap-3 px-4 py-2.5 rounded-full border font-mono text-xs font-bold tracking-wider shadow-inner transition-all ${
              estado === 1
                ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
                : "bg-slate-800/90 border-slate-700 text-slate-300"
            }`}
          >
            <span className="relative flex h-3 w-3">
              {estado === 1 ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 animate-pulse"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-400"></span>
              )}
            </span>
            <span>{estado === 1 ? "RASTREANDO LUZ" : "EM REPOUSO"}</span>
          </div>

          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
            title="Sincronizar Telemetria Agora"
          >
            <RefreshCw
              size={18}
              className={isRefreshing ? "animate-spin text-emerald-400" : ""}
            />
          </button>
        </div>
      </header>

      {/* =====================================================================
          SEÇÃO PRINCIPAL: MODELO 2D EM DESTAQUE + INDICADORES DE TELEMETRIA
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* -------------------------------------------------------------------
            GÊMEO DIGITAL 2D DA ESTRUTURA MECÂNICA REAL (5 COLUNAS EM DESTAQUE)
        ------------------------------------------------------------------- */}
        <section className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <Layers size={20} className="text-emerald-400" />
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  Gêmeo Digital 2D Mecânico
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Girassol + Suporte T + Cilindro/Êmbolo + Engrenagens
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
              2D LIVE
            </span>
          </div>

          {/* Palco do Modelo 2D */}
          <div className="robot-stage relative w-full rounded-xl border border-slate-800 overflow-hidden flex flex-col items-center justify-end select-none">
            {/* HUD de Telemetria no Canto Superior do Modelo 2D */}
            <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-2 font-mono text-[11px] space-y-1 z-20">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">ELEVAÇÃO HASTE:</span>
                <strong className="text-emerald-400">
                  {percentualAltura.toFixed(1)}% ({posicao_haste} p)
                </strong>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">ENGRENAGEM SERVO:</span>
                <strong className="text-cyan-400">{posicao_servo}°</strong>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">LDRs (E | D):</span>
                <strong className="text-yellow-400">
                  {ldr_esquerdo} | {ldr_direito}
                </strong>
              </div>
            </div>

            {/* Linha Guia de Centro */}
            <div className="guide-line-vertical" />

            {/* ===============================================================
                ESTRUTURA MECÂNICA COMPLETA (CONJUNTO SUPERIOR + BASE VAZADA)
            =============================================================== */}
            <div className="mechanical-assembly">
              {/* -------------------------------------------------------------
                  CONJUNTO ROTATIVO ACIONADO PELA ENGRENAGEM DO SERVO
                  (Cilindro Verde + Retângulo Marrom Interno + Suporte T Branco c/ Girassol)
              ------------------------------------------------------------- */}
              <div
                className="rotating-column-group"
                style={{
                  transform: `rotate(${rotacaoModelo2D}deg)`,
                  transformOrigin: "bottom center",
                }}
              >
                {/* Curso de Elevação do Retângulo Marrom + Suporte em T Branco (sempre acima do cilindro) */}
                <div className="elevation-track">
                  {/* SUPORTE EM "T" BRANCO COM GIRASSOL NO CENTRO E LDRs NAS PONTAS */}
                  <div className="t-support-white">
                    <div className="t-horizontal-bar">
                      {/* Olho Esquerdo (ldr_esquerdo) */}
                      <div className="ldr-eye-box">
                        <div
                          className={`ldr-eye-lens ${
                            isLdrEsqAtivo
                              ? "bg-yellow-500 shadow-glow-yellow border-orange-300"
                              : "bg-gray-700 border-slate-600"
                          }`}
                          title={`LDR Esquerdo: ${ldr_esquerdo}`}
                        >
                          <span className="ldr-pupil-dot" />
                        </div>
                        <span className="ldr-side-label">LDR ESQ</span>
                      </div>

                      {/* GIRASSOL NO MEIO DO SUPORTE EM T */}
                      <div
                        className="sunflower-wrapper"
                        title="Girassol Biomimético no centro do Suporte em T"
                      >
                        <svg
                          viewBox="0 0 64 64"
                          width="46"
                          height="46"
                          className="sunflower-svg"
                        >
                          {/* Pétalas amarelas/douradas ao redor da corola */}
                          <g fill="#facc15" stroke="#eab308" strokeWidth="1.2">
                            <ellipse cx="32" cy="8" rx="4.5" ry="9" />
                            <ellipse cx="32" cy="56" rx="4.5" ry="9" />
                            <ellipse cx="8" cy="32" rx="9" ry="4.5" />
                            <ellipse cx="56" cy="32" rx="9" ry="4.5" />
                            <ellipse
                              cx="32"
                              cy="8"
                              rx="4.5"
                              ry="9"
                              transform="rotate(30 32 32)"
                            />
                            <ellipse
                              cx="32"
                              cy="8"
                              rx="4.5"
                              ry="9"
                              transform="rotate(60 32 32)"
                            />
                            <ellipse
                              cx="32"
                              cy="8"
                              rx="4.5"
                              ry="9"
                              transform="rotate(120 32 32)"
                            />
                            <ellipse
                              cx="32"
                              cy="8"
                              rx="4.5"
                              ry="9"
                              transform="rotate(150 32 32)"
                            />
                            <ellipse
                              cx="32"
                              cy="8"
                              rx="4.5"
                              ry="9"
                              transform="rotate(210 32 32)"
                            />
                            <ellipse
                              cx="32"
                              cy="8"
                              rx="4.5"
                              ry="9"
                              transform="rotate(240 32 32)"
                            />
                            <ellipse
                              cx="32"
                              cy="8"
                              rx="4.5"
                              ry="9"
                              transform="rotate(300 32 32)"
                            />
                            <ellipse
                              cx="32"
                              cy="8"
                              rx="4.5"
                              ry="9"
                              transform="rotate(330 32 32)"
                            />
                          </g>
                          {/* Miolo marrom escuro do girassol com sementes */}
                          <circle
                            cx="32"
                            cy="32"
                            r="14"
                            fill="#451a03"
                            stroke="#78350f"
                            strokeWidth="2.5"
                          />
                          <circle cx="28" cy="28" r="1.4" fill="#d97706" />
                          <circle cx="36" cy="28" r="1.4" fill="#d97706" />
                          <circle cx="32" cy="32" r="1.4" fill="#fbbf24" />
                          <circle cx="27" cy="35" r="1.4" fill="#d97706" />
                          <circle cx="37" cy="35" r="1.4" fill="#d97706" />
                          <circle cx="32" cy="25" r="1.2" fill="#fbbf24" />
                          <circle cx="32" cy="38" r="1.2" fill="#fbbf24" />
                        </svg>
                      </div>

                      {/* Olho Direito (ldr_direito) */}
                      <div className="ldr-eye-box">
                        <div
                          className={`ldr-eye-lens ${
                            isLdrDirAtivo
                              ? "bg-yellow-500 shadow-glow-yellow border-orange-300"
                              : "bg-gray-700 border-slate-600"
                          }`}
                          title={`LDR Direito: ${ldr_direito}`}
                        >
                          <span className="ldr-pupil-dot" />
                        </div>
                        <span className="ldr-side-label">LDR DIR</span>
                      </div>
                    </div>
                    {/* Haste Vertical do T Branco colada no topo do Retângulo Marrom */}
                    <div className="t-vertical-stem" />
                  </div>

                  {/* RETÂNGULO MARROM INTERNO (Mínimo de 126px para ficar sempre acima do cilindro verde de 120px) */}
                  <div
                    className="inner-brown-plunger"
                    style={{
                      height: `${alturaEmboloPx}px`,
                    }}
                  >
                    <span className="plunger-label">HASTE MARROM</span>
                  </div>
                </div>

                {/* CILINDRO VERDE EXTERNO (120px de altura, deixando o Suporte em T sempre acima dele) */}
                <div className="outer-green-cylinder">
                  {/* Rosca Sem-Fim Vertical atravessando o cilindro desde o Motor de Passo */}
                  <div className="vertical-leadscrew" />
                  <span className="cylinder-vertical-tag">CILINDRO VERDE</span>
                </div>

                {/* ENGRENAGEM DA BASE DO CILINDRO VERDE (COROA) */}
                <div className="cylinder-base-gear">
                  <div
                    className="gear-teeth-strip"
                    style={{
                      backgroundPositionX: `${deslocamentoDentesCoroa}px`,
                    }}
                  />
                  <span className="gear-caption">ENGRENAGEM CILINDRO</span>
                </div>
              </div>

              {/* -------------------------------------------------------------
                  CONJUNTO INFERIOR FIXO:
                  BASE MARROM VAZADA (COM STEPPER DENTRO) + SERVO COLADO NA ENGRENAGEM
              ------------------------------------------------------------- */}
              <div className="lower-fixed-chassis">
                {/* SERVOMOTOR LATERAL E SUA ENGRENAGEM ENCOSTANDO NA ENGRENAGEM DO CILINDRO */}
                <div className="side-servo-assembly">
                  {/* Engrenagem do Servomotor (Pinhão) encostada na Engrenagem do Cilindro */}
                  <div className="servo-pinion-gear">
                    <div
                      className="gear-teeth-strip pinion-teeth"
                      style={{
                        backgroundPositionX: `${deslocamentoDentesPinhao}px`,
                      }}
                    />
                    <span className="pinion-caption">ENGR. SERVO</span>
                  </div>
                  {/* Eixo do Servo */}
                  <div className="servo-shaft-neck" />
                  {/* Corpo do Servomotor SG90 Lateral encostado na estrutura */}
                  <div className="servo-motor-body">
                    <span className="servo-body-title">SERVO SG90</span>
                    <span className="servo-body-angle">{posicao_servo}°</span>
                  </div>
                  {/* Suporte lateral marrom fixando o servo na base */}
                  <div className="servo-support-bracket" />
                </div>

                {/* A BASE MARROM VAZADA (MOSTRANDO O MOTOR DE PASSO LÁ DENTRO) */}
                <div className="hollow-brown-base">
                  {/* Moldura Vazada mostrando o fundo e o Motor de Passo */}
                  <div className="hollow-base-window">
                    {/* Eixo saindo do Motor de Passo para a Rosca Vertical */}
                    <div className="stepper-coupler-shaft" />

                    {/* Motor de Passo 28BYJ-48 visível dentro da Base Vazada */}
                    <div className="stepper-motor-unit">
                      <div className="stepper-ears" />
                      <span className="stepper-title">MOTOR DE PASSO</span>
                      <span className="stepper-sub">
                        28BYJ-48 ({posicao_haste} p)
                      </span>
                    </div>
                  </div>
                  <span className="base-frame-label">BASE MARROM VAZADA</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>
              Haste Marrom:{" "}
              <strong className="text-emerald-400">
                {percentualAltura.toFixed(1)}%
              </strong>
            </span>
            <span>
              Engrenagens (Servo &harr; Cilindro):{" "}
              <strong className="text-cyan-400">{posicao_servo}°</strong>
            </span>
          </div>
        </section>

        {/* -------------------------------------------------------------------
            COLUNA DIREITA: OS 3 INDICADORES INSTRUMENTAIS (7 COLUNAS)
        ------------------------------------------------------------------- */}
        <div className="lg:col-span-7 flex flex-col gap-6 justify-between">
          {/* 2. SENSORES LDR (CORES SEMÂNTICAS) */}
          <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
              <div className="flex items-center gap-2.5">
                <Sun size={20} className="text-yellow-400" />
                <div>
                  <h2 className="text-base font-bold text-white uppercase tracking-wider">
                    Sensores Fotoreceptores (LDR)
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Limiar de Excitação Luminosa: &gt; {LIMITE_LUZ_LDR} ADC/Lux
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                ADC 12-bit
              </span>
            </div>

            <div className="grid grid-cols-2 gap-6 place-items-center">
              {/* LDR ESQUERDO */}
              <div className="flex flex-col items-center gap-2.5">
                <div
                  className={`w-36 h-36 rounded-full flex flex-col items-center justify-center border-4 transition-all duration-500 ${
                    isLdrEsqAtivo
                      ? "bg-yellow-500 text-slate-950 border-orange-300 shadow-glow-yellow"
                      : "bg-gray-700 text-slate-200 border-slate-600 shadow-inner"
                  }`}
                >
                  <Sun
                    size={22}
                    className={
                      isLdrEsqAtivo
                        ? "text-slate-950 mb-1"
                        : "text-slate-400 mb-1"
                    }
                  />
                  <span className="text-3xl font-extrabold font-mono tracking-tight">
                    {ldr_esquerdo}
                  </span>
                  <span
                    className={`text-[10px] font-mono uppercase tracking-widest font-bold mt-0.5 ${
                      isLdrEsqAtivo ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    {isLdrEsqAtivo ? "LUZ ALTA" : "BAIXA LUZ"}
                  </span>
                </div>
                <div className="text-center">
                  <span className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    LDR Esquerdo
                  </span>
                  <code className="text-[11px] text-slate-400 font-mono">
                    ldr_esquerdo
                  </code>
                </div>
              </div>

              {/* LDR DIREITO */}
              <div className="flex flex-col items-center gap-2.5">
                <div
                  className={`w-36 h-36 rounded-full flex flex-col items-center justify-center border-4 transition-all duration-500 ${
                    isLdrDirAtivo
                      ? "bg-yellow-500 text-slate-950 border-orange-300 shadow-glow-yellow"
                      : "bg-gray-700 text-slate-200 border-slate-600 shadow-inner"
                  }`}
                >
                  <Sun
                    size={22}
                    className={
                      isLdrDirAtivo
                        ? "text-slate-950 mb-1"
                        : "text-slate-400 mb-1"
                    }
                  />
                  <span className="text-3xl font-extrabold font-mono tracking-tight">
                    {ldr_direito}
                  </span>
                  <span
                    className={`text-[10px] font-mono uppercase tracking-widest font-bold mt-0.5 ${
                      isLdrDirAtivo ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    {isLdrDirAtivo ? "LUZ ALTA" : "BAIXA LUZ"}
                  </span>
                </div>
                <div className="text-center">
                  <span className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    LDR Direito
                  </span>
                  <code className="text-[11px] text-slate-400 font-mono">
                    ldr_direito
                  </code>
                </div>
              </div>
            </div>
          </section>

          {/* SUB-GRID INFERIOR DIREITO: MOTOR DE PASSO + SERVOMOTOR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 3. MOTOR DE PASSO (BARRA VERTICAL) */}
            <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <ArrowUpDown size={20} className="text-cyan-400" />
                  <div>
                    <h2 className="text-base font-bold text-white uppercase tracking-wider">
                      Motor de Passo
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">
                      Barra Vertical (28BYJ-48)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-5 my-auto py-2">
                <div className="h-48 flex flex-col justify-between text-[11px] font-mono text-slate-400 text-right select-none">
                  <span>100%</span>
                  <span>75%</span>
                  <span>50%</span>
                  <span>25%</span>
                  <span>0%</span>
                </div>

                {/* Barra de Progresso Vertical */}
                <div className="relative h-48 w-14 bg-gray-800 rounded-2xl border-2 border-slate-700 p-1.5 flex flex-col justify-end overflow-hidden shadow-inner">
                  <div
                    className="w-full rounded-xl bg-gradient-to-t from-cyan-600 via-cyan-400 to-emerald-400 transition-all duration-700 ease-out shadow-glow-cyan"
                    style={{ height: `${percentualAltura}%` }}
                  />
                </div>

                <div className="flex flex-col justify-center">
                  <span className="text-xs font-mono uppercase text-slate-400">
                    Altura Haste
                  </span>
                  <span className="text-3xl font-extrabold font-mono text-cyan-400 tracking-tight mt-0.5">
                    {percentualAltura.toFixed(1)}%
                  </span>
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <span className="block text-[11px] font-mono text-slate-400">
                      posicao_haste
                    </span>
                    <span className="text-sm font-mono font-bold text-white">
                      {posicao_haste.toLocaleString("pt-BR")}{" "}
                      <span className="text-slate-400 font-normal">passos</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Teto (100%):</span>
                <strong className="text-slate-200">
                  {MAX_PASSOS_MOTOR.toLocaleString("pt-BR")} passos
                </strong>
              </div>
            </section>

            {/* 4. SERVOMOTOR (MEDIDOR DE ÂNGULO 40° A 140°) */}
            <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Compass size={20} className="text-emerald-400" />
                  <div>
                    <h2 className="text-base font-bold text-white uppercase tracking-wider">
                      Servomotor (Pan)
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">
                      Faixa: {SERVO_MIN_ANGULO}° a {SERVO_MAX_ANGULO}°
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                  SG90
                </span>
              </div>

              <div className="flex flex-col items-center justify-center my-auto py-1">
                <div className="relative w-48 h-48 rounded-full bg-slate-950 border-4 border-slate-700 shadow-inner flex items-center justify-center">
                  <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[11px] font-mono font-bold text-emerald-400">
                    90°
                  </span>
                  <span className="absolute top-9 left-4 text-[10px] font-mono font-semibold text-slate-400">
                    40°
                  </span>
                  <span className="absolute top-9 right-3 text-[10px] font-mono font-semibold text-slate-400">
                    140°
                  </span>

                  <div className="w-36 h-36 rounded-full border border-dashed border-slate-700 flex items-center justify-center relative">
                    {/* Ponteiro usando CSS transform: rotate() */}
                    <div
                      className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out"
                      style={{ transform: `rotate(${rotacaoPonteiro}deg)` }}
                    >
                      <div className="w-1 h-16 bg-gradient-to-t from-transparent via-emerald-400 to-emerald-300 rounded-full -translate-y-6 shadow-glow-emerald relative">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-300 -top-1 -left-[3px] absolute" />
                      </div>
                    </div>

                    <div className="z-10 w-24 h-24 rounded-full bg-slate-900 border-2 border-slate-700 flex flex-col items-center justify-center shadow-md">
                      <Gauge size={14} className="text-emerald-400 mb-0.5" />
                      <span className="text-2xl font-extrabold font-mono text-white leading-none">
                        {posicao_servo}°
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 mt-1">
                        posicao_servo
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Limites: 40° | 140°</span>
                <strong className="text-emerald-400">
                  Desvio:{" "}
                  {rotacaoPonteiro > 0
                    ? `+${rotacaoPonteiro}`
                    : rotacaoPonteiro}
                  °
                </strong>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* =====================================================================
          SEÇÃO INFERIOR: SÉRIE TEMPORAL E LOG DE EVENTOS DE TELEMETRIA
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico de Série Temporal */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3 mb-4">
            <Activity size={20} className="text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Curva de Resposta Fototrópica
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Histórico cinemático do servomotor e motor de passo
              </p>
            </div>
          </div>

          <div className="h-60 w-full">
            {graphData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={graphData}
                  margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#1e293b"
                  />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#f8fafc",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line
                    type="monotone"
                    dataKey="Servo (graus)"
                    stroke="#34d399"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Haste (passos)"
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">
                Aguardando pacotes de telemetria cinemática...
              </div>
            )}
          </div>
        </div>

        {/* Tabela de Logs de Telemetria */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3 mb-4">
            <History size={20} className="text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Registro de Eventos Cinéticos
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Últimas atuações registradas no banco
              </p>
            </div>
          </div>

          <div className="overflow-y-auto max-h-60 border border-slate-800 rounded-lg">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Servo</th>
                  <th className="py-2.5 px-3">Haste</th>
                  <th className="py-2.5 px-3">Vetor Luz</th>
                </tr>
              </thead>
              <tbody>
                {movimentosData.slice(0, 8).map((m, idx) => (
                  <tr
                    key={m.id_movimento ?? idx}
                    className="border-b border-slate-800/70 hover:bg-slate-800/40"
                  >
                    <td className="py-2 px-3 text-slate-300">
                      {new Date(m.data_hora).toLocaleTimeString("pt-BR")}
                    </td>
                    <td className="py-2 px-3 text-emerald-400 font-bold">
                      {m.angulo_horizontal}°
                    </td>
                    <td className="py-2 px-3 text-cyan-400 font-bold">
                      {m.angulo_vertical}
                    </td>
                    <td className="py-2 px-3 text-amber-300">
                      {m.direcao_luz || "Nenhuma"}
                    </td>
                  </tr>
                ))}
                {movimentosData.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-slate-500 font-mono"
                    >
                      Nenhum evento registrado até o momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =====================================================================
          ESTILOS DO MODELO 2D MECÂNICO E UTILITÁRIOS TAILWIND SCOPED
      ===================================================================== */}
      <style>{`
        .telemetry-wrapper {
          background-color: #020617;
          color: #f1f5f9;
          padding: 1.5rem;
          border-radius: 1rem;
          border: 1px solid #1e293b;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.65);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Palco do Modelo 2D */
        .robot-stage {
          height: 510px;
          background-color: #060b16;
          background-image:
            linear-gradient(to right, rgba(56, 189, 248, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.05) 1px, transparent 1px);
          background-size: 28px 28px;
          box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.75);
          padding-bottom: 12px;
        }

        .guide-line-vertical {
          position: absolute;
          top: 14px;
          bottom: 14px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 1px dashed rgba(56, 189, 248, 0.2);
          pointer-events: none;
        }

        .mechanical-assembly {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          position: relative;
          width: 100%;
          height: 430px;
        }

        /* =====================================================================
           CONJUNTO ROTATIVO SUPERIOR (Gira em torno da base do cilindro verde)
        ===================================================================== */
        .rotating-column-group {
          position: relative;
          width: 220px;
          height: 330px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
          z-index: 10;
        }

        /* Trilha de elevação: parte de bottom: 22px (base do cilindro verde de 120px)
           Como o retângulo marrom tem no mínimo 126px de altura, o Suporte em T fica
           SEMPRE acima do topo do cilindro verde (nunca dentro dele!) */
        .elevation-track {
          position: absolute;
          bottom: 22px;
          width: 190px;
          height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          z-index: 12;
          pointer-events: none;
        }

        /* SUPORTE EM "T" BRANCO (Colado no topo do retângulo marrom, acima do cilindro) */
        .t-support-white {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
          z-index: 16;
        }

        .t-horizontal-bar {
          width: 168px;
          height: 38px;
          background: linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%);
          border: 2px solid #cbd5e1;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 9px;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.55);
          position: relative;
        }

        /* Girassol centralizado no meio do Suporte em T */
        .sunflower-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: -14px;
          filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.5));
          z-index: 18;
        }

        .sunflower-svg {
          transition: transform 0.5s ease;
        }

        .t-vertical-stem {
          width: 28px;
          height: 14px;
          background: linear-gradient(90deg, #e2e8f0 0%, #ffffff 50%, #cbd5e1 100%);
          border-left: 2px solid #cbd5e1;
          border-right: 2px solid #cbd5e1;
        }

        /* Olhos LDR na peça branca em T */
        .ldr-eye-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .ldr-eye-lens {
          width: 24px;
          height: 24px;
          border-radius: 9999px;
          border-width: 2px;
          border-style: solid;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.35s ease;
        }

        .ldr-pupil-dot {
          width: 7px;
          height: 7px;
          border-radius: 9999px;
          background-color: rgba(15, 23, 42, 0.8);
        }

        .ldr-side-label {
          position: absolute;
          top: -14px;
          white-space: nowrap;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 7.5px;
          font-weight: 700;
          color: #94a3b8;
        }

        /* RETÂNGULO MARROM INTERNO (Mínimo 126px > 120px do cilindro verde, ficando sempre visível acima do cilindro) */
        .inner-brown-plunger {
          width: 30px;
          background: linear-gradient(90deg, #78350f 0%, #b45309 50%, #78350f 100%);
          border: 2px solid #f59e0b;
          border-radius: 3px 3px 0 0;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 6px;
          transition: height 0.6s cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.45);
          z-index: 11;
        }

        .plunger-label {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 7.5px;
          font-weight: 800;
          color: #fef3c7;
          letter-spacing: 0.06em;
          opacity: 0.9;
        }

        /* CILINDRO VERDE EXTERNO (120px de altura, visão em corte mostrando o retângulo marrom e a rosca) */
        .outer-green-cylinder {
          width: 54px;
          height: 120px;
          background: linear-gradient(
            90deg,
            rgba(21, 128, 61, 0.84) 0%,
            rgba(34, 197, 94, 0.30) 30%,
            rgba(34, 197, 94, 0.22) 70%,
            rgba(21, 128, 61, 0.84) 100%
          );
          border: 2.5px solid #22c55e;
          border-bottom: none;
          border-radius: 6px 6px 0 0;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.2);
          z-index: 13;
        }

        /* Rosca Vertical (Fuso sem-fim) ligada ao Motor de Passo */
        .vertical-leadscrew {
          width: 10px;
          height: 100%;
          background: repeating-linear-gradient(
            -28deg,
            #e2e8f0,
            #e2e8f0 3px,
            #475569 3px,
            #475569 6px
          );
          border-left: 1px solid #334155;
          border-right: 1px solid #334155;
          opacity: 0.95;
          z-index: 14;
        }

        .cylinder-vertical-tag {
          position: absolute;
          left: -18px;
          writing-mode: vertical-rl;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 7.5px;
          font-weight: 700;
          color: #4ade80;
          letter-spacing: 0.06em;
        }

        /* ENGRENAGEM DA BASE DO CILINDRO VERDE (COROA: 84px de largura, borda direita em 50% + 42px) */
        .cylinder-base-gear {
          width: 84px;
          height: 22px;
          background: linear-gradient(180deg, #16a34a 0%, #14532d 100%);
          border: 2px solid #4ade80;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
          z-index: 15;
        }

        .gear-teeth-strip {
          width: 94%;
          height: 8px;
          background: repeating-linear-gradient(
            90deg,
            #dcfce7 0px,
            #dcfce7 5px,
            #14532d 5px,
            #14532d 10px
          );
          border-radius: 2px;
          transition: background-position 0.4s ease-out;
        }

        .gear-caption {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 6.5px;
          font-weight: 800;
          color: #bbf7d0;
          margin-top: 1px;
          letter-spacing: 0.04em;
        }

        /* =====================================================================
           CHASSI INFERIOR: BASE MARROM VAZADA (C/ STEPPER) + SERVO ENCOSTADO
        ===================================================================== */
        .lower-fixed-chassis {
          position: relative;
          width: 280px;
          height: 96px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          z-index: 14;
        }

        /* SERVOMOTOR LATERAL COLADO NA ENGRENAGEM DO CILINDRO:
           A engrenagem do cilindro termina em calc(50% + 42px).
           Posicionamos o conjunto do servo em left: calc(50% + 40px) para que
           as duas engrenagens fiquem fisicamente encostadas/engrenadas! */
        .side-servo-assembly {
          position: absolute;
          left: calc(50% + 40px);
          top: -22px;
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 16;
        }

        .servo-pinion-gear {
          width: 50px;
          height: 22px;
          background: linear-gradient(180deg, #0284c7 0%, #1e3a8a 100%);
          border: 2px solid #38bdf8;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: -2px 0 12px rgba(56, 189, 248, 0.45);
        }

        .pinion-teeth {
          background: repeating-linear-gradient(
            90deg,
            #e0f2fe 0px,
            #e0f2fe 5px,
            #1e3a8a 5px,
            #1e3a8a 10px
          );
        }

        .pinion-caption {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 6.5px;
          font-weight: 800;
          color: #bae6fd;
          margin-top: 1px;
        }

        .servo-shaft-neck {
          width: 10px;
          height: 8px;
          background: linear-gradient(90deg, #94a3b8, #f8fafc, #64748b);
          border-left: 1px solid #475569;
          border-right: 1px solid #475569;
        }

        .servo-motor-body {
          width: 54px;
          height: 50px;
          background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 60%, #1e3a8a 100%);
          border: 2px solid #60a5fa;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.55);
          padding: 3px;
        }

        .servo-body-title {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 7px;
          font-weight: 800;
          color: #dbeafe;
        }

        .servo-body-angle {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 10.5px;
          font-weight: 800;
          color: #fde047;
          margin-top: 1px;
        }

        /* Suporte lateral marrom ligando o Servo à Base Marrom */
        .servo-support-bracket {
          width: 60px;
          height: 12px;
          background: linear-gradient(180deg, #78350f 0%, #451a03 100%);
          border: 2px solid #b45309;
          border-radius: 0 4px 4px 0;
          margin-left: -6px;
        }

        /* BASE MARROM VAZADA (Permite ver o Motor de Passo lá dentro) */
        .hollow-brown-base {
          width: 156px;
          height: 94px;
          background: linear-gradient(180deg, #78350f 0%, #451a03 100%);
          border: 3px solid #b45309;
          border-radius: 8px;
          padding: 8px 12px 18px 12px;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 12px 26px rgba(0, 0, 0, 0.7);
        }

        /* Janela Vazada da Base Marrom */
        .hollow-base-window {
          width: 100%;
          height: 100%;
          background-color: #060b16;
          background-image:
            linear-gradient(to right, rgba(56, 189, 248, 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.07) 1px, transparent 1px);
          background-size: 14px 14px;
          border: 2px solid #92400e;
          border-radius: 5px;
          box-shadow: inset 0 4px 12px rgba(0, 0, 0, 0.85);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          position: relative;
          overflow: hidden;
        }

        /* Eixo conectando o Motor de Passo à Rosca Vertical */
        .stepper-coupler-shaft {
          width: 12px;
          height: 16px;
          background: repeating-linear-gradient(
            -28deg,
            #e2e8f0,
            #e2e8f0 3px,
            #475569 3px,
            #475569 6px
          );
          border-left: 1px solid #94a3b8;
          border-right: 1px solid #94a3b8;
        }

        /* Corpo do Motor de Passo visível dentro da Base Vazada */
        .stepper-motor-unit {
          width: 104px;
          height: 44px;
          background: linear-gradient(180deg, #cbd5e1 0%, #64748b 45%, #334155 100%);
          border: 2px solid #e2e8f0;
          border-radius: 8px 8px 4px 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          margin-bottom: 4px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6);
        }

        .stepper-ears {
          position: absolute;
          top: 8px;
          width: 118px;
          height: 8px;
          background-color: #94a3b8;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          z-index: -1;
        }

        .stepper-title {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 8px;
          font-weight: 800;
          color: #0f172a;
          background-color: rgba(255, 255, 255, 0.75);
          padding: 0 4px;
          border-radius: 2px;
        }

        .stepper-sub {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 7.5px;
          font-weight: 700;
          color: #fef08a;
          margin-top: 2px;
        }

        .base-frame-label {
          position: absolute;
          bottom: 2px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 8px;
          font-weight: 800;
          color: #fde68a;
          letter-spacing: 0.06em;
        }

        /* Camada Utilitária Tailwind Scoped */
        .telemetry-wrapper .bg-slate-900\\/90 { background-color: rgba(15, 23, 42, 0.92); }
        .telemetry-wrapper .bg-slate-950 { background-color: #020617; }
        .telemetry-wrapper .bg-slate-900 { background-color: #0f172a; }
        .telemetry-wrapper .bg-slate-800 { background-color: #1e293b; }
        .telemetry-wrapper .bg-slate-800\\/90 { background-color: rgba(30, 41, 59, 0.9); }
        .telemetry-wrapper .bg-gray-800 { background-color: #1f2937; }
        .telemetry-wrapper .bg-gray-700 { background-color: #374151; }
        .telemetry-wrapper .bg-gray-400 { background-color: #9ca3af; }
        .telemetry-wrapper .bg-yellow-500 { background-color: #eab308; }
        .telemetry-wrapper .bg-green-500 { background-color: #22c55e; }
        .telemetry-wrapper .bg-green-400 { background-color: #4ade80; }
        .telemetry-wrapper .bg-emerald-300 { background-color: #6ee7b7; }
        .telemetry-wrapper .bg-emerald-950\\/80 { background-color: rgba(2, 44, 34, 0.85); }
        .telemetry-wrapper .bg-emerald-500\\/10 { background-color: rgba(16, 185, 129, 0.12); }

        .telemetry-wrapper .text-white { color: #ffffff; }
        .telemetry-wrapper .text-slate-100 { color: #f1f5f9; }
        .telemetry-wrapper .text-slate-200 { color: #e2e8f0; }
        .telemetry-wrapper .text-slate-300 { color: #cbd5e1; }
        .telemetry-wrapper .text-slate-400 { color: #94a3b8; }
        .telemetry-wrapper .text-slate-500 { color: #64748b; }
        .telemetry-wrapper .text-slate-900 { color: #0f172a; }
        .telemetry-wrapper .text-slate-950 { color: #020617; }
        .telemetry-wrapper .text-emerald-300 { color: #6ee7b7; }
        .telemetry-wrapper .text-emerald-400 { color: #34d399; }
        .telemetry-wrapper .text-cyan-400 { color: #22d3ee; }
        .telemetry-wrapper .text-yellow-400 { color: #facc15; }
        .telemetry-wrapper .text-amber-400 { color: #fbbf24; }
        .telemetry-wrapper .text-amber-300 { color: #fcd34d; }

        .telemetry-wrapper .border { border-width: 1px; border-style: solid; }
        .telemetry-wrapper .border-2 { border-width: 2px; border-style: solid; }
        .telemetry-wrapper .border-4 { border-width: 4px; border-style: solid; }
        .telemetry-wrapper .border-b { border-bottom-width: 1px; border-bottom-style: solid; }
        .telemetry-wrapper .border-t { border-top-width: 1px; border-top-style: solid; }
        .telemetry-wrapper .border-dashed { border-style: dashed; }
        .telemetry-wrapper .border-slate-800 { border-color: #1e293b; }
        .telemetry-wrapper .border-slate-800\\/70 { border-color: rgba(30, 41, 59, 0.7); }
        .telemetry-wrapper .border-slate-700 { border-color: #334155; }
        .telemetry-wrapper .border-slate-600 { border-color: #475569; }
        .telemetry-wrapper .border-emerald-500\\/30 { border-color: rgba(16, 185, 129, 0.3); }
        .telemetry-wrapper .border-emerald-500\\/50 { border-color: rgba(16, 185, 129, 0.5); }
        .telemetry-wrapper .border-orange-300 { border-color: #fdba74; }

        .telemetry-wrapper .rounded { border-radius: 0.25rem; }
        .telemetry-wrapper .rounded-lg { border-radius: 0.5rem; }
        .telemetry-wrapper .rounded-xl { border-radius: 0.75rem; }
        .telemetry-wrapper .rounded-2xl { border-radius: 1rem; }
        .telemetry-wrapper .rounded-full { border-radius: 9999px; }

        .telemetry-wrapper .p-1\\.5 { padding: 0.375rem; }
        .telemetry-wrapper .p-2\\.5 { padding: 0.625rem; }
        .telemetry-wrapper .p-3 { padding: 0.75rem; }
        .telemetry-wrapper .p-5 { padding: 1.25rem; }
        .telemetry-wrapper .p-6 { padding: 1.5rem; }
        .telemetry-wrapper .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
        .telemetry-wrapper .px-2\\.5 { padding-left: 0.625rem; padding-right: 0.625rem; }
        .telemetry-wrapper .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
        .telemetry-wrapper .px-4 { padding-left: 1rem; padding-right: 1rem; }
        .telemetry-wrapper .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
        .telemetry-wrapper .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
        .telemetry-wrapper .py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
        .telemetry-wrapper .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .telemetry-wrapper .py-2\\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; }
        .telemetry-wrapper .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
        .telemetry-wrapper .pb-3 { padding-bottom: 0.75rem; }
        .telemetry-wrapper .pt-3 { padding-top: 0.75rem; }

        .telemetry-wrapper .mt-0\\.5 { margin-top: 0.125rem; }
        .telemetry-wrapper .mt-1 { margin-top: 0.25rem; }
        .telemetry-wrapper .mt-3 { margin-top: 0.75rem; }
        .telemetry-wrapper .mt-4 { margin-top: 1rem; }
        .telemetry-wrapper .mb-0\\.5 { margin-bottom: 0.125rem; }
        .telemetry-wrapper .mb-1 { margin-bottom: 0.25rem; }
        .telemetry-wrapper .mb-4 { margin-bottom: 1rem; }
        .telemetry-wrapper .mb-5 { margin-bottom: 1.25rem; }
        .telemetry-wrapper .my-auto { margin-top: auto; margin-bottom: auto; }

        .telemetry-wrapper .flex { display: flex; }
        .telemetry-wrapper .inline-flex { display: inline-flex; }
        .telemetry-wrapper .grid { display: grid; }
        .telemetry-wrapper .block { display: block; }
        .telemetry-wrapper .relative { position: relative; }
        .telemetry-wrapper .absolute { position: absolute; }
        .telemetry-wrapper .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
        .telemetry-wrapper .z-10 { z-index: 10; }
        .telemetry-wrapper .z-20 { z-index: 20; }
        .telemetry-wrapper .overflow-hidden { overflow: hidden; }
        .telemetry-wrapper .overflow-y-auto { overflow-y: auto; }

        .telemetry-wrapper .flex-col { flex-direction: column; }
        .telemetry-wrapper .items-center { align-items: center; }
        .telemetry-wrapper .items-start { align-items: flex-start; }
        .telemetry-wrapper .justify-center { justify-content: center; }
        .telemetry-wrapper .justify-between { justify-content: space-between; }
        .telemetry-wrapper .justify-end { justify-content: flex-end; }
        .telemetry-wrapper .place-items-center { place-items: center; }

        .telemetry-wrapper .gap-2 { gap: 0.5rem; }
        .telemetry-wrapper .gap-2\\.5 { gap: 0.625rem; }
        .telemetry-wrapper .gap-3 { gap: 0.75rem; }
        .telemetry-wrapper .gap-4 { gap: 1rem; }
        .telemetry-wrapper .gap-5 { gap: 1.25rem; }
        .telemetry-wrapper .gap-6 { gap: 1.5rem; }

        .telemetry-wrapper .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        .telemetry-wrapper .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }

        @media (min-width: 768px) {
          .telemetry-wrapper .md\\:flex-row { flex-direction: row; }
          .telemetry-wrapper .md\\:items-center { align-items: center; }
          .telemetry-wrapper .md\\:justify-between { justify-content: space-between; }
          .telemetry-wrapper .md\\:self-center { align-self: center; }
          .telemetry-wrapper .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (min-width: 1024px) {
          .telemetry-wrapper .lg\\:grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }
          .telemetry-wrapper .lg\\:col-span-5 { grid-column: span 5 / span 5; }
          .telemetry-wrapper .lg\\:col-span-7 { grid-column: span 7 / span 7; }
        }

        .telemetry-wrapper .w-1 { width: 0.25rem; }
        .telemetry-wrapper .w-2\\.5 { width: 0.625rem; }
        .telemetry-wrapper .w-3 { width: 0.75rem; }
        .telemetry-wrapper .w-14 { width: 3.5rem; }
        .telemetry-wrapper .w-24 { width: 6rem; }
        .telemetry-wrapper .w-36 { width: 9rem; }
        .telemetry-wrapper .w-48 { width: 12rem; }
        .telemetry-wrapper .w-full { width: 100%; }

        .telemetry-wrapper .h-2\\.5 { height: 0.625rem; }
        .telemetry-wrapper .h-3 { height: 0.75rem; }
        .telemetry-wrapper .h-16 { height: 4rem; }
        .telemetry-wrapper .h-24 { height: 6rem; }
        .telemetry-wrapper .h-36 { height: 9rem; }
        .telemetry-wrapper .h-48 { height: 12rem; }
        .telemetry-wrapper .h-60 { height: 15rem; }
        .telemetry-wrapper .h-full { height: 100%; }
        .telemetry-wrapper .max-h-60 { max-height: 15rem; }

        .telemetry-wrapper .top-2 { top: 0.5rem; }
        .telemetry-wrapper .top-3 { top: 0.75rem; }
        .telemetry-wrapper .top-9 { top: 2.25rem; }
        .telemetry-wrapper .-top-1 { top: -0.25rem; }
        .telemetry-wrapper .left-3 { left: 0.75rem; }
        .telemetry-wrapper .left-4 { left: 1rem; }
        .telemetry-wrapper .left-1\\/2 { left: 50%; }
        .telemetry-wrapper .-left-\\[3px\\] { left: -3px; }
        .telemetry-wrapper .right-3 { right: 0.75rem; }
        .telemetry-wrapper .-translate-x-1\\/2 { transform: translateX(-50%); }
        .telemetry-wrapper .-translate-y-6 { transform: translateY(-1.5rem); }

        .telemetry-wrapper .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
        .telemetry-wrapper .font-bold { font-weight: 700; }
        .telemetry-wrapper .font-extrabold { font-weight: 800; }
        .telemetry-wrapper .font-semibold { font-weight: 600; }
        .telemetry-wrapper .font-normal { font-weight: 400; }
        .telemetry-wrapper .uppercase { text-transform: uppercase; }
        .telemetry-wrapper .tracking-tight { letter-spacing: -0.025em; }
        .telemetry-wrapper .tracking-wider { letter-spacing: 0.05em; }
        .telemetry-wrapper .tracking-widest { letter-spacing: 0.1em; }
        .telemetry-wrapper .text-center { text-align: center; }
        .telemetry-wrapper .text-right { text-align: right; }
        .telemetry-wrapper .text-left { text-align: left; }
        .telemetry-wrapper .leading-none { line-height: 1; }

        .telemetry-wrapper .text-\\[10px\\] { font-size: 10px; }
        .telemetry-wrapper .text-\\[11px\\] { font-size: 11px; }
        .telemetry-wrapper .text-xs { font-size: 0.75rem; }
        .telemetry-wrapper .text-sm { font-size: 0.875rem; }
        .telemetry-wrapper .text-base { font-size: 1rem; }
        .telemetry-wrapper .text-2xl { font-size: 1.5rem; }
        .telemetry-wrapper .text-3xl { font-size: 1.875rem; }

        .telemetry-wrapper .bg-gradient-to-t {
          background-image: linear-gradient(to top, #0891b2, #22d3ee, #34d399);
        }
        .telemetry-wrapper .shadow-glow-yellow {
          box-shadow: 0 0 28px rgba(234, 179, 8, 0.65), inset 0 2px 6px rgba(255, 255, 255, 0.35);
        }
        .telemetry-wrapper .shadow-glow-cyan {
          box-shadow: 0 0 18px rgba(34, 211, 238, 0.45);
        }
        .telemetry-wrapper .shadow-glow-emerald {
          box-shadow: 0 0 12px rgba(52, 211, 153, 0.7);
        }

        .telemetry-wrapper .animate-pulse {
          animation: tw-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .telemetry-wrapper .animate-ping {
          animation: tw-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .telemetry-wrapper .animate-spin {
          animation: tw-spin 0.8s linear infinite;
        }

        @keyframes tw-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes tw-ping {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes tw-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PlantaRobotica;
