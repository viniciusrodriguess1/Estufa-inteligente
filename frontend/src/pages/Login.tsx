import React, { useState, useEffect } from "react";
import { Flower2, Eye, EyeOff, Lock, User, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "../api";

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  initialRegister?: boolean;
  onBackToInicio?: () => void;
}

export const Login: React.FC<LoginProps> = ({ 
  onLoginSuccess,
  initialRegister = false,
  onBackToInicio
}) => {
  const [emailOrMatricula, setEmailOrMatricula] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [matricula, setMatricula] = useState("");
  
  const [isRegister, setIsRegister] = useState(initialRegister);

  useEffect(() => {
    setIsRegister(initialRegister);
  }, [initialRegister]);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isRegister) {
        if (!nome.trim() || !email.trim() || !matricula.trim() || !senha.trim() || !confirmarSenha.trim()) {
          setError("Por favor, preencha todos os campos.");
          setIsLoading(false);
          return;
        }

        if (senha !== confirmarSenha) {
          setError("As senhas não coincidem.");
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            nome,
            email,
            matricula,
            senha,
            confirmar_senha: confirmarSenha
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || "Erro ao realizar cadastro.");
        }

        // Login automático após cadastro bem-sucedido
        onLoginSuccess(data.usuario);
      } else {
        if (!emailOrMatricula.trim() || !senha.trim()) {
          setError("Por favor, preencha todos os campos.");
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email_ou_matricula: emailOrMatricula,
            senha: senha
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || "Erro de login desconhecido.");
        }

        onLoginSuccess(data.usuario);
      }
    } catch (err: any) {
      setError(err.message || "Erro de conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card glass-card">
        {onBackToInicio && (
          <button 
            type="button" 
            onClick={onBackToInicio} 
            className="btn-back-home"
            title="Voltar para a página inicial"
          >
            &larr; Voltar ao Início
          </button>
        )}
        <div className="login-header">
          <div className="login-logo">
            <Flower2 size={36} className="logo-icon" />
          </div>
          <h2>{isRegister ? "Cadastro no Sistema" : "Estufa Inteligente"}</h2>
          <p>Monitoramento IoT & Planta Biomimética</p>
        </div>

        {error && (
          <div className="login-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {isRegister && (
            <div className="form-group animate-fade-in">
              <label htmlFor="name-input">Nome Completo</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  id="name-input"
                  type="text"
                  className="form-control"
                  placeholder="Seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
          )}

          {isRegister ? (
            <>
              <div className="form-group animate-fade-in">
                <label htmlFor="email-input">E-mail</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    id="email-input"
                    type="email"
                    className="form-control"
                    placeholder="exemplo@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="form-group animate-fade-in">
                <label htmlFor="matricula-input">Matrícula</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    id="matricula-input"
                    type="text"
                    className="form-control"
                    placeholder="Ex: 2026123456"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="form-group">
              <label htmlFor="user-input">Matrícula ou E-mail</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  id="user-input"
                  type="text"
                  className="form-control"
                  placeholder="Ex: 2026123456 ou admin@estufa.edu.br"
                  value={emailOrMatricula}
                  onChange={(e) => setEmailOrMatricula(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password-input">Senha</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="password-input"
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder={isRegister ? "Escolha uma senha forte" : "Insira sua senha"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div className="form-group animate-fade-in">
              <label htmlFor="confirm-password-input">Confirmar Senha</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  id="confirm-password-input"
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Repita a senha escolhida"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary login-btn" disabled={isLoading}>
            {isLoading ? (isRegister ? "Cadastrando..." : "Autenticando...") : (isRegister ? "Cadastrar Conta" : "Entrar no Sistema")}
          </button>
        </form>

        <div className="register-toggle-section">
          <button 
            type="button"
            className="btn-toggle-mode"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
              setSenha("");
              setConfirmarSenha("");
            }}
            disabled={isLoading}
          >
            {isRegister 
              ? "Já possui uma conta? Voltar ao Login" 
              : "Novo por aqui? Cadastre-se no sistema"}
          </button>
        </div>

        {!isRegister && (
          <div className="login-footer">
            <p>Utilize as credenciais padrão para testes:</p>
            <p><strong>Usuário:</strong> admin@estufa.edu.br ou 2026123456</p>
            <p><strong>Senha:</strong> admin123</p>
          </div>
        )}
      </div>

      <style>{`
        .login-wrapper {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at 10% 20%, #f0fdf4 0%, #e2e8f0 100%);
          padding: 2rem 1rem;
        }

        .btn-back-home {
          background: transparent;
          border: none;
          color: var(--primary);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 1.5rem;
          align-self: flex-start;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          transition: var(--transition);
        }

        .btn-back-home:hover {
          color: var(--primary-dark);
          transform: translateX(-2px);
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          padding: 2.5rem 3rem;
          border-radius: var(--radius-lg);
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px) saturate(140%);
          -webkit-backdrop-filter: blur(20px) saturate(140%);
          box-shadow: 0 20px 50px rgba(31, 38, 135, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.6);
          animation: fadeIn 0.4s ease-out;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-logo {
          width: 64px;
          height: 64px;
          border-radius: var(--radius-md);
          background: var(--primary-glow);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }

        .logo-icon {
          color: var(--primary);
          filter: drop-shadow(0 0 4px var(--primary));
        }

        .login-header h2 {
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--primary-dark);
        }

        .login-header p {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }

        .login-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: #fee2e2;
          color: #991b1b;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          margin-bottom: 1.5rem;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
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

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .input-with-icon .form-control {
          padding-left: 2.5rem;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .password-toggle:hover {
          color: var(--primary);
        }

        .login-btn {
          margin-top: 0.5rem;
          padding: 0.85rem;
          font-weight: 600;
          border-radius: var(--radius-sm);
        }

        .register-toggle-section {
          margin-top: 1.25rem;
          text-align: center;
        }

        .btn-toggle-mode {
          background: transparent;
          border: none;
          color: var(--primary);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          text-decoration: underline;
        }

        .btn-toggle-mode:hover {
          color: var(--primary-dark);
          transform: translateY(-1px);
        }

        .login-footer {
          margin-top: 2rem;
          border-top: 1px solid var(--border-color);
          padding-top: 1rem;
          text-align: center;
          font-size: 0.75rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .login-footer p:first-of-type {
          margin-bottom: 0.25rem;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 1.75rem 1.5rem;
          }
          .login-header h2 {
            font-size: 1.35rem;
          }
        }
      `}</style>
    </div>
  );
};
