import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { cursoId, rating, comentario } = await req.json()

        if (!cursoId || !rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Datos de calificación inválidos' }, { status: 400 })
        }

        // 1. Validar que el usuario haya comprado y pagado el curso
        const { data: compra, error: compraError } = await supabase
            .from('ie_compras')
            .select('id, pagado')
            .eq('curso_id', cursoId)
            .eq('user_id', user.id)
            .eq('pagado', true)
            .single()

        if (compraError || !compra) {
            return NextResponse.json({ 
                error: 'Debes haber adquirido y completado el pago de este curso para poder valorarlo.' 
            }, { status: 403 })
        }

        // 2. Realizar el upsert de la reseña
        const { error: upsertError } = await supabase
            .from('ie_reviews')
            .upsert({
                curso_id: cursoId,
                user_id: user.id,
                rating: parseInt(rating),
                comentario: comentario?.trim() || '',
                created_at: new Date().toISOString()
            }, {
                onConflict: 'curso_id,user_id'
            })

        if (upsertError) {
            return NextResponse.json({ error: upsertError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
