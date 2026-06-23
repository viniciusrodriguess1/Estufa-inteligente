from datetime import datetime
from enum import Enum
from typing import List, Optional
from sqlmodel import Field, Relationship, SQLModel

# ----------------- ENUMS -----------------

class StatusMicrocontrolador(str, Enum):
    ONLINE = "Online"
    OFFLINE = "Offline"
    MANUTENCAO = "Manutencao"

class TipoSensor(str, Enum):
    LUMINOSIDADE = "Luminosidade"
    UMIDADE_SOLO = "UmidadeSolo"
    TEMPERATURA = "Temperatura"
    UMIDADE_AR = "UmidadeAr"
    CO2 = "CO2"
    OXIGENIO = "Oxigenio"

class StatusSensor(str, Enum):
    ATIVO = "Ativo"
    INATIVO = "Inativo"
    MANUTENCAO = "Manutencao"

class StatusPlanta(str, Enum):
    ATIVA = "Ativa"
    INATIVA = "Inativa"
    MANUTENCAO = "Manutencao"

# ----------------- DB MODELS -----------------

class Estufa(SQLModel, table=True):
    __tablename__ = "estufa"
    
    id_estufa: Optional[int] = Field(default=None, primary_key=True)
    nome: str = Field(max_length=100)
    localizacao: Optional[str] = Field(default=None, max_length=150)
    descricao: Optional[str] = Field(default=None)
    data_criacao: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    microcontroladores: List["Microcontrolador"] = Relationship(back_populates="estufa", cascade_delete=True)
    plantas: List["PlantaRobotica"] = Relationship(back_populates="estufa", cascade_delete=True)


class Microcontrolador(SQLModel, table=True):
    __tablename__ = "microcontrolador"
    
    id_microcontrolador: Optional[int] = Field(default=None, primary_key=True)
    nome: str = Field(max_length=100)
    ip: Optional[str] = Field(default=None, max_length=45)
    status: StatusMicrocontrolador = Field(default=StatusMicrocontrolador.OFFLINE)
    id_estufa: int = Field(foreign_key="estufa.id_estufa", ondelete="CASCADE")

    # Relationships
    estufa: "Estufa" = Relationship(back_populates="microcontroladores")
    sensores: List["Sensor"] = Relationship(back_populates="microcontrolador", cascade_delete=True)


class Sensor(SQLModel, table=True):
    __tablename__ = "sensor"
    
    id_sensor: Optional[int] = Field(default=None, primary_key=True)
    nome: str = Field(max_length=100)
    tipo: TipoSensor
    status: StatusSensor = Field(default=StatusSensor.ATIVO)
    unidade: Optional[str] = Field(default=None, max_length=20)
    id_microcontrolador: int = Field(foreign_key="microcontrolador.id_microcontrolador", ondelete="CASCADE")

    # Relationships
    microcontrolador: "Microcontrolador" = Relationship(back_populates="sensores")
    leituras: List["Leitura"] = Relationship(back_populates="sensor", cascade_delete=True)


class Leitura(SQLModel, table=True):
    __tablename__ = "leitura"
    
    id_leitura: Optional[int] = Field(default=None, primary_key=True)
    id_sensor: int = Field(foreign_key="sensor.id_sensor", ondelete="CASCADE")
    valor: float = Field()
    data_hora: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    sensor: "Sensor" = Relationship(back_populates="leituras")


class PlantaRobotica(SQLModel, table=True):
    __tablename__ = "planta_robotica"
    
    id_planta: Optional[int] = Field(default=None, primary_key=True)
    nome: Optional[str] = Field(default=None, max_length=100)
    angulo_horizontal: float = Field(default=90.0)
    angulo_vertical: float = Field(default=0.0)
    status: StatusPlanta = Field(default=StatusPlanta.ATIVA)
    id_estufa: int = Field(foreign_key="estufa.id_estufa", ondelete="CASCADE")

    # Relationships
    estufa: "Estufa" = Relationship(back_populates="plantas")
    movimentos: List["MovimentoPlanta"] = Relationship(back_populates="planta", cascade_delete=True)


class MovimentoPlanta(SQLModel, table=True):
    __tablename__ = "movimento_planta"
    
    id_movimento: Optional[int] = Field(default=None, primary_key=True)
    id_planta: int = Field(foreign_key="planta_robotica.id_planta", ondelete="CASCADE")
    angulo_horizontal: Optional[float] = Field(default=None)
    angulo_vertical: Optional[float] = Field(default=None)
    direcao_luz: Optional[str] = Field(default=None, max_length=50)
    data_hora: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    planta: "PlantaRobotica" = Relationship(back_populates="movimentos")


class Usuario(SQLModel, table=True):
    __tablename__ = "usuario"
    
    id_usuario: Optional[int] = Field(default=None, primary_key=True)
    nome: str = Field(max_length=100)
    matricula: str = Field(max_length=20, unique=True, index=True)
    email: str = Field(max_length=100, unique=True, index=True)
    senha: str = Field(max_length=255)
    data_cadastro: datetime = Field(default_factory=datetime.utcnow)


class ConfiguracaoAlerta(SQLModel, table=True):
    __tablename__ = "configuracao_alerta"
    
    chave: str = Field(primary_key=True, max_length=50)
    valor: float = Field()
