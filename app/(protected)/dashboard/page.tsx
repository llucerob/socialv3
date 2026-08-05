import Link from "next/link";
import { getProfile } from "@/lib/auth/dal";
import { ROL_LABELS } from "@/lib/auth/types";
import type { RolUsuario } from "@/lib/auth/types";
import {
  DASHBOARD_SECTIONS_BY_ROL,
  DASHBOARD_SECTION_LABELS,
  type DashboardSectionId,
} from "@/lib/dashboard/sections";
import { listarEntregasPendientesParaDashboard } from "@/lib/entregas/dal";
import type { EntregaPendienteDashboard } from "@/lib/entregas/types";
import { listarSolicitudesEnEvaluacionSinEvaluar } from "@/lib/solicitudes/dal";
import {
  listarSolicitudesPendientesAprobacionDashboard,
  listarReembolsosPendientesPagoDashboard,
} from "@/lib/dashboard/dal";
import { listarHogaresConRshDesactualizado, listarHogaresPendientesGeoreferenciar } from "@/lib/hogares/dal";

// EPIC 02 (US-02.01) — filas ya normalizadas a una forma común para las dos
// tarjetas de "solicitudes" (una viene de una consulta directa —
// SolicitudConRelaciones—, la otra de un RPC — SolicitudPendienteAprobacionDashboard—,
// con nombres de columna distintos), para no duplicar el marcado de la lista.
type FilaSolicitudDashboard = {
  id: string
  ruta: string
  tipoAyudaNombre: string
  direccion: string
  personaNombre: string | null
  fecha: string
}

// Roles a los que les aplica cada tipo de alerta hoy (US-02.01: "alertas
// básicas por rol") — RSH desactualizado es relevante para elegibilidad
// (evaluador social/aprobador/administrador); georreferenciación pendiente
// es relevante para planificación de rutas (bodega/administrador). finanzas
// tiene la tarjeta asignada pero ningún tipo de alerta existente le aplica
// todavía — se le muestra "sin alertas" en vez de inventar una tercera.
const ROLES_ALERTA_RSH: RolUsuario[] = ["administrador", "evaluador_social", "aprobador"];
const ROLES_ALERTA_GEORREFERENCIAR: RolUsuario[] = ["administrador", "bodega_logistica"];

