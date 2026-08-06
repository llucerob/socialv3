import { ImageResponse } from 'next/og'

// EPIC 27 (US-27.01) — versión 512×512 del mismo ícono (app/icon.tsx), para
// el manifest (icons[512x512] + entrada purpose:"maskable"). Ruta explícita
// en vez de la convención `app/icon.tsx` (que Next.js sirve a un único
// tamaño por archivo) para poder referenciar ambos tamaños desde
// app/manifest.ts.
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#003169',
          color: '#ffffff',
          fontSize: 232,
          fontWeight: 700,
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        AS
      </div>
    ),
    { width: 512, height: 512 }
  )
}
