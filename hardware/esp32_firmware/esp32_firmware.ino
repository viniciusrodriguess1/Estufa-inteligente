#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <AccelStepper.h>
#include <ESP32Servo.h>

// --- CONFIGURAÇÕES DE WI-FI E API RENDER ---
const char* ssid = "NOME_DA_SUA_REDE_WIFI";
const char* password = "SENHA_DA_SUA_REDE_WIFI";
const char* serverUrl = "https://estufa-inteligente.onrender.com";

// IDs cadastrados no Banco de Dados
const int ID_SENSOR_LDR = 1;
const int ID_PLANTA = 1;

// Intervalo de envio para o Render (em milissegundos)
const unsigned long intervaloEnvioAPI = 5000; // Envia a cada 5 segundos

// --- PINOS ---
const int pinoIN1 = 19;
const int pinoIN2 = 18;
const int pinoIN3 = 5;
const int pinoIN4 = 17;
const int pinoServo = 23;
const int pinoLDREsq = 34;
const int pinoLDRDir = 35;

AccelStepper meuMotor(AccelStepper::HALF4WIRE, pinoIN1, pinoIN3, pinoIN2, pinoIN4);
Servo meuServo;

// --- PARÂMETROS DE LUZ E ALTURA ---
unsigned long tempoAnteriorLDR = 0;
const long intervaloLeituraLDR = 50;  // ACELERADO: Lê a cada 50ms
int limiteLuz = 1000;
int zonaMorta = 600;
const long posicaoAlta = 40960; // 10 VOLTAS COMPLETAS (Ajuste isso para a altura real da sua haste!)
const long posicaoBaixa = 0;
volatile int estadoPlanta = -1;

// Variáveis da Média Móvel
volatile float mediaEsq = 0;
volatile float mediaDir = 0;
const float fatorSuavizacao = 0.6; // ACELERADO: Absorve 60% da luz instantaneamente

// --- CONTROLE DE MOVIMENTO ---
volatile int posicaoServoAtual = 90;
int posicaoServoAlvo = 90;
unsigned long tempoPassoServo = 0;
const int velocidadeServo = 50;
bool servoEmMovimento = false;

// --- TELEMETRIA (DEBUG) ---
unsigned long tempoPrint = 0;
const long intervaloPrint = 500; // Imprime na tela a cada meio segundo

// Protótipo da Task de Telemetria (Core 0) para não travar o AccelStepper no loop()
void taskTelemetriaHTTP(void* parameter);
void postRequest(const String& endpoint, const String& jsonPayload);

void setup() {
  Serial.begin(115200);
  pinMode(pinoLDREsq, INPUT);
  pinMode(pinoLDRDir, INPUT);

  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);
  meuServo.setPeriodHertz(50);
  meuServo.attach(pinoServo, 500, 2400);

  meuServo.write(posicaoServoAtual);
  delay(1000);

  meuMotor.setMaxSpeed(250.0);
  meuMotor.setAcceleration(100.0);

  mediaEsq = analogRead(pinoLDREsq);
  mediaDir = analogRead(pinoLDRDir);

  // Inicia conexão Wi-Fi em modo estação
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Iniciando conexao Wi-Fi com ");
  Serial.println(ssid);

  // Cria uma Task no Núcleo 0 dedicada ao envio HTTP/HTTPS para o Render.
  // Isso garante que o meuMotor.run() e o servo no Núcleo 1 (loop) NUNCA engasguem!
  xTaskCreatePinnedToCore(
    taskTelemetriaHTTP,   // Função da task
    "TaskTelemetriaHTTP", // Nome da task
    8192,                 // Tamanho da stack (necessário para SSL/HTTPS)
    NULL,                 // Parâmetro
    1,                    // Prioridade baixa para não interferir no controle
    NULL,                 // Handle
    0                     // Pina no Core 0 (o loop roda no Core 1)
  );
}

