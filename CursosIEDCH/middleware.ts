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

    if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/profesor') || pathname.startsWith('/admin'))) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (user && (pathname.startsWith('/profesor') || pathname.startsWith('/admin'))) {
        const { data: profile } = await supabase
            .from('ie_profiles')
            .select('rol')
            .eq('id', user.id)
            .single()

        const rol = profile?.rol || 'alumno'

        if (pathname.startsWith('/admin') && rol !== 'admin') {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        if (pathname.startsWith('/profesor') && rol !== 'admin' && rol !== 'profesor') {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
