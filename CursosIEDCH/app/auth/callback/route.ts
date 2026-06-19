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

  // Redirigir al login si hay un error o no viene código
  return NextResponse.redirect(`${origin}/login?error=No+se+pudo+verificar+tu+enlace`)
}
