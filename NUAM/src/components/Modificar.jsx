import { useState } from "react";

export default function Modificar({ registro, onClose, onSubmit }) {
  const [form, setForm] = useState({
    ejercicio: registro?.ejercicio || "",
    instrumento: registro?.instrumento || "",
    fechaPago: registro?.fechaPago || "",
    descripcion: registro?.descripcion || "",
    mercado: registro?.mercado || "",
    origen: registro?.origen || "",
    periodo: registro?.periodo || "",
    ...Object.fromEntries(
      Array.from({ length: 30 }, (_, i) => [
        `factor${i + 8}`,
        registro?.[`factor${i + 8}`] || "",
      ])
    ),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...registro, ...form }); // actualiza el registro existente
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[700px] max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold text-[var(--nar)] text-center mb-4">
          Modificar Registro
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input
              name="ejercicio"
              value={form.ejercicio}
              onChange={handleChange}
              className="border rounded p-2 text-sm"
              placeholder="Ejercicio"
            />
            <input
              name="instrumento"
              value={form.instrumento}
              onChange={handleChange}
              className="border rounded p-2 text-sm"
              placeholder="Instrumento"
            />
            <input
              name="fechaPago"
              value={form.fechaPago}
              onChange={handleChange}
              className="border rounded p-2 text-sm"
              placeholder="Fecha de pago"
            />
            <input
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              className="border rounded p-2 text-sm col-span-2"
              placeholder="Descripción"
            />
            <select
              name="mercado"
              value={form.mercado}
              onChange={handleChange}
              className="border rounded p-2 text-sm"
            >
              <option value="">Seleccionar mercado</option>
              <option value="Primario">Primario</option>
              <option value="Secundario">Secundario</option>
            </select>
            <select
              name="origen"
              value={form.origen}
              onChange={handleChange}
              className="border rounded p-2 text-sm"
            >
              <option value="">Seleccionar origen</option>
              <option value="Nacional">Nacional</option>
              <option value="Internacional">Internacional</option>
            </select>
            <select
              name="periodo"
              value={form.periodo}
              onChange={handleChange}
              className="border rounded p-2 text-sm col-span-2"
            >
              <option value="">Seleccionar periodo</option>
              <option value="Trimestre 1">Trimestre 1</option>
              <option value="Trimestre 2">Trimestre 2</option>
              <option value="Trimestre 3">Trimestre 3</option>
              <option value="Trimestre 4">Trimestre 4</option>
            </select>
          </div>

          <h3 className="text-[var(--nar)] font-semibold mt-4 mb-1 text-center">
            Factores (8 al 37)
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 30 }, (_, i) => (
              <input
                key={i}
                name={`factor${i + 8}`}
                value={form[`factor${i + 8}`]}
                onChange={handleChange}
                className="border rounded p-1 text-sm text-center"
                placeholder={`F-${i + 8}`}
              />
            ))}
          </div>

          <div className="flex justify-center gap-4 mt-6">
            <button
              type="submit"
              className="bg-[var(--nar)] text-white font-semibold px-6 py-2 rounded hover:opacity-90 transition-all"
            >
              Guardar Cambios
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
      </div>
    </div>
  );
}
