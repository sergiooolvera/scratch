import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
    try {
        const supabaseUser = await createServerClient()
        const { data: { user } } = await supabaseUser.auth.getUser()

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { data: credsActuales } = await supabaseAdmin
            .from('ie_institucion_creditos')
            .select('creditos_restantes')
            .eq('user_id', user.id)
            .single()

        if (credsActuales && credsActuales.creditos_restantes > 0) {
            const { error } = await supabaseAdmin
                .from('ie_institucion_creditos')
                .update({ creditos_restantes: credsActuales.creditos_restantes - 1 })
                .eq('user_id', user.id)

            if (error) throw error
            
            return NextResponse.json({ success: true })
        } else {
            return NextResponse.json({ success: false, error: 'No hay créditos suficientes' }, { status: 400 })
        }
    } catch (error: any) {
        console.error('[API_DEDUCT_CREDIT_ERROR]', error)
        return NextResponse.json({ success: false, error: 'Error al descontar el crédito' }, { status: 500 })
    }
}
