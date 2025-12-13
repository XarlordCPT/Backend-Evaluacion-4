import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--fondo)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--nar)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si requiere administrador, verificar el rol
  if (requireAdmin) {
    const isAdmin = user?.rol && user.rol.toLowerCase() === "administrador";
    if (!isAdmin) {
      return <Navigate to="/mantenedor" replace />;
    }
  }

  return children;
}

