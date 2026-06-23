from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select, func
from pydantic import BaseModel

from database import engine, create_db_and_tables, get_session
from models import (
    Estufa, Microcontrolador, Sensor, Leitura, PlantaRobotica,
    MovimentoPlanta, Usuario, TipoSensor, StatusSensor,
    StatusMicrocontrolador, StatusPlanta, ConfiguracaoAlerta
)
from seed import seed_db
from auth import verify_password, get_password_hash

# ----------------- INICIALIZAÇÃO E MIDDLEWARES -----------------

app = FastAPI(title="PIBIC IoT Greenhouse & Biomimetic Plant API")

# Configurar CORS para permitir requisições de qualquer origem (essencial para testes em rede local/dispositivos móveis)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Executar migração e semeadura automática no startup
@app.on_event("startup")
def on_startup():
    seed_db()

# ----------------- CONFIGURAÇÃO WEBSOCKETS -----------------

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        active_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
                active_connections.append(connection)
            except Exception:
                # Remove conexões inativas silenciosamente se falharem
                pass
        self.active_connections = active_connections

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Mantém a conexão aberta e aguarda mensagens (opcional)
            data = await websocket.receive_text()
            # O backend apenas escuta, o fluxo principal é push de dados
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Helper para carregar/semeares limites do banco de dados de forma dinâmica
def get_limite(chave: str, default: float, db: Session) -> float:
    limite = db.get(ConfiguracaoAlerta, chave)
    if not limite:
        limite = ConfiguracaoAlerta(chave=chave, valor=default)
        db.add(limite)
        db.commit()
        db.refresh(limite)
    return limite.valor

# ----------------- MODELOS DE REQUISIÇÃO (SCHEMAS) -----------------

class LoginRequest(BaseModel):
    email_ou_matricula: str
    senha: str

class UsuarioCreate(BaseModel):
    nome: str
    email: str
    matricula: str
    senha: str
    confirmar_senha: Optional[str] = None

class UsuarioUpdate(BaseModel):
    nome: str
    email: str
    matricula: str
    senha_atual: str
    nova_senha: Optional[str] = None

class LeituraCreate(BaseModel):
    id_sensor: int
    valor: float

class MovimentoCreate(BaseModel):
    id_planta: int
    angulo_horizontal: float
    angulo_vertical: float
    direcao_luz: str

class SensorCreate(BaseModel):
    nome: str
    tipo: TipoSensor
    unidade: str
    id_microcontrolador: int

class MicrocontroladorCreate(BaseModel):
    nome: str
    ip: str
    id_estufa: int

class EstufaCreate(BaseModel):
    nome: str
    localizacao: str
    descricao: str

class LimitesUpdate(BaseModel):
    limiteTempMax: float
    limiteTempMin: float
    limiteSoloMin: float
    limiteCO2Max: float

# ----------------- ROTAS DE AUTENTICAÇÃO -----------------

@app.post("/api/register", status_code=status.HTTP_201_CREATED)
def register(req: UsuarioCreate, db: Session = Depends(get_session)):
    # Verificar se o email já está cadastrado
    email_existente = db.exec(select(Usuario).where(Usuario.email == req.email)).first()
    if email_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este e-mail já está cadastrado no sistema."
        )
        
    # Verificar se a matrícula já está cadastrada
    matricula_existente = db.exec(select(Usuario).where(Usuario.matricula == req.matricula)).first()
    if matricula_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta matrícula já está cadastrada no sistema."
        )
        
    # Validar tamanho da senha
    if len(req.senha.strip()) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A senha deve ter pelo menos 6 caracteres."
        )

    # Validar confirmação de senha
    if req.confirmar_senha is not None and req.senha != req.confirmar_senha:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="As senhas não coincidem."
        )

    # Criar novo usuário
    novo_usuario = Usuario(
        nome=req.nome,
        email=req.email,
        matricula=req.matricula,
        senha=get_password_hash(req.senha)
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    
    return {
        "mensagem": "Cadastro realizado com sucesso!",
        "usuario": {
            "id_usuario": novo_usuario.id_usuario,
            "nome": novo_usuario.nome,
            "matricula": novo_usuario.matricula,
            "email": novo_usuario.email
        }
    }

@app.post("/api/login")
def login(req: LoginRequest, db: Session = Depends(get_session)):
    # Busca por email ou matrícula
    statement = select(Usuario).where((Usuario.email == req.email_ou_matricula) | (Usuario.matricula == req.email_ou_matricula))
    usuario = db.exec(statement).first()
    
    if not usuario or not verify_password(req.senha, usuario.senha):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail/Matrícula ou senha incorretos."
        )
        
    return {
        "status": "success",
        "usuario": {
            "id_usuario": usuario.id_usuario,
            "nome": usuario.nome,
            "matricula": usuario.matricula,
            "email": usuario.email
        }
    }

