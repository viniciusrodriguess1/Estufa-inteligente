import React from "react";
import { 
  LayoutDashboard, 
  Home, 
  Cpu, 
  History, 
  Flower2, 
  Settings, 
  LogOut,
  User,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  user: any;
  onLogout: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isOpenOnMobile?: boolean;
  setIsOpenOnMobile?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentPage, 
  setCurrentPage, 
  user, 
  onLogout,
  isCollapsed,
  setIsCollapsed,
  isOpenOnMobile,
  setIsOpenOnMobile
}) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "estufa", label: "Estufa", icon: Home },
    { id: "sensores", label: "Sensores", icon: Cpu },
    { id: "historico", label: "Histórico", icon: History },
    { id: "planta", label: "Planta Robótica", icon: Flower2 },
    { id: "configuracoes", label: "Configurações", icon: Settings },
  ];

  const handleBrandClick = () => {
    const confirmSair = window.confirm("Deseja realmente sair da sua conta e voltar para a página inicial?");
    if (confirmSair) {
      onLogout();
    }
  };

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isOpenOnMobile ? "open" : ""}`}>
      <div className="sidebar-brand">
        <div 
          className="brand-logo-clickable" 
          onClick={handleBrandClick}
          title="Sair e voltar para a página inicial"
        >
          <Flower2 size={28} className="brand-icon" />
          {!isCollapsed && (
            <div className="brand-text">
              <h2>Estufa</h2>
              <span>Inteligente</span>
            </div>
          )}
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="collapse-toggle-btn"
          title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setCurrentPage(item.id);
                    if (setIsOpenOnMobile) {
                      setIsOpenOnMobile(false);
                    }
                  }}
                  className={`nav-link ${isActive ? "active" : ""}`}
                  title={isCollapsed ? item.label : ""}
                >
                  <Icon size={20} />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {user && (
        <div 
          className={`sidebar-user ${currentPage === "perfil" ? "active" : ""}`}
          onClick={() => {
            setCurrentPage("perfil");
            if (setIsOpenOnMobile) {
              setIsOpenOnMobile(false);
            }
          }}
          title={isCollapsed ? "Ver Meu Perfil" : ""}
        >
          <div className="user-info">
            <div className="user-avatar" title={isCollapsed ? user.nome : ""}>
              <User size={18} />
            </div>
            {!isCollapsed && (
              <div className="user-details">
                <p className="user-name">{user.nome}</p>
                <p className="user-email">{user.email}</p>
              </div>
            )}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation(); // Evita navegar para o perfil ao deslogar
              onLogout();
            }} 
            className="logout-btn" 
            title="Sair do Sistema"
          >
            <LogOut size={18} />
            {!isCollapsed && <span>Sair</span>}
          </button>
        </div>
      )}

      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          background: linear-gradient(180deg, var(--bg-sidebar) 0%, #050d07 100%);
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          display: flex;
          flex-direction: column;
          border-right: 1px solid rgba(255, 255, 255, 0.03);
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
          z-index: 100;
          transition: var(--transition);
        }

        .sidebar.collapsed {
          width: var(--sidebar-collapsed-width);
        }

        .sidebar-brand {
          padding: 2.2rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          position: relative;
        }

        .brand-logo-clickable {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: var(--transition);
        }

        .brand-logo-clickable:hover {
          opacity: 0.85;
          transform: scale(1.02);
        }

        .sidebar.collapsed .brand-logo-clickable {
          justify-content: center;
          width: 100%;
        }

        .sidebar.collapsed .sidebar-brand {
          padding: 2.2rem 0.5rem;
          justify-content: center;
        }

        .brand-icon {
          color: var(--primary-light);
          filter: drop-shadow(0 0 8px rgba(102, 187, 106, 0.6));
        }

        .brand-text h2 {
          color: var(--text-white);
          font-size: 1.3rem;
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.01em;
        }

        .brand-text span {
          color: rgba(255, 255, 255, 0.35);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .collapse-toggle-btn {
          position: absolute;
          right: -12px;
          top: 50%;
          transform: translateY(-50%);
          background: var(--primary);
          color: var(--text-white);
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          transition: var(--transition);
          z-index: 101;
        }

        .collapse-toggle-btn:hover {
          background: var(--primary-light);
          transform: translateY(-50%) scale(1.1);
        }

        .sidebar-nav {
          flex: 1;
          padding: 1.5rem 1rem;
          overflow-y: auto;
        }

        .sidebar.collapsed .sidebar-nav {
          padding: 1.5rem 0.5rem;
        }

        .sidebar-nav ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-link {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.85rem 1.25rem;
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          color: rgba(255, 255, 255, 0.65);
          font-size: 0.95rem;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          transition: var(--transition);
        }

        .sidebar.collapsed .nav-link {
          padding: 0.85rem;
          justify-content: center;
        }

        .nav-link:hover {
          background: var(--bg-sidebar-hover);
          color: var(--text-white);
          transform: translateX(4px);
        }

        .sidebar.collapsed .nav-link:hover {
          transform: none;
        }

        .nav-link.active {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          color: var(--text-white);
          box-shadow: 0 4px 15px rgba(46, 125, 50, 0.35);
          font-weight: 600;
        }

        .sidebar-user {
          padding: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          background: rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          cursor: pointer;
          transition: var(--transition);
        }

        .sidebar.collapsed .sidebar-user {
          padding: 1.5rem 0.5rem;
          align-items: center;
        }

        .sidebar-user:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .sidebar-user.active {
          background: rgba(46, 125, 50, 0.1);
          border-left: 3px solid var(--primary-light);
        }

        .sidebar.collapsed .sidebar-user.active {
          border-left: none;
          background: rgba(46, 125, 50, 0.2);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .sidebar.collapsed .user-info {
          justify-content: center;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--bg-sidebar-hover);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary-light);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .user-details {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          color: var(--text-white);
          font-size: 0.9rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-email {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.75rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.65rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-sm);
          color: #f87171;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }

        .sidebar.collapsed .logout-btn {
          width: auto;
          padding: 0.65rem;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          color: var(--text-white);
          border-color: #ef4444;
        }

        @media (max-width: 992px) {
          .sidebar {
            transform: translateX(-100%);
          }
          .sidebar.open {
            transform: translateX(0);
            width: 260px !important;
          }
          .collapse-toggle-btn {
            display: none !important;
          }
        }
      `}</style>
    </aside>
  );
};
