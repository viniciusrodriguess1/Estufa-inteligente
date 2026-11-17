import React, { useState, useEffect } from "react";
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
import { Calendar, RefreshCw, Sun } from "lucide-react";
import { API_BASE_URL } from "../api";

interface HistoricoProps {}

export const Historico: React.FC<HistoricoProps> = () => {
  const [periodo, setPeriodo] = useState("24h");
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("ambos"); // ambos, esq, dir

  const fetchData = async (period: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/historico?periodo=${period}&sensor_tipo=Luminosidade`
      );
      const data = await response.json();
      setRawData(data || []);
    } catch (err) {
      console.error("Erro ao buscar histórico:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(periodo);
  }, [periodo]);

  // Agrupar leituras de LDR Esquerdo e LDR Direito por horário
  const getProcessedData = () => {
    const grouped: { [key: string]: any } = {};

    rawData
      .filter((d) => d.tipo === "Luminosidade")
      .forEach((leitura) => {
        let rawStr =
          typeof leitura.data_hora === "string" ? leitura.data_hora : "";
        if (rawStr && !rawStr.endsWith("Z") && !rawStr.includes("+")) {
          rawStr += "Z";
        }
        const date = rawStr ? new Date(rawStr) : new Date(leitura.data_hora);
        let timeLabel = "";

        if (periodo === "24h") {
          timeLabel = date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          });
        } else {
          timeLabel =
            date.toLocaleDateString([], { day: "2-digit", month: "2-digit" }) +
            " " +
            date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }

        if (!grouped[timeLabel]) {
          grouped[timeLabel] = {
            time: timeLabel,
            timestamp: date.getTime()
          };
        }

        const isDireito =
          leitura.nome?.toLowerCase().includes("dir") ||
          leitura.id_sensor === 2;

        if (isDireito) {
          grouped[timeLabel]["LDR Direito"] = leitura.valor;
        } else {
          grouped[timeLabel]["LDR Esquerdo"] = leitura.valor;
        }
      });

    return Object.values(grouped)
      .sort((a: any, b: any) => a.timestamp - b.timestamp)
      .map(({ timestamp, ...rest }) => rest);
  };

  const luzChartData = getProcessedData();

  return (
    <div className="historico-page animate-fade-in">
      {/* Controle de Filtros */}
      <div className="glass-card controls-card">
        <div className="controls-row">
          <div className="filter-group">
            <Calendar size={18} className="filter-icon" />
            <span className="filter-label">Período de Análise:</span>
            <div className="period-buttons">
              <button
                onClick={() => setPeriodo("24h")}
                className={`period-btn ${periodo === "24h" ? "active" : ""}`}
              >
                Últimas 24 Horas
              </button>
              <button
                onClick={() => setPeriodo("7d")}
                className={`period-btn ${periodo === "7d" ? "active" : ""}`}
              >
                Últimos 7 Dias
              </button>
              <button
                onClick={() => setPeriodo("30d")}
                className={`period-btn ${periodo === "30d" ? "active" : ""}`}
              >
                Últimos 30 Dias
              </button>
            </div>
          </div>
          <button
            onClick={() => fetchData(periodo)}
            className={`btn btn-refresh ${loading ? "spin" : ""}`}
            disabled={loading}
          >
            <RefreshCw size={16} />
            <span>Atualizar</span>
          </button>
        </div>

        {/* Abas de Visualização dos 2 Sensores LDR */}
        <div className="tab-menu">
          <button
            onClick={() => setActiveTab("ambos")}
            className={`tab-btn ${activeTab === "ambos" ? "active" : ""}`}
          >
            <Sun size={16} /> Ambos os LDRs
          </button>
          <button
            onClick={() => setActiveTab("esq")}
            className={`tab-btn ${activeTab === "esq" ? "active" : ""}`}
          >
            <Sun size={16} /> Sensor LDR Esquerdo
          </button>
          <button
            onClick={() => setActiveTab("dir")}
            className={`tab-btn ${activeTab === "dir" ? "active" : ""}`}
          >
            <Sun size={16} /> Sensor LDR Direito
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-box glass-card">
          Processando leituras históricas dos sensores LDR...
        </div>
      ) : (
        <div className="charts-grid">
          {(activeTab === "ambos" || activeTab === "esq") && (
            <div className="glass-card chart-card">
              <div className="chart-header">
                <Sun size={20} className="icon-light" />
                <div>
                  <h4>Histórico - Sensor LDR Esquerdo</h4>
                  <span>
                    Intensidade luminosa captada pelo fotorreceptor esquerdo
                    (Lux)
                  </span>
                </div>
              </div>
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart
                    data={luzChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="histLuzEsq" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                    <Area
                      type="monotone"
                      dataKey="LDR Esquerdo"
                      stroke="#eab308"
                      fill="url(#histLuzEsq)"
                      strokeWidth={2}
                      name="LDR Esquerdo (Lux)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {(activeTab === "ambos" || activeTab === "dir") && (
            <div className="glass-card chart-card">
              <div className="chart-header">
                <Sun size={20} className="icon-light" />
                <div>
                  <h4>Histórico - Sensor LDR Direito</h4>
                  <span>
                    Intensidade luminosa captada pelo fotorreceptor direito
                    (Lux)
                  </span>
                </div>
              </div>
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart
                    data={luzChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="histLuzDir" x1="0" y1="0" x2="0" y2="1">
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
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                    <Area
                      type="monotone"
                      dataKey="LDR Direito"
                      stroke="#10b981"
                      fill="url(#histLuzDir)"
                      strokeWidth={2}
                      name="LDR Direito (Lux)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .historico-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .controls-card {
          padding: 1.5rem;
        }

        .controls-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 1.25rem;
          margin-bottom: 1.25rem;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .filter-icon {
          color: var(--primary);
        }

        .filter-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-main);
        }

        .period-buttons {
          display: flex;
          gap: 0.4rem;
          background: #f1f5f9;
          padding: 0.3rem;
          border-radius: var(--radius-sm);
        }

        .period-btn {
          border: none;
          background: transparent;
          padding: 0.4rem 1rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition);
        }

        .period-btn.active {
          background: #ffffff;
          color: var(--primary-dark);
          box-shadow: var(--shadow-sm);
        }

        .btn-refresh {
          background: #ffffff;
          border: 1px solid var(--border-color);
          color: var(--text-main);
        }

        .btn-refresh:hover {
          background: #f8fafc;
          border-color: var(--primary-light);
        }

        .btn-refresh.spin svg {
          animation: spin 0.6s linear;
        }

        .tab-menu {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          border: 1px solid var(--border-color);
          background: transparent;
          padding: 0.5rem 1rem;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-muted);
          cursor: pointer;
          transition: var(--transition);
        }

        .tab-btn:hover {
          background: #f8fafc;
          color: var(--primary);
          border-color: var(--primary-light);
        }

        .tab-btn.active {
          background: var(--primary-glow);
          color: var(--primary-dark);
          border-color: var(--primary);
          font-weight: 600;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        @media (max-width: 992px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .controls-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .filter-group {
            flex-direction: column;
            align-items: flex-start;
            width: 100%;
          }
          .period-buttons {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            text-align: center;
          }
          .period-btn {
            padding: 0.5rem 0.2rem;
            font-size: 0.75rem;
            text-align: center;
          }
          .btn-refresh {
            width: 100%;
          }
        }

        .chart-card {
          padding: 1.5rem;
        }

        .chart-header {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid #f8fafc;
          padding-bottom: 0.75rem;
        }

        .chart-header h4 {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .chart-header span {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.1rem;
          display: block;
        }

        .chart-body {
          width: 100%;
        }

        .icon-light { color: #f59e0b; }

        .loading-box {
          text-align: center;
          padding: 4rem;
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