@app.put("/api/usuarios/{id_usuario}")
def update_perfil(id_usuario: int, req: UsuarioUpdate, db: Session = Depends(get_session)):
    usuario = db.get(Usuario, id_usuario)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
        
    # Verificar senha atual
    if not verify_password(req.senha_atual, usuario.senha):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha atual incorreta."
        )
        
    # Verificar se e-mail já existe para outro usuário
    if req.email != usuario.email:
        email_existente = db.exec(select(Usuario).where(Usuario.email == req.email)).first()
        if email_existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este e-mail já está em uso por outro usuário."
            )
            
    # Verificar se matrícula já existe para outro usuário
    if req.matricula != usuario.matricula:
        matricula_existente = db.exec(select(Usuario).where(Usuario.matricula == req.matricula)).first()
        if matricula_existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Esta matrícula já está em uso por outro usuário."
            )
            
    # Atualizar dados
    usuario.nome = req.nome
    usuario.email = req.email
    usuario.matricula = req.matricula
    
    # Atualizar senha se fornecida
    if req.nova_senha:
        if len(req.nova_senha.strip()) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A nova senha deve ter pelo menos 6 caracteres."
            )
        usuario.senha = get_password_hash(req.nova_senha)
        
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    
    return {
        "status": "success",
        "usuario": {
            "id_usuario": usuario.id_usuario,
            "nome": usuario.nome,
            "matricula": usuario.matricula,
            "email": usuario.email
        }
    }

# ----------------- ROTAS DA ESTUFA -----------------

@app.get("/api/estufa")
def get_estufa_info(db: Session = Depends(get_session)):
    estufa = db.exec(select(Estufa)).first()
    if not estufa:
        raise HTTPException(status_code=404, detail="Estufa não encontrada.")
    
    # Contagens
    num_sensores = db.exec(select(func.count(Sensor.id_sensor))).one()
    num_microcontroladores = db.exec(select(func.count(Microcontrolador.id_microcontrolador))).one()
    
    # Status operacional (Online se pelo menos um micro está online)
    micros = db.exec(select(Microcontrolador)).all()
    status_operacional = "Offline"
    if any(m.status == StatusMicrocontrolador.ONLINE for m in micros):
        status_operacional = "Online"
    elif any(m.status == StatusMicrocontrolador.MANUTENCAO for m in micros):
        status_operacional = "Manutencao"

    return {
        "id_estufa": estufa.id_estufa,
        "nome": estufa.nome,
        "localizacao": estufa.localizacao,
        "descricao": estufa.descricao,
        "data_criacao": estufa.data_criacao,
        "quantidade_sensores": num_sensores,
        "quantidade_microcontroladores": num_microcontroladores,
        "status_operacional": status_operacional
    }

# ----------------- ROTAS DOS SENSORES -----------------

