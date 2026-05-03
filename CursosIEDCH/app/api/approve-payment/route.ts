import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function POST(req: Request) {
    try {
        const supabaseAdmin = await createClient()
        const { pagoId, userId, cursoId, userEmail, userName, cursoTitulo, accion, notas, esPagoCompleto, referredBy } = await req.json()

        // Inicializar Resend solo si tenemos la llave (para evitar crasheos si falta .env)
        const resendApiKey = process.env.RESEND_API_KEY || ''
        const resend = resendApiKey ? new Resend(resendApiKey) : null

        if (accion === 'aprobar') {
            // 1. Marcar como aprobado
            const { error: updateError } = await supabaseAdmin
                .from('ie_pagos_manuales')
                .update({ estado: 'aprobado', fecha_revision: new Date() })
                .eq('id', pagoId)

            if (updateError) throw updateError

            // 2. Insertar en ie_compras para dar acceso
            const { data: existe } = await supabaseAdmin
                .from('ie_compras')
                .select('id')
                .eq('user_id', userId)
                .eq('curso_id', cursoId)
                .single()

            if (!existe) {
                const { error: insertError } = await supabaseAdmin
                    .from('ie_compras')
                    .insert({ 
                        user_id: userId, 
                        curso_id: cursoId, 
                        pagado: true, 
                        pago_completo: esPagoCompleto !== undefined ? esPagoCompleto : true,
                        ...(referredBy ? { referred_by: referredBy } : {}),
                    })

                if (insertError) throw insertError
            } else if (esPagoCompleto) {
                // Si el alumno ya tenía ie_compras (ej. por cupón del 100% o pago parcial anterior) y ahora liquidó para la constancia
                const { error: updateCompraError } = await supabaseAdmin
                    .from('ie_compras')
                    .update({ pago_completo: true })
                    .eq('id', existe.id)
                
                if (updateCompraError) throw updateCompraError
            }

            // 3. Enviar correo de aprobación
            if (resendApiKey && userEmail && resend) {
                try {
                    await resend.emails.send({
                        from: 'IEDCH <sistema@tusistema.com>', // Cambia esto por tu dominio verificado en Resend
                        to: userEmail,
                        subject: `¡Pago Aprobado! Ya tienes acceso a: ${cursoTitulo}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                                <h2>¡Hola ${userName}!</h2>
                                <p>Tu pago ha sido validado exitosamente.</p>
                                <p>Ya tienes acceso completo al curso: <strong>${cursoTitulo}</strong>.</p>
                                <br/>
                                <p>Entra a la plataforma y dirígete al curso para empezar a aprender.</p>
                                <p>Saludos,<br/>El equipo de IEDCH</p>
                            </div>
                        `
                    })
                } catch (emailError) {
                    console.error('Error enviando email:', emailError)
                }
            }

            return NextResponse.json({ success: true, message: 'Aprobado y notificado' })

        } else if (accion === 'rechazar') {
            // 1. Marcar como rechazado
            const { data: pagoAfectado, error: updateError } = await supabaseAdmin
                .from('ie_pagos_manuales')
                .update({ estado: 'rechazado', notas: notas, fecha_revision: new Date() })
                .eq('id', pagoId)
                .select()
                .single()

            if (updateError) throw updateError

            // Revertir compra si fue un pago OXXO con acceso automático
            if (pagoAfectado && pagoAfectado.notas?.includes('automático')) {
                if (pagoAfectado.notas.includes('(Constancia)')) {
                    // Revertir pago completo de constancia
                    await supabaseAdmin.from('ie_compras')
                        .update({ pago_completo: false })
                        .eq('user_id', userId)
                        .eq('curso_id', cursoId)
                } else {
                    // Eliminar la compra entera
                    await supabaseAdmin.from('ie_compras')
                        .delete()
                        .eq('user_id', userId)
                        .eq('curso_id', cursoId)
                }
            }

            // 2. Send rejection email
            if (resendApiKey && userEmail && resend) {
                try {
                    await resend.emails.send({
                        from: 'IEDCH <sistema@tusistema.com>', // Cambia esto
                        to: userEmail,
                        subject: `Aviso sobre tu pago del curso: ${cursoTitulo}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                                <h2>Hola ${userName},</h2>
                                <p>Hubo un inconveniente al validar tu comprobante de pago para el curso: <strong>${cursoTitulo}</strong>.</p>
                                ${notas ? `<p><strong>Motivo / Nota del administrador:</strong> ${notas}</p>` : ''}
                                <br/>
                                <p>Por favor, vuelve a intentar subir un comprobante válido en la página del curso o contáctanos para mayor asistencia.</p>
                                <p>Saludos,<br/>El equipo de IEDCH</p>
                            </div>
                        `
                    })
                } catch (emailError) {
                    console.error('Error enviando email:', emailError)
                }
            }

            return NextResponse.json({ success: true, message: 'Rechazado y notificado' })
        }

        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })

    } catch (error: any) {
        console.error('[API_APPROVE_PAYMENT_ERROR]', error)
        return NextResponse.json({ success: false, error: 'Hubo un error procesando la solicitud', details: error?.message || String(error) }, { status: 500 })
    }
}
