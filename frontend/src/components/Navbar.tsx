import React, { useState } from "react";
import { Bell, Wifi, WifiOff, AlertTriangle, CheckCircle, Menu } from "lucide-react";

interface NavbarProps {
  title: string;
  subtitle: string;
  wsConnected: boolean;
  alerts: any[];
  clearAlerts: () => void;
  onToggleMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  title,
  subtitle,
  wsConnected,
  alerts,
  clearAlerts,
  onToggleMobileSidebar
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="navbar glass-card">
      <button className="mobile-menu-btn" onClick={onToggleMobileSidebar} title="Menu">
        <Menu size={24} />
      </button>
      <div className="navbar-title-section">
        <h1 className="navbar-title">{title}</h1>
        <span className="navbar-subtitle">{subtitle}</span>
      </div>

      <div className="navbar-actions">
        {/* Status de Conexão WebSocket */}
        <div className={`status-indicator ${wsConnected ? "connected" : "disconnected"}`} title={wsConnected ? "Conexão de Tempo Real Ativa" : "Conectando ao Servidor..."}>
          {wsConnected ? (
            <>
              <Wifi size={16} />
              <span>Real-Time</span>
            </>
          ) : (
            <>
              <WifiOff size={16} className="animate-pulse" />
              <span>Desconectado</span>
            </>
          )}
        </div>

        {/* Central de Notificações */}
        <div className="notifications-container">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`navbar-btn ${alerts.length > 0 ? "has-alerts" : ""}`}
            title="Alertas de Sensores"
          >
            <Bell size={20} />
            {alerts.length > 0 && <span className="alert-count">{alerts.length}</span>}
          </button>

          {showNotifications && (
            <div className="notifications-dropdown glass-card">
              <div className="dropdown-header">
                <h3>Alertas em Tempo Real</h3>
                {alerts.length > 0 && (
                  <button onClick={clearAlerts} className="clear-btn">Limpar</button>
                )}
              </div>
              <div className="dropdown-body">
                {alerts.length === 0 ? (
                  <div className="empty-alerts">
                    <CheckCircle size={24} className="success-icon" />
                    <p>Nenhuma anomalia detectada. Sistema operacional está normal.</p>
                  </div>
                ) : (
                  <ul className="alerts-list">
                    {alerts.map((alerta, index) => (
                      <li key={index} className={`alert-item ${alerta.nivel || "warning"}`}>
                        <AlertTriangle size={16} className="alert-icon" />
                        <div className="alert-content">
                          <p className="alert-message">{alerta.mensagem}</p>
                          <span className="alert-time">
                            {new Date(alerta.data_hora).toLocaleTimeString()}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .navbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.2rem 2.2rem;
          margin-bottom: 0.5rem;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(14px) saturate(120%);
          -webkit-backdrop-filter: blur(14px) saturate(120%);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 8px 32px rgba(31, 38, 135, 0.02), 0 1px 2px rgba(0, 0, 0, 0.01);
          position: relative;
          z-index: 99; /* Garante que fique acima dos cards do dashboard, mas abaixo da sidebar (z-index 100) */
        }

        .navbar-title-section {
          display: flex;
          flex-direction: column;
        }

        .navbar-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--primary-dark);
          line-height: 1.2;
        }

        .navbar-subtitle {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.85rem;
          border-radius: 50px;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .status-indicator.connected {
          background: rgba(16, 185, 129, 0.12);
          color: #065f46;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .status-indicator.disconnected {
          background: rgba(239, 68, 68, 0.12);
          color: #991b1b;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .navbar-btn {
          position: relative;
          background: #f1f5f9;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-main);
          cursor: pointer;
          transition: var(--transition);
        }

        .navbar-btn:hover {
          background: #e2e8f0;
          color: var(--primary);
        }

        .navbar-btn.has-alerts {
          animation: pulse-bell 2s infinite;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .alert-count {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #ef4444;
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
        }

        .notifications-container {
          position: relative;
        }

        .notifications-dropdown {
          position: absolute;
          right: 0;
          top: 50px;
          width: 320px;
          padding: 1rem;
          z-index: 200;
          animation: slideDown 0.2s ease-out;
          border-radius: var(--radius-md);
          background: #ffffff;
        }

        .dropdown-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .dropdown-header h3 {
          font-size: 0.95rem;
          font-weight: 600;
        }

        .clear-btn {
          background: transparent;
          border: none;
          color: var(--primary);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
        }

        .clear-btn:hover {
          color: var(--primary-dark);
        }

        .empty-alerts {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 1.5rem 1rem;
          gap: 0.75rem;
        }

        .success-icon {
          color: var(--success);
        }

        .empty-alerts p {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .alerts-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 250px;
          overflow-y: auto;
        }

        .alert-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          line-height: 1.3;
        }

        .alert-item.danger {
          background: #fee2e2;
          color: #991b1b;
        }

        .alert-item.warning {
          background: #fef3c7;
          color: #92400e;
        }

        .alert-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .alert-content {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .alert-time {
          font-size: 0.75rem;
          opacity: 0.7;
        }

        @keyframes pulse-bell {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .mobile-menu-btn {
          display: none;
          background: transparent;
          border: none;
          color: var(--text-main);
          cursor: pointer;
          padding: 0.5rem;
          margin-right: 0.5rem;
          border-radius: var(--radius-sm);
          align-items: center;
          justify-content: center;
          transition: var(--transition);
        }

        .mobile-menu-btn:hover {
          background: #f1f5f9;
          color: var(--primary);
        }

        @media (max-width: 992px) {
          .navbar {
            padding: 1rem 1.2rem;
          }
          .mobile-menu-btn {
            display: flex;
          }
          .navbar-title {
            font-size: 1.15rem;
          }
          .navbar-subtitle {
            font-size: 0.75rem;
            max-width: 200px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        @media (max-width: 576px) {
          .navbar {
            padding: 0.8rem 1rem;
          }
          .status-indicator span {
            display: none;
          }
          .status-indicator {
            padding: 0.4rem;
          }
          .navbar-subtitle {
            display: none;
          }
          .notifications-dropdown {
            width: 280px;
            right: -60px;
          }
        }
      `}</style>
    </header>
  );
};
