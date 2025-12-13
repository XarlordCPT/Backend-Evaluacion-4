import { useState, useEffect } from "react";
import calificacionesService from "../services/calificacionesService";

export default function Ingresar({ onClose, onMontos, onFactores }) {
  const [tipoIngreso, setTipoIngreso] = useState("factores");
  const [registro, setRegistro] = useState({
    tipo_agregacion_id: "",
    ejercicio_id: "",
    instrumento_id: "",
    mercado_id: "",
    descripcion: "",
    fechaPago: "",
    secuencia: "",
    dividendo: "0",
    valorHistorico: "",
    factorActualizacion: "0",
    año: "",
    isfut: false,
  });

  const [opciones, setOpciones] = useState({
    mercados: [],
    tiposAgregacion: [],
    ejercicios: [],
    instrumentos: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModalNuevo, setShowModalNuevo] = useState({
    tipo: null, // 'mercado', 'ejercicio', 'instrumento'
    abierto: false,
  });
  const [nuevoValor, setNuevoValor] = useState("");
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    const loadOpciones = async () => {
      try {
        setLoading(true);
        const [mercados, tiposAgregacion, ejercicios, instrumentos] = await Promise.all([
          calificacionesService.getMercados(),
          calificacionesService.getTiposAgregacion(),
          calificacionesService.getEjercicios(),
          calificacionesService.getInstrumentos(),
        ]);

        setOpciones({
          mercados,
          tiposAgregacion,
          ejercicios,
          instrumentos,
        });

        const tipoMonto = tiposAgregacion.find(
          (tipo) => tipo.nombre_agregacion === "MANUAL (MONTO)"
        );
        const tipoFactores = tiposAgregacion.find(
          (tipo) => tipo.nombre_agregacion === "MANUAL (FACTORES)"
        );

        if (tipoIngreso === "montos" && tipoMonto) {
          setRegistro((prev) => ({
            ...prev,
            tipo_agregacion_id: tipoMonto.id_tipo_agregacion.toString(),
          }));
        } else if (tipoIngreso === "factores" && tipoFactores) {
          setRegistro((prev) => ({
            ...prev,
            tipo_agregacion_id: tipoFactores.id_tipo_agregacion.toString(),
          }));
        }
      } catch (err) {
        console.error("Error al cargar opciones:", err);
        setError("Error al cargar las opciones. Por favor, recarga la página.");
      } finally {
        setLoading(false);
      }
    };

    loadOpciones();
  }, []);

  useEffect(() => {
    if (opciones.tiposAgregacion.length > 0) {
      const tipoMonto = opciones.tiposAgregacion.find(
        (tipo) => tipo.nombre_agregacion === "MANUAL (MONTO)"
      );
      const tipoFactores = opciones.tiposAgregacion.find(
        (tipo) => tipo.nombre_agregacion === "MANUAL (FACTORES)"
      );

      if (tipoIngreso === "montos" && tipoMonto) {
        setRegistro((prev) => ({
          ...prev,
          tipo_agregacion_id: tipoMonto.id_tipo_agregacion.toString(),
        }));
      } else if (tipoIngreso === "factores" && tipoFactores) {
        setRegistro((prev) => ({
          ...prev,
          tipo_agregacion_id: tipoFactores.id_tipo_agregacion.toString(),
        }));
      }
    }
  }, [tipoIngreso, opciones.tiposAgregacion]);

  const instrumentosFiltrados = registro.mercado_id
    ? opciones.instrumentos.filter((inst) => {
        const mercadoSeleccionado = opciones.mercados.find(
          (m) => m.id_mercado === parseInt(registro.mercado_id) || m.nombre_mercado === registro.mercado_id
        );
        if (!mercadoSeleccionado) return false;
        
        const mercadoInstrumento = typeof inst.mercado === 'string' 
          ? inst.mercado 
          : inst.mercado?.nombre_mercado || '';
        return mercadoInstrumento === mercadoSeleccionado.nombre_mercado;
      })
    : opciones.instrumentos;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRegistro((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "mercado_id") {
        updated.instrumento_id = "";
      }
      return updated;
    });
  };

  const handleToggle = (field) => {
    setRegistro((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    if (!registro.tipo_agregacion_id) {
      setError("Error: No se pudo asignar el tipo de agregación. Por favor, recarga la página.");
      return false;
    }
    if (!registro.ejercicio_id) {
      setError("Debes seleccionar un ejercicio");
      return false;
    }
    if (!registro.instrumento_id) {
      setError("Debes seleccionar un instrumento");
      return false;
    }
    if (!registro.fechaPago) {
      setError("Debes ingresar una fecha de pago");
      return false;
    }
    
    const fechaPago = new Date(registro.fechaPago);
    const fechaActual = new Date();
    fechaActual.setHours(23, 59, 59, 999);
    if (fechaPago > fechaActual) {
      setError("La fecha de pago no puede ser superior a la fecha actual");
      return false;
    }
    
    if (!registro.secuencia) {
      setError("Debes ingresar una secuencia de evento");
      return false;
    }
    
    const secuencia = parseInt(registro.secuencia);
    if (isNaN(secuencia) || secuencia < 0) {
      setError("La secuencia de evento debe ser un valor numérico válido");
      return false;
    }
    
    const dividendo = registro.dividendo === "" ? 0 : parseFloat(registro.dividendo);
    if (isNaN(dividendo) || dividendo < 0) {
      setError("El dividendo debe ser un valor numérico mayor o igual a 0");
      return false;
    }
    
    if (!registro.valorHistorico) {
      setError("Debes ingresar un valor histórico");
      return false;
    }
    
    const valorHistorico = parseFloat(registro.valorHistorico);
    if (isNaN(valorHistorico) || valorHistorico < 0) {
      setError("El valor histórico debe ser un valor numérico válido");
      return false;
    }
    
    const factorActualizacion = registro.factorActualizacion === "" ? 0 : parseFloat(registro.factorActualizacion);
    if (isNaN(factorActualizacion) || factorActualizacion < 0) {
      setError("El factor de actualización debe ser un valor numérico mayor o igual a 0");
      return false;
    }
    
    if (!registro.año) {
      setError("Debes ingresar un año");
      return false;
    }
    
    const año = parseInt(registro.año);
    if (isNaN(año) || año < 1900 || año > 2100) {
      setError("El año debe ser un valor numérico válido");
      return false;
    }
    
    setError("");
    return true;
  };

  const goMontos = () => {
    if (!validateForm()) return;
    onMontos(registro);
  };

  const goFactores = () => {
    if (!validateForm()) return;
    onFactores(registro);
  };

  const abrirModalNuevo = (tipo) => {
    // Para instrumento, necesitamos que primero se haya seleccionado un mercado
    if (tipo === 'instrumento' && !registro.mercado_id) {
      setError("Debes seleccionar un mercado antes de añadir un instrumento");
      return;
    }
    setShowModalNuevo({ tipo, abierto: true });
    setNuevoValor("");
    setError("");
  };

  const cerrarModalNuevo = () => {
    setShowModalNuevo({ tipo: null, abierto: false });
    setNuevoValor("");
    setError("");
  };

  const handleCrearNuevo = async () => {
    if (!nuevoValor.trim()) {
      setError(`Debes ingresar un ${showModalNuevo.tipo === 'mercado' ? 'mercado' : showModalNuevo.tipo === 'ejercicio' ? 'ejercicio' : 'instrumento'}`);
      return;
    }

    setCreando(true);
    setError("");

    try {
      let nuevoElemento;

      switch (showModalNuevo.tipo) {
        case 'mercado':
          nuevoElemento = await calificacionesService.createMercado(nuevoValor.trim());
          // Actualizar lista de mercados
          const mercadosActualizados = await calificacionesService.getMercados();
          setOpciones(prev => ({ ...prev, mercados: mercadosActualizados }));
          // Seleccionar el nuevo mercado
          setRegistro(prev => ({ ...prev, mercado_id: nuevoElemento.id_mercado.toString() }));
          break;

        case 'ejercicio':
          nuevoElemento = await calificacionesService.createEjercicio(nuevoValor.trim());
          // Actualizar lista de ejercicios
          const ejerciciosActualizados = await calificacionesService.getEjercicios();
          setOpciones(prev => ({ ...prev, ejercicios: ejerciciosActualizados }));
          // Seleccionar el nuevo ejercicio
          setRegistro(prev => ({ ...prev, ejercicio_id: nuevoElemento.id_ejercicio.toString() }));
          break;

        case 'instrumento':
          nuevoElemento = await calificacionesService.createInstrumento(
            nuevoValor.trim(),
            parseInt(registro.mercado_id)
          );
          // Actualizar lista de instrumentos
          const instrumentosActualizados = await calificacionesService.getInstrumentos();
          setOpciones(prev => ({ ...prev, instrumentos: instrumentosActualizados }));
          // Seleccionar el nuevo instrumento
          setRegistro(prev => ({ ...prev, instrumento_id: nuevoElemento.id_instrumento.toString() }));
          break;

        default:
          throw new Error("Tipo de elemento no válido");
      }

      cerrarModalNuevo();
    } catch (err) {
      console.error("Error al crear nuevo elemento:", err);
      setError(err.message || "Error al crear el elemento. Puede que ya exista.");
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-[#F4F4F4] border border-gray-300 rounded-md shadow-lg w-[850px] max-h-[90vh] overflow-y-auto relative">
        <div className="border-b border-gray-300 bg-white px-5 py-2">
          <h2 className="text-[var(--nar)] font-bold text-[16.5px]">
            Ingresar Calificación
          </h2>
        </div>

        <form className="p-5 space-y-5 text-[15px]">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-4">
              <p className="text-gray-600">Cargando opciones...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="font-medium">Tipo de Ingreso: *</label>
                  <div className="flex gap-4 items-center mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tipoIngreso"
                        value="factores"
                        checked={tipoIngreso === "factores"}
                        onChange={(e) => setTipoIngreso(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span>Ingreso por Factores</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tipoIngreso"
                        value="montos"
                        checked={tipoIngreso === "montos"}
                        onChange={(e) => setTipoIngreso(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span>Ingreso por Montos</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Tipo de agregación: {registro.tipo_agregacion_id 
                      ? opciones.tiposAgregacion.find(t => t.id_tipo_agregacion.toString() === registro.tipo_agregacion_id)?.nombre_agregacion 
                      : "Se asignará automáticamente"}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-medium">Ejercicio: *</label>
                    <button
                      type="button"
                      onClick={() => abrirModalNuevo('ejercicio')}
                      className="text-xs text-[var(--nar)] hover:underline"
                    >
                      + Añadir nuevo
                    </button>
                  </div>
                  <select
                    name="ejercicio_id"
                    value={registro.ejercicio_id}
                    onChange={handleChange}
                    className="w-full border border-gray-400 rounded px-2 py-1"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {opciones.ejercicios.map((ejercicio) => (
                      <option key={ejercicio.id_ejercicio} value={ejercicio.id_ejercicio}>
                        {ejercicio.nombre_ejercicio}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-medium">Mercado: *</label>
                    <button
                      type="button"
                      onClick={() => abrirModalNuevo('mercado')}
                      className="text-xs text-[var(--nar)] hover:underline"
                    >
                      + Añadir nuevo
                    </button>
                  </div>
                  <select
                    name="mercado_id"
                    value={registro.mercado_id}
                    onChange={handleChange}
                    className="w-full border border-gray-400 rounded px-2 py-1"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {opciones.mercados.map((mercado) => (
                      <option key={mercado.id_mercado} value={mercado.id_mercado}>
                        {mercado.nombre_mercado}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-medium">Instrumento: *</label>
                    <button
                      type="button"
                      onClick={() => abrirModalNuevo('instrumento')}
                      className="text-xs text-[var(--nar)] hover:underline"
                      disabled={!registro.mercado_id}
                    >
                      + Añadir nuevo
                    </button>
                  </div>
                  <select
                    name="instrumento_id"
                    value={registro.instrumento_id}
                    onChange={handleChange}
                    className="w-full border border-gray-400 rounded px-2 py-1"
                    required
                    disabled={!registro.mercado_id || instrumentosFiltrados.length === 0}
                  >
                    <option value="">
                      {!registro.mercado_id 
                        ? "Selecciona primero un mercado" 
                        : instrumentosFiltrados.length === 0
                        ? "No hay instrumentos disponibles"
                        : "Seleccionar..."}
                    </option>
                    {instrumentosFiltrados.map((instrumento) => (
                      <option key={instrumento.id_instrumento} value={instrumento.id_instrumento}>
                        {instrumento.nombre_instrumento}
                      </option>
                    ))}
                  </select>
                </div>

              <div>
                <label className="font-medium">Descripción:</label>
                <input
                  name="descripcion"
                  value={registro.descripcion}
                  onChange={handleChange}
                  className="w-full border border-gray-400 rounded px-2 py-1"
                  type="text"
                />
              </div>

              <div>
                <label className="font-medium">Fecha Pago: *</label>
                <input
                  name="fechaPago"
                  value={registro.fechaPago}
                  onChange={handleChange}
                  className="w-full border border-gray-400 rounded px-2 py-1"
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">No puede ser superior a la fecha actual</p>
              </div>

                <div>
                  <label className="font-medium">Secuencia Evento: *</label>
                  <input
                    name="secuencia"
                    value={registro.secuencia}
                    onChange={handleChange}
                    className="w-full border border-gray-400 rounded px-2 py-1"
                    type="number"
                    min="0"
                    placeholder="Número de secuencia"
                    required
                  />
                </div>

                <div>
                  <label className="font-medium">Dividendo: *</label>
                  <input
                    name="dividendo"
                    value={registro.dividendo}
                    onChange={handleChange}
                    className="w-full border border-gray-400 rounded px-2 py-1"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="font-medium">Valor Histórico: *</label>
                  <input
                    name="valorHistorico"
                    value={registro.valorHistorico}
                    onChange={handleChange}
                    className="w-full border border-gray-400 rounded px-2 py-1"
                    type="number"
                    step="0.01"
                    required
                  />
                </div>
            </div>

            <div className="space-y-3">
                <div>
                  <label className="font-medium">Factor de actualización: *</label>
                  <input
                    name="factorActualizacion"
                    value={registro.factorActualizacion}
                    onChange={handleChange}
                    className="w-full border border-gray-400 rounded px-2 py-1"
                    type="number"
                    step="0.0001"
                    min="0"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="font-medium">Año: *</label>
                  <input
                    name="año"
                    value={registro.año}
                    onChange={handleChange}
                    className="w-full border border-gray-400 rounded px-2 py-1"
                    type="number"
                    required
                  />
                </div>

              <div className="flex items-center gap-3 mt-4">
                <label className="font-medium">ISFUT:</label>
                <div
                  onClick={() => handleToggle("isfut")}
                  className={`w-10 h-5 rounded-full cursor-pointer transition-all ${
                    registro.isfut ? "bg-[var(--nar)]" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      registro.isfut ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  ></div>
                </div>
              </div>

              </div>
            </div>
          )}

          <div className="flex justify-center gap-6 mt-6">
            <button
              type="button"
              onClick={tipoIngreso === "factores" ? goFactores : goMontos}
              className="bg-[var(--nar)] text-white font-semibold px-6 py-1.5 rounded hover:opacity-90 transition-all"
              disabled={loading}
            >
              {tipoIngreso === "factores" 
                ? "Ir a Ingreso por Factores" 
                : "Ir a Ingreso por Montos"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-400 px-6 py-1.5 rounded hover:bg-gray-100 transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {/* Modal para añadir nuevo elemento */}
      {showModalNuevo.abierto && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
          <div className="bg-[#F4F4F4] border border-gray-300 rounded-md shadow-lg w-96">
            <div className="border-b border-gray-300 bg-white px-5 py-2">
              <h3 className="text-[var(--nar)] font-bold text-[16.5px]">
                Añadir nuevo {showModalNuevo.tipo === 'mercado' ? 'Mercado' : showModalNuevo.tipo === 'ejercicio' ? 'Ejercicio' : 'Instrumento'}
              </h3>
            </div>
            <div className="p-5 space-y-4">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="font-medium text-[15px]">
                  Nombre {showModalNuevo.tipo === 'mercado' ? 'del mercado' : showModalNuevo.tipo === 'ejercicio' ? 'del ejercicio' : 'del instrumento'}: *
                </label>
                <input
                  type="text"
                  value={nuevoValor}
                  onChange={(e) => setNuevoValor(e.target.value)}
                  className="w-full border border-gray-400 rounded px-2 py-1 mt-1"
                  placeholder={`Ingresa el nombre...`}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCrearNuevo();
                    } else if (e.key === 'Escape') {
                      cerrarModalNuevo();
                    }
                  }}
                />
                {showModalNuevo.tipo === 'instrumento' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Se asociará al mercado: {opciones.mercados.find(m => m.id_mercado.toString() === registro.mercado_id)?.nombre_mercado || 'N/A'}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cerrarModalNuevo}
                  className="border border-gray-400 px-4 py-1.5 rounded hover:bg-gray-100 transition-all"
                  disabled={creando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCrearNuevo}
                  className="bg-[var(--nar)] text-white font-semibold px-4 py-1.5 rounded hover:opacity-90 transition-all"
                  disabled={creando || !nuevoValor.trim()}
                >
                  {creando ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
