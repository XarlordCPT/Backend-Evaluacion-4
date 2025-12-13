import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserIcon from "../components/UserIcon";
import { useAuth } from "../context/AuthContext";
import authService from "../services/authService";
import { API_ENDPOINTS } from "../config/api";

export default function Perfil() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");
      
      const token = authService.getAccessToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(API_ENDPOINTS.AUTH.PROFILE, {
        method: 'GET',
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          await authService.refreshAccessToken();
          const retryResponse = await fetch(API_ENDPOINTS.AUTH.PROFILE, {
            method: 'GET',
            headers: authService.getAuthHeaders(),
          });
          if (!retryResponse.ok) {
            throw new Error('Error al obtener perfil');
          }
          const data = await retryResponse.json();
          setProfileData(data);
          return;
        }
        throw new Error('Error al obtener perfil');
      }

      const data = await response.json();
      setProfileData(data);
    } catch (err) {
      console.error('Error al cargar perfil:', err);
      setError(err.message || 'Error al cargar los datos del perfil');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--fondo)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--fondo)] flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate("/mantenedor")}
              className="bg-orange-500 text-white px-6 py-2 rounded hover:opacity-90"
            >
              Volver al Mantenedor
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--fondo)] flex flex-col">
      {/* Header */}
      <div className="bg-[#404040] p-4 flex justify-between items-center text-orange-500">
        <h1 className="font-bold text-lg">Perfil de Usuario</h1>
        <button
          onClick={() => navigate("/mantenedor")}
          className="bg-orange-500 text-white px-3 py-1 rounded font-semibold hover:opacity-90"
        >
          Volver
        </button>
      </div>

      {/* Contenido */}
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl w-full">
          {/* Icono de usuario */}
          <div className="flex justify-center mb-6">
            <div className="h-24 w-24 rounded-full bg-orange-100 flex items-center justify-center">
              <UserIcon className="h-12 w-12 text-orange-500" />
            </div>
          </div>

          {/* Información del usuario */}
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                {profileData?.username || 'Usuario'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded">
                <label className="text-sm font-semibold text-gray-600 block mb-1">
                  Nombre de Usuario
                </label>
                <p className="text-gray-800">{profileData?.username || 'N/A'}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <label className="text-sm font-semibold text-gray-600 block mb-1">
                  Correo Electrónico
                </label>
                <p className="text-gray-800">{profileData?.email || 'N/A'}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <label className="text-sm font-semibold text-gray-600 block mb-1">
                  Nombre
                </label>
                <p className="text-gray-800">
                  {profileData?.first_name || 'No especificado'}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <label className="text-sm font-semibold text-gray-600 block mb-1">
                  Apellido
                </label>
                <p className="text-gray-800">
                  {profileData?.last_name || 'No especificado'}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <label className="text-sm font-semibold text-gray-600 block mb-1">
                  Rol
                </label>
                <p className="text-gray-800">
                  {profileData?.rol?.nombre || 'Sin rol asignado'}
                </p>
              </div>

              {profileData?.empleado && (
                <div className="bg-gray-50 p-4 rounded">
                  <label className="text-sm font-semibold text-gray-600 block mb-1">
                    RUT
                  </label>
                  <p className="text-gray-800">{profileData.empleado.rut}</p>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded">
                <label className="text-sm font-semibold text-gray-600 block mb-1">
                  Estado
                </label>
                <p className="text-gray-800">
                  {profileData?.is_active ? (
                    <span className="text-green-600 font-semibold">Activo</span>
                  ) : (
                    <span className="text-red-600 font-semibold">Inactivo</span>
                  )}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <label className="text-sm font-semibold text-gray-600 block mb-1">
                  Tipo de Usuario
                </label>
                <p className="text-gray-800">
                  {profileData?.is_staff ? (
                    <span className="text-blue-600 font-semibold">Administrador</span>
                  ) : (
                    <span className="text-gray-600">Usuario Regular</span>
                  )}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <label className="text-sm font-semibold text-gray-600 block mb-1">
                  Fecha de Registro
                </label>
                <p className="text-gray-800">
                  {profileData?.date_joined 
                    ? new Date(profileData.date_joined).toLocaleString('es-CL')
                    : 'N/A'}
                </p>
              </div>

              {profileData?.last_login && (
                <div className="bg-gray-50 p-4 rounded">
                  <label className="text-sm font-semibold text-gray-600 block mb-1">
                    Último Acceso
                  </label>
                  <p className="text-gray-800">
                    {new Date(profileData.last_login).toLocaleString('es-CL')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

