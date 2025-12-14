// Configuración de endpoints del backend Django
// Backend corre en: http://localhost:8000
// Para cambiar: crear archivo .env con VITE_API_BASE_URL=https://tu-backend.com
// Configuración de endpoints para Microservicios
// Configuración de endpoints para Microservicios
export const API_BASE_URL_AUTH = import.meta.env.VITE_API_URL_AUTH || 'https://localhost:8001';
export const API_BASE_URL_MANTENEDOR = import.meta.env.VITE_API_URL_MANTENEDOR || 'https://localhost:8002';
export const API_BASE_URL_REPORTES = import.meta.env.VITE_API_URL_REPORTES || 'https://localhost:8003';

export const API_ENDPOINTS = {
  // Autenticación - Servicio Login (Puerto 8001)
  AUTH: {
    LOGIN: `${API_BASE_URL_AUTH}/api/auth/token/`,
    REFRESH: `${API_BASE_URL_AUTH}/api/auth/token/refresh/`,
    VERIFY: `${API_BASE_URL_AUTH}/api/auth/token/verify/`,
    ADMIN_LOGIN_TOKEN: `${API_BASE_URL_AUTH}/api/auth/admin-login-token/`,
    PASSWORD_RESET_REQUEST: `${API_BASE_URL_AUTH}/api/auth/password-reset/request/`,
    PASSWORD_RESET_VALIDATE: `${API_BASE_URL_AUTH}/api/auth/password-reset/validate/`,
    PASSWORD_RESET_VERIFY: `${API_BASE_URL_AUTH}/api/auth/password-reset/verify/`,
    PROFILE: `${API_BASE_URL_AUTH}/api/auth/profile/`,
    LOGOUT: `${API_BASE_URL_AUTH}/api/auth/logout/`,
  },
  // Calificaciones - Servicio Mantenedor (Puerto 8002) y Reportes (Puerto 8003)
  CALIFICACIONES: {
    BASE: `${API_BASE_URL_MANTENEDOR}/api/calificaciones/calificaciones/`,
    MERCADOS: `${API_BASE_URL_MANTENEDOR}/api/calificaciones/mercados/`,
    TIPOS_AGREGACION: `${API_BASE_URL_MANTENEDOR}/api/calificaciones/tipos-agregacion/`,
    EJERCICIOS: `${API_BASE_URL_MANTENEDOR}/api/calificaciones/ejercicios/`,
    INSTRUMENTOS: `${API_BASE_URL_MANTENEDOR}/api/calificaciones/instrumentos/`,
    CARGAR_CSV: `${API_BASE_URL_MANTENEDOR}/api/calificaciones/calificaciones/cargar_csv/`,
    // Reportes movido al microservicio de Reportes
    REPORTES: `${API_BASE_URL_REPORTES}/api/calificaciones/reportes/`,
  },
};

