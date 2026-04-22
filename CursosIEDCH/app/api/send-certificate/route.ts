import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
    console.log('[API_SEND_CERTIFICATE] Iniciando proceso...')
    try {
        const { email, cursoTitulo, cursoId, folio, pdfData } = await req.json()
        console.log('[API_SEND_CERTIFICATE] Payload recibido:', { email, cursoTitulo, folio })
        
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('[API_SEND_CERTIFICATE] Faltan variables de entorno')
            return NextResponse.json({ error: 'Faltan variables de entorno para el acceso a Supabase.' }, { status: 500 })
        }

        // 1. Inicializar Supabase Admin
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // 2. Preparar el archivo (Optimizado a JPEG para evitar límites de tamaño)
        const base64Content = pdfData.split(',')[1]
        const buffer = Buffer.from(base64Content, 'base64')
        const fileName = `certificados-generados/${folio || Date.now()}.pdf`
        console.log('[API_SEND_CERTIFICATE] Archivo preparado:', fileName)

        // 3. Subir a Supabase Storage (Bucket: cursos_contenido)
        let publicUrl = ''
        try {
            console.log('[API_SEND_CERTIFICATE] Subiendo a Storage...')
            const { error: uploadError } = await supabaseAdmin.storage
                .from('cursos_contenido')
                .upload(fileName, buffer, {
                    contentType: 'application/pdf',
                    upsert: true
                })

            if (uploadError) throw uploadError

            const { data: publicUrlData } = supabaseAdmin.storage
                .from('cursos_contenido')
                .getPublicUrl(fileName)
            
            publicUrl = publicUrlData.publicUrl
            console.log('[API_SEND_CERTIFICATE] Subida exitosa. URL publica:', publicUrl)
        } catch (storageErr: any) {
            console.error('[API_SEND_CERTIFICATE] Error en Storage:', storageErr)
            return NextResponse.json({ 
                success: false, 
                error: 'Error al subir a Supabase Storage.', 
                details: storageErr?.message || String(storageErr) 
            }, { status: 500 })
        }

        // 4. Invocar la Edge Function de Supabase para enviar el correo (Opción 2)
        try {
            console.log('[API_SEND_CERTIFICATE] Actualizando DB y llamando a Edge Function...')
            // Primero aseguramos que la base de datos esté actualizada
            const { error: dbError } = await supabaseAdmin
                .from('ie_resultados_examenes')
                .update({ url_constancia: publicUrl })
                .eq('id', folio)
            
            if (dbError) console.warn('[API_SEND_CERTIFICATE] Advertencia en DB:', dbError.message)

            // Luego Enviamos el correo directo desde Node.js
            console.log('[API_SEND_CERTIFICATE] Enviando correo directo desde Node.js...')
            const { sendCertificateNotification } = await import('@/lib/mail')
            
            try {
                const mailResult = await sendCertificateNotification({
                    email, 
                    cursoTitulo, 
                    publicUrl, 
                    folio 
                })
                console.log('[API_SEND_CERTIFICATE] Correo enviado con exito:', mailResult)
                return NextResponse.json({ 
                    success: true, 
                    message: 'Constancia generada y enviada con éxito.',
                    data: mailResult 
                })
            } catch (mailErr: any) {
                console.error('[API_SEND_CERTIFICATE] Error al enviar correo:', mailErr)
                return NextResponse.json({ 
                    success: false, 
                    error: 'Error al enviar el correo con la constancia.', 
                    details: mailErr.message || String(mailErr) 
                }, { status: 500 })
            }
        } catch (procErr: any) {
            console.error('[API_SEND_CERTIFICATE] Error en procesamiento final:', procErr)
            return NextResponse.json({ 
                success: false, 
                error: 'Error en el paso final de procesamiento.', 
                details: procErr?.message || String(procErr) 
            }, { status: 500 })
        }

    } catch (error: any) {
        console.error('[API_SEND_CERTIFICATE_FATAL_ERROR]', error)
        return NextResponse.json({ 
            success: false, 
            error: 'Hubo un error fatal al procesar la solicitud.', 
            details: error?.message || String(error) 
        }, { status: 500 })
    }
}