void loop() {
  unsigned long tempoAtual = millis();

  // 1. CÉREBRO: Lê a luz
  if (!servoEmMovimento && (tempoAtual - tempoAnteriorLDR >= intervaloLeituraLDR)) {
    tempoAnteriorLDR = tempoAtual;

    int leituraBrutaEsq = analogRead(pinoLDREsq);
    int leituraBrutaDir = analogRead(pinoLDRDir);

    mediaEsq = (mediaEsq * (1.0 - fatorSuavizacao)) + (leituraBrutaEsq * fatorSuavizacao);
    mediaDir = (mediaDir * (1.0 - fatorSuavizacao)) + (leituraBrutaDir * fatorSuavizacao);

    int luzMaisForte = max(mediaEsq, mediaDir);

    if (luzMaisForte > limiteLuz) {
      meuMotor.moveTo(posicaoAlta);
      estadoPlanta = 1;

      if (mediaEsq > (mediaDir + zonaMorta)) {
        posicaoServoAlvo = 140;
      }
      else if (mediaDir > (mediaEsq + zonaMorta)) {
        posicaoServoAlvo = 40;
      }
      else {
        posicaoServoAlvo = 90;
      }
    }
    else if (estadoPlanta != 0) {
      estadoPlanta = 0;
      meuMotor.moveTo(posicaoBaixa);
      posicaoServoAlvo = 90;
    }
  }

  // 2. MÚSCULO DO PESCOÇO (SERVO)
  if (posicaoServoAtual != posicaoServoAlvo) {
    servoEmMovimento = true;

    if (tempoAtual - tempoPassoServo >= velocidadeServo) {
      tempoPassoServo = tempoAtual;
      if (posicaoServoAtual < posicaoServoAlvo) posicaoServoAtual++;
      else posicaoServoAtual--;
      meuServo.write(posicaoServoAtual);
    }
  } else {
    servoEmMovimento = false;
  }

  // 3. MÚSCULO DA BASE (STEPPER)
  if (!servoEmMovimento) {
    meuMotor.run();
  }

  // 4. PAINEL DE TELEMETRIA: Mostra os bastidores
  if (tempoAtual - tempoPrint >= intervaloPrint) {
    tempoPrint = tempoAtual;
    Serial.printf("LDR Esq: %.0f | LDR Dir: %.0f | Stepper Alvo: %ld | Stepper Atual: %ld | Servo: %d | Estado: %d\n",
                  mediaEsq, mediaDir, meuMotor.targetPosition(), meuMotor.currentPosition(), posicaoServoAtual, estadoPlanta);
  }
}

// ============================================================================
// TAREFA EM SEGUNDO PLANO (CORE 0): WI-FI + ENVIO DE TELEMETRIA AO RENDER
// ============================================================================
void taskTelemetriaHTTP(void* parameter) {
  unsigned long ultimoEnvio = 0;
  unsigned long ultimaTentativaWifi = 0;

  for (;;) {
    unsigned long agora = millis();

    // Reconexão automática do Wi-Fi caso desconecte
    if (WiFi.status() != WL_CONNECTED) {
      if (agora - ultimaTentativaWifi >= 15000) {
        ultimaTentativaWifi = agora;
        Serial.println("[WiFi] Reconectando ao Wi-Fi...");
        WiFi.disconnect();
        WiFi.begin(ssid, password);
      }
      vTaskDelay(pdMS_TO_TICKS(500));
      continue;
    }

    // Envio periódico dos dados para a API no Render
    if (agora - ultimoEnvio >= intervaloEnvioAPI) {
      ultimoEnvio = agora;

      // Captura snapshot das variáveis atuais
      int ldrEsq = (int)round(mediaEsq);
      int ldrDir = (int)round(mediaDir);
      long posHaste = meuMotor.currentPosition();
      int posServo = posicaoServoAtual;
      int estadoAtual = (estadoPlanta == 1) ? 1 : 0;

      // Define direção semântica da luz com base no estado e nos LDRs
      String direcaoLuz = "Em Repouso";
      if (estadoAtual == 1) {
        if (ldrEsq > (ldrDir + zonaMorta)) {
          direcaoLuz = "Esquerda (140°)";
        } else if (ldrDir > (ldrEsq + zonaMorta)) {
          direcaoLuz = "Direita (40°)";
        } else {
          direcaoLuz = "Centro (90°)";
        }
      }

      // 1. Envia a leitura de luminosidade principal para alimentar os cards e histórico
      int luzMedia = (ldrEsq + ldrDir) / 2;
      String payloadLeitura = "{\"id_sensor\":" + String(ID_SENSOR_LDR) +
                              ",\"valor\":" + String(luzMedia) + "}";
      postRequest("leituras", payloadLeitura);

      // 2. Envia o pacote completo de telemetria da Planta Robótica
      // Inclui os campos padrão do banco e as variáveis exatas da interface científica PIBIC
      String payloadPlanta = "{\"id_planta\":" + String(ID_PLANTA) +
                             ",\"angulo_horizontal\":" + String(posServo) +
                             ",\"angulo_vertical\":" + String(posHaste) +
                             ",\"direcao_luz\":\"" + direcaoLuz + "\"" +
                             ",\"estado\":" + String(estadoAtual) +
                             ",\"ldr_esquerdo\":" + String(ldrEsq) +
                             ",\"ldr_direito\":" + String(ldrDir) +
                             ",\"posicao_haste\":" + String(posHaste) +
                             ",\"posicao_servo\":" + String(posServo) + "}";
      postRequest("planta/movimentos", payloadPlanta);
    }

    // Libera a CPU do Core 0 por 100ms
    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

void postRequest(const String& endpoint, const String& jsonPayload) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure(); // Permite HTTPS no Render sem precisar gravar certificado raiz

  HTTPClient http;
  String url = String(serverUrl) + "/api/" + endpoint;

  http.setTimeout(8000);
  if (http.begin(client, url)) {
    http.addHeader("Content-Type", "application/json");
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      Serial.printf("[API] POST /%s -> HTTP %d\n", endpoint.c_str(), httpResponseCode);
    } else {
      Serial.printf("[API] Erro POST /%s -> %s (%d)\n",
                    endpoint.c_str(),
                    http.errorToString(httpResponseCode).c_str(),
                    httpResponseCode);
    }
    http.end();
  }
}
