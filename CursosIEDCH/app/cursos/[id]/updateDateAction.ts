'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function updateCompraDate(cursoId: string, isoDate: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: compra } = await supabase
        .from('ie_compras')
        .select('id')
        .eq('curso_id', cursoId)
        .eq('user_id', user.id)
        .single()
    
    if (compra) {
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        await adminSupabase.from('ie_compras').update({ fecha_compra: isoDate }).eq('id', compra.id)
        return true
    }
    return false
}
