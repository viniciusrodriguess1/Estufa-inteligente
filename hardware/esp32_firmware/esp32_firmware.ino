                                                                                                                                         
    #include <WiFi.h>                                                                                                                       
    #include <HTTPClient.h>                                                                                                                 
    #include <ESP32Servo.h>                                                                                                                 
                                                                                                                                            
    // ================= CONFIGURAÇÕES DE REDE =================                                                                            
    const char* ssid = "NOME_DA_SUA_REDE_WIFI";                                                                                             
    const char* password = "SENHA_DO_SUA_REDE_WIFI";                                                                                        
                                                                                                                                            
    // IP do Computador rodando o Servidor (obtenha via ipconfig no terminal do Windows)                                                    
    const char* serverIp = "192.168.1.100";                                                                                                 
    const int serverPort = 8000;                                                                                                            
                                                                                                                                            
    // ================= CONFIGURAÇÃO DE IDS DA API =================                                                                       
    const int ID_LDR_ESQ = 1;  // Sensor ID do LDR Esquerdo (Seeded por padrão no sistema)                                                  
    const int ID_LDR_DIR = 7;  // Sensor ID do LDR Direito (Cadastre nas "Configurações" do site e mude o ID aqui)                          
    const int ID_PLANTA  = 1;  // ID da Planta no banco de dados                                                                            
                                                                                                                                            
    // ================= HARDWARE PINOUTS =================                                                                                 
    const int ldrEsqPin = 34;                                                                                                               
    const int ldrDirPin = 35;                                                                                                               
    const int potPin = 25;                                                                                                                  
                                                                                                                                            
    const int servoHorPin = 27;                                                                                                             
    const int servoVerPin = 26;                                                                                                             
                                                                                                                                            
    Servo servoHor;                                                                                                                         
    Servo servoVer;                                                                                                                         
                                                                                                                                            
    int anguloHor = 90;                                                                                                                     
    int anguloVer = 0;                                                                                                                      
                                                                                                                                            
    unsigned long lastMove = 0;                                                                                                             
    unsigned long ultimoEnvio = 0;                                                                                                          
    const unsigned long intervaloEnvio = 5000; // Envia telemetria para a API a cada 5 segundos                                             
    unsigned long lastWifiRetry = 0;                                                                                                        
                                                                                                                                            
    // ===== FILTRO =====                                                                                                                   
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
                                                                                                                                            
      servoVer.setPeriodHertz(50);                                                                                                          
      servoVer.attach(servoVerPin, 500, 2400);                                                                                              
                                                                                                                                            
      servoHor.write(anguloHor);                                                                                                            
      servoVer.write(anguloVer);                                                                                                            
                                                                                                                                            
      // Conexão inicial com Wi-Fi                                                                                                          
      conectarWiFi();                                                                                                                       
    }                                                                                                                                       
                                                                                                                                            
    void loop() {                                                                                                                           
      // Verificação de Wi-Fi sem bloquear o loop principal (Servos continuam se movendo mesmo se cair o Wi-Fi)                             
      if (WiFi.status() != WL_CONNECTED && millis() - lastWifiRetry > 20000) {                                                              
        Serial.println("Conexão Wi-Fi inativa. Tentando reconectar em segundo plano...");                                                   
        WiFi.disconnect();                                                                                                                  
        WiFi.begin(ssid, password);                                                                                                         
        lastWifiRetry = millis();                                                                                                           
      }                                                                                                                                     
                                                                                                                                            
      // ===== FILTRO MAIS RÁPIDO =====                                                                                                     
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
                                                                                                                                            
      // Velocidade controlada pelo potenciômetro                                                                                           
      int intervalo = map(leituraPot, 0, 4095, 5, 100);                                                                                     
      int diferenca = leituraEsq - leituraDir;                                                                                              
      int sensibilidade = 40;                                                                                                               
                                                                                                                                            
      // 1. MOVIMENTAÇÃO FÍSICA DOS SERVOS (Execução rápida)                                                                                
      if (millis() - lastMove > intervalo) {                                                                                                
                                                                                                                                            
        // ===== HORIZONTAL (SUAVE E LIMITADO) =====                                                                                        
        if (diferenca > sensibilidade && anguloHor < 180) {                                                                                 
          anguloHor++;                                                                                                                      
        }                                                                                                                                   
        else if (diferenca < -sensibilidade && anguloHor > 0) {                                                                             
          anguloHor--;                                                                                                                      
        }                                                                                                                                   
        servoHor.write(anguloHor);                                                                                                          
                                                                                                                                            
        // ===== VERTICAL (SOBE COM LUZ, DESCE SEM) =====                                                                                   
        int luzMedia = (leituraEsq + leituraDir) / 2;                                                                                       
        int limiteLuz = 1500;                                                                                                               
                                                                                                                                            
        if (luzMedia > limiteLuz && anguloVer < 180) {                                                                                      
          anguloVer++;                                                                                                                      
        }                                                                                                                                   
        else if (luzMedia < limiteLuz && anguloVer > 0) {                                                                                   
          anguloVer--;                                                                                                                      
        }                                                                                                                                   
        servoVer.write(anguloVer);                                                                                                          
                                                                                                                                            
        lastMove = millis();                                                                                                                
      }                                                                                                                                     
                                                                                                                                            
      // 2. TRANSMISSÃO DE DADOS HTTP PARA A API (Execução lenta a cada 5s)                                                                 
      if (millis() - ultimoEnvio > intervaloEnvio) {                                                                                        
        enviarDadosAPI(leituraEsq, leituraDir);                                                                                             
        ultimoEnvio = millis();                                                                                                             
      }                                                                                                                                     
                                                                                                                                            
      // DEBUG LOCAL                                                                                                                        
      static unsigned long lastPrint = 0;                                                                                                   
      if (millis() - lastPrint > 200) {                                                                                                     
        Serial.print("Esq: "); Serial.print(leituraEsq);                                                                                    
        Serial.print(" | Dir: "); Serial.print(leituraDir);                                                                                 
        Serial.print(" | Luz: "); Serial.print((leituraEsq + leituraDir)/2);                                                                
        Serial.print(" | Hor: "); Serial.print(anguloHor);                                                                                  
        Serial.print(" | Ver: "); Serial.println(anguloVer);                                                                                
        lastPrint = millis();                                                                                                               
      }                                                                                                                                     
    }                                                                                                                                       
                                                                                                                                            
    // ================= FUNÇÕES DE REDE / API =================                                                                            
                                                                                                                                            
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
        Serial.println("\nFalha ao conectar de início. Rodando em modo Offline (tentará reconectar em segundo plano).");                    
      }                                                                                                                                     
    }                                                                                                                                       
                                                                                                                                            
    void postRequest(String endpoint, String jsonPayload) {                                                                                 
      if (WiFi.status() == WL_CONNECTED) {                                                                                                  
        HTTPClient http;                                                                                                                    
        String url = "http://" + String(serverIp) + ":" + String(serverPort) + "/api/" + endpoint;                                          
                                                                                                                                            
        http.begin(url);                                                                                                                    
        http.addHeader("Content-Type", "application/json");                                                                                 
                                                                                                                                            
        int httpResponseCode = http.POST(jsonPayload);                                                                                      
                                                                                                                                            
        if (httpResponseCode > 0) {                                                                                                         
          Serial.print("HTTP POST /" + endpoint + " executado. Status: ");                                                                  
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
                                                                                                                                            
      Serial.println("-> Transmitindo leituras ambientais e movimentação...");                                                              
                                                                                                                                            
      // 1. Enviar LDR Esquerdo para a API (Sensor ID 1)                                                                                    
      String payloadEsq = "{\"id_sensor\":" + String(ID_LDR_ESQ) + ",\"valor\":" + String(valorEsq) + "}";                                  
      postRequest("leituras", payloadEsq);                                                                                                  
                                                                                                                                            
      // 2. Enviar LDR Direito para a API (Sensor ID 7)                                                                                     
      String payloadDir = "{\"id_sensor\":" + String(ID_LDR_DIR) + ",\"valor\":" + String(valorDir) + "}";                                  
      postRequest("leituras", payloadDir);                                                                                                  
                                                                                                                                            
      // 3. Determinar a direção da luz baseado na diferença física                                                                         
      String direcaoLuz = "Norte";                                                                                                          
      int dif = valorEsq - valorDir;                                                                                                        
      if (dif > 40) {                                                                                                                       
        direcaoLuz = "Oeste"; // Esquerda tem mais luz                                                                                      
      } else if (dif < -40) {                                                                                                               
        direcaoLuz = "Leste"; // Direita tem mais luz                                                                                       
      }                                                                                                                                     
                                                                                                                                            
      // 4. Enviar Coordenadas e Movimento da Planta                                                                                        
      String payloadPlanta = "{\"id_planta\":" + String(ID_PLANTA) +                                                                        
                             ",\"angulo_horizontal\":" + String(anguloHor) +                                                                
                             ",\"angulo_vertical\":" + String(anguloVer) +                                                                  
                             ",\"direcao_luz\":\"" + direcaoLuz + "\"}";                                                                    
      postRequest("planta/movimentos", payloadPlanta);                                                                                      
    } 