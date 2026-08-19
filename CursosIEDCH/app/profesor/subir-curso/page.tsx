'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, FileText, CheckCircle, Activity, Plus, Layout, BookOpen, BrainCircuit, MessageSquare, Sparkles, ArrowRight, ArrowUp, ArrowDown, Calculator, ChevronDown, ChevronUp, Gamepad2, Heart, Star, Image as ImageIcon, Play, Presentation, Code, X } from 'lucide-react'
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
    archivoPdf: File | null;
    descargable?: boolean;
}

type Modulo = {
    id?: string;
    titulo: string;
    recursos: Recurso[];
    requiereExamen: boolean;
    examenMinAprobacion: number;
    examenPreguntas: PreguntaParsed[];
    requiereTarea?: boolean;
    tareaInstrucciones?: string;
    tareaPuntos?: string;
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
    pregunta: string;
    opcion_a: string;
    opcion_b: string;
    opcion_c: string;
    opcion_d: string;
    respuesta_correcta: string;
    tipo_pregunta: 'opcion_multiple' | 'respuesta_libre';
}

export default function SubirCursoPage() {
    const [textExamenModalTarget, setTextExamenModalTarget] = useState<number | 'final' | null>(null)
    const [examenTextInput, setExamenTextInput] = useState('')

    const abrirModalPegarTexto = (target: number | 'final') => {
        setTextExamenModalTarget(target)
        setExamenTextInput('')
    }

    const handleProcesarTextoExamen = async () => {
        if (!examenTextInput.trim()) {
            alert('Por favor ingrese el texto del examen.')
            return
        }
        
        setIsParsing(true)
        const target = textExamenModalTarget

        try {
            const response = await fetch('/api/parse-exam', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: examenTextInput }),
            })

            const data = await response.json()

            if (response.ok && data.questions) {
                setTextExamenModalTarget(null) // CERRAR MODAL SOLO EN CASO DE ÉXITO
                if (target === 'final') {
                    setPreguntasExtraidas(prev => [...prev, ...data.questions])
                    setModalMessage({
                        title: '¡Examen analizado con IA!',
                        content: `Se detectaron e importaron ${data.questions.length} preguntas adicionales para la evaluación final del curso.`,
                        type: 'success'
                    })
                } else if (typeof target === 'number') {
                    const nuevosModulos = [...modulos]
                    nuevosModulos[target].examenPreguntas = [
                        ...nuevosModulos[target].examenPreguntas,
                        ...data.questions
                    ]
                    setModulos(nuevosModulos)
                    setModalMessage({
                        title: '¡Examen de módulo analizado con IA!',
                        content: `Se detectaron e importaron ${data.questions.length} preguntas adicionales para el módulo #${target + 1}.`,
                        type: 'success'
                    })
                }
            } else {
                setModalMessage({
                    title: 'Error al procesar examen',
                    content: data.error || 'Formato no válido.',
                    type: 'error'
                })
            }
        } catch (err) {
            setModalMessage({
                title: 'Error de conexión',
                content: 'Ocurrió un error al intentar conectarse al servidor de análisis de exámenes.',
                type: 'error'
            })
        } finally {
            setIsParsing(false)
        }
    }

    const [activeTab, setActiveTab] = useState<'info' | 'modulos' | 'examen' | 'avisos'>('info')
    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        competencias: '',
        beneficios: '',
        duracion: '',
        precio: 0,
        reunion_url: '',
        nota_profesor: '',
        categoria: 'desarrollo',
        modalidad: 'abierta',
        limite_inscripcion: '',
    })

    const [vigenciaAnos, setVigenciaAnos] = useState<number>(3)

    // Modules state
    const [modulos, setModulos] = useState<Modulo[]>([{
        titulo: '',
        recursos: [],
        requiereExamen: false,
        examenMinAprobacion: 80,
        examenPreguntas: [],
        requiereTarea: false,
        tareaInstrucciones: '',
        tareaPuntos: '',
        requierePuzzle: false,
        puzzlePuntos: '',
        puzzleTipo: 'anagrama',
        puzzlePregunta: '',
        puzzleRespuesta: '',
        puzzlePuzzles: [{ pregunta: '', respuesta: '', tipo: 'anagrama' }],
        requiereCuestionario: false,
        cuestionarioPreguntas: [],
        seguridadAumentada: false,
        maxCambiosPantalla: 2,
        conTiempo: false,
        tiempoExamen: 20,
        intentosPermitidos: 2
    }])

    // Exam state (Final exam)
    const [requiereExamen, setRequiereExamen] = useState(false)
    const [requierePagoCompleto, setRequierePagoCompleto] = useState(false)
    const [aplicarIva, setAplicarIva] = useState(false)
    const [isSimuladorOpen, setIsSimuladorOpen] = useState(false)
    const [bloquearAvance, setBloquearAvance] = useState(false)
    const [requiereTareasAvance, setRequiereTareasAvance] = useState(false)
    const [requiereExamenAvance, setRequiereExamenAvance] = useState(false)
    const [minAprobacion, setMinAprobacion] = useState<number | ''>(80)
    const [conTiempo, setConTiempo] = useState(false)
    const [tiempoExamen, setTiempoExamen] = useState<number | ''>(60)
    const [seguridadAumentada, setSeguridadAumentada] = useState(false)
    const [maxCambios, setMaxCambios] = useState<number | ''>(3)
    const [intentosPermitidos, setIntentosPermitidos] = useState<number | ''>(3)
    const [archivoExamen, setArchivoExamen] = useState<File | null>(null)
    const [preguntasExtraidas, setPreguntasExtraidas] = useState<PreguntaParsed[]>([])
    const [isParsing, setIsParsing] = useState(false)
    const [modalMessage, setModalMessage] = useState<{ title: string; content: string; type: 'success' | 'error' | 'info'; redirectUrl?: string } | null>(null)

    // Gamma API integration states
    const [gammaGenerations, setGammaGenerations] = useState<any[]>([])
    const [hiddenGenerations, setHiddenGenerations] = useState<string[]>([])
    const [sessionGeneratedIds, setSessionGeneratedIds] = useState<string[]>([])
    const [activeGammaModuloIdx, setActiveGammaModuloIdx] = useState<number | null>(null)
    const [gammaPrompt, setGammaPrompt] = useState('')
    const [gammaNumSlides, setGammaNumSlides] = useState(10)
    const [gammaFormato, setGammaFormato] = useState<'pdf' | 'pptx'>('pptx')
    const [isGeneratingGamma, setIsGeneratingGamma] = useState(false)
    const [isRequestingGamma, setIsRequestingGamma] = useState(false)
    const [gammaError, setGammaError] = useState('')
    const [gammaSuccessResult, setGammaSuccessResult] = useState<{ id: string; gammaUrl: string; exportUrl: string; creditsUsed?: number } | null>(null)
    const [gammaTitleInput, setGammaTitleInput] = useState('')
    const [gammaIdioma, setGammaIdioma] = useState<'es' | 'en'>('es')
    const [gammaTema, setGammaTema] = useState('')
    const [loading, setLoading] = useState(true)
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

    const togglePuzzleCollapsed = (index: number) => {
        setCollapsedPuzzles(prev => ({
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

    const [profile, setProfile] = useState<any>(null)
    const maxGammaAttempts = profile?.limite_generaciones_gamma ?? 3;

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

    const router = useRouter()
    const supabase = createClient()

    const [tieneBorradorLocal, setTieneBorradorLocal] = useState(false)
    const [mostrarExamenFinal, setMostrarExamenFinal] = useState(true)
    const [mostrarConstancia, setMostrarConstancia] = useState(true)
    const [mostrarCalificacionConstancia, setMostrarCalificacionConstancia] = useState(true)
    const [mostrarRevisionExamen, setMostrarRevisionExamen] = useState(false)
    const [borradorInicializado, setBorradorInicializado] = useState(false)

    // Logo custom states
    const [archivoLogo, setArchivoLogo] = useState<File | null>(null)
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
    const [archivoImagen, setArchivoImagen] = useState<File | null>(null)
    const [imagenPreviewUrl, setImagenPreviewUrl] = useState<string | null>(null)
    const [mostrarLogoConstancia, setMostrarLogoConstancia] = useState(false)
    const [plantillaConstancia, setPlantillaConstancia] = useState('modelo1')
    const [modificarConstancia, setModificarConstancia] = useState(false)

    // Check for draft on mount
    useEffect(() => {
        const raw = localStorage.getItem('curso_nuevo_borrador');
        if (raw) {
            setTieneBorradorLocal(true);
        } else {
            setBorradorInicializado(true);
        }
    }, []);

    // Auto-save changes to localStorage once the draft state is initialized
    useEffect(() => {
        if (!borradorInicializado) return;

        const borrador = {
            formData,
            vigenciaAnos,
            requiereExamen,
            requierePagoCompleto,
            bloquearAvance,
            requiereTareasAvance,
            requiereExamenAvance,
            minAprobacion,
            conTiempo,
            tiempoExamen,
            seguridadAumentada,
            maxCambios,
            intentosPermitidos,
            preguntasExtraidas,
            mostrarExamenFinal,
            mostrarConstancia,
            mostrarCalificacionConstancia,
            mostrarRevisionExamen,
            mostrarLogoConstancia,
            plantillaConstancia,
            sessionGeneratedIds,
            modulos: modulos.map(m => ({
                titulo: m.titulo,
                requiereExamen: m.requiereExamen,
                examenMinAprobacion: m.examenMinAprobacion,
                examenPreguntas: m.examenPreguntas,
                requiereTarea: m.requiereTarea,
                tareaInstrucciones: m.tareaInstrucciones,
                tareaPuntos: m.tareaPuntos,
                requierePuzzle: m.requierePuzzle,
                puzzlePuntos: m.puzzlePuntos,
                puzzleTipo: m.puzzleTipo,
                puzzlePregunta: m.puzzlePregunta,
                puzzleRespuesta: m.puzzleRespuesta,
                puzzlePuzzles: m.puzzlePuzzles,
                requiereCuestionario: m.requiereCuestionario,
                cuestionarioPreguntas: m.cuestionarioPreguntas,
                seguridadAumentada: m.seguridadAumentada,
                maxCambiosPantalla: m.maxCambiosPantalla,
                conTiempo: m.conTiempo,
                tiempoExamen: m.tiempoExamen,
                intentosPermitidos: m.intentosPermitidos,
                recursos: m.recursos.map(r => ({
                    titulo: r.titulo,
                    tipo: r.tipo,
                    url_contenido: r.url_contenido,
                    descargable: r.descargable
                }))
            }))
        };
        try {
            localStorage.setItem('curso_nuevo_borrador', JSON.stringify(borrador));
        } catch (e) {
            console.error('Error auto-saving draft to localStorage:', e);
        }
    }, [
        borradorInicializado,
        formData,
        vigenciaAnos,
        requiereExamen,
        requierePagoCompleto,
        bloquearAvance,
        requiereTareasAvance,
        requiereExamenAvance,
        minAprobacion,
        conTiempo,
        tiempoExamen,
        seguridadAumentada,
        maxCambios,
        intentosPermitidos,
        preguntasExtraidas,
        mostrarExamenFinal,
        mostrarConstancia,
        mostrarCalificacionConstancia,
        mostrarRevisionExamen,
        mostrarLogoConstancia,
        plantillaConstancia,
        sessionGeneratedIds,
        modulos
    ]);

    const guardarBorradorLocal = () => {
        try {
            const borrador = {
                formData,
                vigenciaAnos,
                requiereExamen,
                requierePagoCompleto,
                bloquearAvance,
                requiereTareasAvance,
                requiereExamenAvance,
                minAprobacion,
                conTiempo,
                tiempoExamen,
                seguridadAumentada,
                maxCambios,
                intentosPermitidos,
                preguntasExtraidas,
                mostrarExamenFinal,
                mostrarConstancia,
                mostrarCalificacionConstancia,
                mostrarRevisionExamen,
                mostrarLogoConstancia,
                plantillaConstancia,
                sessionGeneratedIds,
                modulos: modulos.map(m => ({
                    titulo: m.titulo,
                    requiereExamen: m.requiereExamen,
                    examenMinAprobacion: m.examenMinAprobacion,
                    examenPreguntas: m.examenPreguntas,
                    requiereTarea: m.requiereTarea,
                    tareaInstrucciones: m.tareaInstrucciones,
                    tareaPuntos: m.tareaPuntos,
                    requierePuzzle: m.requierePuzzle,
                    puzzlePuntos: m.puzzlePuntos,
                    puzzleTipo: m.puzzleTipo,
                    puzzlePregunta: m.puzzlePregunta,
                    puzzleRespuesta: m.puzzleRespuesta,
                    puzzlePuzzles: m.puzzlePuzzles,
                    requiereCuestionario: m.requiereCuestionario,
                    cuestionarioPreguntas: m.cuestionarioPreguntas,
                    seguridadAumentada: m.seguridadAumentada,
                    maxCambiosPantalla: m.maxCambiosPantalla,
                    conTiempo: m.conTiempo,
                    tiempoExamen: m.tiempoExamen,
                    intentosPermitidos: m.intentosPermitidos,
                    recursos: m.recursos.map(r => ({
                        titulo: r.titulo,
                        tipo: r.tipo,
                        url_contenido: r.url_contenido,
                        descargable: r.descargable
                    }))
                }))
            };
            localStorage.setItem('curso_nuevo_borrador', JSON.stringify(borrador));
            setMensaje('Progreso guardado automáticamente en el borrador local.');
            setTimeout(() => {
                setMensaje(prev => prev === 'Progreso guardado automáticamente en el borrador local.' ? '' : prev);
            }, 3000);
        } catch (e) {
            console.error('Error saving local draft:', e);
        }
    }

    const handleTabChange = (tab: 'info' | 'modulos' | 'examen' | 'avisos') => {
        guardarBorradorLocal();
        setActiveTab(tab);
    }

    const restaurarBorradorLocal = () => {
        try {
            const raw = localStorage.getItem('curso_nuevo_borrador');
            if (!raw) return;
            const borrador = JSON.parse(raw);
            if (borrador.formData) setFormData(borrador.formData);
            if (borrador.vigenciaAnos !== undefined) setVigenciaAnos(borrador.vigenciaAnos);
            if (borrador.requiereExamen !== undefined) setRequiereExamen(borrador.requiereExamen);
            if (borrador.requierePagoCompleto !== undefined) setRequierePagoCompleto(borrador.requierePagoCompleto);
            if (borrador.bloquearAvance !== undefined) setBloquearAvance(borrador.bloquearAvance);
            if (borrador.requiereTareasAvance !== undefined) setRequiereTareasAvance(borrador.requiereTareasAvance);
            if (borrador.requiereExamenAvance !== undefined) setRequiereExamenAvance(borrador.requiereExamenAvance);
            if (borrador.aplicarIva !== undefined) setAplicarIva(borrador.aplicarIva);
            if (borrador.minAprobacion !== undefined) setMinAprobacion(borrador.minAprobacion);
            if (borrador.conTiempo !== undefined) setConTiempo(borrador.conTiempo);
            if (borrador.tiempoExamen !== undefined) setTiempoExamen(borrador.tiempoExamen);
            if (borrador.seguridadAumentada !== undefined) setSeguridadAumentada(borrador.seguridadAumentada);
            if (borrador.maxCambios !== undefined) setMaxCambios(borrador.maxCambios);
            if (borrador.intentosPermitidos !== undefined) setIntentosPermitidos(borrador.intentosPermitidos);
            if (borrador.preguntasExtraidas !== undefined) setPreguntasExtraidas(borrador.preguntasExtraidas);
            if (borrador.mostrarExamenFinal !== undefined) setMostrarExamenFinal(borrador.mostrarExamenFinal);
            if (borrador.mostrarConstancia !== undefined) setMostrarConstancia(borrador.mostrarConstancia);
            if (borrador.mostrarCalificacionConstancia !== undefined) setMostrarCalificacionConstancia(borrador.mostrarCalificacionConstancia);
            if (borrador.mostrarRevisionExamen !== undefined) setMostrarRevisionExamen(borrador.mostrarRevisionExamen);
            if (borrador.mostrarLogoConstancia !== undefined) setMostrarLogoConstancia(borrador.mostrarLogoConstancia);
            if (borrador.plantillaConstancia !== undefined) setPlantillaConstancia(borrador.plantillaConstancia);
            if (borrador.sessionGeneratedIds !== undefined) setSessionGeneratedIds(borrador.sessionGeneratedIds);
            if (borrador.modulos !== undefined) {
                setModulos(borrador.modulos.map((m: any) => ({
                    titulo: m.titulo || '',
                    requiereExamen: !!m.requiereExamen,
                    examenMinAprobacion: m.examenMinAprobacion || 80,
                    examenPreguntas: m.examenPreguntas || [],
                    requiereTarea: !!m.requiereTarea,
                    tareaInstrucciones: m.tareaInstrucciones || '',
                    tareaPuntos: m.tareaPuntos || '',
                    requierePuzzle: !!m.requierePuzzle,
                    puzzlePuntos: m.puzzlePuntos || '',
                    puzzleTipo: m.puzzleTipo || 'anagrama',
                    puzzlePregunta: m.puzzlePregunta || '',
                    puzzleRespuesta: m.puzzleRespuesta || '',
                    puzzlePuzzles: (m.puzzlePuzzles || (
                        m.puzzlePregunta ? [
                            {
                                pregunta: m.puzzlePregunta,
                                respuesta: m.puzzleRespuesta || '',
                                tipo: m.puzzleTipo || 'anagrama'
                            }
                        ] : [{ pregunta: '', respuesta: '', tipo: 'anagrama' }]
                    )).map((p: any) => ({
                        pregunta: p.pregunta || '',
                        respuesta: p.respuesta || '',
                        tipo: p.tipo || m.puzzleTipo || 'anagrama'
                    })),
                    requiereCuestionario: !!m.requiereCuestionario,
                    cuestionarioPreguntas: m.cuestionarioPreguntas || [],
                    seguridadAumentada: !!m.seguridadAumentada,
                    maxCambiosPantalla: m.maxCambiosPantalla !== undefined ? m.maxCambiosPantalla : 2,
                    conTiempo: !!m.conTiempo,
                    tiempoExamen: m.tiempoExamen !== undefined ? m.tiempoExamen : 20,
                    intentosPermitidos: m.intentosPermitidos !== undefined ? m.intentosPermitidos : 2,
                    recursos: (m.recursos || []).map((r: any) => ({
                        titulo: r.titulo || '',
                        tipo: r.tipo || 'video',
                        url_contenido: r.url_contenido || '',
                        archivoPdf: null,
                        descargable: r.descargable !== undefined ? !!r.descargable : false
                    }))
                })));
            }
            setTieneBorradorLocal(false);
            setBorradorInicializado(true);
            setMensaje('Borrador restaurado con éxito. Puedes seguir editando.');
        } catch (e) {
            console.error('Error restoring local draft:', e);
            setMensaje('Error al intentar restaurar el borrador.');
        }
    }

    const descartarBorradorLocal = () => {
        localStorage.removeItem('curso_nuevo_borrador');
        setTieneBorradorLocal(false);
        setBorradorInicializado(true);
        setSessionGeneratedIds([]);

        // Reset all state variables to clear form data
        setFormData({
            titulo: '',
            descripcion: '',
            competencias: '',
            beneficios: '',
            duracion: '',
            precio: 0,
            reunion_url: '',
            nota_profesor: '',
            categoria: 'desarrollo',
            modalidad: 'abierta',
            limite_inscripcion: '',
        });
        setVigenciaAnos(3);
        setModulos([{
            titulo: '',
            recursos: [],
            requiereExamen: false,
            examenMinAprobacion: 80,
            examenPreguntas: [],
            requiereTarea: false,
            tareaInstrucciones: '',
            tareaPuntos: '',
            requiereCuestionario: false,
            cuestionarioPreguntas: [],
            seguridadAumentada: false,
            maxCambiosPantalla: 2,
            conTiempo: false,
            tiempoExamen: 20,
            intentosPermitidos: 2
        }]);
        setRequiereExamen(false);
        setRequierePagoCompleto(false);
        setAplicarIva(false);
        setBloquearAvance(false);
        setRequiereTareasAvance(false);
        setRequiereExamenAvance(false);
        setMinAprobacion(80);
        setConTiempo(false);
        setTiempoExamen(60);
        setSeguridadAumentada(false);
        setMaxCambios(3);
        setIntentosPermitidos(3);
        setArchivoExamen(null);
        setPreguntasExtraidas([]);
        setMostrarExamenFinal(true);
        setMostrarConstancia(true);
        setMostrarCalificacionConstancia(true);
        setMostrarRevisionExamen(false);
        setMostrarLogoConstancia(false);
        setPlantillaConstancia('modelo1');
        setArchivoLogo(null);
        setLogoPreviewUrl(null);
        setArchivoImagen(null);
        setImagenPreviewUrl(null);
    }

    useEffect(() => {
        async function checkProfile() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const res = await fetch('/api/perfil')
            const result = await res.json()
            const prof = result.data

            if (prof) {
                setProfile(prof)
                if (prof.rol === 'capacitador') {
                    setFormData(prev => ({ ...prev, precio: 0 }))
                }

                // Cargar registro de generaciones de Gamma de este profesor
                const { data: gammaGens } = await supabase
                    .from('ie_gamma_generations')
                    .select('*')
                    .eq('profile_id', user.id);
                if (gammaGens) {
                    setGammaGenerations(gammaGens);
                }
                
                // Profile completeness check removed per user request
                // so they can upload/edit courses without waiting for identity validation.
            }
            setLoading(false)
        }
        checkProfile()
    }, [router, supabase])

    const handleAgregarModulo = () => {
        setModulos([...modulos, {
            titulo: '',
            recursos: [],
            requiereExamen: false,
            examenMinAprobacion: 80,
            examenPreguntas: [],
            requiereTarea: false,
            tareaInstrucciones: '',
            tareaPuntos: '',
            requiereCuestionario: false,
            cuestionarioPreguntas: [],
            seguridadAumentada: false,
            maxCambiosPantalla: 2,
            conTiempo: false,
            tiempoExamen: 20,
            intentosPermitidos: 2
        }])
    }

    const handleEliminarModulo = (index: number) => {
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
            const isCreatedInSession = sessionGeneratedIds.includes(gen.id);
            const isHidden = hiddenGenerations.includes(gen.id);
            return gen.descargado && !isUsedInModule && !gen.utilizado && !gen.curso_id && isCreatedInSession && !isHidden;
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
                    cursoId: null,
                    moduloId: null
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
                        `/api/profesor/gamma/status?generationId=${generationId}&prompt=${encodeURIComponent(gammaPrompt)}&titulo=${encodeURIComponent(gammaTitleInput.trim())}&numSlides=${gammaNumSlides}&formato=${gammaFormato}&cursoId=null&moduloId=null`
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
                            curso_id: null,
                            profile_id: userId
                        };

                        setGammaGenerations(prev => {
                            if (prev.some(g => g.id === newGen.id || g.export_url === newGen.export_url)) {
                                return prev;
                            }
                            return [...prev, newGen];
                        });
                        setSessionGeneratedIds(prev => [...prev, statusData.id || generationId]);

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
        nuevosModulos[moduloIdx].cuestionarioPreguntas!.push({
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await guardarCurso(false)
    }

    const guardarCurso = async (esBorrador: boolean) => {
        setLoading(true)
        setMensaje('')

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setLoading(false)
            return
        }

        // Consultar campos mínimos de validación de identidad y datos de pago
        const { data: checkProfile } = await supabase
            .from('ie_profiles')
            .select('rfc, constancia_situacion_fiscal, telefono, banco, clabe')
            .eq('id', user.id)
            .single()

        if (!esBorrador) {
            const rfcCompleto = checkProfile?.rfc?.trim()
            const telefonoCompleto = checkProfile?.telefono?.trim()
            const bancoCompleto = checkProfile?.banco?.trim()
            const clabeCompleta = checkProfile?.clabe?.trim()

            if (!rfcCompleto || !telefonoCompleto || !bancoCompleto || !clabeCompleta) {
                setModalMessage({
                    title: 'Perfil Incompleto para Revisión',
                    content: 'Antes de enviar tu curso a revisión, por seguridad y cumplimiento, debes registrar tu RFC y tus datos de contacto y pago (Teléfono, Banco, CLABE) en tu Perfil.',
                    type: 'error'
                });
                setLoading(false);
                return;
            }
        }

        // Validate general course fields
        const precioCurso = Number(formData.precio) || 0;
        if (precioCurso > 0 && precioCurso < 199) {
            setModalMessage({
                title: 'Precio Inválido',
                content: 'El precio del curso debe ser exactamente de $0.00 MXN (gratuito) o mayor o igual a $199.00 MXN.',
                type: 'error'
            });
            setLoading(false);
            return;
        }

        if (!formData.titulo?.trim()) {
            setModalMessage({
                title: 'Faltan Campos',
                content: 'Error: Por favor escribe el título del curso.',
                type: 'error'
            });
            setLoading(false)
            return
        }
        
        if (!esBorrador) {
            if (!formData.descripcion?.trim()) {
                setModalMessage({
                    title: 'Faltan Campos',
                    content: 'Error: Por favor escribe la descripción del curso.',
                    type: 'error'
                });
                setLoading(false)
                return
            }
            if (!formData.competencias?.trim()) {
                setModalMessage({
                    title: 'Faltan Campos',
                    content: 'Error: Por favor escribe las competencias del curso.',
                    type: 'error'
                });
                setLoading(false)
                return
            }
            if (!formData.beneficios?.trim()) {
                setModalMessage({
                    title: 'Faltan Campos',
                    content: 'Error: Por favor especifica los beneficios del curso.',
                    type: 'error'
                });
                setLoading(false)
                return
            }
            if (!formData.duracion?.trim()) {
                setModalMessage({
                    title: 'Faltan Campos',
                    content: 'Error: Por favor especifica la duración del curso.',
                    type: 'error'
                });
                setLoading(false)
                return
            }

            // Validate modules
            if (modulos.length === 0) {
                setModalMessage({
                    title: 'Faltan Módulos',
                    content: 'Error: Agrega al menos un módulo al curso.',
                    type: 'error'
                });
                setLoading(false)
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
                    setLoading(false)
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
                        setLoading(false)
                        return
                    }
                    if (rec.tipo === 'video' && !rec.url_contenido) {
                        setModalMessage({
                            title: 'Enlace Obligatorio',
                            content: `Error: Por favor escribe el enlace de video para el recurso "${rec.titulo}" del módulo "${m.titulo}".`,
                            type: 'error'
                        });
                        setLoading(false)
                        return
                    }
                    if (rec.tipo !== 'video' && !rec.archivoPdf) {
                        setModalMessage({
                            title: 'Archivo Obligatorio',
                            content: `Error: Por favor sube un archivo (PDF/PPT/HTML) para el recurso "${rec.titulo}" del módulo "${m.titulo}".`,
                            type: 'error'
                        });
                        setLoading(false)
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
                        setLoading(false)
                        return
                    }
                    const tieneOpcionMultiple = m.examenPreguntas.some(p => p.tipo_pregunta !== 'respuesta_libre');
                    if (!tieneOpcionMultiple) {
                        setModalMessage({
                            title: 'Falta Pregunta de Opción Múltiple',
                            content: `Error: El examen del módulo "${m.titulo}" debe tener al menos una pregunta de opción múltiple para calificarlo de forma automatizada.`,
                            type: 'error'
                        });
                        setLoading(false)
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
                            setLoading(false)
                            return
                        }
                        if (p.tipo_pregunta !== 'respuesta_libre') {
                            if (!p.opcion_a || !p.opcion_b || !p.respuesta_correcta) {
                                setModalMessage({
                                    title: 'Opciones Incompletas',
                                    content: `Error: Completa al menos las opciones A y B, y la respuesta correcta para la pregunta ${pIdx + 1} en el examen del módulo "${m.titulo}".`,
                                    type: 'error'
                                });
                                setLoading(false)
                                return
                            }
                        }
                    }
                }
            }

            // Validate final exam status
            if (requiereExamen) {
                if (preguntasExtraidas.length === 0) {
                    setModalMessage({
                        title: 'Cuestionario Vacío',
                        content: 'Error: Has marcado que el curso requiere examen final, por favor añade al menos una pregunta.',
                        type: 'error'
                    });
                    setLoading(false)
                    return
                }
                const tieneOpcionMultipleFinal = preguntasExtraidas.some(p => p.tipo_pregunta !== 'respuesta_libre');
                if (!tieneOpcionMultipleFinal) {
                    setModalMessage({
                        title: 'Falta Pregunta de Opción Múltiple',
                        content: 'Error: El examen final debe tener al menos una pregunta de opción múltiple para calificarlo de forma automatizada.',
                        type: 'error'
                    });
                    setLoading(false)
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
                        setLoading(false)
                        return
                    }
                    if (p.tipo_pregunta !== 'respuesta_libre') {
                        if (!p.opcion_a || !p.opcion_b || !p.respuesta_correcta) {
                            setModalMessage({
                                title: 'Opciones Incompletas',
                                content: `Error: Por favor completa las opciones A y B, y la respuesta correcta para la pregunta ${pIdx + 1} del examen final.`,
                                type: 'error'
                            });
                            setLoading(false)
                            return
                        }
                    }
                }
            }
        }

        let firstUrlContenido = '';

        // 1. Create Course
        setMensaje('Guardando información del curso...')
        
        const { data: profileRow } = await supabase.from('ie_profiles').select('*').eq('id', user.id).single()
        const instructorNombre = (profileRow?.rol === 'institucion' 
            ? `${profileRow?.nombre || ''}`.trim() 
            : `${profileRow?.nombre || ''} ${profileRow?.apellido_paterno || ''} ${profileRow?.apellido_materno || ''}`.trim()) || user.email;

        let logoUrl = null;
        if (archivoLogo) {
            setMensaje('Subiendo logotipo de la organización...')
            const fileExt = archivoLogo.name.split('.').pop()
            const fileName = `logo_curso_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase.storage
                .from('cursos_contenido')
                .upload(fileName, archivoLogo, { contentType: archivoLogo.type })
            if (uploadError) {
                setModalMessage({
                    title: 'Error de Logotipo',
                    content: `Error subiendo el logotipo de la organización: ${uploadError.message}`,
                    type: 'error'
                });
                setLoading(false);
                return;
            }
            logoUrl = supabase.storage.from('cursos_contenido').getPublicUrl(fileName).data.publicUrl
        }

        let portadaUrl = null;
        if (archivoImagen) {
            setMensaje('Subiendo imagen de portada del curso...')
            const fileExt = archivoImagen.name.split('.').pop()
            const fileName = `portada_curso_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase.storage
                .from('cursos_contenido')
                .upload(fileName, archivoImagen, { contentType: archivoImagen.type })
            if (uploadError) {
                setModalMessage({
                    title: 'Error de Imagen de Portada',
                    content: `Error subiendo la imagen de portada del curso: ${uploadError.message}`,
                    type: 'error'
                });
                setLoading(false);
                return;
            }
            portadaUrl = supabase.storage.from('cursos_contenido').getPublicUrl(fileName).data.publicUrl
        }

        const cursoDraftObj: any = {
            ...formData,
            instructor: instructorNombre,
            url_contenido: 'processing',
            precio: Number(formData.precio),
            estado: esBorrador ? 'borrador' : 'pendiente',
            creado_por: user.id,
            requiere_examen: requiereExamen,
            requiere_pago_completo: requierePagoCompleto,
            bloquear_avance: bloquearAvance,
            requiere_tareas_avance: requiereTareasAvance,
            requiere_examen_avance: requiereExamenAvance,
            url_examen: null,
            vigencia_anos: vigenciaAnos,
            reunion_url: formData.reunion_url?.trim() || null,
            nota_profesor: formData.nota_profesor?.trim() || null,
            mostrar_examen_final: mostrarExamenFinal,
            mostrar_constancia: mostrarConstancia,
            mostrar_calificacion_constancia: mostrarCalificacionConstancia,
            mostrar_revision_examen: mostrarRevisionExamen,
            limite_inscripcion: formData.modalidad === 'cerrada' && formData.limite_inscripcion ? formData.limite_inscripcion : null,
            logo_url: logoUrl,
            imagen_url: portadaUrl,
            mostrar_logo_constancia: mostrarLogoConstancia,
            plantilla_constancia: plantillaConstancia
        }

        const { data: cursoGuardado, error: errorCurso } = await supabase.from('ie_cursos').insert(cursoDraftObj).select().single()

        if (errorCurso || !cursoGuardado) {
            setModalMessage({
                title: esBorrador ? 'Error al Guardar Borrador' : 'Error al Crear Curso',
                content: (esBorrador ? 'Error al guardar el borrador en la base de datos: ' : 'Error al crear el curso en la base de datos: ') + errorCurso?.message,
                type: 'error'
            });
            setLoading(false)
            return
        }

        // 2. Upload assets and insert modules & modular exams
        setMensaje('Subiendo contenidos y módulos...')
        for (let i = 0; i < modulos.length; i++) {
            const currentMod = modulos[i];
            setMensaje(`Configurando Módulo ${i + 1} de ${modulos.length}: "${currentMod.titulo || 'Sin título'}"... Subiendo lecturas e infografías...`)

            // Upload files for each resource of this module
            for (let rIdx = 0; rIdx < currentMod.recursos.length; rIdx++) {
                const rec = currentMod.recursos[rIdx];
                if (rec.tipo !== 'video' && rec.archivoPdf) {
                    const file = rec.archivoPdf as File;
                    const fileExt = file.name.split('.').pop()
                    const fileName = `modulo_recurso_${cursoGuardado.id}_${i}_${rIdx}_${Date.now()}.${fileExt}`

                    const ext = (fileExt || '').toLowerCase()
                    let contentType = 'application/octet-stream'
                    if (ext === 'pdf') {
                        contentType = 'application/pdf'
                    } else if (ext === 'html' || ext === 'htm') {
                        contentType = 'text/html; charset=utf-8'
                    } else if (ext === 'ppt' || ext === 'pptx') {
                        contentType = 'application/vnd.ms-powerpoint'
                    }

                    const { error: uploadError } = await supabase.storage.from('cursos_contenido').upload(fileName, file, { contentType })
                    if (uploadError) {
                        setModalMessage({
                            title: 'Error de Archivo',
                            content: `Error subiendo el archivo del recurso "${rec.titulo}" en el módulo ${i + 1}: ${uploadError.message}`,
                            type: 'error'
                        });
                        setLoading(false);
                        return;
                    }
                    rec.url_contenido = supabase.storage.from('cursos_contenido').getPublicUrl(fileName).data.publicUrl
                }
            }

            // Legacy url_contenido field: use the first resource's url if available
            let legacyUrl = '';
            if (currentMod.recursos.length > 0) {
                legacyUrl = currentMod.recursos[0].url_contenido;
            }
            if (i === 0) firstUrlContenido = legacyUrl;

            // Insert Module
            const { data: moduloInsertado, error: errorModulo } = await supabase
                .from('ie_curso_modulos')
                .insert({
                    curso_id: cursoGuardado.id,
                    titulo: currentMod.titulo || 'Módulo sin título',
                    url_contenido: legacyUrl || '',
                    orden: i + 1,
                    requiere_cuestionario: !!currentMod.requiereCuestionario
                })
                .select()
                .single()

            if (errorModulo || !moduloInsertado) {
                setModalMessage({
                    title: 'Error de Módulo',
                    content: `Error guardando el módulo ${i + 1}: ${errorModulo?.message}`,
                    type: 'error'
                });
                setLoading(false)
                return
            }

            // Insert resources into public.ie_modulo_recursos
            for (let rIdx = 0; rIdx < currentMod.recursos.length; rIdx++) {
                const rec = currentMod.recursos[rIdx];
                const { error: errorRecurso } = await supabase
                    .from('ie_modulo_recursos')
                    .insert({
                        modulo_id: moduloInsertado.id,
                        titulo: rec.titulo || 'Recurso sin título',
                        url_contenido: rec.url_contenido || '',
                        orden: rIdx + 1,
                        descargable: rec.descargable || false
                    });
                if (errorRecurso) {
                    console.error('Error insertando recurso en DB:', JSON.stringify(errorRecurso), errorRecurso);
                    setModalMessage({
                        title: 'Error de Base de Datos',
                        content: `Error al guardar el recurso "${rec.titulo || 'sin título'}": ${errorRecurso.message || JSON.stringify(errorRecurso)}`,
                        type: 'error'
                    });
                    setLoading(false);
                    return;
                }

                // Vincular y marcar la generación de Gamma como utilizada
                await supabase
                    .from('ie_gamma_generations')
                    .update({ utilizado: true, curso_id: cursoGuardado.id, modulo_id: moduloInsertado.id })
                    .eq('export_url', rec.url_contenido);
            }

            // Insert Modular Exam if checked
            if (currentMod.requiereExamen && currentMod.examenPreguntas.length > 0) {
                const { data: examGuardado, error: errorExamen } = await supabase
                    .from('ie_examenes')
                    .insert({
                        curso_id: cursoGuardado.id,
                        modulo_id: moduloInsertado.id, // Link to module!
                        min_aprobacion: currentMod.examenMinAprobacion,
                        tiempo_limite: currentMod.conTiempo ? (currentMod.tiempoExamen === '' || currentMod.tiempoExamen === undefined ? 20 : currentMod.tiempoExamen) : null,
                        seguridad_aumentada: currentMod.seguridadAumentada || false,
                        max_cambios_pantalla: currentMod.seguridadAumentada ? (currentMod.maxCambiosPantalla === '' || currentMod.maxCambiosPantalla === undefined ? 3 : currentMod.maxCambiosPantalla) : 3,
                        intentos_permitidos: currentMod.intentosPermitidos === '' || currentMod.intentosPermitidos === undefined ? 2 : currentMod.intentosPermitidos
                    })
                    .select()
                    .single()

                if (errorExamen || !examGuardado) {
                    console.error(`Error creando evaluación del módulo ${i + 1}:`, errorExamen?.message);
                } else {
                    const preguntasModulo = currentMod.examenPreguntas.map((p, pIndex) => ({
                        examen_id: examGuardado.id,
                        pregunta: p.pregunta,
                        opcion_a: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_a,
                        opcion_b: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_b,
                        opcion_c: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_c,
                        opcion_d: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_d,
                        respuesta_correcta: p.tipo_pregunta === 'respuesta_libre' ? 'A' : p.respuesta_correcta,
                        tipo_pregunta: p.tipo_pregunta || 'opcion_multiple',
                        orden: pIndex + 1
                    }))
                    await supabase.from('ie_preguntas').insert(preguntasModulo)
                }
            }

            // Insert Modular Homework/Task if checked
            if (currentMod.requiereTarea) {
                const definitionKey = `TAREA_DEFINICION:${moduloInsertado.id}`;
                const definitionPayload = JSON.stringify({
                    instrucciones: currentMod.tareaInstrucciones || '',
                    puntos: currentMod.tareaPuntos || ''
                });
                await supabase.from('ie_preguntas_respuestas').insert({
                    curso_id: cursoGuardado.id,
                    user_id: user.id,
                    pregunta: `${definitionKey}::${definitionPayload}`,
                    respuesta: 'TAREA_DEFINICION'
                });
            }

            // Insert Modular Questionnaire if checked
            if (currentMod.requiereCuestionario && currentMod.cuestionarioPreguntas && currentMod.cuestionarioPreguntas.length > 0) {
                const preguntasCuestionario = currentMod.cuestionarioPreguntas.map((p, pIndex) => ({
                    modulo_id: moduloInsertado.id,
                    pregunta: p.pregunta,
                    orden: pIndex + 1
                }));
                const { error: errorCuestionario } = await supabase.from('ie_cuestionario_preguntas').insert(preguntasCuestionario);
                if (errorCuestionario) {
                    console.error(`Error creando cuestionario del módulo ${i + 1}:`, errorCuestionario.message);
                }
            }
        }

        // 3. Update legacy course content pointer
        await supabase.from('ie_cursos').update({ url_contenido: firstUrlContenido }).eq('id', cursoGuardado.id);

        // 4. Create final exam
        if (requiereExamen && preguntasExtraidas.length > 0) {
            setMensaje('Registrando preguntas del examen final...')
            let urlExamenPdf = null;
            if (archivoExamen) {
                const fExt = archivoExamen.name.split('.').pop()
                const fName = `examen_pdf_${cursoGuardado.id}_${Date.now()}.${fExt}`
                await supabase.storage.from('cursos_contenido').upload(fName, archivoExamen)
                urlExamenPdf = supabase.storage.from('cursos_contenido').getPublicUrl(fName).data.publicUrl
                await supabase.from('ie_cursos').update({ url_examen: urlExamenPdf }).eq('id', cursoGuardado.id);
            }

            const { data: examenGuardado, error: errorExamen } = await supabase.from('ie_examenes').insert({
                curso_id: cursoGuardado.id,
                min_aprobacion: minAprobacion === '' ? 80 : minAprobacion,
                tiempo_limite: conTiempo ? (tiempoExamen === '' ? 60 : tiempoExamen) : null,
                seguridad_aumentada: seguridadAumentada,
                max_cambios_pantalla: seguridadAumentada ? (maxCambios === '' ? 3 : maxCambios) : 3,
                intentos_permitidos: intentosPermitidos === '' ? 3 : intentosPermitidos
            }).select().single()

            if (errorExamen) {
                setModalMessage({
                    title: 'Error de Examen Final',
                    content: 'El curso se creó, pero hubo un error generando el cuestionario reactivo final: ' + errorExamen.message,
                    type: 'error'
                });
            } else if (examenGuardado) {
                const preguntasAInsertar = preguntasExtraidas.map((p, pIndex) => ({
                    examen_id: examenGuardado.id,
                    pregunta: p.pregunta,
                    opcion_a: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_a,
                    opcion_b: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_b,
                    opcion_c: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_c,
                    opcion_d: p.tipo_pregunta === 'respuesta_libre' ? '' : p.opcion_d,
                    respuesta_correcta: p.tipo_pregunta === 'respuesta_libre' ? 'A' : p.respuesta_correcta,
                    tipo_pregunta: p.tipo_pregunta || 'opcion_multiple',
                    orden: pIndex + 1
                }));
                await supabase.from('ie_preguntas').insert(preguntasAInsertar);
            }
        }

        try {
            localStorage.removeItem('curso_nuevo_borrador');
        } catch (e) {
            console.error('Error clearing local draft:', e);
        }

        setModalMessage({
            title: esBorrador ? '¡Curso Guardado!' : '¡Curso Creado!',
            content: esBorrador 
                ? 'El curso se ha guardado correctamente como borrador.' 
                : 'El curso se ha creado correctamente y ha sido enviado a revisión por el administrador.',
            type: 'success',
            redirectUrl: '/profesor/cursos'
        });
        setLoading(false)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const instructorNombre = profile
        ? (profile.rol === 'institucion' 
            ? `${profile.nombre || ''}`.trim() 
            : `${profile.nombre || ''} ${profile.apellido_paterno || ''} ${profile.apellido_materno || ''}`.trim()) || 'Instructor'
        : 'Instructor';

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                        <Sparkles className="text-blue-600 h-8 w-8" />
                        Subir Nuevo Curso
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Estructura un curso premium por pestañas e integra evaluaciones modulares.</p>
                </div>
                <div className="flex items-center gap-2">
                    {borradorInicializado && (
                        <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            ✓ Guardado en Navegador
                        </span>
                    )}
                </div>
            </div>
            
            {tieneBorradorLocal && (
                <div id="tour-recuperar-borrador" className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-md animate-fade-in">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 animate-pulse">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                            <h4 className="text-sm font-bold text-slate-900 font-sans">¿Deseas recuperar tu progreso anterior?</h4>
                            <p className="text-xs text-slate-500 mt-0.5 font-sans">Detectamos un borrador de curso guardado automáticamente en tu navegador.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                            type="button"
                            onClick={restaurarBorradorLocal}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-md hover:shadow-lg active:scale-95"
                        >
                            Restaurar Borrador
                        </button>
                        <button
                            type="button"
                            onClick={descartarBorradorLocal}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs transition active:scale-95"
                        >
                            Descartar
                        </button>
                    </div>
                </div>
            )}
            


            {/* Navigation Tabs */}
            <div id="tour-pasos-creacion" className="flex flex-wrap items-center gap-y-2 mb-6 border-b border-gray-200 pb-px">
                <button
                    id="tab-btn-info"
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
                    id="tab-btn-modulos"
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
                    id="tab-btn-examen"
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
                    id="tab-btn-avisos"
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

            <div className="bg-white shadow-xl rounded-2xl border border-zinc-100 p-6 lg:p-8">
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
                                    <p className="text-gray-500 text-xs mt-0.5">Define los aspects centrales y de cobro del programa académico.</p>
                                </div>
                                <button id="tour-guardar-borrador" type="button" onClick={() => guardarCurso(true)} disabled={loading} className="flex-shrink-0 whitespace-nowrap px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-sm disabled:opacity-50 shadow-md">
                                    {loading ? 'Guardando...' : 'Guardar Borrador'}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Título del Curso</label>
                                    <input type="text" name="titulo" required maxLength={60} value={formData.titulo} onChange={handleChange} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 text-black bg-white" placeholder="Ej. Fundamentos de la Práctica Médica Moderna" />
                                    <p className="text-[10px] text-gray-500 mt-1 italic">Máx. 60 caracteres. Se renderizará en el certificado del alumno.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción Completa</label>
                                    <textarea name="descripcion" required value={formData.descripcion} onChange={handleChange} rows={4} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 text-black bg-white" placeholder="Describe los temas que cubre el curso..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Competencias del Curso</label>
                                    <textarea name="competencias" required value={formData.competencias} onChange={handleChange} rows={4} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 text-black bg-white" placeholder="Describe las competencias que desarrollará el alumno..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Beneficios / ¿Qué aprenderá el alumno?</label>
                                    <textarea name="beneficios" required value={formData.beneficios} onChange={handleChange} rows={3} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 text-black bg-white" placeholder="Ej. Al finalizar este curso dominarás las técnicas de..." />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Duración Estructurada</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" name="duracion" required min="1" max="999" value={formData.duracion ? String(formData.duracion).replace(/\D/g, '') : ''} onChange={(e) => setFormData({...formData, duracion: e.target.value ? `${e.target.value} ${e.target.value === '1' ? 'Hora' : 'Horas'}` : ''})} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 text-black bg-white" placeholder="Ej: 10" />
                                            <span className="text-gray-500 font-medium">Horas</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1 italic">Solo ingresa el número. Se imprime en el certificado.</p>
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
                                                                logoUrl: logoPreviewUrl,
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                                    {profile?.rol !== 'capacitador' ? (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Precio al Público del Curso (MXN)</label>
                                            <div className="flex gap-2 items-center">
                                                <div className="relative rounded-xl shadow-sm flex-1">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <span className="text-gray-500">$</span>
                                                    </div>
                                                    <input type="number" step="0.01" name="precio" required min="0" value={formData.precio} onChange={handleChange} className="pl-8 w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 text-black bg-white" placeholder="0.00" />
                                                </div>
                                                <button
                                                    id="btn-simulador-ingresos"
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
                                                                    onClick={() => {
                                                                        setArchivoLogo(null);
                                                                        setLogoPreviewUrl(null);
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
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    setArchivoLogo(file);
                                                                    setLogoPreviewUrl(URL.createObjectURL(file));
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
                                                                onClick={() => {
                                                                    setArchivoImagen(null);
                                                                    setImagenPreviewUrl(null);
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
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                setArchivoImagen(file);
                                                                setImagenPreviewUrl(URL.createObjectURL(file));
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
                                                                    instructorNombre.substring(0, 2).toUpperCase()
                                                                )}
                                                            </div>
                                                            <span className="text-[11px] text-gray-500 font-medium truncate">{instructorNombre}</span>
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
                            <div className="flex justify-end pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => handleTabChange('modulos')} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition">
                                    Siguiente: Clases y Temas
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tab 2: Temario y Clases (Módulos & Múltiples Recursos & Exámenes Modulares) */}
                    <div className={activeTab === 'modulos' ? 'space-y-6 block' : 'hidden'}>
                        <div className="space-y-6">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-gray-900">2. Temario del Curso (Módulos)</h2>
                                    <p className="text-gray-500 text-xs mt-0.5">Organiza las clases y lecturas del temario. Puedes añadir múltiples recursos (videos, archivos PDF, presentaciones PowerPoint, u HTMLs) a cada módulo.</p>
                                </div>
                                <button type="button" onClick={() => guardarCurso(true)} disabled={loading} className="flex-shrink-0 whitespace-nowrap px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-sm disabled:opacity-50 shadow-md">
                                    {loading ? 'Guardando...' : 'Guardar Borrador'}
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
                                                    Clase / Módulo de Aprendizaje
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
                                                {modulos.length > 1 && (
                                                    <button type="button" onClick={() => handleEliminarModulo(index)} className="text-red-500 hover:text-red-700 flex items-center text-xs font-bold transition">
                                                        <Trash2 className="h-4 w-4 mr-1" /> Eliminar Módulo
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className={`grid grid-cols-1 gap-6 ${collapsedModulos[index] ? 'hidden' : ''}`}>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Título del Módulo</label>
                                                <input type="text" required placeholder="Ej. Introducción a la Fisiología" value={modulo.titulo} onChange={(e) => handleModuloChange(index, 'titulo', e.target.value)} className="w-full text-sm rounded-lg border-gray-300 p-2.5 border bg-white text-black font-semibold" />
                                            </div>

                                            {/* Resources List */}
                                            <div className="space-y-4 pt-2">
                                                 <div className="flex justify-between items-center">
                                                    <label className="block text-xs font-extrabold text-gray-600 uppercase tracking-wider">Recursos del Módulo ({modulo.recursos.length})</label>
                                                    <div className="flex gap-2">
                                                        <button
                                                            id={index === 0 ? "btn-gamma-first" : undefined}
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

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Título del Recurso</label>
                                                                        <input
                                                                            type="text"
                                                                            required
                                                                            placeholder="Ej. Diapositivas de la clase o Lectura obligatoria"
                                                                            value={recurso.titulo || ''}
                                                                            onChange={(e) => handleRecursoChange(index, rIdx, 'titulo', e.target.value)}
                                                                            className="w-full text-xs rounded border-gray-300 p-2 border bg-white text-black font-medium"
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
                                                                                        }`}
                                                                                    >
                                                                                        <input
                                                                                            type="radio"
                                                                                            checked={recurso.tipo === tipoOpt}
                                                                                            onChange={() => handleRecursoChange(index, rIdx, 'tipo', tipoOpt)}
                                                                                            className="mr-2 h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500"
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
                                                                            <div className="space-y-2">
                                                                                <div>
                                                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Enlace del Video (YouTube , Vimeo, Tiktok, Reels, etc. )</label>
                                                                                    <input
                                                                                        type="url"
                                                                                        required
                                                                                        placeholder="https://www.youtube.com/watch?v=..."
                                                                                        value={recurso.url_contenido || ''}
                                                                                        onChange={(e) => handleRecursoChange(index, rIdx, 'url_contenido', e.target.value)}
                                                                                        className="w-full text-xs rounded border-gray-300 p-2 border bg-white text-black"
                                                                                    />
                                                                                </div>
                                                                                <div className="pt-1">
                                                                                    <SubidorBunny
                                                                                        title={recurso.titulo || `Clase - ${modulo.titulo}`}
                                                                                        onUploadComplete={(url) => handleRecursoChange(index, rIdx, 'url_contenido', url)}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div>
                                                                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                                                                    {recurso.tipo === 'html' ? 'Seleccionar archivo HTML' : recurso.tipo === 'ppt' ? 'Seleccionar presentación PowerPoint (.ppt, .pptx)' : 'Seleccionar archivo PDF'}
                                                                                </label>
                                                                                <input
                                                                                    type="file"
                                                                                    required
                                                                                    accept={
                                                                                        recurso.tipo === 'html'
                                                                                            ? '.html,.htm,text/html'
                                                                                            : recurso.tipo === 'ppt'
                                                                                                ? '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation'
                                                                                                : '.pdf,application/pdf'
                                                                                    }
                                                                                    onChange={(e) => handleRecursoChange(index, rIdx, 'archivoPdf', e.target.files?.[0] || null)}
                                                                                    className="w-full text-xs text-gray-500 border border-gray-200 p-1 rounded bg-white file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                                                                />
                                                                            </div>
                                                                        )}

                                                                        {recurso.tipo !== 'video' && (
                                                                            <div className="mt-3 flex items-center gap-2">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    id={`descargable-${index}-${rIdx}`}
                                                                                    checked={recurso.descargable || false}
                                                                                    onChange={(e) => handleRecursoChange(index, rIdx, 'descargable', e.target.checked)}
                                                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
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
                                                                <div className="flex flex-col items-start">
                                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">O pegar examen:</label>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => abrirModalPegarTexto(index)}
                                                                        disabled={isParsing}
                                                                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-300 rounded text-xs font-bold transition flex items-center gap-1.5 shadow-sm mt-0.5 cursor-pointer"
                                                                    >
                                                                        <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> Pegar Texto
                                                                    </button>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAgregarPreguntaModulo(index)}
                                                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition flex items-center gap-1 mt-3.5"
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
                                                                        <span className="text-xs text-gray-500 font-medium">minutos (Máx. 300)</span>
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
                                                                                        value={pregunta.pregunta}
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
                                                                                                    value={(pregunta as any)[`opcion_${opt}`]}
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
                                                        ¿Este módulo requiere que el alumno entregue una tarea o práctica?
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
                                                                className="w-full text-xs rounded border-gray-300 p-2.5 border bg-white text-black font-semibold"
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
                                                                className="w-full text-xs rounded border-gray-300 p-2.5 border bg-white text-black font-semibold resize-y"
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
                                                                {(modulo.puzzlePuzzles || [{ pregunta: '', respuesta: '', tipo: 'anagrama' }]).length < 10 && (
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

                                <button type="button" onClick={handleAgregarModulo} className="w-full py-4 border-2 border-dashed border-zinc-300 rounded-2xl text-zinc-500 font-bold hover:border-blue-500 hover:text-blue-600 transition flex justify-center items-center gap-2">
                                    <Plus className="h-5 w-5" /> Añadir Módulo
                                </button>
                            </div>

                            <div className="flex justify-between pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => handleTabChange('info')} className="px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl transition">
                                    Atrás
                                </button>
                                <button type="button" onClick={() => handleTabChange('examen')} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition">
                                    Siguiente: Examen Final
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tab 3: Examen Final */}
                    <div className={activeTab === 'examen' ? 'space-y-6 block' : 'hidden'}>
                        <div className="space-y-6">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-gray-900">3. Evaluación (Examen Final del Curso)</h2>
                                    <p className="text-gray-500 text-xs mt-0.5">Configura un examen general que abarque todos los temas. Este examen es obligatorio para otorgar la constancia si se activa.</p>
                                </div>
                                <button type="button" onClick={() => guardarCurso(true)} disabled={loading} className="flex-shrink-0 whitespace-nowrap px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-sm disabled:opacity-50 shadow-md">
                                    {loading ? 'Guardando...' : 'Guardar Borrador'}
                                </button>
                            </div>

                            <div className="bg-emerald-50/50 border border-emerald-150 rounded-2xl p-6 shadow-sm">
                                <label className="flex items-center cursor-pointer gap-2">
                                    <input type="checkbox" checked={requiereExamen} onChange={(e) => setRequiereExamen(e.target.checked)} className="h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded" />
                                    <span className="block text-sm font-bold text-emerald-950">
                                        Este curso requiere un examen final integral
                                    </span>
                                </label>

                                {requiereExamen && (
                                    <div className="mt-6 pl-0 sm:pl-6 border-l-0 sm:border-l-2 border-emerald-200 space-y-6">
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
                                                <input type="number" min="0" max="100" value={minAprobacion} onChange={(e) => setMinAprobacion(e.target.value === '' ? '' : Number(e.target.value))} className="w-full sm:w-32 rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2.5 text-black bg-white" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Subir Evaluación desde PDF (Carga masiva) o pegar texto</label>
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <input id="input-archivo-examen" type="file" accept=".pdf,application/pdf" onChange={handleUploadExamenHelper} disabled={isParsing} className="block w-full sm:w-2/3 text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white file:text-green-700 hover:file:bg-green-100 border border-green-200 rounded-xl bg-white p-1 cursor-pointer" />
                                                    <button
                                                        type="button"
                                                        onClick={() => abrirModalPegarTexto('final')}
                                                        disabled={isParsing}
                                                        className="w-full sm:w-1/3 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-300 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                                                    >
                                                        <Sparkles className="h-4 w-4 text-green-600" /> Pegar Texto con IA
                                                    </button>
                                                </div>
                                                {isParsing && <p className="text-[10px] font-bold text-green-600 mt-1 animate-pulse italic">Procesando el examen...</p>}
                                                <a href="/ejemplo-examen.html" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 transition-colors">
                                                    📄 Ver ejemplo del formato correcto del PDF
                                                </a>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-emerald-100">
                                            <div>
                                                <label className="flex items-center cursor-pointer gap-2">
                                                    <input type="checkbox" checked={conTiempo} onChange={(e) => setConTiempo(e.target.checked)} className="h-4 w-4 text-emerald-600 focus:ring-emerald-500" />
                                                    <span className="block text-sm font-semibold text-gray-700">Limitar el tiempo de resolución</span>
                                                </label>
                                                {conTiempo && (
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <input 
                                                            type="number" 
                                                            min="2" 
                                                            max="300" 
                                                            value={tiempoExamen} 
                                                            onChange={(e) => setTiempoExamen(e.target.value === '' ? '' : Number(e.target.value))} 
                                                            className="w-24 rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2 text-black bg-white" 
                                                        />
                                                        <span className="text-sm text-gray-600">minutos (Máx. 300)</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <label className="text-sm font-semibold text-gray-700">Número de intentos permitidos:</label>
                                                    <input 
                                                        type="number" 
                                                        min="1" 
                                                        max="10" 
                                                        value={intentosPermitidos} 
                                                        onChange={(e) => setIntentosPermitidos(e.target.value === '' ? '' : Number(e.target.value))} 
                                                        className="w-20 rounded-xl border-gray-300 shadow-sm border p-2 text-black bg-white" 
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-emerald-100">
                                            <label className="flex items-center cursor-pointer gap-2">
                                                <input type="checkbox" checked={seguridadAumentada} onChange={(e) => setSeguridadAumentada(e.target.checked)} className="h-4 w-4 text-emerald-600 focus:ring-emerald-500" />
                                                <span className="block text-sm font-semibold text-gray-700">Habilitar Seguridad Aumentada (Pantalla Completa Obligatoria)</span>
                                            </label>
                                            {seguridadAumentada && (
                                                <div className="mt-3 space-y-2 max-w-xl">
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-xs font-semibold text-gray-600">Máx. Cambios de ventana antes de envío automático:</label>
                                                        <input 
                                                            type="number" 
                                                            min="1" 
                                                            max="10" 
                                                            value={maxCambios} 
                                                            onChange={(e) => setMaxCambios(e.target.value === '' ? '' : Number(e.target.value))} 
                                                            className="w-16 rounded-xl border-gray-300 shadow-sm border p-2 text-black bg-white" 
                                                        />
                                                    </div>
                                                    <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 p-2 rounded-lg leading-normal">
                                                        🔒 Si el estudiante cambia de pestaña o sale del modo pantalla completa más de las veces especificadas, sus respuestas se enviarán de forma automática.
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Final Exam Questions */}
                                        <div className="pt-6 border-t border-emerald-150">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                                                    <FileText className="h-4 w-4" /> Preguntas del Examen ({preguntasExtraidas.length})
                                                </h3>
                                                <button 
                                                    type="button" 
                                                    onClick={handleAgregarPreguntaManual}
                                                    className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1 shadow-sm"
                                                >
                                                    <Plus className="h-3.5 w-3.5" /> Agregar Pregunta
                                                </button>
                                            </div>

                                            {preguntasExtraidas.length === 0 && !isParsing && (
                                                <div className="text-center py-8 bg-white border border-dashed border-emerald-250 rounded-xl">
                                                    <p className="text-xs text-gray-500 italic">No hay preguntas agregadas para el examen final. Créalas de forma manual o sube un PDF.</p>
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                {preguntasExtraidas.map((p, i) => (
                                                    <div key={i} className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm hover:border-emerald-250 transition relative">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleEliminarPreguntaManual(i)}
                                                            className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition"
                                                            title="Eliminar pregunta"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                        
                                                        <div className="grid grid-cols-1 gap-3">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">#{i + 1}</span>
                                                                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Texto de la Pregunta</label>
                                                                    </div>
                                                                    <textarea 
                                                                        required
                                                                        rows={2}
                                                                        value={p.pregunta} 
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
                                                                                <label className="block text-[9px] font-semibold text-gray-455 uppercase">Opción {opt.toUpperCase()}</label>
                                                                                <input 
                                                                                    type="text" 
                                                                                    required={opt === 'a' || opt === 'b'}
                                                                                    value={(p as any)[`opcion_${opt}`]} 
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
                                                                                <label key={letter} className="flex items-center gap-1.5 cursor-pointer">
                                                                                    <input 
                                                                                        type="radio" 
                                                                                        name={`correct_final_${i}`} 
                                                                                        checked={p.respuesta_correcta === letter}
                                                                                        onChange={() => handlePreguntaChange(i, 'respuesta_correcta', letter)}
                                                                                        className="h-3.5 w-3.5 text-emerald-600"
                                                                                    />
                                                                                    <span className={`font-bold ${p.respuesta_correcta === letter ? 'text-emerald-700' : 'text-gray-400'}`}>{letter}</span>
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
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => handleTabChange('modulos')} className="px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl transition">
                                    Atrás
                                </button>
                                <button type="button" onClick={() => handleTabChange('avisos')} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition">
                                    Siguiente: Avisos y Enlaces
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tab 4: Avisos e Historial (Clases en vivo y notas) */}
                    <div className={activeTab === 'avisos' ? 'space-y-6 block' : 'hidden'}>
                        <div className="space-y-6">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-gray-900">4. Clase en Vivo / Enlace e Indicaciones</h2>
                                    <p className="text-gray-500 text-xs mt-0.5 font-medium">Especifica links de Zoom, Teams o Meet y avisa a los alumnos sobre fechas de reunión o lecturas importantes.</p>
                                </div>
                                <button id="btn-enviar-revision" type="submit" disabled={loading || isParsing || (requiereExamen && preguntasExtraidas.length === 0)} className="flex-shrink-0 whitespace-nowrap px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-transform transform active:scale-95 flex items-center gap-2 text-sm">
                                    {loading ? 'Registrando curso...' : 'Guardar curso y Enviar a revisión'}
                                </button>
                            </div>

                            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 shadow-sm space-y-6">
                                <h3 className="text-md font-bold text-blue-950 flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-blue-600" />
                                    Clase en Vivo y Enlace Especial (Opcional)
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-sm font-semibold text-gray-700">Enlace de la Videoconferencia</label>
                                            {formData.reunion_url && (
                                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, reunion_url: '' }))} className="text-[10px] text-red-500 hover:text-red-700 font-bold">
                                                    ✕ LIMPIAR ENLACE
                                                </button>
                                            )}
                                        </div>
                                        <input 
                                            type="url" 
                                            name="reunion_url" 
                                            value={formData.reunion_url} 
                                            onChange={handleChange} 
                                            placeholder="https://zoom.us/j/... o https://meet.google.com/..." 
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 text-black bg-white" 
                                        />
                                        <p className="text-xs text-gray-500 mt-1 italic">Este link se mostrará destacado para los alumnos dentro del salón de clases.</p>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-sm font-semibold text-gray-700">Nota del Instructor para los Estudiantes</label>
                                            {formData.nota_profesor && (
                                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, reunion_url: '' }))} className="text-[10px] text-red-500 hover:text-red-700 font-bold">
                                                    ✕ QUITAR NOTA
                                                </button>
                                            )}
                                        </div>
                                        <textarea 
                                            name="nota_profesor" 
                                            value={formData.nota_profesor} 
                                            onChange={handleChange} 
                                            rows={4} 
                                            placeholder="Escribe indicaciones sobre las clases, fechas de entrega o saludos para tus alumnos..." 
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 text-black bg-white" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => handleTabChange('examen')} className="px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl transition">
                                    Atrás
                                </button>
                                <button id="btn-enviar-revision-2" type="submit" disabled={loading || isParsing || (requiereExamen && preguntasExtraidas.length === 0)} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-transform transform active:scale-95 flex items-center gap-2">
                                    {loading ? 'Registrando curso...' : 'Guardar curso y Enviar a revisión'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Modal para pegar texto de examen con IA */}
            {textExamenModalTarget !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-zinc-200/80 p-6 max-w-2xl w-full shadow-2xl animate-scale-up text-left">
                        <div className="flex items-center justify-between border-b border-zinc-150 pb-3 mb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
                                Importar Examen pegando Texto (IA DeepSeek)
                            </h3>
                            <button
                                type="button"
                                onClick={() => !isParsing && setTextExamenModalTarget(null)}
                                disabled={isParsing}
                                className="text-gray-400 hover:text-gray-600 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <p className="text-xs text-gray-500 mb-3">
                            Copia y pega el texto del examen. Nuestra IA inteligente (DeepSeek) detectará automáticamente las preguntas, las opciones de respuesta y las respuestas correctas.
                        </p>

                        <textarea
                            value={examenTextInput}
                            onChange={(e) => setExamenTextInput(e.target.value)}
                            disabled={isParsing}
                            placeholder={`Ejemplo:\n1. ¿Cuál es el principal objetivo del lavado de manos?\nA) Mejorar la circulación.\nB) Prevenir la transmisión de microorganismos.\nC) Disminuir la temperatura.\nD) Facilitar la administración.\n\nRespuesta correcta:\nB) Prevenir la transmisión de microorganismos.`}
                            className="w-full h-80 rounded-xl border border-zinc-300 p-3 text-xs bg-white text-black font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y disabled:bg-zinc-50 disabled:text-zinc-400"
                        />

                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                type="button"
                                onClick={() => setTextExamenModalTarget(null)}
                                disabled={isParsing}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleProcesarTextoExamen}
                                disabled={isParsing}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-indigo-500/10 flex items-center gap-1.5 cursor-pointer disabled:bg-indigo-400 disabled:cursor-not-allowed"
                            >
                                {isParsing ? (
                                    <>
                                        <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Procesando con IA...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Procesar con IA
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                    onChangePrecio={(p) => setFormData(prev => ({ ...prev, precio: p }))}
                    onChangeAplicarIva={(a) => setAplicarIva(a)}
                />
            )}
        </div>
    )
}