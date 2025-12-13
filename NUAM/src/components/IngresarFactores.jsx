import { useState, useEffect } from "react";

export default function IngresarFactores({ onClose, onSubmit, datosIniciales = {} }) {
  const [formData, setFormData] = useState({
    factores: Object.fromEntries(
      Array.from({ length: 30 }, (_, i) => [`factor${i + 8}`, ""])
    ),
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (datosIniciales && Object.keys(datosIniciales).length > 0) {
      setFormData((prev) => ({
        ...datosIniciales,
        factores: prev.factores || Object.fromEntries(
          Array.from({ length: 30 }, (_, i) => [`factor${i + 8}`, ""])
        ),
      }));
    }
  }, [datosIniciales]);

  const handleFactorChange = (e, key) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      factores: { ...prev.factores, [key]: value },
    }));
  };

  const validateFactores = () => {
    // Todos los factores pueden ser 0, solo validar que sean números válidos (>= 0)
    const factoresInvalidos = [];
    for (let i = 8; i <= 37; i++) {
      const factorKey = `factor${i}`;
      const valor = formData.factores[factorKey];
      
      if (valor === "" || valor === null || valor === undefined) {
        factoresInvalidos.push(`Factor ${i} está vacío`);
        continue;
      }
      
      const numValue = parseFloat(valor);
      if (isNaN(numValue) || numValue < 0) {
        factoresInvalidos.push(`Factor ${i} tiene un valor inválido (debe ser >= 0)`);
        continue;
      }
    }
    
    if (factoresInvalidos.length > 0) {
      setError(`Errores en los factores: ${factoresInvalidos.join(", ")}`);
      return false;
    }
    setError("");
    return true;
  };

  const handleGrabar = async () => {
    if (!validateFactores()) return;
    
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error al guardar:', error);
      setError('Error al guardar la calificación. Por favor, intenta nuevamente.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-[#F4F4F4] border border-gray-300 rounded-md shadow-lg w-[850px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 bg-white px-5 py-2">
          <h2 className="text-[var(--nar)] font-bold text-[16.5px]">
            Ingresar Calificación Por Factores
          </h2>
        </div>

        <div className="p-6 text-[14px]">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm mb-4">
              {error}
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded mb-4">
            <h3 className="font-semibold mb-2">Datos de la Calificación:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>Fecha Pago:</strong> {formData.fechaPago || "No especificada"}</div>
              <div><strong>Secuencia:</strong> {formData.secuencia || "No especificada"}</div>
              <div><strong>Valor Histórico:</strong> {formData.valorHistorico || "No especificado"}</div>
              <div><strong>Año:</strong> {formData.año || "No especificado"}</div>
              <div className="col-span-2"><strong>Descripción:</strong> {formData.descripcion || "No especificada"}</div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold mb-2">Factores (8 al 37):</h3>
            <div className="grid grid-cols-6 gap-2">
              {Object.keys(formData.factores).map((key, i) => (
                <label key={key} className="flex flex-col text-[13px]">
                  {`Factor ${i + 8}:`}
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.factores[key]}
                    onChange={(e) => handleFactorChange(e, key)}
                    className="border border-gray-300 rounded px-1 py-1 bg-white text-sm"
                    required
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button
              onClick={handleGrabar}
              className="bg-[var(--nar)] text-white font-semibold px-6 py-1.5 rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Grabar"}
            </button>
            <button
              onClick={onClose}
              className="border border-gray-400 px-6 py-1.5 rounded hover:bg-gray-100"
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
