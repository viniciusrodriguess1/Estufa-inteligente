import React, { useState } from "react";
import { User, Mail, ShieldAlert, KeyRound, Eye, EyeOff, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "../api";

interface PerfilProps {
  user: any;
  onUpdateUser: (updatedUser: any) => void;
}

export const Perfil: React.FC<PerfilProps> = ({ user, onUpdateUser }) => {
  const [nome, setNome] = useState(user.nome || "");
  const [email, setEmail] = useState(user.email || "");
  const [matricula, setMatricula] = useState(user.matricula || "");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");

  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    // Validações básicas
    if (!nome.trim() || !email.trim() || !matricula.trim()) {
      setErrorMsg("Todos os campos básicos (Nome, E-mail e Matrícula) são obrigatórios.");
      return;
    }

    if (!senhaAtual) {
      setErrorMsg("Você precisa inserir sua senha atual para confirmar as alterações.");
      return;
    }

    if (novaSenha) {
      if (novaSenha.length < 6) {
        setErrorMsg("A nova senha deve possuir pelo menos 6 caracteres.");
        return;
      }
      if (novaSenha !== confirmarNovaSenha) {
        setErrorMsg("A nova senha e a confirmação de senha não coincidem.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/usuarios/${user.id_usuario}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nome,
          email,
          matricula,
          senha_atual: senhaAtual,
          nova_senha: novaSenha || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Erro ao atualizar dados do perfil.");
      }

      setSuccessMsg("Perfil atualizado com sucesso!");
      onUpdateUser(data.usuario);
      
      // Limpar campos de senha
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarNovaSenha("");
    } catch (err: any) {
      setErrorMsg(err.message || "Não foi possível conectar ao servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="perfil-container fadeIn">
      <div className="profile-layout grid-2">
        
        {/* Card Resumo do Usuário */}
        <div className="profile-card glass-card info-card">
          <div className="avatar-large">
            <User size={48} className="avatar-icon" />
          </div>
          <h3>{user.nome}</h3>
          <p className="role-tag">Matrícula: {user.matricula}</p>
          <div className="meta-list">
            <div className="meta-item">
              <Mail size={16} />
              <span>{user.email}</span>
            </div>
            <div className="meta-item">
              <ShieldAlert size={16} />
              <span>Acesso Administrativo</span>
            </div>
          </div>
          <div className="alert-box info-box">
            <p><strong>Aviso de Segurança:</strong> Qualquer alteração em seu perfil exige a inserção de sua senha atual para validação de identidade.</p>
          </div>
        </div>

        {/* Formulário de Edição */}
        <div className="profile-card glass-card form-card">
          <h3 className="card-title">Editar Informações</h3>
          
          {successMsg && (
            <div className="message-box success-box animate-slide">
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="message-box error-box animate-slide">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-grid">
              
              <div className="form-group col-12">
                <label htmlFor="input-nome">Nome Completo</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    id="input-nome"
                    type="text"
                    className="form-control"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    disabled={isLoading}
                    placeholder="Seu nome"
                  />
                </div>
              </div>

              <div className="form-group col-6">
                <label htmlFor="input-email">Endereço de E-mail</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    id="input-email"
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    placeholder="exemplo@estufa.edu.br"
                  />
                </div>
              </div>

              <div className="form-group col-6">
                <label htmlFor="input-matricula">Número de Matrícula</label>
                <div className="input-with-icon">
                  <KeyRound size={18} className="input-icon" />
                  <input
                    id="input-matricula"
                    type="text"
                    className="form-control"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    disabled={isLoading}
                    placeholder="Ex: 2026123456"
                  />
                </div>
              </div>

              <div className="divider col-12"></div>

              <div className="section-title col-12">
                <h4>Alterar Senha</h4>
                <p>Preencha os campos abaixo apenas se desejar modificar sua senha de acesso.</p>
              </div>

              <div className="form-group col-6">
                <label htmlFor="input-nova-senha">Nova Senha</label>
                <div className="input-with-icon">
                  <KeyRound size={18} className="input-icon" />
                  <input
                    id="input-nova-senha"
                    type={showNovaSenha ? "text" : "password"}
                    className="form-control"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    disabled={isLoading}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNovaSenha(!showNovaSenha)}
                    disabled={isLoading}
                  >
                    {showNovaSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group col-6">
                <label htmlFor="input-confirmar-senha">Confirmar Nova Senha</label>
                <div className="input-with-icon">
                  <KeyRound size={18} className="input-icon" />
                  <input
                    id="input-confirmar-senha"
                    type={showConfirmarSenha ? "text" : "password"}
                    className="form-control"
                    value={confirmarNovaSenha}
                    onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                    disabled={isLoading}
                    placeholder="Digite a senha novamente"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                    disabled={isLoading}
                  >
                    {showConfirmarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="divider col-12"></div>

              <div className="form-group col-12 highlight-group">
                <label htmlFor="input-senha-atual">Senha Atual <span className="required">*</span></label>
                <div className="input-with-icon">
                  <KeyRound size={18} className="input-icon" />
                  <input
                    id="input-senha-atual"
                    type={showSenhaAtual ? "text" : "password"}
                    className="form-control"
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    disabled={isLoading}
                    placeholder="Confirme sua senha atual para salvar"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowSenhaAtual(!showSenhaAtual)}
                    disabled={isLoading}
                  >
                    {showSenhaAtual ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

            </div>

            <button type="submit" className="btn btn-primary submit-btn" disabled={isLoading}>
              <Save size={18} />
              <span>{isLoading ? "Salvando Alterações..." : "Salvar Configurações"}</span>
            </button>
          </form>
        </div>

      </div>

      <style>{`
        .perfil-container {
          padding: 1rem;
        }

        .profile-layout {
          align-items: start;
        }

        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 1.5rem;
        }

        @media (max-width: 992px) {
          .grid-2 {
            grid-template-columns: 1fr;
          }
        }

        .profile-card {
          padding: 2rem;
          border-radius: var(--radius-lg);
        }

        .info-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 253, 244, 0.8) 100%);
        }

        .avatar-large {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--primary-glow);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          border: 2px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
          margin-bottom: 1.25rem;
        }

        .info-card h3 {
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--primary-dark);
          margin-bottom: 0.25rem;
        }

        .role-tag {
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.25rem 0.75rem;
          background: rgba(27, 94, 32, 0.08);
          color: var(--primary-dark);
          border-radius: 50px;
          margin-bottom: 1.5rem;
          border: 1px solid rgba(27, 94, 32, 0.1);
        }

        .meta-list {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 2rem;
          text-align: left;
          padding: 0 0.5rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.85rem;
          color: var(--text-main);
        }

        .meta-item svg {
          color: var(--primary);
        }

        .alert-box {
          border-radius: var(--radius-sm);
          padding: 1rem;
          font-size: 0.8rem;
          line-height: 1.45;
          text-align: left;
        }

        .info-box {
          background: rgba(59, 130, 246, 0.08);
          color: #1e3a8a;
          border: 1px solid rgba(59, 130, 246, 0.15);
        }

        .card-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--primary-dark);
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.75rem;
        }

        .message-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          margin-bottom: 1.5rem;
        }

        .success-box {
          background: #dcfce7;
          color: #166534;
          border: 1px solid rgba(22, 101, 52, 0.15);
        }

        .error-box {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid rgba(153, 27, 27, 0.15);
        }

        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 1.25rem 1rem;
        }

        .col-12 { grid-column: span 12; }
        .col-6 { grid-column: span 6; }

        @media (max-width: 576px) {
          .col-6 { grid-column: span 12; }
        }

        .divider {
          border-top: 1px solid var(--border-color);
          margin: 0.5rem 0;
        }

        .section-title h4 {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--primary-dark);
          margin-bottom: 0.15rem;
        }

        .section-title p {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .highlight-group {
          background: rgba(27, 94, 32, 0.03);
          padding: 1rem;
          border-radius: var(--radius-sm);
          border: 1px dashed rgba(27, 94, 32, 0.15);
        }

        .highlight-group label {
          color: var(--primary-dark);
        }

        .required {
          color: #ef4444;
          margin-left: 2px;
        }

        .submit-btn {
          align-self: flex-start;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          font-weight: 600;
          border-radius: var(--radius-sm);
          box-shadow: 0 4px 12px rgba(27, 94, 32, 0.2);
        }

        @media (max-width: 576px) {
          .submit-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};