@app.get("/api/sensores")
def list_sensores(tipo: Optional[TipoSensor] = None, status: Optional[StatusSensor] = None, db: Session = Depends(get_session)):
    statement = select(Sensor)
    if tipo:
        statement = statement.where(Sensor.tipo == tipo)
    if status:
        statement = statement.where(Sensor.status == status)
        
    sensores = db.exec(statement).all()
    
    resposta = []
    for s in sensores:
        # Buscar última leitura
        ultima_leitura = db.exec(
            select(Leitura)
            .where(Leitura.id_sensor == s.id_sensor)
            .order_by(Leitura.data_hora.desc())
            .limit(1)
        ).first()
        
        resposta.append({
            "id_sensor": s.id_sensor,
            "nome": s.nome,
            "tipo": s.tipo,
            "valor_atual": ultima_leitura.valor if ultima_leitura else None,
            "unidade": s.unidade,
            "status": s.status,
            "id_microcontrolador": s.id_microcontrolador,
            "ultima_atualizacao": ultima_leitura.data_hora if ultima_leitura else None
        })
        
    return resposta

# ----------------- INGESTÃO DE DADOS (IoT / ESP32) -----------------

@app.post("/api/leituras", status_code=status.HTTP_201_CREATED)
async def post_leitura(req: LeituraCreate, db: Session = Depends(get_session)):
    sensor = db.get(Sensor, req.id_sensor)
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor não encontrado.")
    
    leitura = Leitura(
        id_sensor=req.id_sensor,
        valor=req.valor,
        data_hora=datetime.utcnow()
    )
    db.add(leitura)
    db.commit()
    db.refresh(leitura)
    
    # Payload para tempo real
    payload = {
        "event": "nova_leitura",
        "data": {
            "id_leitura": leitura.id_leitura,
            "id_sensor": leitura.id_sensor,
            "tipo": sensor.tipo,
            "valor": leitura.valor,
            "unidade": sensor.unidade,
            "data_hora": leitura.data_hora.isoformat()
        }
    }
    await manager.broadcast(payload)
    
    # Sistema de Alertas em Tempo Real
    alerta = None
    if sensor.tipo == TipoSensor.TEMPERATURA:
        t_max = get_limite("limiteTempMax", 32.0, db)
        t_min = get_limite("limiteTempMin", 18.0, db)
        if req.valor > t_max or req.valor < t_min:
            alerta = f"Temperatura Crítica! Valor atual: {req.valor}°C (Limites: {t_min}°C - {t_max}°C)"
    elif sensor.tipo == TipoSensor.UMIDADE_SOLO:
        s_min = get_limite("limiteSoloMin", 40.0, db)
        if req.valor < s_min:
            alerta = f"Solo Seco! Umidade crítica: {req.valor}% (Mínimo: {s_min}%)"
    elif sensor.tipo == TipoSensor.CO2:
        c_max = get_limite("limiteCO2Max", 800.0, db)
        if req.valor > c_max:
            alerta = f"Concentração de CO2 elevada! Valor atual: {req.valor} ppm (Máximo: {c_max} ppm)"
    
    if alerta:
        alerta_payload = {
            "event": "alerta",
            "data": {
                "sensor": sensor.nome,
                "tipo": sensor.tipo,
                "mensagem": alerta,
                "nivel": "danger",
                "data_hora": leitura.data_hora.isoformat()
            }
        }
        await manager.broadcast(alerta_payload)

    return {"status": "success", "id_leitura": leitura.id_leitura}

# ----------------- ROTAS DE HISTÓRICO (ANÁLISE DE DADOS) -----------------

