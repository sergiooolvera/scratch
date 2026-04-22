import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
    try {
        const { cursoId } = await req.json()
        const supabase = await createServerClient()

        // 1. Verificar Sesión (Profesor o Admin)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        // 2. Obtener detalles del curso y verificar permisos (Dueño o Admin)
        const { data: curso } = await supabase
            .from('ie_cursos')
            .select('titulo, reunion_url, nota_profesor, creado_por')
            .eq('id', cursoId)
            .single()

        if (!curso) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })

        const { data: profile } = await supabase.from('ie_profiles').select('rol').eq('id', user.id).single()
        const isAdmin = profile?.rol === 'admin'

        if (curso.creado_por !== user.id && !isAdmin) {
            return NextResponse.json({ error: 'No tienes permisos para notificar este curso' }, { status: 403 })
        }

        if (!curso.reunion_url && !curso.nota_profesor) {
            return NextResponse.json({ error: 'No hay información de reunión o avisos para enviar.' }, { status: 400 })
        }

        // 3. Obtener Alumnos Inscritos (Pagados o vía Cupón)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
        
        if (!supabaseServiceRole) {
            console.error('[NOTIFY] Error: Faltan variables de entorno SMTP/Role')
            return NextResponse.json({ error: 'Configuración del servidor incompleta (Servicio).' }, { status: 500 })
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole)

        const { data: compras } = await supabaseAdmin
            .from('ie_compras')
            .select('user_id')
            .eq('curso_id', cursoId)
            .eq('pagado', true) // Los cupones también se marcan como pagado: true

        if (!compras || compras.length === 0) {
            return NextResponse.json({ error: 'Aún no hay alumnos inscritos en este curso.' }, { status: 400 })
        }

        const studentIds = compras.map(c => c.user_id)
        console.log(`[NOTIFY] Alumnos inscritos (IDs):`, studentIds)
        console.log(`[NOTIFY] Alumnos inscritos (IDs):`, studentIds)

        // 4. Obtener Correos de Alumnos (Desde Auth via Admin)
        console.log(`[NOTIFY] Obteniendo correos de Auth...`)

        // Obtenemos correos uno por uno (en paralelo) para asegurar precisión
        console.log(`[NOTIFY] Obteniendo correos de Auth...`)
        const userPromises = studentIds.map(id => supabaseAdmin.auth.admin.getUserById(id))
        const userResults = await Promise.all(userPromises)

        const emails = userResults
            .map(res => res.data.user?.email)
            .filter((email): email is string => !!email)

        console.log(`[NOTIFY] Correos finales a notificar:`, emails)

        if (emails.length === 0) {
           return NextResponse.json({ 
               error: `No se encontraron correos para los ${studentIds.length} alumnos inscritos.`,
               details: 'Asegúrate de que los alumnos tengan un correo registrado en su cuenta de usuario.' 
           }, { status: 400 })
        }

        console.log(`[NOTIFY] Enviando correo directo desde Node.js...`)
        // 5. Enviar Correo Directo mediante la utilidad Node.js
        const { sendReunionNotification } = await import('@/lib/mail')
        
        try {
            const results = await sendReunionNotification({
                emails, 
                cursoTitulo: curso.titulo, 
                reunionUrl: curso.reunion_url, 
                notaProfesor: curso.nota_profesor 
            })

            console.log('[NOTIFY_SUCCESS]', results)
            return NextResponse.json({ success: true, count: emails.length, results })
        } catch (mailError: any) {
            console.error('[NOTIFY_MAIL_ERROR]', mailError)
            return NextResponse.json({ 
                error: 'Fallo al conectar con el servidor de Gmail (SMTP).', 
                details: `${mailError.message}. Verifica que tu contraseña de aplicación en .env.local sea correcta.` 
            }, { status: 500 })
        }

    } catch (error: any) {
        console.error('[API_NOTIFY_REUNION_FATAL]', error)
        return NextResponse.json({ error: 'Error interno del servidor.', details: error.message }, { status: 500 })
    }
}
