import os
import time
import random
import json
import urllib.request
import urllib.error
import math

API_URL = os.getenv("API_URL", "http://127.0.0.1:8000/api")

def make_post_request(endpoint, data):
    url = f"{API_URL}/{endpoint}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.URLError as e:
        print(f"Erro ao conectar com a API no endpoint /{endpoint}: {e}")
        return None

def make_get_request(endpoint):
    url = f"{API_URL}/{endpoint}"
    try:
        with urllib.request.urlopen(url) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.URLError as e:
        print(f"Erro ao conectar com a API no endpoint /{endpoint}: {e}")
        return None

def simulate_esp32():
    print("==================================================")
    print("   SIMULADOR DE MICROCONTROLADOR ESP32 INICIADO   ")
    print("==================================================")
    print("Aguardando 3 segundos para garantir que o servidor esteja online...")
    time.sleep(3)
    
    # 1. Carregar Configurações (IDs de sensores e planta)
    config = make_get_request("configuracoes")
    if not config:
        print("Erro: Não foi possível obter as configurações da API. Encerrando simulador.")
        return
        
    sensores = config.get("sensores", [])
    if not sensores:
        print("Erro: Nenhum sensor cadastrado na base. Encerrando simulador.")
        return
        
    planta_info = make_get_request("planta")
    if not planta_info:
        print("Erro: Nenhuma planta cadastrada na base. Encerrando simulador.")
        return
        
    id_planta = planta_info.get("id_planta")
    print(f"Sensores detectados: {len(sensores)}")
    print(f"Planta Biomimética detectada: ID #{id_planta}")
    print("Iniciando loop de envio de dados em tempo real (Pressione CTRL+C para sair)...")

    # Valores baselines para simular flutuações realistas
    sensor_baselines = {
        "Temperatura": {"val": 24.0, "var": 0.2, "limits": (15, 38)},
        "UmidadeSolo": {"val": 65.0, "var": 0.5, "limits": (20, 100)},
        "UmidadeAr": {"val": 55.0, "var": 0.4, "limits": (30, 95)},
        "Luminosidade": {"val": 500.0, "var": 15.0, "limits": (0, 1000)},
        "CO2": {"val": 450.0, "var": 5.0, "limits": (300, 1200)},
        "Oxigenio": {"val": 20.9, "var": 0.02, "limits": (18.0, 22.0)}
    }

    step = 0
    direcoes = ["Norte", "Nordeste", "Leste", "Sudeste", "Sul", "Sudoeste", "Oeste", "Noroeste"]
    
    while True:
        try:
            step += 1
            print(f"\n[Ciclo #{step}] Enviando dados dos sensores...")
            
            # Simular e Enviar leituras de cada sensor
            for sensor in sensores:
                tipo = sensor.get("tipo")
                id_sensor = sensor.get("id_sensor")
                nome = sensor.get("nome")
                
                base = sensor_baselines.get(tipo, {"val": 50.0, "var": 1.0, "limits": (0, 100)})
                
                # Variação com onda senoide para simular ciclo de temperatura/luminosidade dia e noite
                time_factor = math.sin(step * 0.05)
                
                if tipo == "Luminosidade":
                    # Luminosidade flutua muito e simula dia/noite
                    val_atual = base["val"] + (base["val"] * 0.8 * time_factor) + random.uniform(-10, 10)
                elif tipo == "Temperatura":
                    # Temperatura sobe e desce ciclicamente
                    val_atual = base["val"] + (4 * time_factor) + random.uniform(-0.2, 0.2)
                    
                    # Provocar um alerta ocasional de temperatura alta para demonstrar o sistema
                    if step % 35 == 0:
                        val_atual = 34.2
                        print(f"⚠️ [Simulação] Provocando Temperatura Alta Crítica ({val_atual}°C) para teste de alerta...")
                elif tipo == "UmidadeSolo":
                    # Umidade decai lentamente, simula secagem do solo
                    val_atual = base["val"] - (step * 0.15 % 30) + random.uniform(-0.5, 0.5)
                    
                    # Provocar alerta de solo seco
                    if step % 45 == 0:
                        val_atual = 35.5
                        print(f"⚠️ [Simulação] Provocando Solo Seco ({val_atual}%) para teste de alerta...")
                else:
                    # Random walk simples para os outros sensores
                    val_atual = base["val"] + (base["var"] * time_factor * 5) + random.uniform(-base["var"], base["var"])
                
                # Garantir limites físicos e precisão de decimais
                val_atual = max(base["limits"][0], min(base["limits"][1], val_atual))
                if tipo == "Oxigenio":
                    val_atual = round(val_atual, 2)
                else:
                    val_atual = round(val_atual, 1)
                
                # Atualizar valor local
                base["val"] = val_atual
                
                # Enviar para a API
                payload = {"id_sensor": id_sensor, "valor": val_atual}
                make_post_request("leituras", payload)
                print(f"  - {nome}: {val_atual} {sensor.get('unidade')}")
            
            # Simular e Enviar Movimento da Planta Robótica
            if step % 2 == 0: # Enviar movimento a cada 2 ciclos (4 segundos)
                # Heliotropismo: ângulo horizontal segue a luz simulada
                # Fazemos o ângulo horizontal varrer de 45° a 135° de forma senoidal
                ang_h = 90.0 + 45.0 * math.sin(step * 0.1)
                
                # Ângulo vertical varia com base na umidade do solo simulada (folha murcha se solo seco)
                umid_atual = sensor_baselines["UmidadeSolo"]["val"]
                # Se solo está seco (< 45%), o ângulo vertical (dobramento) aumenta, simulando caimento
                if umid_atual < 50.0:
                    ang_v = 60.0 + random.uniform(-5, 5) # dobra mais
                else:
                    ang_v = 15.0 + 15.0 * math.cos(step * 0.15) # flutua levemente
                
                ang_h = round(max(0.0, min(180.0, ang_h)), 1)
                ang_v = round(max(0.0, min(90.0, ang_v)), 1)
                
                # Direção da luz correspondente ao ângulo horizontal
                if ang_h < 70:
                    direcao = "Leste"
                elif ang_h > 110:
                    direcao = "Oeste"
                else:
                    direcao = "Norte"

                mov_payload = {
                    "id_planta": id_planta,
                    "angulo_horizontal": ang_h,
                    "angulo_vertical": ang_v,
                    "direcao_luz": direcao
                }
                make_post_request("planta/movimentos", mov_payload)
                print(f"🤖 Movimento da Planta: H={ang_h}°, V={ang_v}°, Direção Luz={direcao}")

            time.sleep(2)
            
        except KeyboardInterrupt:
            print("\nSimulador encerrado pelo usuário.")
            break
        except Exception as e:
            print(f"Erro inesperado no loop do simulador: {e}")
            time.sleep(5)

if __name__ == "__main__":
    simulate_esp32()
