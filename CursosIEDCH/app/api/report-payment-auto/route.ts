import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
// @ts-ignore
import pdf from 'pdf-parse'

export async function POST(req: Request) {
    try {
        const { cursoId, userId, publicURL, filePath, metodo, notas, esConstancia, referredBy } = await req.json()

        const supabaseUser = await createServerClient()

        // 1. Verificar sesión
        const { data: { user } } = await supabaseUser.auth.getUser()
        if (!user || user.id !== userId) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        // Cliente Admin para saltar RLS
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // 1.5. Validar comprobante (excepto si el usuario es sergio.olver@gmail.com)
        const userEmail = user.email || ''
        const isSergio = userEmail.toLowerCase() === 'sergio.olver@gmail.com'

        if (!isSergio) {
            if (!filePath) {
                return NextResponse.json({ success: false, error: 'No se especificó la ruta del comprobante para validación.' }, { status: 400 })
            }

            // Descargar el archivo desde el storage bucket
            const { data: fileBlob, error: downloadError } = await supabaseAdmin
                .storage
                .from('comprobantes')
                .download(filePath)

            if (downloadError || !fileBlob) {
                console.error('[STORAGE_DOWNLOAD_ERROR]', downloadError)
                return NextResponse.json({ success: false, error: 'No se pudo descargar el comprobante para validación. Por favor, inténtalo de nuevo.' }, { status: 400 })
            }

            const fileExt = filePath.split('.').pop()?.toLowerCase() || ''
            const buffer = Buffer.from(await fileBlob.arrayBuffer())
            const sizeInKb = buffer.length / 1024

            let isValid = false
            let validationErrorMsg = 'El comprobante subido no parece ser un recibo de transferencia o ticket de OXXO válido. Por favor, asegúrate de subir una captura legible y completa de tu pago.'

            if (fileExt === 'pdf') {
                try {
                    const pdfData = await pdf(buffer)
                    const text = (pdfData.text || '').toLowerCase()

                    // Buscar palabras clave de transacciones y pagos
                    const paymentKeywords = [
                        'oxxo', 'transferencia', 'pago', 'spei', 'comprobante', 
                        'monto', 'clabe', 'operacion', 'banco', 'ticket', 
                        'transaccion', 'concepto', 'bbva', 'bancomer', 'banamex', 
                        'santander', 'hsbc', 'deposito', 'efectivo', 'recibo', 
                        'referencia', 'exitoso', 'saldazo', 'clabe interbancaria', 
                        'institucion receptora', 'cuenta de retiro', 'fecha de aplicacion'
                    ]

                    let matchesCount = 0
                    for (const keyword of paymentKeywords) {
                        if (text.includes(keyword)) {
                            matchesCount++
                        }
                    }

                    // Se requiere al menos dos palabras clave para considerarlo válido
                    if (matchesCount >= 2) {
                        isValid = true
                    } else {
                        validationErrorMsg = 'El archivo PDF no parece contener información de una transferencia bancaria o ticket de pago. Por favor, sube tu comprobante de pago real.'
                    }
                } catch (pdfErr) {
                    console.error('[PDF_PARSE_ERROR]', pdfErr)
                    validationErrorMsg = 'No se pudo procesar el archivo PDF del comprobante. Asegúrate de que no esté corrupto ni protegido con contraseña.'
                }
            } else if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExt)) {
                // Validación para imágenes:
                // 1. Validar tamaño mínimo de 10 KB
                if (sizeInKb < 10) {
                    validationErrorMsg = 'La imagen subida es demasiado pequeña para ser un comprobante de pago válido. Por favor, sube una foto o captura legible.'
                } else {
                    // 2. Validar bytes mágicos
                    const hex = buffer.toString('hex', 0, 4).toUpperCase()
                    const isJpeg = hex.startsWith('FFD8FF')
                    const isPng = hex.startsWith('89504E47')
                    const isGif = hex.startsWith('47494638')
                    const isWebp = hex.startsWith('52494646') // "RIFF"

                    if (isJpeg || isPng || isGif || isWebp) {
                        isValid = true
                    } else {
                        validationErrorMsg = 'El archivo de imagen está corrupto o no tiene un formato válido (JPEG, PNG, WebP).'
                    }
                }
            } else {
                validationErrorMsg = 'Formato de archivo no soportado. Por favor, sube una imagen (PNG, JPG, WebP) o un archivo PDF.'
            }

            if (!isValid) {
                // Eliminar archivo inválido de Supabase storage para limpieza automática
                await supabaseAdmin
                    .storage
                    .from('comprobantes')
                    .remove([filePath])

                return NextResponse.json({ success: false, error: validationErrorMsg }, { status: 400 })
            }
        }

        // 2. Insertar en pagos manuales
        // Oxxo entra como pendiente de verificación pero con acceso automático
        const estadoInicial = metodo === 'oxxo' ? 'pendiente' : 'aprobado';

        const { data: pagoData, error: insertPagoError } = await supabaseAdmin
            .from('ie_pagos_manuales')
            .insert({
                user_id: userId,
                curso_id: cursoId,
                metodo_pago: metodo,
                comprobante_url: publicURL,
                estado: estadoInicial,
                notas: esConstancia ? `Pago automático (Constancia) reportado por ${metodo}` : `Pago automático reportado por ${metodo}`
            })

        if (insertPagoError) throw insertPagoError

        // 3. Dar acceso en ie_compras
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
                    pago_completo: esConstancia ? true : false,
                    referred_by: referredBy || null
                })

            if (insertError) throw insertError
        } else {
            if (esConstancia) {
                const { error: updateCompraError } = await supabaseAdmin
                    .from('ie_compras')
                    .update({ pago_completo: true })
                    .eq('id', existe.id)
                
                if (updateCompraError) throw updateCompraError
            }
        }

        return NextResponse.json({ success: true, message: 'Pago reportado y aprobado automáticamente' })
    } catch (error: any) {
        console.error('[API_REPORT_PAYMENT_AUTO_ERROR]', error)
        return NextResponse.json({ success: false, error: 'Hubo un error procesando la solicitud', details: error?.message || String(error) }, { status: 500 })
    }
}
