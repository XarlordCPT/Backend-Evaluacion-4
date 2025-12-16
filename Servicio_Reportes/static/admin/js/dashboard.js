// Dashboard admin - Carga estadísticas del sistema Reportes
document.addEventListener('DOMContentLoaded', function () {
    fetch('/admin/dashboard-stats/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar estadísticas');
            }
            return response.json();
        })
        .then(data => {
            // Crear gráfico
            crearGraficoActividad(data.grafico_actividad || []);

            // Actualizar tabla
            actualizarTablaActividad(data.actividad_reciente || []);
        })
        .catch(error => {
            console.error('Error:', error);
            const tbody = document.querySelector('#table-actividad tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="4" class="loading-text">Error al cargar datos</td></tr>';
            }
        });
});

function crearGraficoActividad(datos) {
    const ctx = document.getElementById('chart-actividad');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: datos.map(item => item.fecha || 'N/A'),
            datasets: [{
                label: 'Acciones Realizadas',
                data: datos.map(item => item.count),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function actualizarTablaActividad(datos) {
    const tbody = document.querySelector('#table-actividad tbody');
    if (!tbody) return;

    if (datos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading-text">No hay actividad reciente</td></tr>';
        return;
    }

    tbody.innerHTML = datos.map(r => `
        <tr>
            <td>${r.id}</td>
            <td>${r.usuario || 'N/A'}</td>
            <td>${r.accion || 'N/A'}</td>
            <td>${r.fecha || 'N/A'}</td>
        </tr>
    `).join('');
}
