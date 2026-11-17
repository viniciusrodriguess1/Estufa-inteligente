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
    """Garante que existam exatamente os sensores ID=1 (LDR Esquerdo) e ID=2 (LDR Direito)."""
    # Remove qualquer sensor cujo ID não seja 1 ou 2, ou cujo tipo não seja Luminosidade
    todos_sensores = session.exec(select(Sensor)).all()
    for s in todos_sensores:
        if s.id_sensor not in (1, 2) or s.tipo != TipoSensor.LUMINOSIDADE:
            session.exec(delete(Leitura).where(Leitura.id_sensor == s.id_sensor))
            session.delete(s)
    session.commit()

    config_ldrs = [
        (1, "Sensor LDR Esquerdo"),
        (2, "Sensor LDR Direito"),
    ]

    sensores_finais = []
    for id_alvo, nome_alvo in config_ldrs:
        sensor = session.get(Sensor, id_alvo)
        if sensor:
            sensor.nome = nome_alvo
            sensor.tipo = TipoSensor.LUMINOSIDADE
            sensor.unidade = "Lux"
            sensor.status = StatusSensor.ATIVO
            sensor.id_microcontrolador = id_microcontrolador
            session.add(sensor)
        else:
            sensor = Sensor(
                id_sensor=id_alvo,
                nome=nome_alvo,
                tipo=TipoSensor.LUMINOSIDADE,
                unidade="Lux",
                status=StatusSensor.ATIVO,
                id_microcontrolador=id_microcontrolador,
            )
            session.add(sensor)
        session.commit()
        session.refresh(sensor)
        sensores_finais.append(sensor)

    return sensores_finais


def seed_db():
    create_db_and_tables()

    with Session(engine) as session:
        # 1. Garantir Usuário Admin
        admin = session.exec(
            select(Usuario).where(Usuario.email == "admin@estufa.edu.br")
        ).first()
        if not admin:
            admin = Usuario(
                nome="Administrador Geral",
                matricula="2026123456",
                email="admin@estufa.edu.br",
                senha=get_password_hash("admin123"),
            )
            session.add(admin)
            session.commit()

        # 2. Garantir Estufa
        estufa = session.exec(select(Estufa)).first()
        if not estufa:
            estufa = Estufa(
                id_estufa=1,
                nome="Estufa Inteligente",
                localizacao="Laboratorio Evante",
                descricao="Estufa experimental integrando sensores de luminosidade (LDRs) e planta robótica biomimética para demonstração de fototropismo e heliotropismo via ESP32.",
            )
            session.add(estufa)
            session.commit()
            session.refresh(estufa)

        # 3. Garantir Microcontrolador (ESP32)
        esp32 = session.exec(select(Microcontrolador)).first()
        if not esp32:
            esp32 = Microcontrolador(
                id_microcontrolador=1,
                nome="ESP32-Estufa-01",
                ip="192.168.1.150",
                status=StatusMicrocontrolador.ONLINE,
                id_estufa=estufa.id_estufa,
            )
            session.add(esp32)
            session.commit()
            session.refresh(esp32)

        # 4. Garantir os 2 Sensores LDR com ID=1 e ID=2
        sensores = garantir_apenas_dois_ldrs(session, esp32.id_microcontrolador)

        # 5. Garantir Planta Robótica com ID=1
        planta = session.get(PlantaRobotica, 1) or session.exec(select(PlantaRobotica)).first()
        if not planta:
            planta = PlantaRobotica(
                id_planta=1,
                nome="Mimosa Biomimética v1",
                angulo_horizontal=90.0,
                angulo_vertical=0.0,
                status=StatusPlanta.ATIVA,
                id_estufa=estufa.id_estufa,
            )
            session.add(planta)
            session.commit()
            session.refresh(planta)

        # 6. Se ainda não houver leituras, gera leituras iniciais para os 2 LDRs
        tem_leitura = session.exec(select(Leitura).limit(1)).first()
        if not tem_leitura:
            agora = datetime.utcnow()
            leituras_a_inserir = []
            for hora_atras in range(12, -1, -1):
                data_leitura = agora - timedelta(hours=hora_atras)
                for idx, sensor in enumerate(sensores):
                    base = 1200 if idx == 0 else 1100
                    valor = round(max(0.0, base + random.uniform(-100, 100)), 1)
                    leituras_a_inserir.append(
                        Leitura(
                            id_sensor=sensor.id_sensor,
                            valor=valor,
                            data_hora=data_leitura,
                        )
                    )
            session.add_all(leituras_a_inserir)
            session.commit()

        print("Banco de dados verificado com sucesso (Sensores LDR ID=1 e ID=2 prontos)!")


if __name__ == "__main__":
    seed_db()
