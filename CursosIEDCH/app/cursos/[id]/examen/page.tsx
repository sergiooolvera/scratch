import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import ExamenClient from './ExamenClient'
import { AlertCircle, AlertTriangle, ArrowLeft, BookOpen, CheckCircle, HelpCircle } from 'lucide-react'

// Beautiful, premium reusable status modal for error/info/success fallbacks
function StatusModal({
    tipo,
    titulo,
    subtitulo,
    descripcion,
    id
}: {
    tipo: 'error' | 'warning' | 'success' | 'info';
    titulo: string;
    subtitulo: string;
    descripcion: string;
    id: string;
}) {
    const configs = {
        error: {
            pillBg: 'bg-rose-500/10 dark:bg-rose-500/20',
            pillText: 'text-rose-600 dark:text-rose-400',
            icon: <AlertCircle className="h-8 w-8 text-rose-500 dark:text-rose-400" />,
            glow: 'bg-rose-500/10 dark:bg-rose-500/20'
        },
        warning: {
            pillBg: 'bg-amber-500/10 dark:bg-amber-500/20',
            pillText: 'text-amber-600 dark:text-amber-400',
            icon: <AlertTriangle className="h-8 w-8 text-amber-500 dark:text-amber-400" />,
            glow: 'bg-amber-500/10 dark:bg-amber-500/20'
        },
        success: {
            pillBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
            pillText: 'text-emerald-600 dark:text-emerald-400',
            icon: <CheckCircle className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />,
            glow: 'bg-emerald-500/10 dark:bg-emerald-500/20'
        },
        info: {
            pillBg: 'bg-blue-500/10 dark:bg-blue-500/20',
            pillText: 'text-blue-600 dark:text-blue-400',
            icon: <HelpCircle className="h-8 w-8 text-blue-500 dark:text-blue-400" />,
            glow: 'bg-blue-500/10 dark:bg-blue-500/20'
        }
    }[tipo];

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-300 relative overflow-hidden">
            {/* Ambient gradients for high-end depth */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-40">
                <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] rounded-full bg-blue-400 dark:bg-blue-600 blur-[80px]"></div>
                <div className="absolute bottom-[20%] right-[20%] w-[250px] h-[250px] rounded-full bg-purple-400 dark:bg-purple-600 blur-[80px]"></div>
            </div>

            <div className="relative w-full max-w-lg bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-zinc-200/50 dark:border-zinc-800/50 text-center transform hover:scale-[1.01] transition-all duration-300">
                {/* Glowing status ring & icon */}
                <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center">
                    <div className={`absolute inset-0 rounded-full ${configs.glow} animate-ping opacity-75`}></div>
                    <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200/50 dark:border-zinc-700/50 flex items-center justify-center shadow-md">
                        {configs.icon}
                    </div>
                </div>

                {/* Subtitle Pill */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${configs.pillBg} ${configs.pillText} mb-4 tracking-wider uppercase`}>
                    {subtitulo}
                </span>

                {/* Typography */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-3">
                    {titulo}
                </h1>
                
                <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed max-w-md mx-auto mb-8">
                    {descripcion}
                </p>

                {/* Divider */}
                <div className="w-full h-px bg-zinc-200/60 dark:bg-zinc-800/60 mb-6"></div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <a
                        href={`/cursos/${id}/contenido`}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-sm shadow-lg shadow-zinc-950/10 hover:shadow-zinc-950/20 transition-all duration-200 active:scale-95 group"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                        Volver al contenido
                    </a>
                    
                    <a
                        href="/mis-cursos"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-sm transition-all duration-200 active:scale-95"
                    >
                        <BookOpen className="h-4 w-4" />
                        Mis cursos
                    </a>
                </div>
            </div>
        </div>
    );
}

export default async function ExamenContenidoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify purchase
    const { data: compra } = await supabase
        .from('ie_compras')
        .select('*')
        .eq('curso_id', id)
        .eq('user_id', user.id)
        .eq('pagado', true)
        .single()

    if (!compra) {
        redirect(`/cursos/${id}`)
    }

    // Fetch course details
    const { data: curso } = await supabase
        .from('ie_cursos')
        .select('*')
        .eq('id', id)
        .single()

    if (!curso) {
        notFound()
    }

    const maestroId = 'f160fe4d-5461-44c5-b868-51f1f0cae4c2';
    const allowedEmails = ['sergio.olver@gmail.com', 'maestro@iedch.com'];
    const userEmail = user?.email?.toLowerCase();

    if (curso.creado_por === maestroId) {
        if (!userEmail || !allowedEmails.includes(userEmail)) {
            notFound();
        }
    }

    if (curso.mostrar_examen_final === false) {
        return (
            <StatusModal
                tipo="info"
                titulo="Evaluación no disponible"
                subtitulo="Aviso del portal"
                descripcion="La evaluación no está disponible temporalmente por indicaciones del docente."
                id={id}
            />
        );
    }

    if (!curso.requiere_examen) {
        return (
            <StatusModal
                tipo="info"
                titulo="Evaluación no requerida"
                subtitulo="Información del curso"
                descripcion="Este curso no cuenta con un examen final configurado ni requiere de evaluación para completarse."
                id={id}
            />
        );
    }

    // Fetch the exam
    const { data: examen, error: exmError } = await supabase
        .from('ie_examenes')
        .select('id, tiempo_limite, seguridad_aumentada, max_cambios_pantalla, intentos_permitidos')
        .eq('curso_id', id)
        .single()

    if (exmError || !examen) {
        return (
            <StatusModal
                tipo="warning"
                titulo="Evaluación no disponible"
                subtitulo="Aviso del portal"
                descripcion="El profesor indicó que este curso requiere una evaluación final, pero el formulario interactivo aún no ha sido cargado o no se han acreditado los modulos anteriores que anteceden a este examen."
                id={id}
            />
        );
    }

    // Check attempts and if already passed
    const { data: intentos } = await supabase
        .from('ie_resultados_examenes')
        .select('aprobado')
        .eq('examen_id', examen.id)
        .eq('user_id', user.id)

    const yaAprobo = intentos?.some(i => i.aprobado);
    const intentosUsados = intentos?.length || 0;
    const maxIntentos = examen.intentos_permitidos || 3;

    if (yaAprobo) {
        return (
            <StatusModal
                tipo="success"
                titulo="Examen Aprobado"
                subtitulo="¡Felicidades!"
                descripcion="Ya has completado y aprobado satisfactoriamente esta evaluación. No es necesario presentarla de nuevo."
                id={id}
            />
        );
    }

    if (intentosUsados >= maxIntentos) {
        return (
            <StatusModal
                tipo="error"
                titulo="Límite de intentos superado"
                subtitulo="Evaluación bloqueada"
                descripcion={`Has alcanzado el límite máximo de intentos permitidos (${maxIntentos}) para presentar esta evaluación.`}
                id={id}
            />
        );
    }

    // Fetch ONLY the questions, explicitly avoiding `respuesta_correcta` so it doesn't leak to the client bundle
    const { data: preguntas, error: pregError } = await supabase
        .from('ie_preguntas')
        .select('id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, orden, tipo_pregunta')
        .eq('examen_id', examen.id)
        .order('orden', { ascending: true })

    if (pregError || !preguntas || preguntas.length === 0) {
        return (
            <StatusModal
                tipo="error"
                titulo="Error al cargar preguntas"
                subtitulo="Fallo técnico"
                descripcion="No se encontraron preguntas de examen asociadas a este curso. Por favor, reporta este inconveniente."
                id={id}
            />
        );
    }

    /* Format to ensure type safety */
    const preguntasFormateadas = preguntas.map(p => ({
        id: p.id,
        pregunta: p.pregunta,
        opcion_a: p.opcion_a,
        opcion_b: p.opcion_b,
        opcion_c: p.opcion_c,
        opcion_d: p.opcion_d,
        tipo_pregunta: p.tipo_pregunta
    }));


    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-[calc(100vh-64px)] font-sans transition-colors duration-300">
            <ExamenClient
                cursoId={id}
                cursoTitulo={curso.titulo}
                preguntas={preguntasFormateadas}
                tiempoLimite={examen.tiempo_limite}
                seguridadAumentada={examen.seguridad_aumentada}
                maxCambiosPantalla={examen.max_cambios_pantalla}
            />
        </div>
    )
}
