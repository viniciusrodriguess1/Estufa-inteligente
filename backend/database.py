import os
from sqlmodel import create_engine, SQLModel, Session
from sqlalchemy import event

db_url = os.getenv("DATABASE_URL", "sqlite:///./pibic.db").strip()

# Normaliza prefixos de URL do PostgreSQL (postgres://, postgresql+psycopg://, etc.)
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)
elif db_url.startswith("postgres+psycopg://"):
    db_url = db_url.replace("postgres+psycopg://", "postgresql+psycopg://", 1)

if db_url.startswith("postgresql"):
    # Se psycopg2 estiver disponível, força o driver psycopg2 caso psycopg (v3) não esteja instalado
    try:
        import psycopg  # noqa: F401
    except ImportError:
        if "postgresql+psycopg://" in db_url:
            db_url = db_url.replace("postgresql+psycopg://", "postgresql+psycopg2://", 1)
        elif db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

DATABASE_URL = db_url

# Configurações do SQLite para permitir conexões de múltiplas threads
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

# Habilita o modo WAL no SQLite para evitar travamentos de escrita concorrente
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if DATABASE_URL.startswith("sqlite"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA synchronous=NORMAL;")
        cursor.close()

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
