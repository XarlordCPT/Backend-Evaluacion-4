import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import UserIcon from "../components/UserIcon";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import calificacionesService from "../services/calificacionesService";
import authService from "../services/authService";
import { API_BASE_URL_AUTH } from "../config/api";

import Ingresar from "../components/Ingresar";
import IngresarMontos from "../components/IngresarMontos";
import IngresarFactores from "../components/IngresarFactores";
import ModificarCalificacion from "../components/ModificarCalificacion";
import Cargar from "../components/Cargar";
import CerrarSesionConfirm from "../components/CerrarSesionConfirm";
import AdminMicroservicios from "../components/AdminMicroservicios";
import RelojPaises from "../components/RelojPaises";

export default function Mantenedor() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    ejercicio: "",
    instrumento: "",
    fecha_pago: "",
    descripcion: "",
    mercado: "",
    tipo_agregacion: "",
    secuencia_de_evento: "",
  });

  const [selectedRow, setSelectedRow] = useState(null);
  const [datosPrimerPaso, setDatosPrimerPaso] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [showModalMontos, setShowModalMontos] = useState(false);
  const [showModalFactores, setShowModalFactores] = useState(false);
  const [showModalModificar, setShowModalModificar] = useState(false);
  const [showModalCarga, setShowModalCarga] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const transformCalificacionData = (apiData) => {
    const factoresObj = {};
    if (apiData.factores && Array.isArray(apiData.factores)) {
      apiData.factores.forEach((factor) => {
        const factorNum = factor.numero_factor.replace('Factor_', '');
        factoresObj[`factor${factorNum}`] = parseFloat(factor.valor);
      });
    }

    const instrumentoId = apiData.instrumento_info?.id_instrumento || apiData.instrumento || null;
    const ejercicioId = apiData.ejercicio || null;
    const tipoAgregacionId = apiData.tipo_agregacion || null;

    return {
      id: apiData.id_calificacion,
      id_calificacion: apiData.id_calificacion,
      ejercicio: apiData.ejercicio_info || '',
      ejercicio_id: ejercicioId,
      ejercicio_info: apiData.ejercicio_info || '',
      instrumento: apiData.instrumento_info?.nombre_instrumento || '',
      instrumento_id: instrumentoId,
      mercado: apiData.instrumento_info?.mercado || '',
      tipo_agregacion: apiData.tipo_agregacion_info || '',
      tipo_agregacion_id: tipoAgregacionId,
      tipo_agregacion_info: apiData.tipo_agregacion_info || '',
      fecha_pago: apiData.fecha_pago || '',
      descripcion: apiData.descripcion || '',
      secuencia_de_evento: apiData.secuencia_de_evento || '',
      dividendo: apiData.dividendo || 0,
      valor_historico: apiData.valor_historico || 0,
      año: apiData.año || '',
      isfut: apiData.isfut || false,
      factor_actualizacion: apiData.factor_actualizacion || 0,
      usuario: apiData.usuario || '',
      ...factoresObj,
    };
  };

  useEffect(() => {
    const loadCalificaciones = async () => {
      try {
        setLoading(true);
        const calificaciones = await calificacionesService.getCalificaciones();
        const transformedData = calificaciones.map(transformCalificacionData);
        setData(transformedData);
      } catch (error) {
        console.error('Error al cargar calificaciones:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadCalificaciones();
  }, []);

  const reloadCalificaciones = async () => {
    try {
      setLoading(true);
      const calificaciones = await calificacionesService.getCalificaciones();
      const transformedData = calificaciones.map(transformCalificacionData);
      setData(transformedData);
    } catch (error) {
      console.error('Error al recargar calificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const transformarDatosParaAPI = (datosFormulario) => {
    const factores = [];
    for (let i = 8; i <= 37; i++) {
      const factorKey = `factor${i}`;
      const valor = datosFormulario.factores?.[factorKey];
      const valorNumerico = valor !== undefined && valor !== null && valor !== ""
        ? parseFloat(valor)
        : 0;
      factores.push({
        numero_factor: `Factor_${i}`,
        valor: valorNumerico,
      });
    }

    return {
      tipo_agregacion: parseInt(datosFormulario.tipo_agregacion_id),
      ejercicio: parseInt(datosFormulario.ejercicio_id),
      instrumento: parseInt(datosFormulario.instrumento_id),
      secuencia_de_evento: parseInt(datosFormulario.secuencia),
      dividendo: parseFloat(datosFormulario.dividendo || 0),
      valor_historico: parseFloat(datosFormulario.valorHistorico),
      fecha_pago: datosFormulario.fechaPago,
      año: parseInt(datosFormulario.año),
      descripcion: datosFormulario.descripcion || "",
      isfut: datosFormulario.isfut || false,
      factor_actualizacion: parseFloat(datosFormulario.factorActualizacion || 0),
      factores: factores,
    };
  };

  const handleAgregar = async (datosFormulario) => {
    try {
      setLoading(true);
      const datosAPI = transformarDatosParaAPI(datosFormulario);

      // Validar que tenemos todos los datos necesarios
      if (!datosAPI.tipo_agregacion || !datosAPI.ejercicio || !datosAPI.instrumento) {
        alert("Error: Faltan datos obligatorios. Por favor, completa todos los campos.");
        setLoading(false);
        return;
      }

      if (datosAPI.factores.length !== 30) {
        alert("Error: Debes ingresar los 30 factores (del 8 al 37).");
        setLoading(false);
        return;
      }

      await calificacionesService.createCalificacion(datosAPI);

      await reloadCalificaciones();

      setShowModalFactores(false);
      setShowModalMontos(false);
      setShowModal(false);
      setShowModalModificar(false);
      setDatosPrimerPaso(null);
      setSelectedRow(null);

      alert("Calificación creada exitosamente");
    } catch (error) {
      console.error('Error al guardar calificación:', error);
      const errorMessage = error.message || 'Error desconocido';
      alert(`Error al guardar la calificación: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleModificar = async (datosFormulario) => {
    if (!selectedRow) {
      alert("Error: No hay una calificación seleccionada para modificar.");
      return;
    }

    try {
      setLoading(true);
      const datosAPI = transformarDatosParaAPI(datosFormulario);

      if (!datosAPI.tipo_agregacion || !datosAPI.ejercicio || !datosAPI.instrumento) {
        alert("Error: Faltan datos obligatorios. Por favor, completa todos los campos.");
        setLoading(false);
        return;
      }

      if (datosAPI.factores.length !== 30) {
        alert("Error: Debes ingresar los 30 factores (del 8 al 37).");
        setLoading(false);
        return;
      }

      await calificacionesService.updateCalificacion(selectedRow.id_calificacion, datosAPI);

      await reloadCalificaciones();

      setShowModalModificar(false);
      setSelectedRow(null);

      alert("Calificación actualizada exitosamente");
    } catch (error) {
      console.error('Error al actualizar calificación:', error);
      const errorMessage = error.message || 'Error desconocido';
      alert(`Error al actualizar la calificación: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = () => {
    if (!selectedRow) return;
    setShowConfirmDelete(true);
  };

  const confirmarEliminar = async () => {
    if (!selectedRow) return;

    try {
      setLoading(true);
      await calificacionesService.deleteCalificacion(selectedRow.id_calificacion);

      await reloadCalificaciones();

      setShowConfirmDelete(false);
      setSelectedRow(null);

      alert("Calificación eliminada exitosamente");
    } catch (error) {
      console.error('Error al eliminar calificación:', error);
      const errorMessage = error.message || 'Error desconocido';
      alert(`Error al eliminar la calificación: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setShowConfirmLogout(true);
  };

  const confirmarLogout = () => {
    logout();
    navigate("/login");
  };



  const handleClearFilters = () => {
    setFilters({
      ejercicio: "",
      instrumento: "",
      fecha_pago: "",
      descripcion: "",
      mercado: "",
      tipo_agregacion: "",
      secuencia_de_evento: "",
    });
  };

  const filteredData = data.filter((item) =>
    Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      const itemValue = item[key];
      if (itemValue === null || itemValue === undefined) return false;
      return itemValue.toString().toLowerCase().includes(value.toLowerCase());
    })
  );

  const columns = [
    {
      name: "ID",
      selector: (row) => row.id_calificacion,
      width: "80px",
      sortable: true
    },
    {
      name: "Ejercicio",
      selector: (row) => row.ejercicio,
      width: "100px",
      sortable: true
    },
    {
      name: "Tipo Agregación",
      selector: (row) => row.tipo_agregacion,
      width: "140px",
      sortable: true
    },
    {
      name: "Mercado",
      selector: (row) => row.mercado,
      width: "120px",
      sortable: true
    },
    {
      name: "Instrumento",
      selector: (row) => row.instrumento,
      width: "150px",
      sortable: true
    },
    {
      name: "Fecha Pago",
      selector: (row) => row.fecha_pago,
      width: "130px",
      sortable: true
    },
    {
      name: "Año",
      selector: (row) => row.año,
      width: "80px",
      sortable: true
    },
    {
      name: "Secuencia",
      selector: (row) => row.secuencia_de_evento,
      width: "100px",
      sortable: true
    },
    {
      name: "Dividendo",
      selector: (row) => parseFloat(row.dividendo || 0).toFixed(2),
      width: "110px",
      sortable: true
    },
    {
      name: "Valor Histórico",
      selector: (row) => parseFloat(row.valor_historico || 0).toFixed(2),
      width: "130px",
      sortable: true
    },
    {
      name: "Factor Actualización",
      selector: (row) => parseFloat(row.factor_actualizacion || 0).toFixed(4),
      width: "150px",
      sortable: true
    },
    {
      name: "ISFUT",
      selector: (row) => row.isfut ? "Sí" : "No",
      width: "80px",
      sortable: true
    },
    {
      name: "Descripción",
      selector: (row) => row.descripcion,
      width: "220px",
      wrap: true
    },
    ...Array.from({ length: 30 }, (_, i) => ({
      name: `Factor ${i + 8}`,
      selector: (row) => {
        const factorValue = row[`factor${i + 8}`];
        return factorValue !== undefined ? parseFloat(factorValue).toFixed(4) : '-';
      },
      width: "100px",
      sortable: true
    })),
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
        whiteSpace: "nowrap",
      },
    },
  };

  return (
    <div className="min-h-screen bg-[var(--fondo)] flex flex-col">
      <div className="bg-[#404040] p-4 flex justify-between items-center text-orange-500">
        <h1 className="font-bold text-lg">Mantenedor de Calificaciones Tributarias</h1>
        <div className="flex items-center gap-2">
          <RelojPaises />
          <button
            onClick={() => navigate("/perfil")}
            className="hover:opacity-80 transition-opacity cursor-pointer"
            title="Ver perfil"
          >
            <UserIcon className="h-6 w-6 text-[var(--nar)]" />
          </button>
          {user?.rol && user.rol.toLowerCase() === "administrador" && (
            <button
              type="button"
              onClick={() => setShowAdminModal(true)}
              className="bg-blue-600 text-white px-3 py-1 rounded font-semibold hover:bg-blue-700 transition-all"
            >
              Administrador
            </button>
          )}
          {user?.rol && user.rol.toLowerCase() === "administrador" && (
            <button
              type="button"
              onClick={() => navigate("/auditoria")}
              className="bg-green-600 text-white px-3 py-1 rounded font-semibold hover:bg-green-700 transition-all"
            >
              Auditoría
            </button>
          )}
          <button
            onClick={handleLogout}
            className="bg-orange-500 text-white px-3 py-1 rounded font-semibold hover:opacity-90"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="flex flex-1 p-6 gap-6">
        <aside className="w-[220px] bg-white p-4 rounded-lg shadow-md flex flex-col gap-3">
          <label className="text-sm font-semibold">Ejercicio:</label>
          <input
            type="text"
            value={filters.ejercicio}
            onChange={(e) => setFilters({ ...filters, ejercicio: e.target.value })}
            placeholder="Filtrar por ejercicio"
            className="border p-1 rounded text-sm"
          />

          <label className="text-sm font-semibold">Mercado:</label>
          <input
            type="text"
            value={filters.mercado}
            onChange={(e) => setFilters({ ...filters, mercado: e.target.value })}
            placeholder="Filtrar por mercado"
            className="border p-1 rounded text-sm"
          />

          <label className="text-sm font-semibold">Tipo Agregación:</label>
          <input
            type="text"
            value={filters.tipo_agregacion}
            onChange={(e) => setFilters({ ...filters, tipo_agregacion: e.target.value })}
            placeholder="Filtrar por tipo"
            className="border p-1 rounded text-sm"
          />

          <label className="text-sm font-semibold">Instrumento:</label>
          <input
            type="text"
            value={filters.instrumento}
            onChange={(e) => setFilters({ ...filters, instrumento: e.target.value })}
            placeholder="Filtrar por instrumento"
            className="border p-1 rounded text-sm"
          />

          <label className="text-sm font-semibold">Fecha Pago:</label>
          <input
            type="text"
            value={filters.fecha_pago}
            onChange={(e) => setFilters({ ...filters, fecha_pago: e.target.value })}
            placeholder="Filtrar por fecha"
            className="border p-1 rounded text-sm"
          />

          <label className="text-sm font-semibold">Secuencia:</label>
          <input
            type="text"
            value={filters.secuencia_de_evento}
            onChange={(e) => setFilters({ ...filters, secuencia_de_evento: e.target.value })}
            placeholder="Filtrar por secuencia"
            className="border p-1 rounded text-sm"
          />

          <label className="text-sm font-semibold">Descripción:</label>
          <input
            type="text"
            value={filters.descripcion}
            onChange={(e) => setFilters({ ...filters, descripcion: e.target.value })}
            placeholder="Filtrar por descripción"
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
            onClick={() => setShowModal(true)}
            className="bg-orange-500 text-white rounded py-1 text-sm hover:opacity-90"
          >
            Ingresar
          </button>

          <section className="p-0"></section>
          <button
            onClick={() => setShowModalCarga(true)}
            className="bg-white border text-black rounded py-1 text-sm hover:bg-gray-100"
          >
            Carga
          </button>

          <section className="p-0"></section>
          <button
            onClick={() => {
              if (selectedRow) {
                setShowModalModificar(true);
              }
            }}
            disabled={!selectedRow}
            className={`border rounded py-1 text-sm ${selectedRow
              ? "bg-white text-black hover:bg-gray-100"
              : "bg-gray-200 text-gray-500 cursor-not-allowed opacity-50"
              }`}
          >
            Modificar
          </button>

          <section className="p-0"></section>
          <button
            onClick={handleEliminar}
            disabled={!selectedRow}
            className={`rounded py-1 text-sm ${selectedRow
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-red-300 text-white opacity-50 cursor-not-allowed"
              }`}
          >
            Eliminar
          </button>
        </aside>

        <main className="flex-1 bg-white rounded-lg shadow-md p-3 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--nar)] mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando calificaciones...</p>
              </div>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredData}
              customStyles={customStyles}
              dense
              highlightOnHover
              selectableRows
              selectableRowsSingle
              onSelectedRowsChange={(state) => {
                const newSelection = state.selectedRows[0] || null;
                // Si había una fila seleccionada y se selecciona otra, cerrar modal si está abierto
                if (selectedRow && newSelection && selectedRow.id !== newSelection?.id && showModalModificar) {
                  setShowModalModificar(false);
                }
                setSelectedRow(newSelection);
              }}
              fixedHeader
              fixedHeaderScrollHeight="calc(100vh - 250px)"
              noDataComponent="No hay calificaciones registradas"
              progressPending={loading}
            />
          )}
        </main>
      </div>

      {showModal && (
        <Ingresar
          onClose={() => {
            setShowModal(false);
            setDatosPrimerPaso(null);
          }}
          onMontos={(datos) => {
            setDatosPrimerPaso(datos);
            setShowModal(false);
            setShowModalMontos(true);
          }}
          onFactores={(datos) => {
            setDatosPrimerPaso(datos);
            setShowModal(false);
            setShowModalFactores(true);
          }}
        />
      )}

      {showModalMontos && (
        <IngresarMontos
          onClose={() => {
            setShowModalMontos(false);
            setDatosPrimerPaso(null);
          }}
          onSubmit={handleAgregar}
          datosIniciales={datosPrimerPaso || {}}
        />
      )}

      {showModalFactores && (
        <IngresarFactores
          onClose={() => {
            setShowModalFactores(false);
            setDatosPrimerPaso(null);
          }}
          onSubmit={handleAgregar}
          datosIniciales={datosPrimerPaso || {}}
        />
      )}

      {showModalModificar && selectedRow && (
        <ModificarCalificacion
          onClose={() => {
            setShowModalModificar(false);
            setSelectedRow(null); // Limpiar selección al cerrar
          }}
          onSubmit={handleModificar}
          calificacionData={selectedRow}
        />
      )}

      {showModalCarga && (
        <Cargar
          onClose={() => setShowModalCarga(false)}
          onSubmit={async (nuevos) => {
            try {
              setLoading(true);

              // Enviar datos al backend para procesar CSV
              const resultados = await calificacionesService.cargarCSV(nuevos);

              // Mostrar resultados
              if (resultados.creadas > 0) {
                let mensaje = `Se crearon ${resultados.creadas} calificación(es) exitosamente.`;
                if (resultados.fallidas > 0) {
                  mensaje += `\n${resultados.fallidas} calificación(es) fallaron.`;
                }
                alert(mensaje);
              } else {
                alert('No se pudieron crear calificaciones. Verifica los errores en la consola.');
              }

              // Mostrar errores en consola si los hay
              if (resultados.errores && resultados.errores.length > 0) {
                console.error('Errores al cargar CSV:', resultados.errores);
                let mensajeErrores = 'Errores encontrados:\n';
                resultados.errores.slice(0, 10).forEach((error) => {
                  mensajeErrores += `Fila ${error.fila}: ${error.error}\n`;
                });
                if (resultados.errores.length > 10) {
                  mensajeErrores += `... y ${resultados.errores.length - 10} error(es) más.`;
                }
                alert(mensajeErrores);
              }

              // Recargar calificaciones
              await reloadCalificaciones();

              setShowModalCarga(false);
            } catch (error) {
              console.error('Error al cargar CSV:', error);
              alert(`Error al cargar CSV: ${error.message}`);
            } finally {
              setLoading(false);
            }
          }}
        />
      )}

      {showConfirmDelete && selectedRow && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white border border-gray-300 rounded-lg shadow-xl w-[420px] p-6 text-center relative">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 text-red-600 rounded-full h-14 w-14 flex items-center justify-center text-3xl">
                ⚠️
              </div>
            </div>

            <h3 className="text-red-600 font-bold text-lg mb-2">
              ¿Eliminar calificación permanentemente?
            </h3>
            <p className="text-gray-600 text-sm mb-5 px-4">
              Esta acción <span className="font-semibold text-red-500">no se puede deshacer</span>.
              <br />
              La calificación <strong>ID: {selectedRow?.id_calificacion}</strong> será eliminada de forma permanente.
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={confirmarEliminar}
                disabled={loading}
                className="bg-red-500 text-white font-semibold px-6 py-2 rounded hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Eliminando..." : "Eliminar"}
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                disabled={loading}
                className="border border-gray-400 px-6 py-2 rounded hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmLogout && (
        <CerrarSesionConfirm
          onConfirm={confirmarLogout}
          onCancel={() => setShowConfirmLogout(false)}
        />
      )}

      {showAdminModal && (
        <AdminMicroservicios
          onClose={() => setShowAdminModal(false)}
        />
      )}
    </div>
  );
}
