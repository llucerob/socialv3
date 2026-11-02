import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

// EPIC 27 — decisión técnica ya fijada en CLAUDE.md: next-pwa en vez de un
// service worker escrito a mano. `disable` en desarrollo es la config
// recomendada por la librería (evita cachear agresivamente durante `next
// dev`, donde además Next 16 usa Turbopack por defecto — next-pwa depende
// de workbox-webpack-plugin, así que solo corre en el build de producción,
// que se invoca con `next build --webpack`, ver package.json).
// `fallbacks.document: '/offline'` — app/offline/page.tsx — es lo que
// permite que /mis-entregas siga mostrando la ruta del día si una
// navegación falla por falta de conexión (US-27.02/US-27.03).
const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline",
  },
});

const nextConfig: NextConfig = {
  // next-pwa agrega una función `webpack()` a la config sin importar
  // `disable` — Next 16 usa Turbopack por defecto y trata un `webpack` no
  // reconocido como error duro en `next dev`. `turbopack: {}` es la señal
  // documentada por Next para decir "es intencional, ignóralo bajo
  // Turbopack" — `next dev` sigue usando Turbopack (rápido, sin cambios de
  // comportamiento); el build de producción usa `--webpack` explícito
  // (package.json) para que next-pwa sí genere el service worker.
  turbopack: {},
  experimental: {
    // Los documentos y la foto de evidencia de la entrega se suben por
    // Server Action (y por /api/mis-entregas/[id]/realizada en la
    // sincronización offline). Por defecto Next corta el cuerpo de una
    // Server Action en 1 MB, y una foto de celular pesa más: la entrega
    // fallaba. Se alinea con el tope de 50 MB de lib/documentos/actions.ts
    // y supabase/config.toml, con margen para el overhead de multipart.
    // `proxyClientMaxBodySize` (10 MB por defecto) es el búfer de proxy.ts:
    // sobre ese tope el cuerpo llega truncado a la acción o a la ruta API.
    serverActions: {
      bodySizeLimit: "51mb",
    },
    proxyClientMaxBodySize: "51mb",
  },
};

export default withPWA(nextConfig);
