import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  // El parámetro "next" se usa para redirigir después de iniciar sesión con éxito.
  const next = searchParams.get('next') ?? '/dashboard'

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error('Error verifying OTP:', error)
    }
  } else if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirigir a la URL deseada (e.g. /update-password)
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error('Error exchanging code for session:', error)
    }
  }

  const errorMsg = searchParams.get('error_description') || searchParams.get('error')
  if (errorMsg) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMsg)}`)
  }

  // Si no viene código ni token_hash en los query params, es muy probable que Supabase
  // haya enviado los tokens en el fragmento hash (#access_token=...&type=recovery),
  // el cual por especificación HTTP nunca viaja al servidor en la cabecera de la petición.
  // Retornamos un HTML ligero que permite al navegador leer el hash y redirigir al destino (ej: /update-password)
  const safeNext = next.startsWith('/') ? next : `/${next}`
  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Verificando enlace...</title>
  </head>
  <body style="font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9fafb;">
    <div style="text-align: center; color: #4b5563;">
      <p style="font-size: 1.125rem; font-weight: 500;">Procesando tu solicitud...</p>
    </div>
    <script>
      (function() {
        var hash = window.location.hash || '';
        var next = ${JSON.stringify(safeNext)};
        if (hash.includes('access_token') || hash.includes('type=recovery') || next === '/update-password') {
          window.location.replace(next + hash);
        } else {
          window.location.replace('/login?error=No+se+pudo+verificar+tu+enlace');
        }
      })();
    </script>
  </body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
