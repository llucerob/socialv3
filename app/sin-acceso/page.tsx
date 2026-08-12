import { verifySession } from "@/lib/auth/dal";
import { logout } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";

export default async function SinAccesoPage() {
  const user = await verifySession();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold text-text-primary">Cuenta sin acceso todavía</h1>
      <p className="max-w-md text-text-muted">
        Tu cuenta ({user.email}) existe pero aún no tiene un rol asignado o
        está inactiva. Contacta a un administrador del sistema para que
        habilite tu acceso.
      </p>
      <form action={logout}>
        <Button type="submit" variante="secondary">
          Cerrar sesión
        </Button>
      </form>
    </div>
  );
}
