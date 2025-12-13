export default function CerrarSesionConfirm({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white border border-gray-300 rounded-lg shadow-xl w-[420px] p-6 text-center relative">
        <div className="flex justify-center mb-4">
          <div className="bg-orange-100 text-orange-600 rounded-full h-14 w-14 flex items-center justify-center text-3xl">
            🚪
          </div>
        </div>
        <h3 className="text-orange-600 font-bold text-lg mb-2">
          ¿Cerrar sesión?
        </h3>
        <p className="text-gray-600 text-sm mb-5 px-4">
          ¿Estás seguro de que deseas cerrar tu sesión?
          <br />
          Deberás iniciar sesión nuevamente para acceder al sistema.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onConfirm}
            className="bg-orange-500 text-white font-semibold px-6 py-2 rounded hover:bg-orange-600 transition-all"
          >
            Cerrar Sesión
          </button>
          <button
            onClick={onCancel}
            className="border border-gray-400 px-6 py-2 rounded hover:bg-gray-100 transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

