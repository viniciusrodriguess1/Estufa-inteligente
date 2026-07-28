#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ESP32Servo.h>
#include <Stepper.h>

// Configurações de Rede Wi-Fi e Backend
const char* ssid = "NOME_DA_SUA_REDE_WIFI";
const char* password = "SENHA_DO_SUA_REDE_WIFI";
const char* serverUrl = "https://estufa-inteligente.onrender.com";

// IDs da API
const int ID_LDR_ESQ = 1;
const int ID_LDR_DIR = 1; // Altere para o ID do 2º LDR caso cadastre um novo sensor no site
const int ID_PLANTA  = 1;

// Pinagem dos Sensores
const int ldrEsqPin = 34;
const int ldrDirPin = 35;
const int potPin = 25;

// Servo SG90 (Base Horizontal)
const int servoHorPin = 27;
Servo servoHor;
int anguloHor = 90;

// Motor de Passo 28BYJ-48 + Driver ULN2003 (Barra Roscada Vertical)
const int IN1 = 19;
const int IN2 = 18;
const int IN3 = 5;
const int IN4 = 17;

const int STEPS_PER_REV = 2048;
Stepper stepperVer(STEPS_PER_REV, IN1, IN3, IN2, IN4);

int posicaoVertical = 0;
const int ALTURA_MAX = 180;
const int ALTURA_MIN = 0;
const int PASSOS_POR_CICLO = 32;

unsigned long lastMove = 0;
unsigned long ultimoEnvio = 0;
const unsigned long intervaloEnvio = 15000; // Envia telemetria para a API a cada 15 segundos
unsigned long lastWifiRetry = 0;

#define NUM_AMOSTRAS 5
int leiturasEsq[NUM_AMOSTRAS];
int leiturasDir[NUM_AMOSTRAS];
int somaEsq = 0;
int somaDir = 0;
int indice = 0;

void setup() {
  Serial.begin(115200);

  ESP32PWM::allocateTimer(0);
  servoHor.setPeriodHertz(50);
  servoHor.attach(servoHorPin, 500, 2400);
  servoHor.write(anguloHor);

  stepperVer.setSpeed(12);

  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  desativarBobinasMotorPasso();

  conectarWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED && millis() - lastWifiRetry > 20000) {
    WiFi.disconnect();
    WiFi.begin(ssid, password);
    lastWifiRetry = millis();
  }

  somaEsq -= leiturasEsq[indice];
  somaDir -= leiturasDir[indice];

  leiturasEsq[indice] = analogRead(ldrEsqPin);
  leiturasDir[indice] = analogRead(ldrDirPin);

  somaEsq += leiturasEsq[indice];
  somaDir += leiturasDir[indice];

  indice = (indice + 1) % NUM_AMOSTRAS;

  int leituraEsq = somaEsq / NUM_AMOSTRAS;
  int leituraDir = somaDir / NUM_AMOSTRAS;
  int leituraPot = analogRead(potPin);

  int intervalo = map(leituraPot, 0, 4095, 5, 100);
  int diferenca = leituraEsq - leituraDir;
  int sensibilidade = 40;

  if (millis() - lastMove > intervalo) {
    if (diferenca > sensibilidade && anguloHor < 180) {
      anguloHor++;
    } else if (diferenca < -sensibilidade && anguloHor > 0) {
      anguloHor--;
    }
    servoHor.write(anguloHor);

    int luzMedia = (leituraEsq + leituraDir) / 2;
    int limiteLuz = 1500;

    if (luzMedia > limiteLuz && posicaoVertical < ALTURA_MAX) {
      stepperVer.step(PASSOS_POR_CICLO);
      posicaoVertical++;
      desativarBobinasMotorPasso();
    } else if (luzMedia < limiteLuz && posicaoVertical > ALTURA_MIN) {
      stepperVer.step(-PASSOS_POR_CICLO);
      posicaoVertical--;
      desativarBobinasMotorPasso();
    }

    lastMove = millis();
  }

  if (millis() - ultimoEnvio > intervaloEnvio) {
    enviarDadosAPI(leituraEsq, leituraDir);
    ultimoEnvio = millis();
  }

  static unsigned long lastPrint = 0;
  if (millis() - lastPrint > 300) {
    Serial.print("Esq: "); Serial.print(leituraEsq);
    Serial.print(" | Dir: "); Serial.print(leituraDir);
    Serial.print(" | Servo Hor: "); Serial.print(anguloHor);
    Serial.print("° | Barra Roscada: "); Serial.println(posicaoVertical);
    lastPrint = millis();
  }
}

void desativarBobinasMotorPasso() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
}

void conectarWiFi() {
  Serial.print("Conectando ao Wi-Fi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED && tentativas < 15) {
    delay(500);
    Serial.print(".");
    tentativas++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Conectado!");
    Serial.print("IP da ESP32: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nFalha ao conectar WiFi. Modo offline.");
  }
}

void postRequest(String endpoint, String jsonPayload) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure();

    HTTPClient http;
    String url = String(serverUrl) + "/api/" + endpoint;

    http.begin(client, url);
    http.addHeader("Content-Type", "application/json");

    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      Serial.print("HTTP POST /" + endpoint + " -> ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("Erro HTTP POST /" + endpoint + ": ");
      Serial.println(httpResponseCode);
    }
    http.end();
  }
}

void enviarDadosAPI(int valorEsq, int valorDir) {
  if (WiFi.status() != WL_CONNECTED) return;

  String payloadEsq = "{\"id_sensor\":" + String(ID_LDR_ESQ) + ",\"valor\":" + String(valorEsq) + "}";
  postRequest("leituras", payloadEsq);

  String payloadDir = "{\"id_sensor\":" + String(ID_LDR_DIR) + ",\"valor\":" + String(valorDir) + "}";
  postRequest("leituras", payloadDir);

  String direcaoLuz = "Norte";
  int dif = valorEsq - valorDir;
  if (dif > 40) {
    direcaoLuz = "Oeste";
  } else if (dif < -40) {
    direcaoLuz = "Leste";
  }

  String payloadPlanta = "{\"id_planta\":" + String(ID_PLANTA) +
                         ",\"angulo_horizontal\":" + String(anguloHor) +
                         ",\"angulo_vertical\":" + String(posicaoVertical) +
                         ",\"direcao_luz\":\"" + direcaoLuz + "\"}";
  postRequest("planta/movimentos", payloadPlanta);
}