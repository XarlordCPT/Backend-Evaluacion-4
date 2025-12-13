import { API_ENDPOINTS } from '../config/api';
import authService from './authService';

/**
 * Servicio de reportes de auditoría - Conecta frontend con backend Django
 * Backend: Nuam_Backend/calificaciones/views.py - ReporteViewSet
 * URLs: Nuam_Backend/calificaciones/urls.py
 */
class ReportesService {
  /**
   * Obtiene todos los reportes de auditoría (solo para administradores)
   * @returns {Promise<Array>}
   */
  async getReportes() {
    try {
      const response = await fetch(API_ENDPOINTS.CALIFICACIONES.REPORTES, {
        method: 'GET',
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expirado, intentar refrescar
          await authService.refreshAccessToken();
          // Reintentar la petición
          const retryResponse = await fetch(API_ENDPOINTS.CALIFICACIONES.REPORTES, {
            method: 'GET',
            headers: authService.getAuthHeaders(),
          });
          if (!retryResponse.ok) {
            throw new Error('Error al obtener reportes');
          }
          return await retryResponse.json();
        }
        if (response.status === 403) {
          throw new Error('No tienes permisos para acceder a los reportes de auditoría');
        }
        throw new Error('Error al obtener reportes');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getReportes:', error);
      throw error;
    }
  }
}

export default new ReportesService();

