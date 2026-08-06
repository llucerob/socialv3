import { ImageResponse } from 'next/og'

// EPIC 27 (US-27.01) — ícono de la app (favicon + manifest, 192×192).
// Generado con next/og (parte de Next.js, sin dependencia nueva) porque el
// repo no tiene ningún asset de diseño real (logo, marca) — usa el color
// institucional ya definido en app/globals.css (--brand-800: #003169).
// Provisional: reemplazar por el logo oficial de la Municipalidad de Coinco
// cuando exista un asset de diseño.
export const size = { width: 192, height: 192 }
export const contentType = 'image/png'

export default function Icon() {
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
          fontSize: 88,
          fontWeight: 700,
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        AS
      </div>
    ),
    { ...size }
  )
}
