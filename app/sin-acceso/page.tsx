import { verifySession } from "@/lib/auth/dal";
import { logout } from "@/lib/auth/actions";

export default async function SinAccesoPage() {
  const user = await verifySession();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Cuenta sin acceso todavía</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Tu cuenta ({user.email}) existe pero aún no tiene un rol asignado o
        está inactiva. Contacta a un administrador del sistema para que
        habilite tu acceso.
      </p>
      <form action={logout}>
        <button
          type="submit"
          className="rounded border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
