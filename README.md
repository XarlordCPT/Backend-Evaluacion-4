# Sistema de Gestión de Eventos Tecnológicos (NUAM)

Este proyecto es una plataforma de microservicios para la gestión de eventos, usuarios y reportes, utilizando Django (Backend), React/Vite (Frontend) y Kafka para la comunicación asíncrona.

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

1.  **Python 3.10+**: [Descargar Python](https://www.python.org/downloads/)
    *   *Windows*: Asegúrate de marcar "Add Python to PATH" durante la instalación.
2.  **Node.js (LTS)**: [Descargar Node.js](https://nodejs.org/)
3.  **Docker Desktop**: [Descargar Docker](https://www.docker.com/products/docker-desktop/) (Necesario **solo** para correr Kafka, no para los servicios).
4.  **PostgreSQL (Local)**: Debes tener una instancia de PostgreSQL corriendo en tu máquina (puerto 5432).

---

## 🚀 Instalación y Configuración

Sigue estos pasos en orden para levantar el proyecto.

### 1. Clonar el Repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd Backend-Evaluacion-4
```

### 2. Configurar Variables de Entorno (.env)
El proyecto **NO** incluye el archivo `.env` por seguridad. Debes crearlo manualmente basándote en el ejemplo proporcionado.

1.  Copia el archivo `.env.example` y renómbralo a `.env`:
    *   **Windows:** `copy .env.example .env`
    *   **Linux/Mac:** `cp .env.example .env`

2.  Edita el nuevo archivo `.env` con tus credenciales. Tienes dos opciones:

    **Opción A: Base de Datos Local (Recomendado para desarrollo)**
    Si tienes PostgreSQL instalado en tu PC:
    ```ini
    DB_NAME=nuam_db
    DB_USER=postgres
    DB_PASSWORD=tu_password  <-- CÁMBIALO
    DB_HOST=localhost
    ```

    **Opción B: Base de Datos Online (Nube)**
    Si usas una base de datos remota (AWS RDS, Supabase, Neon, etc.):
    ```ini
    DB_NAME=postgres
    DB_USER=usuario_remoto
    DB_PASSWORD=password_remoto
    DB_HOST=tuhost.aws.com
    DB_PORT=5432
    ```
    > **⚠️ IMPORTANTE:** Si usas una base de datos online, asegúrate de que **permita conexiones externas** (reglas de Firewall/Security Groups) y que uses la versión de PostgreSQL 13 o superior.

### 3. Requisitos de la Base de Datos
Ya sea local u online, es **CRÍTICO** que tu base de datos cumpla con lo siguiente antes de iniciar:

1.  **Debe existir la Base de Datos:**
    El sistema no crea la base de datos por ti. Debes crearla manualmente:
    ```sql
    CREATE DATABASE nuam_db;
    ```
    *(O el nombre que hayas puesto en `DB_NAME`)*.

2.  **Codificación UTF-8:**
    Asegúrate de que la base de datos use codificación `UTF8` para evitar errores con caracteres especiales (tildes, ñ).
    ```sql
    -- Verificar encoding
    SHOW SERVER_ENCODING;
    ```

### 4. Instalar Dependencias
Ejecuta el script de instalación correspondiente a tu sistema operativo. Este script creará un entorno virtual Python y descargará todo lo necesario.

*   **Windows**: Doble clic en `install_dependencies.bat`
*   **Linux/Mac**:
    ```bash
    chmod +x install_dependencies.sh
    ./install_dependencies.sh
    ```

### 4. Crear Base de Datos
Asegúrate de haber creado la base de datos vacía en tu Postgres local:
```sql
CREATE DATABASE nuam_db;
```

### 5. Migraciones Iniciales
Debes aplicar las migraciones para crear las tablas en tu base de datos.
Abre una terminal, activa el entorno virtual (`Ambiente-Microservicios\Scripts\activate`) y ejecuta:

```bash
cd Servicio_Login
python manage.py migrate
cd ..\Servicio_Mantenedor
python manage.py migrate
cd ..\Servicio_Reportes
python manage.py migrate
```

---

## ▶️ Ejecución del Proyecto

Hemos simplificado el inicio de todos los servicios (Frontend, Backend y Kafka) en un solo script.

### Windows
1.  Asegúrate de que **Docker Desktop** esté abierto (para Kafka).
2.  Haz **doble clic** en el archivo:
    👉 **`start_services.bat`**

### Linux / Mac
1.  Asegúrate de que el servicio Docker esté corriendo.
2.  Ejecuta:
    ```bash
    chmod +x start_services.sh
    ./start_services.sh
    ```

Esto abrirá varias ventanas de terminal:
*   1 ventana para el **Frontend** (Vite)
*   3 ventanas para los **Microservicios** (Login, Mantenedor, Reportes)
*   1 ventana para el **Consumidor Kafka**

---

## 🛠 Solución de Problemas (Troubleshooting)

### Error: "Failed to Fetch" en el Frontend
Dado que usamos HTTPS autofirmado para desarrollo local, el navegador bloqueará las peticiones a la API inicialmente.
**Solución:**
1.  Abre tu navegador y entra manualmente a cada servicio backend:
    *   https://localhost:8001/admin/ (Login)
    *   https://localhost:8002/admin/ (Mantenedor)
    *   https://localhost:8003/admin/ (Reportes)
2.  Verás una advertencia de seguridad ("La conexión no es privada").
3.  Haz clic en **Configuración Avanzada -> Continuar a localhost (inseguro)**.
4.  Una vez aceptado en los 3 puertos, recarga el Frontend.

### Error de Conexión a Kafka
Si ves errores de conexión en las consolas negras:
1.  Cierra todas las ventanas de terminal.
2.  Reinicia el script `start_services`.
3.  Verifica que Docker tenga memoria suficiente.

---

## 📦 Estructura del Proyecto

*   **NUAM/**: Frontend (React + Vite)
*   **Servicio_Login/**: Microservicio de autenticación (Django)
*   **Servicio_Mantenedor/**: Gestión de eventos y usuarios (Django)
*   **Servicio_Reportes/**: Generación de reportes y analíticas (Django)
*   **certs/**: Certificados SSL locales
*   **scripts/**: Scripts de utilidad (generador de certificados)
