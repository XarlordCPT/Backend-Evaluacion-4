#!/bin/bash

echo "Iniciando Sistema de Microservicios NUAM (Modo SSL - Linux)..."

# Función para abrir en nueva terminal (intenta varios emuladores)
open_terminal() {
    TITLE=$1
    CMD=$2
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal --title="$TITLE" -- bash -c "$CMD; exec bash"
    elif command -v konsole &> /dev/null; then
        konsole --new-tab --title "$TITLE" -e bash -c "$CMD; exec bash"
    elif command -v xterm &> /dev/null; then
        xterm -T "$TITLE" -e "bash -c \"$CMD; exec bash\"" &
    else
        echo "[WARNING] No se encontró terminal compatible. Ejecutando $TITLE en segundo plano..."
        nohup bash -c "$CMD" > "${TITLE// /_}.log" 2>&1 &
    fi
}

# 0. Verificar Infraestructura (Kafka + Zookeeper)
echo "Verificando estado de Docker (Kafka)..."
if ! docker info > /dev/null 2>&1; then
    echo "[ERROR] Docker no está corriendo o no tienes permisos."
    exit 1
fi
sudo docker compose up -d

# 1. Activar entorno virtual
if [ -f "Ambiente-Microservicios/bin/activate" ]; then
    source Ambiente-Microservicios/bin/activate
else
    echo "[ERROR] No se encontró el entorno virtual 'Ambiente-Microservicios'."
    exit 1
fi

# 2. Asegurar dependencias SSL
echo "Instalando dependencias SSL requeridas..."
pip install pyOpenSSL django-sslserver

# 3. Gestión de Certificados SSL
echo "Verificando certificados SSL..."
python3 scripts/cert_manager.py

# 4. Iniciar Servicios
echo "Lanzando servicios..."

# Login (8001)
open_terminal "Servicio Login" "cd Servicio_Login && python3 manage.py runsslserver 0.0.0.0:8001 --certificate ../certs/server.crt --key ../certs/server.key"

# Mantenedor (8002)
open_terminal "Servicio Mantenedor" "cd Servicio_Mantenedor && python3 manage.py runsslserver 0.0.0.0:8002 --certificate ../certs/server.crt --key ../certs/server.key"

# Reportes (8003)
open_terminal "Servicio Reportes" "cd Servicio_Reportes && python3 manage.py runsslserver 0.0.0.0:8003 --certificate ../certs/server.crt --key ../certs/server.key"

# Consumidor Kafka
open_terminal "Consumer Reportes" "cd Servicio_Reportes && python3 manage.py iniciar_consumidor_reportes"

# Frontend
echo "Iniciando Frontend..."
open_terminal "Frontend NUAM" "cd NUAM && npm install --legacy-peer-deps && npm run dev"

echo "=================================================="
echo " Todos los servicios iniciados."
echo " Si usas xterm o nohup, revisa los logs."
echo "=================================================="
