import { useState, useEffect, useRef } from "react";
import { Sidebar } from "./components/Sidebar";
import { Navbar } from "./components/Navbar";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Estufa } from "./pages/Estufa";
import { Sensores } from "./pages/Sensores";
import { Historico } from "./pages/Historico";
import { PlantaRobotica } from "./pages/PlantaRobotica";
import { Configuracoes } from "./pages/Configuracoes";
import { Perfil } from "./pages/Perfil";
import { API_BASE_URL, WS_BASE_URL } from "./api";

// Mapeamento de títulos das páginas
const pageTitles: { [key: string]: string } = {
  dashboard: "Dashboard Principal",
  estufa: "Visão Geral da Estufa",
  sensores: "Gerenciamento de Sensores",
  historico: "Análise Histórica de Dados",
  planta: "Planta Robótica Biomimética",
  configuracoes: "Painel de Configurações",
  perfil: "Meu Perfil"
};

const pageSubtitles: { [key: string]: string } = {
  dashboard: "Principais indicadores ambientais e estado do robô",
  estufa: "Estrutura física, operabilidade e microcontroladores cadastrados",
  sensores: "Inspeção e monitoramento individual dos nós sensores",
  historico: "Gráficos de tendências e períodos de coletas passadas",
  planta: "Heliotropismo, movimentação de servomotores e foco luminoso",
  configuracoes: "Configuração do ecossistema, limite de alertas e novos cadastros",
  perfil: "Gerenciamento de conta, informações pessoais e alteração de senha"
};

function App() {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [currentPage, setCurrentPage] = useState("dashboard");
  const [estufaInfo, setEstufaInfo] = useState<any>(null);
  const [sensores, setSensores] = useState<any[]>([]);
  const [planta, setPlanta] = useState<any>(null);
  const [movimentos, setMovimentos] = useState<any[]>([]);
  const [leituras24h, setLeituras24h] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);

  // Armazenar usuário logado no localStorage
  const handleLoginSuccess = (userData: any) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleUpdateUser = (userData: any) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    if (socketRef.current) {
      socketRef.current.close();
    }
  };

  // Carregar dados iniciais da API
  const loadInitialData = async () => {
    if (!user) return;
    try {
      // 1. Carregar Info Estufa
      const resEstufa = await fetch(`${API_BASE_URL}/api/estufa`);
      if (resEstufa.ok) {
        const dataEstufa = await resEstufa.json();
        setEstufaInfo(dataEstufa);
      }

      // 2. Carregar Sensores
      const resSensores = await fetch(`${API_BASE_URL}/api/sensores`);
      if (resSensores.ok) {
        const dataSensores = await resSensores.json();
        setSensores(dataSensores);
      }

      // 3. Carregar Estado Planta
      const resPlanta = await fetch(`${API_BASE_URL}/api/planta`);
      if (resPlanta.ok) {
        const dataPlanta = await resPlanta.json();
        setPlanta(dataPlanta);
      }

      // 4. Carregar Movimentos Recentes
      const resMovimentos = await fetch(`${API_BASE_URL}/api/planta/movimentos`);
      if (resMovimentos.ok) {
        const dataMovimentos = await resMovimentos.json();
        setMovimentos(dataMovimentos);
      }

      // 5. Carregar Gráfico 24h
      const res24h = await fetch(`${API_BASE_URL}/api/historico?periodo=24h`);
      if (res24h.ok) {
        const data24h = await res24h.json();
        setLeituras24h(data24h);
      }
    } catch (err) {
      console.error("Erro ao carregar dados iniciais da API:", err);
    }
  };

  // Conectar WebSocket para dados em tempo real
  useEffect(() => {
    if (!user) return;

    loadInitialData();

    const connectWebSocket = () => {
      const ws = new WebSocket(`${WS_BASE_URL}/ws`);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket Conectado com Sucesso!");
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        if (message.event === "nova_leitura") {
          const leitura = message.data;
          
          // 1. Atualizar valor do sensor em tempo real na lista
          setSensores(prev => prev.map(s => {
            if (s.id_sensor === leitura.id_sensor) {
              return {
                ...s,
                valor_atual: leitura.valor,
                ultima_atualizacao: leitura.data_hora
              };
            }
            return s;
          }));

          // 2. Anexar à lista de leituras do gráfico de 24h
          setLeituras24h(prev => {
            const novaLeitura = {
              id_leitura: leitura.id_leitura,
              id_sensor: leitura.id_sensor,
              tipo: leitura.tipo,
              valor: leitura.valor,
              data_hora: leitura.data_hora,
              unidade: leitura.unidade
            };
            // Manter apenas as últimas 150 leituras acumuladas para performance
            const filtradas = [...prev, novaLeitura];
            if (filtradas.length > 200) {
              return filtradas.slice(filtradas.length - 200);
            }
            return filtradas;
          });
        }

        if (message.event === "novo_movimento") {
          const movimento = message.data;
          
          // 1. Atualizar ângulos atuais na planta
          setPlanta((prev: any) => prev ? {
            ...prev,
            angulo_horizontal: movimento.angulo_horizontal,
            angulo_vertical: movimento.angulo_vertical,
            direcao_luz: movimento.direcao_luz
          } : null);

          // 2. Prepend no log de movimentos
          setMovimentos(prev => [movimento, ...prev].slice(0, 15));
        }

        if (message.event === "alerta") {
          const alerta = message.data;
          setAlerts(prev => [alerta, ...prev]);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket Desconectado. Tentando reconectar em 5 segundos...");
        setWsConnected(false);
        setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (err) => {
        console.error("Erro no canal WebSocket:", err);
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [user]);

  const clearAlerts = () => {
    setAlerts([]);
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`app-container ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      {/* Sidebar Navegação */}
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        user={user} 
        onLogout={handleLogout} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Área Principal de Conteúdo */}
      <main className="main-content">
        <Navbar 
          title={pageTitles[currentPage]} 
          subtitle={pageSubtitles[currentPage]} 
          wsConnected={wsConnected} 
          alerts={alerts} 
          clearAlerts={clearAlerts} 
        />
        
        {/* Renderizador de Páginas */}
        {currentPage === "dashboard" && (
          <Dashboard 
            estufaInfo={estufaInfo} 
            sensores={sensores} 
            planta={planta} 
            leituras24h={leituras24h} 
            alerts={alerts} 
            setCurrentPage={setCurrentPage}
          />
        )}

        {currentPage === "estufa" && (
          <Estufa estufaInfo={estufaInfo} />
        )}

        {currentPage === "sensores" && (
          <Sensores 
            sensores={sensores} 
            onRefresh={loadInitialData} 
          />
        )}

        {currentPage === "historico" && (
          <Historico />
        )}

        {currentPage === "planta" && (
          <PlantaRobotica 
            planta={planta} 
            movimentos={movimentos} 
            onRefresh={loadInitialData} 
          />
        )}

        {currentPage === "configuracoes" && (
          <Configuracoes onRefreshAll={loadInitialData} />
        )}

        {currentPage === "perfil" && (
          <Perfil user={user} onUpdateUser={handleUpdateUser} />
        )}
      </main>
    </div>
  );
}

export default App;
