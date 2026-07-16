'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, FileText, CheckCircle, Activity, Plus, Layout, BookOpen, BrainCircuit, MessageSquare, Sparkles, ArrowLeft, History, ArrowRight, ArrowUp, ArrowDown, Calculator, ChevronDown, ChevronUp, Gamepad2, Heart, Star, Image as ImageIcon, Play, Presentation, Code } from 'lucide-react'
import Link from 'next/link'
import { moduloTieneExamenContestado } from './actions'
import { notifyAdminsOnCourseEdit } from '@/app/actions/notifications'
import CertificadoDocument from '@/components/CertificadoDocument'
import CertificadoModelo2 from '@/components/CertificadoModelo2'
import CertificadoModelo3 from '@/components/CertificadoModelo3'
import ResponsiveCertificateWrapper from '@/components/ResponsiveCertificateWrapper'
import SimuladorIngresosModal from '@/components/SimuladorIngresosModal'
import SubidorBunny from '@/components/SubidorBunny'

type Recurso = {
    id?: string;
    titulo: string;
    tipo: 'video' | 'pdf' | 'html' | 'ppt';
    url_contenido: string;
    archivoPdf?: File | null;
    descargable?: boolean;
    isPersisted?: boolean;
}

type Modulo = {
    id?: string;
    titulo: string;
    orden?: number;
    recursos: Recurso[];
    requiereExamen: boolean;
    examenMinAprobacion: number;
    examenPreguntas: PreguntaParsed[];
    requiereTarea?: boolean;
    tareaInstrucciones?: string;
    tareaPuntos?: string;
    tareaTipo?: 'convencional' | 'puzzle';
    tareaPuzzleTipo?: 'anagrama' | 'ahorcado' | 'sopa';
    tareaPuzzlePregunta?: string;
    tareaPuzzleRespuesta?: string;
    tareaPuzzles?: { pregunta: string; respuesta: string; tipo?: 'anagrama' | 'ahorcado' | 'sopa' }[];
    requierePuzzle?: boolean;
    puzzlePuntos?: string;
    puzzleTipo?: 'anagrama' | 'ahorcado' | 'sopa';
    puzzlePregunta?: string;
    puzzleRespuesta?: string;
    puzzlePuzzles?: { pregunta: string; respuesta: string; tipo?: 'anagrama' | 'ahorcado' | 'sopa' }[];
    requiereCuestionario?: boolean;
    cuestionarioPreguntas?: { id?: string; pregunta: string; orden?: number }[];
    seguridadAumentada?: boolean;
    maxCambiosPantalla?: number | '';
    conTiempo?: boolean;
    tiempoExamen?: number | '';
    intentosPermitidos?: number | '';
}

type PreguntaParsed = {
    id?: string;
    pregunta: string;
    opcion_a: string;
    opcion_b: string;
    opcion_c: string;
    opcion_d: string;
    respuesta_correcta: string;
    tipo_pregunta: 'opcion_multiple' | 'respuesta_libre';
}