export default async function DashboardPage() {
  const profile = await getProfile();
  const secciones = DASHBOARD_SECTIONS_BY_ROL[profile.rol];

  const [entregasPendientes, solicitudesEnEvaluacion, solicitudesPendientes, reembolsosPendientes, hogaresRsh, hogaresSinGeorreferenciar] =
    await Promise.all([
      secciones.includes("entregas_pendientes") ? listarEntregasPendientesParaDashboard() : Promise.resolve([]),
      secciones.includes("solicitudes_evaluacion") ? listarSolicitudesEnEvaluacionSinEvaluar() : Promise.resolve([]),
      secciones.includes("solicitudes_pendientes")
        ? listarSolicitudesPendientesAprobacionDashboard()
        : Promise.resolve([]),
      secciones.includes("reembolsos_pendientes") ? listarReembolsosPendientesPagoDashboard() : Promise.resolve([]),
      secciones.includes("alertas") && ROLES_ALERTA_RSH.includes(profile.rol)
        ? listarHogaresConRshDesactualizado()
        : Promise.resolve([]),
      secciones.includes("alertas") && ROLES_ALERTA_GEORREFERENCIAR.includes(profile.rol)
        ? listarHogaresPendientesGeoreferenciar()
        : Promise.resolve([]),
    ]);

  const filasEvaluacion: FilaSolicitudDashboard[] = solicitudesEnEvaluacion.map((s) => ({
    id: s.id,
    ruta: `/solicitudes/${s.id}`,
    tipoAyudaNombre: s.tipo_ayuda_nombre,
    direccion: s.grupo_familiar_direccion,
    personaNombre: s.persona_nombre,
    fecha: s.fecha_solicitud,
  }));
  const filasPendientesAprobacion: FilaSolicitudDashboard[] = solicitudesPendientes.map((s) => ({
    id: s.solicitud_id,
    ruta: s.ruta,
    tipoAyudaNombre: s.tipo_ayuda_nombre,
    direccion: s.direccion,
    personaNombre: s.persona_nombre,
    fecha: s.fecha_solicitud,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bienvenido, {profile.nombre}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Panel principal · {ROL_LABELS[profile.rol]}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {secciones.map((id) => (
          <section
            key={id}
            className="rounded-lg border border-black/10 p-4 dark:border-white/10"
          >
            <h2 className="font-medium">{DASHBOARD_SECTION_LABELS[id]}</h2>
            <TarjetaContenido
              id={id}
              rol={profile.rol}
              entregasPendientes={entregasPendientes}
              filasEvaluacion={filasEvaluacion}
              filasPendientesAprobacion={filasPendientesAprobacion}
              reembolsosPendientes={reembolsosPendientes}
              hogaresRsh={hogaresRsh}
              hogaresSinGeorreferenciar={hogaresSinGeorreferenciar}
            />
          </section>
        ))}
      </div>
    </div>
  );
}

function TarjetaContenido({
  id,
  rol,
  entregasPendientes,
  filasEvaluacion,
  filasPendientesAprobacion,
  reembolsosPendientes,
  hogaresRsh,
  hogaresSinGeorreferenciar,
}: {
  id: DashboardSectionId;
  rol: RolUsuario;
  entregasPendientes: EntregaPendienteDashboard[];
  filasEvaluacion: FilaSolicitudDashboard[];
  filasPendientesAprobacion: FilaSolicitudDashboard[];
  reembolsosPendientes: Awaited<ReturnType<typeof listarReembolsosPendientesPagoDashboard>>;
  hogaresRsh: Awaited<ReturnType<typeof listarHogaresConRshDesactualizado>>;
  hogaresSinGeorreferenciar: Awaited<ReturnType<typeof listarHogaresPendientesGeoreferenciar>>;
}) {
  if (id === "entregas_pendientes") {
    // terreno_repartidor no tiene acceso a /solicitudes/[id] (US-20.02) — su
    // propia ficha de entrega vive en /mis-entregas/[id], indexada por
    // entrega_id, no por solicitud_id. auditor_consulta no tiene una
    // página de listado propia (/entregas es solo administrador/bodega),
    // así que no se le ofrece "ver todas".
    const hrefFila = (entrega: EntregaPendienteDashboard) =>
      rol === "terreno_repartidor" ? `/mis-entregas/${entrega.entrega_id}` : entrega.ruta;
    const hrefVerTodas =
      rol === "terreno_repartidor" ? "/mis-entregas" : rol === "administrador" || rol === "bodega_logistica" ? "/entregas" : undefined;

    return (
      <ListaResumen
        items={entregasPendientes}
        getKey={(e) => e.entrega_id}
        getHref={hrefFila}
        getLinea={(e) => `${e.tipo_ayuda_nombre} · ${e.direccion}`}
        getDetalle={(e) => e.fecha_programada}
        vacio="Sin entregas pendientes."
        singular="entrega pendiente"
        plural="entregas pendientes"
        hrefVerTodas={hrefVerTodas}
      />
    );
  }

  if (id === "solicitudes_evaluacion") {
    return (
      <ListaResumen
        items={filasEvaluacion}
        getKey={(s) => s.id}
        getHref={(s) => s.ruta}
        getLinea={(s) => `${s.tipoAyudaNombre} · ${s.direccion}`}
        getDetalle={(s) => s.fecha}
        vacio="Sin solicitudes en evaluación."
        singular="solicitud en evaluación"
        plural="solicitudes en evaluación"
      />
    );
  }

  if (id === "solicitudes_pendientes") {
    return (
      <ListaResumen
        items={filasPendientesAprobacion}
        getKey={(s) => s.id}
        getHref={(s) => s.ruta}
        getLinea={(s) => `${s.tipoAyudaNombre} · ${s.direccion}`}
        getDetalle={(s) => s.fecha}
        vacio="Sin solicitudes pendientes de aprobación."
        singular="solicitud pendiente"
        plural="solicitudes pendientes"
      />
    );
  }

  if (id === "reembolsos_pendientes") {
    return (
      <ListaResumen
        items={reembolsosPendientes}
        getKey={(r) => r.solicitud_id}
        getHref={(r) => r.ruta}
        getLinea={(r) => `${r.tipo_ayuda_nombre} · ${r.direccion}`}
        getDetalle={(r) => (r.monto_aprobado !== null ? `$${r.monto_aprobado.toLocaleString("es-CL")}` : null)}
        vacio="Sin reembolsos pendientes de pago."
        singular="reembolso pendiente"
        plural="reembolsos pendientes"
      />
    );
  }

  // alertas
  const hayRsh = hogaresRsh.length > 0;
  const haySinGeorreferenciar = hogaresSinGeorreferenciar.length > 0;

  if (!hayRsh && !haySinGeorreferenciar) {
    return (
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Sin alertas por ahora.</p>
    );
  }

  return (
    <div className="mt-2 space-y-3 text-sm">
      {hayRsh && (
        <div>
          <p className="text-zinc-500 dark:text-zinc-400">
            {hogaresRsh.length} {hogaresRsh.length === 1 ? "hogar con" : "hogares con"} RSH desactualizado o sin registrar
          </p>
          <ul className="mt-1 space-y-1">
            {hogaresRsh.slice(0, 5).map((hogar) => (
              <li key={hogar.id}>
                <Link href={`/hogares/${hogar.id}`} className="hover:underline">
                  {hogar.direccion}
                </Link>
              </li>
            ))}
          </ul>
          {hogaresRsh.length > 5 && (
            <span className="text-zinc-500 dark:text-zinc-400">+{hogaresRsh.length - 5} más</span>
          )}
        </div>
      )}
      {haySinGeorreferenciar && (
        <div>
          <p className="text-zinc-500 dark:text-zinc-400">
            {hogaresSinGeorreferenciar.length} {hogaresSinGeorreferenciar.length === 1 ? "hogar" : "hogares"} sin georreferenciar
          </p>
          <Link href="/hogares/pendientes-georreferenciar" className="hover:underline">
            Ver listado
          </Link>
        </div>
      )}
    </div>
  );
}

// EPIC 02/12 — patrón compartido de "contador + hasta 5 filas + ver todas"
// ya usado por la tarjeta de entregas; se generaliza para las demás
// tarjetas de lista en vez de repetir el mismo marcado 4 veces.
function ListaResumen<T>({
  items,
  getKey,
  getHref,
  getLinea,
  getDetalle,
  vacio,
  singular,
  plural,
  hrefVerTodas,
}: {
  items: T[];
  getKey: (item: T) => string;
  getHref: (item: T) => string;
  getLinea: (item: T) => string;
  getDetalle: (item: T) => string | null;
  vacio: string;
  singular: string;
  plural: string;
  hrefVerTodas?: string;
}) {
  if (items.length === 0) {
    return <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{vacio}</p>;
  }

  return (
    <>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        {items.length} {items.length === 1 ? singular : plural}
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        {items.slice(0, 5).map((item) => {
          const detalle = getDetalle(item);
          return (
            <li key={getKey(item)}>
              <Link href={getHref(item)} className="hover:underline">
                {getLinea(item)}
              </Link>
              {detalle && <span className="text-zinc-500 dark:text-zinc-400"> · {detalle}</span>}
            </li>
          );
        })}
      </ul>
      {items.length > 5 && hrefVerTodas && (
        <Link href={hrefVerTodas} className="mt-2 inline-block text-sm text-zinc-500 underline dark:text-zinc-400">
          Ver todas
        </Link>
      )}
    </>
  );
}
