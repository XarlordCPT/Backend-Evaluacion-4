// Dashboard admin - Carga estadísticas del sistema Login
document.addEventListener('DOMContentLoaded', function () {
    fetch('/admin/dashboard-stats/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar estadísticas');
            }
            return response.json();
        })
        .then(data => {
            // Actualizar estadísticas principales
            document.getElementById('stat-usuarios').textContent = data.totales.usuarios || 0;
            document.getElementById('stat-activos').textContent = data.totales.activos || 0;
            document.getElementById('stat-staff').textContent = data.totales.staff || 0;

            // Actualizar tabla de usuarios recientes
            actualizarTablaRecientes(data.usuarios_recientes || []);
        })
        .catch(error => {
            console.error('Error:', error);
            // Mostrar mensaje de error en las estadísticas
            document.getElementById('stat-usuarios').textContent = 'Error';
            document.getElementById('stat-activos').textContent = 'Error';
            document.getElementById('stat-staff').textContent = 'Error';

            // Mostrar error en la tabla
            const tbody = document.querySelector('#table-recientes tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="5" class="loading-text">Error al cargar datos</td></tr>';
            }
        });
});

function actualizarTablaRecientes(datos) {
    const tbody = document.querySelector('#table-recientes tbody');
    if (!tbody) return;

    if (datos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading-text">No hay usuarios recientes</td></tr>';
        return;
    }

    tbody.innerHTML = datos.map(u => `
        <tr>
            <td>${u.id}</td>
            <td>${u.username || 'N/A'}</td>
            <td>${u.email || 'N/A'}</td>
            <td>${u.fecha_registro || 'N/A'}</td>
            <td>
                <span style="color: ${u.is_active ? 'green' : 'red'}; font-weight: bold;">
                    ${u.is_active ? 'Activo' : 'Inactivo'}
                </span>
            </td>
        </tr>
    `).join('');
}
