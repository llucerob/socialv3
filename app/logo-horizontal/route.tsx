import { ImageResponse } from 'next/og'

// Sistema de diseño Coinco (Tanda D, EPIC 01) — lockup horizontal para el
// login, sobre fondo claro (a diferencia del escudo blanco del sidebar,
// pensado para bg-brand-800). El repo no tiene el asset de diseño oficial
// todavía (mismo caso que app/escudo-blanco y app/icon.tsx): se genera un
// placeholder con next/og en los colores institucionales ya definidos en
// app/globals.css. Reemplazar por el logo horizontal oficial (SVG/PNG) en
// public/ cuando exista — bastaría con cambiar la referencia en
// app/(auth)/login/page.tsx, sin tocar el resto de la pantalla.
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: 9999,
            border: '3px solid #003169',
            color: '#003169',
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          C
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#003169' }}>
            Municipalidad de Coinco
          </span>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#1E5799' }}>
            Departamento Social
          </span>
        </div>
      </div>
    ),
    { width: 340, height: 64 }
  )
}
