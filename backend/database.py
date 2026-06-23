import os
from sqlmodel import create_engine, SQLModel, Session
from sqlalchemy import event

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./pibic.db")

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
