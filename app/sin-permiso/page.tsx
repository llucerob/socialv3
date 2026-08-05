import { getProfile } from "@/lib/auth/dal";
import { ROL_LABELS } from "@/lib/auth/types";

export default async function SinPermisoPage() {
  const profile = await getProfile();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Sin permiso para esta sección</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Tu rol actual ({ROL_LABELS[profile.rol]}) no tiene acceso a esta
        función. Si crees que deberías tenerlo, contacta a un administrador
        del sistema.
      </p>
    </div>
  );
}
