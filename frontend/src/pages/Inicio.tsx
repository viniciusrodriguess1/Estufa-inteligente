import React from "react";
import { 
  ArrowRight, 
  Flower2, 
  Cpu, 
  History, 
  Bell, 
  Leaf, 
  Activity 
} from "lucide-react";

interface InicioProps {
  onNavigateToAuth: (mode: "login" | "register") => void;
}

export const Inicio: React.FC<InicioProps> = ({ onNavigateToAuth }) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="inicio-wrapper">
      {/* Top Bar / Header */}
      <header className="inicio-header glass-card">
        <div className="header-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <Flower2 size={26} className="logo-icon" />
          <span className="logo-text">Estufa <span>Inteligente</span></span>
        </div>

        <nav className="header-nav">
          <button onClick={() => scrollToSection("sobre")} className="nav-item">Sobre</button>
          <button onClick={() => scrollToSection("funcionamento")} className="nav-item">Como Funciona</button>
          <button onClick={() => scrollToSection("objetivos")} className="nav-item">Objetivos</button>
        </nav>

        <div className="header-actions">
          <button onClick={() => onNavigateToAuth("login")} className="btn-login-header">
            Entrar
          </button>
          <button onClick={() => onNavigateToAuth("register")} className="btn btn-primary btn-signup-header">
            Cadastrar-se <ArrowRight size={16} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge animate-fade-in">
            <Leaf size={14} /> Tecnologia Sustentável & Robótica
          </div>
          <h1 className="hero-title animate-fade-in">
            O futuro da automação agrícola integrada ao <span>biomimetismo</span>
          </h1>
          <p className="hero-description animate-fade-in">
            Monitore variáveis ambientais da estufa em tempo real e demonstre reações vegetais complexas de fototropismo e crescimento por meio de simulação mecânica biomimética avançada.
          </p>
          <div className="hero-buttons animate-fade-in">
            <button onClick={() => onNavigateToAuth("login")} className="btn btn-primary hero-btn-primary">
              Acessar o Painel <ArrowRight size={18} />
            </button>
            <button onClick={() => scrollToSection("sobre")} className="btn hero-btn-secondary">
              Conhecer o Projeto
            </button>
          </div>
        </div>
        
        {/* Animated Visual Hero Card */}
        <div className="hero-visual animate-fade-in">
          <div className="visual-card glass-card">
            <div className="visual-plant-icon">
              <Flower2 size={64} className="icon-pulse" />
            </div>
            <div className="visual-metrics">
              <div className="v-metric">
                <span className="v-label">Temperatura</span>
                <span className="v-val">24.5 °C</span>
              </div>
              <div className="v-metric">
                <span className="v-label">Umidade Solo</span>
                <span className="v-val">68.2 %</span>
              </div>
              <div className="v-metric">
                <span className="v-label">Luminosidade</span>
                <span className="v-val">580 Lux</span>
              </div>
            </div>
            <div className="visual-status">
              <span className="status-dot"></span>
              <span>ESP32 Estufa Conectada</span>
            </div>
          </div>
        </div>
      </section>

      {/* About Section ("Sobre") */}
      <section id="sobre" className="section-sobre">
        <div className="section-container">
          <div className="section-tag">SOBRE O PROJETO</div>
          <h2 className="section-title">O que é a Estufa Inteligente?</h2>
          <div className="sobre-grid">
            <div className="sobre-text">
              <p>
                O presente projeto tem como objetivo o desenvolvimento de um sistema baseado no microcontrolador <strong>ESP32</strong> capaz de simular o comportamento de uma planta, incluindo aspectos como o fototropismo (orientação à luz), o crescimento vertical e movimentos suaves e contínuos que remetam a um comportamento natural.
              </p>
              <p>
                O ecossistema realiza o monitoramento prático de parâmetros ambientais cruciais (como temperatura, umidade e luminosidade) coletados e processados localmente.
              </p>
              <p>
                A plataforma foi desenhada para auxiliar em aulas de biologia em escolas ou universidades, permitindo ao professor tanto demonstrar na prática os dados de uma estufa quanto ilustrar reações vegetais difíceis de visualizar no tempo da aula convencional (como processos muito lentos, a exemplo do crescimento e dobramentos foliares gradativos).
              </p>
            </div>
            <div className="sobre-stats">
              <div className="stat-card glass-card">
                <h3>6+</h3>
                <p>Sensores Ambientais em Tempo Real</p>
              </div>
              <div className="stat-card glass-card">
                <h3>100%</h3>
                <p>Monitoramento e Gráficos de Histórico</p>
              </div>
              <div className="stat-card glass-card">
                <h3>2 Eixos</h3>
                <p>Movimentação da Planta Biomimética</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section ("Como Funciona") */}
      <section id="funcionamento" className="section-features">
        <div className="section-container">
          <div className="section-tag">COMO FUNCIONA</div>
          <h2 className="section-title">Tecnologias Integradas</h2>
          
          <div className="features-grid">
            <div className="feature-card glass-card">
              <div className="feature-icon icon-cyan">
                <Cpu size={24} />
              </div>
              <h3>Coleta com ESP32</h3>
              <p>O hardware baseado em microcontroladores coleta e envia dados ambientais de forma concorrente utilizando requisições HTTP e WebSockets.</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon icon-green">
                <Activity size={24} />
              </div>
              <h3>Tempo Real Conectado</h3>
              <p>O painel de monitoramento se conecta via WebSockets ao servidor, exibindo atualizações nos widgets e logs de sensores sem recarregar a página.</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon icon-yellow">
                <Flower2 size={24} />
              </div>
              <h3>Heliotropismo Robótico</h3>
              <p>A planta rastreia a luz local orientando os servomotores, e suas folhas murcham de forma reativa a baixas taxas de umidade.</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon icon-purple">
                <History size={24} />
              </div>
              <h3>Análise de Dados</h3>
              <p>Todos os registros são consolidados no banco de dados, possibilitando a geração de gráficos de tendências de 24h, 7 dias e 30 dias.</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon icon-red">
                <Bell size={24} />
              </div>
              <h3>Limites e Alertas</h3>
              <p>O sistema gera notificações de segurança instantâneas caso a temperatura, umidade do solo ou níveis de gases fiquem fora dos limites seguros.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Objectives Section ("Objetivos") */}
      <section id="objetivos" className="section-objectives">
        <div className="section-container">
          <div className="section-tag">OBJETIVOS</div>
          <h2 className="section-title">Nossas Metas Científicas</h2>
          
          <div className="objectives-list">
            <div className="objective-item glass-card">
              <div className="obj-number">01</div>
              <div className="obj-content">
                <h4>Simulação de Movimentos Naturais</h4>
                <p>Desenvolver um sistema reativo embarcado em ESP32 capaz de traduzir estímulos luminosos e térmicos em movimentos biológicos contínuos de fototropismo e alongamento mecânico.</p>
              </div>
            </div>

            <div className="objective-item glass-card">
              <div className="obj-number">02</div>
              <div className="obj-content">
                <h4>Ensino Prático de Biologia</h4>
                <p>Auxiliar docentes em escolas e universidades na demonstração prática de conceitos ecológicos e de sensibilidade vegetal de forma altamente visual.</p>
              </div>
            </div>

            <div className="objective-item glass-card">
              <div className="obj-number">03</div>
              <div className="obj-content">
                <h4>Aceleração Temporal Didática</h4>
                <p>Evidenciar em tempo de aula fenômenos biológicos de escala temporal estendida (como o crescimento e reações de heliotropismo), facilitando a absorção do conteúdo pelos estudantes.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="inicio-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Flower2 size={24} className="logo-icon" />
            <span>Estufa Inteligente</span>
          </div>
          <p className="footer-copy">&copy; {new Date().getFullYear()} - Sistema IoT e Planta Robótica Biomimética.</p>
        </div>
      </footer>

      <style>{`
        .inicio-wrapper {
          width: 100%;
          min-height: 100vh;
          background: linear-gradient(135deg, #f0fdf4 0%, #f8fafc 50%, #f1f5f9 100%);
          display: flex;
          flex-direction: column;
          overflow-x: hidden;
        }

        /* Header / Top Bar */
        .inicio-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 3rem;
          margin: 1.5rem 3rem 0;
          border-radius: var(--radius-md);
          position: sticky;
          top: 1.5rem;
          z-index: 1000;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.6);
        }

        .header-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .logo-text {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-main);
          letter-spacing: -0.02em;
        }

        .logo-text span {
          color: var(--primary-dark);
        }

        .header-nav {
          display: flex;
          gap: 2rem;
        }

        .nav-item {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          position: relative;
          padding: 0.25rem 0;
        }

        .nav-item:hover {
          color: var(--primary-dark);
        }

        .nav-item::after {
          content: "";
          position: absolute;
          width: 0;
          height: 2px;
          bottom: 0;
          left: 0;
          background-color: var(--primary);
          transition: var(--transition);
        }

        .nav-item:hover::after {
          width: 100%;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .btn-login-header {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-sm);
          transition: var(--transition);
        }

        .btn-login-header:hover {
          color: var(--primary-dark);
          background: rgba(22, 163, 74, 0.05);
        }

        .btn-signup-header {
          padding: 0.6rem 1.25rem;
          font-size: 0.85rem;
          border-radius: var(--radius-sm);
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.15);
        }

        /* Hero Section */
        .hero-section {
          padding: 6rem 6rem 4rem;
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 4rem;
          align-items: center;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        .hero-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1.5rem;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.85rem;
          background: rgba(34, 197, 94, 0.1);
          color: var(--primary-dark);
          font-size: 0.8rem;
          font-weight: 700;
          border-radius: 50px;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .hero-title {
          font-size: 3rem;
          line-height: 1.15;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.03em;
        }

        .hero-title span {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-description {
          font-size: 1.1rem;
          line-height: 1.6;
          color: var(--text-muted);
          max-width: 580px;
        }

        .hero-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .hero-btn-primary {
          padding: 0.85rem 1.75rem;
          font-size: 1rem;
          border-radius: var(--radius-sm);
        }

        .hero-btn-secondary {
          background: #ffffff;
          border: 1px solid var(--border-color);
          color: var(--text-main);
          padding: 0.85rem 1.75rem;
          font-size: 1rem;
          border-radius: var(--radius-sm);
        }

        .hero-btn-secondary:hover {
          background: #f8fafc;
          border-color: var(--primary-light);
        }

        .hero-visual {
          display: flex;
          justify-content: center;
        }

        .visual-card {
          width: 320px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 253, 244, 0.8) 100%);
          border-radius: var(--radius-lg);
          box-shadow: 0 30px 60px rgba(22, 163, 74, 0.08);
        }

        .visual-plant-icon {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: var(--primary-glow);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary-light);
          border: 2px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 10px 20px rgba(22, 163, 74, 0.1);
        }

        .icon-pulse {
          animation: pulse-icon 2.5s infinite ease-in-out;
        }

        .visual-metrics {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          border-top: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
          padding: 1rem 0;
        }

        .v-metric {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .v-label { color: var(--text-muted); }
        .v-val { color: var(--text-main); font-weight: 700; }

        .visual-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: #065f46;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--success);
          animation: pulse-green 1.5s infinite;
        }

        /* Global Sections Config */
        .section-container {
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        .section-tag {
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--primary-dark);
          margin-bottom: 0.5rem;
        }

        .section-title {
          font-size: 2.2rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 2.5rem;
          letter-spacing: -0.02em;
        }

        /* Section Sobre */
        .section-sobre {
          padding: 6rem 3rem;
          background: rgba(255, 255, 255, 0.4);
          border-top: 1px solid rgba(226, 232, 240, 0.5);
          border-bottom: 1px solid rgba(226, 232, 240, 0.5);
        }

        .sobre-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 3.5rem;
          align-items: center;
        }

        .sobre-text {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          font-size: 1.05rem;
          line-height: 1.6;
          color: var(--text-muted);
        }

        .sobre-stats {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .stat-card {
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          background: #ffffff;
          border-radius: var(--radius-md);
        }

        .stat-card h3 {
          font-size: 2.2rem;
          font-weight: 800;
          color: var(--primary-dark);
          min-width: 80px;
        }

        .stat-card p {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-muted);
          line-height: 1.3;
        }

        /* Section Features */
        .section-features {
          padding: 6rem 3rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .feature-card {
          padding: 2.5rem 2rem;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: flex-start;
          border-radius: var(--radius-lg);
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-cyan { background: #ecfeff; color: #0891b2; }
        .icon-green { background: #f0fdf4; color: #16a34a; }
        .icon-yellow { background: #fffbeb; color: #d97706; }
        .icon-purple { background: #faf5ff; color: #7c3aed; }
        .icon-red { background: #fef2f2; color: #dc2626; }

        .feature-card h3 {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .feature-card p {
          font-size: 0.9rem;
          line-height: 1.5;
          color: var(--text-muted);
        }

        /* Section Objectives */
        .section-objectives {
          padding: 6rem 3rem;
          background: rgba(255, 255, 255, 0.4);
          border-top: 1px solid rgba(226, 232, 240, 0.5);
        }

        .objectives-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .objective-item {
          display: flex;
          gap: 2rem;
          padding: 2rem;
          background: #ffffff;
          align-items: center;
          border-radius: var(--radius-md);
        }

        .obj-number {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--primary-glow);
          background: var(--primary-glow);
          color: var(--primary-dark);
          width: 70px;
          height: 70px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .obj-content h4 {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.25rem;
        }

        .obj-content p {
          font-size: 0.95rem;
          line-height: 1.5;
          color: var(--text-muted);
        }

        /* Footer */
        .inicio-footer {
          background: #050d07;
          color: #ffffff;
          padding: 3rem;
          margin-top: auto;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          color: #ffffff;
        }

        .footer-brand svg {
          color: var(--primary-light);
        }

        .footer-copy {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.4);
        }

        /* Animations */
        @keyframes pulse-icon {
          0% { transform: scale(1); filter: drop-shadow(0 0 4px var(--primary-light)); }
          50% { transform: scale(1.05); filter: drop-shadow(0 0 15px var(--primary-light)); }
          100% { transform: scale(1); filter: drop-shadow(0 0 4px var(--primary-light)); }
        }

        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        /* Responsive Layouts */
        @media (max-width: 1024px) {
          .inicio-header {
            margin: 1rem 1.5rem 0;
            padding: 1rem 1.5rem;
          }
          .hero-section {
            padding: 4rem 2rem 2rem;
            grid-template-columns: 1fr;
            text-align: center;
            gap: 3rem;
          }
          .hero-content {
            align-items: center;
          }
          .hero-buttons {
            justify-content: center;
          }
          .sobre-grid {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
        }

        @media (max-width: 768px) {
          .header-nav {
            display: none;
          }
          .section-title {
            font-size: 1.8rem;
            margin-bottom: 2rem;
          }
          .hero-title {
            font-size: 2.2rem;
          }
          .stat-card {
            flex-direction: column;
            text-align: center;
            padding: 1.25rem;
          }
          .stat-card h3 {
            min-width: unset;
          }
          .objective-item {
            flex-direction: column;
            text-align: center;
            gap: 1.25rem;
          }
          .footer-content {
            flex-direction: column;
            gap: 1.5rem;
            text-align: center;
          }
        }

        @media (max-width: 576px) {
          .inicio-header {
            top: 0.5rem;
            margin: 0.5rem;
            border-radius: var(--radius-sm);
          }
          .btn-signup-header {
            display: none;
          }
          .hero-buttons {
            flex-direction: column;
            width: 100%;
          }
          .hero-buttons button {
            width: 100%;
          }
          .visual-card {
            width: 100%;
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};
