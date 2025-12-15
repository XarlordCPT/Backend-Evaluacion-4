import React, { useState } from 'react';
import { API_BASE_URL_AUTH, API_BASE_URL_MANTENEDOR, API_BASE_URL_REPORTES } from '../config/api';
import authService from '../services/authService';

export default function AdminMicroservicios({ onClose }) {
    const [loading, setLoading] = useState(false);
    const [activeService, setActiveService] = useState(null);

    const microservicios = [
        {
            nombre: 'Usuarios',
            descripcion: 'Gestión de usuarios y autenticación',
            baseUrl: API_BASE_URL_AUTH,
            tokenEndpoint: `${API_BASE_URL_AUTH}/api/auth/admin-login-token/`,
            puerto: '8001',
            color: 'bg-blue-600'
        },
        {
            nombre: 'Calificaciones',
            descripcion: 'Gestión de calificaciones y mantenedor',
            baseUrl: API_BASE_URL_MANTENEDOR,
            tokenEndpoint: `${API_BASE_URL_MANTENEDOR}/api/calificaciones/admin-login-token/`,
            puerto: '8002',
            color: 'bg-green-600'
        },
        {
            nombre: 'Reportes',
            descripcion: 'Generación y visualización de reportes',
            baseUrl: API_BASE_URL_REPORTES,
            tokenEndpoint: `${API_BASE_URL_REPORTES}/api/calificaciones/admin-login-token/`,
            puerto: '8003',
            color: 'bg-purple-600'
        }
    ];

    const handleAdminAccess = async (ms) => {
        if (loading) return;

        try {
            setLoading(true);
            setActiveService(ms.nombre);

            const token = localStorage.getItem('access_token');
            if (!token) {
                alert('No hay sesión activa. Por favor, inicia sesión nuevamente.');
                onClose();
                return;
            }

            // Función helper para hacer el fetch
            const fetchToken = async (accessToken) => {
                return fetch(ms.tokenEndpoint, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });
            };

            let response = await fetchToken(token);

            // Si falla por 401, intentar refrescar el token
            if (!response.ok && response.status === 401) {
                try {
                    await authService.refreshAccessToken();
                    const newToken = localStorage.getItem('access_token');
                    response = await fetchToken(newToken);
                } catch (refreshError) {
                    alert('La sesión ha expirado. Por favor, inicia sesión nuevamente.');
                    onClose();
                    return;
                }
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'No se pudo obtener acceso al administrador');
            }

            const data = await response.json();

            // Construir la URL completa usando la baseUrl del servicio
            // admin_login_url viene como /api/.../admin-login/<token>/
            const finalUrl = `${ms.baseUrl}${data.admin_login_url}`;

            const newWindow = window.open(finalUrl, '_blank', 'noopener,noreferrer');

            if (!newWindow) {
                alert('Por favor, permite las ventanas emergentes para acceder al administrador.');
            }

        } catch (error) {
            console.error(`Error al acceder a ${ms.nombre}:`, error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
            setActiveService(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
            <div className="bg-[#F4F4F4] border border-gray-300 rounded-md shadow-lg w-[600px] max-h-[90vh] overflow-y-auto relative">
                <div className="border-b border-gray-300 bg-white px-5 py-2">
                    <h2 className="text-[var(--nar)] font-bold text-[16.5px]">
                        Administración de Microservicios
                    </h2>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                        Seleccione el microservicio para acceder a su panel de administración con sus credenciales actuales.
                    </p>

                    <div className="grid gap-4">
                        {microservicios.map((ms, index) => (
                            <div
                                key={index}
                                className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center"
                            >
                                <div>
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                        {ms.nombre}
                                        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                            Puerto {ms.puerto}
                                        </span>
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">{ms.descripcion}</p>
                                </div>

                                <button
                                    onClick={() => handleAdminAccess(ms)}
                                    disabled={loading}
                                    className={`${ms.color} text-white px-4 py-2 rounded text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2`}
                                >
                                    {loading && activeService === ms.nombre ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : null}
                                    {loading && activeService === ms.nombre ? 'Abriendo...' : 'Ir al Admin'}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="border border-gray-400 px-6 py-1.5 rounded hover:bg-gray-100 transition-all text-sm font-medium"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
