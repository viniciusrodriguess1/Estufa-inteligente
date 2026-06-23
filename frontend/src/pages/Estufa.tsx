import React, { useEffect, useState } from "react";
import { Home, Calendar, MapPin, Cpu, LayoutGrid, CheckCircle2, ShieldAlert } from "lucide-react";
import { API_BASE_URL } from "../api";

interface EstufaProps {
  estufaInfo: any;
}

export const Estufa: React.FC<EstufaProps> = ({ estufaInfo }) => {
  const [micros, setMicros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar microcontroladores associados a estufa
    fetch(`${API_BASE_URL}/api/configuracoes`)
      .then(res => res.json())
      .then(data => {
        setMicros(data.microcontroladores || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar microcontroladores:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="estufa-page animate-fade-in">
      <div className="grid-estufa-details">
        {/* Card de Ficha Técnica */}
        <div className="glass-card ficha-tecnica">
          <div className="card-header">
            <h3>Ficha Técnica da Estufa</h3>
            <span className="badge badge-success">Ativo</span>
          </div>
          
          <div className="ficha-body">
            <div className="ficha-item">
              <Home className="ficha-icon" size={20} />
              <div className="ficha-details">
                <span className="ficha-label">Nome da Estufa</span>
                <span className="ficha-value">{estufaInfo?.nome || "Estufa Inteligente"}</span>
              </div>
            </div>

            <div className="ficha-item">
              <MapPin className="ficha-icon" size={20} />
              <div className="ficha-details">
                <span className="ficha-label">Localização</span>
                <span className="ficha-value">{estufaInfo?.localizacao || "Campus Central"}</span>
              </div>
            </div>

            <div className="ficha-item">
              <Calendar className="ficha-icon" size={20} />
              <div className="ficha-details">
                <span className="ficha-label">Data de Instalação</span>
                <span className="ficha-value">
                  {estufaInfo?.data_criacao 
                    ? new Date(estufaInfo.data_criacao).toLocaleDateString()
                    : "19/06/2026"}
                </span>
              </div>
            </div>

            <div className="ficha-item">
              <Cpu className="ficha-icon" size={20} />
              <div className="ficha-details">
                <span className="ficha-label">Dispositivos Vinculados</span>
                <span className="ficha-value">{estufaInfo?.quantidade_microcontroladores || 0} Microcontroladores</span>
              </div>
            </div>

            <div className="ficha-item">
              <LayoutGrid className="ficha-icon" size={20} />
              <div className="ficha-details">
                <span className="ficha-label">Sensores Totais</span>
                <span className="ficha-value">{estufaInfo?.quantidade_sensores || 0} Sensores</span>
              </div>
            </div>
          </div>
        </div>

        {/* Descrição e Status Operacional */}
        <div className="glass-card status-operacional-card">
          <h3>Status de Operação</h3>
          <p className="estufa-desc">{estufaInfo?.descricao || "Sem descrição disponível."}</p>
          
          <div className="status-metric-box">
            <div className="metric-indicator">
              <span className="indicator-label">Status Operacional Geral</span>
              <div className="indicator-value">
                {estufaInfo?.status_operacional === "Online" ? (
                  <>
                    <CheckCircle2 size={24} className="text-success" />
                    <span className="text-success uppercase">Operando Sem Anomalias</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={24} className="text-danger" />
                    <span className="text-danger uppercase">Sem Conexão Ativa</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção Microcontroladores */}
      <div className="glass-card microcontroladores-section">
        <div className="section-header">
          <h3>Microcontroladores (ESP32 / Nódulos IoT)</h3>
          <p>Dispositivos responsáveis pela coleta local de dados e controle da planta robótica</p>
        </div>

        {loading ? (
          <div className="loading-box">Carregando dispositivos...</div>
        ) : (
          <div className="microcontroladores-grid">
            {micros.map((m) => (
              <div key={m.id_microcontrolador} className={`micro-card glass-card border-${m.status.toLowerCase()}`}>
                <div className="micro-header">
                  <div className="micro-info">
                    <h4>{m.nome}</h4>
                    <span className="micro-ip">IP: {m.ip || "Não configurado"}</span>
                  </div>
                  <span className={`badge ${
                    m.status === "Online" ? "badge-success" : 
                    m.status === "Offline" ? "badge-danger" : "badge-warning"
                  }`}>
                    {m.status}
                  </span>
                </div>
                <div className="micro-body">
                  <p><strong>Nódulo ID:</strong> #{m.id_microcontrolador}</p>
                  <p><strong>Protocolo:</strong> HTTP / WebSockets (Port: 8000)</p>
                  <p><strong>Frequência de Ingestão:</strong> ~10s</p>
                </div>
              </div>
            ))}

            {micros.length === 0 && (
              <div className="no-micros">Nenhum microcontrolador cadastrado. Vá em Configurações para cadastrar.</div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .estufa-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .grid-estufa-details {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 1.5rem;
        }

        @media (max-width: 992px) {
          .grid-estufa-details {
            grid-template-columns: 1fr;
          }
        }

        .ficha-tecnica {
          display: flex;
          flex-direction: column;
        }

        .ficha-body {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin-top: 1.25rem;
        }

        .ficha-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.5rem 0;
        }

        .ficha-icon {
          color: var(--primary);
          background: var(--primary-glow);
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          padding: 10px;
          flex-shrink: 0;
        }

        .ficha-details {
          display: flex;
          flex-direction: column;
        }

        .ficha-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .ficha-value {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
          margin-top: 0.1rem;
        }

        .status-operacional-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .estufa-desc {
          font-size: 0.95rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin-top: 1rem;
        }

        .status-metric-box {
          background: #f8fafc;
          border-radius: var(--radius-sm);
          padding: 1.25rem;
          margin-top: 1.5rem;
          border: 1px solid var(--border-color);
        }

        .indicator-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .indicator-value {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.1rem;
          font-weight: 700;
          margin-top: 0.5rem;
        }

        /* Microcontroladores Section */
        .microcontroladores-section {
          padding: 2rem;
        }

        .microcontroladores-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }

        .micro-card {
          padding: 1.25rem;
          border-left: 5px solid;
        }

        .micro-card.border-online { border-left-color: var(--success); }
        .micro-card.border-offline { border-left-color: var(--danger); }
        .micro-card.border-manutencao { border-left-color: var(--warning); }

        .micro-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .micro-info h4 {
          font-size: 1rem;
          font-weight: 700;
        }

        .micro-ip {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-family: monospace;
          margin-top: 0.15rem;
          display: block;
        }

        .micro-body {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .loading-box, .no-micros {
          text-align: center;
          padding: 2rem;
          color: var(--text-muted);
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};
