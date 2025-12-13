import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo_Nuam from "../assets/Logo_Nuam.png";
import Logo_Inacap from "../assets/Logo_Inacap.png";
import UserIcon from "../components/UserIcon";
import { useAuth } from "../context/AuthContext";
import authService from "../services/authService";


export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetStep, setResetStep] = useState(1); // 1: email, 2: code, 3: new password
  const [resetUserId, setResetUserId] = useState(null);
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function onLoginSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(username, password);

      if (result.success) {
        navigate("/mantenedor");
      } else {
        // Traducir mensaje de error del backend a español
        let errorMessage = result.error || "Error al iniciar sesión";
        if (errorMessage.includes("No active account") || errorMessage.includes("Unable to log in")) {
          errorMessage = "Credenciales incorrectas";
        }
        setError(errorMessage);
      }
    } catch (err) {
      // Traducir mensaje de error del backend a español
      let errorMessage = err.message || "Error al iniciar sesión";
      if (errorMessage.includes("No active account") || errorMessage.includes("Unable to log in")) {
        errorMessage = "Credenciales incorrectas";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const handlePasswordResetRequest = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);

    try {
      const result = await authService.requestPasswordReset(resetEmail);
      setResetUserId(result.user_id);
      setResetStep(2);
      setResetError("");
    } catch (err) {
      setResetError(err.message || "Error al solicitar recuperación");
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);

    if (resetCode.length !== 6) {
      setResetError("El código debe tener 6 dígitos");
      setResetLoading(false);
      return;
    }

    // Validar el código con el backend ANTES de avanzar al paso 3
    try {
      await authService.validatePasswordResetCode(resetUserId, resetCode);
      // Código válido, avanzar al paso 3
      setResetStep(3);
      setResetError("");
    } catch (err) {
      setResetError(err.message || "Error al verificar código");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);

    if (newPassword !== confirmPassword) {
      setResetError("Las contraseñas no coinciden");
      setResetLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setResetError("La contraseña debe tener al menos 8 caracteres");
      setResetLoading(false);
      return;
    }

    try {
      await authService.verifyPasswordReset(resetUserId, resetCode, newPassword);
      alert("Contraseña actualizada exitosamente. Ahora puedes iniciar sesión.");
      setShowPasswordReset(false);
      resetPasswordResetForm();
    } catch (err) {
      setResetError(err.message || "Error al actualizar contraseña");
    } finally {
      setResetLoading(false);
    }
  };

  const resetPasswordResetForm = () => {
    setResetEmail("");
    setResetCode("");
    setNewPassword("");
    setConfirmPassword("");
    setResetStep(1);
    setResetUserId(null);
    setResetError("");
  };


  return (
    <div className="min-h-[100dvh]">
      <div className="grid grid-rows-2 md:grid-rows-1 md:grid-cols-2 min-h-[100dvh]">
        <section className="bg-[var(--fondo)] text-black grid place-items-center p-8">
          <div className="text-center space-y-2">
            <img src={Logo_Nuam} alt="Logo" className="h-15 w-auto max-w-[400px] " />

            <section className="p-10"></section>

            <span className="inline-flex items-center gap-2 font-bold text-black ">
              <span> Made By: </span>
              <img src={Logo_Inacap} alt="Logo" className="h-10 w-auto max-w-[400px]" />
            </span>

            <section className="p-10"></section>

            <span className="inline-flex items-center gap-3 font-bold ">
              <span> Powered By: </span>
              <ul className="text-justify">
                <li>Duarte Benjamin</li>
                <li>Medina Cristobal</li>
                <li>Villalobos Patricio</li>
              </ul>
            </span>
          </div>
        </section>
        <section className="bg-[var(--nar)] grid place-items-center p-8">

          <div className="relative w-full min-h-[500px] max-h-[90vh] max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-10 pt-12 overflow-y-auto">
            <section className="p-5"></section>
            <div className="relative -top-6 left-1/2 -translate-x-1/2
                            h-16 w-16 rounded-full grid place-items-center
                            bg-[var(--nar)]">
              <UserIcon className="h-6 w-6" />
            </div>

            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-800">Iniciar sesión</h2>
              <p className="text-sm text-slate-500">Usa tus credenciales</p>
            </div>


            <form onSubmit={onLoginSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
                  {error}
                </div>
              )}
              <input
                className="w-full rounded border border-slate-300 bg-white px-3 py-2"
                placeholder="Usuario"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
              <input
                className="w-full rounded border border-slate-300 bg-white px-3 py-2"
                placeholder="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="submit"
                className="w-full rounded bg-[var(--nar)] py-2.5 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </button>

              <button
                type="button"
                onClick={() => setShowPasswordReset(true)}
                className="w-full text-sm text-slate-600 hover:text-slate-800 underline mt-2"
              >
                ¿Olvidaste tu contraseña?
              </button>
              <p className="text-xs text-slate-500 text-center mt-3">
                No existe opción de registro. Si no tienes cuenta, contacta con un superior.
              </p>
            </form>

            {/* Modal de recuperación de contraseña */}
            {showPasswordReset && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-2xl">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Recuperar Contraseña</h3>
                    <button
                      onClick={() => {
                        setShowPasswordReset(false);
                        resetPasswordResetForm();
                      }}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      ✕
                    </button>
                  </div>

                  {resetError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm mb-4">
                      {resetError}
                    </div>
                  )}

                  {resetStep === 1 && (
                    <form onSubmit={handlePasswordResetRequest} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Correo electrónico
                        </label>
                        <input
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="Ingresa tu correo"
                          className="w-full rounded border border-slate-300 bg-white px-3 py-2"
                          required
                          disabled={resetLoading}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={resetLoading}
                        className="w-full rounded bg-[var(--nar)] py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resetLoading ? "Enviando..." : "Enviar Código"}
                      </button>
                    </form>
                  )}

                  {resetStep === 2 && (
                    <form onSubmit={handleVerifyCode} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Código de verificación (6 dígitos)
                        </label>
                        <input
                          type="text"
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                          className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-center text-xl tracking-widest"
                          maxLength={6}
                          required
                          disabled={resetLoading}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Revisa tu correo electrónico para obtener el código
                        </p>
                      </div>
                      <button
                        type="submit"
                        disabled={resetLoading || resetCode.length !== 6}
                        className="w-full rounded bg-[var(--nar)] py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resetLoading ? "Verificando..." : "Verificar Código"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setResetStep(1)}
                        className="w-full text-sm text-slate-600 hover:text-slate-800 underline"
                      >
                        Cambiar correo
                      </button>
                    </form>
                  )}

                  {resetStep === 3 && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Nueva contraseña
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 8 caracteres"
                          className="w-full rounded border border-slate-300 bg-white px-3 py-2"
                          required
                          disabled={resetLoading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Confirmar contraseña
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repite la contraseña"
                          className="w-full rounded border border-slate-300 bg-white px-3 py-2"
                          required
                          disabled={resetLoading}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={resetLoading}
                        className="w-full rounded bg-[var(--nar)] py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resetLoading ? "Actualizando..." : "Actualizar Contraseña"}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>

        </section>
      </div>
    </div>
  );
}


