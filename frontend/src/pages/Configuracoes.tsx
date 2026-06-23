import React, { useState, useEffect } from "react";
import { Cpu, Settings, Plus, CheckCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { API_BASE_URL } from "../api";

interface ConfiguracoesProps {
  onRefreshAll: () => void;
}

export const Configuracoes: React.FC<ConfiguracoesProps> = ({ onRefreshAll }) => {
  const [estufas, setEstufas] = useState<any[]>([]);
  const [micros, setMicros] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState("sensores"); // sensores, micros, estufas, limites
  
  // States para Formulários
  const [sensorNome, setSensorNome] = useState("");
  const [sensorTipo, setSensorTipo] = useState("Temperatura");
  const [sensorUnidade, setSensorUnidade] = useState("°C");
  const [sensorMicroId, setSensorMicroId] = useState("");

  const [microNome, setMicroNome] = useState("");
  const [microIp, setMicroIp] = useState("");
  const [microEstufaId, setMicroEstufaId] = useState("");

  const [estufaNome, setEstufaNome] = useState("");
  const [estufaLocal, setEstufaLocal] = useState("");
  const [estufaDesc, setEstufaDesc] = useState("");

  // Limites Alertas (Carregados e salvos dinamicamente no banco de dados SQLite do backend)
  const [limiteTempMax, setLimiteTempMax] = useState("32.0");
  const [limiteTempMin, setLimiteTempMin] = useState("18.0");
  const [limiteSoloMin, setLimiteSoloMin] = useState("40.0");
  const [limiteCO2Max, setLimiteCO2Max] = useState("800.0");

  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadEntities = () => {
    fetch(`${API_BASE_URL}/api/configuracoes`)
      .then(res => res.json())
      .then(data => {
        setEstufas(data.estufas || []);
        setMicros(data.microcontroladores || []);
        
        // Auto-select defaults
        if (data.estufas?.length > 0) setMicroEstufaId(data.estufas[0].id_estufa.toString());
        if (data.microcontroladores?.length > 0) setSensorMicroId(data.microcontroladores[0].id_microcontrolador.toString());
      })
      .catch(err => console.error("Erro ao carregar dados de cadastro:", err));
  };

  useEffect(() => {
    loadEntities();
    
    // Carregar limites salvos da API
    fetch(`${API_BASE_URL}/api/configuracoes/limites`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setLimiteTempMax(data.limiteTempMax.toString());
          setLimiteTempMin(data.limiteTempMin.toString());
          setLimiteSoloMin(data.limiteSoloMin.toString());
          setLimiteCO2Max(data.limiteCO2Max.toString());
        }
      })
      .catch(err => console.error("Erro ao obter limites da API:", err));
  }, []);

  const handleCadastroSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sensorNome || !sensorMicroId) {
      triggerStatus("error", "Por favor, preencha todos os campos do sensor.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/configuracoes/sensores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: sensorNome,
          tipo: sensorTipo,
          unidade: sensorUnidade,
          id_microcontrolador: parseInt(sensorMicroId)
        })
      });

      if (!response.ok) throw new Error("Erro ao cadastrar sensor.");
      
      triggerStatus("success", "Sensor cadastrado com sucesso!");
      setSensorNome("");
      onRefreshAll();
    } catch (err: any) {
      triggerStatus("error", err.message);
    }
  };

  const handleCadastroMicro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!microNome || !microEstufaId) {
      triggerStatus("error", "Preencha o nome e selecione a estufa do microcontrolador.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/configuracoes/microcontroladores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: microNome,
          ip: microIp,
          id_estufa: parseInt(microEstufaId)
        })
      });

      if (!response.ok) throw new Error("Erro ao cadastrar microcontrolador.");
      
      triggerStatus("success", "Microcontrolador cadastrado com sucesso!");
      setMicroNome("");
      setMicroIp("");
      loadEntities();
      onRefreshAll();
    } catch (err: any) {
      triggerStatus("error", err.message);
    }
  };

  const handleCadastroEstufa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estufaNome) {
      triggerStatus("error", "Nome da estufa é obrigatório.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/configuracoes/estufas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: estufaNome,
          localizacao: estufaLocal,
          descricao: estufaDesc
        })
      });

      if (!response.ok) throw new Error("Erro ao cadastrar estufa.");
      
      triggerStatus("success", "Nova estufa cadastrada com sucesso!");
      setEstufaNome("");
      setEstufaLocal("");
      setEstufaDesc("");
      loadEntities();
      onRefreshAll();
    } catch (err: any) {
      triggerStatus("error", err.message);
    }
  };

  const handleSalvarLimites = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/configuracoes/limites`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          limiteTempMax: parseFloat(limiteTempMax),
          limiteTempMin: parseFloat(limiteTempMin),
          limiteSoloMin: parseFloat(limiteSoloMin),
          limiteCO2Max: parseFloat(limiteCO2Max)
        })
      });

      if (!response.ok) throw new Error("Erro ao salvar limites na API.");
      
      triggerStatus("success", "Limites operacionais de alerta salvos!");
    } catch (err: any) {
      triggerStatus("error", err.message);
    }
  };

  const triggerStatus = (type: "success" | "error", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleTipoChange = (tipo: string) => {
    setSensorTipo(tipo);
    // Auto-fill friendly units
    const unitsMap: { [key: string]: string } = {
      "Temperatura": "°C",
      "UmidadeSolo": "%",
      "UmidadeAr": "%",
      "Luminosidade": "Lux",
      "CO2": "ppm",
      "Oxigenio": "%"
    };
    setSensorUnidade(unitsMap[tipo] || "");
  };

  return (
    <div className="config-page animate-fade-in">
      <div className="config-layout">
        
        {/* Menu Esquerdo de Abas Administrativas */}
        <div className="glass-card config-nav">
          <h3>Painel Administrativo</h3>
          <p className="section-desc">Gerenciamento físico e lógico do ecossistema IoT</p>
          
          <div className="sub-tab-menu">
            <button 
              onClick={() => setActiveSubTab("sensores")} 
              className={`sub-tab-btn ${activeSubTab === "sensores" ? "active" : ""}`}
            >
              <Cpu size={16} />
              <span>Cadastrar Sensores</span>
            </button>
            <button 
              onClick={() => setActiveSubTab("microcontroladores")} 
              className={`sub-tab-btn ${activeSubTab === "microcontroladores" ? "active" : ""}`}
            >
              <Settings size={16} />
              <span>Cadastrar Hardware (ESP32)</span>
            </button>
            <button 
              onClick={() => setActiveSubTab("estufas")} 
              className={`sub-tab-btn ${activeSubTab === "estufas" ? "active" : ""}`}
            >
              <Plus size={16} />
              <span>Cadastrar Estufas</span>
            </button>
            <button 
              onClick={() => setActiveSubTab("limites")} 
              className={`sub-tab-btn ${activeSubTab === "limites" ? "active" : ""}`}
            >
              <AlertTriangle size={16} />
              <span>Parâmetros de Alerta</span>
            </button>
          </div>
        </div>

        {/* Lado Direito: Formulários Ativos */}
        <div className="config-form-container">
          {statusMsg && (
            <div className={`status-banner banner-${statusMsg.type}`}>
              {statusMsg.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Form Sensores */}
          {activeSubTab === "sensores" && (
            <div className="glass-card form-card">
              <div className="form-header">
                <h3>Cadastro de Sensores</h3>
                <p>Adicione um sensor físico atrelado a um microcontrolador instalado</p>
              </div>
              <form onSubmit={handleCadastroSensor} className="custom-form">
                <div className="form-group">
                  <label>Nome do Sensor</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Sensor de Temperatura Interno DHT22"
                    value={sensorNome}
                    onChange={(e) => setSensorNome(e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Tipo de Grandeza</label>
                    <select
                      className="form-control"
                      value={sensorTipo}
                      onChange={(e) => handleTipoChange(e.target.value)}
                    >
                      <option value="Temperatura">Temperatura</option>
                      <option value="UmidadeSolo">Umidade do Solo</option>
                      <option value="UmidadeAr">Umidade do Ar</option>
                      <option value="Luminosidade">Luminosidade</option>
                      <option value="CO2">CO2</option>
                      <option value="Oxigenio">Oxigênio (O2)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Unidade de Medida</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: °C, %, Lux"
                      value={sensorUnidade}
                      onChange={(e) => setSensorUnidade(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Hardware Vinculado (ESP32)</label>
                  <select
                    className="form-control"
                    value={sensorMicroId}
                    onChange={(e) => setSensorMicroId(e.target.value)}
                  >
                    <option value="">Selecione um Microcontrolador...</option>
                    {micros.map((m) => (
                      <option key={m.id_microcontrolador} value={m.id_microcontrolador}>
                        {m.nome} (IP: {m.ip || "Sem IP"})
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary">Salvar Sensor</button>
              </form>
            </div>
          )}

          {/* Form Microcontroladores */}
          {activeSubTab === "microcontroladores" && (
            <div className="glass-card form-card">
              <div className="form-header">
                <h3>Cadastro de Hardware</h3>
                <p>Adicione um microcontrolador (ESP32) vinculado a uma estufa</p>
              </div>
              <form onSubmit={handleCadastroMicro} className="custom-form">
                <div className="form-group">
                  <label>Nome do Dispositivo</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: ESP32-Painel-Secundario"
                    value={microNome}
                    onChange={(e) => setMicroNome(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Endereço IP (Estático ou Reservado)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: 192.168.1.155"
                    value={microIp}
                    onChange={(e) => setMicroIp(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Estufa de Instalação</label>
                  <select
                    className="form-control"
                    value={microEstufaId}
                    onChange={(e) => setMicroEstufaId(e.target.value)}
                  >
                    <option value="">Selecione uma Estufa...</option>
                    {estufas.map((es) => (
                      <option key={es.id_estufa} value={es.id_estufa}>{es.nome}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary">Registrar Hardware</button>
              </form>
            </div>
          )}

          {/* Form Estufas */}
          {activeSubTab === "estufas" && (
            <div className="glass-card form-card">
              <div className="form-header">
                <h3>Cadastro de Nova Estufa</h3>
                <p>Cadastre um novo setor físico ou estufa climatizada</p>
              </div>
              <form onSubmit={handleCadastroEstufa} className="custom-form">
                <div className="form-group">
                  <label>Nome do Setor / Estufa</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Estufa Experimental Beta"
                    value={estufaNome}
                    onChange={(e) => setEstufaNome(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Localização Geográfica / Prédio</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Campus Centro, Prédio 3, Lab 12"
                    value={estufaLocal}
                    onChange={(e) => setEstufaLocal(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Descrição do Setor</label>
                  <textarea
                    rows={3}
                    className="form-control"
                    placeholder="Descreva as pesquisas ou finalidade deste setor..."
                    value={estufaDesc}
                    onChange={(e) => setEstufaDesc(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary">Criar Setor</button>
              </form>
            </div>
          )}

          {/* Limites Operacionais */}
          {activeSubTab === "limites" && (
            <div className="glass-card form-card">
              <div className="form-header">
                <h3>Parâmetros Globais de Alerta</h3>
                <p>Estipule limites numéricos para gerar notificações e alertas visuais no painel principal</p>
              </div>
              <form onSubmit={handleSalvarLimites} className="custom-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Temperatura Máxima (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-control"
                      value={limiteTempMax}
                      onChange={(e) => setLimiteTempMax(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Temperatura Mínima (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-control"
                      value={limiteTempMin}
                      onChange={(e) => setLimiteTempMin(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Umidade do Solo Mínima (%)</label>
                    <input
                      type="number"
                      step="1"
                      className="form-control"
                      value={limiteSoloMin}
                      onChange={(e) => setLimiteSoloMin(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Nível Máximo CO₂ (ppm)</label>
                    <input
                      type="number"
                      step="10"
                      className="form-control"
                      value={limiteCO2Max}
                      onChange={(e) => setLimiteCO2Max(e.target.value)}
                    />
                  </div>
                </div>

                <div className="alert-disclaimer">
                  <ShieldCheck size={18} />
                  <span>Os limites serão aplicados em tempo real às requisições provenientes dos microcontroladores.</span>
                </div>

                <button type="submit" className="btn btn-primary">Atualizar Parâmetros</button>
              </form>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .config-page {
          height: 100%;
        }

        .config-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        @media (max-width: 992px) {
          .config-layout {
            grid-template-columns: 1fr;
          }
        }

        .config-nav {
          padding: 1.5rem;
        }

        .sub-tab-menu {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 1.25rem;
        }

        .sub-tab-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.8rem 1rem;
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          transition: var(--transition);
        }

        .sub-tab-btn:hover {
          background: #f1f5f9;
          color: var(--primary);
        }

        .sub-tab-btn.active {
          background: var(--primary-glow);
          color: var(--primary-dark);
          border-color: rgba(76, 175, 80, 0.2);
        }

        .config-form-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-card {
          padding: 2rem;
        }

        .form-header {
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 1rem;
          margin-bottom: 1.5rem;
        }

        .form-header h3 {
          font-size: 1.2rem;
          font-weight: 700;
        }

        .form-header p {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 0.15rem;
        }

        .custom-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-row {
          display: flex;
          gap: 1rem;
        }

        .form-row .form-group {
          flex: 1;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-main);
        }

        /* Status Banners */
        .status-banner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.85rem 1.25rem;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          font-weight: 600;
          animation: slideDown 0.2s ease-out;
        }

        .banner-success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .banner-error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .alert-disclaimer {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: #eff6ff;
          color: #1e40af;
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-weight: 500;
          line-height: 1.4;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
