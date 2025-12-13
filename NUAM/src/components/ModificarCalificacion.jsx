import { useState, useEffect } from "react";
import calificacionesService from "../services/calificacionesService";

export default function ModificarCalificacion({ onClose, onSubmit, calificacionData }) {
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
    factores: {},
  });

  const [opciones, setOpciones] = useState({
    mercados: [],
    tiposAgregacion: [],
    ejercicios: [],
    instrumentos: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [mercados, tiposAgregacion, ejercicios, instrumentos, calificacion] = await Promise.all([
          calificacionesService.getMercados(),
          calificacionesService.getTiposAgregacion(),
          calificacionesService.getEjercicios(),
          calificacionesService.getInstrumentos(),
          calificacionesService.getCalificacion(calificacionData.id_calificacion),
        ]);

        setOpciones({
          mercados,
          tiposAgregacion,
          ejercicios,
          instrumentos,
        });

        const factoresObj = {};
        if (calificacion.factores && Array.isArray(calificacion.factores)) {
          calificacion.factores.forEach((factor) => {
            const factorNum = factor.numero_factor.replace('Factor_', '');
            factoresObj[`factor${factorNum}`] = factor.valor.toString();
          });
        }

        for (let i = 8; i <= 37; i++) {
          if (!factoresObj[`factor${i}`]) {
            factoresObj[`factor${i}`] = "0";
          }
        }

        // Los campos tipo_agregacion, ejercicio e instrumento son write_only=True en el serializer
        // Por lo tanto, debemos extraer los IDs desde los campos _info que SÍ vienen en la respuesta
        
        const instrumentoId = calificacion.instrumento_info?.id_instrumento 
          ? String(calificacion.instrumento_info.id_instrumento)
          : (calificacionData.instrumento_id ? String(calificacionData.instrumento_id) : "");
        
        let ejercicioId = "";
        const ejercicioNombre = calificacion.ejercicio_info 
          || calificacionData?.ejercicio_info 
          || calificacionData?.ejercicio 
          || "";
        
        if (ejercicioNombre) {
          const ejercicioEncontrado = ejercicios.find(e => {
            const nombreEjercicio = String(e.nombre_ejercicio || "").trim();
            const nombreBuscado = String(ejercicioNombre || "").trim();
            return nombreEjercicio === nombreBuscado;
          });
          
          if (ejercicioEncontrado) {
            ejercicioId = String(ejercicioEncontrado.id_ejercicio);
          }
        }
        
        if (!ejercicioId && calificacionData?.ejercicio_id) {
          const ejercicioPorId = ejercicios.find(e => String(e.id_ejercicio) === String(calificacionData.ejercicio_id));
          if (ejercicioPorId) {
            ejercicioId = String(calificacionData.ejercicio_id);
          }
        }
        
        let tipoAgregacionId = "";
        const tipoNombre = calificacion.tipo_agregacion_info 
          || calificacionData?.tipo_agregacion_info 
          || calificacionData?.tipo_agregacion 
          || "";
        
        if (tipoNombre) {
          const tipoEncontrado = tiposAgregacion.find(t => {
            const nombreTipo = String(t.nombre_agregacion || "").trim();
            const nombreBuscado = String(tipoNombre || "").trim();
            return nombreTipo === nombreBuscado;
          });
          
          if (tipoEncontrado) {
            tipoAgregacionId = String(tipoEncontrado.id_tipo_agregacion);
          }
        }
        
        if (!tipoAgregacionId && calificacionData?.tipo_agregacion_id) {
          const tipoPorId = tiposAgregacion.find(t => String(t.id_tipo_agregacion) === String(calificacionData.tipo_agregacion_id));
          if (tipoPorId) {
            tipoAgregacionId = String(calificacionData.tipo_agregacion_id);
          }
        }
        
        const mercadoNombre = calificacion.instrumento_info?.mercado || calificacionData?.mercado || "";
        let mercadoEncontrado = mercados.find(m => 
          m.nombre_mercado?.toLowerCase() === mercadoNombre?.toLowerCase()
        );
        
        let mercadoId = "";
        if (mercadoEncontrado) {
          mercadoId = String(mercadoEncontrado.id_mercado);
        } else if (instrumentoId) {
          const instrumentoEncontrado = instrumentos.find(
            inst => String(inst.id_instrumento) === instrumentoId
          );
          if (instrumentoEncontrado) {
            const mercadoDelInstrumento = typeof instrumentoEncontrado.mercado === 'string'
              ? instrumentoEncontrado.mercado
              : instrumentoEncontrado.mercado?.nombre_mercado || '';
            mercadoEncontrado = mercados.find(m => 
              m.nombre_mercado?.toLowerCase() === mercadoDelInstrumento?.toLowerCase()
            );
            if (mercadoEncontrado) {
              mercadoId = String(mercadoEncontrado.id_mercado);
            }
          }
        }

        setRegistro({
          tipo_agregacion_id: tipoAgregacionId,
          ejercicio_id: ejercicioId,
          instrumento_id: instrumentoId,
          mercado_id: mercadoId,
          descripcion: calificacion.descripcion || calificacionData.descripcion || "",
          fechaPago: calificacion.fecha_pago 
            ? (calificacion.fecha_pago.split('T')[0] || calificacion.fecha_pago) 
            : (calificacionData.fecha_pago || ""),
          secuencia: calificacion.secuencia_de_evento?.toString() || calificacionData.secuencia_de_evento?.toString() || "",
          dividendo: calificacion.dividendo?.toString() || calificacionData.dividendo?.toString() || "0",
          valorHistorico: calificacion.valor_historico?.toString() || calificacionData.valor_historico?.toString() || "",
          factorActualizacion: calificacion.factor_actualizacion?.toString() || calificacionData.factor_actualizacion?.toString() || "0",
          año: calificacion.año?.toString() || calificacionData.año?.toString() || "",
          isfut: calificacion.isfut !== undefined ? calificacion.isfut : (calificacionData.isfut || false),
          factores: factoresObj,
        });
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("Error al cargar los datos. Por favor, recarga la página.");
      } finally {
        setLoading(false);
      }
    };

    if (calificacionData?.id_calificacion) {
      loadData();
    }
  }, [calificacionData]);

  useEffect(() => {
    if (
      opciones.ejercicios.length > 0 && 
      opciones.instrumentos.length > 0 && 
      opciones.mercados.length > 0 &&
      calificacionData
    ) {
      setRegistro((prev) => {
        if (prev.ejercicio_id && prev.instrumento_id && prev.tipo_agregacion_id) {
          return prev;
        }
        
        let ejercicioId = prev.ejercicio_id;
        if (!ejercicioId && calificacionData.ejercicio_info) {
          const ejercicioEncontrado = opciones.ejercicios.find(e => 
            e.nombre_ejercicio === calificacionData.ejercicio_info
          );
          if (ejercicioEncontrado) {
            ejercicioId = String(ejercicioEncontrado.id_ejercicio);
          }
        }
        
        let tipoAgregacionId = prev.tipo_agregacion_id;
        if (!tipoAgregacionId && calificacionData.tipo_agregacion_info) {
          const tipoEncontrado = opciones.tiposAgregacion.find(t => 
            t.nombre_agregacion === calificacionData.tipo_agregacion_info
          );
          if (tipoEncontrado) {
            tipoAgregacionId = String(tipoEncontrado.id_tipo_agregacion);
          }
        }
        
        let instrumentoId = prev.instrumento_id;
        if (!instrumentoId && calificacionData.instrumento_id) {
          instrumentoId = String(calificacionData.instrumento_id);
        }
        
        let mercadoId = prev.mercado_id;
        if (!mercadoId && calificacionData.mercado) {
          const mercadoEncontrado = opciones.mercados.find(m => 
            m.nombre_mercado?.toLowerCase() === calificacionData.mercado?.toLowerCase()
          );
          if (mercadoEncontrado) {
            mercadoId = String(mercadoEncontrado.id_mercado);
          }
        }
        
        if (
          (!prev.ejercicio_id && ejercicioId) ||
          (!prev.instrumento_id && instrumentoId) ||
          (!prev.tipo_agregacion_id && tipoAgregacionId) ||
          (!prev.mercado_id && mercadoId)
        ) {
          return {
            ...prev,
            ejercicio_id: ejercicioId || prev.ejercicio_id,
            instrumento_id: instrumentoId || prev.instrumento_id,
            tipo_agregacion_id: tipoAgregacionId || prev.tipo_agregacion_id,
            mercado_id: mercadoId || prev.mercado_id,
          };
        }
        return prev;
      });
    }
  }, [opciones.ejercicios, opciones.instrumentos, opciones.mercados, opciones.tiposAgregacion, calificacionData]);

  const instrumentosFiltrados = registro.mercado_id
    ? opciones.instrumentos.filter((inst) => {
        const mercadoSeleccionado = opciones.mercados.find(
          (m) => String(m.id_mercado) === registro.mercado_id
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
      if (name === "mercado_id" && prev.mercado_id !== value) {
        const instrumentosDelMercado = opciones.instrumentos.filter((inst) => {
          const mercadoSeleccionado = opciones.mercados.find(
            (m) => String(m.id_mercado) === value
          );
          if (!mercadoSeleccionado) return false;
          const mercadoInstrumento = typeof inst.mercado === 'string'
            ? inst.mercado
            : inst.mercado?.nombre_mercado || '';
          return mercadoInstrumento === mercadoSeleccionado.nombre_mercado;
        });
        
        const instrumentoActualEnNuevoMercado = instrumentosDelMercado.find(
          (inst) => String(inst.id_instrumento) === prev.instrumento_id
        );
        
        if (!instrumentoActualEnNuevoMercado) {
          updated.instrumento_id = "";
        }
      }
      return updated;
    });
  };

  const handleFactorChange = (e, key) => {
    const { value } = e.target;
    setRegistro((prev) => ({
      ...prev,
      factores: { ...prev.factores, [key]: value },
    }));
  };

  const handleToggle = (field) => {
    setRegistro((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    if (!registro.tipo_agregacion_id) {
      setError("Error: El tipo de agregación no se pudo cargar. Por favor, recarga la página.");
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

    for (let i = 8; i <= 37; i++) {
      const factorKey = `factor${i}`;
      const valor = registro.factores[factorKey];
      if (valor === "" || valor === null || valor === undefined) {
        setError(`El Factor ${i} debe tener un valor`);
        return false;
      }
      const numValue = parseFloat(valor);
      if (isNaN(numValue) || numValue < 0) {
        setError(`El Factor ${i} debe ser un valor numérico válido`);
        return false;
      }
    }
    
    setError("");
    return true;
  };

  const handleGuardar = () => {
    if (!validateForm()) return;
    onSubmit(registro);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-[#F4F4F4] border border-gray-300 rounded-md shadow-lg w-[900px] max-h-[90vh] overflow-y-auto relative">
        <div className="border-b border-gray-300 bg-white px-5 py-2">
          <h2 className="text-[var(--nar)] font-bold text-[16.5px]">
            Modificar Calificación
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
              <p className="text-gray-600">Cargando datos...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                <div>
                  <label className="font-medium">Tipo de Agregación: *</label>
                  <input
                    type="text"
                    value={
                      registro.tipo_agregacion_id
                        ? opciones.tiposAgregacion.find(
                            (t) => String(t.id_tipo_agregacion) === registro.tipo_agregacion_id
                          )?.nombre_agregacion || "Cargando..."
                        : ""
                    }
                    className="w-full border border-gray-400 rounded px-2 py-1 bg-gray-100"
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Este campo no se puede modificar</p>
                </div>

                  <div>
                    <label className="font-medium">Ejercicio: *</label>
                    <select
                      name="ejercicio_id"
                      value={registro.ejercicio_id}
                      onChange={handleChange}
                      className="w-full border border-gray-400 rounded px-2 py-1"
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {opciones.ejercicios.map((ejercicio) => (
                        <option key={ejercicio.id_ejercicio} value={String(ejercicio.id_ejercicio)}>
                          {ejercicio.nombre_ejercicio}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-medium">Mercado: *</label>
                    <select
                      name="mercado_id"
                      value={registro.mercado_id}
                      onChange={handleChange}
                      className="w-full border border-gray-400 rounded px-2 py-1"
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {opciones.mercados.map((mercado) => (
                        <option key={mercado.id_mercado} value={String(mercado.id_mercado)}>
                          {mercado.nombre_mercado}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-medium">Instrumento: *</label>
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
                        <option key={instrumento.id_instrumento} value={String(instrumento.id_instrumento)}>
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

            <div className="mt-6">
                <h3 className="font-semibold mb-3">Factores (8 al 37):</h3>
                <div className="grid grid-cols-6 gap-2">
                  {Array.from({ length: 30 }, (_, i) => {
                    const factorNum = i + 8;
                    const factorKey = `factor${factorNum}`;
                    return (
                      <label key={factorKey} className="flex flex-col text-[13px]">
                        {`Factor ${factorNum}:`}
                        <input
                          type="number"
                          step="0.0001"
                          min="0"
                          value={registro.factores[factorKey] || "0"}
                          onChange={(e) => handleFactorChange(e, factorKey)}
                          className="border border-gray-300 rounded px-1 py-1 bg-white text-sm"
                          required
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handleGuardar}
              className="bg-[var(--nar)] text-white font-semibold px-6 py-1.5 rounded hover:opacity-90 transition-all"
              disabled={loading}
            >
              Guardar Cambios
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
    </div>
  );
}

