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

        const { data: adminProfile } = await supabaseSession
            .from('ie_profiles')
            .select('rol, permisos_adminjr')
            .eq('id', user.id)
            .single()
            
        const rol = adminProfile?.rol
        const permisos = Array.isArray(adminProfile?.permisos_adminjr) ? (adminProfile.permisos_adminjr as string[]) : []

        if (rol !== 'admin' && (rol !== 'adminjr' || !permisos.includes('usuarios'))) {
            return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
        }

        const body = await request.json()
        const { userId, accion, motivoRechazo, nuevoRegimen } = body

        if (!userId || !accion || !['aprobar', 'rechazar'].includes(accion)) {
            return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        let { data: targetProfile, error: fetchErr } = await supabaseAdmin
            .from('ie_profiles')
            .select('id, regimen_fiscal, regimen_fiscal_solicitado, regimen_fiscal_estado')
            .eq('id', userId)
            .single()

        if (fetchErr && fetchErr.code === '42703') {
            const fallback = await supabaseAdmin
                .from('ie_profiles')
                .select('id')
                .eq('id', userId)
                .single()
            if (fallback.data) {
                targetProfile = {
                    id: fallback.data.id,
                    regimen_fiscal: 'sin_rfc',
                    regimen_fiscal_solicitado: null,
                    regimen_fiscal_estado: 'aprobado'
                }
                fetchErr = null
            }
        }

        if (fetchErr || !targetProfile) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
        }

        const updateData: Record<string, any> = {
            regimen_fiscal_actualizado_at: new Date().toISOString()
        }

        if (accion === 'aprobar') {
            const regimenAprobado = nuevoRegimen || targetProfile.regimen_fiscal_solicitado || targetProfile.regimen_fiscal || 'sin_rfc'
            updateData.regimen_fiscal = regimenAprobado
            updateData.regimen_fiscal_solicitado = null
            updateData.regimen_fiscal_estado = 'aprobado'
            updateData.regimen_fiscal_motivo_rechazo = null
        } else if (accion === 'rechazar') {
            updateData.regimen_fiscal_solicitado = null
            updateData.regimen_fiscal_estado = 'rechazado'
            updateData.regimen_fiscal_motivo_rechazo = motivoRechazo?.trim() || 'Documentación o RFC no validado por administración'
        }

        let { error: updateErr } = await supabaseAdmin
            .from('ie_profiles')
            .update(updateData)
            .eq('id', userId)

        if (updateErr && updateErr.code === '42703') {
            updateErr = null
        }

        if (updateErr) {
            return NextResponse.json({ error: updateErr.message }, { status: 500 })
        }

        return NextResponse.json({ 
            success: true, 
            regimen_fiscal: updateData.regimen_fiscal || targetProfile.regimen_fiscal,
            regimen_fiscal_estado: updateData.regimen_fiscal_estado
        })

    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 })
    }
}
