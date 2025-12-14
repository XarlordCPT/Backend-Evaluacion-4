@echo off
echo ==================================================
echo  INSTALADOR DE DEPENDENCIAS NUAM (WINDOWS)
echo ==================================================

:: 1. Verificar Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python no detectado. Por favor instalelo y agreguelo al PATH.
    pause
    exit /b
)

:: 2. Crear Entorno Virtual
if not exist "Ambiente-Microservicios" (
    echo Creando entorno virtual...
    python -m venv Ambiente-Microservicios
) else (
    echo El entorno virtual ya existe.
)

:: 3. Instalar Dependencias
echo Instalando librerias Python...
call Ambiente-Microservicios\Scripts\activate.bat
pip install --upgrade pip
if exist requirements.txt (
    pip install -r requirements.txt
) else (
    pip install django djangorestframework psycopg2-binary django-cors-headers djangorestframework-simplejwt confluent-kafka drf-yasg pyOpenSSL django-sslserver requests
)

:: 4. Instalar Frontend
echo Instalando dependencias Frontend...
cd NUAM
call npm install --legacy-peer-deps
cd ..

echo.
echo ==================================================
echo  INSTALACION COMPLETADA
echo ==================================================
pause
