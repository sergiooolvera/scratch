import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { cursoId, draft } = await req.json()
        const { modulos, ...cursoData } = draft

        // 1. Actualizar el curso base y limpiar el borrador
        const { error: updateErr } = await supabaseAdmin.from('ie_cursos').update({
            ...cursoData,
            cambios_pendientes: null
        }).eq('id', cursoId)

        if (updateErr) throw updateErr

        // 2. Eliminar TODOS los módulos anteriores (bypassing RLS)
        const { error: delErr } = await supabaseAdmin.from('ie_curso_modulos').delete().eq('curso_id', cursoId)
        if (delErr) throw delErr

        const newModulos = modulos.map((m: any) => ({
            curso_id: cursoId,
            titulo: m.titulo,
            url_contenido: m.url_contenido,
            orden: m.orden
        }))
        const { error: insErr } = await supabaseAdmin.from('ie_curso_modulos').insert(newModulos)
        if (insErr) throw insErr

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Error desconocido' }, { status: 500 })
    }
}
