@echo off
echo Iniciando Sistema de Microservicios NUAM (Modo SSL)...

:: 0. Verificar Infraestructura (Kafka + Zookeeper)
echo Verificando estado de Docker...

docker-compose up -d

echo.
echo Esperando a que Kafka inicie completamente (20 segundos)...
echo Esto puede tardar si es la primera vez o el PC es lento.
timeout /t 5 /nobreak

echo.
echo Estado de los Contenedores:
docker-compose ps
echo.

:: 1. Activar entorno virtual
if exist "Ambiente-Microservicios\Scripts\activate.bat" (
    call Ambiente-Microservicios\Scripts\activate.bat
) else (
    echo [ERROR] No se encontro el entorno virtual "Ambiente-Microservicios".
    pause
    exit /b
)

:: 2. Asegurar dependencias SSL instaladas
echo Instalando dependencias SSL requeridas...
pip install pyOpenSSL django-sslserver

:: 3. Gestión de Certificados SSL
echo Verificando certificados SSL...
python scripts/cert_manager.py

:: 3. Iniciar Servicios con SSL (runsslserver)

:: Login (Puerto 8001 -> HTTPS)
start "Servicio Login (HTTPS 8001)" cmd /k "cd Servicio_Login && python manage.py runsslserver 0.0.0.0:8001 --certificate ../certs/server.crt --key ../certs/server.key"

:: Mantenedor (Puerto 8002 -> HTTPS)
start "Servicio Mantenedor (HTTPS 8002)" cmd /k "cd Servicio_Mantenedor && python manage.py runsslserver 0.0.0.0:8002 --certificate ../certs/server.crt --key ../certs/server.key"

:: Reportes (Puerto 8003 -> HTTPS)
start "Servicio Reportes (HTTPS 8003)" cmd /k "cd Servicio_Reportes && python manage.py runsslserver 0.0.0.0:8003 --certificate ../certs/server.crt --key ../certs/server.key"

:: Consumidor Kafka (Reportes)
start "Consumer Reportes Kafka" cmd /k "cd Servicio_Reportes && python manage.py iniciar_consumidor_reportes"

:: Frontend
:: Nota: El frontend debe estar configurado para apuntar a HTTPS
start "Frontend NUAM" cmd /k "cd NUAM && npm install --legacy-peer-deps && npm run dev"

echo Todos los servicios han sido iniciados en modo SEGURO (HTTPS).
pause