export default function EditarCursoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [activeTab, setActiveTab] = useState<'info' | 'modulos' | 'examen' | 'avisos'>('info')
    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        competencias: '',
        beneficios: '',
        duracion: '',
        precio: 0,
        instructor: '',
        reunion_url: '',
        nota_profesor: '',
        categoria: 'desarrollo',
        modalidad: 'abierta',
        limite_inscripcion: '',
    })

    const [vigenciaAnos, setVigenciaAnos] = useState<number>(3)
    const [estadoActual, setEstadoActual] = useState('')
    const [tieneBorrador, setTieneBorrador] = useState(false)
    const [requierePagoCompleto, setRequierePagoCompleto] = useState(false)
    const [bloquearAvance, setBloquearAvance] = useState(false)
    const [requiereTareasAvance, setRequiereTareasAvance] = useState(false)
    const [requiereExamenAvance, setRequiereExamenAvance] = useState(false)
    const [mostrarExamenFinal, setMostrarExamenFinal] = useState(true)
    const [mostrarConstancia, setMostrarConstancia] = useState(true)
    const [mostrarCalificacionConstancia, setMostrarCalificacionConstancia] = useState(true)
    const [mostrarRevisionExamen, setMostrarRevisionExamen] = useState(false)

    // Logo custom states
    const [archivoLogo, setArchivoLogo] = useState<File | null>(null)
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [archivoImagen, setArchivoImagen] = useState<File | null>(null)
    const [imagenPreviewUrl, setImagenPreviewUrl] = useState<string | null>(null)
    const [imagenUrl, setImagenUrl] = useState<string | null>(null)
    const [mostrarLogoConstancia, setMostrarLogoConstancia] = useState(false)
    const [plantillaConstancia, setPlantillaConstancia] = useState('modelo1')
    const [modificarConstancia, setModificarConstancia] = useState(false)
    
    // Modules state
    const [modulos, setModulos] = useState<Modulo[]>([])

    // Exam state (Final exam)
    const [requiereExamen, setRequiereExamen] = useState(false)
    const [minAprobacion, setMinAprobacion] = useState<number | ''>(80)
    const [aplicarIva, setAplicarIva] = useState(false)
    const [isSimuladorOpen, setIsSimuladorOpen] = useState(false)
    const [porcentajeProfesor, setPorcentajeProfesor] = useState(60)
    const [conTiempo, setConTiempo] = useState(false)
    const [tiempoExamen, setTiempoExamen] = useState<number | ''>(60)
    const [seguridadAumentada, setSeguridadAumentada] = useState(false)
    const [maxCambios, setMaxCambios] = useState<number | ''>(3)
    const [intentosPermitidos, setIntentosPermitidos] = useState<number | ''>(3)
    const [preguntasExtraidas, setPreguntasExtraidas] = useState<PreguntaParsed[]>([])
    const [isParsing, setIsParsing] = useState(false)
    const [archivoExamen, setArchivoExamen] = useState<File | null>(null)
    const [modalMessage, setModalMessage] = useState<{ title: string; content: string; type: 'success' | 'error' | 'info'; redirectUrl?: string } | null>(null)

    // Gamma API integration states
    const [gammaGenerations, setGammaGenerations] = useState<any[]>([])
    const [hiddenGenerations, setHiddenGenerations] = useState<string[]>([])
    const [activeGammaModuloIdx, setActiveGammaModuloIdx] = useState<number | null>(null)
    const [gammaPrompt, setGammaPrompt] = useState('')
    const [gammaNumSlides, setGammaNumSlides] = useState(10)
    const [gammaFormato, setGammaFormato] = useState<'pdf' | 'pptx'>('pptx')
    const [isGeneratingGamma, setIsGeneratingGamma] = useState(false)
    const [isRequestingGamma, setIsRequestingGamma] = useState(false)
    const [gammaError, setGammaError] = useState('')
    const [gammaSuccessResult, setGammaSuccessResult] = useState<{ id: string; gammaUrl: string; exportUrl: string; creditsUsed?: number } | null>(null)
    const [gammaTitleInput, setGammaTitleInput] = useState('')
    const [gammaIdioma, setGammaIdioma] = useState<'es-419' | 'en'>('es-419')
    const [gammaTema, setGammaTema] = useState<string>('')
    const [profile, setProfile] = useState<any>(null)
    const maxGammaAttempts = profile?.limite_generaciones_gamma ?? 3;

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [mensaje, setMensaje] = useState('')
    const [collapsedModulos, setCollapsedModulos] = useState<Record<number, boolean>>({})
    const [collapsedExamenes, setCollapsedExamenes] = useState<Record<number, boolean>>({})
    const [collapsedTareas, setCollapsedTareas] = useState<Record<number, boolean>>({})
    const [collapsedPuzzles, setCollapsedPuzzles] = useState<Record<number, boolean>>({})
    const [collapsedCuestionarios, setCollapsedCuestionarios] = useState<Record<number, boolean>>({})

    const toggleModuloCollapsed = (index: number) => {
        setCollapsedModulos(prev => ({
            ...prev,
            [index]: !prev[index]
        }))
    }

    const toggleExamenCollapsed = (index: number) => {
        setCollapsedExamenes(prev => ({
            ...prev,
            [index]: !prev[index]
        }))
    }

    const toggleCuestionarioCollapsed = (index: number) => {
        setCollapsedCuestionarios(prev => ({
            ...prev,
            [index]: !prev[index]
        }))
    }

    const toggleTareaCollapsed = (index: number) => {
        setCollapsedTareas(prev => ({
            ...prev,
            [index]: !prev[index]
        }))
    }

    const togglePuzzleCollapsed = (index: number) => {
        setCollapsedPuzzles(prev => ({
            ...prev,
            [index]: !prev[index]
        }))
    }

    const handleSolicitarMasIntentosGamma = async () => {
        setIsRequestingGamma(true)
        try {
            const res = await fetch('/api/profesor/gamma/solicitar-intentos', { method: 'POST' })
            if (res.ok) {
                setProfile((prev: any) => ({ ...prev, solicitud_mas_intentos_gamma: true }))
            } else {
                const data = await res.json()
                alert(data.error || 'Error al solicitar más intentos')
            }
        } catch (error) {
            console.error(error)
            alert('Error de conexión')
        } finally {
            setIsRequestingGamma(false)
        }
    }
    const [historialMensaje, setHistorialMensaje] = useState('Se actualizaron datos generales del curso.')
    
    const router = useRouter()

    const [isSavingDraft, setIsSavingDraft] = useState(false)

    const guardarBorradorSilencioso = async () => {
        setIsSavingDraft(true);
        try {
            const borrador = {
                titulo: formData.titulo,
                descripcion: formData.descripcion,
                competencias: formData.competencias,
                beneficios: formData.beneficios,
                duracion: formData.duracion,
                precio: profile?.rol === 'capacitador' ? 0 : Number(formData.precio) * 1.16,
                instructor: formData.instructor,
                vigencia_anos: vigenciaAnos,
                requiere_pago_completo: requierePagoCompleto,
                reunion_url: formData.reunion_url?.trim() || null,
                nota_profesor: formData.nota_profesor?.trim() || null,
                categoria: formData.categoria,
                modalidad: formData.modalidad,
                limite_inscripcion: formData.modalidad === 'cerrada' && formData.limite_inscripcion ? formData.limite_inscripcion : null,
                bloquear_avance: bloquearAvance,
                requiere_tareas_avance: requiereTareasAvance,
                requiere_examen_avance: requiereExamenAvance,
                aplicar_iva: aplicarIva,
                mostrar_examen_final: mostrarExamenFinal,
                mostrar_constancia: mostrarConstancia,
                mostrar_calificacion_constancia: mostrarCalificacionConstancia,
                mostrar_revision_examen: mostrarRevisionExamen,
                logo_url: logoUrl,
                imagen_url: imagenUrl,
                mostrar_logo_constancia: mostrarLogoConstancia,
                plantilla_constancia: plantillaConstancia,
                modulos: modulos.map((m, idx) => ({
                    id: m.id,
                    titulo: m.titulo,
                    url_contenido: m.recursos.length > 0 ? m.recursos[0].url_contenido : '',
                    recursos: m.recursos.map((r: any) => ({
                        id: r.id,
                        titulo: r.titulo,
                        tipo: r.tipo,
                        url_contenido: r.url_contenido,
                        descargable: r.descargable
                    })),
                    orden: idx + 1,
                    requiereTarea: m.requiereTarea,
                    tareaInstrucciones: m.tareaInstrucciones,
                    tareaPuntos: m.tareaPuntos,
                    requierePuzzle: m.requierePuzzle,
                    puzzlePuntos: m.puzzlePuntos,
                    puzzleTipo: m.puzzleTipo,
                    puzzlePregunta: m.puzzlePregunta,
                    puzzleRespuesta: m.puzzleRespuesta,
                    puzzlePuzzles: m.puzzlePuzzles || [],
                    requiereCuestionario: m.requiereCuestionario,
                    cuestionarioPreguntas: m.cuestionarioPreguntas?.map((p: any, pIdx: number) => ({
                        id: p.id,
                        pregunta: p.pregunta,
                        orden: pIdx + 1
                    })),
                    examen: m.requiereExamen ? {
                        min_aprobacion: m.examenMinAprobacion,
                        tiempo_limite: m.conTiempo ? (m.tiempoExamen === '' || m.tiempoExamen === undefined ? 20 : m.tiempoExamen) : null,
                        seguridad_aumentada: m.seguridadAumentada || false,
                        max_cambios_pantalla: m.maxCambiosPantalla,
                        intentos_permitidos: m.intentosPermitidos === '' || m.intentosPermitidos === undefined ? 2 : m.intentosPermitidos,
                        preguntas: m.examenPreguntas.map((p, pIdx) => ({
                            id: p.id,
                            pregunta: p.pregunta,
                            opcion_a: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_a,
                            opcion_b: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_b,
                            opcion_c: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_c,
                            opcion_d: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_d,
                            respuesta_correcta: p.tipo_pregunta === 'respuesta_libre' ? 'A' : p.respuesta_correcta,
                            tipo_pregunta: p.tipo_pregunta || 'opcion_multiple',
                            orden: pIdx + 1
                        }))
                    } : null
                })),
                requiere_examen: requiereExamen,
                examen: requiereExamen ? {
                    min_aprobacion: minAprobacion === '' ? 80 : minAprobacion,
                    tiempo_limite: conTiempo ? (tiempoExamen === '' ? 60 : tiempoExamen) : null,
                    seguridad_aumentada: seguridadAumentada,
                    max_cambios_pantalla: seguridadAumentada ? (maxCambios === '' ? 3 : maxCambios) : 3,
                    intentos_permitidos: intentosPermitidos === '' ? 3 : intentosPermitidos,
                    preguntas: preguntasExtraidas.map((p, pIdx) => ({
                        id: p.id,
                        pregunta: p.pregunta,
                        opcion_a: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_a,
                        opcion_b: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_b,
                        opcion_c: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_c,
                        opcion_d: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_d,
                        respuesta_correcta: p.tipo_pregunta === 'respuesta_libre' ? 'A' : p.respuesta_correcta,
                        tipo_pregunta: p.tipo_pregunta || 'opcion_multiple',
                        orden: pIdx + 1
                    }))
                } : null
            };

            const { error: errorDraft } = await supabase
                .from('ie_cursos')
                .update({ cambios_pendientes: borrador })
                .eq('id', id);

            if (!errorDraft) {
                setTieneBorrador(true);
            } else {
                console.error('Error auto-guardando borrador silencioso:', errorDraft.message);
            }
        } catch (e) {
            console.error('Error in guardarBorradorSilencioso:', e);
        } finally {
            setIsSavingDraft(false);
        }
    }

    const handleTabChange = async (tab: 'info' | 'modulos' | 'examen' | 'avisos') => {
        await guardarBorradorSilencioso();
        setActiveTab(tab);
    }
    const supabase = createClient()

    useEffect(() => {
        const fetchCurso = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            // Validar perfil
            const resP = await fetch('/api/perfil')
            const resultP = await resP.json()
            const prof = resultP.data
            if (prof) {
                setProfile(prof)
                // Profile completeness check removed per user request
                // so they can upload/edit courses without waiting for identity validation.
            }

            // Cargar registro de generaciones de Gamma de este profesor
            const { data: gammaGens } = await supabase
                .from('ie_gamma_generations')
                .select('*')
                .eq('profile_id', user.id);
            if (gammaGens) {
                setGammaGenerations(gammaGens);
            }

            const { data: curso, error } = await supabase
                .from('ie_cursos')
                .select('*')
                .eq('id', id)
                .single()

            if (error || !curso) {
                setMensaje('No se encontró el curso.')
                setLoading(false)
                return
            }

            setEstadoActual(curso.estado)
            setRequierePagoCompleto(curso.requiere_pago_completo || false)
            setBloquearAvance(curso.bloquear_avance || false)
            setRequiereTareasAvance(curso.requiere_tareas_avance || false)
            setRequiereExamenAvance(curso.requiere_examen_avance || false)
            setAplicarIva(curso.aplicar_iva || false)

            // Cargar todos los exámenes de la DB por si acaso
            const { data: todosExm } = await supabase
                .from('ie_examenes')
                .select('*')
                .eq('curso_id', id);

            const examIds = todosExm?.map(e => e.id) || [];
            let todasPregs: any[] = [];
            if (examIds.length > 0) {
                const { data: pregs } = await supabase
                    .from('ie_preguntas')
                    .select('*')
                    .in('examen_id', examIds)
                    .order('orden', { ascending: true });
                if (pregs) todasPregs = pregs;
            }

            // Cargar definiciones de tareas y puzles
            const { data: todosTsk } = await supabase
                .from('ie_preguntas_respuestas')
                .select('*')
                .eq('curso_id', id)
                .or('pregunta.like.TAREA_DEFINICION:%,pregunta.like.PUZZLE_DEFINICION:%');

            const tasksMap: Record<string, any> = {}
            const puzzlesMap: Record<string, any> = {}
            todosTsk?.forEach(t => {
                const parts = t.pregunta.split('::')
                const header = parts[0]
                try {
                    const payload = JSON.parse(parts.slice(1).join('::'))
                    if (header.startsWith('TAREA_DEFINICION:')) {
                        const modId = header.replace('TAREA_DEFINICION:', '').replace('[', '').replace(']', '')
                        // Retrocompatibilidad: si la tarea vieja era de tipo puzzle, la mapeamos como puzle
                        if (payload.tipo === 'puzzle') {
                            puzzlesMap[modId] = {
                                puntos: payload.puntos || '',
                                puzzleTipo: payload.puzzleTipo || 'anagrama',
                                puzzlePregunta: payload.puzzlePregunta || '',
                                puzzleRespuesta: payload.puzzleRespuesta || '',
                                puzzles: payload.puzzles || []
                            }
                        } else {
                            tasksMap[modId] = payload
                        }
                    } else if (header.startsWith('PUZZLE_DEFINICION:')) {
                        const modId = header.replace('PUZZLE_DEFINICION:', '').replace('[', '').replace(']', '')
                        puzzlesMap[modId] = payload
                    }
                } catch (e) {
                    console.error('Error parsing task payload', e)
                }
            })

            // Si tiene cambios pendientes (sea aprobado o no), cargamos del borrador
            if (curso.cambios_pendientes) {
                const borrador = curso.cambios_pendientes;
                setTieneBorrador(true)
                setFormData({
                    titulo: borrador.titulo || curso.titulo,
                    descripcion: borrador.descripcion || curso.descripcion,
                    competencias: borrador.competencias || curso.competencias || '',
                    beneficios: borrador.beneficios || curso.beneficios,
                    duracion: borrador.duracion || curso.duracion,
                    precio: (borrador.precio || curso.precio) ? Number((borrador.precio || curso.precio).toFixed(2)) : 0,
                    instructor: borrador.instructor || curso.instructor,
                    reunion_url: borrador.reunion_url || curso.reunion_url || '',
                    nota_profesor: borrador.nota_profesor || curso.nota_profesor || '',
                    categoria: borrador.categoria || curso.categoria || 'desarrollo',
                    modalidad: borrador.modalidad || curso.modalidad || 'abierta',
                    limite_inscripcion: borrador.limite_inscripcion || (curso.limite_inscripcion ? new Date(curso.limite_inscripcion).toISOString().split('T')[0] : '') || '',
                })
                setVigenciaAnos(borrador.vigencia_anos || curso.vigencia_anos || 3)
                setRequiereExamen(borrador.requiere_examen !== undefined ? borrador.requiere_examen : (curso.requiere_examen || false))
                setBloquearAvance(borrador.bloquear_avance !== undefined ? borrador.bloquear_avance : (curso.bloquear_avance || false))
                setRequiereTareasAvance(borrador.requiere_tareas_avance !== undefined ? borrador.requiere_tareas_avance : (curso.requiere_tareas_avance || false))
                setRequiereExamenAvance(borrador.requiere_examen_avance !== undefined ? borrador.requiere_examen_avance : (curso.requiere_examen_avance || false))
                setMostrarExamenFinal(borrador.mostrar_examen_final !== undefined ? borrador.mostrar_examen_final : (curso.mostrar_examen_final !== undefined ? curso.mostrar_examen_final : true))
                setMostrarConstancia(borrador.mostrar_constancia !== undefined ? borrador.mostrar_constancia : (curso.mostrar_constancia !== undefined ? curso.mostrar_constancia : true))
                setMostrarCalificacionConstancia(borrador.mostrar_calificacion_constancia !== undefined ? borrador.mostrar_calificacion_constancia : (curso.mostrar_calificacion_constancia !== undefined ? curso.mostrar_calificacion_constancia : true))
                setMostrarRevisionExamen(borrador.mostrar_revision_examen !== undefined ? borrador.mostrar_revision_examen : (curso.mostrar_revision_examen !== undefined ? curso.mostrar_revision_examen : false))
                setPorcentajeProfesor(
                    borrador.porcentaje_profesor !== undefined && borrador.porcentaje_profesor !== null
                        ? borrador.porcentaje_profesor
                        : (curso.porcentaje_profesor !== undefined && curso.porcentaje_profesor !== null
                            ? curso.porcentaje_profesor
                            : 60)
                )
                
                const lUrl = borrador.logo_url !== undefined ? borrador.logo_url : curso.logo_url;
                setLogoUrl(lUrl)
                setLogoPreviewUrl(lUrl)
                const imgUrl = (borrador as any).imagen_url !== undefined ? (borrador as any).imagen_url : (curso as any).imagen_url;
                setImagenUrl(imgUrl)
                setImagenPreviewUrl(imgUrl)
                setMostrarLogoConstancia(borrador.mostrar_logo_constancia !== undefined ? borrador.mostrar_logo_constancia : (curso.mostrar_logo_constancia !== undefined ? curso.mostrar_logo_constancia : false))
                setPlantillaConstancia('modelo1')
                
                if (borrador.modulos) {
                    setModulos(borrador.modulos.map((m: any) => {
                        const recursos: Recurso[] = [];
                        if (m.recursos && Array.isArray(m.recursos)) {
                            m.recursos.forEach((r: any) => {
                                recursos.push({
                                    id: r.id,
                                    titulo: r.titulo || 'Material del Módulo',
                                    tipo: r.tipo || 'video',
                                    url_contenido: r.url_contenido || '',
                                    archivoPdf: null,
                                    descargable: r.descargable !== undefined ? !!r.descargable : false,
                                    isPersisted: true
                                });
                            });
                        } else if (m.url_contenido) {
                            const ext = m.url_contenido.split('.').pop()?.toLowerCase() || '';
                            const tipo = m.tipo || (ext === 'ppt' || ext === 'pptx' ? 'ppt' :
                                         ext === 'pdf' ? 'pdf' : 
                                         ext === 'html' || ext === 'htm' ? 'html' : 'video');
                            recursos.push({
                                titulo: 'Material del Módulo',
                                tipo,
                                url_contenido: m.url_contenido,
                                archivoPdf: null,
                                isPersisted: true
                            });
                        }

                         const taskDef = tasksMap[m.id];
                         const puzzleDef = puzzlesMap[m.id];
                         return {
                             id: m.id,
                             titulo: m.titulo,
                             recursos,
                             requiereExamen: !!m.examen,
                             examenMinAprobacion: m.examen?.min_aprobacion || 80,
                             seguridadAumentada: m.examen?.seguridad_aumentada || false,
                             maxCambiosPantalla: m.examen?.max_cambios_pantalla || 2,
                             conTiempo: !!m.examen?.tiempo_limite,
                             tiempoExamen: m.examen?.tiempo_limite || 20,
                             intentosPermitidos: m.examen?.intentos_permitidos || 2,
                             examenPreguntas: (m.examen?.preguntas || []).map((p: any) => ({
                                 id: p.id,
                                 pregunta: p.pregunta,
                                 opcion_a: p.opcion_a,
                                 opcion_b: p.opcion_b,
                                 opcion_c: p.opcion_c,
                                 opcion_d: p.opcion_d,
                                 respuesta_correcta: p.respuesta_correcta,
                                 tipo_pregunta: p.tipo_pregunta || 'opcion_multiple'
                             })),
                             // Tarea Convencional
                             requiereTarea: m.requiereTarea !== undefined ? m.requiereTarea : (!!taskDef || (m.requiereTarea && m.tareaTipo !== 'puzzle')),
                             tareaInstrucciones: m.tareaInstrucciones || taskDef?.instrucciones || (m.tareaTipo !== 'puzzle' ? m.tareaInstrucciones : '') || '',
                             tareaPuntos: m.tareaPuntos || taskDef?.puntos || (m.tareaTipo !== 'puzzle' ? m.tareaPuntos : '') || '',
                             
                             // Puzle (Juego Interactivo)
                             requierePuzzle: m.requierePuzzle !== undefined ? m.requierePuzzle : (!!puzzleDef || (m.requiereTarea && m.tareaTipo === 'puzzle') || !!m.requierePuzzle),
                             puzzlePuntos: m.puzzlePuntos || puzzleDef?.puntos || (m.tareaTipo === 'puzzle' ? m.tareaPuntos : '') || m.puzzlePuntos || '',
                             puzzleTipo: m.puzzleTipo || puzzleDef?.puzzleTipo || m.tareaPuzzleTipo || m.puzzleTipo || 'anagrama',
                             puzzlePregunta: m.puzzlePregunta || puzzleDef?.puzzlePregunta || m.tareaPuzzlePregunta || m.puzzlePregunta || '',
                             puzzleRespuesta: m.puzzleRespuesta || puzzleDef?.puzzleRespuesta || m.tareaPuzzleRespuesta || m.puzzleRespuesta || '',
                             puzzlePuzzles: (m.puzzlePuzzles || puzzleDef?.puzzles || m.tareaPuzzles || (
                                 (m.puzzlePregunta || puzzleDef?.puzzlePregunta || m.tareaPuzzlePregunta) ? [
                                     {
                                         pregunta: m.puzzlePregunta || puzzleDef?.puzzlePregunta || m.tareaPuzzlePregunta || '',
                                         respuesta: m.puzzleRespuesta || puzzleDef?.puzzleRespuesta || m.tareaPuzzleRespuesta || '',
                                         tipo: m.puzzleTipo || puzzleDef?.puzzleTipo || m.tareaPuzzleTipo || 'anagrama'
                                     }
                                 ] : [{ pregunta: '', respuesta: '', tipo: 'anagrama' }]
                             )).map((p: any) => ({
                                 pregunta: p.pregunta || '',
                                 respuesta: p.respuesta || '',
                                 tipo: p.tipo || m.puzzleTipo || puzzleDef?.puzzleTipo || m.tareaPuzzleTipo || 'anagrama'
                             })),
                            requiereCuestionario: m.requiereCuestionario || false,
                            cuestionarioPreguntas: m.cuestionarioPreguntas || []
                        }
                    }))
                }
                
                if (borrador.examen) {
                    setMinAprobacion(borrador.examen.min_aprobacion);
                    if (borrador.examen.tiempo_limite) {
                        setConTiempo(true);
                        setTiempoExamen(borrador.examen.tiempo_limite);
                    }
                    setSeguridadAumentada(borrador.examen.seguridad_aumentada || false);
                    setMaxCambios(borrador.examen.max_cambios_pantalla || 3);
                    setIntentosPermitidos(borrador.examen.intentos_permitidos || 3);
                    setPreguntasExtraidas((borrador.examen.preguntas || []).map((p: any) => ({
                        id: p.id,
                        pregunta: p.pregunta,
                        opcion_a: p.opcion_a,
                        opcion_b: p.opcion_b,
                        opcion_c: p.opcion_c,
                        opcion_d: p.opcion_d,
                        respuesta_correcta: p.respuesta_correcta,
                        tipo_pregunta: p.tipo_pregunta || 'opcion_multiple'
                    })));
                } else {
                    const exmFinalOriginal = todosExm?.find(e => !e.modulo_id);
                    if (exmFinalOriginal) {
                        setMinAprobacion(exmFinalOriginal.min_aprobacion);
                        if (exmFinalOriginal.tiempo_limite) {
                            setConTiempo(true);
                            setTiempoExamen(exmFinalOriginal.tiempo_limite);
                        }
                        setSeguridadAumentada(exmFinalOriginal.seguridad_aumentada || false);
                        setMaxCambios(exmFinalOriginal.max_cambios_pantalla || 3);
                        setIntentosPermitidos(exmFinalOriginal.intentos_permitidos || 3);
                        
                        const pregsFinal = todasPregs.filter(p => p.examen_id === exmFinalOriginal.id);
                        setPreguntasExtraidas(pregsFinal.map(p => ({
                            id: p.id,
                            pregunta: p.pregunta,
                            opcion_a: p.opcion_a,
                            opcion_b: p.opcion_b,
                            opcion_c: p.opcion_c,
                            opcion_d: p.opcion_d,
                            respuesta_correcta: p.respuesta_correcta,
                            tipo_pregunta: p.tipo_pregunta || 'opcion_multiple'
                        })));
                    }
                }

                setLoading(false)
                return
            }

            // Si NO tiene cambios pendientes cargamos directo de la base de datos original
            setFormData({
                titulo: curso.titulo,
                descripcion: curso.descripcion,
                competencias: curso.competencias || '',
                beneficios: curso.beneficios,
                duracion: curso.duracion,
                precio: curso.precio ? Number(curso.precio.toFixed(2)) : 0,
                instructor: curso.instructor,
                reunion_url: curso.reunion_url || '',
                nota_profesor: curso.nota_profesor || '',
                categoria: curso.categoria || 'desarrollo',
                modalidad: curso.modalidad || 'abierta',
                limite_inscripcion: curso.limite_inscripcion ? new Date(curso.limite_inscripcion).toISOString().split('T')[0] : '',
            })
            setVigenciaAnos(curso.vigencia_anos || 3)
            setRequiereExamen(curso.requiere_examen || false)
            setBloquearAvance(curso.bloquear_avance || false)
            setRequiereTareasAvance(curso.requiere_tareas_avance || false)
            setRequiereExamenAvance(curso.requiere_examen_avance || false)
            setMostrarExamenFinal(curso.mostrar_examen_final !== undefined ? curso.mostrar_examen_final : true)
            setMostrarConstancia(curso.mostrar_constancia !== undefined ? curso.mostrar_constancia : true)
            setMostrarCalificacionConstancia(curso.mostrar_calificacion_constancia !== undefined ? curso.mostrar_calificacion_constancia : true)
            setMostrarRevisionExamen(curso.mostrar_revision_examen !== undefined ? curso.mostrar_revision_examen : false)
            setPorcentajeProfesor(curso.porcentaje_profesor !== null && curso.porcentaje_profesor !== undefined ? curso.porcentaje_profesor : 60)
            setLogoUrl(curso.logo_url)
            setLogoPreviewUrl(curso.logo_url)
            setImagenUrl((curso as any).imagen_url)
            setImagenPreviewUrl((curso as any).imagen_url)
            setMostrarLogoConstancia(curso.mostrar_logo_constancia !== undefined ? curso.mostrar_logo_constancia : false)
            setPlantillaConstancia('modelo1')

            // Módulos
            const { data: mods } = await supabase
                .from('ie_curso_modulos')
                .select('*')
                .eq('curso_id', id)
                .order('orden', { ascending: true })

            const modIds = mods?.map(m => m.id) || [];
            let todosRecursos: any[] = [];
            if (modIds.length > 0) {
                const { data: recs } = await supabase
                    .from('ie_modulo_recursos')
                    .select('*')
                    .in('modulo_id', modIds)
                    .order('orden', { ascending: true });
                if (recs) todosRecursos = recs;
            }

            let todosCuestionarios: any[] = [];
            if (modIds.length > 0) {
                const { data: cuestData } = await supabase
                    .from('ie_cuestionario_preguntas')
                    .select('*')
                    .in('modulo_id', modIds)
                    .order('orden', { ascending: true });
                if (cuestData) todosCuestionarios = cuestData;
            }

            if (mods) {
                setModulos(mods.map(m => {
                    const exmMod = todosExm?.find(e => e.modulo_id === m.id);
                    const pregsMod = exmMod ? todasPregs.filter(p => p.examen_id === exmMod.id) : [];
                    
                    const recursosDeModulo = todosRecursos.filter(r => r.modulo_id === m.id);
                    let recursos: Recurso[] = recursosDeModulo.map(r => {
                        const ext = r.url_contenido ? r.url_contenido.split('.').pop()?.split('?')[0].toLowerCase() : '';
                        const tipo: 'video' | 'pdf' | 'html' | 'ppt' = 
                            ext === 'ppt' || ext === 'pptx' ? 'ppt' :
                            ext === 'pdf' ? 'pdf' : 
                            ext === 'html' || ext === 'htm' ? 'html' : 'video';
                        return {
                            id: r.id,
                            titulo: r.titulo,
                            tipo,
                            url_contenido: r.url_contenido,
                            archivoPdf: null,
                            descargable: !!r.descargable,
                            isPersisted: true
                        };
                    });

                    // Fallback para cursos anteriores
                    if (recursos.length === 0 && m.url_contenido) {
                        const ext = m.url_contenido.split('.').pop()?.toLowerCase() || '';
                        const tipo = ext === 'ppt' || ext === 'pptx' ? 'ppt' :
                                     ext === 'pdf' ? 'pdf' : 
                                     ext === 'html' || ext === 'htm' ? 'html' : 'video';
                        recursos.push({
                            titulo: 'Material del Módulo',
                            tipo,
                            url_contenido: m.url_contenido,
                            archivoPdf: null,
                            descargable: false,
                            isPersisted: true
                        });
                    }

                    const taskDef = tasksMap[m.id];
                    const puzzleDef = puzzlesMap[m.id];
                    const cuestionarioPreguntas = todosCuestionarios.filter(q => q.modulo_id === m.id);
                    return {
                        id: m.id,
                        titulo: m.titulo,
                        recursos,
                        requiereExamen: !!exmMod,
                        examenMinAprobacion: exmMod?.min_aprobacion || 80,
                        seguridadAumentada: exmMod?.seguridad_aumentada || false,
                        maxCambiosPantalla: exmMod?.max_cambios_pantalla || 2,
                        conTiempo: !!exmMod?.tiempo_limite,
                        tiempoExamen: exmMod?.tiempo_limite || 20,
                        intentosPermitidos: exmMod?.intentos_permitidos || 2,
                        examenPreguntas: pregsMod.map(p => ({
                            id: p.id,
                            pregunta: p.pregunta,
                            opcion_a: p.opcion_a,
                            opcion_b: p.opcion_b,
                            opcion_c: p.opcion_c,
                            opcion_d: p.opcion_d,
                            respuesta_correcta: p.respuesta_correcta,
                            tipo_pregunta: p.tipo_pregunta || 'opcion_multiple'
                        })),
                        // Tarea Convencional
                        requiereTarea: !!taskDef,
                        tareaInstrucciones: taskDef?.instrucciones || '',
                        tareaPuntos: taskDef?.puntos || '',
                        
                        // Puzle (Juego Interactivo)
                        requierePuzzle: !!puzzleDef,
                        puzzlePuntos: puzzleDef?.puntos || '',
                        puzzleTipo: puzzleDef?.puzzleTipo || 'anagrama',
                        puzzlePregunta: puzzleDef?.puzzlePregunta || '',
                        puzzleRespuesta: puzzleDef?.puzzleRespuesta || '',
                        puzzlePuzzles: (puzzleDef?.puzzles || (
                            puzzleDef?.puzzlePregunta ? [
                                {
                                    pregunta: puzzleDef.puzzlePregunta || '',
                                    respuesta: puzzleDef.puzzleRespuesta || '',
                                    tipo: puzzleDef.puzzleTipo || 'anagrama'
                                }
                            ] : [{ pregunta: '', respuesta: '', tipo: 'anagrama' }]
                        )).map((p: any) => ({
                            pregunta: p.pregunta || '',
                            respuesta: p.respuesta || '',
                            tipo: p.tipo || puzzleDef?.puzzleTipo || 'anagrama'
                        })),
                        requiereCuestionario: cuestionarioPreguntas.length > 0,
                        cuestionarioPreguntas: cuestionarioPreguntas.map(p => ({
                            id: p.id,
                            pregunta: p.pregunta,
                            orden: p.orden
                        }))
                    }
                }))
            }

            // Examen Final
            const exmFinalOriginal = todosExm?.find(e => !e.modulo_id);
            if (exmFinalOriginal) {
                setMinAprobacion(exmFinalOriginal.min_aprobacion);
                if (exmFinalOriginal.tiempo_limite) {
                    setConTiempo(true);
                    setTiempoExamen(exmFinalOriginal.tiempo_limite);
                }
                setSeguridadAumentada(exmFinalOriginal.seguridad_aumentada || false);
                setMaxCambios(exmFinalOriginal.max_cambios_pantalla || 3);
                setIntentosPermitidos(exmFinalOriginal.intentos_permitidos || 3);
                
                const pregsFinal = todasPregs.filter(p => p.examen_id === exmFinalOriginal.id);
                setPreguntasExtraidas(pregsFinal.map(p => ({
                    id: p.id,
                    pregunta: p.pregunta,
                    opcion_a: p.opcion_a,
                    opcion_b: p.opcion_b,
                    opcion_c: p.opcion_c,
                    opcion_d: p.opcion_d,
                    respuesta_correcta: p.respuesta_correcta,
                    tipo_pregunta: p.tipo_pregunta || 'opcion_multiple'
                })));
            }
            
            setLoading(false)
        }
        fetchCurso()
    }, [id, router, supabase])

    const handleAgregarModulo = () => {
        setModulos([...modulos, {
            titulo: '',
            recursos: [],
            requiereExamen: false,
            examenMinAprobacion: 80,
            examenPreguntas: [],
            seguridadAumentada: false,
            maxCambiosPantalla: 3
        }])
    }

    const handleEliminarModulo = async (index: number) => {
        const moduloAEliminar = modulos[index];
        if (moduloAEliminar.id) {
            const estadoModulo = await moduloTieneExamenContestado(id, moduloAEliminar.id)
            if (estadoModulo.error) {
                setModalMessage({
                    title: 'No se pudo validar el módulo',
                    content: 'Error validando exámenes contestados: ' + estadoModulo.error,
                    type: 'error'
                })
                return
            }
            if (estadoModulo.tieneResultados) {
                setModalMessage({
                    title: 'Módulo protegido',
                    content: 'No puedes eliminar este módulo porque ya tiene alumnos con examen modular contestado.',
                    type: 'error'
                })
                return
            }

            const confirmar = window.confirm("¿Seguro que deseas borrar este módulo de la base de datos de manera permanente? Esta acción no se puede deshacer y borrará también el examen modular si lo tiene.");
            if (!confirmar) return;

            if (estadoActual !== 'aprobado' && !tieneBorrador) {
                await supabase.from('ie_curso_modulos').delete().eq('id', moduloAEliminar.id);
            }
        }
        setModulos(modulos.filter((_, i) => i !== index))
    }

    const handleModuloChange = (index: number, field: keyof Modulo, value: any) => {
        setModulos(prev => {
            const nuevosModulos = [...prev]
            nuevosModulos[index] = { ...nuevosModulos[index], [field]: value }
            return nuevosModulos
        })
    }

    const handleMoverModulo = (index: number, direccion: 'subir' | 'bajar') => {
        const nuevosModulos = [...modulos]
        if (direccion === 'subir' && index > 0) {
            const temp = nuevosModulos[index]
            nuevosModulos[index] = nuevosModulos[index - 1]
            nuevosModulos[index - 1] = temp
        } else if (direccion === 'bajar' && index < nuevosModulos.length - 1) {
            const temp = nuevosModulos[index]
            nuevosModulos[index] = nuevosModulos[index + 1]
            nuevosModulos[index + 1] = temp
        }
        setModulos(nuevosModulos)
    }

    // Gamma Helper functions
    const getUnusedGenerationsForModule = (moduloIdx: number) => {
        const modulo = modulos[moduloIdx];
        return gammaGenerations.filter(gen => {
            const isUsedInModule = modulo.recursos.some(r => r.url_contenido === gen.export_url);
            const belongsToThisCourse = gen.curso_id === id;
            const isHidden = hiddenGenerations.includes(gen.id);
            return gen.descargado && !isUsedInModule && !gen.utilizado && belongsToThisCourse && !isHidden;
        });
    }

    const handleMarcarGammaUtilizado = async (genId: string) => {
        setGammaGenerations(prev => prev.map(g => g.id === genId ? { ...g, utilizado: true } : g));
        await supabase.from('ie_gamma_generations').update({ utilizado: true }).eq('id', genId);
    }

    const handleRegistrarGammaDescarga = async (genId: string) => {
        setGammaGenerations(prev => prev.map(g => g.id === genId ? { ...g, descargado: true } : g));
        await fetch('/api/profesor/gamma/descarga', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ generationId: genId })
        });
    }

    const handleGenerarGamma = async (e: React.FormEvent) => {
        e.preventDefault();
        if (activeGammaModuloIdx === null) return;
        setIsGeneratingGamma(true);
        setGammaError('');
        setGammaSuccessResult(null);

        try {
            const res = await fetch('/api/profesor/gamma/generar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: gammaPrompt,
                    numSlides: gammaNumSlides,
                    formato: gammaFormato,
                    idioma: gammaIdioma,
                    tema: gammaTema,
                    cursoId: id,
                    moduloId: modulos[activeGammaModuloIdx]?.id || null
                })
            });

            const data = await res.json();
            if (!res.ok) {
                setGammaError(data.error || 'Error al generar la presentación.');
                setIsGeneratingGamma(false);
                return;
            }
