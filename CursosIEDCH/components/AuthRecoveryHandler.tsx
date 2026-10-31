'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Escucha globalmente eventos de recuperación de contraseña y fragmentos hash (#type=recovery).
 * Si un usuario abre un enlace de correo que redirige a la raíz o a cualquier ruta del sitio,
 * este componente lo detecta y lo redirige automáticamente a /update-password.
 */
export default function AuthRecoveryHandler() {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()

    useEffect(() => {
        if (typeof window === 'undefined') return

        // 1. Detección inmediata en URL hash (ej: #access_token=...&type=recovery)
        const hash = window.location.hash || ''
        if (hash.includes('type=recovery') || (hash.includes('access_token=') && hash.includes('type=recovery'))) {
            if (pathname !== '/update-password') {
                window.location.replace('/update-password' + hash)
                return
            }
        }

        // 2. Detección de query param type=recovery o code si cae en la home
        const search = window.location.search || ''
        if (pathname === '/' && search.includes('type=recovery')) {
            window.location.replace('/update-password' + search + hash)
            return
        }

        // 3. Escuchar evento oficial de Supabase Auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                if (window.location.pathname !== '/update-password') {
                    router.push('/update-password')
                }
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [pathname, router, supabase])

    return null
}
