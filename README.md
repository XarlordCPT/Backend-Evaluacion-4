# Sistema de Microservicios NUAM

Proyecto refactorizado a arquitectura de microservicios para mejorar escalabilidad y mantenimiento.

## Estructura del Proyecto

El sistema está dividido en 3 servicios independientes y un frontend:

- **Servicio_Login**:
  - Encargado de autenticación y gestión de usuarios (Core).
  - Configuración: `Login_Config`

- **Servicio_Mantenedor**:
  - Encargado de la gestión (CRUD) de calificaciones e instrumentos.
  - Configuración: `Mantenedor_Config`
  - Utiliza modelos proxy para `Usuario` y `Rol`.

- **Servicio_Reportes**:
  - Encargado de la generación de reportes y auditoría.
  - Configuración: `Reportes_Config`
  - Utiliza modelos proxy para `Usuario` y `Rol`.

- **NUAM**:
  - Frontend de la aplicación.

## Ejecución

Para iniciar todos los servicios simultáneamente, utilice el script incluido:

```bash
start_services.bat
```

## Requisitos

- Python 3.10+
- PostgreSQL
- Node.js (para Frontend)
