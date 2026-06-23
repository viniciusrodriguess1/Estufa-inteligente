import React, { useState } from "react";
import { Cpu, Search, Filter, RefreshCw } from "lucide-react";

interface SensoresProps {
  sensores: any[];
  onRefresh: () => void;
}

export const Sensores: React.FC<SensoresProps> = ({ sensores, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const getTipoLabel = (tipo: string) => {
    const labels: { [key: string]: string } = {
      "Luminosidade": "Luminosidade",
      "UmidadeSolo": "Umidade do Solo",
      "Temperatura": "Temperatura",
      "UmidadeAr": "Umidade do Ar",
      "CO2": "Dióxido de Carbono (CO2)",
      "Oxigenio": "Oxigênio (O2)"
    };
    return labels[tipo] || tipo;
  };

  // Filtrar sensores
  const filteredSensores = sensores.filter(sensor => {
    const matchesSearch = sensor.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          sensor.tipo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === "" || sensor.tipo === filterTipo;
    const matchesStatus = filterStatus === "" || sensor.status === filterStatus;
    
    return matchesSearch && matchesTipo && matchesStatus;
  });

  return (
    <div className="sensores-page animate-fade-in">
      <div className="glass-card table-section">
        {/* Controles de Filtros e Busca */}
        <div className="table-controls">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por nome ou tipo de sensor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="filters-box">
            <div className="filter-item">
              <Filter size={16} className="filter-icon" />
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="form-control filter-select"
              >
                <option value="">Todos os Tipos</option>
                <option value="Temperatura">Temperatura</option>
                <option value="UmidadeSolo">Umidade do Solo</option>
                <option value="UmidadeAr">Umidade do Ar</option>
                <option value="Luminosidade">Luminosidade</option>
                <option value="CO2">CO2</option>
                <option value="Oxigenio">Oxigênio (O2)</option>
              </select>
            </div>

            <div className="filter-item">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="form-control filter-select"
              >
                <option value="">Todos os Status</option>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
                <option value="Manutencao">Manutenção</option>
              </select>
            </div>

            <button 
              onClick={handleRefresh} 
              className={`btn btn-refresh ${isRefreshing ? "spin" : ""}`}
              title="Atualizar Dados"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Tabela de Sensores */}
        <div className="table-container">
          <table className="sensors-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Valor Atual</th>
                <th>Status</th>
                <th>Última Leitura</th>
              </tr>
            </thead>
            <tbody>
              {filteredSensores.map((sensor) => (
                <tr key={sensor.id_sensor}>
                  <td className="col-id">#{sensor.id_sensor}</td>
                  <td className="col-nome">
                    <div className="sensor-name-cell">
                      <Cpu size={16} className="sensor-icon-cell" />
                      <span>{sensor.nome}</span>
                    </div>
                  </td>
                  <td className="col-tipo">{getTipoLabel(sensor.tipo)}</td>
                  <td className="col-valor">
                    {sensor.valor_atual !== null ? (
                      <span className="value-badge">
                        {sensor.valor_atual} <span className="val-unit">{sensor.unidade}</span>
                      </span>
                    ) : (
                      <span className="no-value">Sem dados</span>
                    )}
                  </td>
                  <td className="col-status">
                    <span className={`badge ${
                      sensor.status === "Ativo" ? "badge-success" :
                      sensor.status === "Inativo" ? "badge-danger" : "badge-warning"
                    }`}>
                      {sensor.status}
                    </span>
                  </td>
                  <td className="col-atualizacao">
                    {sensor.ultima_atualizacao ? (
                      new Date(sensor.ultima_atualizacao).toLocaleString()
                    ) : (
                      "--"
                    )}
                  </td>
                </tr>
              ))}

              {filteredSensores.length === 0 && (
                <tr>
                  <td colSpan={6} className="no-records">
                    Nenhum sensor encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .sensores-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .table-section {
          padding: 1.75rem;
        }

        .table-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .search-box {
          position: relative;
          flex: 1;
          min-width: 280px;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .search-box .form-control {
          padding-left: 2.5rem;
          background: #f8fafc;
        }

        .filters-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .filter-item {
          position: relative;
          display: flex;
          align-items: center;
        }

        .filter-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .filter-select {
          padding-left: 2.25rem;
          background: #f8fafc;
          min-width: 160px;
        }

        .btn-refresh {
          background: #f1f5f9;
          border: 1px solid var(--border-color);
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          padding: 0;
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

        /* Table Design */
        .table-container {
          overflow-x: auto;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
        }

        .sensors-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.9rem;
        }

        .sensors-table th {
          background: #f8fafc;
          padding: 1rem 1.25rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.03em;
          border-bottom: 1px solid var(--border-color);
        }

        .sensors-table td {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
          color: var(--text-main);
        }

        .sensors-table tr:hover td {
          background: #f8fafc;
        }

        .col-id {
          font-family: monospace;
          color: var(--text-muted);
          font-weight: 600;
          width: 80px;
        }

        .sensor-name-cell {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          font-weight: 600;
          color: var(--primary-dark);
        }

        .sensor-icon-cell {
          color: var(--primary);
        }

        .value-badge {
          background: var(--primary-glow);
          color: var(--primary-dark);
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-sm);
          font-weight: 700;
          display: inline-block;
        }

        .val-unit {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .no-value {
          color: var(--text-muted);
          font-style: italic;
        }

        .no-records {
          text-align: center;
          padding: 3rem !important;
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
