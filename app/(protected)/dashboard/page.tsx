import Link from "next/link";
import { getProfile } from "@/lib/auth/dal";
import { ROL_LABELS } from "@/lib/auth/types";
import type { RolUsuario } from "@/lib/auth/types";
import {
  DASHBOARD_SECTIONS_BY_ROL,
  DASHBOARD_SECTION_LABELS,
  type DashboardSectionId,
} from "@/lib/dashboard/sections";
import { NAV_BY_ROL } from "@/lib/dashboard/nav";
import { listarEntregasPendientesParaDashboard } from "@/lib/entregas/dal";
import { listarSolicitudesEnEvaluacionSinEvaluar } from "@/lib/solicitudes/dal";
import type { EstadoSolicitud } from "@/lib/solicitudes/types";
import {
  listarSolicitudesPendientesAprobacionDashboard,
  listarReembolsosPendientesPagoDashboard,
} from "@/lib/dashboard/dal";
import { listarHogaresConRshDesactualizado, listarHogaresPendientesGeoreferenciar } from "@/lib/hogares/dal";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { iniciales } from "@/components/ui/texto";
import { formatearFecha } from "@/lib/fechas";

// Sistema de diseño Coinco (Prompt 2, Paso 1) — /dashboard es UNA sola ruta
// compartida por todos los roles (cada uno ve un subconjunto de
// DASHBOARD_SECTIONS_BY_ROL), no un "dashboard del evaluador" dedicado. El
// piloto pedido por el prompt (fila de métricas + cola "Solicitudes por
// evaluar" con avatar/EstadoBadge + panel lateral) se aplica en detalle a la
// sección `solicitudes_evaluacion` (la que sí tiene datos reales de sobra:
// estado, tipo de ayuda, dirección, persona); el resto de secciones
// (pendientes de aprobación, entregas, reembolsos) no traen `estado` en su
// consulta (son RPCs de solo lectura para el dashboard, ver
// lib/dashboard/types.ts), así que se muestran con el mismo lenguaje visual
// (Card + tokens) pero sin EstadoBadge, para no inventar un estado que la
// consulta no entrega.
type FilaSolicitudDashboard = {
  id: string
  ruta: string
  tipoAyudaNombre: string
  direccion: string
  personaNombre: string | null
  fecha: string
  estado: EstadoSolicitud
}

const ROLES_ALERTA_RSH: RolUsuario[] = ["administrador", "evaluador_social", "aprobador"];
const ROLES_ALERTA_GEORREFERENCIAR: RolUsuario[] = ["administrador", "bodega_logistica"];

