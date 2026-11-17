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
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.URLError as e:
        print(f"Erro ao conectar com a API no endpoint /{endpoint}: {e}")
        return None

def make_get_request(endpoint):
    url = f"{API_URL}/{endpoint}"
    try:
        with urllib.request.urlopen(url) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.URLError as e:
        print(f"Erro ao conectar com a API no endpoint /{endpoint}: {e}")
        return None

def simulate_esp32():
    print("==================================================")
    print("   SIMULADOR DE TELEMETRIA ESP32 (PIBIC) INICIADO ")
    print("==================================================")
    print("Aguardando 3 segundos para garantir que o servidor esteja online...")
    time.sleep(3)

    config = make_get_request("configuracoes")
    if not config:
        print("Erro: Não foi possível obter as configurações da API. Encerrando simulador.")
        return

    sensores_ldr = [
        s for s in config.get("sensores", []) if s.get("tipo") == "Luminosidade"
    ]
    if not sensores_ldr:
        print("Erro: Nenhum sensor LDR cadastrado na base. Encerrando simulador.")
        return

    planta_info = make_get_request("planta")
    if not planta_info:
        print("Erro: Nenhuma planta cadastrada na base. Encerrando simulador.")
        return

    id_planta = planta_info.get("id_planta", 1)
    id_ldr_esq = sensores_ldr[0].get("id_sensor", 1)
    id_ldr_dir = sensores_ldr[1].get("id_sensor", 2) if len(sensores_ldr) > 1 else id_ldr_esq

    print(f"Sensores LDR detectados: Esq=#{id_ldr_esq}, Dir=#{id_ldr_dir}")
    print(f"Planta Biomimética detectada: ID #{id_planta}")
    print("Iniciando loop de telemetria em tempo real (Pressione CTRL+C para sair)...")

    step = 0
    posicao_haste = 0
    posicao_servo = 90
    MAX_PASSOS = 40960
    LIMITE_LUZ = 1000
    ZONA_MORTA = 600

    while True:
        try:
            step += 1
            # Simula variação senoidal de foco luminoso entre LDR Esquerdo e LDR Direito
            onda = math.sin(step * 0.25)
            em_luz = (step % 16) < 12  # 75% do tempo com luz ativa (>1000), 25% em repouso

            if em_luz:
                ldr_esq = int(max(100, min(4095, 1600 + 900 * onda + random.uniform(-60, 60))))
                ldr_dir = int(max(100, min(4095, 1600 - 900 * onda + random.uniform(-60, 60))))
            else:
                ldr_esq = int(random.uniform(350, 750))
                ldr_dir = int(random.uniform(350, 750))

            luz_mais_forte = max(ldr_esq, ldr_dir)

            if luz_mais_forte > LIMITE_LUZ:
                estado = 1
                posicao_haste = min(MAX_PASSOS, posicao_haste + 8192)
                if ldr_esq > (ldr_dir + ZONA_MORTA):
                    posicao_servo = 140
                    direcao_luz = "Esquerda (140°)"
                elif ldr_dir > (ldr_esq + ZONA_MORTA):
                    posicao_servo = 40
                    direcao_luz = "Direita (40°)"
                else:
                    posicao_servo = 90
                    direcao_luz = "Centro (90°)"
            else:
                estado = 0
                posicao_haste = max(0, posicao_haste - 8192)
                posicao_servo = 90
                direcao_luz = "Em Repouso"

            # 1. Envia leituras dos 2 sensores LDR
            make_post_request("leituras", {"id_sensor": id_ldr_esq, "valor": ldr_esq})
            make_post_request("leituras", {"id_sensor": id_ldr_dir, "valor": ldr_dir})

            # 2. Envia pacote completo de telemetria da Planta Robótica
            mov_payload = {
                "id_planta": id_planta,
                "angulo_horizontal": posicao_servo,
                "angulo_vertical": posicao_haste,
                "direcao_luz": direcao_luz,
                "estado": estado,
                "ldr_esquerdo": ldr_esq,
                "ldr_direito": ldr_dir,
                "posicao_haste": posicao_haste,
                "posicao_servo": posicao_servo
            }
            make_post_request("planta/movimentos", mov_payload)

            print(
                f"[Ciclo #{step}] Estado={estado} | LDR Esq={ldr_esq} | LDR Dir={ldr_dir} | "
                f"Haste={posicao_haste}/{MAX_PASSOS} | Servo={posicao_servo}° ({direcao_luz})"
            )

            time.sleep(3)

        except KeyboardInterrupt:
            print("\nSimulador encerrado pelo usuário.")
            break
        except Exception as e:
            print(f"Erro inesperado no loop do simulador: {e}")
            time.sleep(5)

if __name__ == "__main__":
    simulate_esp32()
