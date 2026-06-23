from datetime import datetime, timedelta
import random
from sqlmodel import Session, select
from database import engine, create_db_and_tables
from models import (
    Estufa, Microcontrolador, Sensor, Leitura, PlantaRobotica,
    MovimentoPlanta, Usuario, StatusMicrocontrolador, TipoSensor,
    StatusSensor, StatusPlanta
)
from auth import get_password_hash

def seed_db():
    create_db_and_tables()
    
    with Session(engine) as session:
        # Check if database is already seeded
        existing_estufa = session.exec(select(Estufa)).first()
        if existing_estufa:
            print("Banco de dados já contém dados. Pulando semeadura (seed).")
            return

        print("Iniciando semeadura do banco de dados...")

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
            nome="Estufa AgroTech Alpha",
            localizacao="Campus Central - Laboratório de Botânica",
            descricao="Estufa automatizada experimental integrando sensores ambientais e robótica biomimética para monitoramento e controle de plantio inteligente."
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

        # 4. Criar Sensores
        sensores_info = [
            {"nome": "Sensor de Luminosidade LDR", "tipo": TipoSensor.LUMINOSIDADE, "unidade": "Lux"},
            {"nome": "Sensor de Umidade do Solo Higrômetro", "tipo": TipoSensor.UMIDADE_SOLO, "unidade": "%"},
            {"nome": "Sensor de Temperatura DHT22", "tipo": TipoSensor.TEMPERATURA, "unidade": "°C"},
            {"nome": "Sensor de Umidade do Ar DHT22", "tipo": TipoSensor.UMIDADE_AR, "unidade": "%"},
            {"nome": "Sensor de Dióxido de Carbono MQ135", "tipo": TipoSensor.CO2, "unidade": "ppm"},
            {"nome": "Sensor de Oxigênio O2-A2", "tipo": TipoSensor.OXIGENIO, "unidade": "%"},
        ]

        sensores = []
        for s_info in sensores_info:
            sensor = Sensor(
                nome=s_info["nome"],
                tipo=s_info["tipo"],
                unidade=s_info["unidade"],
                status=StatusSensor.ATIVO,
                id_microcontrolador=esp32.id_microcontrolador
            )
            session.add(sensor)
            sensores.append(sensor)
        session.commit()
        for s in sensores:
            session.refresh(s)

        # 5. Criar Planta Robótica
        planta = PlantaRobotica(
            nome="Mimosa Biomimética v1",
            angulo_horizontal=120.0,
            angulo_vertical=45.0,
            status=StatusPlanta.ATIVA,
            id_estufa=estufa.id_estufa
        )
        session.add(planta)
        session.commit()
        session.refresh(planta)

        # 6. Gerar Leituras Históricas (Últimas 24 Horas)
        agora = datetime.utcnow()
        leituras_a_inserir = []
        
        # Parâmetros de base para as flutuações dos sensores
        sensor_baselines = {
            TipoSensor.LUMINOSIDADE: (500, 200),  # média, variação
            TipoSensor.UMIDADE_SOLO: (65, 5),
            TipoSensor.TEMPERATURA: (24, 4),
            TipoSensor.UMIDADE_AR: (55, 10),
            TipoSensor.CO2: (450, 50),
            TipoSensor.OXIGENIO: (20.9, 0.2)
        }

        for hora_atras in range(24, -1, -1):
            data_leitura = agora - timedelta(hours=hora_atras)
            # Fazer a luminosidade variar com base na hora do dia (dia/noite simulado)
            hora = data_leitura.hour
            dia_fator = 1.0 if 6 <= hora <= 18 else 0.05
            
            for sensor in sensores:
                base, var = sensor_baselines[sensor.tipo]
                
                if sensor.tipo == TipoSensor.LUMINOSIDADE:
                    valor = base * dia_fator + random.uniform(-50, 50) * dia_fator
                    valor = max(0, valor)
                elif sensor.tipo == TipoSensor.TEMPERATURA:
                    # Temperatura sobe no meio do dia
                    temp_fator = (12 - abs(hora - 14)) / 12  # pico às 14h
                    valor = base + (var * temp_fator) + random.uniform(-1, 1)
                else:
                    valor = base + random.uniform(-var, var)

                # Arredondar valor de acordo com a precisão típica
                if sensor.tipo == TipoSensor.OXIGENIO:
                    valor = round(valor, 2)
                else:
                    valor = round(valor, 1)

                leitura = Leitura(
                    id_sensor=sensor.id_sensor,
                    valor=valor,
                    data_hora=data_leitura
                )
                leituras_a_inserir.append(leitura)

        session.add_all(leituras_a_inserir)

        # 7. Gerar Histórico de Movimento da Planta (Últimas 24 Horas)
        movimentos_a_inserir = []
        direcoes = ["Norte", "Nordeste", "Leste", "Sudeste", "Sul", "Sudoeste", "Oeste", "Noroeste"]
        
        for hora_atras in range(24, -1, -2):
            data_movimento = agora - timedelta(hours=hora_atras)
            
            # Movimentação simulada
            angulo_h = 90.0 + random.uniform(-45, 45)
            angulo_v = 30.0 + random.uniform(-20, 20)
            direcao = random.choice(direcoes) if data_movimento.hour in range(6, 18) else "Nenhuma"
            
            movimento = MovimentoPlanta(
                id_planta=planta.id_planta,
                angulo_horizontal=round(angulo_h, 1),
                angulo_vertical=round(angulo_v, 1),
                direcao_luz=direcao,
                data_hora=data_movimento
            )
            movimentos_a_inserir.append(movimento)

        session.add_all(movimentos_a_inserir)
        session.commit()
        
        print("Semeadura concluída com sucesso!")

if __name__ == "__main__":
    seed_db()
