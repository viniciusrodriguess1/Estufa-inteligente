import subprocess
import sys
import os
import threading
import time

def log(prefix, text, color_code):
    # Imprime logs coloridos (36=Ciano, 32=Verde, 33=Amarelo, 35=Magenta, 31=Vermelho)
    print(f"\033[{color_code}m[{prefix}]\033[0m {text}", end="")

def stream_output(process, prefix, color_code):
    try:
        for line in iter(process.stdout.readline, ""):
            log(prefix, line, color_code)
    except Exception:
        pass

def main():
    processes = []
    
    # Habilita cores de terminal no Windows
    if os.name == 'nt':
        os.system('color')

    # Resolve os caminhos absolutos das pastas do projeto
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")

    # Verifica se as dependências do frontend estão instaladas
    if not os.path.exists(os.path.join(frontend_dir, "node_modules")):
        log("LAUNCHER", "Instalando dependências do frontend (npm install)...\n", "35")
        try:
            subprocess.run("npm install", shell=True, cwd=frontend_dir, check=True)
            log("LAUNCHER", "Dependências instaladas com sucesso!\n", "32")
        except subprocess.CalledProcessError as e:
            log("LAUNCHER", f"Erro ao executar 'npm install': {e}\n", "31")
            sys.exit(1)

    log("LAUNCHER", "Iniciando os serviços do AgroTech...\n", "35")

    try:
        # Inicializa o Backend FastAPI
        backend_proc = subprocess.Popen(
            "uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload",
            shell=True,
            cwd=backend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            encoding='utf-8',
            errors='replace'
        )
        processes.append((backend_proc, "BACKEND", "36"))

        # Inicializa o Frontend Vite
        frontend_proc = subprocess.Popen(
            "npm run dev",
            shell=True,
            cwd=frontend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            encoding='utf-8',
            errors='replace'
        )
        processes.append((frontend_proc, "FRONTEND", "32"))

        # Aguarda 4 segundos para inicialização da API
        time.sleep(4)

        # Inicializa o Simulador de ESP32
        simulator_proc = subprocess.Popen(
            "uv run python simulator.py",
            shell=True,
            cwd=backend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            encoding='utf-8',
            errors='replace'
        )
        processes.append((simulator_proc, "SIMULATOR", "33"))

        # Redireciona a saída padrão dos processos para threads separadas
        threads = []
        for proc, name, color in processes:
            t = threading.Thread(target=stream_output, args=(proc, name, color), daemon=True)
            t.start()
            threads.append(t)

        log("LAUNCHER", "Todos os processos ativos! Pressione CTRL+C para encerrar tudo.\n", "35")
        
        # Monitora a saúde dos subprocessos
        while True:
            for proc, name, color in processes:
                if proc.poll() is not None:
                    log("LAUNCHER", f"O processo {name} encerrou com código {proc.returncode}.\n", "31")
                    raise KeyboardInterrupt
            time.sleep(1)

    except (KeyboardInterrupt, SystemExit):
        log("LAUNCHER", "\nFinalizando subprocessos de forma limpa...\n", "31")
        
        # Encerra os processos
        for proc, name, _ in processes:
            if proc.poll() is None:
                log("LAUNCHER", f"Encerrando {name}...\n", "31")
                # No Windows, encerra a árvore de processos para não deixar órfãos
                if os.name == 'nt':
                    subprocess.run(f"taskkill /F /T /PID {proc.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    proc.terminate()
        
        log("LAUNCHER", "Sistema AgroTech finalizado.\n", "32")

if __name__ == "__main__":
    main()
