import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabaseSession = await createServerClient()
        const { data: { user } } = await supabaseSession.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Usamos service role para saltar RLS y leer todos los campos del perfil propio
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        let { data: profile, error } = await supabaseAdmin
            .from('ie_profiles')
            .select('id, nombre, apellido_paterno, apellido_materno, rol, referral_code, activo, telefono, banco, clabe, datos_bancarios_capturados, solicitud_cambio_datos, rfc, constancia_situacion_fiscal, fotografia_perfil, identidad_validada, correo_adicional, profesion_especialidad, institucion_labora, estado_municipio, cedula_profesional, clave_cct, limite_generaciones_gamma, solicitud_mas_intentos_gamma, verificado, nivel_academico, anos_experiencia, presentacion_profesional, organizacion_tipo, representante_nombre, representante_cargo, descripcion_institucional, regimen_fiscal, regimen_fiscal_solicitado, regimen_fiscal_estado, regimen_fiscal_motivo_rechazo, regimen_fiscal_actualizado_at')
            .eq('id', user.id)
            .single()

        if (error && error.code === '42703') {
            // Fallback elegante si aún no se ejecutan las columnas de la migración en la BD remota
            const resFallback = await supabaseAdmin
                .from('ie_profiles')
                .select('id, nombre, apellido_paterno, apellido_materno, rol, referral_code, activo, telefono, banco, clabe, datos_bancarios_capturados, solicitud_cambio_datos, rfc, constancia_situacion_fiscal, fotografia_perfil, identidad_validada, correo_adicional, profesion_especialidad, institucion_labora, estado_municipio, cedula_profesional, clave_cct, limite_generaciones_gamma, solicitud_mas_intentos_gamma, verificado, nivel_academico, anos_experiencia, presentacion_profesional, organizacion_tipo, representante_nombre, representante_cargo, descripcion_institucional')
                .eq('id', user.id)
                .single()

            if (resFallback.data) {
                profile = {
                    ...resFallback.data,
                    regimen_fiscal: 'sin_rfc',
                    regimen_fiscal_solicitado: null,
                    regimen_fiscal_estado: 'aprobado',
                    regimen_fiscal_motivo_rechazo: null,
                    regimen_fiscal_actualizado_at: new Date().toISOString()
                }
                error = null
            } else {
                error = resFallback.error
            }
        }

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ data: profile })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabaseSession = await createServerClient()
        const { data: { user } } = await supabaseSession.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Obtener el perfil actual para saber su estado y rol
        const { data: currentProfile, error: currentError } = await supabaseAdmin
            .from('ie_profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (currentError || !currentProfile) {
            return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
        }

        const updateData: Record<string, any> = { ...body }

        // Gestionar la lógica del régimen fiscal
        const regimenDeseado = body.regimen_fiscal_deseado || body.regimen_fiscal

        if (regimenDeseado) {
            const rfcTrimmed = (body.rfc || currentProfile.rfc || '').trim().toUpperCase()

            if (regimenDeseado === 'sin_rfc') {
                updateData.regimen_fiscal = 'sin_rfc'
                updateData.regimen_fiscal_solicitado = null
                updateData.regimen_fiscal_estado = 'aprobado'
                updateData.regimen_fiscal_motivo_rechazo = null
                updateData.regimen_fiscal_actualizado_at = new Date().toISOString()
            } else if (regimenDeseado === 'con_rfc' || regimenDeseado === 'persona_moral') {
                // Validación del RFC
                if (!rfcTrimmed) {
                    return NextResponse.json({ 
                        error: `Para el régimen "${regimenDeseado === 'con_rfc' ? 'Con RFC' : 'Persona Moral'}" es obligatorio capturar tu RFC.` 
                    }, { status: 400 })
                }

                if (regimenDeseado === 'con_rfc' && rfcTrimmed.length !== 13) {
                    return NextResponse.json({ 
                        error: 'El RFC para Persona Física debe contener exactamente 13 caracteres (4 letras, 6 números, 3 homoclave).' 
                    }, { status: 400 })
                }

                if (regimenDeseado === 'persona_moral' && rfcTrimmed.length !== 12) {
                    return NextResponse.json({ 
                        error: 'El RFC para Persona Moral debe contener exactamente 12 caracteres (3 letras, 6 números, 3 homoclave).' 
                    }, { status: 400 })
                }

                updateData.rfc = rfcTrimmed

                // Si ya estaba aprobado con este mismo régimen y no cambió el RFC
                if (
                    currentProfile.regimen_fiscal === regimenDeseado && 
                    currentProfile.regimen_fiscal_estado === 'aprobado' &&
                    currentProfile.rfc === rfcTrimmed
                ) {
                    // Mantiene su aprobación
                    updateData.regimen_fiscal = regimenDeseado
                    updateData.regimen_fiscal_solicitado = null
                    updateData.regimen_fiscal_estado = 'aprobado'
                } else {
                    // Pasa a pendiente de autorización por el admin
                    updateData.regimen_fiscal = currentProfile.regimen_fiscal || 'sin_rfc'
                    updateData.regimen_fiscal_solicitado = regimenDeseado
                    updateData.regimen_fiscal_estado = 'pendiente'
                    updateData.regimen_fiscal_motivo_rechazo = null
                    updateData.regimen_fiscal_actualizado_at = new Date().toISOString()
                }
            }
        }

        // Limpiar campos auxiliares que no son columnas de la BD
        delete updateData.regimen_fiscal_deseado

        let { error: updateError } = await supabaseAdmin
            .from('ie_profiles')
            .update(updateData)
            .eq('id', user.id)

        if (updateError && updateError.code === '42703') {
            // Si las columnas aún no están en la BD física remota, actualizar campos estándar sin fallar
            const sanitizedData = { ...updateData }
            delete sanitizedData.regimen_fiscal
            delete sanitizedData.regimen_fiscal_solicitado
            delete sanitizedData.regimen_fiscal_estado
            delete sanitizedData.regimen_fiscal_motivo_rechazo
            delete sanitizedData.regimen_fiscal_actualizado_at

            const resSanitized = await supabaseAdmin
                .from('ie_profiles')
                .update(sanitizedData)
                .eq('id', user.id)

            if (!resSanitized.error) {
                updateError = null
            } else {
                updateError = resSanitized.error
            }
        }

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data: updateData })

    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 })
    }
}
