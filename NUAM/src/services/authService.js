import { API_ENDPOINTS } from '../config/api';

/**
 * Servicio de autenticación - Conecta frontend con backend Django
 * Backend: Nuam_Backend/core/views.py
 * URLs: Nuam_Backend/core/urls.py
 * Autenticación: JWT (JSON Web Tokens) con Bearer token en headers
 */
class AuthService {
  /**
   * Realiza el login y guarda los tokens
   * @param {string} username - Nombre de usuario
   * @param {string} password - Contraseña
   * @returns {Promise<{access: string, refresh: string}>}
   */
  async login(username, password) {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Credenciales inválidas');
      }

      const data = await response.json();

      // Guardar tokens en localStorage
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);

      return data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  /**
   * Obtiene el token de acceso almacenado
   * @returns {string|null}
   */
  getAccessToken() {
    return localStorage.getItem('access_token');
  }

  /**
   * Obtiene el token de refresh almacenado
   * @returns {string|null}
   */
  getRefreshToken() {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Verifica si el usuario está autenticado
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.getAccessToken();
  }

  /**
   * Refresca el token de acceso
   * @returns {Promise<string>}
   */
  async refreshAccessToken() {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No hay token de refresh disponible');
    }

    try {
      const response = await fetch(API_ENDPOINTS.AUTH.REFRESH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Error al refrescar el token');
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access);

      return data.access;
    } catch (error) {
      console.error('Error al refrescar token:', error);
      this.logout();
      throw error;
    }
  }

  /**
   * Cierra la sesión, notifica al backend y elimina los tokens
   */
  async logout() {
    try {
      const token = this.getAccessToken();
      if (token) {
        await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Error notificando logout al backend:', error);
      // Continuamos con el logout local aunque falle el backend
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  /**
   * Obtiene el header de autorización para las peticiones
   * @returns {Object}
   */
  getAuthHeaders() {
    const token = this.getAccessToken();
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
  }

  /**
   * Solicita un código de recuperación de contraseña
   * @param {string} email - Email del usuario
   * @returns {Promise<{message: string, user_id: number}>}
   */
  async requestPasswordReset(email) {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.PASSWORD_RESET_REQUEST, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al solicitar recuperación de contraseña');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en requestPasswordReset:', error);
      throw error;
    }
  }

  /**
   * Valida solo el código de reset (sin cambiar contraseña)
   * @param {number} userId - ID del usuario
   * @param {string} code - Código de verificación de 6 dígitos
   * @returns {Promise<{message: string, valid: boolean}>}
   */
  async validatePasswordResetCode(userId, code) {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.PASSWORD_RESET_VALIDATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          code: code,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al validar el código');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en validatePasswordResetCode:', error);
      throw error;
    }
  }

  /**
   * Verifica el código y cambia la contraseña
   * @param {number} userId - ID del usuario
   * @param {string} code - Código de verificación de 6 dígitos
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<{message: string}>}
   */
  async verifyPasswordReset(userId, code, newPassword) {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.PASSWORD_RESET_VERIFY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          code: code,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al verificar el código');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en verifyPasswordReset:', error);
      throw error;
    }
  }
}

export default new AuthService();

