#!/bin/bash

echo "Iniciando Instalación de Dependencias para Sistema NUAM (Linux/Mac)..."

# 1. Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 no está instalado. Por favor instálalo."
    exit 1
fi

# 2. Verificar Node.js
if ! command -v npm &> /dev/null; then
    echo "[ERROR] Node.js/npm no está instalado. Por favor instálalo."
    exit 1
fi

# 3. Crear Entorno Virtual
echo "Creando entorno virtual 'Ambiente-Microservicios'..."
python3 -m venv Ambiente-Microservicios

# 4. Activar Entorno e Instalar Dependencias
echo "Activando entorno e instalando librerías Python..."
source Ambiente-Microservicios/bin/activate

# Actualizar pip
pip install --upgrade pip

# Instalar requirements.txt si existe
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    echo "[WARNING] No se encontró requirements.txt. Instalando dependencias base..."
    pip install django djangorestframework psycopg2-binary django-cors-headers djangorestframework-simplejwt confluent-kafka drf-yasg pyOpenSSL django-sslserver requests
fi

echo "Dependencias de Python instaladas."

# 5. Instalar Dependencias Frontend
echo "Instalando dependencias del Frontend (Vue/Vite)..."
cd NUAM
npm install --legacy-peer-deps
cd ..

echo "=================================================="
echo " INSTALACIÓN COMPLETADA EXITOSAMENTE "
echo "=================================================="
echo "Ahora puedes iniciar el sistema con: ./start_services.sh"
