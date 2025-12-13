import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import reportesService from "../services/reportesService";

export default function Auditoria() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    usuario: "",
    accion: "",
    fecha: "",
  });

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadReportes = async () => {
      try {
        setLoading(true);
        const reportes = await reportesService.getReportes();
        setData(reportes);
      } catch (error) {
        console.error('Error al cargar reportes:', error);
        alert(error.message || 'Error al cargar los reportes de auditoría');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadReportes();
  }, []);

  const handleClearFilters = () => {
    setFilters({
      usuario: "",
      accion: "",
      fecha: "",
    });
  };

  const filteredData = data.filter((item) => {
    if (filters.usuario && !item.usuario?.toLowerCase().includes(filters.usuario.toLowerCase())) {
      return false;
    }
    if (filters.accion && !item.accion?.toLowerCase().includes(filters.accion.toLowerCase())) {
      return false;
    }
    if (filters.fecha) {
      const fechaStr = item.fecha ? new Date(item.fecha).toLocaleDateString('es-ES') : '';
      if (!fechaStr.includes(filters.fecha)) {
        return false;
      }
    }
    return true;
  });

  const handleExportCSV = () => {
    try {
      // Verificar si hay filtros activos
      const hasFilters = filters.usuario || filters.accion || filters.fecha;
      
      // Siempre usar filteredData (que ya aplica los filtros o muestra todos si no hay filtros)
      const dataToExport = filteredData;
      
      if (dataToExport.length === 0) {
        alert('No hay reportes para exportar con los filtros aplicados');
        return;
      }

      // Crear encabezados CSV
      const headers = ['ID', 'Usuario', 'Acción', 'Fecha'];
      
      // Convertir datos a formato CSV
      const csvRows = [];
      csvRows.push(headers.join(','));
      
      dataToExport.forEach((reporte) => {
        const row = [
          reporte.id_reporte || '',
          (reporte.usuario || 'Sistema').replace(/,/g, ';'), // Reemplazar comas en usuario
          `"${(reporte.accion || '').replace(/"/g, '""')}"`, // Escapar comillas en acción
          reporte.fecha ? new Date(reporte.fecha).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }) : ''
        ];
        csvRows.push(row.join(','));
      });
      
      // Crear contenido CSV
      const csvContent = csvRows.join('\n');
      
      // Crear blob y descargar
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM para Excel
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // Generar nombre de archivo con fecha actual
      const fechaActual = new Date().toISOString().split('T')[0];
      const nombreArchivo = hasFilters 
        ? `reporte_auditoria_filtrado_${fechaActual}.csv`
        : `reporte_auditoria_${fechaActual}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', nombreArchivo);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      const mensaje = hasFilters 
        ? `Reporte exportado exitosamente con filtros aplicados (${dataToExport.length} registros): ${nombreArchivo}`
        : `Reporte exportado exitosamente (${dataToExport.length} registros): ${nombreArchivo}`;
      alert(mensaje);
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      alert('Error al exportar el reporte. Por favor, intenta nuevamente.');
    }
  };

  const columns = [
    { 
      name: "ID", 
      selector: (row) => row.id_reporte, 
      width: "80px",
      sortable: true 
    },
    { 
      name: "Usuario", 
      selector: (row) => row.usuario || "Sistema", 
      width: "150px",
      sortable: true 
    },
    { 
      name: "Acción", 
      selector: (row) => row.accion, 
      width: "500px",
      wrap: true,
      sortable: true 
    },
    { 
      name: "Fecha", 
      selector: (row) => {
        if (!row.fecha) return '-';
        const fecha = new Date(row.fecha);
        return fecha.toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }, 
      width: "180px",
      sortable: true 
    },
  ];

  const customStyles = {
    headCells: {
      style: {
        backgroundColor: "var(--fondo)",
        color: "#000",
        fontWeight: "bold",
        borderRight: "1px solid #ccc",
        whiteSpace: "nowrap",
      },
    },
    cells: {
      style: {
        borderRight: "1px solid #ddd",
        padding: "6px 8px",
      },
    },
  };

  return (
    <div className="min-h-screen bg-[var(--fondo)] flex flex-col">
      <div className="bg-[#404040] p-4 flex justify-between items-center text-orange-500">
        <h1 className="font-bold text-lg">Auditoría del Sistema</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/mantenedor")}
            className="bg-blue-600 text-white px-3 py-1 rounded font-semibold hover:bg-blue-700 transition-all"
          >
            Volver al Mantenedor
          </button>
        </div>
      </div>

      <div className="flex flex-1 p-6 gap-6">
        <aside className="w-[220px] bg-white p-4 rounded-lg shadow-md flex flex-col gap-3">
          <label className="text-sm font-semibold">Usuario:</label>
          <input
            type="text"
            value={filters.usuario}
            onChange={(e) => setFilters({ ...filters, usuario: e.target.value })}
            placeholder="Filtrar por usuario"
            className="border p-1 rounded text-sm"
          />

          <label className="text-sm font-semibold">Acción:</label>
          <input
            type="text"
            value={filters.accion}
            onChange={(e) => setFilters({ ...filters, accion: e.target.value })}
            placeholder="Filtrar por acción"
            className="border p-1 rounded text-sm"
          />

          <label className="text-sm font-semibold">Fecha:</label>
          <input
            type="text"
            value={filters.fecha}
            onChange={(e) => setFilters({ ...filters, fecha: e.target.value })}
            placeholder="Filtrar por fecha"
            className="border p-1 rounded text-sm"
          />

          <section className="p-0"></section>
          <button
            onClick={handleClearFilters}
            className="bg-orange-500 rounded py-1 text-sm text-white hover:opacity-90"
          >
            Limpiar filtros
          </button>

          <section className="p-5"></section>
          <button
            onClick={handleExportCSV}
            className="bg-green-600 text-white rounded py-1 text-sm hover:bg-green-700 transition-all"
          >
            Exportar reporte
          </button>
        </aside>

        <main className="flex-1 bg-white rounded-lg shadow-md p-3 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--nar)] mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando reportes...</p>
              </div>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredData}
              customStyles={customStyles}
              dense
              highlightOnHover
              fixedHeader
              fixedHeaderScrollHeight="calc(100vh - 250px)"
              noDataComponent="No hay reportes registrados"
              progressPending={loading}
            />
          )}
        </main>
      </div>
    </div>
  );
}

