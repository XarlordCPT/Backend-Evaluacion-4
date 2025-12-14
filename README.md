# Sistema de Gestión de Eventos Tecnológicos (NUAM)

Plataforma de microservicios para la gestión de eventos, usuarios y reportes.

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

1.  **Python 3.10+**: [Descargar Python](https://www.python.org/downloads/)
    *   *Windows*: Asegúrate de marcar "Add Python to PATH" durante la instalación.
2.  **Node.js (LTS)**: [Descargar Node.js](https://nodejs.org/)
3.  **Docker Desktop**: [Descargar Docker](https://www.docker.com/products/docker-desktop/) (Necesario **solo** para correr Kafka).
4.  **Git**: [Descargar Git](https://git-scm.com/downloads)

---

## ⚠️ Recordatorio de Servicios: Base de Datos

Este proyecto fue desarrollado y probado principalmente utilizando una **Base de Datos Online** (en la nube).

*   **Si tienes una Base de Datos Online**: Simplemente coloca tus credenciales (Host, User, Password, DB Name) en el archivo `.env` que configurarás más adelante.
*   **Si usarás una Base de Datos Local**: Deberás crear la base de datos manualmente en tu motor PostgreSQL.
    *   **Rápido (Local):** Abre tu terminal de SQL y ejecuta: `CREATE DATABASE nuam_db;`

> **Nota Adicional**: Para el funcionamiento de la mensajería asíncrona, es necesario tener **Docker Desktop** instalado y corriendo para levantar Kafka.

---

## 🚀 Instalación y Puesta en Marcha

Sigue estos pasos en estricto orden para levantar el entorno completo.

### 1. Clonar el Repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd Backend-Evaluacion-4
```

### 2. Configurar Variables de Entorno (.env)

El archivo de configuración de entorno no se incluye por seguridad. Debes crearlo a partir del ejemplo.

1.  Copia el archivo `.env.example` y renómbralo a `.env`:
    *   **Windows:** `copy .env.example .env`
    *   **Linux/Mac:** `cp .env.example .env`

2.  Abre el archivo `.env` y configura tus credenciales de base de datos (según lo mencionado en el recordatorio arriba).

### 3. Instalar Dependencias

Se deben instalar las librerías necesarias tanto para Python (Backend) como para Node.js (Frontend). Hemos preparado scripts automáticos para esto.

*   **Windows**: Ejecuta (doble clic) `install_dependencies.bat`
*   **Linux/Mac**:
    ```bash
    chmod +x install_dependencies.sh
    ./install_dependencies.sh
    ```

> Este proceso creará un entorno virtual, instalará los requerimientos del `requirements.txt` y las dependencias del frontend.

### 4. Ejecución del Proyecto

Una vez configurado e instalado, utiliza los scripts de inicio para levantar todos los servicios (Django, React y Kafka) simultáneamente.

*   **Windows**: Ejecuta (doble clic) `start_services.bat`
*   **Linux/Mac**:
    ```bash
    chmod +x start_services.sh
    ./start_services.sh
    ```

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

## 📂 Estructura del Sistema

A continuación se presenta el árbol de directorios del sistema completo:

```text
Backend-Evaluacion-4/
├── .env                       # Variables de entorno configuración
├── docker-compose.yml         # Configuración de servicios Docker (Kafka/Zookeeper)
├── requirements.txt           # Dependencias globales de Python
├── install_dependencies.bat   # Script de instalación Windows
├── start_services.bat         # Script de inicio Windows
├── Ambiente-Microservicios/   # Entorno Virtual (creado tras instalación)
├── NUAM/                      # Frontend (React + Vite)
│   ├── src/
│   ├── public/
│   └── package.json
├── Servicio_Login/            # Microservicio de Autenticación
│   ├── manage.py
│   └── ...
├── Servicio_Mantenedor/       # Microservicio de Gestión (Eventos/Usuarios)
│   ├── manage.py
│   └── ...
├── Servicio_Reportes/         # Microservicio de Reportes
│   ├── manage.py
│   └── ...
├── certs/                     # Certificados SSL para HTTPS local
└── scripts/                   # Scripts de utilidad
```
