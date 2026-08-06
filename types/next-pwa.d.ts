// `next-pwa` (v5.6.0) no publica sus propios tipos, y el paquete comunitario
// `@types/next-pwa` fija una copia vieja de los tipos de `next` que choca
// con la versión real instalada (Next 16) — declaración local mínima en vez
// de esa dependencia, solo con la forma que este proyecto usa (ver
// next.config.ts).
declare module 'next-pwa' {
  import type { NextConfig } from 'next'

  type PWAConfig = {
    dest?: string
    register?: boolean
    skipWaiting?: boolean
    disable?: boolean
    fallbacks?: {
      document?: string
      image?: string
      audio?: string
      video?: string
      font?: string
    }
    [key: string]: unknown
  }

  export default function withPWA(config?: PWAConfig): (nextConfig: NextConfig) => NextConfig
}
