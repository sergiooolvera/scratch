import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const cursoId = searchParams.get('cursoId')

    if (!cursoId) {
        return NextResponse.json({ error: 'Falta cursoId' }, { status: 400 })
    }

    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: tasksData, error } = await supabaseAdmin
            .from('ie_preguntas_respuestas')
            .select('pregunta')
            .eq('curso_id', cursoId)
            .or('pregunta.like.TAREA_DEFINICION:%,pregunta.like.PUZZLE_DEFINICION:%')

        if (error) throw error

        return NextResponse.json(tasksData)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
