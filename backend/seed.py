from datetime import datetime, timedelta
import random
from sqlmodel import Session, select, delete
from database import engine, create_db_and_tables
from models import (
    Estufa, Microcontrolador, Sensor, Leitura, PlantaRobotica,
    MovimentoPlanta, Usuario, StatusMicrocontrolador, TipoSensor,
    StatusSensor, StatusPlanta
)
from auth import get_password_hash


def garantir_apenas_dois_ldrs(session: Session, id_microcontrolador: int):
    """Remove sensores antigos (Temp, Umidade, CO2, O2) e garante apenas LDR Esquerdo e LDR Direito."""
    sensores_nao_ldr = session.exec(
        select(Sensor).where(Sensor.tipo != TipoSensor.LUMINOSIDADE)
    ).all()

    for s in sensores_nao_ldr:
        session.exec(delete(Leitura).where(Leitura.id_sensor == s.id_sensor))
        session.delete(s)
    session.commit()

    sensores_ldr = session.exec(
        select(Sensor)
        .where(Sensor.tipo == TipoSensor.LUMINOSIDADE)
        .order_by(Sensor.id_sensor.asc())
    ).all()

    nomes_desejados = ["Sensor LDR Esquerdo", "Sensor LDR Direito"]

    # Se houver mais de 2 LDRs, remove os excedentes
    if len(sensores_ldr) > 2:
        for s_extra in sensores_ldr[2:]:
            session.exec(delete(Leitura).where(Leitura.id_sensor == s_extra.id_sensor))
            session.delete(s_extra)
        session.commit()
        sensores_ldr = sensores_ldr[:2]

    # Atualiza os nomes dos existentes
    for idx, s in enumerate(sensores_ldr):
        if s.nome != nomes_desejados[idx]:
            s.nome = nomes_desejados[idx]
            s.unidade = "Lux"
            s.status = StatusSensor.ATIVO
            session.add(s)
    session.commit()

    # Cria os que faltarem até completar 2 sensores LDR
    while len(sensores_ldr) < 2:
        novo_nome = nomes_desejados[len(sensores_ldr)]
        novo_sensor = Sensor(
            nome=novo_nome,
            tipo=TipoSensor.LUMINOSIDADE,
            unidade="Lux",
            status=StatusSensor.ATIVO,
            id_microcontrolador=id_microcontrolador,
        )
        session.add(novo_sensor)
        session.commit()
        session.refresh(novo_sensor)
        sensores_ldr.append(novo_sensor)

    return sensores_ldr


def seed_db():
    create_db_and_tables()

    with Session(engine) as session:
        existing_estufa = session.exec(select(Estufa)).first()
        if existing_estufa:
            micro = session.exec(select(Microcontrolador)).first()
            if micro:
                garantir_apenas_dois_ldrs(session, micro.id_microcontrolador)
            print("Banco de dados atualizado para manter apenas os 2 sensores LDR.")
            return

        print("Iniciando semeadura do banco de dados (Apenas 2 Sensores LDR)...")

        # 1. Criar Usuário Admin
        admin = Usuario(
            nome="Administrador Geral",
            matricula="2026123456",
            email="admin@estufa.edu.br",
            senha=get_password_hash("admin123")
        )
        session.add(admin)

        # 2. Criar Estufa
        estufa = Estufa(
            nome="Estufa Inteligente",
            localizacao="Laboratorio Evante",
            descricao="Estufa experimental integrando sensores de luminosidade (LDRs) e planta robótica biomimética para demonstração de fototropismo e heliotropismo via ESP32."
        )
        session.add(estufa)
        session.commit()
        session.refresh(estufa)

        # 3. Criar Microcontrolador (ESP32)
        esp32 = Microcontrolador(
            nome="ESP32-Estufa-01",
            ip="192.168.1.150",
            status=StatusMicrocontrolador.ONLINE,
            id_estufa=estufa.id_estufa
        )
        session.add(esp32)
        session.commit()
        session.refresh(esp32)

        # 4. Criar Apenas os 2 Sensores LDR
        sensores = garantir_apenas_dois_ldrs(session, esp32.id_microcontrolador)

        # 5. Criar Planta Robótica
        planta = PlantaRobotica(
            nome="Mimosa Biomimética v1",
            angulo_horizontal=90.0,
            angulo_vertical=0.0,
            status=StatusPlanta.ATIVA,
            id_estufa=estufa.id_estufa
        )
        session.add(planta)
        session.commit()
        session.refresh(planta)

        # 6. Gerar Leituras Históricas (Últimas 24 Horas) para os 2 LDRs
        agora = datetime.utcnow()
        leituras_a_inserir = []

        for hora_atras in range(24, -1, -1):
            data_leitura = agora - timedelta(hours=hora_atras)
            hora = data_leitura.hour
            dia_fator = 1.0 if 6 <= hora <= 18 else 0.15

            for idx, sensor in enumerate(sensores):
                base = 1200 if idx == 0 else 1100
                valor = round(max(0.0, base * dia_fator + random.uniform(-120, 120) * dia_fator), 1)
                leitura = Leitura(
                    id_sensor=sensor.id_sensor,
                    valor=valor,
                    data_hora=data_leitura
                )
                leituras_a_inserir.append(leitura)

        session.add_all(leituras_a_inserir)

        # 7. Gerar Histórico de Movimento da Planta (Últimas 24 Horas)
        movimentos_a_inserir = []
        direcoes = ["Esquerda (140°)", "Centro (90°)", "Direita (40°)"]

        for hora_atras in range(24, -1, -2):
            data_movimento = agora - timedelta(hours=hora_atras)
            em_luz = data_movimento.hour in range(6, 18)
            angulo_h = random.choice([40.0, 90.0, 140.0]) if em_luz else 90.0
            angulo_v = 40960.0 if em_luz else 0.0
            direcao = random.choice(direcoes) if em_luz else "Em Repouso"

            movimento = MovimentoPlanta(
                id_planta=planta.id_planta,
                angulo_horizontal=angulo_h,
                angulo_vertical=angulo_v,
                direcao_luz=direcao,
                data_hora=data_movimento
            )
            movimentos_a_inserir.append(movimento)

        session.add_all(movimentos_a_inserir)
        session.commit()

        print("Semeadura concluída com sucesso (2 sensores LDR configurados)!")


if __name__ == "__main__":
    seed_db()
