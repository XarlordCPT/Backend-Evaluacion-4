// Dashboard admin - Carga estadísticas del sistema
document.addEventListener('DOMContentLoaded', function() {
    fetch('/admin/dashboard-stats/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar estadísticas');
            }
            return response.json();
        })
        .then(data => {
            // Actualizar estadísticas principales
            document.getElementById('stat-calificaciones').textContent = data.totales.calificaciones || 0;
            document.getElementById('stat-usuarios').textContent = data.totales.usuarios || 0;
            document.getElementById('stat-mercados').textContent = data.totales.mercados || 0;
            document.getElementById('stat-instrumentos').textContent = data.totales.instrumentos || 0;

            // Crear gráficos
            crearGraficoMes(data.calificaciones_por_mes || []);
            crearGraficoTipo(data.calificaciones_por_tipo || []);
            crearGraficoMercado(data.calificaciones_por_mercado || []);
            crearGraficoAño(data.calificaciones_por_año || []);

            // Actualizar tabla de calificaciones recientes
            actualizarTablaRecientes(data.calificaciones_recientes || []);
        })
        .catch(error => {
            console.error('Error:', error);
            // Mostrar mensaje de error en las estadísticas
            document.getElementById('stat-calificaciones').textContent = 'Error';
            document.getElementById('stat-usuarios').textContent = 'Error';
            document.getElementById('stat-mercados').textContent = 'Error';
            document.getElementById('stat-instrumentos').textContent = 'Error';
            
            // Mostrar error en la tabla
            const tbody = document.querySelector('#table-recientes tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="6" class="loading-text">Error al cargar datos</td></tr>';
            }
        });
});

function crearGraficoMes(datos) {
    const ctx = document.getElementById('chart-mes');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: datos.map(item => item.mes || 'N/A'),
            datasets: [{
                label: 'Calificaciones por Mes',
                data: datos.map(item => item.count),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true
                }
            }
        }
    });
}

function crearGraficoTipo(datos) {
    const ctx = document.getElementById('chart-tipo');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: datos.map(item => item.tipo || 'N/A'),
            datasets: [{
                label: 'Distribución por Tipo',
                data: datos.map(item => item.count),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'right'
                }
            }
        }
    });
}

function crearGraficoMercado(datos) {
    const ctx = document.getElementById('chart-mercado');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: datos.map(item => item.mercado || 'N/A'),
            datasets: [{
                label: 'Calificaciones por Mercado',
                data: datos.map(item => item.count),
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function crearGraficoAño(datos) {
    const ctx = document.getElementById('chart-año');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: datos.map(item => item.año || 'N/A'),
            datasets: [{
                label: 'Calificaciones por Año',
                data: datos.map(item => item.count),
                backgroundColor: 'rgba(75, 192, 192, 0.8)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function actualizarTablaRecientes(datos) {
    const tbody = document.querySelector('#table-recientes tbody');
    if (!tbody) return;

    if (datos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-text">No hay calificaciones recientes</td></tr>';
        return;
    }

    tbody.innerHTML = datos.map(cal => `
        <tr>
            <td>${cal.id}</td>
            <td>${cal.usuario || 'N/A'}</td>
            <td>${cal.instrumento || 'N/A'}</td>
            <td>${cal.tipo || 'N/A'}</td>
            <td>${cal.fecha_pago || 'N/A'}</td>
            <td>${cal.año || 'N/A'}</td>
        </tr>
    `).join('');
}