const generationId = data.generationId;
            if (!generationId) {
                setGammaError('No se recibió un ID de generación válido.');
                setIsGeneratingGamma(false);
                return;
            }

            const pollStatus = async () => {
                try {
                    const statusRes = await fetch(
                        `/api/profesor/gamma/status?generationId=${generationId}&prompt=${encodeURIComponent(gammaPrompt)}&titulo=${encodeURIComponent(gammaTitleInput.trim())}&numSlides=${gammaNumSlides}&formato=${gammaFormato}&cursoId=${id}&moduloId=${modulos[activeGammaModuloIdx]?.id || 'null'}`
                    );
                    if (!statusRes.ok) {
                        setGammaError('Error al consultar el estado de la generación.');
                        setIsGeneratingGamma(false);
                        return;
                    }

                    const statusData = await statusRes.json();
                    if (statusData.status === 'failed') {
                        setGammaError('La generación falló en los servidores de Gamma.');
                        setIsGeneratingGamma(false);
                        return;
                    }

                    if (statusData.status === 'completed') {
                        setGammaSuccessResult({
                            id: statusData.id,
                            gammaUrl: statusData.gammaUrl,
                            exportUrl: statusData.exportUrl,
                            creditsUsed: statusData.creditsUsed
                        });

                        const { data: { user: authUser } } = await supabase.auth.getUser();
                        const userId = authUser?.id || profile?.id;
                        
                        const newGen = {
                            id: statusData.id || generationId,
                            prompt: gammaPrompt,
                            titulo: gammaTitleInput.trim() || `Presentación: ${gammaPrompt.substring(0, 40)}...`,
                            num_slides: gammaNumSlides,
                            formato: gammaFormato,
                            gamma_url: statusData.gammaUrl,
                            export_url: statusData.exportUrl,
                            credits_used: Number(statusData.creditsUsed) || (gammaNumSlides * 4),
                            descargado: false,
                            utilizado: false,
                            curso_id: id,
                            profile_id: userId
                        };

                        setGammaGenerations(prev => {
                            if (prev.some(g => g.id === newGen.id || g.export_url === newGen.export_url)) {
                                return prev;
                            }
                            return [...prev, newGen];
                        });

                        setIsGeneratingGamma(false);
                        return;
                    }

                    // Sigue generando, reintentar en 5 segundos
                    setTimeout(pollStatus, 5000);
                } catch (err: any) {
                    setGammaError(err.message || 'Error de conexión durante el monitoreo.');
                    setIsGeneratingGamma(false);
                }
            };

            // Iniciar primer chequeo a los 3 segundos
            setTimeout(pollStatus, 3000);

        } catch (err: any) {
            setGammaError(err.message || 'Error de conexión.');
            setIsGeneratingGamma(false);
        }
    }

    // Modular resources helpers
    const handleAgregarRecurso = (moduloIdx: number) => {
        const nuevosModulos = [...modulos]
        nuevosModulos[moduloIdx].recursos.push({
            titulo: '',
            tipo: 'video',
            url_contenido: '',
            archivoPdf: null,
            descargable: false
        })
        setModulos(nuevosModulos)
    }

    const handleEliminarRecurso = (moduloIdx: number, recursoIdx: number) => {
        const nuevosModulos = [...modulos]
        nuevosModulos[moduloIdx].recursos = nuevosModulos[moduloIdx].recursos.filter((_, i) => i !== recursoIdx)
        setModulos(nuevosModulos)
    }

    const handleRecursoChange = (moduloIdx: number, recursoIdx: number, field: keyof Recurso, value: any) => {
        const nuevosModulos = [...modulos]
        nuevosModulos[moduloIdx].recursos[recursoIdx] = {
            ...nuevosModulos[moduloIdx].recursos[recursoIdx],
            [field]: value
        }
        if (field === 'tipo') {
            if (value === 'video') nuevosModulos[moduloIdx].recursos[recursoIdx].archivoPdf = null
            if (value === 'pdf' || value === 'html' || value === 'ppt') nuevosModulos[moduloIdx].recursos[recursoIdx].url_contenido = ''
        }
        setModulos(nuevosModulos)
    }

    const handleMoverRecurso = (moduloIdx: number, recursoIdx: number, direccion: 'subir' | 'bajar') => {
        const nuevosModulos = [...modulos]
        const recursos = [...nuevosModulos[moduloIdx].recursos]
        if (direccion === 'subir' && recursoIdx > 0) {
            const temp = recursos[recursoIdx]
            recursos[recursoIdx] = recursos[recursoIdx - 1]
            recursos[recursoIdx - 1] = temp
        } else if (direccion === 'bajar' && recursoIdx < recursos.length - 1) {
            const temp = recursos[recursoIdx]
            recursos[recursoIdx] = recursos[recursoIdx + 1]
            recursos[recursoIdx + 1] = temp
        }
        nuevosModulos[moduloIdx].recursos = recursos
        setModulos(nuevosModulos)
    }

    // Cuestionarios helpers
    const handleAgregarPreguntaCuestionario = (moduloIdx: number) => {
        const nuevosModulos = [...modulos]
        if (!nuevosModulos[moduloIdx].cuestionarioPreguntas) {
            nuevosModulos[moduloIdx].cuestionarioPreguntas = []
        }
        nuevosModulos[moduloIdx].cuestionarioPreguntas.push({
            pregunta: ''
        })
        setModulos(nuevosModulos)
    }

    const handleEliminarPreguntaCuestionario = (moduloIdx: number, preguntaIdx: number) => {
        const nuevosModulos = [...modulos]
        nuevosModulos[moduloIdx].cuestionarioPreguntas = nuevosModulos[moduloIdx].cuestionarioPreguntas?.filter((_, i) => i !== preguntaIdx) || []
        setModulos(nuevosModulos)
    }

    const handlePreguntaCuestionarioChange = (moduloIdx: number, preguntaIdx: number, value: string) => {
        const nuevosModulos = [...modulos]
        if (nuevosModulos[moduloIdx].cuestionarioPreguntas && nuevosModulos[moduloIdx].cuestionarioPreguntas![preguntaIdx]) {
            nuevosModulos[moduloIdx].cuestionarioPreguntas![preguntaIdx].pregunta = value
        }
        setModulos(nuevosModulos)
    }

    // Modular exams helpers
    const handleAgregarPreguntaModulo = (moduloIdx: number) => {
        const nuevosModulos = [...modulos]
        nuevosModulos[moduloIdx].examenPreguntas.push({
            pregunta: '',
            opcion_a: '',
            opcion_b: '',
            opcion_c: '',
            opcion_d: '',
            respuesta_correcta: 'A',
            tipo_pregunta: 'opcion_multiple'
        })
        setModulos(nuevosModulos)
    }

    const handleEliminarPreguntaModulo = (moduloIdx: number, preguntaIdx: number) => {
        const nuevosModulos = [...modulos]
        nuevosModulos[moduloIdx].examenPreguntas = nuevosModulos[moduloIdx].examenPreguntas.filter((_, i) => i !== preguntaIdx)
        setModulos(nuevosModulos)
    }

    const handlePreguntaModuloChange = (moduloIdx: number, preguntaIdx: number, field: keyof PreguntaParsed, value: string) => {
        const nuevosModulos = [...modulos]
        nuevosModulos[moduloIdx].examenPreguntas[preguntaIdx] = {
            ...nuevosModulos[moduloIdx].examenPreguntas[preguntaIdx],
            [field]: value
        }
        setModulos(nuevosModulos)
    }

    const handleUploadExamenModuloHelper = async (e: React.ChangeEvent<HTMLInputElement>, moduloIdx: number) => {
        const file = e.target.files?.[0] || null;
        setMensaje('');

        if (file) {
            setIsParsing(true);
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('/api/parse-exam', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();

                if (response.ok && data.questions) {
                    const nuevosModulos = [...modulos]
                    nuevosModulos[moduloIdx].examenPreguntas = [
                        ...nuevosModulos[moduloIdx].examenPreguntas,
                        ...data.questions
                    ]
                    setModulos(nuevosModulos)
                    setMensaje(`¡Examen analizado! Se detectaron ${data.questions.length} preguntas adicionales para este módulo.`);
                } else {
                    setMensaje('Error leyendo el PDF del examen: ' + (data.error || 'Formato no válido.'));
                }
            } catch (err) {
                setMensaje('Error de conexión al leer el PDF.');
            } finally {
                setIsParsing(false);
            }
        }
    }

    // Final exam helpers
    const handleUploadExamenHelper = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setArchivoExamen(file);
        setMensaje('');

        if (file) {
            setIsParsing(true);
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('/api/parse-exam', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();

                if (response.ok && data.questions) {
                    setPreguntasExtraidas(prev => [...prev, ...data.questions]);
                    setMensaje(`¡Examen analizado! Se detectaron ${data.questions.length} preguntas adicionales.`);
                } else {
                    setMensaje('Error leyendo el PDF del examen: ' + (data.error || 'Formato no válido.'));
                }
            } catch (err) {
                setMensaje('Error de conexión al leer el PDF.');
            } finally {
                setIsParsing(false);
            }
        }
    }

    const handleAgregarPreguntaManual = () => {
        setPreguntasExtraidas([...preguntasExtraidas, {
            pregunta: '',
            opcion_a: '',
            opcion_b: '',
            opcion_c: '',
            opcion_d: '',
            respuesta_correcta: 'A',
            tipo_pregunta: 'opcion_multiple'
        }]);
    }

    const handleEliminarPreguntaManual = (index: number) => {
        setPreguntasExtraidas(preguntasExtraidas.filter((_, i) => i !== index));
    }

    const handlePreguntaChange = (index: number, field: keyof PreguntaParsed, value: string) => {
        const nuevas = [...preguntasExtraidas];
        nuevas[index] = { ...nuevas[index], [field]: value };
        setPreguntasExtraidas(nuevas);
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await guardarCurso(false)
    }

    const guardarCurso = async (esBorrador: boolean) => {
        setSaving(true)
        setMensaje('')

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setSaving(false)
            return
        }

        // Validate general course fields
        const precioCurso = Number(formData.precio) || 0;
        if (precioCurso > 0 && precioCurso < 199) {
            setModalMessage({
                title: 'Precio Inválido',
                content: 'El precio del curso debe ser exactamente de $0.00 MXN (gratuito) o mayor o igual a $199.00 MXN.',
                type: 'error'
            });
            setSaving(false);
            return;
        }

        if (!formData.titulo?.trim()) {
            setModalMessage({
                title: 'Faltan Campos',
                content: 'Error: Por favor escribe el título del curso.',
                type: 'error'
            });
            setSaving(false)
            return
        }

        if (!esBorrador) {
            if (!formData.descripcion?.trim()) {
                setModalMessage({
                    title: 'Faltan Campos',
                    content: 'Error: Por favor escribe la descripción del curso.',
                    type: 'error'
                });
                setSaving(false)
                return
            }
            if (!formData.competencias?.trim()) {
                setModalMessage({
                    title: 'Faltan Campos',
                    content: 'Error: Por favor escribe las competencias del curso.',
                    type: 'error'
                });
                setSaving(false)
                return
            }
            if (!formData.beneficios?.trim()) {
                setModalMessage({
                    title: 'Faltan Campos',
                    content: 'Error: Por favor especifica los beneficios del curso.',
                    type: 'error'
                });
                setSaving(false)
                return
            }
            if (!formData.duracion?.trim()) {
                setModalMessage({
                    title: 'Faltan Campos',
                    content: 'Error: Por favor especifica la duración del curso.',
                    type: 'error'
                });
                setSaving(false)
                return
            }

            // Validaciones
            if (modulos.length === 0) {
                setModalMessage({
                    title: 'Faltan Módulos',
                    content: 'Error: Agrega al menos un módulo al curso.',
                    type: 'error'
                });
                setSaving(false)
                return
            }

            for (let i = 0; i < modulos.length; i++) {
                const m = modulos[i];
                if (!m.titulo) {
                    setModalMessage({
                        title: 'Faltan Campos',
                        content: `Error: Por favor especifica el título del módulo ${i + 1}.`,
                        type: 'error'
                    });
                    setSaving(false)
                    return
                }

                // Check resources
                for (let rIdx = 0; rIdx < m.recursos.length; rIdx++) {
                    const rec = m.recursos[rIdx];
                    if (!rec.titulo) {
                        setModalMessage({
                            title: 'Título de Recurso Obligatorio',
                            content: `Error: Por favor escribe un título para el recurso ${rIdx + 1} del módulo "${m.titulo}".`,
                            type: 'error'
                        });
                        setSaving(false)
                        return
                    }
                    if (rec.tipo === 'video' && !rec.url_contenido) {
                        setModalMessage({
                            title: 'Enlace Obligatorio',
                            content: `Error: Por favor escribe el enlace de video para el recurso "${rec.titulo}" del módulo "${m.titulo}".`,
                            type: 'error'
                        });
                        setSaving(false)
                        return
                    }
                    if (rec.tipo !== 'video' && !rec.url_contenido && !rec.archivoPdf) {
                        setModalMessage({
                            title: 'Archivo Obligatorio',
                            content: `Error: Por favor sube un archivo (PDF/PPT/HTML) para el recurso "${rec.titulo}" del módulo "${m.titulo}".`,
                            type: 'error'
                        });
                        setSaving(false)
                        return
                    }
                }

                // If module requires exam, validate questions
                if (m.requiereExamen) {
                    if (m.examenPreguntas.length === 0) {
                        setModalMessage({
                            title: 'Examen Vacío',
                            content: `Error: El módulo "${m.titulo}" requiere examen pero no tiene preguntas.`,
                            type: 'error'
                        });
                        setSaving(false)
                        return
                    }
                    const tieneOpcionMultiple = m.examenPreguntas.some(p => p.tipo_pregunta !== 'respuesta_libre');
                    if (!tieneOpcionMultiple) {
                        setModalMessage({
                            title: 'Falta Pregunta de Opción Múltiple',
                            content: `Error: El examen del módulo "${m.titulo}" debe tener al menos una pregunta de opción múltiple para calificarlo de forma automatizada.`,
                            type: 'error'
                        });
                        setSaving(false)
                        return
                    }
                    for (let pIdx = 0; pIdx < m.examenPreguntas.length; pIdx++) {
                        const p = m.examenPreguntas[pIdx];
                        if (!p.pregunta) {
                            setModalMessage({
                                title: 'Pregunta Incompleta',
                                content: `Error: Completa la pregunta ${pIdx + 1} en el examen del módulo "${m.titulo}".`,
                                type: 'error'
                            });
                            setSaving(false)
                            return
                        }
                        if (p.tipo_pregunta !== 'respuesta_libre') {
                            if (!p.opcion_a || !p.opcion_b || !p.respuesta_correcta) {
                                setModalMessage({
                                    title: 'Opciones Incompletas',
                                    content: `Error: Completa al menos las opciones A y B, y la respuesta correcta para la pregunta ${pIdx + 1} en el examen del módulo "${m.titulo}".`,
                                    type: 'error'
                                });
                                setSaving(false)
                                return
                            }
                        }
                    }
                }
            }

            if (requiereExamen) {
                if (preguntasExtraidas.length === 0) {
                    setModalMessage({
                        title: 'Cuestionario Vacío',
                        content: 'Error: Has marcado que el curso requiere examen final, por favor añade al menos una pregunta.',
                        type: 'error'
                    });
                    setSaving(false)
                    return
                }
                const tieneOpcionMultipleFinal = preguntasExtraidas.some(p => p.tipo_pregunta !== 'respuesta_libre');
                if (!tieneOpcionMultipleFinal) {
                    setModalMessage({
                        title: 'Falta Pregunta de Opción Múltiple',
                        content: 'Error: El examen final debe tener al menos una pregunta de opción múltiple para calificarlo de forma automatizada.',
                        type: 'error'
                    });
                    setSaving(false)
                    return
                }
                for (let pIdx = 0; pIdx < preguntasExtraidas.length; pIdx++) {
                    const p = preguntasExtraidas[pIdx];
                    if (!p.pregunta) {
                        setModalMessage({
                            title: 'Pregunta Incompleta',
                            content: `Error: Por favor completa el texto para la pregunta ${pIdx + 1} del examen final.`,
                            type: 'error'
                        });
                        setSaving(false)
                        return
                    }
                    if (p.tipo_pregunta !== 'respuesta_libre') {
                        if (!p.opcion_a || !p.opcion_b || !p.respuesta_correcta) {
                            setModalMessage({
                                title: 'Opciones Incompletas',
                                content: `Error: Por favor completa las opciones A y B, y la respuesta correcta para la pregunta ${pIdx + 1} del examen final.`,
                                type: 'error'
                            });
                            setSaving(false)
                            return
                        }
                    }
                }
            }
        }

        let firstUrlContenido = '';

        // 1. Subir archivos de módulos (si los hay)
        setMensaje('Guardando archivos de contenido nuevos...')
        const modulosFinales: Modulo[] = []
        for (let i = 0; i < modulos.length; i++) {
            const currentMod = modulos[i];
            setMensaje(`Guardando Módulo ${i + 1} de ${modulos.length}: "${currentMod.titulo || 'Sin título'}"... Subiendo lecturas e infografías...`)
            const recursosFinales = [];

            for (let rIdx = 0; rIdx < currentMod.recursos.length; rIdx++) {
                const rec = currentMod.recursos[rIdx];
                let finalUrl = rec.url_contenido;

                if (rec.tipo !== 'video' && rec.archivoPdf) {
                    const file = rec.archivoPdf as File;
                    const fileExt = file.name.split('.').pop()
                    const fileName = `modulo_recurso_${id}_${i}_${rIdx}_${Date.now()}.${fileExt}`

                    const ext = (fileExt || '').toLowerCase()
                    let contentType = 'application/octet-stream'
                    if (ext === 'pdf') {
                        contentType = 'application/pdf'
                    } else if (ext === 'html' || ext === 'htm') {
                        contentType = 'text/html; charset=utf-8'
                    } else if (ext === 'ppt' || ext === 'pptx') {
                        contentType = 'application/vnd.ms-powerpoint'
                    }

                    const { error: upErr } = await supabase.storage.from('cursos_contenido').upload(fileName, file, { contentType })
                    if (upErr) {
                        setModalMessage({
                            title: 'Error de Archivo',
                            content: `Error subiendo el archivo del recurso "${rec.titulo}" en el módulo ${i + 1}: ${upErr.message}`,
                            type: 'error'
                        });
                        setSaving(false);
                        return;
                    }
                    finalUrl = supabase.storage.from('cursos_contenido').getPublicUrl(fileName).data.publicUrl
                }

                recursosFinales.push({
                    id: rec.id,
                    titulo: rec.titulo,
                    tipo: rec.tipo,
                    url_contenido: finalUrl,
                    descargable: rec.descargable
                });
            }

            if (i === 0 && recursosFinales.length > 0) {
                firstUrlContenido = recursosFinales[0].url_contenido;
            }

            modulosFinales.push({
                id: currentMod.id,
                titulo: currentMod.titulo,
                recursos: recursosFinales,
                orden: i + 1,
                requiereExamen: currentMod.requiereExamen,
                examenMinAprobacion: currentMod.examenMinAprobacion,
                examenPreguntas: currentMod.examenPreguntas,
                requiereTarea: currentMod.requiereTarea,
                tareaInstrucciones: currentMod.tareaInstrucciones,
                tareaPuntos: currentMod.tareaPuntos,
                tareaTipo: currentMod.tareaTipo,
                tareaPuzzleTipo: currentMod.tareaPuzzleTipo,
                tareaPuzzlePregunta: currentMod.tareaPuzzlePregunta,
                tareaPuzzleRespuesta: currentMod.tareaPuzzleRespuesta,
                tareaPuzzles: currentMod.tareaPuzzles,
                requierePuzzle: currentMod.requierePuzzle,
                puzzlePuntos: currentMod.puzzlePuntos,
                puzzleTipo: currentMod.puzzleTipo,
                puzzlePregunta: currentMod.puzzlePregunta,
                puzzleRespuesta: currentMod.puzzleRespuesta,
                puzzlePuzzles: currentMod.puzzlePuzzles,
                requiereCuestionario: currentMod.requiereCuestionario,
                cuestionarioPreguntas: currentMod.cuestionarioPreguntas,
                seguridadAumentada: currentMod.seguridadAumentada,
                maxCambiosPantalla: currentMod.maxCambiosPantalla,
                conTiempo: currentMod.conTiempo,
                tiempoExamen: currentMod.tiempoExamen,
                intentosPermitidos: currentMod.intentosPermitidos
            });
        }

        // 2. Guardar logic
        if (estadoActual === 'aprobado') {
            setMensaje('Guardando cambios en el borrador de cambios pendientes...')
            const borrador = {
                titulo: formData.titulo,
                descripcion: formData.descripcion,
                competencias: formData.competencias,
                beneficios: formData.beneficios,
                duracion: formData.duracion,
                precio: profile?.rol === 'capacitador' ? 0 : Number(formData.precio),
                instructor: formData.instructor,
                vigencia_anos: vigenciaAnos,
                requiere_pago_completo: requierePagoCompleto,
                reunion_url: formData.reunion_url?.trim() || null,
                nota_profesor: formData.nota_profesor?.trim() || null,
                categoria: formData.categoria,
                modalidad: formData.modalidad,
                limite_inscripcion: formData.modalidad === 'cerrada' && formData.limite_inscripcion ? formData.limite_inscripcion : null,
                bloquear_avance: bloquearAvance,
                requiere_tareas_avance: requiereTareasAvance,
                requiere_examen_avance: requiereExamenAvance,
                aplicar_iva: aplicarIva,
                mostrar_examen_final: mostrarExamenFinal,
                mostrar_constancia: mostrarConstancia,
                mostrar_calificacion_constancia: mostrarCalificacionConstancia,
                mostrar_revision_examen: mostrarRevisionExamen,
                logo_url: logoUrl,
                imagen_url: imagenUrl,
                mostrar_logo_constancia: mostrarLogoConstancia,
                plantilla_constancia: plantillaConstancia,
                modulos: modulosFinales.map(m => ({
                    id: m.id,
                    titulo: m.titulo,
                    url_contenido: m.recursos.length > 0 ? m.recursos[0].url_contenido : '',
                    recursos: m.recursos.map((r: any) => ({
                        id: r.id,
                        titulo: r.titulo,
                        tipo: r.tipo,
                        url_contenido: r.url_contenido,
                        descargable: r.descargable
                    })),
                    orden: m.orden,
                    requiereTarea: m.requiereTarea,
                    tareaInstrucciones: m.tareaInstrucciones,
                    tareaPuntos: m.tareaPuntos,
                    tareaTipo: m.tareaTipo,
                    tareaPuzzleTipo: m.tareaPuzzleTipo,
                    tareaPuzzlePregunta: m.tareaPuzzlePregunta,
                    tareaPuzzleRespuesta: m.tareaPuzzleRespuesta,
                    tareaPuzzles: m.tareaPuzzles || [],
                    requierePuzzle: m.requierePuzzle,
                    puzzlePuntos: m.puzzlePuntos,
                    puzzleTipo: m.puzzleTipo,
                    puzzlePregunta: m.puzzlePregunta,
                    puzzleRespuesta: m.puzzleRespuesta,
                    puzzlePuzzles: m.puzzlePuzzles || [],
                    requiereCuestionario: !!m.requiereCuestionario,
                    cuestionarioPreguntas: m.cuestionarioPreguntas?.map((p, idx) => ({
                        id: p.id,
                        pregunta: p.pregunta,
                        orden: idx + 1
                    })) || [],
                    examen: m.requiereExamen ? {
                        min_aprobacion: m.examenMinAprobacion,
                        tiempo_limite: m.conTiempo ? (m.tiempoExamen === '' || m.tiempoExamen === undefined ? 20 : m.tiempoExamen) : null,
                        seguridad_aumentada: m.seguridadAumentada || false,
                        max_cambios_pantalla: m.maxCambiosPantalla,
                        intentos_permitidos: m.intentosPermitidos === '' || m.intentosPermitidos === undefined ? 2 : m.intentosPermitidos,
                        preguntas: m.examenPreguntas.map((p, idx) => ({
                            pregunta: p.pregunta,
                            opcion_a: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_a,
                            opcion_b: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_b,
                            opcion_c: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_c,
                            opcion_d: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_d,
                            respuesta_correcta: p.tipo_pregunta === 'respuesta_libre' ? 'A' : p.respuesta_correcta,
                            tipo_pregunta: p.tipo_pregunta || 'opcion_multiple',
                            orden: idx + 1
                        }))
                    } : null
                })),
                requiere_examen: requiereExamen,
                examen: requiereExamen ? {
                    min_aprobacion: minAprobacion === '' ? 80 : minAprobacion,
                    tiempo_limite: conTiempo ? (tiempoExamen === '' ? 60 : tiempoExamen) : null,
                    seguridad_aumentada: seguridadAumentada,
                    max_cambios_pantalla: seguridadAumentada ? (maxCambios === '' ? 3 : maxCambios) : 3,
                    intentos_permitidos: intentosPermitidos === '' ? 3 : intentosPermitidos,
                    preguntas: preguntasExtraidas.map((p, idx) => ({
                        pregunta: p.pregunta,
                        opcion_a: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_a,
                        opcion_b: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_b,
                        opcion_c: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_c,
                        opcion_d: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_d,
                        respuesta_correcta: p.tipo_pregunta === 'respuesta_libre' ? 'A' : p.respuesta_correcta,
                        tipo_pregunta: p.tipo_pregunta || 'opcion_multiple',
                        orden: idx + 1
                    }))
                } : null
            }

            const { error: errorDraft } = await supabase.from('ie_cursos').update({ cambios_pendientes: borrador }).eq('id', id)
            if (errorDraft) {
                setModalMessage({
                    title: 'Error al Guardar Borrador',
                    content: 'Error al guardar el borrador de cambios: ' + errorDraft.message,
                    type: 'error'
                });
                setSaving(false)
                return
            }
        } else {
            // Edición directa si no está aprobado
            setMensaje('Actualizando datos generales del curso...')
            const { error: errorUpdate } = await supabase
                .from('ie_cursos')
                .update({
                    titulo: formData.titulo,
                    descripcion: formData.descripcion,
                    competencias: formData.competencias,
                    beneficios: formData.beneficios,
                    duracion: formData.duracion,
                    precio: profile?.rol === 'capacitador' ? 0 : Number(formData.precio),
                    instructor: formData.instructor,
                    vigencia_anos: vigenciaAnos,
                    requiere_pago_completo: requierePagoCompleto,
                    reunion_url: formData.reunion_url?.trim() || null,
                    nota_profesor: formData.nota_profesor?.trim() || null,
                    categoria: formData.categoria,
                    modalidad: formData.modalidad,
                    limite_inscripcion: formData.modalidad === 'cerrada' && formData.limite_inscripcion ? formData.limite_inscripcion : null,
                    requiere_examen: requiereExamen,
                    bloquear_avance: bloquearAvance,
                    requiere_tareas_avance: requiereTareasAvance,
                    requiere_examen_avance: requiereExamenAvance,
                aplicar_iva: aplicarIva,
                mostrar_examen_final: mostrarExamenFinal,
                    mostrar_constancia: mostrarConstancia,
                    mostrar_calificacion_constancia: mostrarCalificacionConstancia,
                    mostrar_revision_examen: mostrarRevisionExamen,
                    url_contenido: firstUrlContenido,
                    logo_url: logoUrl,
                    imagen_url: imagenUrl,
                    mostrar_logo_constancia: mostrarLogoConstancia,
                    plantilla_constancia: plantillaConstancia,
                    cambios_pendientes: null, // Clear draft upon official publication
                    estado: esBorrador ? 'borrador' : 'pendiente'
                })
                .eq('id', id)

            if (errorUpdate) {
                setModalMessage({
                    title: esBorrador ? 'Error al Guardar Borrador' : 'Error al Actualizar Curso',
                    content: (esBorrador ? 'Error al guardar el borrador del curso: ' : 'Error al actualizar los datos generales del curso: ') + errorUpdate.message,
                    type: 'error'
                });
                setSaving(false)
                return
            }

            setMensaje('Actualizando temario y exámenes modulares...')
            for (const mod of modulosFinales) {
                const moduloPayload = {
                    curso_id: id,
                    titulo: mod.titulo || 'Módulo sin título',
                    url_contenido: mod.recursos.length > 0 ? mod.recursos[0].url_contenido : '',
                    orden: mod.orden,
                    requiere_cuestionario: !!mod.requiereCuestionario
                };
                
                let moduloId = mod.id;
                if (moduloId) {
                    await supabase.from('ie_curso_modulos').update(moduloPayload).eq('id', moduloId)
                } else {
                    const { data: newMod } = await supabase.from('ie_curso_modulos').insert(moduloPayload).select('id').single();
                    if (newMod) moduloId = newMod.id;
                }

                // Guardar examen modular y recursos si tiene id
                if (moduloId) {
                    // ── PROTECCIÓN CONTRA PÉRDIDA DE RECURSOS ────────────────
                    // 1. Obtener los recursos actuales en la DB para este módulo
                    const { data: recursosEnDB } = await supabase
                        .from('ie_modulo_recursos')
                        .select('id, url_contenido')
                        .eq('modulo_id', moduloId);

                    // 2. Validación de seguridad: si la DB tiene recursos pero el
                    //    estado en memoria está vacío, algo falló en la carga.
                    //    Bloqueamos el guardado para no perder datos.
                    if ((recursosEnDB?.length ?? 0) > 0 && mod.recursos.length === 0) {
                        setModalMessage({
                            title: 'Protección de Recursos',
                            content: `El módulo "${mod.titulo}" tiene ${recursosEnDB!.length} recurso(s) guardado(s) en la base de datos, pero aparece vacío en el editor. Por seguridad, el guardado fue cancelado para evitar pérdida de datos. Por favor recarga la página e intenta de nuevo.`,
                            type: 'error'
                        });
                        setSaving(false);
                        return;
                    }

                    // 3. Insertar o actualizar los recursos del estado actual (seguros)
                    const idsInsertados: string[] = [];
                    for (let rIdx = 0; rIdx < mod.recursos.length; rIdx++) {
                        const rec = mod.recursos[rIdx];

                        if (rec.id) {
                            // Recurso existente → actualizar
                            await supabase.from('ie_modulo_recursos').update({
                                titulo: rec.titulo || 'Recurso sin título',
                                url_contenido: rec.url_contenido,
                                orden: rIdx + 1,
                                descargable: rec.descargable || false
                            }).eq('id', rec.id);
                            idsInsertados.push(rec.id);
                        } else {
                            // Recurso nuevo → insertar
                            const { data: newRec, error: errorInsert } = await supabase.from('ie_modulo_recursos').insert({
                                modulo_id: moduloId,
                                titulo: rec.titulo || 'Recurso sin título',
                                url_contenido: rec.url_contenido,
                                orden: rIdx + 1,
                                descargable: rec.descargable || false
                            }).select('id').single();
                            if (errorInsert) {
                                console.error('Error insertando nuevo recurso:', JSON.stringify(errorInsert), errorInsert);
                            }
                            if (newRec?.id) idsInsertados.push(newRec.id);
                        }

                        // Vincular generación de Gamma como utilizada
                        await supabase
                            .from('ie_gamma_generations')
                            .update({ utilizado: true, modulo_id: moduloId })
                            .eq('export_url', rec.url_contenido);
                    }

                    // 4. Borrar solo los recursos que el usuario eliminó deliberadamente
                    //    (los que están en DB pero no en el estado actual)
                    const idsAEliminar = (recursosEnDB || [])
                        .filter(r => !idsInsertados.includes(r.id))
                        .map(r => r.id);
                    if (idsAEliminar.length > 0) {
                        await supabase.from('ie_modulo_recursos').delete().in('id', idsAEliminar);
                    }

                    if (mod.requiereExamen && mod.examenPreguntas.length > 0) {
                        let { data: exm } = await supabase.from('ie_examenes').select('id').eq('modulo_id', moduloId).single();
                        
                        const examPayload = {
                            curso_id: id,
                            modulo_id: moduloId,
                            min_aprobacion: mod.examenMinAprobacion,
                            tiempo_limite: mod.conTiempo ? (mod.tiempoExamen === '' || mod.tiempoExamen === undefined ? 20 : mod.tiempoExamen) : null,
                            seguridad_aumentada: mod.seguridadAumentada || false,
                            max_cambios_pantalla: mod.seguridadAumentada ? (mod.maxCambiosPantalla === '' || mod.maxCambiosPantalla === undefined ? 3 : mod.maxCambiosPantalla) : 3,
                            intentos_permitidos: mod.intentosPermitidos === '' || mod.intentosPermitidos === undefined ? 2 : mod.intentosPermitidos
                        };

                        if (!exm) {
                            const { data: newExm } = await supabase.from('ie_examenes').insert(examPayload).select('id').single();
                            exm = newExm;
                        } else {
                            await supabase.from('ie_examenes').update(examPayload).eq('id', exm.id);
                        }

                        if (exm) {
                            await supabase.from('ie_preguntas').delete().eq('examen_id', exm.id)
                            const pregsModularParaInsertar = mod.examenPreguntas.map((p, idx) => ({
                                examen_id: exm!.id,
                                pregunta: p.pregunta,
                                opcion_a: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_a,
                                opcion_b: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_b,
                                opcion_c: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_c,
                                opcion_d: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_d,
                                respuesta_correcta: p.tipo_pregunta === 'respuesta_libre' ? 'A' : p.respuesta_correcta,
                                tipo_pregunta: p.tipo_pregunta || 'opcion_multiple',
                                orden: idx + 1
                            }))
                            await supabase.from('ie_preguntas').insert(pregsModularParaInsertar)
                        }
                    } else {
                        // Borrar examen modular si fue desactivado
                        const estadoModulo = await moduloTieneExamenContestado(id, moduloId)
                        if (estadoModulo.error) {
                            setModalMessage({
                                title: 'No se pudo validar el módulo',
                                content: 'Error validando exámenes contestados: ' + estadoModulo.error,
                                type: 'error'
                            })
                            setSaving(false)
                            return
                        }
                        if (estadoModulo.tieneResultados) {
                            setModalMessage({
                                title: 'Examen modular protegido',
                                content: `No puedes quitar el examen del módulo "${mod.titulo}" porque ya tiene respuestas de alumnos.`,
                                type: 'error'
                            })
                            setSaving(false)
                            return
                        }
                        await supabase.from('ie_examenes').delete().eq('modulo_id', moduloId)
                    }

                    if (mod.requiereCuestionario) {
                        await supabase.from('ie_cuestionario_preguntas').delete().eq('modulo_id', moduloId);
                        if (mod.cuestionarioPreguntas && mod.cuestionarioPreguntas.length > 0) {
                            const pregsCuestInsert = mod.cuestionarioPreguntas.map((p, idx) => ({
                                curso_id: id,
                                modulo_id: moduloId,
                                pregunta: p.pregunta,
                                orden: idx + 1
                            }));
                            await supabase.from('ie_cuestionario_preguntas').insert(pregsCuestInsert);
                        }
                    } else {
                        await supabase.from('ie_cuestionario_preguntas').delete().eq('modulo_id', moduloId);
                    }

                    // Save or update task definition inside ie_preguntas_respuestas
                    if (mod.requiereTarea) {
                        const definitionKey = `TAREA_DEFINICION:${moduloId}`;
                        const definitionPayload = JSON.stringify({
                            instrucciones: mod.tareaInstrucciones || '',
                            puntos: mod.tareaPuntos || ''
                        });

                        const { data: existingDef } = await supabase
                            .from('ie_preguntas_respuestas')
                            .select('id')
                            .eq('curso_id', id)
                            .eq('respuesta', 'TAREA_DEFINICION')
                            .like('pregunta', `TAREA_DEFINICION:${moduloId}%`)
                            .single();
                        
                        if (existingDef) {
                            await supabase
                                .from('ie_preguntas_respuestas')
                                .update({ pregunta: `${definitionKey}::${definitionPayload}` })
                                .eq('id', existingDef.id);
                        } else {
                            await supabase
                                .from('ie_preguntas_respuestas')
                                .insert({
                                    curso_id: id,
                                    user_id: user.id,
                                    pregunta: `${definitionKey}::${definitionPayload}`,
                                    respuesta: 'TAREA_DEFINICION'
                                });
                        }
                    } else {
                        await supabase
                            .from('ie_preguntas_respuestas')
                            .delete()
                            .eq('curso_id', id)
                            .eq('respuesta', 'TAREA_DEFINICION')
                            .like('pregunta', `TAREA_DEFINICION:${moduloId}%`);
                    }

                    // Save or update puzzle definition inside ie_preguntas_respuestas
                    if (mod.requierePuzzle) {
                        const definitionKey = `PUZZLE_DEFINICION:${moduloId}`;
                        const definitionPayload = JSON.stringify({
                            puntos: mod.puzzlePuntos || '',
                            puzzleTipo: mod.puzzleTipo || 'anagrama',
                            puzzlePregunta: mod.puzzlePregunta || '',
                            puzzleRespuesta: mod.puzzleRespuesta || '',
                            puzzles: mod.puzzlePuzzles || []
                        });

                        const { data: existingPuzzleDef } = await supabase
                            .from('ie_preguntas_respuestas')
                            .select('id')
                            .eq('curso_id', id)
                            .eq('respuesta', 'PUZZLE_DEFINICION')
                            .like('pregunta', `PUZZLE_DEFINICION:${moduloId}%`)
                            .single();
                        
                        if (existingPuzzleDef) {
                            await supabase
                                .from('ie_preguntas_respuestas')
                                .update({ pregunta: `${definitionKey}::${definitionPayload}` })
                                .eq('id', existingPuzzleDef.id);
                        } else {
                            await supabase
                                .from('ie_preguntas_respuestas')
                                .insert({
                                    curso_id: id,
                                    user_id: user.id,
                                    pregunta: `${definitionKey}::${definitionPayload}`,
                                    respuesta: 'PUZZLE_DEFINICION'
                                });
                        }
                    } else {
                        await supabase
                            .from('ie_preguntas_respuestas')
                            .delete()
                            .eq('curso_id', id)
                            .eq('respuesta', 'PUZZLE_DEFINICION')
                            .like('pregunta', `PUZZLE_DEFINICION:${moduloId}%`);
                    }
                }
            }

            // Examen Final
            if (requiereExamen) {
                setMensaje('Actualizando examen final del curso...')
                let { data: exm } = await supabase.from('ie_examenes').select('id').eq('curso_id', id).is('modulo_id', null).single()
                
                const finalExamPayload = {
                    curso_id: id,
                    min_aprobacion: minAprobacion === '' ? 80 : minAprobacion,
                    tiempo_limite: conTiempo ? (tiempoExamen === '' ? 60 : tiempoExamen) : null,
                    seguridad_aumentada: seguridadAumentada,
                    max_cambios_pantalla: seguridadAumentada ? (maxCambios === '' ? 3 : maxCambios) : 3,
                    intentos_permitidos: intentosPermitidos === '' ? 3 : intentosPermitidos
                };

                if (!exm) {
                    const { data: newExm } = await supabase.from('ie_examenes').insert(finalExamPayload).select('id').single();
                    exm = newExm;
                } else {
                    await supabase.from('ie_examenes').update(finalExamPayload).eq('id', exm.id);
                }

                if (exm) {
                    await supabase.from('ie_preguntas').delete().eq('examen_id', exm.id)
                    const pregsFinalParaInsertar = preguntasExtraidas.map((p, idx) => ({
                        examen_id: exm!.id,
                        pregunta: p.pregunta,
                        opcion_a: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_a,
                        opcion_b: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_b,
                        opcion_c: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_c,
                        opcion_d: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_d,
                        respuesta_correcta: p.tipo_pregunta === 'respuesta_libre' ? 'A' : p.respuesta_correcta,
                        tipo_pregunta: p.tipo_pregunta || 'opcion_multiple',
                        orden: idx + 1
                    }));
                    await supabase.from('ie_preguntas').insert(pregsFinalParaInsertar);
                }
            } else {
                // Borrar examen final si fue desactivado
                await supabase.from('ie_examenes').delete().eq('curso_id', id).is('modulo_id', null)
            }
        }

        // Registrar Historial
        setMensaje('Registrando en el historial de cambios...')
        await supabase.from('ie_curso_historial').insert({
            curso_id: id,
            modificado_por: user.id,
            detalles_cambio: historialMensaje || 'Actualización de curso por profesor',
        })

        // Notificar a Admins y Financieros (usando Server Action)
        if (estadoActual === 'aprobado' && !esBorrador) {
            await notifyAdminsOnCourseEdit(formData.titulo, user.id, profile?.nombre || user.email || 'Profesor');
        }

        setModalMessage({
            title: esBorrador ? '¡Borrador Guardado!' : '¡Curso Guardado!',
            content: esBorrador 
                ? 'El borrador del curso se ha guardado correctamente.' 
                : 'Los cambios se han guardado correctamente y han sido enviados a revisión por el administrador.',
            type: 'success',
            redirectUrl: '/profesor/cursos'
        });
        setSaving(false)
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando curso...</div>

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <Link href="/profesor/cursos" className="p-2.5 bg-white rounded-2xl text-gray-500 hover:text-gray-900 shadow-sm border border-zinc-200 transition-all hover:scale-105">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                            <Sparkles className="text-blue-600 h-8 w-8 animate-pulse" />
                            Editar Curso
                        </h1>
                        <p className="text-gray-500 text-sm mt-0.5">Visualiza el borrador, actualiza temarios, presentaciones PPT y exámenes modulares.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-4 py-1.5 text-xs font-black rounded-full uppercase tracking-wider shadow-sm ${
                        estadoActual === 'aprobado' ? 'bg-green-150 text-green-800 border border-green-200' : 'bg-yellow-150 text-yellow-800 border border-yellow-200'
                    }`}>
                        Estado: {estadoActual}
                    </span>
                    {isSavingDraft && (
                        <span className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-indigo-50 text-indigo-750 border border-indigo-200 flex items-center gap-1.5 shadow-sm animate-pulse">
                            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping"></span>
                            Auto-guardando...
                        </span>
                    )}
                    {!isSavingDraft && tieneBorrador && (
                        <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                            Borrador Guardado
                        </span>
                    )}
                </div>
            </div>



            {/* Navigation Tabs */}
            <div className={`flex flex-wrap items-center gap-y-2 mb-6 border-b border-gray-200 pb-px ${isSavingDraft ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <button
                    onClick={() => handleTabChange('info')}
                    type="button"
                    className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 rounded-t-xl transition-all ${
                        activeTab === 'info'
                            ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                            : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-zinc-50'
                    }`}
                >
                    <Layout className="h-4 w-4" />
                    <span>1. Información General</span>
                </button>
                <ArrowRight className="h-5 w-5 text-[#8b5e3c] mx-2 flex-shrink-0" />
                <button
                    onClick={() => handleTabChange('modulos')}
                    type="button"
                    className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 rounded-t-xl transition-all ${
                        activeTab === 'modulos'
                            ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                            : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-zinc-50'
                    }`}
                >
                    <BookOpen className="h-4 w-4" />
                    <span>2. Temario y Clases</span>
                </button>
                <ArrowRight className="h-5 w-5 text-[#8b5e3c] mx-2 flex-shrink-0" />
                <button
                    onClick={() => handleTabChange('examen')}
                    type="button"
                    className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 rounded-t-xl transition-all ${
                        activeTab === 'examen'
                            ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                            : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-zinc-50'
                    }`}
                >
                    <BrainCircuit className="h-4 w-4" />
                    <span>3. Evaluación Final (Examen)</span>
                </button>
                <ArrowRight className="h-5 w-5 text-[#8b5e3c] mx-2 flex-shrink-0" />
                <button
                    onClick={() => handleTabChange('avisos')}
                    type="button"
                    className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 rounded-t-xl transition-all ${
                        activeTab === 'avisos'
                            ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                            : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-zinc-50'
                    }`}
                >
                    <MessageSquare className="h-4 w-4" />
                    <span>4. Avisos, Notas <br /> y Enviar a Revisión</span>
                </button>
            </div>

            <div className="bg-white shadow-xl rounded-2xl border border-zinc-105 p-6 lg:p-8">
                {mensaje && (
                    <div className={`mb-6 p-4 rounded-xl border ${mensaje.includes('Error') ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                        <p className="font-semibold text-sm">{mensaje}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-8">
                    <div className={activeTab === 'info' ? 'space-y-6 block' : 'hidden'}>
                        <div className="space-y-6">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-gray-900">1. Información Básica del Curso</h2>
                                    <p className="text-gray-500 text-xs mt-0.5">Modifica los campos principales del curso y la constancia.</p>
                                </div>
                                <button type="button" onClick={() => guardarCurso(true)} disabled={saving} className="flex-shrink-0 whitespace-nowrap px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-sm disabled:opacity-50 shadow-md">
                                    {saving ? 'Guardando...' : 'Guardar Borrador'}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Título del Curso</label>
                                    <input type="text" name="titulo" required maxLength={60} value={formData.titulo} onChange={handleChange} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 text-black bg-white" placeholder="Ej. Fundamentos modernos de..." />
                                    <p className="text-[10px] text-gray-500 mt-1 italic">Máx. 60 caracteres. Se renderizará en el certificado del alumno.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción Completa</label>
                                    <textarea name="descripcion" required value={formData.descripcion} onChange={handleChange} rows={4} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 text-black bg-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Competencias del Curso</label>
                                    <textarea name="competencias" required value={formData.competencias} onChange={handleChange} rows={4} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 text-black bg-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Beneficios / ¿Qué aprenderá el alumno?</label>
                                    <textarea name="beneficios" required value={formData.beneficios} onChange={handleChange} rows={3} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 text-black bg-white" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Duración Estructurada</label>
                                        <input type="text" name="duracion" required maxLength={30} value={formData.duracion} onChange={handleChange} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 text-black bg-white" />
                                        <p className="text-[10px] text-gray-500 mt-1 italic">Máx. 30 caracteres. Se imprime en el certificado.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Vigencia de la Constancia</label>
                                        <select
                                            value={vigenciaAnos}
                                            onChange={(e) => setVigenciaAnos(Number(e.target.value))}
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 text-black bg-white"
                                        >
                                            <option value={1}>1 año</option>
                                            <option value={2}>2 años</option>
                                            <option value={3}>3 años</option>
                                            <option value={5}>5 años</option>
                                            <option value={10}>10 años</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Categoría</label>
                                        <select
                                            value={formData.categoria}
                                            onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 text-black bg-white"
                                        >
                                            <option value="salud">🩺 Salud</option>
                                            <option value="negocios">💼 Negocios</option>
                                            <option value="tecnologia">💻 Tecnología</option>
                                            <option value="desarrollo">😊 Desarrollo Personal</option>
                                            <option value="idiomas">🌐 Idiomas</option>
                                            <option value="mas">💬 Más</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Modalidad de Inscripción</label>
                                        <select
                                            name="modalidad"
                                            value={formData.modalidad}
                                            onChange={handleChange}
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 text-black bg-white"
                                        >
                                            <option value="abierta">Abierta (El alumno puede inscribirse cuando quiera)</option>
                                            <option value="cerrada">Cerrada (Inscripción en un lapso de tiempo)</option>
                                        </select>
                                    </div>
                                    {formData.modalidad === 'cerrada' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha límite de inscripción (dd/mm/aaaa)</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    name="limite_inscripcion"
                                                    required={formData.modalidad === 'cerrada'}
                                                    placeholder="dd/mm/aaaa"
                                                    pattern="(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012])/(19|20)\d\d"
                                                    title="El formato debe ser dd/mm/aaaa"
                                                    value={
                                                        // Convertir YYYY-MM-DD del estado local a DD/MM/YYYY para la vista del input
                                                        formData.limite_inscripcion && /^\d{4}-\d{2}-\d{2}$/.test(formData.limite_inscripcion)
                                                            ? `${formData.limite_inscripcion.split('-')[2]}/${formData.limite_inscripcion.split('-')[1]}/${formData.limite_inscripcion.split('-')[0]}`
                                                            : formData.limite_inscripcion
                                                    }
                                                    onChange={(e) => {
                                                        let val = e.target.value;
                                                        // Autoformatear añadiendo diagonales conforme escribe
                                                        val = val.replace(/\D/g, '');
                                                        if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
                                                        if (val.length > 5) val = val.substring(0, 5) + '/' + val.substring(5, 9);
                                                        
                                                        // Si completó la fecha en formato DD/MM/YYYY, guardarla como YYYY-MM-DD en el formData
                                                        if (val.length === 10) {
                                                            const [d, m, y] = val.split('/');
                                                            setFormData(prev => ({ ...prev, limite_inscripcion: `${y}-${m}-${d}` }));
                                                        } else {
                                                            // Guardar el valor parcial para permitir que borre o edite libremente
                                                            setFormData(prev => ({ ...prev, limite_inscripcion: val }));
                                                        }
                                                    }}
                                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 pr-10 text-black bg-white"
                                                />
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                    <div className="relative w-6 h-6 flex items-center justify-center">
                                                        <input
                                                            type="date"
                                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                            value={
                                                                formData.limite_inscripcion && /^\d{4}-\d{2}-\d{2}$/.test(formData.limite_inscripcion)
                                                                    ? formData.limite_inscripcion
                                                                    : ""
                                                            }
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val) {
                                                                    setFormData(prev => ({ ...prev, limite_inscripcion: val }));
                                                                }
                                                            }}
                                                        />
                                                        <svg className="h-5 w-5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                                    {profile?.rol !== 'capacitador' ? (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Precio al Público del Curso (MXN)</label>
                                            <div className="flex gap-2 items-center">
                                                <div className="relative rounded-xl shadow-sm flex-1">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <span className="text-gray-500">$</span>
                                                    </div>
                                                    <input type="number" step="0.01" name="precio" required min="0" value={formData.precio} onChange={handleChange} className="pl-8 w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 text-black bg-white" />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsSimuladorOpen(true)}
                                                    className="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl font-medium border border-blue-100 hover:bg-blue-100 transition-colors flex items-center gap-2"
                                                >
                                                    <Calculator size={18} />
                                                    Simular ventas
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 rounded-xl p-4 flex items-center">
                                            <p className="text-sm text-gray-500 italic">Eres un capacitador validado. Tus cursos son gratuitos o gestionados por la institución.</p>
                                        </div>
                                    )}

                                    {profile?.rol !== 'capacitador' && (
                                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                id="requierePagoCompleto"
                                                checked={requierePagoCompleto}
                                                onChange={(e) => setRequierePagoCompleto(e.target.checked)}
                                                className="h-4 w-4 mt-1 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="requierePagoCompleto" className="cursor-pointer">
                                                <span className="block text-sm font-semibold text-orange-950">Pago Completo Obligatorio</span>
                                                <span className="block text-[11px] text-orange-700 mt-0.5">Los alumnos que usen cupones deberán pagar la diferencia restante para obtener la constancia.</span>
                                            </label>
                                        </div>
                                    )}

                                    {profile?.rol === 'institucion' && (
                                        <div className="col-span-full pt-4 border-t border-gray-100 space-y-4">
                                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Logotipo de la Organización (Constancia)</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="flex flex-col gap-2">
                                                    <label className="block text-sm font-semibold text-gray-700">Subir Logotipo</label>
                                                    <div className="flex items-center gap-4">
                                                        {logoPreviewUrl ? (
                                                            <div className="relative w-24 h-24 border border-gray-300 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center p-2">
                                                                <img src={logoPreviewUrl} alt="Vista previa del logo" className="max-w-full max-h-full object-contain" />
                                                                <button
                                                                    type="button"
                                                                    onClick={async () => {
                                                                        setArchivoLogo(null);
                                                                        setLogoPreviewUrl(null);
                                                                        setLogoUrl(null);
                                                                    }}
                                                                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition"
                                                                onClick={() => document.getElementById('logo-upload-input')?.click()}
                                                            >
                                                                <Plus className="w-6 h-6 text-gray-400" />
                                                                <span className="text-[10px] text-gray-500 font-semibold mt-1">Subir Logo</span>
                                                            </div>
                                                        )}
                                                        <input
                                                            id="logo-upload-input"
                                                            type="file"
                                                            accept="image/png, image/jpeg, image/webp"
                                                            className="hidden"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    setArchivoLogo(file);
                                                                    setLogoPreviewUrl(URL.createObjectURL(file));
                                                                    
                                                                    // Upload immediately for instant URL reference in drafts
                                                                    const fileExt = file.name.split('.').pop()
                                                                    const fileName = `logo_curso_${id}_${Date.now()}.${fileExt}`
                                                                    const { error: uploadError } = await supabase.storage
                                                                        .from('cursos_contenido')
                                                                        .upload(fileName, file, { contentType: file.type })
                                                                    
                                                                    if (!uploadError) {
                                                                        const publicUrl = supabase.storage.from('cursos_contenido').getPublicUrl(fileName).data.publicUrl;
                                                                        setLogoUrl(publicUrl);
                                                                    } else {
                                                                        alert('Error al subir el logotipo: ' + uploadError.message);
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        <div className="text-xs text-gray-500 max-w-xs leading-relaxed">
                                                            Soporta archivos PNG, JPG o WEBP. Recomendado: fondo transparente y formato horizontal o cuadrado.
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 self-center">
                                                    <input
                                                        type="checkbox"
                                                        id="mostrarLogoConstancia"
                                                        checked={mostrarLogoConstancia}
                                                        onChange={(e) => setMostrarLogoConstancia(e.target.checked)}
                                                        className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    />
                                                    <label htmlFor="mostrarLogoConstancia" className="cursor-pointer">
                                                        <span className="block text-sm font-semibold text-blue-950">Incluir logotipo en la Constancia</span>
                                                        <span className="block text-[11px] text-blue-700 mt-0.5">Si se activa, el logotipo de la organización se imprimirá en el lateral izquierdo de las constancias de los alumnos.</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="col-span-full pt-4 border-t border-gray-100">
                                        <label className="flex items-center gap-2 cursor-not-allowed opacity-50">
                                            <input
                                                type="checkbox"
                                                checked={modificarConstancia}
                                                disabled={true}
                                                onChange={(e) => setModificarConstancia(e.target.checked)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <span className="text-sm font-semibold text-gray-700">Modificar Constancia</span>
                                        </label>
                                    </div>

                                    {modificarConstancia && (
                                        <div className="col-span-full pt-4 border-t border-gray-100 space-y-4">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                <div className="flex flex-col justify-start">
                                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Plantilla de Constancia</label>
                                                    <div className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-black font-semibold text-sm">
                                                        Plantilla 1: Lateral Azul Marino (Predeterminada)
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 italic mt-2">Esta es la plantilla oficial utilizada para todos los cursos del portal y no se puede modificar.</p>
                                                </div>
                                                <div className="flex flex-col items-center justify-start bg-gray-50 border border-gray-200 rounded-2xl p-4 shadow-inner">
                                                    <span className="text-xs font-bold text-gray-500 mb-2">Vista Previa de la Plantilla</span>
                                                    <div className="w-full max-w-[480px] border border-gray-300 rounded-lg overflow-hidden bg-white shadow-md relative scale-95 origin-top">
                                                        <ResponsiveCertificateWrapper width={1056} height={816}>
                                                            {(() => {
                                                                const props = {
                                                                    alumnoNombre: "JUAN PÉREZ LÓPEZ",
                                                                    cursoTitulo: formData.titulo || "TÍTULO DEL CURSO DE EJEMPLO",
                                                                    cursoDuracion: formData.duracion || "40 Horas",
                                                                    fechaAprobacion: "24 de Noviembre de 2025",
                                                                    folio: "FOLIO-DEMO-12345",
                                                                    vigenciaStr: "24 de Noviembre de 2028 (3 años)",
                                                                    qrUrl: "https://cursos.grupoegac.com/",
                                                                    calificacion: "9.5",
                                                                    mostrarCalificacionConstancia: true,
                                                                    logoUrl: logoPreviewUrl || logoUrl,
                                                                    mostrarLogoConstancia: mostrarLogoConstancia && profile?.rol === 'institucion'
                                                                };
                                                                if (plantillaConstancia === 'modelo2') {
                                                                    return <CertificadoModelo2 {...props} />
                                                                }
                                                                if (plantillaConstancia === 'modelo3') {
                                                                    return <CertificadoModelo3 {...props} />
                                                                }
                                                                return <CertificadoDocument {...props} />
                                                            })()}
                                                        </ResponsiveCertificateWrapper>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Sección de Imagen de Portada y Vista Previa */}
                                    <div className="col-span-full pt-6 border-t border-gray-100 space-y-4">
                                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Imagen de Portada del Curso</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                            {/* Columna Izquierda: Subir imagen */}
                                            <div className="flex flex-col gap-3">
                                                <label className="block text-sm font-semibold text-gray-700">Subir Imagen Relacionada al Curso</label>
                                                <div className="flex items-center gap-4">
                                                    {imagenPreviewUrl ? (
                                                        <div className="relative w-36 h-24 border border-gray-300 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center p-1">
                                                            <img src={imagenPreviewUrl} alt="Vista previa de portada" className="w-full h-full object-cover rounded-lg" />
                                                            <button
                                                                type="button"
                                                                onClick={async () => {
                                                                    setArchivoImagen(null);
                                                                    setImagenPreviewUrl(null);
                                                                    setImagenUrl(null);
                                                                }}
                                                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className="w-36 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition p-2 text-center"
                                                            onClick={() => document.getElementById('portada-upload-input')?.click()}
                                                        >
                                                            <Plus className="w-6 h-6 text-gray-400" />
                                                            <span className="text-[10px] text-gray-500 font-semibold mt-1">Subir Portada</span>
                                                        </div>
                                                    )}
                                                    <input
                                                        id="portada-upload-input"
                                                        type="file"
                                                        accept="image/png, image/jpeg, image/webp"
                                                        className="hidden"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                setArchivoImagen(file);
                                                                setImagenPreviewUrl(URL.createObjectURL(file));
                                                                
                                                                // Upload immediately for instant URL reference in drafts
                                                                const fileExt = file.name.split('.').pop()
                                                                const fileName = `portada_curso_${id}_${Date.now()}.${fileExt}`
                                                                const { error: uploadError } = await supabase.storage
                                                                    .from('cursos_contenido')
                                                                    .upload(fileName, file, { contentType: file.type })
                                                                
                                                                if (!uploadError) {
                                                                    const publicUrl = supabase.storage.from('cursos_contenido').getPublicUrl(fileName).data.publicUrl;
                                                                    setImagenUrl(publicUrl);
                                                                } else {
                                                                    alert('Error al subir la imagen de portada: ' + uploadError.message);
                                                                }
                                                            }
                                                        }}
                                                    />
                                                    <div className="text-xs text-gray-500 max-w-xs leading-relaxed">
                                                        Soporta archivos PNG, JPG o WEBP. Relación de aspecto recomendada: 16:9 (horizontal). Esta imagen se mostrará en las tarjetas del catálogo.
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Columna Derecha: Vista Previa en Miniatura */}
                                            <div className="flex flex-col items-center justify-start bg-gray-50 border border-gray-200 rounded-2xl p-4 shadow-inner">
                                                <span className="text-xs font-bold text-gray-500 mb-3">Vista Previa de la Tarjeta del Curso</span>
                                                <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col w-[260px] hover:shadow-md transition-shadow">
                                                    <div className="relative aspect-video w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                                        {imagenPreviewUrl ? (
                                                            <img src={imagenPreviewUrl} alt="Portada" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                                                                <ImageIcon className="w-8 h-8 mb-1 text-gray-300" />
                                                                <span className="text-[10px] font-semibold">Sin imagen de portada</span>
                                                            </div>
                                                        )}
                                                        <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-xs rounded-full p-1 shadow-xs">
                                                            <Heart className="w-3.5 h-3.5 text-gray-400" />
                                                        </div>
                                                    </div>
                                                    <div className="p-4 flex-grow flex flex-col text-left">
                                                        <h4 className="font-bold text-gray-900 text-sm line-clamp-2 min-h-[40px] mb-1.5 leading-tight">
                                                            {formData.titulo || 'Título del Curso'}
                                                        </h4>
                                                        <div className="flex items-center gap-1.5 mb-2">
                                                            <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 overflow-hidden uppercase">
                                                                {profile?.fotografia_perfil ? (
                                                                    <img src={profile.fotografia_perfil} alt="Avatar" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    (formData.instructor || '').substring(0, 2).toUpperCase()
                                                                )}
                                                            </div>
                                                            <span className="text-[11px] text-gray-500 font-medium truncate">{formData.instructor || 'Instructor'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 mb-1">
                                                            <span className="text-[11px] font-bold text-amber-500">4.9</span>
                                                            <div className="flex text-amber-400">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star key={i} className="w-3 h-3 fill-current" />
                                                                ))}
                                                            </div>
                                                            <span className="text-[10px] text-gray-400 font-medium">(240)</span>
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 font-medium mb-3">
                                                            240 alumnos
                                                        </div>
                                                        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between">
                                                            <span className="text-xs font-semibold text-gray-400">Precio</span>
                                                            <span className="text-sm font-bold text-indigo-600">
                                                                {profile?.rol === 'capacitador' || Number(formData.precio) === 0 ? 'Gratis' : `$${Number(formData.precio).toFixed(2)} MXN`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-full pt-6 border-t border-gray-150 space-y-4">
                                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Reglas de Avance del Curso</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 flex items-start gap-3 shadow-sm">
                                                <input
                                                    type="checkbox"
                                                    id="bloquearAvance"
                                                    checked={bloquearAvance}
                                                    onChange={(e) => {
                                                        setBloquearAvance(e.target.checked);
                                                        if (!e.target.checked) {
                                                            setRequiereTareasAvance(false);
                                                            setRequiereExamenAvance(false);
                                                        }
                                                    }}
                                                    className="h-5 w-5 mt-0.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                                                />
                                                <label htmlFor="bloquearAvance" className="cursor-pointer">
                                                    <span className="block text-sm font-bold text-blue-950">Bloquear Avance de Módulos</span>
                                                    <span className="block text-xs text-blue-700 mt-1">El alumno debe ver los temas en orden secuencial obligatorio.</span>
                                                </label>
                                            </div>

                                            <div className={`border rounded-xl p-5 flex items-start gap-3 shadow-sm transition-all ${
                                                bloquearAvance 
                                                ? 'bg-amber-50/50 border-amber-100 opacity-100' 
                                                : 'bg-zinc-50 border-zinc-150 opacity-40 pointer-events-none'
                                            }`}>
                                                <input
                                                    type="checkbox"
                                                    id="requiereTareasAvance"
                                                    disabled={!bloquearAvance}
                                                    checked={requiereTareasAvance}
                                                    onChange={(e) => setRequiereTareasAvance(e.target.checked)}
                                                    className="h-5 w-5 mt-0.5 text-amber-600 focus:ring-amber-500 border-gray-300 rounded cursor-pointer"
                                                />
                                                <label htmlFor="requiereTareasAvance" className="cursor-pointer">
                                                    <span className="block text-sm font-bold text-amber-950">Obligar Tareas</span>
                                                    <span className="block text-xs text-amber-700 mt-1">Requiere entregar todas las tareas del módulo para desbloquear el siguiente.</span>
                                                </label>
                                            </div>

                                            <div className={`border rounded-xl p-5 flex items-start gap-3 shadow-sm transition-all ${
                                                bloquearAvance 
                                                ? 'bg-purple-50/50 border-purple-100 opacity-100' 
                                                : 'bg-zinc-50 border-zinc-150 opacity-40 pointer-events-none'
                                            }`}>
                                                <input
                                                    type="checkbox"
                                                    id="requiereExamenAvance"
                                                    disabled={!bloquearAvance}
                                                    checked={requiereExamenAvance}
                                                    onChange={(e) => setRequiereExamenAvance(e.target.checked)}
                                                    className="h-5 w-5 mt-0.5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
                                                />
                                                <label htmlFor="requiereExamenAvance" className="cursor-pointer">
                                                    <span className="block text-sm font-bold text-purple-950">Obligar Examen Modular</span>
                                                    <span className="block text-xs text-purple-700 mt-1">Requiere aprobar el examen modular con el puntaje mínimo para desbloquear el siguiente.</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visibilidad en el Aula de Alumnos */}
                                    <div className="col-span-full pt-6 border-t border-gray-150 space-y-4">
                                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Visibilidad en el Aula de Alumnos</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5 flex items-start gap-3 shadow-sm">
                                                <input
                                                    type="checkbox"
                                                    id="mostrarExamenFinal"
                                                    checked={mostrarExamenFinal}
                                                    onChange={(e) => setMostrarExamenFinal(e.target.checked)}
                                                    className="h-5 w-5 mt-0.5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
                                                />
                                                <label htmlFor="mostrarExamenFinal" className="cursor-pointer">
                                                    <span className="block text-sm font-bold text-emerald-950">Mostrar Examen Final</span>
                                                    <span className="block text-xs text-emerald-700 mt-1">El alumno podrá ver y realizar el examen final en su aula.</span>
                                                </label>
                                            </div>

                                            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 flex items-start gap-3 shadow-sm">
                                                <input
                                                    type="checkbox"
                                                    id="mostrarConstancia"
                                                    checked={mostrarConstancia}
                                                    onChange={(e) => setMostrarConstancia(e.target.checked)}
                                                    className="h-5 w-5 mt-0.5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                                                />
                                                <label htmlFor="mostrarConstancia" className="cursor-pointer">
                                                    <span className="block text-sm font-bold text-indigo-950">Habilitar Obtención de Constancia</span>
                                                    <span className="block text-xs text-indigo-700 mt-1">El alumno podrá visualizar y descargar el botón de su constancia digital.</span>
                                                </label>
                                            </div>

                                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 flex items-start gap-3 shadow-sm">
                                                <input
                                                    type="checkbox"
                                                    id="mostrarCalificacionConstancia"
                                                    checked={mostrarCalificacionConstancia}
                                                    onChange={(e) => setMostrarCalificacionConstancia(e.target.checked)}
                                                    className="h-5 w-5 mt-0.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                                                />
                                                <label htmlFor="mostrarCalificacionConstancia" className="cursor-pointer">
                                                    <span className="block text-sm font-bold text-blue-950">Mostrar Calificación en Constancia</span>
                                                    <span className="block text-xs text-blue-700 mt-1">Si está activo, la calificación final del examen se imprimirá en el certificado del alumno.</span>
                                                </label>
                                            </div>

                                            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-5 flex items-start gap-3 shadow-sm">
                                                <input
                                                    type="checkbox"
                                                    id="mostrarRevisionExamen"
                                                    checked={mostrarRevisionExamen}
                                                    onChange={(e) => setMostrarRevisionExamen(e.target.checked)}
                                                    className="h-5 w-5 mt-0.5 text-amber-600 focus:ring-amber-500 border-gray-300 rounded cursor-pointer"
                                                />
                                                <label htmlFor="mostrarRevisionExamen" className="cursor-pointer">
                                                    <span className="block text-sm font-bold text-amber-950">Mostrar Revisión de Examen</span>
                                                    <span className="block text-xs text-amber-700 mt-1">El alumno podrá consultar las respuestas correctas/incorrectas y notas de sus exámenes.</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button 
                                    type="button" 
                                    disabled={isSavingDraft}
                                    onClick={() => handleTabChange('modulos')} 
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md disabled:opacity-70 flex items-center gap-2"
                                >
                                    {isSavingDraft ? (
                                        <>
                                            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                            Guardando...
                                        </>
                                    ) : (
                                        'Siguiente: Clases y Temas'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tab 2: Temario y Clases (Módulos & PPT/Modular Exams) */}
                    <div className={activeTab === 'modulos' ? 'space-y-6 block' : 'hidden'}>
                        <div className="space-y-6">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-gray-900">2. Temario del Curso (Módulos)</h2>
                                    <p className="text-gray-500 text-xs mt-0.5">Organiza las clases de tu temario. Soporta archivos PDF, videos de YouTube, PowerPoint (.ppt, .pptx) o HTML.</p>
                                </div>
                                <button type="button" onClick={() => guardarCurso(true)} disabled={saving} className="flex-shrink-0 whitespace-nowrap px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-sm disabled:opacity-50 shadow-md">
                                    {saving ? 'Guardando...' : 'Guardar Borrador'}
                                </button>
                            </div>

                            <div className="space-y-6">
                                {modulos.map((modulo, index) => (
                                    <div key={index} className="bg-white border-2 border-zinc-150 p-6 rounded-2xl relative shadow-md hover:border-zinc-200 transition-all duration-300 ease-in-out">
                                        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                                            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => toggleModuloCollapsed(index)}>
                                                <button type="button" className="p-1 rounded-md hover:bg-gray-100 transition-colors text-gray-500 group-hover:text-gray-800">
                                                    {collapsedModulos[index] ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                                                </button>
                                                <h3 className="text-md font-bold text-gray-800 flex items-center gap-2">
                                                    <span className="bg-blue-600 text-white text-xs h-6 w-6 rounded-full flex items-center justify-center font-black">{index + 1}</span>
                                                    Clase / Objeto de Aprendizaje {modulo.id ? <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Existente</span> : <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">Nuevo</span>}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {modulos.length > 1 && (
                                                    <div className="flex gap-1.5 mr-3 border-r border-gray-200 pr-4">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => index > 0 && handleMoverModulo(index, 'subir')} 
                                                            disabled={index === 0}
                                                            className={`p-1.5 rounded-md border transition-all duration-200 ${index === 0 ? 'border-transparent text-gray-300 bg-gray-50 cursor-not-allowed opacity-50' : 'border-gray-200 text-gray-600 bg-white shadow-sm hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 hover:shadow-md'}`}
                                                            title="Subir módulo"
                                                        >
                                                            <ArrowUp className="h-4 w-4" />
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => index < modulos.length - 1 && handleMoverModulo(index, 'bajar')} 
                                                            disabled={index === modulos.length - 1}
                                                            className={`p-1.5 rounded-md border transition-all duration-200 ${index === modulos.length - 1 ? 'border-transparent text-gray-300 bg-gray-50 cursor-not-allowed opacity-50' : 'border-gray-200 text-gray-600 bg-white shadow-sm hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 hover:shadow-md'}`}
                                                            title="Bajar módulo"
                                                        >
                                                            <ArrowDown className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
                                                <button type="button" onClick={() => handleEliminarModulo(index)} className="text-red-500 hover:text-red-700 flex items-center text-xs font-bold transition">
                                                    <Trash2 className="h-4 w-4 mr-1" /> Eliminar Módulo
                                                </button>
                                            </div>
                                        </div>

                                        <div className={`grid grid-cols-1 gap-6 ${collapsedModulos[index] ? 'hidden' : ''}`}>
                                            <div className="col-span-full">
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Título de la Clase / Módulo</label>
                                                <input type="text" required placeholder="Ej. Introducción a la Fisiología" value={modulo.titulo} onChange={(e) => handleModuloChange(index, 'titulo', e.target.value)} className="w-full text-sm rounded-lg border-gray-300 p-2.5 border bg-white text-black" />
                                            </div>

                                            <div className="space-y-4 pt-2 col-span-full">
                                                <div className="flex justify-between items-center">
                                                    <label className="block text-xs font-extrabold text-gray-600 uppercase tracking-wider">Recursos del Módulo ({modulo.recursos.length})</label>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setActiveGammaModuloIdx(index);
                                                                setGammaError('');
                                                                setGammaSuccessResult(null);
                                                                setGammaPrompt('');
                                                                setGammaTitleInput('');
                                                            }}
                                                            className="px-3 py-1.5 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 border border-indigo-200 shadow-sm cursor-pointer"
                                                        >
                                                            <Sparkles className="h-3.5 w-3.5" /> Generar con IA (Gamma)
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAgregarRecurso(index)}
                                                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-extrabold transition flex items-center gap-1 border border-blue-200"
                                                        >
                                                            <Plus className="h-3.5 w-3.5" /> Añadir Recurso Educativo
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Alertas de presentaciones descargadas no utilizadas */}
                                                {getUnusedGenerationsForModule(index).map((gen) => (
                                                    <div key={gen.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-amber-800 shadow-sm">
                                                        <div className="flex items-start gap-3">
                                                            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                                                <Sparkles className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold">¡Presentación descargada sin utilizar!</p>
                                                                <p className="text-[11px] text-amber-700 font-medium">Generaste y descargaste la presentación "{gen.titulo || gen.prompt}" pero aún no la has agregado como recurso del módulo.</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 self-start md:self-auto flex-wrap">
                                                            <button
                                                                type="button"
                                                                onClick={() => setHiddenGenerations(prev => [...prev, gen.id])}
                                                                className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                                                            >
                                                                Lo sigo revisando
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const nuevosModulos = [...modulos];
                                                                    const displayTitle = gen.titulo ? gen.titulo : `Presentación: ${gen.prompt.length > 50 ? `${gen.prompt.substring(0, 50)}...` : gen.prompt}`;
                                                                    nuevosModulos[index].recursos.push({
                                                                        titulo: displayTitle,
                                                                        tipo: gen.formato === 'pdf' ? 'pdf' : 'ppt',
                                                                        url_contenido: gen.export_url,
                                                                        archivoPdf: null,
                                                                        descargable: true
                                                                    });
                                                                    setModulos(nuevosModulos);
                                                                    handleMarcarGammaUtilizado(gen.id);
                                                                }}
                                                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                                                            >
                                                                Utilizar esta presentación
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}

                                                {modulo.recursos.length === 0 ? (
                                                    <p className="text-xs text-gray-500 italic py-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">No hay recursos en este módulo. Los alumnos verán solo el título y la evaluación (si requiere).</p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {modulo.recursos.map((recurso, rIdx) => (
                                                            <div key={rIdx} className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4 relative shadow-sm hover:shadow transition">
                                                                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => rIdx > 0 && handleMoverRecurso(index, rIdx, 'subir')}
                                                                        disabled={rIdx === 0}
                                                                        className={`p-1.5 rounded-md border transition-all duration-200 ${rIdx === 0 ? 'border-transparent text-zinc-300 bg-zinc-50 cursor-not-allowed opacity-50' : 'border-zinc-200 text-zinc-500 bg-white shadow-sm hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 hover:shadow-md'}`}
                                                                        title="Subir recurso"
                                                                    >
                                                                        <ArrowUp className="h-4 w-4" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => rIdx < modulo.recursos.length - 1 && handleMoverRecurso(index, rIdx, 'bajar')}
                                                                        disabled={rIdx === modulo.recursos.length - 1}
                                                                        className={`p-1.5 rounded-md border transition-all duration-200 ${rIdx === modulo.recursos.length - 1 ? 'border-transparent text-zinc-300 bg-zinc-50 cursor-not-allowed opacity-50' : 'border-zinc-200 text-zinc-500 bg-white shadow-sm hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 hover:shadow-md'}`}
                                                                        title="Bajar recurso"
                                                                    >
                                                                        <ArrowDown className="h-4 w-4" />
                                                                    </button>
                                                                    <div className="w-px h-6 bg-zinc-200 mx-0.5"></div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleEliminarRecurso(index, rIdx)}
                                                                        className="p-1.5 rounded-md border border-zinc-200 text-zinc-400 bg-white shadow-sm hover:border-red-300 hover:text-red-500 hover:bg-red-50 hover:shadow-md transition-all duration-200"
                                                                        title="Eliminar recurso"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                </div>

                                                                {recurso.isPersisted && (
                                                                    <div className="mb-3">
                                                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                                                                            Recurso guardado (Para modificarlo, elimínalo y vuelve a añadirlo)
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Título del Recurso</label>
                                                                        <input
                                                                            type="text"
                                                                            required
                                                                            disabled={!!recurso.isPersisted}
                                                                            placeholder="Ej. Diapositivas de la clase o Lectura obligatoria"
                                                                            value={recurso.titulo || ''}
                                                                            onChange={(e) => handleRecursoChange(index, rIdx, 'titulo', e.target.value)}
                                                                            className="w-full text-xs rounded border-gray-300 p-2 border bg-white disabled:bg-zinc-100 disabled:text-zinc-500 text-black font-medium disabled:cursor-not-allowed"
                                                                        />
                                                                    </div>

                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Tipo de Recurso</label>
                                                                        <div className="flex flex-wrap gap-3">
                                                                            {(['video', 'pdf', 'ppt', 'html'] as const).map(tipoOpt => {
                                                                                const Icon = {
                                                                                    video: Play,
                                                                                    pdf: FileText,
                                                                                    ppt: Presentation,
                                                                                    html: Code
                                                                                }[tipoOpt];

                                                                                return (
                                                                                    <label 
                                                                                        key={tipoOpt} 
                                                                                        className={`flex items-center text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all select-none cursor-pointer ${
                                                                                            recurso.tipo === tipoOpt 
                                                                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs' 
                                                                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                                                        } ${recurso.isPersisted ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                                                    >
                                                                                        <input
                                                                                            type="radio"
                                                                                            disabled={!!recurso.isPersisted}
                                                                                            checked={recurso.tipo === tipoOpt}
                                                                                            onChange={() => handleRecursoChange(index, rIdx, 'tipo', tipoOpt)}
                                                                                            className="mr-2 h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                                        />
                                                                                        {Icon && <Icon className={`h-3.5 w-3.5 mr-1 shrink-0 ${recurso.tipo === tipoOpt ? 'text-indigo-650' : 'text-gray-400'}`} />}
                                                                                        {tipoOpt.toUpperCase()}
                                                                                    </label>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>

                                                                    <div className="col-span-full pt-1">
                                                                        {recurso.tipo === 'video' ? (
                                                                            <div key={`video-input-container-${index}-${rIdx}`} className="space-y-2">
                                                                                <div>
                                                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Enlace del Video (YouTube , Vimeo, Tiktok, Reels, etc. )</label>
                                                                                    <input
                                                                                        type="url"
                                                                                        required
                                                                                        disabled={!!recurso.isPersisted}
                                                                                        placeholder="https://www.youtube.com/watch?v=..."
                                                                                        value={recurso.url_contenido || ''}
                                                                                        onChange={(e) => handleRecursoChange(index, rIdx, 'url_contenido', e.target.value)}
                                                                                        className="w-full text-xs rounded border-gray-300 p-2 border bg-white disabled:bg-zinc-100 disabled:text-zinc-500 text-black disabled:cursor-not-allowed"
                                                                                    />
                                                                                </div>
                                                                                {!recurso.isPersisted && (
                                                                                    <div className="pt-1">
                                                                                        <SubidorBunny
                                                                                            title={recurso.titulo || `Clase - ${modulo.titulo}`}
                                                                                            onUploadComplete={(url) => handleRecursoChange(index, rIdx, 'url_contenido', url)}
                                                                                        />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            <div key={`file-input-container-${index}-${rIdx}`}>
                                                                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                                                                                    <span>{recurso.tipo === 'html' ? 'Seleccionar archivo HTML' : recurso.tipo === 'ppt' ? 'Seleccionar presentación PowerPoint (.ppt, .pptx)' : 'Seleccionar archivo PDF'}</span>
                                                                                    {recurso.url_contenido && (
                                                                                        <a href={recurso.url_contenido} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold text-[9px] lowercase flex items-center gap-0.5">
                                                                                            (Ver archivo actual ↗)
                                                                                        </a>
                                                                                    )}
                                                                                </label>
                                                                                <input
                                                                                    type="file"
                                                                                    required={!recurso.url_contenido}
                                                                                    disabled={!!recurso.isPersisted}
                                                                                    accept={
                                                                                        recurso.tipo === 'html'
                                                                                            ? '.html,.htm,text/html'
                                                                                            : recurso.tipo === 'ppt'
                                                                                                ? '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation'
                                                                                                : '.pdf,application/pdf'
                                                                                    }
                                                                                    onChange={(e) => handleRecursoChange(index, rIdx, 'archivoPdf', e.target.files?.[0] || null)}
                                                                                    className="w-full text-xs text-gray-500 border border-gray-200 p-1 rounded bg-white file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                                                />
                                                                            </div>
                                                                        )}

                                                                        {recurso.tipo !== 'video' && (
                                                                            <div className="mt-3 flex items-center gap-2">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    id={`descargable-${index}-${rIdx}`}
                                                                                    disabled={!!recurso.isPersisted}
                                                                                    checked={recurso.descargable || false}
                                                                                    onChange={(e) => handleRecursoChange(index, rIdx, 'descargable', e.target.checked)}
                                                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                                                />
                                                                                <label htmlFor={`descargable-${index}-${rIdx}`} className="text-xs font-semibold text-gray-700 cursor-pointer select-none">
                                                                                    Permitir descarga del archivo por los alumnos
                                                                                </label>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Optional Modular Exam Box */}
                                        <div className="mt-6 pt-4 border-t border-zinc-100">
                                            <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={modulo.requiereExamen}
                                                        onChange={(e) => handleModuloChange(index, 'requiereExamen', e.target.checked)}
                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                    />
                                                    <span className="text-sm font-bold text-indigo-900 flex items-center gap-1.5">
                                                        <BrainCircuit className="h-4 w-4" />
                                                        ¿Este módulo requiere un examen de comprensión?
                                                    </span>
                                                </label>
                                                    {modulo.requiereExamen && (
                                                        <button type="button" onClick={() => toggleExamenCollapsed(index)} className="p-1 rounded-md hover:bg-indigo-100 transition-colors text-indigo-500 hover:text-indigo-800">
                                                            {collapsedExamenes[index] ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                                                        </button>
                                                    )}
                                                </div>

                                                {modulo.requiereExamen && (
                                                    <div className={`mt-4 pl-0 sm:pl-6 border-l-0 sm:border-l-2 border-indigo-200 space-y-4 ${collapsedExamenes[index] ? 'hidden' : ''}`}>
                                                        <div className="bg-amber-50 border border-amber-250 rounded-xl p-4 flex gap-2.5 items-start text-left shadow-sm">
                                                            <span className="text-amber-600 text-sm flex-shrink-0 mt-0.5">⚠️</span>
                                                            <div>
                                                                <h4 className="text-xs font-bold text-amber-950">Requisito Obligatorio del Examen</h4>
                                                                <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                                                                    Para poder registrar este curso, cada examen activado (modular o final) debe contener <strong>al menos una pregunta de opción múltiple</strong>. La calificación del alumno se obtendrá <strong>únicamente</strong> de las preguntas de opción múltiple. Las preguntas de respuesta libre se registrarán para tu revisión, pero no sumarán puntos a la calificación automática.
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap justify-between items-center gap-4 border-b border-indigo-100/50 pb-3">
                                                            <div className="flex items-center gap-2">
                                                                <label className="block text-xs font-semibold text-gray-700">Calificación Mínima Aprobatoria (0-100):</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    value={modulo.examenMinAprobacion}
                                                                    onChange={(e) => handleModuloChange(index, 'examenMinAprobacion', Number(e.target.value))}
                                                                    className="w-20 text-xs rounded border-gray-300 p-1.5 border bg-white text-black"
                                                                />
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-3">
                                                                <div className="flex flex-col items-start">
                                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Cargar desde PDF:</label>
                                                                    <input
                                                                        type="file"
                                                                        accept=".pdf,application/pdf"
                                                                        onChange={(e) => handleUploadExamenModuloHelper(e, index)}
                                                                        disabled={isParsing}
                                                                        className="block w-48 text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-semibold file:bg-white file:text-indigo-700 hover:file:bg-indigo-100 border border-indigo-300 rounded bg-white p-1 cursor-pointer"
                                                                    />
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAgregarPreguntaModulo(index)}
                                                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition flex items-center gap-1 shadow-sm mt-3.5"
                                                                >
                                                                    <Plus className="h-3.5 w-3.5" /> Agregar Pregunta
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-indigo-100/50">
                                                            <div>
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={modulo.conTiempo || false}
                                                                        onChange={(e) => handleModuloChange(index, 'conTiempo', e.target.checked)}
                                                                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                                                    />
                                                                    <span className="text-sm font-semibold text-gray-750">
                                                                        Activar límite de tiempo para responder
                                                                    </span>
                                                                </label>
                                                                {modulo.conTiempo && (
                                                                    <div className="mt-2 ml-6 flex items-center gap-2">
                                                                        <input
                                                                            type="number"
                                                                            min="2"
                                                                            max="300"
                                                                            value={modulo.tiempoExamen === undefined ? 20 : modulo.tiempoExamen}
                                                                            onChange={(e) => handleModuloChange(index, 'tiempoExamen', e.target.value === '' ? '' : Number(e.target.value))}
                                                                            className="w-20 rounded border-gray-300 p-1 border bg-white text-black text-xs"
                                                                        />
                                                                        <span className="text-xs text-gray-505">minutos (Máx. 300)</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div>
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={modulo.seguridadAumentada || false}
                                                                        onChange={(e) => handleModuloChange(index, 'seguridadAumentada', e.target.checked)}
                                                                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                                                    />
                                                                    <span className="text-sm font-semibold text-gray-750">
                                                                        🛡️ Seguridad Aumentada (Pantalla Completa Obligatoria)
                                                                    </span>
                                                                </label>
                                                                {modulo.seguridadAumentada && (
                                                                    <div className="mt-2 ml-6 flex items-center gap-2">
                                                                        <span className="text-xs text-gray-650">Pestañas permitidas:</span>
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            max="20"
                                                                            value={modulo.maxCambiosPantalla === undefined ? 2 : modulo.maxCambiosPantalla}
                                                                            onChange={(e) => handleModuloChange(index, 'maxCambiosPantalla', e.target.value === '' ? '' : Number(e.target.value))}
                                                                            className="w-16 rounded border-gray-300 p-1 border bg-white text-black text-xs"
                                                                        />
                                                                        <span className="text-xs text-gray-500 font-medium">intentos máximos antes del auto-reprobado.</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-indigo-100/50">
                                                            <label className="text-sm font-semibold text-gray-755">Intentos permitidos para el examen:</label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max="50"
                                                                value={modulo.intentosPermitidos === undefined ? 2 : modulo.intentosPermitidos}
                                                                onChange={(e) => handleModuloChange(index, 'intentosPermitidos', e.target.value === '' ? '' : Number(e.target.value))}
                                                                className="w-20 rounded border-gray-300 p-1 border bg-white text-black text-xs"
                                                            />
                                                        </div>

                                                        <div className="flex justify-between items-center mt-4">
                                                            <a href="/ejemplo-examen.html" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-850 underline underline-offset-2 transition-colors">
                                                                📄 Ver ejemplo del formato de examen PDF
                                                            </a>
                                                            {isParsing && (
                                                                <p className="text-[10px] font-bold text-indigo-600 animate-pulse italic">
                                                                    Nuestra IA está extrayendo las preguntas del PDF para este módulo...
                                                                </p>
                                                            )}
                                                        </div>

                                                        {modulo.examenPreguntas.length === 0 ? (
                                                            <p className="text-xs text-indigo-600/80 italic text-center py-4 bg-white/40 border border-dashed border-indigo-100 rounded-lg">No hay preguntas registradas. Haz clic en "Agregar Pregunta" para iniciar.</p>
                                                        ) : (
                                                            <div className="space-y-4">
                                                                {modulo.examenPreguntas.map((pregunta, pIdx) => (
                                                                    <div key={pIdx} className="bg-white p-4 rounded-xl border border-indigo-100 relative shadow-sm">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleEliminarPreguntaModulo(index, pIdx)}
                                                                            className="absolute top-3 right-3 text-zinc-300 hover:text-red-500 transition"
                                                                            title="Eliminar pregunta"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>

                                                                        <div className="grid grid-cols-1 gap-3">
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                                <div>
                                                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Pregunta #{pIdx + 1}</label>
                                                                                    <textarea
                                                                                        required
                                                                                        rows={2}
                                                                                        placeholder="Ej. ¿Qué estructura celular es la encargada de producir energía?"
                                                                                        value={pregunta.pregunta || ''}
                                                                                        onChange={(e) => handlePreguntaModuloChange(index, pIdx, 'pregunta', e.target.value)}
                                                                                        className="w-full text-xs rounded border-gray-200 p-2 border bg-white text-black font-medium resize-y min-h-[2.5rem]"
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Tipo de Pregunta</label>
                                                                                    <select
                                                                                        value={pregunta.tipo_pregunta || 'opcion_multiple'}
                                                                                        onChange={(e) => handlePreguntaModuloChange(index, pIdx, 'tipo_pregunta', e.target.value as any)}
                                                                                        className="w-full text-xs rounded border-gray-200 p-2 border bg-white text-black"
                                                                                    >
                                                                                        <option value="opcion_multiple">🔘 Opción Múltiple</option>
                                                                                        
                                                                                    </select>
                                                                                </div>
                                                                            </div>

                                                                            {pregunta.tipo_pregunta !== 'respuesta_libre' ? (
                                                                                <>
                                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                                        {(['a', 'b', 'c', 'd'] as const).map(opt => (
                                                                                            <div key={opt}>
                                                                                                <label className="block text-[9px] font-semibold text-gray-400 uppercase">Opción {opt.toUpperCase()}</label>
                                                                                                <input
                                                                                                    type="text"
                                                                                                    required={opt === 'a' || opt === 'b'}
                                                                                                    placeholder={`Opción ${opt.toUpperCase()}`}
                                                                                                    value={(pregunta as any)[`opcion_${opt}`] || ''}
                                                                                                    onChange={(e) => handlePreguntaModuloChange(index, pIdx, `opcion_${opt}` as any, e.target.value)}
                                                                                                    className="w-full text-xs rounded border-gray-200 p-2 border bg-white text-black"
                                                                                                />
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>

                                                                                    <div className="flex items-center gap-3 border-t border-zinc-100 pt-2 text-xs">
                                                                                        <span className="font-bold text-indigo-900">Respuesta Correcta:</span>
                                                                                        <div className="flex gap-4">
                                                                                            {['A', 'B', 'C', 'D'].map(letter => (
                                                                                                <label key={letter} className="flex items-center gap-1 cursor-pointer">
                                                                                                    <input
                                                                                                        type="radio"
                                                                                                        name={`correct_${index}_${pIdx}`}
                                                                                                        checked={pregunta.respuesta_correcta === letter}
                                                                                                        onChange={() => handlePreguntaModuloChange(index, pIdx, 'respuesta_correcta', letter)}
                                                                                                        className="h-3 w-3 text-indigo-600"
                                                                                                    />
                                                                                                    <span className={`font-black ${pregunta.respuesta_correcta === letter ? 'text-indigo-600' : 'text-gray-400'}`}>{letter}</span>
                                                                                                </label>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                </>
                                                                            ) : (
                                                                                <div className="bg-indigo-50/40 p-3 rounded-lg border border-dashed border-indigo-150 text-[11px] text-indigo-700 italic">
                                                                                    📝 Esta pregunta es de respuesta libre. Se mostrará una caja de texto al alumno y se aprobará de forma no-bloqueante al escribir cualquier respuesta no vacía.
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Modular Homework/Task Box */}
                                        <div className="mt-4 pt-4 border-t border-zinc-100">
                                            <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!modulo.requiereTarea}
                                                            onChange={(e) => handleModuloChange(index, 'requiereTarea', e.target.checked)}
                                                            className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                                                        />
                                                        <span className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                                                            <FileText className="h-4 w-4 text-amber-700" />
                                                            ¿Este módulo requiere que el alumno entregue una tarea o práctica convencional?
                                                        </span>
                                                    </label>
                                                    {modulo.requiereTarea && (
                                                        <button type="button" onClick={() => toggleTareaCollapsed(index)} className="p-1 rounded-md hover:bg-amber-100 transition-colors text-amber-600 hover:text-amber-800">
                                                            {collapsedTareas[index] ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                                                        </button>
                                                    )}
                                                </div>

                                                {modulo.requiereTarea && (
                                                    <div className={`mt-4 pl-0 sm:pl-6 border-l-0 sm:border-l-2 border-amber-250 space-y-4 ${collapsedTareas[index] ? 'hidden' : ''}`}>
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-700 mb-1">Instrucciones de la Tarea:</label>
                                                            <textarea
                                                                rows={3}
                                                                placeholder="Escribe detalladamente las instrucciones de lo que el alumno debe realizar y entregar..."
                                                                value={modulo.tareaInstrucciones || ''}
                                                                onChange={(e) => handleModuloChange(index, 'tareaInstrucciones', e.target.value)}
                                                                className="w-full text-xs rounded border-gray-300 p-2.5 border bg-white text-black font-semibold shadow-inner focus:border-amber-400"
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-700 mb-1">Puntos a evaluar (separados por coma o lista):</label>
                                                            <textarea
                                                                rows={2}
                                                                placeholder="Ej. Claridad en la explicación, Capturas de pantalla adjuntas, Código fuente funcional"
                                                                value={modulo.tareaPuntos || ''}
                                                                onChange={(e) => handleModuloChange(index, 'tareaPuntos', e.target.value)}
                                                                className="w-full text-xs rounded border-gray-300 p-2.5 border bg-white text-black font-semibold resize-y shadow-inner focus:border-amber-400"
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

{/* Modular Questionnaire Box */}
                                        <div className={`mt-4 pt-4 border-t border-zinc-100 ${collapsedModulos[index] ? 'hidden' : ''}`}>
                                            <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!modulo.requiereCuestionario}
                                                        onChange={(e) => handleModuloChange(index, 'requiereCuestionario', e.target.checked)}
                                                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                                    />
                                                    <span className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                                                        <MessageSquare className="h-4 w-4 text-emerald-700" />
                                                        ¿Este módulo requiere un Cuestionario de preguntas abiertas?
                                                    </span>
                                                </label>
                                                    {modulo.requiereCuestionario && (
                                                        <button type="button" onClick={() => toggleCuestionarioCollapsed(index)} className="p-1 rounded-md hover:bg-emerald-100 transition-colors text-emerald-600 hover:text-emerald-800">
                                                            {collapsedCuestionarios[index] ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                                                        </button>
                                                    )}
                                                </div>

                                                {modulo.requiereCuestionario && (
                                                    <div className={`mt-4 pl-0 sm:pl-6 border-l-0 sm:border-l-2 border-emerald-250 space-y-4 ${collapsedCuestionarios[index] ? 'hidden' : ''}`}>
                                                        <div className="flex justify-between items-center border-b border-emerald-100 pb-2">
                                                            <p className="text-xs text-emerald-800 font-semibold">Configura las preguntas que el alumno deberá responder con texto libre.</p>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAgregarPreguntaCuestionario(index)}
                                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition flex items-center gap-1 shadow-sm"
                                                            >
                                                                <Plus className="h-3.5 w-3.5" /> Agregar Pregunta
                                                            </button>
                                                        </div>

                                                        {!modulo.cuestionarioPreguntas || modulo.cuestionarioPreguntas.length === 0 ? (
                                                            <p className="text-xs text-emerald-600/80 italic text-center py-4 bg-white/40 border border-dashed border-emerald-200 rounded-lg">No hay preguntas en el cuestionario. Haz clic en "Agregar Pregunta" para iniciar.</p>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                {modulo.cuestionarioPreguntas.map((pregunta, pIdx) => (
                                                                    <div key={pIdx} className="bg-white p-3 rounded-lg border border-emerald-200 relative shadow-sm flex items-start gap-3">
                                                                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded">#{pIdx + 1}</span>
                                                                        <div className="flex-1">
                                                                            <textarea
                                                                                required
                                                                                rows={2}
                                                                                placeholder="Escribe la pregunta abierta aquí..."
                                                                                value={pregunta.pregunta || ''}
                                                                                onChange={(e) => handlePreguntaCuestionarioChange(index, pIdx, e.target.value)}
                                                                                className="w-full text-xs rounded border-gray-200 p-2 border bg-white text-black font-medium resize-y"
                                                                            />
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleEliminarPreguntaCuestionario(index, pIdx)}
                                                                            className="text-zinc-300 hover:text-red-500 transition mt-1"
                                                                            title="Eliminar pregunta"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

{/* Modular Puzzle/Game Box */}
                                        <div className="mt-4 pt-4 border-t border-zinc-100">
                                            <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!modulo.requierePuzzle}
                                                            onChange={(e) => handleModuloChange(index, 'requierePuzzle', e.target.checked)}
                                                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                        />
                                                        <span className="text-sm font-bold text-orange-900 flex items-center gap-1.5">
                                                            <Gamepad2 className="h-4 w-4 text-orange-700" />
                                                            ¿Este módulo requiere un Puzle (Juego Interactivo)?
                                                        </span>
                                                    </label>
                                                    {modulo.requierePuzzle && (
                                                        <button type="button" onClick={() => togglePuzzleCollapsed(index)} className="p-1 rounded-md hover:bg-orange-100 transition-colors text-orange-600 hover:text-orange-800">
                                                            {collapsedPuzzles[index] ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                                                        </button>
                                                    )}
                                                </div>

                                                {modulo.requierePuzzle && (
                                                    <div className={`mt-4 pl-0 sm:pl-6 border-l-0 sm:border-l-2 border-orange-250 space-y-4 ${collapsedPuzzles[index] ? 'hidden' : ''}`}>
                                                        {/* Lista dinámica de preguntas y respuestas del Puzle */}
                                                        <div className="space-y-4 pt-2">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-xs font-bold text-gray-700">Preguntas de la secuencia del Puzle:</span>
                                                                {(modulo.puzzlePuzzles || [{ pregunta: '', respuesta: '', tipo: 'anagrama' }]).length < 5 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newPuzzles = [...(modulo.puzzlePuzzles || [{ pregunta: '', respuesta: '', tipo: 'anagrama' }])];
                                                                            const lastType = newPuzzles[newPuzzles.length - 1]?.tipo || 'anagrama';
                                                                            newPuzzles.push({ pregunta: '', respuesta: '', tipo: lastType });
                                                                            handleModuloChange(index, 'puzzlePuzzles', newPuzzles);
                                                                        }}
                                                                        className="px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold rounded shadow-sm transition"
                                                                    >
                                                                        + Agregar Pregunta
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {(modulo.puzzlePuzzles || [{ pregunta: '', respuesta: '', tipo: 'anagrama' }]).map((pItem, pIdx) => (
                                                                <div key={pIdx} className="bg-orange-50/20 p-4 border border-orange-100 rounded-xl space-y-3.5 relative shadow-sm">
                                                                    <div className="flex flex-wrap items-center justify-between gap-3 bg-orange-500/5 p-2 rounded-lg border border-orange-500/10">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-xs font-black text-orange-900 bg-orange-250 px-2.5 py-1 rounded">Pregunta #{pIdx + 1}</span>
                                                                            <div className="flex items-center gap-1.5">
                                                                                <label className="text-[10px] font-black text-orange-900 uppercase">Tipo:</label>
                                                                                <select
                                                                                    value={pItem.tipo || 'anagrama'}
                                                                                    onChange={(e) => {
                                                                                        const newPuzzles = [...(modulo.puzzlePuzzles || [{ pregunta: '', respuesta: '', tipo: 'anagrama' }])];
                                                                                        newPuzzles[pIdx].tipo = e.target.value as 'anagrama' | 'ahorcado' | 'sopa';
                                                                                        handleModuloChange(index, 'puzzlePuzzles', newPuzzles);
                                                                                        if (pIdx === 0) handleModuloChange(index, 'puzzleTipo', e.target.value);
                                                                                    }}
                                                                                    className="text-xs rounded border-gray-300 py-1 px-2 border bg-white text-black font-semibold shadow-sm focus:border-orange-400"
                                                                                >
                                                                                    <option value="anagrama">Anagrama</option>
                                                                                    <option value="ahorcado">Ahorcado</option>
                                                                                    <option value="sopa">Ordenar Sílabas</option>
                                                                                </select>
                                                                            </div>
                                                                        </div>
                                                                        {(modulo.puzzlePuzzles || [{ pregunta: '', respuesta: '', tipo: 'anagrama' }]).length > 1 && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const newPuzzles = [...(modulo.puzzlePuzzles || [{ pregunta: '', respuesta: '', tipo: 'anagrama' }])];
                                                                                    newPuzzles.splice(pIdx, 1);
                                                                                    
                                                                                    const nuevosModulos = [...modulos];
                                                                                    nuevosModulos[index] = {
                                                                                        ...nuevosModulos[index],
                                                                                        puzzlePuzzles: newPuzzles,
                                                                                        puzzlePregunta: newPuzzles[0]?.pregunta || '',
                                                                                        puzzleRespuesta: newPuzzles[0]?.respuesta || '',
                                                                                        puzzleTipo: newPuzzles[0]?.tipo || 'anagrama'
                                                                                    };
                                                                                    setModulos(nuevosModulos);
                                                                                }}
                                                                                className="p-1 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                                                                                title="Eliminar pregunta"
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                        <div>
                                                                            <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase tracking-wider">Pregunta o Pista:</label>
                                                                            <textarea
                                                                                rows={3}
                                                                                placeholder="Escribe aquí la pregunta o pista que verá el alumno..."
                                                                                value={pItem.pregunta || ''}
                                                                                onChange={(e) => {
                                                                                    const newPuzzles = [...(modulo.puzzlePuzzles || [{ pregunta: '', respuesta: '', tipo: 'anagrama' }])];
                                                                                    newPuzzles[pIdx].pregunta = e.target.value;
                                                                                    handleModuloChange(index, 'puzzlePuzzles', newPuzzles);
                                                                                    if (pIdx === 0) handleModuloChange(index, 'puzzlePregunta', e.target.value);
                                                                                }}
                                                                                className="w-full text-xs rounded border-gray-300 p-2.5 border bg-white text-black font-semibold shadow-inner focus:border-orange-400"
                                                                                required
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase tracking-wider">Respuesta (Palabra única):</label>
                                                                            <textarea
                                                                                rows={3}
                                                                                placeholder="Escribe la palabra exacta que resolverá el puzle..."
                                                                                value={pItem.respuesta || ''}
                                                                                onChange={(e) => {
                                                                                    const val = e.target.value
                                                                                        .toUpperCase()
                                                                                        .replace(/\s+/g, '') // Quitar espacios
                                                                                        .normalize("NFD")
                                                                                        .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
                                                                                        .replace(/[^A-Z0-9]/g, ""); // Solo dejar letras y números

                                                                                    const newPuzzles = [...(modulo.puzzlePuzzles || [{ pregunta: '', respuesta: '', tipo: 'anagrama' }])];
                                                                                    newPuzzles[pIdx].respuesta = val;
                                                                                    handleModuloChange(index, 'puzzlePuzzles', newPuzzles);
                                                                                    if (pIdx === 0) handleModuloChange(index, 'puzzleRespuesta', val);
                                                                                }}
                                                                                className="w-full text-xs rounded border-gray-300 p-2.5 border bg-white text-black font-semibold shadow-inner focus:border-orange-400"
                                                                                required
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-700 mb-1">Puntos del Puzle:</label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max="100"
                                                                placeholder="Ej. 10"
                                                                value={modulo.puzzlePuntos || ''}
                                                                onChange={(e) => handleModuloChange(index, 'puzzlePuntos', e.target.value)}
                                                                className="w-full text-xs rounded border-gray-300 p-2.5 border bg-white text-black font-semibold shadow-inner focus:border-orange-400"
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={handleAgregarModulo}
                                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 font-bold hover:border-blue-400 hover:text-blue-600 transition flex items-center justify-center gap-2 bg-zinc-50"
                            >
                                <Plus className="h-5 w-5" /> Agregar Nuevo Módulo Académico
                            </button>

                            <div className="flex justify-between pt-4">
                                <button 
                                    type="button" 
                                    disabled={isSavingDraft}
                                    onClick={() => handleTabChange('info')} 
                                    className="px-6 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl transition hover:bg-zinc-50 disabled:opacity-75"
                                >
                                    Atrás
                                </button>
                                <button 
                                    type="button" 
                                    disabled={isSavingDraft}
                                    onClick={() => handleTabChange('examen')} 
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md disabled:opacity-70 flex items-center gap-2"
                                >
                                    {isSavingDraft ? (
                                        <>
                                            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                            Guardando...
                                        </>
                                    ) : (
                                        'Siguiente: Examen Final'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tab 3: Examen Final */}
                    <div className={activeTab === 'examen' ? 'space-y-6 block' : 'hidden'}>
                        <div className="space-y-6">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-gray-900">3. Configuración del Examen Final del Curso</h2>
                                    <p className="text-gray-500 text-xs mt-0.5">El examen final habilitará la generación de constancias premium de Grupo Egac para los alumnos inscritos.</p>
                                </div>
                                <button type="button" onClick={() => guardarCurso(true)} disabled={saving} className="flex-shrink-0 whitespace-nowrap px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-sm disabled:opacity-50 shadow-md">
                                    {saving ? 'Guardando...' : 'Guardar Borrador'}
                                 </button>
                            </div>

                            <div className="bg-green-55/40 border border-green-200 rounded-2xl p-6 shadow-md">
                                <label className="flex items-center cursor-pointer mb-2">
                                    <input
                                        type="checkbox"
                                        checked={requiereExamen}
                                        onChange={(e) => setRequiereExamen(e.target.checked)}
                                        className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2.5 block text-md font-bold text-green-950">
                                        Este curso requiere que el alumno apruebe un examen final
                                    </span>
                                </label>

                                {requiereExamen && (
                                    <div className="mt-6 sm:pl-6 border-l-0 sm:border-l-2 border-green-300 space-y-6">
                                        <div className="bg-amber-50 border border-amber-250 rounded-xl p-4 flex gap-2.5 items-start text-left shadow-sm">
                                            <span className="text-amber-600 text-sm flex-shrink-0 mt-0.5">⚠️</span>
                                            <div>
                                                <h4 className="text-xs font-bold text-amber-950">Requisito Obligatorio del Examen</h4>
                                                <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                                                    Para poder registrar este curso, cada examen activado (modular o final) debe contener <strong>al menos una pregunta de opción múltiple</strong>. La calificación del alumno se obtendrá <strong>únicamente</strong> de las preguntas de opción múltiple. Las preguntas de respuesta libre se registrarán para tu revisión, pero no sumarán puntos a la calificación automática.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Calificación Mínima Aprobatoria (0 - 100)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={minAprobacion}
                                                    onChange={(e) => setMinAprobacion(e.target.value === '' ? '' : Number(e.target.value))}
                                                    className="w-full sm:w-32 rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-3 text-black bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Automatización: Cargar examen PDF para leer preguntas</label>
                                                <input
                                                    type="file"
                                                    accept=".pdf,application/pdf"
                                                    onChange={handleUploadExamenHelper}
                                                    disabled={isParsing}
                                                    className="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-white file:text-green-700 hover:file:bg-green-100 border border-green-300 rounded-lg bg-white p-1.5 cursor-pointer"
                                                />
                                                {isParsing && <p className="text-[10px] font-bold text-green-600 mt-1 animate-pulse italic">Nuestra IA está extrayendo las preguntas del PDF...</p>}
                                                <a href="/ejemplo-examen.html" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 transition-colors">
                                                    📄 Ver ejemplo del formato correcto del PDF
                                                </a>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-green-200/50">
                                            <div>
                                                <label className="flex items-center cursor-pointer mb-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={conTiempo}
                                                        onChange={(e) => setConTiempo(e.target.checked)}
                                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                                    />
                                                    <span className="ml-2 block text-sm font-semibold text-gray-700">
                                                        Activar límite de tiempo para responder
                                                    </span>
                                                </label>
                                                {conTiempo && (
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min="2"
                                                            max="300"
                                                            value={tiempoExamen}
                                                            onChange={(e) => setTiempoExamen(e.target.value === '' ? '' : Number(e.target.value))}
                                                            className="w-24 rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2.5 text-black bg-white"
                                                        />
                                                        <span className="text-sm text-gray-600">minutos (Máx. 300)</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <input
                                                        type="checkbox"
                                                        id="seguridadAumentada"
                                                        checked={seguridadAumentada}
                                                        onChange={(e) => setSeguridadAumentada(e.target.checked)}
                                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                                    />
                                                    <label htmlFor="seguridadAumentada" className="text-sm font-semibold text-gray-750 cursor-pointer">
                                                        🛡️ Seguridad Aumentada (Pantalla Completa Obligatoria)
                                                    </label>
                                                </div>
                                                {seguridadAumentada && (
                                                    <div className="mt-2 pl-6">
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-xs text-gray-600">Pestañas permitidas:</label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max="10"
                                                                value={maxCambios}
                                                                onChange={(e) => setMaxCambios(e.target.value === '' ? '' : Number(e.target.value))}
                                                                className="w-20 rounded border-gray-300 p-1 border text-black bg-white"
                                                            />
                                                            <span className="text-xs text-gray-500">intentos máximos antes del auto-reprobado.</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-green-200/50">
                                            <div className="flex items-center gap-2 mb-4">
                                                <label className="text-sm font-semibold text-gray-700">Intentos permitidos para el examen:</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="50"
                                                    value={intentosPermitidos}
                                                    onChange={(e) => setIntentosPermitidos(e.target.value === '' ? '' : Number(e.target.value))}
                                                    className="w-20 rounded-lg border-gray-300 p-1.5 border text-black bg-white"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-green-200/50">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-sm font-bold text-green-950 flex items-center gap-2">
                                                    <FileText className="h-4 w-4" /> Reactivos Académicos ({preguntasExtraidas.length})
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={handleAgregarPreguntaManual}
                                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-md"
                                                >
                                                    <Plus className="h-4 w-4" /> Agregar Pregunta Final
                                                </button>
                                            </div>

                                            {preguntasExtraidas.length === 0 ? (
                                                <p className="text-xs text-green-700 italic text-center py-6 bg-white/50 border border-dashed border-green-200 rounded-xl">No hay preguntas reactivas finales añadidas aún. Sube un PDF o añádelas manualmente.</p>
                                            ) : (
                                                <div className="space-y-4">
                                                    {preguntasExtraidas.map((p, i) => (
                                                        <div key={i} className="bg-white p-4 rounded-xl border border-green-100 shadow-sm relative hover:border-green-200 transition">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEliminarPreguntaManual(i)}
                                                                className="absolute top-3 right-3 text-zinc-300 hover:text-red-500 transition"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>

                                                            <div className="grid grid-cols-1 gap-3">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Pregunta #{i + 1}</span>
                                                                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Texto de la Pregunta</label>
                                                                        </div>
                                                                        <textarea 
                                                                            required
                                                                            rows={2}
                                                                            value={p.pregunta || ''} 
                                                                            onChange={(e) => handlePreguntaChange(i, 'pregunta', e.target.value)}
                                                                            placeholder="Escribe la pregunta..."
                                                                            className="w-full text-xs rounded border-gray-200 p-2 border bg-white text-black font-medium resize-y min-h-[2.5rem]"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tipo de Pregunta</label>
                                                                        <select
                                                                            value={p.tipo_pregunta || 'opcion_multiple'}
                                                                            onChange={(e) => handlePreguntaChange(i, 'tipo_pregunta', e.target.value as any)}
                                                                            className="w-full text-xs rounded border-gray-200 p-2.5 border bg-white text-black"
                                                                        >
                                                                            <option value="opcion_multiple">🔘 Opción Múltiple</option>
                                                                            
                                                                        </select>
                                                                    </div>
                                                                </div>

                                                                {p.tipo_pregunta !== 'respuesta_libre' ? (
                                                                    <>
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                            {(['a', 'b', 'c', 'd'] as const).map(opt => (
                                                                                <div key={opt}>
                                                                                    <label className="block text-[9px] font-semibold text-gray-400 uppercase">Opción {opt.toUpperCase()}</label>
                                                                                    <input 
                                                                                        type="text" 
                                                                                        required={opt === 'a' || opt === 'b'}
                                                                                        value={(p as any)[`opcion_${opt}`] || ''} 
                                                                                        onChange={(e) => handlePreguntaChange(i, `opcion_${opt}` as any, e.target.value)}
                                                                                        className="w-full text-xs rounded border-gray-200 p-2 border bg-white text-black"
                                                                                    />
                                                                                </div>
                                                                            ))}
                                                                        </div>

                                                                        <div className="flex items-center gap-4 pt-2 border-t border-gray-50 text-xs">
                                                                            <span className="font-bold text-emerald-800">Respuesta Correcta:</span>
                                                                            <div className="flex gap-4">
                                                                                {['A', 'B', 'C', 'D'].map(letter => (
                                                                                    <label key={letter} className="flex items-center gap-1 cursor-pointer">
                                                                                        <input
                                                                                            type="radio"
                                                                                            name={`correct_final_${i}`}
                                                                                            checked={p.respuesta_correcta === letter}
                                                                                            onChange={() => handlePreguntaChange(i, 'respuesta_correcta', letter)}
                                                                                            className="h-3.5 w-3.5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                                                                        />
                                                                                        <span className={`font-black ${p.respuesta_correcta === letter ? 'text-emerald-600' : 'text-gray-400'}`}>{letter}</span>
                                                                                    </label>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className="bg-emerald-50/40 p-3 rounded-lg border border-dashed border-emerald-150 text-[11px] text-emerald-700 italic">
                                                                        📝 Esta pregunta es de respuesta libre. Se mostrará una caja de texto al alumno y se aprobará de forma no-bloqueante al escribir cualquier respuesta no vacía.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between pt-4">
                                <button 
                                    type="button" 
                                    disabled={isSavingDraft}
                                    onClick={() => handleTabChange('modulos')} 
                                    className="px-6 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl transition hover:bg-zinc-50 disabled:opacity-75"
                                >
                                    Atrás
                                </button>
                                <button 
                                    type="button" 
                                    disabled={isSavingDraft}
                                    onClick={() => handleTabChange('avisos')} 
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md disabled:opacity-70 flex items-center gap-2"
                                >
                                    {isSavingDraft ? (
                                        <>
                                            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                            Guardando...
                                        </>
                                    ) : (
                                        'Siguiente: Avisos, Notas y Enviar a Revisión'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tab 4: Avisos e Historial */}
                    <div className={activeTab === 'avisos' ? 'space-y-6 block' : 'hidden'}>
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">4. Avisos, Videoconferencias e Historial de Cambios</h2>
                                <p className="text-gray-500 text-xs mt-0.5">Configura notificaciones automáticas para los alumnos y define el motivo de esta actualización.</p>
                            </div>

                            <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-6 shadow-md space-y-4">
                                <h3 className="text-md font-bold text-blue-950 flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-blue-500" />
                                    Clase Virtual o Enlace Externo (Zoom, Meet, Teams)
                                </h3>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Enlace de Videoconferencia Directo</label>
                                    <input
                                        type="url"
                                        name="reunion_url"
                                        value={formData.reunion_url || ''}
                                        onChange={handleChange}
                                        placeholder="https://zoom.us/j/..."
                                        className="w-full text-sm rounded-xl border-gray-300 p-3 border bg-white text-black shadow-sm focus:border-blue-500"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Este enlace se le enviará automáticamente a los correos de tus alumnos inscritos y pagados al ser aprobado.</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nota del Profesor / Aviso Especial</label>
                                    <textarea
                                        name="nota_profesor"
                                        value={formData.nota_profesor || ''}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Ej: Próxima clase virtual el lunes a las 5:00 PM..."
                                        className="w-full text-sm rounded-xl border-gray-300 p-3 border bg-white text-black shadow-sm focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 space-y-4 shadow-sm">
                                <h3 className="text-md font-bold text-gray-800 flex items-center gap-2">
                                    <History className="h-5 w-5 text-zinc-500" />
                                    Nota para el Historial Académico
                                </h3>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Describe detalladamente los cambios realizados (Auditable por Administración):
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={historialMensaje}
                                        onChange={(e) => setHistorialMensaje(e.target.value)}
                                        placeholder="Ej. Se añadieron dos exámenes modulares y una presentación PPT en el módulo 2."
                                        className="w-full border-gray-300 rounded-xl p-3 text-sm border text-black bg-white focus:ring-blue-550 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-200">
                                {estadoActual === 'aprobado' || tieneBorrador ? (
                                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-xl">
                                        <p className="text-xs font-medium text-blue-800">
                                            <strong>Nota de Borrador:</strong> Estás editando un curso público y aprobado. Los cambios se guardarán como un borrador pendiente de revisión sin afectar a tus alumnos actuales en producción hasta que sea aprobado.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-xl">
                                        <p className="text-xs font-medium text-yellow-800">
                                            <strong>Nota de Aprobación:</strong> El curso pasará a estado <strong>Pendiente de Aprobación</strong> al guardar y dejará de ser visible de forma pública hasta que el administrador verifique el contenido.
                                        </p>
                                    </div>
                                )}
                                
                                <div className="flex gap-4">
                                    <button 
                                        type="button" 
                                        disabled={isSavingDraft || saving}
                                        onClick={() => handleTabChange('examen')} 
                                        className="px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl transition hover:bg-zinc-50 disabled:opacity-75"
                                    >
                                        Atrás
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-grow py-3 px-6 border border-transparent rounded-xl shadow-md text-base font-black text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50 hover:scale-[1.01]"
                                    >
                                        {saving ? 'Guardando cambios...' : 'Guardar curso y Enviar a revisión'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Premium Glassmorphic Modal message dialog */}
            {modalMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/20 p-6 max-w-md w-full shadow-2xl animate-scale-up text-center">
                        <div className="flex flex-col items-center">
                            {modalMessage.type === 'success' ? (
                                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle className="h-10 w-10 animate-bounce" />
                                </div>
                            ) : modalMessage.type === 'error' ? (
                                <div className="h-16 w-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
                                    <Activity className="h-10 w-10 text-rose-600 animate-pulse" />
                                </div>
                            ) : (
                                <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                                    <FileText className="h-10 w-10 text-blue-600" />
                                </div>
                            )}
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{modalMessage.title}</h3>
                            <p className="text-gray-600 text-sm mb-6 leading-relaxed whitespace-pre-line">{modalMessage.content}</p>
                            <button
                                type="button"
                                onClick={() => {
                                    const url = modalMessage.redirectUrl;
                                    setModalMessage(null);
                                    if (url) router.push(url);
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition shadow-lg shadow-blue-500/20"
                            >
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Gamma AI Presentation Generation Modal */}
            {activeGammaModuloIdx !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-zinc-200/80 p-7 max-w-xl w-full shadow-2xl text-left text-zinc-800 space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Sparkles className="h-6 w-6 text-violet-500 animate-pulse" />
                                Generar Presentación con IA (Gamma)
                            </h3>
                            <button
                                type="button"
                                onClick={() => setActiveGammaModuloIdx(null)}
                                className="text-gray-400 hover:text-gray-650 font-extrabold text-sm hover:scale-105 transition cursor-pointer"
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-xl text-xs space-y-1">
                            <p className="font-extrabold text-indigo-950 uppercase tracking-wider text-[10px]">Aviso de Uso y Costos</p>
                            <p className="text-indigo-800 font-medium leading-relaxed">
                                Esta es una herramienta de ayuda y tiene un costo de consumo de tokens. Su disponibilidad y utilidad futura podrían verse reducidas.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 pt-2 font-bold text-indigo-900 text-xs items-center">
                                <span>Usos realizados: {gammaGenerations.length} / {maxGammaAttempts}</span>
                                <span>Límite: Máx 20 diapositivas</span>
                                <span>Tokens (créditos) gastados: {gammaGenerations.reduce((sum, g) => sum + (g.credits_used || 0), 0)}</span>
                                {gammaGenerations.length >= maxGammaAttempts && (
                                    <button
                                        type="button"
                                        onClick={handleSolicitarMasIntentosGamma}
                                        disabled={isRequestingGamma || profile?.solicitud_mas_intentos_gamma}
                                        className="ml-auto bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {isRequestingGamma || profile?.solicitud_mas_intentos_gamma ? 'Solicitud pendiente' : 'Solicitar más intentos'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {gammaError && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-semibold leading-relaxed">
                                {gammaError}
                            </div>
                        )}

                        {!gammaSuccessResult ? (
                            <form onSubmit={handleGenerarGamma} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Título del Recurso</label>
                                    <input
                                        type="text"
                                        required
                                        value={gammaTitleInput}
                                        onChange={(e) => setGammaTitleInput(e.target.value)}
                                        placeholder="Ej. Presentación: Estructura Ósea Humana"
                                        disabled={isGeneratingGamma || gammaGenerations.length >= maxGammaAttempts}
                                        className="w-full rounded-xl border-gray-300 p-3 border bg-white text-zinc-950 text-xs font-bold focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tema / Instrucciones de la presentación</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={gammaPrompt}
                                        onChange={(e) => setGammaPrompt(e.target.value)}
                                        placeholder="Ej. Una presentación detallada sobre la anatomía del corazón humano, funciones de las aurículas, ventrículos y circulación mayor..."
                                        disabled={isGeneratingGamma || gammaGenerations.length >= maxGammaAttempts}
                                        className="w-full rounded-xl border-gray-300 p-3 border bg-white text-zinc-950 text-xs font-medium focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-1.5 gap-1">
                                        <span className="text-[10px] text-gray-400">Entre más detalles ingreses, mejor será la presentación.</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setGammaPrompt("Una presentación médica y didáctica sobre la anatomía del corazón humano. Debe incluir la estructura interna y externa, las funciones principales de las aurículas y ventrículos, la diferencia entre la circulación mayor y menor, y consejos prácticos para mantener una buena salud cardiovascular.");
                                                if (!gammaTitleInput.trim()) {
                                                    setGammaTitleInput("Anatomía del Corazón Humano");
                                                }
                                            }}
                                            disabled={isGeneratingGamma || gammaGenerations.length >= maxGammaAttempts}
                                            className="text-[10px] text-indigo-650 hover:text-indigo-850 font-bold underline transition-colors cursor-pointer"
                                        >
                                            ✨ Autocompletar ejemplo detallado
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Número de Diapositivas (Máx 20)</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={20}
                                            required
                                            value={gammaNumSlides}
                                            onChange={(e) => setGammaNumSlides(Math.min(20, Math.max(1, Number(e.target.value) || 10)))}
                                            disabled={isGeneratingGamma || gammaGenerations.length >= maxGammaAttempts}
                                            className="w-full rounded-xl border-gray-300 p-3 border bg-white text-zinc-950 text-xs font-bold focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Formato de Exportación</label>
                                        <div className="flex gap-4 items-center h-12">
                                            <label className="flex items-center text-xs font-semibold text-gray-700 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="gammaFormatOpt"
                                                    checked={gammaFormato === 'pptx'}
                                                    onChange={() => setGammaFormato('pptx')}
                                                    disabled={isGeneratingGamma || gammaGenerations.length >= maxGammaAttempts}
                                                    className="mr-1.5 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                PowerPoint (PPTX)
                                            </label>
                                            <label className="flex items-center text-xs font-semibold text-gray-700 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="gammaFormatOpt"
                                                    checked={gammaFormato === 'pdf'}
                                                    onChange={() => setGammaFormato('pdf')}
                                                    disabled={isGeneratingGamma || gammaGenerations.length >= maxGammaAttempts}
                                                    className="mr-1.5 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                PDF
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Idioma</label>
                                        <select
                                            value={gammaIdioma}
                                            onChange={(e) => setGammaIdioma(e.target.value as any)}
                                            disabled={isGeneratingGamma || gammaGenerations.length >= maxGammaAttempts}
                                            className="w-full rounded-xl border-gray-300 p-3 border bg-white text-zinc-950 text-xs font-bold focus:ring-indigo-500"
                                        >
                                            <option value="es-419">Español (Latino)</option>
                                            <option value="en">Inglés</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Diseño (Tema Visual)</label>
                                        <select
                                            value={gammaTema}
                                            onChange={(e) => setGammaTema(e.target.value)}
                                            disabled={isGeneratingGamma || gammaGenerations.length >= maxGammaAttempts}
                                            className="w-full rounded-xl border-gray-300 p-3 border bg-white text-zinc-950 text-xs font-bold focus:ring-indigo-500"
                                        >
                                            <option value="">Predeterminado del Sistema</option>
                                            <option value="editoria">Editoria (Clásico y Elegante)</option>
                                            <option value="electric">Electric (Morado/Azul Oscuro y Vibrante)</option>
                                            <option value="elysia">Elysia (Pastel Degradado)</option>
                                            <option value="gamma-dark">Gamma Dark (Oscuro con Naranja)</option>
                                            <option value="gleam">Gleam (Plata Minimalista y Profesional)</option>
                                            <option value="gold-leaf">Gold Leaf (Dorado y Crema Premium)</option>
                                            <option value="icebreaker">Icebreaker (Azul Cool Corporativo)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setActiveGammaModuloIdx(null)}
                                        disabled={isGeneratingGamma}
                                        className="w-1/3 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl text-xs hover:bg-zinc-50 transition cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isGeneratingGamma || gammaGenerations.length >= maxGammaAttempts}
                                        className="flex-grow py-3 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                                    >
                                        {isGeneratingGamma && (
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        )}
                                        {isGeneratingGamma ? 'Generando presentación... (puede tardar 1 min)' : 'Generar Presentación con IA'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6 text-center py-4">
                                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <CheckCircle className="h-10 w-10 animate-bounce" />
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-gray-900">¡Tu presentación está lista!</h4>
                                    <p className="text-xs text-gray-500 mt-1">Se generó la presentación con éxito en idioma Español (Latino).</p>
                                    {gammaSuccessResult.creditsUsed !== undefined && (
                                        <p className="text-[11px] text-indigo-600 font-bold mt-1 bg-indigo-50 px-2.5 py-1 rounded-full inline-block border border-indigo-100">
                                            Créditos consumidos: {gammaSuccessResult.creditsUsed} créditos de IA
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 max-w-sm mx-auto">
                                    <a
                                        href={gammaSuccessResult.exportUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => handleRegistrarGammaDescarga(gammaSuccessResult.id)}
                                        className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer font-bold"
                                    >
                                        Descargar Presentación (PPTX/PDF) ⬇
                                    </a>
                                </div>

                                <div className="border-t border-zinc-150 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const nuevosModulos = [...modulos];
                                            nuevosModulos[activeGammaModuloIdx].recursos.push({
                                                titulo: gammaTitleInput.trim() || `Presentación: ${gammaPrompt.substring(0, 40)}...`,
                                                tipo: gammaFormato === 'pdf' ? 'pdf' : 'ppt',
                                                url_contenido: gammaSuccessResult.exportUrl,
                                                archivoPdf: null,
                                                descargable: true
                                            });
                                            setModulos(nuevosModulos);
                                            handleMarcarGammaUtilizado(gammaSuccessResult.id);
                                            setActiveGammaModuloIdx(null);
                                        }}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer"
                                    >
                                        Añadir automáticamente como recurso al Módulo
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {isSimuladorOpen && (
                <SimuladorIngresosModal
                    isOpen={isSimuladorOpen}
                    onClose={() => setIsSimuladorOpen(false)}
                    precioPublico={Number(formData.precio) || 0}
                    aplicarIvaGlobal={aplicarIva}
                    comisionInstructorPercent={porcentajeProfesor}
                    onChangePrecio={(p) => setFormData(prev => ({ ...prev, precio: p }))}
                    onChangeAplicarIva={(a) => setAplicarIva(a)}
                />
            )}
        </div>
    )
}
