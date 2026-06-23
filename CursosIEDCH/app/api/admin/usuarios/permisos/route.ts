import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const supabaseSession = await createServerClient()
        const { data: { user } } = await supabaseSession.auth.getUser()
        
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // 1. Verificar que el usuario que hace la solicitud sea un Administrador principal ('admin')
        const { data: profile } = await supabaseSession
            .from('ie_profiles')
            .select('rol')
            .eq('id', user.id)
            .single()
            
        if (profile?.rol !== 'admin') {
            return NextResponse.json({ error: 'Permisos insuficientes. Solo el administrador principal puede gestionar permisos.' }, { status: 403 })
        }

        // 2. Obtener los datos del cuerpo de la petición
        const body = await request.json()
        const { userId, permisos } = body

        if (!userId || !Array.isArray(permisos)) {
            return NextResponse.json({ error: 'Faltan datos requeridos o formato incorrecto' }, { status: 400 })
        }

        // 3. Crear cliente con Service Role para saltarse RLS y actualizar el perfil
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // 4. Actualizar la columna permisos_adminjr
        const { error } = await supabaseAdmin
            .from('ie_profiles')
            .update({ permisos_adminjr: permisos })
            .eq('id', userId)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'Permisos actualizados con éxito' })

    } catch (err: any) {
        console.error('Error al actualizar permisos de adminjr:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
