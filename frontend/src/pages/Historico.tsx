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
import { Calendar, RefreshCw, Thermometer, Droplet, Sun, Eye } from "lucide-react";
import { API_BASE_URL } from "../api";

interface HistoricoProps {}

export const Historico: React.FC<HistoricoProps> = () => {
  const [periodo, setPeriodo] = useState("24h");
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("todos"); // todos, temp, umidade, luz, gases

  const fetchData = async (period: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/historico?periodo=${period}`);
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

  // Pivotar dados de forma flexível de acordo com a granularidade temporal
  const getProcessedData = (filterTipo?: string[]) => {
    const grouped: { [key: string]: any } = {};
    
    const filteredRaw = filterTipo 
      ? rawData.filter(d => filterTipo.includes(d.tipo)) 
      : rawData;

    filteredRaw.forEach((leitura) => {
      const date = new Date(leitura.data_hora);
      let timeLabel = "";
      
      if (periodo === "24h") {
        timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        timeLabel = date.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      if (!grouped[timeLabel]) {
        grouped[timeLabel] = { 
          time: timeLabel,
          timestamp: date.getTime()
        };
      }

      // Friendly mapping
      const labelMap: { [key: string]: string } = {
        "Temperatura": "Temperatura",
        "UmidadeSolo": "UmidadeSolo",
        "UmidadeAr": "UmidadeAr",
        "Luminosidade": "Luminosidade",
        "CO2": "CO2",
        "Oxigenio": "Oxigenio"
      };

      const keyName = labelMap[leitura.tipo] || leitura.tipo;
      grouped[timeLabel][keyName] = leitura.valor;
    });

    return Object.values(grouped)
      .sort((a: any, b: any) => a.timestamp - b.timestamp)
      .map(({ timestamp, ...rest }) => rest);
  };

  // Dados para gráficos individuais
  const tempChartData = getProcessedData(["Temperatura"]);
  const umidChartData = getProcessedData(["UmidadeSolo", "UmidadeAr"]);
  const luzChartData = getProcessedData(["Luminosidade"]);
  const gasChartData = getProcessedData(["CO2", "Oxigenio"]);

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

        {/* Abas de Visualização */}
        <div className="tab-menu">
          <button onClick={() => setActiveTab("todos")} className={`tab-btn ${activeTab === "todos" ? "active" : ""}`}>Todos os Gráficos</button>
          <button onClick={() => setActiveTab("temp")} className={`tab-btn ${activeTab === "temp" ? "active" : ""}`}><Thermometer size={16}/> Temperatura</button>
          <button onClick={() => setActiveTab("umidade")} className={`tab-btn ${activeTab === "umidade" ? "active" : ""}`}><Droplet size={16}/> Umidade (Ar/Solo)</button>
          <button onClick={() => setActiveTab("luz")} className={`tab-btn ${activeTab === "luz" ? "active" : ""}`}><Sun size={16}/> Luminosidade</button>
          <button onClick={() => setActiveTab("gases")} className={`tab-btn ${activeTab === "gases" ? "active" : ""}`}><Eye size={16}/> Gases (CO2/O2)</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-box glass-card">Processando leituras históricas...</div>
      ) : (
        <div className="charts-grid">
          {/* Gráfico Temperatura */}
          {(activeTab === "todos" || activeTab === "temp") && (
            <div className="glass-card chart-card">
              <div className="chart-header">
                <Thermometer size={20} className="icon-temp" />
                <div>
                  <h4>Histórico de Temperatura</h4>
                  <span>Variação térmica da estufa em graus Celsius (°C)</span>
                </div>
              </div>
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={tempChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="histTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="Temperatura" stroke="#ef4444" fill="url(#histTemp)" strokeWidth={2} name="Temperatura (°C)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Gráfico Umidade */}
          {(activeTab === "todos" || activeTab === "umidade") && (
            <div className="glass-card chart-card">
              <div className="chart-header">
                <Droplet size={20} className="icon-soil" />
                <div>
                  <h4>Histórico de Umidade</h4>
                  <span>Níveis de umidade atmosférica e umidade do solo (%)</span>
                </div>
              </div>
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={umidChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="histSoil" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="histAir" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    <Area type="monotone" dataKey="UmidadeSolo" stroke="#3b82f6" fill="url(#histSoil)" strokeWidth={2} name="Solo (%)" />
                    <Area type="monotone" dataKey="UmidadeAr" stroke="#10b981" fill="url(#histAir)" strokeWidth={2} name="Ar (%)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Gráfico Luminosidade */}
          {(activeTab === "todos" || activeTab === "luz") && (
            <div className="glass-card chart-card">
              <div className="chart-header">
                <Sun size={20} className="icon-light" />
                <div>
                  <h4>Histórico de Luminosidade</h4>
                  <span>Intensidade de radiação luminosa registrada em Lux</span>
                </div>
              </div>
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={luzChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="histLuz" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="Luminosidade" stroke="#eab308" fill="url(#histLuz)" strokeWidth={2} name="Luminosidade (Lux)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Gráfico Gases */}
          {(activeTab === "todos" || activeTab === "gases") && (
            <div className="glass-card chart-card">
              <div className="chart-header">
                <Eye size={20} className="icon-gas" />
                <div>
                  <h4>Histórico de Gases (CO2 & O2)</h4>
                  <span>Níveis de Dióxido de Carbono e Oxigênio atmosférico</span>
                </div>
              </div>
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={gasChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="histCO2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="histO2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    <Area type="monotone" dataKey="CO2" stroke="#8b5cf6" fill="url(#histCO2)" strokeWidth={2} name="CO2 (ppm)" />
                    <Area type="monotone" dataKey="Oxigenio" stroke="#ec4899" fill="url(#histO2)" strokeWidth={2} name="Oxigênio (%)" />
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

        /* Tab Menu */
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

        /* Charts Grid */
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

        .icon-temp { color: #ef4444; }
        .icon-soil { color: #3b82f6; }
        .icon-light { color: #f59e0b; }
        .icon-gas { color: #8b5cf6; }

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
