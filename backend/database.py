import os
from sqlmodel import create_engine, SQLModel, Session
from sqlalchemy import event

SQLITE_FALLBACK_URL = "sqlite:///./pibic.db"
db_url = os.getenv("DATABASE_URL", SQLITE_FALLBACK_URL).strip()

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

def _build_engine(url: str):
    if url.startswith("sqlite"):
        return create_engine(url, connect_args={"check_same_thread": False})
    # Timeout curto (5s) para não travar o boot no Render caso o banco PostgreSQL tenha expirado
    return create_engine(url, connect_args={"connect_timeout": 5}, pool_pre_ping=True)

DATABASE_URL = db_url
engine = _build_engine(DATABASE_URL)

# Se for PostgreSQL, testa a conexão rapidamente; se o banco tiver expirado/inacessível, usa SQLite local
if not DATABASE_URL.startswith("sqlite"):
    try:
        with engine.connect() as conn:
            pass
        print("[DATABASE] Conectado ao PostgreSQL com sucesso!")
    except Exception as err:
        print(f"[DATABASE WARNING] Não foi possível conectar ao PostgreSQL ({err}).")
        print("[DATABASE] Ativando fallback automático para SQLite local (pibic.db) para manter a API online.")
        DATABASE_URL = SQLITE_FALLBACK_URL
        engine = _build_engine(DATABASE_URL)

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
