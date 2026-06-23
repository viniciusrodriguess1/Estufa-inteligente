import React from "react";
import { 
  Thermometer, 
  Droplet, 
  Wind, 
  Sun, 
  Gauge, 
  AlertTriangle,
  Compass,
  ArrowRight
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

const sensorLabelMap: { [key: string]: string } = {
  "Temperatura": "Temperatura",
  "UmidadeSolo": "Umidade do Solo",
  "UmidadeAr": "Umidade do Ar",
  "Luminosidade": "Luminosidade",
  "CO2": "CO2",
  "Oxigenio": "Oxigênio"
};

export const Dashboard: React.FC<DashboardProps> = ({
  estufaInfo,
  sensores,
  planta,
  leituras24h,
  alerts,
  setCurrentPage
}) => {
  
  // Encontrar o valor de cada tipo de sensor
  const getSensorValue = (tipo: string) => {
    const sensor = sensores.find(s => s.tipo === tipo);
    return sensor ? { valor: sensor.valor_atual, unidade: sensor.unidade } : { valor: null, unidade: "" };
  };

  const temp = getSensorValue("Temperatura");
  const umidSolo = getSensorValue("UmidadeSolo");
  const umidAr = getSensorValue("UmidadeAr");
  const luz = getSensorValue("Luminosidade");
  const co2 = getSensorValue("CO2");
  const o2 = getSensorValue("Oxigenio");

  // Pivotar dados de 24h para o gráfico Recharts
  const processGraphData = () => {
    const grouped: { [key: string]: any } = {};
    
    // Filtra e organiza
    leituras24h.forEach((leitura) => {
      const date = new Date(leitura.data_hora);
      // Formata como "HH:MM"
      const hourStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      if (!grouped[hourStr]) {
        grouped[hourStr] = { 
          time: hourStr,
          timestamp: date.getTime()
        };
      }
      
      const label = sensorLabelMap[leitura.tipo] || leitura.tipo;
      grouped[hourStr][label] = leitura.valor;
    });

    // Ordenar cronologicamente
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
          <p>{estufaInfo?.nome || "Estufa AgroTech"} &bull; {estufaInfo?.localizacao || "Laboratório"}</p>
        </div>
        <div className="welcome-status">
          <span className={`badge ${estufaInfo?.status_operacional === "Online" ? "badge-success" : "badge-danger"}`}>
            SISTEMA {estufaInfo?.status_operacional || "OFFLINE"}
          </span>
        </div>
      </div>

      {/* Grid de Cards dos Sensores */}
      <div className="grid-cards">
        {/* Card Temperatura */}
        <div className="sensor-card glass-card border-temp">
          <div className="card-header">
            <span className="card-title">Temperatura</span>
            <Thermometer className="icon-temp" size={24} />
          </div>
          <div className="card-body">
            <span className="card-value">{temp.valor !== null ? temp.valor : "--"}</span>
            <span className="card-unit">{temp.unidade}</span>
          </div>
          <div className="card-footer">
            <span className="footer-status text-success">&bull; Operando Normal</span>
          </div>
        </div>

        {/* Card Umidade do Solo */}
        <div className="sensor-card glass-card border-soil">
          <div className="card-header">
            <span className="card-title">Umidade do Solo</span>
            <Droplet className="icon-soil" size={24} />
          </div>
          <div className="card-body">
            <span className="card-value">{umidSolo.valor !== null ? umidSolo.valor : "--"}</span>
            <span className="card-unit">{umidSolo.unidade}</span>
          </div>
          <div className="card-footer">
            <span className="footer-status text-success">&bull; Solo Adequado</span>
          </div>
        </div>

        {/* Card Umidade do Ar */}
        <div className="sensor-card glass-card border-air">
          <div className="card-header">
            <span className="card-title">Umidade do Ar</span>
            <Wind className="icon-air" size={24} />
          </div>
          <div className="card-body">
            <span className="card-value">{umidAr.valor !== null ? umidAr.valor : "--"}</span>
            <span className="card-unit">{umidAr.unidade}</span>
          </div>
          <div className="card-footer">
            <span className="footer-status text-success">&bull; Umidade Ideal</span>
          </div>
        </div>

        {/* Card Luminosidade */}
        <div className="sensor-card glass-card border-light">
          <div className="card-header">
            <span className="card-title">Luminosidade</span>
            <Sun className="icon-light" size={24} />
          </div>
          <div className="card-body">
            <span className="card-value">{luz.valor !== null ? luz.valor : "--"}</span>
            <span className="card-unit">{luz.unidade}</span>
          </div>
          <div className="card-footer">
            <span className="footer-status text-success">&bull; Luz Estável</span>
          </div>
        </div>

        {/* Card Gases (CO2 / O2) */}
        <div className="sensor-card glass-card border-gas">
          <div className="card-header">
            <span className="card-title">Gases (CO2 / O2)</span>
            <Gauge className="icon-gas" size={24} />
          </div>
          <div className="card-body multi-body">
            <div className="gases-sub">
              <span className="sub-label">CO₂:</span>
              <span className="sub-value">{co2.valor !== null ? co2.valor : "--"}</span>
              <span className="sub-unit">{co2.unidade}</span>
            </div>
            <div className="gases-sub border-l">
              <span className="sub-label">O₂:</span>
              <span className="sub-value">{o2.valor !== null ? o2.valor : "--"}</span>
              <span className="sub-unit">{o2.unidade}</span>
            </div>
          </div>
          <div className="card-footer">
            <span className="footer-status text-success">&bull; Atmosfera Saudável</span>
          </div>
        </div>
      </div>

      {/* Grid Gráficos e Seções Laterais */}
      <div className="grid-dashboard">
        {/* Gráfico 24 Horas */}
        <div className="graph-section glass-card">
          <div className="section-header">
            <h3>Monitoramento das Últimas 24 Horas</h3>
            <span className="section-desc">Dados agregados em tempo real</span>
          </div>
          <div className="graph-container">
            {graphData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSoil" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="Temperatura" stroke="#ef4444" fillOpacity={1} fill="url(#colorTemp)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Umidade do Solo" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSoil)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Luminosidade" stroke="#eab308" fillOpacity={1} fill="url(#colorLight)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">Carregando dados históricos de 24h...</div>
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
                  <span className="angle-label">Heliotropismo (H):</span>
                  <span className="angle-val">{planta?.angulo_horizontal ?? "--"}°</span>
                </div>
                <div className="angle-item">
                  <span className="angle-label">Ganho de Elevação (V):</span>
                  <span className="angle-val">{planta?.angulo_vertical ?? "--"} mm</span>
                </div>
                <div className="angle-item">
                  <span className="angle-label">Seguindo Luz:</span>
                  <span className="angle-val badge badge-info" style={{ textTransform: 'none' }}>
                    {planta?.direcao_luz || "Nenhuma"}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => setCurrentPage("planta")} className="btn-link">
              <span>Painel da Planta</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Alertas Recentes */}
          <div className="alerts-summary glass-card">
            <div className="section-header">
              <h3>Anomalias Recentes</h3>
              <span className="section-desc">Últimos registros críticos</span>
            </div>
            <div className="alerts-content">
              {alerts.length === 0 ? (
                <div className="alert-empty-box">
                  <p>Nenhum alerta crítico ativo no momento.</p>
                </div>
              ) : (
                <div className="alert-dashboard-list">
                  {alerts.slice(0, 3).map((a, i) => (
                    <div key={i} className="alert-db-item">
                      <AlertTriangle size={16} className="danger-icon" />
                      <div className="alert-db-details">
                        <p>{a.mensagem}</p>
                        <span>{new Date(a.data_hora).toLocaleTimeString()}</span>
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

        /* Cores customizadas dos cards de sensores */
        .sensor-card {
          position: relative;
          overflow: hidden;
        }

        .border-temp { border-top: 4px solid #ef4444; }
        .border-soil { border-top: 4px solid #3b82f6; }
        .border-air { border-top: 4px solid #10b981; }
        .border-light { border-top: 4px solid #f59e0b; }
        .border-gas { border-top: 4px solid #8b5cf6; }

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

        .icon-temp { color: #ef4444; }
        .icon-soil { color: #3b82f6; }
        .icon-air { color: #10b981; }
        .icon-light { color: #f59e0b; }
        .icon-gas { color: #8b5cf6; }

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

        .multi-body {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .gases-sub {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .border-l {
          border-left: 1px solid var(--border-color);
          padding-left: 1rem;
        }

        .sub-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .sub-value {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-main);
          margin-top: 0.1rem;
        }

        .sub-unit {
          font-size: 0.8rem;
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

        /* Graph & Side Sections */
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

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
