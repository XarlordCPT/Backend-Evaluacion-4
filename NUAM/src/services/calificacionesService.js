import { API_ENDPOINTS } from '../config/api';
import authService from './authService';

/**
 * Servicio de calificaciones - Conecta frontend con backend Django
 * Backend: Nuam_Backend/calificaciones/views.py - CalificacionViewSet
 * URLs: Nuam_Backend/calificaciones/urls.py
 */
class CalificacionesService {
  /**
   * Obtiene todas las calificaciones del usuario autenticado
   * @returns {Promise<Array>}
   */
  async getCalificaciones() {
    try {
      const response = await fetch(API_ENDPOINTS.CALIFICACIONES.BASE, {
        method: 'GET',
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expirado, intentar refrescar
          await authService.refreshAccessToken();
          // Reintentar la petición
          const retryResponse = await fetch(API_ENDPOINTS.CALIFICACIONES.BASE, {
            method: 'GET',
            headers: authService.getAuthHeaders(),
          });
          if (!retryResponse.ok) {
            throw new Error('Error al obtener calificaciones');
          }
          return await retryResponse.json();
        }
        throw new Error('Error al obtener calificaciones');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getCalificaciones:', error);
      throw error;
    }
  }

  /**
   * Obtiene una calificación por ID
   * @param {number} id - ID de la calificación
   * @returns {Promise<Object>}
   */
  async getCalificacion(id) {
    try {
      const response = await fetch(`${API_ENDPOINTS.CALIFICACIONES.BASE}${id}/`, {
        method: 'GET',
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Error al obtener la calificación');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getCalificacion:', error);
      throw error;
    }
  }

  /**
   * Crea una nueva calificación
   * @param {Object} calificacion - Datos de la calificación
   * @returns {Promise<Object>}
   */
  async createCalificacion(calificacion) {
    try {
      const response = await fetch(API_ENDPOINTS.CALIFICACIONES.BASE, {
        method: 'POST',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify(calificacion),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error al crear la calificación');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en createCalificacion:', error);
      throw error;
    }
  }

  /**
   * Actualiza una calificación existente
   * @param {number} id - ID de la calificación
   * @param {Object} calificacion - Datos actualizados
   * @returns {Promise<Object>}
   */
  async updateCalificacion(id, calificacion) {
    try {
      const response = await fetch(`${API_ENDPOINTS.CALIFICACIONES.BASE}${id}/`, {
        method: 'PUT',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify(calificacion),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error al actualizar la calificación');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en updateCalificacion:', error);
      throw error;
    }
  }

  /**
   * Elimina una calificación
   * @param {number} id - ID de la calificación
   * @returns {Promise<void>}
   */
  async deleteCalificacion(id) {
    try {
      const response = await fetch(`${API_ENDPOINTS.CALIFICACIONES.BASE}${id}/`, {
        method: 'DELETE',
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expirado, intentar refrescar
          await authService.refreshAccessToken();
          // Reintentar la petición
          const retryResponse = await fetch(`${API_ENDPOINTS.CALIFICACIONES.BASE}${id}/`, {
            method: 'DELETE',
            headers: authService.getAuthHeaders(),
          });
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Error al eliminar la calificación');
          }
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error al eliminar la calificación');
      }
    } catch (error) {
      console.error('Error en deleteCalificacion:', error);
      throw error;
    }
  }

  /**
   * Obtiene los mercados disponibles
   * @returns {Promise<Array>}
   */
  async getMercados() {
    try {
      const response = await fetch(API_ENDPOINTS.CALIFICACIONES.MERCADOS, {
        method: 'GET',
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Error al obtener mercados');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getMercados:', error);
      throw error;
    }
  }

  /**
   * Obtiene los tipos de agregación disponibles
   * @returns {Promise<Array>}
   */
  async getTiposAgregacion() {
    try {
      const response = await fetch(API_ENDPOINTS.CALIFICACIONES.TIPOS_AGREGACION, {
        method: 'GET',
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Error al obtener tipos de agregación');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getTiposAgregacion:', error);
      throw error;
    }
  }

  /**
   * Obtiene los ejercicios disponibles
   * @returns {Promise<Array>}
   */
  async getEjercicios() {
    try {
      const response = await fetch(API_ENDPOINTS.CALIFICACIONES.EJERCICIOS, {
        method: 'GET',
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Error al obtener ejercicios');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getEjercicios:', error);
      throw error;
    }
  }

  /**
   * Obtiene los instrumentos disponibles
   * @returns {Promise<Array>}
   */
  async getInstrumentos() {
    try {
      const response = await fetch(API_ENDPOINTS.CALIFICACIONES.INSTRUMENTOS, {
        method: 'GET',
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Error al obtener instrumentos');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getInstrumentos:', error);
      throw error;
    }
  }

  /**
   * Carga múltiples calificaciones desde CSV
   * @param {Array} datos - Array de objetos con datos normalizados del CSV
   * @returns {Promise<Object>} - Objeto con resultados de la carga
   */
  async cargarCSV(datos) {
    try {
      const response = await fetch(API_ENDPOINTS.CALIFICACIONES.CARGAR_CSV, {
        method: 'POST',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify({ datos }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expirado, intentar refrescar
          await authService.refreshAccessToken();
          // Reintentar la petición
          const retryResponse = await fetch(API_ENDPOINTS.CALIFICACIONES.CARGAR_CSV, {
            method: 'POST',
            headers: authService.getAuthHeaders(),
            body: JSON.stringify({ datos }),
          });
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({}));
            throw new Error(errorData.error || 'Error al cargar CSV');
          }
          return await retryResponse.json();
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al cargar CSV');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en cargarCSV:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo mercado
   * @param {string} nombre_mercado - Nombre del mercado
   * @returns {Promise<Object>}
   */
  async createMercado(nombre_mercado) {
    try {
      const response = await fetch(API_ENDPOINTS.CALIFICACIONES.MERCADOS, {
        method: 'POST',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify({ nombre_mercado }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.nombre_mercado?.[0] || errorData.detail || 'Error al crear mercado');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en createMercado:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo ejercicio
   * @param {string} nombre_ejercicio - Nombre del ejercicio
   * @returns {Promise<Object>}
   */
  async createEjercicio(nombre_ejercicio) {
    try {
      const response = await fetch(API_ENDPOINTS.CALIFICACIONES.EJERCICIOS, {
        method: 'POST',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify({ nombre_ejercicio }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.nombre_ejercicio?.[0] || errorData.detail || 'Error al crear ejercicio');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en createEjercicio:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo tipo de agregación
   * @param {string} nombre_agregacion - Nombre del tipo de agregación
   * @returns {Promise<Object>}
   */
  async createTipoAgregacion(nombre_agregacion) {
    try {
      const response = await fetch(API_ENDPOINTS.CALIFICACIONES.TIPOS_AGREGACION, {
        method: 'POST',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify({ nombre_agregacion }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.nombre_agregacion?.[0] || errorData.detail || 'Error al crear tipo de agregación');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en createTipoAgregacion:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo instrumento
   * @param {string} nombre_instrumento - Nombre del instrumento
   * @param {number} mercado_id - ID del mercado
   * @returns {Promise<Object>}
   */
  async createInstrumento(nombre_instrumento, mercado_id) {
    try {
      const response = await fetch(API_ENDPOINTS.CALIFICACIONES.INSTRUMENTOS, {
        method: 'POST',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify({ nombre_instrumento, mercado: mercado_id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.nombre_instrumento?.[0] || 
          errorData.mercado?.[0] || 
          errorData.detail || 
          'Error al crear instrumento'
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error en createInstrumento:', error);
      throw error;
    }
  }
}

export default new CalificacionesService();

