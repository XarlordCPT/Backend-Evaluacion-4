# 📖 Manual de Usuario - Plataforma NUAM

Bienvenido a la plataforma **NUAM**. Este manual te guiará a través de las funcionalidades principales del sistema, desde el registro hasta la gestión de eventos y reportes.

---

## 1. Acceso al Sistema

### Login
Al ingresar a la aplicación, serás recibido por la pantalla de inicio de sesión.
*   **Usuario**: Ingresa tu nombre de usuario registrado.
*   **Contraseña**: Ingresa tu clave personal.

> **Nota:** Si es tu primera vez, deberás pedir a un administrador que registre tu usuario o usar el usuario `admin` creado durante la instalación.

---

## 2. Panel Principal (Dashboard)

Una vez autenticado, verás el panel principal con un resumen de los eventos disponibles.
*   **Barra de Navegación**: En la parte superior encontrarás enlaces rápidos a "Eventos", "Usuarios" y "Reportes" (según tu rol).
*   **Botón Salir**: Para cerrar tu sesión de forma segura.

---

## 3. Gestión de Eventos

### Ver Eventos
En la sección de Eventos, verás una lista de todos los eventos tecnológicos programados, con su fecha, ubicación y descripción.

### Crear Evento (Solo Admin/Organizador)
1.  Haz clic en el botón **"Nuevo Evento"**.
2.  Completa el formulario:
    *   **Título**: Nombre del evento.
    *   **Descripción**: Detalles importantes.
    *   **Fecha**: Día y hora del evento.
    *   **Ubicación**: Lugar físico o enlace virtual.
3.  Presiona **Guardar**. El evento será publicado inmediatamente.

### Editar/Eliminar
*   Usa el ícono de **Lápiz** para modificar un evento existente.
*   Usa el ícono de **Basura** para eliminar un evento (Cuidado: esta acción no se puede deshacer).

---

## 4. Usuarios y Participantes

### Registro de Usuarios
Los administradores pueden dar de alta nuevos usuarios en el sistema, asignándoles roles:
*   **Admin**: Acceso total.
*   **Usuario**: Puede ver eventos y registrarse.

---

## 5. Reportes y Analíticas

La sección de Reportes permite visualizar la actividad de la plataforma.

### Reporte de Asistencia
Genera un listado de los usuarios inscritos en cada evento.
1.  Ve a la pestaña **Reportes**.
2.  Selecciona el rango de fechas.
3.  Descarga el reporte en formato **PDF** o **Excel**.

> **Nota Técnica:** Los reportes se generan de forma asíncrona; si el sistema tiene mucha carga, podría tardar unos segundos en aparecer la notificación de "Reporte Listo".

---

## 6. Soporte y Solución de Problemas

**¿La página no carga datos?**
*   Verifica tu conexión a internet.
*   Asegúrate de haber aceptado los certificados de seguridad (ver README.md sección HTTPS).

**¿No puedo iniciar sesión?**
*   Verifica que tu usuario y contraseña sean correctos.
*   Contacta al administrador de la base de datos si olvidaste tu clave.