@app.get("/api/historico")
def get_historico(periodo: str = "24h", sensor_tipo: Optional[TipoSensor] = None, db: Session = Depends(get_session)):
    agora = datetime.utcnow()
    
    # Definir limite temporal
    if periodo == "24h":
        limite = agora - timedelta(hours=24)
    elif periodo == "7d":
        limite = agora - timedelta(days=7)
    elif periodo == "30d":
        limite = agora - timedelta(days=30)
    else:
        limite = agora - timedelta(hours=24)  # fallback
        
    statement = select(Leitura).join(Sensor).where(Leitura.data_hora >= limite)
    if sensor_tipo:
        statement = statement.where(Sensor.tipo == sensor_tipo)
        
    statement = statement.order_by(Leitura.data_hora.asc())
    leituras = db.exec(statement).all()
    
    # Mapeamento e agregação para não sobrecarregar o frontend
    # Se período for 7d ou 30d, vamos agrupar para evitar muitos pontos de dados
    if periodo in ["7d", "30d"] and len(leituras) > 300:
        # Agrupamento simples: pega 1 ponto a cada N leituras
        passo = len(leituras) // 100
        passo = max(1, passo)
        leituras = leituras[::passo]

    resposta = []
    for l in leituras:
        resposta.append({
            "id_leitura": l.id_leitura,
            "id_sensor": l.id_sensor,
            "tipo": l.sensor.tipo,
            "valor": l.valor,
            "data_hora": l.data_hora,
            "unidade": l.sensor.unidade
        })
        
    return resposta

# ----------------- ROTAS DA PLANTA ROBÓTICA -----------------

@app.get("/api/planta")
def get_planta_status(db: Session = Depends(get_session)):
    planta = db.exec(select(PlantaRobotica)).first()
    if not planta:
        raise HTTPException(status_code=404, detail="Planta robótica não cadastrada.")
        
    # Buscar LDRs (sensores de luminosidade vinculados)
    ldr_sensores = db.exec(select(Sensor).where(Sensor.tipo == TipoSensor.LUMINOSIDADE)).all()
    ldr_valores = {}
    for s in ldr_sensores:
        leitura = db.exec(
            select(Leitura)
            .where(Leitura.id_sensor == s.id_sensor)
            .order_by(Leitura.data_hora.desc())
            .limit(1)
        ).first()
        ldr_valores[s.nome] = leitura.valor if leitura else 0.0

    # Direção da luz recente
    ultimo_movimento = db.exec(
        select(MovimentoPlanta)
        .where(MovimentoPlanta.id_planta == planta.id_planta)
        .order_by(MovimentoPlanta.data_hora.desc())
        .limit(1)
    ).first()
    
    return {
        "id_planta": planta.id_planta,
        "nome": planta.nome,
        "angulo_horizontal": planta.angulo_horizontal,
        "angulo_vertical": planta.angulo_vertical,
        "status": planta.status,
        "status_servomotores": "Ativo" if planta.status == StatusPlanta.ATIVA else "Inativo",
        "direcao_luz": ultimo_movimento.direcao_luz if ultimo_movimento else "Nenhuma",
        "leitura_ldrs": ldr_valores
    }

@app.get("/api/planta/movimentos")
def get_planta_movimentos(limite: int = 15, db: Session = Depends(get_session)):
    movimentos = db.exec(
        select(MovimentoPlanta)
        .order_by(MovimentoPlanta.data_hora.desc())
        .limit(limite)
    ).all()
    return movimentos

@app.post("/api/planta/movimentos", status_code=status.HTTP_201_CREATED)
async def post_movimento(req: MovimentoCreate, db: Session = Depends(get_session)):
    planta = db.get(PlantaRobotica, req.id_planta)
    if not planta:
        raise HTTPException(status_code=404, detail="Planta não encontrada.")
    
    # Atualizar ângulos atuais na planta
    planta.angulo_horizontal = req.angulo_horizontal
    planta.angulo_vertical = req.angulo_vertical
    db.add(planta)
    
    # Criar registro de movimento
    movimento = MovimentoPlanta(
        id_planta=req.id_planta,
        angulo_horizontal=req.angulo_horizontal,
        angulo_vertical=req.angulo_vertical,
        direcao_luz=req.direcao_luz,
        data_hora=datetime.utcnow()
    )
    db.add(movimento)
    db.commit()
    db.refresh(movimento)
    
    # Broadcast de tempo real
    payload = {
        "event": "novo_movimento",
        "data": {
            "id_movimento": movimento.id_movimento,
            "id_planta": movimento.id_planta,
            "angulo_horizontal": movimento.angulo_horizontal,
            "angulo_vertical": movimento.angulo_vertical,
            "direcao_luz": movimento.direcao_luz,
            "data_hora": movimento.data_hora.isoformat()
        }
    }
    await manager.broadcast(payload)
    
    return {"status": "success", "id_movimento": movimento.id_movimento}

