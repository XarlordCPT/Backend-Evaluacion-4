import { useState } from "react";
import Papa from "papaparse";

export default function Cargar({ onClose, onSubmit }) {
  const [csvDataRaw, setCsvDataRaw] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [modoManual, setModoManual] = useState(false);
  const [showEjemplo, setShowEjemplo] = useState(false);

  const [registroManual, setRegistroManual] = useState({
    ejercicio: "",
    instrumento: "",
    fechaPago: "",
    descripcion: "",
    mercado: "",
    origen: "",
    periodo: "",
    secuencia: "",
    año: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRegistroManual((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: "",
      complete: (results) => {
        const rows = results.data || [];
        if (rows.length === 0) {
          alert("No se encontraron datos en el archivo. Verifica el CSV.");
          return;
        }
        const hdrs = results.meta.fields || Object.keys(rows[0]);
        setHeaders(hdrs);
        setCsvDataRaw((prev) => [...prev, ...rows]);
        console.log("ARCHIVO CSV LEÍDO →", rows);
      },
      error: (err) => {
        console.error("Error al leer CSV:", err);
        alert("Error al leer el archivo CSV.");
      },
    });
  };

  const normalizeRow = (row, idx) => {
    const out = {
      ejercicio: row["Ejercicio"] ?? row["ejercicio"] ?? "",
      instrumento: row["Instrumento"] ?? row["instrumento"] ?? "",
      fechaPago:
        row["Fecha Pago"] ?? row["FechaPago"] ?? row["fechaPago"] ?? row["fecha pago"] ?? "",
      descripcion:
        row["Descripción"] ?? row["Descripcion"] ?? row["descripcion"] ?? row["Descripción"] ?? "",
      secuencia: row["Secuencia"] ?? row["secuencia"] ?? "",
      mercado: row["Mercado"] ?? row["mercado"] ?? "",
      // NOTA: El campo "origen" no se usa en carga masiva, siempre se usa "MASIVA"
      periodo: row["Periodo"] ?? row["periodo"] ?? "",
      año: row["Año"] ?? row["Anio"] ?? row["año"] ?? row["anio"] ?? "",
      // Campos opcionales
      dividendo: row["Dividendo"] ?? row["dividendo"] ?? "",
      valor_historico: row["Valor Histórico"] ?? row["Valor Historico"] ?? row["valor_historico"] ?? row["valorHistorico"] ?? "",
      isfut: row["ISFUT"] ?? row["isfut"] ?? row["Isfut"] ?? "",
      factor_actualizacion: row["Factor Actualización"] ?? row["Factor Actualizacion"] ?? row["factor_actualizacion"] ?? row["factorActualizacion"] ?? "",
    };

    // Extraer factores (factor8 a factor37)
    Object.keys(row).forEach((key) => {
      const m = key.trim().match(/^factor[\s\-]?(\d{2})$/i);
      if (m) {
        const num = parseInt(m[1], 10);
        if (num >= 8 && num <= 37) {
          out[`factor${num}`] = row[key] ?? "";
        }
      }
    });

    if (!out.id) out.id = Date.now() + idx;
    return out;
  };

  const handleGuardar = () => {
    if (modoManual) {
      // Generar factores vacíos (el backend los manejará con valores por defecto)
      const factores = Object.fromEntries(
        Array.from({ length: 30 }, (_, i) => [
          `factor${i + 8}`,
          "",
        ])
      );

      const nuevoRegistro = { ...registroManual, ...factores };
      onSubmit([nuevoRegistro]);
      onClose();
      return;
    }

    if (csvDataRaw.length === 0) return;
    setShowConfirm(true);
  };

  const confirmarGuardar = () => {
    const normalizados = csvDataRaw.map((r, i) => normalizeRow(r, i));
    onSubmit(normalizados);
    setShowConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-[#F4F4F4] border border-gray-300 rounded-md shadow-lg w-[900px] max-h-[90vh] overflow-y-auto relative">
        <div className="border-b border-gray-300 bg-white px-5 py-2 flex justify-between items-center">
          <h2 className="text-[var(--nar)] font-bold text-[16.5px]">Cargar Calificación</h2>

          <button
            onClick={() => setModoManual((v) => !v)}
            className="text-sm bg-[var(--nar)] text-white px-3 py-1 rounded hover:opacity-90"
          >
            {modoManual ? "Usar Archivo CSV" : "Ingresar Manualmente"}
          </button>
        </div>

        <div className="p-5">
          {modoManual ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGuardar();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                {[
                  "ejercicio",
                  "instrumento",
                  "fechaPago",
                  "descripcion",
                  "mercado",
                  "origen",
                  "periodo",
                  "secuencia",
                  "año",
                ].map((campo) => (
                  <input
                    key={campo}
                    name={campo}
                    value={registroManual[campo] ?? ""}
                    onChange={handleChange}
                    className="border rounded p-2 text-sm"
                    placeholder={campo.charAt(0).toUpperCase() + campo.slice(1)}
                  />
                ))}
              </div>

              <div className="flex justify-center gap-4 mt-6">
                <button
                  type="submit"
                  className="bg-[var(--nar)] text-white font-semibold px-6 py-2 rounded hover:opacity-90 transition-all"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="border border-gray-400 px-6 py-2 rounded hover:bg-gray-100 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Nota sobre tipo de agregación */}
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded">
                <p className="text-sm text-orange-800">
                  <strong>Nota:</strong> Revisar el ejemplo de formato CSV para cargar las calificaciones antes de cualquier carga para evitar errores.
                </p>
              </div>

              {/* Botón para mostrar ejemplo */}
              <div className="mb-4">
                <button
                  onClick={() => setShowEjemplo(!showEjemplo)}
                  className="text-sm text-orange-600 hover:text-orange-800 underline"
                >
                  {showEjemplo ? "Ocultar ejemplo" : "Ver ejemplo de formato CSV"}
                </button>
              </div>

              {/* Ejemplo de CSV */}
              {showEjemplo && (
                <div className="mb-4 p-4 bg-gray-50 border border-gray-300 rounded">
                  <h3 className="text-sm font-semibold mb-2">Ejemplo de formato CSV:</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border border-gray-300 bg-white">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-2 text-left">Ejercicio</th>
                          <th className="border border-gray-300 p-2 text-left">Instrumento</th>
                          <th className="border border-gray-300 p-2 text-left">Mercado</th>
                          <th className="border border-gray-300 p-2 text-left">Fecha Pago</th>
                          <th className="border border-gray-300 p-2 text-left">Secuencia</th>
                          <th className="border border-gray-300 p-2 text-left">Año</th>
                          <th className="border border-gray-300 p-2 text-left">Descripción</th>
                          <th className="border border-gray-300 p-2 text-left">Factor08</th>
                          <th className="border border-gray-300 p-2 text-left">Factor09</th>
                          <th className="border border-gray-300 p-2 text-left">...</th>
                          <th className="border border-gray-300 p-2 text-left">Factor37</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-2">Ejercicio 2025</td>
                          <td className="border border-gray-300 p-2">Instrumento A</td>
                          <td className="border border-gray-300 p-2">AC</td>
                          <td className="border border-gray-300 p-2">2025-01-15</td>
                          <td className="border border-gray-300 p-2">10001</td>
                          <td className="border border-gray-300 p-2">2025</td>
                          <td className="border border-gray-300 p-2">Descripción ejemplo</td>
                          <td className="border border-gray-300 p-2">1.5</td>
                          <td className="border border-gray-300 p-2">1.6</td>
                          <td className="border border-gray-300 p-2">...</td>
                          <td className="border border-gray-300 p-2">2.5</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 text-xs text-gray-600">
                    <p><strong>Campos requeridos:</strong> Ejercicio, Instrumento, Mercado, Fecha Pago, Secuencia, Año</p>
                    <p><strong>Campos opcionales:</strong> Descripción, Dividendo, Valor Histórico, ISFUT, Factor Actualización</p>
                    <p><strong>Factores:</strong> Factor08, Factor09, ..., Factor37 (valores numéricos)</p>
                    <p className="mt-2 text-orange-700"><strong>Recordatorio:</strong> El tipo de agregación será automáticamente "MASIVA" para todas las cargas masivas.</p>
                  </div>
                </div>
              )}

              {csvDataRaw.length > 0 ? (
                <div className="overflow-x-auto mb-5">
                  <table className="w-full text-sm border border-gray-300 bg-white">
                    <thead>
                      <tr>
                        {headers.map((head, i) => (
                          <th
                            key={i}
                            className="border border-gray-300 p-1 text-left bg-[var(--fondo)]"
                          >
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvDataRaw.map((row, i) => (
                        <tr key={i}>
                          {headers.map((h, j) => (
                            <td key={j} className="border border-gray-300 px-2 py-1">
                              {row[h]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500 italic mb-6">
                  No hay datos cargados. Seleccione un archivo CSV para previsualizar.
                </div>
              )}

              <div className="flex justify-end gap-3">
                <label className="bg-[var(--nar)] text-white px-4 py-1.5 rounded font-semibold hover:opacity-90 cursor-pointer">
                  Cargar Archivo
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>

                <button
                  onClick={handleGuardar}
                  disabled={csvDataRaw.length === 0}
                  className={`px-6 py-1.5 rounded font-semibold ${
                    csvDataRaw.length > 0
                      ? "bg-[var(--nar)] text-white hover:opacity-90"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Guardar
                </button>

                <button
                  onClick={onClose}
                  className="border border-gray-400 px-6 py-1.5 rounded hover:bg-gray-100"
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>

        {showConfirm && (
          <div className="absolute inset-0 bg-black/30 flex justify-center items-center">
            <div className="bg-[#F4F4F4] border border-gray-400 rounded-md shadow-lg px-10 py-6 text-center">
              <h3 className="text-[var(--nar)] font-bold mb-4">
                ¿Desea guardar los datos cargados?
              </h3>
              <div className="flex justify-center gap-4">
                <button
                  onClick={confirmarGuardar}
                  className="bg-[var(--nar)] text-white font-semibold px-5 py-1.5 rounded hover:opacity-90"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="border border-gray-400 px-5 py-1.5 rounded hover:bg-gray-100"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
