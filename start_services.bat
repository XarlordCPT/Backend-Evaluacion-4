@echo off
echo Iniciando Sistema de Microservicios NUAM...

:: Iniciar Infraestructura (Kafka + Zookeeper)
echo Iniciando Docker Containers...
docker-compose up -d

:: Esperar unos segundos para que Kafka levante (opcional pero recomendado)
timeout /t 5 /nobreak >nul

:: Activar entorno virtual (ajusta la ruta si es necesario)
if exist "Ambiente-Microservicios\Scripts\activate.bat" (
    call Ambiente-Microservicios\Scripts\activate.bat
)

:: Iniciar Servicio Login (Puerto 8001)
start "Servicio Login (8001)" cmd /k "cd Servicio_Login && python manage.py runserver 8001"

:: Iniciar Servicio Mantenedor (Puerto 8002)
start "Servicio Mantenedor (8002)" cmd /k "cd Servicio_Mantenedor && python manage.py runserver 8002"

:: Iniciar Servicio Reportes (Puerto 8003 - API)
start "Servicio Reportes (8003)" cmd /k "cd Servicio_Reportes && python manage.py runserver 8003"

:: Iniciar Consumidor Kafka Reportes
start "Consumer Reportes Kafka" cmd /k "cd Servicio_Reportes && python manage.py iniciar_consumidor_reportes"

:: Iniciar Frontend
start "Frontend NUAM" cmd /k "cd NUAM && npm run dev"

echo Todos los servicios e infraestructura han sido iniciados.
pause
