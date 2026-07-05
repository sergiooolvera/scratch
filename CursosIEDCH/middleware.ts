import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const pathname = request.nextUrl.pathname

    if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/profesor') || pathname.startsWith('/admin') || pathname.startsWith('/institucion'))) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (user && (pathname.startsWith('/profesor') || pathname.startsWith('/admin') || pathname.startsWith('/institucion'))) {
        const { data: profile } = await supabase
            .from('ie_profiles')
            .select('rol, permisos_adminjr')
            .eq('id', user.id)
            .single()

        const rol = profile?.rol || 'alumno'

        if (pathname.startsWith('/admin')) {
            if (rol !== 'admin' && rol !== 'adminjr') {
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }

            // Si es adminjr, verificar permisos de subruta
            if (rol === 'adminjr') {
                const permisos = Array.isArray(profile?.permisos_adminjr)
                    ? (profile.permisos_adminjr as string[])
                    : []
                
                const parts = pathname.split('/')
                const subpath = parts[2] // ej: 'usuarios' en '/admin/usuarios'

                if (subpath && !permisos.includes(subpath)) {
                    return NextResponse.redirect(new URL('/dashboard', request.url))
                }

                if (!subpath && permisos.length === 0) {
                    return NextResponse.redirect(new URL('/dashboard', request.url))
                }
            }
        }

        if (pathname.startsWith('/institucion')) {
            const rolesPermitidosInstitucion = ['admin', 'institucion']
            if (pathname.startsWith('/institucion/crear')) {
                rolesPermitidosInstitucion.push('instructor', 'capacitador')
            }
            if (!rolesPermitidosInstitucion.includes(rol)) {
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }
        }

        if (pathname.startsWith('/profesor')) {
            if (rol !== 'admin' && rol !== 'instructor' && rol !== 'vendedor' && rol !== 'capacitador' && rol !== 'institucion') {
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }
            if (pathname.startsWith('/profesor/ventas') && rol === 'capacitador') {
                return NextResponse.redirect(new URL('/profesor/cursos', request.url))
            }
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
