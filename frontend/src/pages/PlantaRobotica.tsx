import React, { useState } from "react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { Compass, Navigation, History, RefreshCw } from "lucide-react";

interface PlantaRoboticaProps {
  planta: any;
  movimentos: any[];
  onRefresh: () => void;
}

export const PlantaRobotica: React.FC<PlantaRoboticaProps> = ({ 
  planta, 
  movimentos, 
  onRefresh 
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 655);
  };

  // Preparar dados do gráfico de movimentos (inverter ordem para cronológico)
  const graphData = [...movimentos]
    .reverse()
    .map((m) => ({
      time: new Date(m.data_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      "Horizontal (H)": m.angulo_horizontal,
      "Ganho de Elevação (V)": parseFloat((m.angulo_vertical * 0.5).toFixed(1))
    }));

  const LDRValues = planta?.leitura_ldrs || {};

  const panAngle = planta?.angulo_horizontal ?? 90;
  const elevationMM = (planta?.angulo_vertical ?? 0) * 0.5;
  
  // Rotação do eixo no modelo 2D projetada trigonometricamente:
  // À medida que o Pan gira (0 a 180 graus), projetamos a largura do cabeçote e a distância
  // horizontal entre os LDRs usando a função Seno para dar a ilusão tridimensional de rotação.
  const panRad = (panAngle * Math.PI) / 180;
  const ldrOffset = 30 * Math.sin(panRad);
  const headWidth = 60 + 40 * Math.sin(panRad);
  const headX = 400 - headWidth / 2;
  const gearOffset = panAngle * 1.5;
  const pinionOffset = -gearOffset * (36 / 14);

  return (
    <div className="planta-page animate-fade-in">
      <div className="grid-planta-layout">
        
        {/* Lado Esquerdo: Simulador e Estado em Tempo Real */}
        <div className="left-side">
          {/* Planta Biomimética Live Preview */}
          <div className="glass-card preview-card">
            <div className="preview-header">
              <h3>Comportamento em Tempo Real</h3>
              <span className="live-pill">LIVE SIMULAÇÃO</span>
            </div>

            <div className="simulator-container">
              <svg viewBox="0 -270 800 1110" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                {/* Grade de fundo */}
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(88, 166, 255, 0.04)" strokeWidth="1" />
                  </pattern>
                  <linearGradient id="beam-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffd33d" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ffd33d" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <rect x="0" y="-270" width="800" height="1110" fill="url(#grid)" />

                {/* Linha guia vertical */}
                <line x1="400" y1="-260" x2="400" y2="700" stroke="#58a6ff" strokeWidth="2" strokeDasharray="6, 6" opacity="0.25" />

                {/* ESTRUTURA DA TORRE */}
                <g>
                  
                  {/* Engrenagem da coroa */}
                  <g className="gear-crown">
                    <rect x="330" y="665" width="140" height="15" fill="#1f6feb" rx="2" />
                    <line 
                      x1="330" 
                      y1="672.5" 
                      x2="470" 
                      y2="672.5" 
                      stroke="#c9d1d9" 
                      strokeWidth="16" 
                      strokeDasharray="6, 4" 
                      strokeDashoffset={gearOffset}
                      style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)" }}
                      opacity="0.8" 
                    />
                  </g>

                  {/* Rolamento superior */}
                  <rect x="370" y="680" width="60" height="10" fill="#c9d1d9" rx="2" />

                  {/* Corpo da torre */}
                  <g className="tower-body">
                    <path d="M 360 465 L 440 465 L 440 665 L 360 665 Z" fill="rgba(31, 111, 235, 0.12)" stroke="#58a6ff" strokeWidth="3" />
                    <line x1="360" y1="465" x2="440" y2="665" stroke="#58a6ff" strokeWidth="1" opacity="0.4" />
                    <line x1="440" y1="465" x2="360" y2="665" stroke="#58a6ff" strokeWidth="1" opacity="0.4" />
                    <rect x="375" y="490" width="50" height="35" fill="#161b22" stroke="#30363d" strokeWidth="2" rx="4" />
                    <rect x="385" y="640" width="30" height="25" fill="#0366d6" />
                  </g>

                  {/* CONJUNTO DA HASTE E CABEÇOTE (Desliza verticalmente) */}
                  <g style={{
                    transform: `translateY(${- elevationMM * 2.5}px)`,
                    transition: "transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)"
                  }}>
                    {/* Haste sem-fim */}
                    <rect x="380" y="160" width="40" height="460" fill="#28a745" rx="2" />
                    <rect x="388" y="160" width="24" height="450" fill="#0d1117" />
                    <rect x="396" y="170" width="8" height="440" fill="#8b949e" />
                    <line x1="396" y1="170" x2="404" y2="610" stroke="#6e7681" strokeWidth="6" strokeDasharray="2, 2" />

                    {/* Feixe luminoso de rastreamento */}
                    {planta?.direcao_luz && planta.direcao_luz !== "Nenhuma" && (
                      <polygon points="370,70 340,-250 460,-250 430,70" fill="url(#beam-grad)" opacity="0.35" />
                    )}

                    {/* Cabeçote dos sensores */}
                    <rect x={headX} y="80" width={headWidth} height="20" fill="#d73a49" rx="4" style={{ transition: "x 0.8s, width 0.8s" }} />
                    <rect x="390" y="100" width="20" height="60" fill="#d73a49" />
                    
                    {/* Lentes LDRs */}
                    <circle cx={400 - ldrOffset} cy="70" r="9" fill="#ffd33d" stroke="#f59e0b" strokeWidth="2" style={{ transition: "cx 0.8s" }} />
                    <circle cx={400 - ldrOffset} cy="70" r="3" fill="#0d1117" style={{ transition: "cx 0.8s" }} />
                    
                    <circle cx={400 + ldrOffset} cy="70" r="9" fill="#ffd33d" stroke="#f59e0b" strokeWidth="2" style={{ transition: "cx 0.8s" }} />
                    <circle cx={400 + ldrOffset} cy="70" r="3" fill="#0d1117" style={{ transition: "cx 0.8s" }} />

                    <text x="400" y="93" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">LDRs</text>
                  </g>

                </g>

                {/* BASE E SERVOMOTORES */}
                <g>
                  <rect x="370" y="690" width="60" height="10" fill="#8b949e" rx="1" />
                  <path d="M 250 710 L 550 710 L 550 820 L 530 820 L 530 730 L 270 730 L 270 820 L 250 820 Z" fill="#484f58" />
                  <rect x="360" y="700" width="80" height="20" fill="#30363d" />

                  {/* Micro servo SG90 */}
                  <rect x="470" y="720" width="40" height="60" fill="#0366d6" rx="4" />
                  <rect x="460" y="730" width="60" height="10" fill="#0366d6" />
                  <rect x="485" y="680" width="10" height="40" fill="#c9d1d9" />

                  {/* Pinhão do servo */}
                  <g>
                    <rect x="465" y="665" width="50" height="15" fill="#1f6feb" rx="2" />
                    <line 
                      x1="465" 
                      y1="672.5" 
                      x2="515" 
                      y2="672.5" 
                      stroke="#c9d1d9" 
                      strokeWidth="16" 
                      strokeDasharray="6, 4" 
                      strokeDashoffset={pinionOffset}
                      style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)" }}
                      opacity="0.8" 
                    />
                  </g>
                </g>

                {/* Painel esquemático de ângulos */}
                <rect x="20" y="-40" width="220" height="85" rx="8" fill="rgba(22, 27, 34, 0.85)" stroke="#30363d" strokeWidth="1.5" />
                <text x="35" y="-18" fill="#58a6ff" fontSize="11" fontFamily="monospace" fontWeight="bold">PAN (Horizontal):</text>
                <text x="170" y="-18" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="bold">{(planta?.angulo_horizontal ?? 90)}°</text>
                <text x="35" y="0" fill="#34d399" fontSize="11" fontFamily="monospace" fontWeight="bold">ELEVAÇÃO:</text>
                <text x="170" y="0" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="bold">{elevationMM.toFixed(1)} mm</text>
                <text x="35" y="18" fill="#ff7b72" fontSize="10" fontFamily="monospace">Alinhamento: {planta?.direcao_luz || "Nenhum"}</text>
              </svg>
            </div>

            <div className="preview-footer">
              <p>Representação esquemática do rastreador óptico biomimético. A torre realiza a rotação no eixo (Pan) e a haste desliza verticalmente (Ganho de Elevação) buscando a maior fonte de luminosidade (LDRs).</p>
            </div>
          </div>
        </div>

        {/* Lado Direito: Métricas e Sensores de Direção */}
        <div className="right-side">
          {/* Ficha Técnica da Planta */}
          <div className="glass-card status-card">
            <div className="card-header">
              <h3>Indicadores dos Servomotores</h3>
              <button 
                onClick={handleRefresh} 
                className={`btn-refresh ${isRefreshing ? "spin" : ""}`}
                title="Sincronizar Ângulos"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="metric-row">
              <div className="metric-box border-h">
                <Compass size={24} className="text-primary" />
                <div className="metric-info">
                  <span className="metric-label">Ângulo Horizontal (Pan)</span>
                  <span className="metric-val">{planta?.angulo_horizontal ?? "--"}°</span>
                </div>
              </div>

              <div className="metric-box border-v">
                <Navigation size={24} className="text-info" />
                <div className="metric-info">
                  <span className="metric-label">Ganho de Elevação</span>
                  <span className="metric-val">
                    {planta?.angulo_vertical !== undefined && planta?.angulo_vertical !== null 
                      ? (planta.angulo_vertical * 0.5).toFixed(1) 
                      : "--"} mm
                  </span>
                </div>
              </div>
            </div>

            <div className="metric-details">
              <div className="detail-item">
                <span>Direção do Foco de Luz</span>
                <strong>{planta?.direcao_luz || "Nenhuma"}</strong>
              </div>
              <div className="detail-item">
                <span>Status Operacional</span>
                <span className={`badge ${planta?.status === "Ativa" ? "badge-success" : "badge-danger"}`}>
                  {planta?.status || "INATIVA"}
                </span>
              </div>
              <div className="detail-item">
                <span>Estado dos Servos</span>
                <span className="badge badge-info">{planta?.status_servomotores || "INATIVO"}</span>
              </div>
            </div>
          </div>

          {/* LDR Readings Card */}
          <div className="glass-card ldr-card">
            <h3>Sensores de Luminosidade (LDRs da Planta)</h3>
            <p className="section-desc">Leituras direcionais de luminosidade na cúpula da planta</p>
            
            <div className="ldr-grid">
              {Object.entries(LDRValues).map(([name, val]: any) => (
                <div key={name} className="ldr-box">
                  <span className="ldr-name">{name}</span>
                  <span className="ldr-val">{val} <span className="val-unit">Lux</span></span>
                </div>
              ))}
              {Object.keys(LDRValues).length === 0 && (
                <div className="no-ldr">Sem sensores LDR vinculados à planta robótica.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Seção Inferior: Histórico de Movimento (Gráficos e Tabela) */}
      <div className="grid-planta-history">
        {/* Gráficos de Trajetória */}
        <div className="glass-card trajectory-card">
          <div className="chart-header">
            <History size={20} className="text-primary" />
            <div>
              <h4>Trajetória de Movimentação</h4>
              <span>Histórico de rotação e inclinação da planta biomimética</span>
            </div>
          </div>
          <div className="chart-body">
            {graphData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    formatter={(value: any, name: any) => {
                      if (name === "Horizontal (H)") return [`${value}°`, name];
                      if (name === "Ganho de Elevação (V)") return [`${value} mm`, name];
                      return [value, name];
                    }} 
                    contentStyle={{ fontSize: '11px', borderRadius: '8px' }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="Horizontal (H)" stroke="#2e7d32" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Ganho de Elevação (V)" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">Nenhum movimento registrado.</div>
            )}
          </div>
        </div>

        {/* Tabela de Logs de Movimento */}
        <div className="glass-card log-card">
          <h3>Log de Eventos de Movimento</h3>
          <div className="log-table-container">
            <table className="log-table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Horizontal (H)</th>
                  <th>Ganho de Elevação (V)</th>
                  <th>Direção da Luz</th>
                </tr>
              </thead>
              <tbody>
                {movimentos.slice(0, 10).map((m) => (
                  <tr key={m.id_movimento}>
                    <td>{new Date(m.data_hora).toLocaleTimeString()}</td>
                    <td>{m.angulo_horizontal}°</td>
                    <td>{(m.angulo_vertical * 0.5).toFixed(1)} mm</td>
                    <td>
                      <span className="badge badge-info" style={{ textTransform: 'none' }}>
                        {m.direcao_luz || "Nenhuma"}
                      </span>
                    </td>
                  </tr>
                ))}
                {movimentos.length === 0 && (
                  <tr>
                    <td colSpan={4} className="no-logs">Nenhum evento registrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        .planta-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .grid-planta-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        @media (max-width: 992px) {
          .grid-planta-layout {
            grid-template-columns: 1fr;
          }
        }

        .preview-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .live-pill {
          background: rgba(16, 185, 129, 0.1);
          color: var(--success);
          border: 1px solid rgba(16, 185, 129, 0.2);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.6rem;
          border-radius: 50px;
          animation: pulse-green 1.5s infinite;
        }

        /* Blueprint Simulator Visualizer */
        .simulator-container {
          flex: 1;
          height: 350px;
          position: relative;
          background: #0d1117;
          border-radius: var(--radius-sm);
          border: 1px solid #30363d;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 4px 20px rgba(0,0,0,0.5);
        }

        .preview-footer {
          margin-top: 1rem;
          background: #f8fafc;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          color: var(--text-muted);
          line-height: 1.4;
          border: 1px dashed var(--border-color);
        }

        /* Servomotores Indicators */
        .status-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .btn-refresh {
          background: #f1f5f9;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          cursor: pointer;
          transition: var(--transition);
        }

        .btn-refresh:hover {
          background: #e2e8f0;
          color: var(--primary);
        }

        .btn-refresh.spin svg {
          animation: spin 0.6s linear;
        }

        .metric-row {
          display: flex;
          gap: 1rem;
        }

        .metric-box {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          border-left: 4px solid;
        }

        .border-h { border-left-color: var(--primary); }
        .border-v { border-left-color: var(--info); }

        .metric-info {
          display: flex;
          flex-direction: column;
        }

        .metric-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .metric-val {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-main);
          margin-top: 0.1rem;
        }

        .metric-details {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          background: #f8fafc;
          padding: 1rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .detail-item span {
          color: var(--text-muted);
        }

        .detail-item strong {
          color: var(--text-main);
        }

        /* LDR Card */
        .ldr-card {
          margin-top: 1.5rem;
          padding: 1.5rem;
        }

        .ldr-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .ldr-box {
          background: #f8fafc;
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.25rem;
        }

        .ldr-name {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .ldr-val {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--primary-dark);
        }

        .no-ldr {
          grid-column: 1 / -1;
          text-align: center;
          padding: 1rem;
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        /* Lower Section: History */
        .grid-planta-history {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 1.5rem;
          margin-top: 1.5rem;
        }

        @media (max-width: 992px) {
          .grid-planta-history {
            grid-template-columns: 1fr;
          }
        }

        .trajectory-card {
          padding: 1.5rem;
        }

        .log-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
        }

        .log-table-container {
          flex: 1;
          overflow-y: auto;
          overflow-x: auto;
          max-height: 250px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          margin-top: 1rem;
        }

        .log-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.85rem;
        }

        .log-table th {
          background: #f8fafc;
          padding: 0.75rem 1rem;
          font-weight: 600;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
        }

        .log-table td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .log-table tr:hover td {
          background: #f8fafc;
        }

        .no-logs {
          text-align: center;
          padding: 2rem !important;
          color: var(--text-muted);
        }

        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        @keyframes hover-sun {
          0% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0); }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 576px) {
          .metric-row {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
};