export default async function DashboardPage() {
  const profile = await getProfile();
  const secciones = DASHBOARD_SECTIONS_BY_ROL[profile.rol];
  const accesosRapidos = NAV_BY_ROL[profile.rol].filter(
    (item) => item.disponible && item.href !== "/dashboard"
  );

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
    fecha: formatearFecha(s.fecha_solicitud),
    estado: s.estado,
  }));

  const seccionesMetricas = secciones.filter(
    (id): id is Exclude<DashboardSectionId, "alertas"> => id !== "alertas"
  );
  const conteoPorSeccion: Record<Exclude<DashboardSectionId, "alertas">, number> = {
    solicitudes_pendientes: solicitudesPendientes.length,
    solicitudes_evaluacion: filasEvaluacion.length,
    entregas_pendientes: entregasPendientes.length,
    reembolsos_pendientes: reembolsosPendientes.length,
  };

  const hayAlertas = secciones.includes("alertas") && (hogaresRsh.length > 0 || hogaresSinGeorreferenciar.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Bienvenido, {profile.nombre}</h1>
        <p className="mt-1 text-sm text-text-muted">
          Panel principal · {ROL_LABELS[profile.rol]}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {seccionesMetricas.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {seccionesMetricas.map((id) => (
                <Card key={id}>
                  <p className="text-3xl font-semibold text-brand-800">{conteoPorSeccion[id]}</p>
                  <p className="text-sm text-text-muted">{DASHBOARD_SECTION_LABELS[id]}</p>
                </Card>
              ))}
            </div>
          )}

          {secciones.includes("solicitudes_evaluacion") && (
            <Card header={<h2 className="font-medium text-text-primary">Solicitudes por evaluar</h2>}>
              {filasEvaluacion.length === 0 ? (
                <p className="text-sm text-text-muted">Sin solicitudes en evaluación.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {filasEvaluacion.map((fila) => (
                    <li key={fila.id}>
                      <Link
                        href={fila.ruta}
                        className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:bg-surface-alt"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-800">
                          {iniciales(fila.personaNombre ?? fila.direccion)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-text-primary">{fila.direccion}</span>
                          <span className="block truncate text-sm text-text-muted">
                            {fila.tipoAyudaNombre}
                            {fila.personaNombre && ` · ${fila.personaNombre}`}
                          </span>
                        </span>
                        <EstadoBadge estado={fila.estado} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {secciones.includes("solicitudes_pendientes") && (
            <ListaResumenCard
              titulo="Solicitudes pendientes de aprobación"
              items={solicitudesPendientes}
              getKey={(s) => s.solicitud_id}
              getHref={(s) => s.ruta}
              getLinea={(s) => `${s.tipo_ayuda_nombre} · ${s.direccion}`}
              getDetalle={(s) => formatearFecha(s.fecha_solicitud)}
              vacio="Sin solicitudes pendientes de aprobación."
            />
          )}

          {secciones.includes("entregas_pendientes") && (
            <ListaResumenCard
              titulo="Entregas pendientes"
              items={entregasPendientes}
              getKey={(e) => e.entrega_id}
              getHref={(e) =>
                profile.rol === "terreno_repartidor" ? `/mis-entregas/${e.entrega_id}` : e.ruta
              }
              getLinea={(e) => `${e.tipo_ayuda_nombre} · ${e.direccion}`}
              getDetalle={(e) => formatearFecha(e.fecha_programada)}
              vacio="Sin entregas pendientes."
              hrefVerTodas={
                profile.rol === "terreno_repartidor"
                  ? "/mis-entregas"
                  : profile.rol === "administrador" || profile.rol === "bodega_logistica"
                    ? "/entregas"
                    : undefined
              }
            />
          )}

          {secciones.includes("reembolsos_pendientes") && (
            <ListaResumenCard
              titulo="Reembolsos pendientes de pago"
              items={reembolsosPendientes}
              getKey={(r) => r.solicitud_id}
              getHref={(r) => r.ruta}
              getLinea={(r) => `${r.tipo_ayuda_nombre} · ${r.direccion}`}
              getDetalle={(r) => (r.monto_aprobado !== null ? `$${r.monto_aprobado.toLocaleString("es-CL")}` : null)}
              vacio="Sin reembolsos pendientes de pago."
            />
          )}
        </div>

        <aside className="space-y-6">
          {accesosRapidos.length > 0 && (
            <Card header={<h2 className="font-medium text-text-primary">Accesos rápidos</h2>}>
              <div className="flex flex-col gap-2">
                {accesosRapidos.map((item, indice) => (
                  <ButtonLink
                    key={item.href}
                    href={item.href}
                    variante={indice === 0 ? "primary" : "secondary"}
                    className="justify-start"
                  >
                    {item.label}
                  </ButtonLink>
                ))}
              </div>
            </Card>
          )}

          {secciones.includes("alertas") && (
            <Card header={<h2 className="font-medium text-text-primary">Requiere atención</h2>}>
              {!hayAlertas ? (
                <p className="text-sm text-text-muted">Sin alertas por ahora.</p>
              ) : (
                <div className="space-y-4 text-sm">
                  {hogaresRsh.length > 0 && (
                    <div>
                      <p className="text-text-muted">
                        {hogaresRsh.length} {hogaresRsh.length === 1 ? "hogar con" : "hogares con"} RSH desactualizado
                      </p>
                      <ul className="mt-1 space-y-1">
                        {hogaresRsh.slice(0, 5).map((hogar) => (
                          <li key={hogar.id}>
                            <Link href={`/hogares/${hogar.id}`} className="text-brand-600 hover:underline">
                              {hogar.direccion}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {hogaresRsh.length > 5 && (
                        <span className="text-text-muted">+{hogaresRsh.length - 5} más</span>
                      )}
                    </div>
                  )}
                  {hogaresSinGeorreferenciar.length > 0 && (
                    <div>
                      <p className="text-text-muted">
                        {hogaresSinGeorreferenciar.length} {hogaresSinGeorreferenciar.length === 1 ? "hogar" : "hogares"} sin georreferenciar
                      </p>
                      <Link href="/hogares/pendientes-georreferenciar" className="text-brand-600 hover:underline">
                        Ver listado
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

// EPIC 02/12 — patrón compartido de "contador + hasta 5 filas + ver todas",
// ahora sobre Card + tokens (Prompt 2). Se mantiene genérico porque
// solicitudes_pendientes / entregas_pendientes / reembolsos_pendientes no
// traen un campo `estado` real en su consulta (ver comentario de arriba),
// así que no pueden mostrar <EstadoBadge> sin inventar un valor.
function ListaResumenCard<T>({
  titulo,
  items,
  getKey,
  getHref,
  getLinea,
  getDetalle,
  vacio,
  hrefVerTodas,
}: {
  titulo: string;
  items: T[];
  getKey: (item: T) => string;
  getHref: (item: T) => string;
  getLinea: (item: T) => string;
  getDetalle: (item: T) => string | null;
  vacio: string;
  hrefVerTodas?: string;
}) {
  return (
    <Card header={<h2 className="font-medium text-text-primary">{titulo}</h2>}>
      {items.length === 0 ? (
        <p className="text-sm text-text-muted">{vacio}</p>
      ) : (
        <>
          <ul className="divide-y divide-border text-sm">
            {items.slice(0, 5).map((item) => {
              const detalle = getDetalle(item);
              return (
                <li key={getKey(item)}>
                  <Link href={getHref(item)} className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0 hover:underline">
                    <span>{getLinea(item)}</span>
                    {detalle && <span className="shrink-0 text-text-muted">{detalle}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
          {items.length > 5 && hrefVerTodas && (
            <Link href={hrefVerTodas} className="mt-2 inline-block text-sm text-brand-600 hover:underline">
              Ver todas
            </Link>
          )}
        </>
      )}
    </Card>
  );
}
