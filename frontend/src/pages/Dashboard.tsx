import React from "react";
import {
  Sun,
  Gauge,
  AlertTriangle,
  Compass,
  ArrowRight,
  Activity
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

interface DashboardProps {
  estufaInfo: any;
  sensores: any[];
  planta: any;
  leituras24h: any[];
  alerts: any[];
  setCurrentPage: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  estufaInfo,
  sensores,
  planta,
  leituras24h,
  alerts,
  setCurrentPage
}) => {
  // Busca os 2 sensores LDR cadastrados
  const sensoresLdr = sensores.filter((s) => s.tipo === "Luminosidade");
  const ldrEsquerdoSensor =
    sensoresLdr.find((s) => s.nome?.toLowerCase().includes("esq")) ||
    sensoresLdr[0];
  const ldrDireitoSensor =
    sensoresLdr.find((s) => s.nome?.toLowerCase().includes("dir")) ||
    sensoresLdr[1] ||
    sensoresLdr[0];

  const valLdrEsq =
    planta?.ldr_esquerdo ?? ldrEsquerdoSensor?.valor_atual ?? null;
  const valLdrDir =
    planta?.ldr_direito ?? ldrDireitoSensor?.valor_atual ?? null;

  const deltaLuz =
    valLdrEsq !== null && valLdrDir !== null
      ? Math.abs(Number(valLdrEsq) - Number(valLdrDir))
      : null;

  // Pivotar dados de 24h dos 2 sensores LDR para o gráfico Recharts
  const processGraphData = () => {
    const grouped: { [key: string]: any } = {};

    leituras24h
      .filter((l) => l.tipo === "Luminosidade")
      .forEach((leitura) => {
        let rawStr = typeof leitura.data_hora === "string" ? leitura.data_hora : "";
        if (rawStr && !rawStr.endsWith("Z") && !rawStr.includes("+")) {
          rawStr += "Z";
        }
        const date = rawStr ? new Date(rawStr) : new Date(leitura.data_hora);
        const hourStr = date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        });

        if (!grouped[hourStr]) {
          grouped[hourStr] = {
            time: hourStr,
            timestamp: date.getTime()
          };
        }

        const isDireito =
          leitura.nome?.toLowerCase().includes("dir") ||
          leitura.id_sensor === ldrDireitoSensor?.id_sensor;

        if (isDireito && ldrDireitoSensor?.id_sensor !== ldrEsquerdoSensor?.id_sensor) {
          grouped[hourStr]["LDR Direito"] = leitura.valor;
        } else {
          grouped[hourStr]["LDR Esquerdo"] = leitura.valor;
        }
      });

    return Object.values(grouped)
      .sort((a: any, b: any) => a.timestamp - b.timestamp)
      .map(({ timestamp, ...rest }) => rest);
  };

  const graphData = processGraphData();

  return (
    <div className="dashboard-page animate-fade-in">
      {/* Seção Estufa Header */}
      <div className="dashboard-welcome glass-card">
        <div className="welcome-text">
          <h2>Painel Geral de Controle</h2>
          <p>
            {estufaInfo?.nome || "Estufa Inteligente"} &bull;{" "}
            {estufaInfo?.localizacao || "Laboratório"}
          </p>
          <p className="welcome-desc">
            Ambiente IoT experimental com par de fotorreceptores (LDR Esquerdo e
            LDR Direito) para rastreamento luminoso e controle biomimético via
            ESP32.
          </p>
        </div>
        <div className="welcome-status">
          <span
            className={`badge ${
              estufaInfo?.status_operacional === "Online"
                ? "badge-success"
                : "badge-danger"
            }`}
          >
            SISTEMA {estufaInfo?.status_operacional || "OFFLINE"}
          </span>
        </div>
      </div>

      {/* Grid de Cards: Apenas os 2 Sensores LDR e Gradiente Luminoso */}
      <div className="grid-cards">
        {/* Card LDR Esquerdo */}
        <div className="sensor-card glass-card border-light">
          <div className="card-header">
            <span className="card-title">
              {ldrEsquerdoSensor?.nome || "Sensor LDR Esquerdo"}
            </span>
            <Sun className="icon-light" size={24} />
          </div>
          <div className="card-body">
            <span className="card-value">
              {valLdrEsq !== null ? valLdrEsq : "--"}
            </span>
            <span className="card-unit">
              {ldrEsquerdoSensor?.unidade || "Lux"}
            </span>
          </div>
          <div className="card-footer">
            <span className="footer-status text-success">
              &bull;{" "}
              {Number(valLdrEsq) > 1000
                ? "Alta Luminosidade (> 1000)"
                : "Em Monitoramento"}
            </span>
          </div>
        </div>

        {/* Card LDR Direito */}
        <div className="sensor-card glass-card border-light">
          <div className="card-header">
            <span className="card-title">
              {ldrDireitoSensor?.nome || "Sensor LDR Direito"}
            </span>
            <Sun className="icon-light" size={24} />
          </div>
          <div className="card-body">
            <span className="card-value">
              {valLdrDir !== null ? valLdrDir : "--"}
            </span>
            <span className="card-unit">
              {ldrDireitoSensor?.unidade || "Lux"}
            </span>
          </div>
          <div className="card-footer">
            <span className="footer-status text-success">
              &bull;{" "}
              {Number(valLdrDir) > 1000
                ? "Alta Luminosidade (> 1000)"
                : "Em Monitoramento"}
            </span>
          </div>
        </div>

        {/* Card Diferencial / Gradiente entre os 2 LDRs */}
        <div className="sensor-card glass-card border-air">
          <div className="card-header">
            <span className="card-title">Diferencial Fototrópico (&Delta; LDR)</span>
            <Gauge className="icon-air" size={24} />
          </div>
          <div className="card-body">
            <span className="card-value">
              {deltaLuz !== null ? deltaLuz : "--"}
            </span>
            <span className="card-unit">Lux</span>
          </div>
          <div className="card-footer">
            <span className="footer-status text-success">
              &bull; Direção: {planta?.direcao_luz || "Centro"}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Gráficos e Seções Laterais */}
      <div className="grid-dashboard">
        {/* Gráfico 24 Horas dos 2 LDRs */}
        <div className="graph-section glass-card">
          <div className="section-header">
            <h3>Monitoramento dos Sensores LDR (Últimas 24 Horas)</h3>
            <span className="section-desc">
              Comparativo de luminosidade entre LDR Esquerdo e LDR Direito
            </span>
          </div>
          <div className="graph-container">
            {graphData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart
                  data={graphData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorLdrEsq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLdrDir" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "12px"
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="LDR Esquerdo"
                    stroke="#eab308"
                    fillOpacity={1}
                    fill="url(#colorLdrEsq)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="LDR Direito"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorLdrDir)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">
                Carregando leituras históricas dos sensores LDR...
              </div>
            )}
          </div>
        </div>

        {/* Estado da Planta e Alertas Recentes */}
        <div className="side-sections">
          {/* Planta Robótica Estado */}
          <div className="plant-summary glass-card">
            <div className="section-header">
              <h3>Estado da Planta Robótica</h3>
              <span className="section-desc">Posicionamento biomimético</span>
            </div>
            <div className="plant-angles-summary">
              <Compass className="compass-icon rotate-slow" size={32} />
              <div className="angles-data">
                <div className="angle-item">
                  <span className="angle-label">Servomotor (Pan):</span>
                  <span className="angle-val">
                    {planta?.posicao_servo ?? planta?.angulo_horizontal ?? "--"}°
                  </span>
                </div>
                <div className="angle-item">
                  <span className="angle-label">Posição da Haste:</span>
                  <span className="angle-val">
                    {planta?.posicao_haste ?? planta?.angulo_vertical ?? "--"}{" "}
                    passos
                  </span>
                </div>
                <div className="angle-item">
                  <span className="angle-label">Seguindo Luz:</span>
                  <span
                    className="angle-val badge badge-info"
                    style={{ textTransform: "none" }}
                  >
                    {planta?.direcao_luz || "Nenhuma"}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => setCurrentPage("planta")} className="btn-link">
              <span>Abrir Telemetria Científica</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Resumo dos Sensores LDR */}
          <div className="alerts-summary glass-card">
            <div className="section-header">
              <h3>Status dos Fotoreceptores</h3>
              <span className="section-desc">Configuração ativa na ESP32</span>
            </div>
            <div className="alerts-content">
              {alerts.length === 0 ? (
                <div className="alert-empty-box">
                  <Activity
                    size={18}
                    style={{ color: "#10b981", margin: "0 auto 0.35rem" }}
                  />
                  <p>2 Sensores LDR ativos e sincronizados com a planta robótica.</p>
                </div>
              ) : (
                <div className="alert-dashboard-list">
                  {alerts.slice(0, 3).map((a, i) => (
                    <div key={i} className="alert-db-item">
                      <AlertTriangle size={16} className="danger-icon" />
                      <div className="alert-db-details">
                        <p>{a.mensagem}</p>
                        <span>
                          {new Date(a.data_hora).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .dashboard-welcome {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 2rem;
          border-left: 5px solid var(--primary);
        }

        .welcome-text h2 {
          font-size: 1.4rem;
          color: var(--primary-dark);
        }

        .welcome-text p {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: 0.15rem;
        }

        .sensor-card {
          position: relative;
          overflow: hidden;
        }

        .border-air { border-top: 4px solid #10b981; }
        .border-light { border-top: 4px solid #f59e0b; }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .card-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .icon-air { color: #10b981; }
        .icon-light { color: #f59e0b; }

        .card-body {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
          margin-bottom: 0.5rem;
        }

        .card-value {
          font-size: 2.2rem;
          font-weight: 700;
          color: var(--text-main);
          line-height: 1;
        }

        .card-unit {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .card-footer {
          border-top: 1px solid #f1f5f9;
          padding-top: 0.5rem;
        }

        .footer-status {
          font-size: 0.75rem;
          font-weight: 500;
        }

        .section-header {
          margin-bottom: 1.5rem;
        }

        .section-header h3 {
          font-size: 1.1rem;
          font-weight: 700;
        }

        .section-desc {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .graph-container {
          width: 100%;
          min-height: 320px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .no-data {
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .side-sections {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .plant-summary {
          display: flex;
          flex-direction: column;
        }

        .plant-angles-summary {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          background: #f8fafc;
          padding: 1rem;
          border-radius: var(--radius-sm);
          margin-bottom: 1rem;
        }

        .compass-icon {
          color: var(--primary);
        }

        .rotate-slow {
          animation: spin 8s linear infinite;
        }

        .angles-data {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
        }

        .angle-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .angle-label {
          color: var(--text-muted);
        }

        .angle-val {
          color: var(--text-main);
          font-weight: 600;
        }

        .btn-link {
          background: transparent;
          border: none;
          color: var(--primary);
          font-size: 0.85rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          cursor: pointer;
          align-self: flex-start;
          transition: var(--transition);
        }

        .btn-link:hover {
          color: var(--primary-dark);
          gap: 0.5rem;
        }

        .alert-empty-box {
          background: #f8fafc;
          padding: 1rem;
          text-align: center;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .alert-dashboard-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .alert-db-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #fee2e2;
          color: #991b1b;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          align-items: center;
        }

        .danger-icon {
          color: #ef4444;
          flex-shrink: 0;
        }

        .alert-db-details {
          display: flex;
          flex-direction: column;
        }

        .alert-db-details p {
          font-weight: 500;
        }

        .alert-db-details span {
          font-size: 0.7rem;
          opacity: 0.7;
          margin-top: 0.1rem;
        }

        .welcome-desc {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: 0.4rem;
          line-height: 1.5;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
