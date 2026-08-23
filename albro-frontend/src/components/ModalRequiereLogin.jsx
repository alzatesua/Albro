import { useNavigate } from "react-router";

/**
 * Modal genérico para pedir login/registro antes de continuar una acción.
 *
 * Uso:
 *   <ModalRequiereLogin
 *     abierto={mostrarModalLogin}
 *     onCancelar={() => setMostrarModalLogin(false)}
 *     onClose={onClose}              // opcional: cierra también el modal padre
 *     titulo="Espera, necesitas una cuenta para continuar"
 *     mensaje="Inicia sesión o regístrate para ver la disponibilidad y confirmar tu cita."
 *     redirectTo="/dashboard"        // a dónde vuelve después de loguearse
 *   />
 */
const ModalRequiereLogin = ({
  abierto,
  onCancelar,
  onClose,
  titulo = "Espera, necesitas una cuenta para continuar",
  mensaje = "Inicia sesión o regístrate para continuar con esta acción.",
  redirectTo = "/dashboard",
}) => {
  const navigate = useNavigate();

  if (!abierto) return null;

  const cerrarTodo = () => {
    onCancelar?.();
    onClose?.();
  };

  return (
    <div
      onClick={cerrarTodo}
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm p-6 shadow-xl text-center"
      >
        <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          {titulo}
        </h4>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          {mensaje}
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate("/login", { state: { redirectTo } })}
            className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg px-4 py-2.5 text-sm font-medium"
          >
            Iniciar sesión / Registrarme
          </button>
          <button
            onClick={cerrarTodo}
            className="text-sm text-zinc-500 dark:text-zinc-400 py-2"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalRequiereLogin;