import type { MetadataRoute } from 'next'

// EPIC 27 (US-27.01) — "existe manifest de aplicación web con ícono y
// nombre · el navegador ofrece 'agregar a pantalla de inicio' · la app
// instalada abre en modo standalone". start_url apunta a /dashboard (no a
// "/", que solo redirige) para que abrir la app instalada lleve directo al
// panel del rol del funcionario.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ayudas Sociales — Municipalidad de Coinco',
    short_name: 'Ayudas Sociales',
    description: 'Sistema de administración de ayudas sociales del Departamento Social',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#003169',
    lang: 'es-CL',
    icons: [
      { src: '/icon', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
