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

## Arquitectura

El sistema utiliza una arquitectura de **Microservicios Orientada a Eventos (EDA)**:

1.  **Productores**: Los servicios `Login` y `Mantenedor` generan eventos de negocio (ej. usuarios creados, calificaciones actualizadas).
2.  **Mensajería**: **Apache Kafka** actúa como backbone de eventos, garantizando la entrega asíncrona y desacoplada.
3.  **Consumidores**: El servicio `Reportes` consume estos eventos para generar auditorías y estadísticas en tiempo real.
4.  **Orquestación**: Todo el stack (Microservicios, Kafka, Zookeeper, DB) se orquesta mediante **Docker Compose**.

## Documentación API (Swagger/OpenAPI)

Cada microservicio expone su propia documentación interactiva:

- **Servicio Mantenedor**: [https://localhost:8002/api/docs/](https://localhost:8002/api/docs/)
- **Servicio Reportes**: [https://localhost:8003/api/docs/](https://localhost:8003/api/docs/)

## Ejecución

Para iniciar todos los servicios simultáneamente, utilice el script incluido:

```bash
start_services.bat
```

## Requisitos

- Python 3.10+
- PostgreSQL
- Node.js (para Frontend)