# ----------------- ROTAS DE CONFIGURAÇÕES E CRUDS -----------------

@app.get("/api/configuracoes")
def get_configuracoes(db: Session = Depends(get_session)):
    estufas = db.exec(select(Estufa)).all()
    microcontroladores = db.exec(select(Microcontrolador)).all()
    sensores = db.exec(select(Sensor)).all()
    
    return {
        "estufas": estufas,
        "microcontroladores": microcontroladores,
        "sensores": sensores
    }

@app.post("/api/configuracoes/sensores", status_code=status.HTTP_201_CREATED)
def cadastrar_sensor(req: SensorCreate, db: Session = Depends(get_session)):
    micro = db.get(Microcontrolador, req.id_microcontrolador)
    if not micro:
        raise HTTPException(status_code=404, detail="Microcontrolador não encontrado.")
        
    sensor = Sensor(
        nome=req.nome,
        tipo=req.tipo,
        unidade=req.unidade,
        status=StatusSensor.ATIVO,
        id_microcontrolador=req.id_microcontrolador
    )
    db.add(sensor)
    db.commit()
    db.refresh(sensor)
    return sensor

@app.post("/api/configuracoes/microcontroladores", status_code=status.HTTP_201_CREATED)
def cadastrar_microcontrolador(req: MicrocontroladorCreate, db: Session = Depends(get_session)):
    estufa = db.get(Estufa, req.id_estufa)
    if not estufa:
        raise HTTPException(status_code=404, detail="Estufa não encontrada.")
        
    micro = Microcontrolador(
        nome=req.nome,
        ip=req.ip,
        status=StatusMicrocontrolador.OFFLINE,
        id_estufa=req.id_estufa
    )
    db.add(micro)
    db.commit()
    db.refresh(micro)
    return micro

@app.post("/api/configuracoes/estufas", status_code=status.HTTP_201_CREATED)
def cadastrar_estufa(req: EstufaCreate, db: Session = Depends(get_session)):
    estufa = Estufa(
        nome=req.nome,
        localizacao=req.localizacao,
        descricao=req.descricao
    )
    db.add(estufa)
    db.commit()
    db.refresh(estufa)
    return estufa


# ----------------- CONFIGURAÇÕES DE ALERTAS (DINÂMICAS) -----------------

@app.get("/api/configuracoes/limites")
def get_limites(db: Session = Depends(get_session)):
    return {
        "limiteTempMax": get_limite("limiteTempMax", 32.0, db),
        "limiteTempMin": get_limite("limiteTempMin", 18.0, db),
        "limiteSoloMin": get_limite("limiteSoloMin", 40.0, db),
        "limiteCO2Max": get_limite("limiteCO2Max", 800.0, db),
    }

@app.put("/api/configuracoes/limites")
def update_limites(req: LimitesUpdate, db: Session = Depends(get_session)):
    limites_dict = {
        "limiteTempMax": req.limiteTempMax,
        "limiteTempMin": req.limiteTempMin,
        "limiteSoloMin": req.limiteSoloMin,
        "limiteCO2Max": req.limiteCO2Max
    }
    
    for chave, valor in limites_dict.items():
        limite = db.get(ConfiguracaoAlerta, chave)
        if limite:
            limite.valor = valor
        else:
            limite = ConfiguracaoAlerta(chave=chave, valor=valor)
        db.add(limite)
    db.commit()
    return {"mensagem": "Limites operacionais salvos com sucesso!"}
