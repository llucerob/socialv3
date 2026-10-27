import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login']

// Recursos que el navegador pide sin sesión y que no contienen datos:
// - manifest e íconos: el navegador descarga el manifest sin cookies, así
//   que si redirige a /login la app no se puede instalar (US-27.01);
// - escudo y logo: los usa la propia pantalla de login;
// - service worker, sus scripts generados por next-pwa (workbox-*,
//   fallback-*) y /offline, la página de respaldo que el service worker
//   guarda en caché (solo arma la vista con lo guardado en el dispositivo).
const RECURSOS_PUBLICOS = [
  '/manifest.webmanifest',
  '/icon',
  '/icon-512',
  '/escudo-blanco',
  '/logo-horizontal',
  '/sw.js',
  '/offline',
]
const PREFIJOS_RECURSOS_PUBLICOS = ['/workbox-', '/fallback-']

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Chequeo optimista (solo cookie de sesión): la validación real de
  // rol/estado vive en el DAL (lib/auth/dal.ts), no acá.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublicRoute =
    PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) ||
    RECURSOS_PUBLICOS.includes(pathname) ||
    PREFIJOS_RECURSOS_PUBLICOS.some((prefijo) => pathname.startsWith(prefijo))

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}
