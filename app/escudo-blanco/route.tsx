import { ImageResponse } from 'next/og'

// Sistema de diseño Coinco (Prompt 1) — escudo institucional en blanco para
// el sidebar (fondo brand-800). El repo no tiene el asset de diseño oficial
// todavía, así que se genera un placeholder con next/og (mismo patrón que
// app/icon.tsx del EPIC 27): fondo transparente, trazo blanco simple con
// forma de escudo, para no dejar el sidebar vacío mientras se agrega el
// logo real. Reemplazar por el escudo oficial (SVG/PNG) en public/ cuando
// exista — bastaría con cambiar la referencia en NavSidebar, sin tocar el
// resto del layout.
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
          borderRadius: '9999px',
          border: '2px solid #ffffff',
          color: '#ffffff',
          fontSize: 20,
          fontWeight: 700,
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        C
      </div>
    ),
    { width: 40, height: 40 }
  )
}
