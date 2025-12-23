# Sistema de Gestión de Eventos Tecnológicos (NUAM)

## Integrantes: Benjamin Duarte, Marina Martinez, Cristobal Medina, Patricio Villalobos

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
git clone https://github.com/XarlordCPT/Backend-Evaluacion-4.git
cd Backend-Evaluacion-4
```

### 2. Configurar Variables de Entorno (.env)

El archivo de configuración de entorno no se incluye por seguridad. Debes crearlo a partir del ejemplo.

1.  Copia el archivo `.env.example` y renómbralo a `.env`:
    *   **Windows:** `copy .env.example .env`
    *   **Linux/Mac:** `cp .env.example .env`

2.  Abre el archivo `.env` y configura tus credenciales de base de datos (según lo mencionado en el recordatorio arriba).
    *   **IMPORTANTE**: Para la variable `SECRET_KEY`, usa comillas simples `'tu-clave'` y evita usar caracteres especiales como `$` ya que pueden causar conflictos con Docker.
    *   *Ejemplo seguro*: `SECRET_KEY='django-insecure-mi-clave-secreta'`

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

### 5. Acceso al Sistema

Una vez que todos los servicios se hayan iniciado correctamente, abre tu navegador web y accede a la siguiente URL para entrar a la aplicación:

👉 **[https://localhost:5173](https://localhost:5173)**

> **Nota:** Al usar certificados SSL de desarrollo, es normal que el navegador muestre una advertencia de "La conexión no es privada". Debes hacer clic en **"Configuración avanzada"** y luego en **"Continuar a localhost (no seguro)"**.

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
4.  **Si es la primera vez o ves errores extraños**:
    *   Cierra todas las terminales.
    *   Abre una terminal en la carpeta del proyecto y ejecuta:
        ```bash
        docker-compose down
        ```
    *   Vuelve a ejecutar el script `start_services`.
    **En caso de que no funcione, prueba borrar el contenedor:**
    *   Cierra las terminales, abre una terminal en la carpeta del proyecto y ejecuta este comando:
    *   ```bash
        docker-compose rm -v
        ```
    *   Y vuelve a ejecutar el script `start_services`.

---

## 📚 Documentación de API (Swagger)

El sistema incluye documentación automática de los endpoints disponible en:

*   **Servicio Mantenedor**: [https://localhost:8002/api/docs/](https://localhost:8002/api/docs/)
*   **Servicio Reportes**: [https://localhost:8003/api/docs/](https://localhost:8003/api/docs/)


---

## 📂 Estructura del Sistema

A continuación se presenta el árbol de directorios del sistema completo:

```text
Backend-Evaluacion-4/
├── .env                       # Variables de entorno (Configuración)
├── docker-compose.yml         # Configuración de servicios Docker (Kafka/Zookeeper)
├── requirements.txt           # Dependencias globales de Python
├── install_dependencies.bat   # Script de instalación automática (Windows)
├── install_dependencies.sh    # Script de instalación automática (Linux/Mac)
├── start_services.bat         # Script de inicio seguro (Windows)
├── start_services.sh          # Script de inicio seguro (Linux/Mac)
├── MANUAL_USUARIO.md          # Manual de uso para el usuario final
├── Ambiente-Microservicios/   # Entorno Virtual Python (ignorado en git)
├── NUAM/                      # Frontend (React + Vite)
│   ├── src/
│   ├── public/
│   └── package.json
├── Servicio_Login/            # Microservicio de Autenticación
│   ├── core/
│   ├── Login_Config/
│   └── manage.py
├── Servicio_Mantenedor/       # Microservicio de Gestión (Eventos/Usuarios)
│   ├── core/
│   ├── Mantenedor_Config/
│   └── manage.py
├── Servicio_Reportes/         # Microservicio de Reportes y Kafka
│   ├── core/
│   ├── Reportes_Config/
│   └── manage.py
├── certs/                     # Certificados SSL para HTTPS (ignorado en git)
└── scripts/                   # Scripts de utilidad (generador certificados)
```
