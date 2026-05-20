'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, FileText, CheckCircle, Activity, Plus, Layout, BookOpen, BrainCircuit, MessageSquare, Sparkles, ArrowLeft, History } from 'lucide-react'
import Link from 'next/link'
import { moduloTieneExamenContestado } from './actions'

type Recurso = {
    id?: string;
    titulo: string;
    tipo: 'video' | 'pdf' | 'html' | 'ppt';
    url_contenido: string;
    archivoPdf: File | null;
}

type Modulo = {
    id?: string;
    titulo: string;
    recursos: Recurso[];
    requiereExamen: boolean;
    examenMinAprobacion: number;
    examenPreguntas: PreguntaParsed[];
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
        beneficios: '',
        duracion: '',
        precio: 0,
        instructor: '',
        reunion_url: '',
        nota_profesor: '',
        categoria: 'desarrollo',
    })

    const [vigenciaAnos, setVigenciaAnos] = useState<number>(3)
    const [estadoActual, setEstadoActual] = useState('')
    const [tieneBorrador, setTieneBorrador] = useState(false)
    const [requierePagoCompleto, setRequierePagoCompleto] = useState(false)
    
    // Modules state
    const [modulos, setModulos] = useState<Modulo[]>([])

    // Exam state (Final exam)
    const [requiereExamen, setRequiereExamen] = useState(false)
    const [minAprobacion, setMinAprobacion] = useState<number | ''>(80)
    const [conTiempo, setConTiempo] = useState(false)
    const [tiempoExamen, setTiempoExamen] = useState<number | ''>(60)
    const [seguridadAumentada, setSeguridadAumentada] = useState(false)
    const [maxCambios, setMaxCambios] = useState<number | ''>(3)
    const [intentosPermitidos, setIntentosPermitidos] = useState<number | ''>(3)
    const [preguntasExtraidas, setPreguntasExtraidas] = useState<PreguntaParsed[]>([])
    const [isParsing, setIsParsing] = useState(false)
    const [archivoExamen, setArchivoExamen] = useState<File | null>(null)
    const [modalMessage, setModalMessage] = useState<{ title: string; content: string; type: 'success' | 'error' | 'info'; redirectUrl?: string } | null>(null)

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [mensaje, setMensaje] = useState('')
    const [perfilIncompleto, setPerfilIncompleto] = useState(false)
    const [profile, setProfile] = useState<any>(null)
    const [historialMensaje, setHistorialMensaje] = useState('Se actualizaron datos generales del curso.')
    
    const router = useRouter()
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
                if (prof.rol === 'profesor' || prof.rol === 'vendedor' || prof.rol === 'instructor' || prof.rol === 'institucion') {
                    if (!prof.telefono || !prof.banco || !prof.clabe || !prof.identidad_validada) {
                        setPerfilIncompleto(true)
                        setLoading(false)
                        return
                    }
                }
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

            // Si tiene cambios pendientes y está aprobado, cargamos del borrador
            if (curso.cambios_pendientes && curso.estado === 'aprobado') {
                const borrador = curso.cambios_pendientes;
                setTieneBorrador(true)
                setFormData({
                    titulo: borrador.titulo || curso.titulo,
                    descripcion: borrador.descripcion || curso.descripcion,
                    beneficios: borrador.beneficios || curso.beneficios,
                    duracion: borrador.duracion || curso.duracion,
                    precio: borrador.precio || curso.precio,
                    instructor: borrador.instructor || curso.instructor,
                    reunion_url: borrador.reunion_url || curso.reunion_url || '',
                    nota_profesor: borrador.nota_profesor || curso.nota_profesor || '',
                    categoria: borrador.categoria || curso.categoria || 'desarrollo',
                })
                setVigenciaAnos(borrador.vigencia_anos || curso.vigencia_anos || 3)
                setRequiereExamen(borrador.requiere_examen !== undefined ? borrador.requiere_examen : (curso.requiere_examen || false))
                
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
                                    archivoPdf: null
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
                                archivoPdf: null
                            });
                        }

                        return {
                            id: m.id,
                            titulo: m.titulo,
                            recursos,
                            requiereExamen: !!m.examen,
                            examenMinAprobacion: m.examen?.min_aprobacion || 80,
                            examenPreguntas: (m.examen?.preguntas || []).map((p: any) => ({
                                id: p.id,
                                pregunta: p.pregunta,
                                opcion_a: p.opcion_a,
                                opcion_b: p.opcion_b,
                                opcion_c: p.opcion_c,
                                opcion_d: p.opcion_d,
                                respuesta_correcta: p.respuesta_correcta,
                                tipo_pregunta: p.tipo_pregunta || 'opcion_multiple'
                            }))
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
                beneficios: curso.beneficios,
                duracion: curso.duracion,
                precio: curso.precio,
                instructor: curso.instructor,
                reunion_url: curso.reunion_url || '',
                nota_profesor: curso.nota_profesor || '',
                categoria: curso.categoria || 'desarrollo',
            })
            setVigenciaAnos(curso.vigencia_anos || 3)
            setRequiereExamen(curso.requiere_examen || false)

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
                            archivoPdf: null
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
                            archivoPdf: null
                        });
                    }

                    return {
                        id: m.id,
                        titulo: m.titulo,
                        recursos,
                        requiereExamen: !!exmMod,
                        examenMinAprobacion: exmMod?.min_aprobacion || 80,
                        examenPreguntas: pregsMod.map(p => ({
                            id: p.id,
                            pregunta: p.pregunta,
                            opcion_a: p.opcion_a,
                            opcion_b: p.opcion_b,
                            opcion_c: p.opcion_c,
                            opcion_d: p.opcion_d,
                            respuesta_correcta: p.respuesta_correcta,
                            tipo_pregunta: p.tipo_pregunta || 'opcion_multiple'
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
            examenPreguntas: []
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
        const nuevosModulos = [...modulos]
        nuevosModulos[index] = { ...nuevosModulos[index], [field]: value }
        setModulos(nuevosModulos)
    }

    // Modular resources helpers
    const handleAgregarRecurso = (moduloIdx: number) => {
        const nuevosModulos = [...modulos]
        nuevosModulos[moduloIdx].recursos.push({
            titulo: '',
            tipo: 'video',
            url_contenido: '',
            archivoPdf: null
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
        setSaving(true)
        setMensaje('')

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
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

        let firstUrlContenido = '';

        // 1. Subir archivos de módulos (si los hay)
        setMensaje('Guardando archivos de contenido nuevos...')
        const modulosFinales = []
        for (let i = 0; i < modulos.length; i++) {
            const currentMod = modulos[i];
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
                    url_contenido: finalUrl
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
                examenPreguntas: currentMod.examenPreguntas
            });
        }

        // 2. Guardar logic
        if (estadoActual === 'aprobado') {
            setMensaje('Guardando cambios en el borrador de cambios pendientes...')
            const borrador = {
                titulo: formData.titulo,
                descripcion: formData.descripcion,
                beneficios: formData.beneficios,
                duracion: formData.duracion,
                precio: profile?.rol === 'instructor' ? 0 : Number(formData.precio),
                instructor: formData.instructor,
                vigencia_anos: vigenciaAnos,
                requiere_pago_completo: requierePagoCompleto,
                reunion_url: formData.reunion_url?.trim() || null,
                nota_profesor: formData.nota_profesor?.trim() || null,
                categoria: formData.categoria,
                modulos: modulosFinales.map(m => ({
                    id: m.id,
                    titulo: m.titulo,
                    url_contenido: m.recursos.length > 0 ? m.recursos[0].url_contenido : '',
                    recursos: m.recursos.map((r: any) => ({
                        id: r.id,
                        titulo: r.titulo,
                        tipo: r.tipo,
                        url_contenido: r.url_contenido
                    })),
                    orden: m.orden,
                    examen: m.requiereExamen ? {
                        min_aprobacion: m.examenMinAprobacion,
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
                    beneficios: formData.beneficios,
                    duracion: formData.duracion,
                    precio: profile?.rol === 'instructor' ? 0 : Number(formData.precio),
                    instructor: formData.instructor,
                    vigencia_anos: vigenciaAnos,
                    requiere_pago_completo: requierePagoCompleto,
                    reunion_url: formData.reunion_url?.trim() || null,
                    nota_profesor: formData.nota_profesor?.trim() || null,
                    categoria: formData.categoria,
                    requiere_examen: requiereExamen,
                    url_contenido: firstUrlContenido,
                    estado: 'pendiente'
                })
                .eq('id', id)

            if (errorUpdate) {
                setModalMessage({
                    title: 'Error al Actualizar Curso',
                    content: 'Error al actualizar los datos generales del curso: ' + errorUpdate.message,
                    type: 'error'
                });
                setSaving(false)
                return
            }

            setMensaje('Actualizando temario y exámenes modulares...')
            for (const mod of modulosFinales) {
                const moduloPayload = {
                    curso_id: id,
                    titulo: mod.titulo,
                    url_contenido: mod.recursos.length > 0 ? mod.recursos[0].url_contenido : '',
                    orden: mod.orden
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
                    // Actualizar recursos de modulo
                    await supabase.from('ie_modulo_recursos').delete().eq('modulo_id', moduloId);
                    for (let rIdx = 0; rIdx < mod.recursos.length; rIdx++) {
                        const rec = mod.recursos[rIdx];
                        await supabase.from('ie_modulo_recursos').insert({
                            modulo_id: moduloId,
                            titulo: rec.titulo,
                            url_contenido: rec.url_contenido,
                            orden: rIdx + 1
                        });
                    }

                    if (mod.requiereExamen && mod.examenPreguntas.length > 0) {
                        let { data: exm } = await supabase.from('ie_examenes').select('id').eq('modulo_id', moduloId).single();
                        
                        const examPayload = {
                            curso_id: id,
                            modulo_id: moduloId,
                            min_aprobacion: mod.examenMinAprobacion,
                            tiempo_limite: null,
                            seguridad_aumentada: false,
                            max_cambios_pantalla: 3,
                            intentos_permitidos: 3
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

        setModalMessage({
            title: '¡Curso Guardado!',
            content: 'Los cambios se han guardado correctamente y han sido enviados a revisión por el administrador.',
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
                    {tieneBorrador && (
                        <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
                            Borrador Activo
                        </span>
                    )}
                </div>
            </div>

            {perfilIncompleto && (
                <div className="mb-8 bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex flex-col items-center text-center">
                    <div className="h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                        <Activity className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-bold text-red-900 mb-2">¡Atención! Falta agregar/actualizar información</h2>
                    <p className="text-red-700 mb-6 max-w-md">
                        Para poder operar, es obligatorio que completes tu perfil con tu información completa y que el administrador <strong>valide tu identidad</strong>.
                    </p>
                    <button 
                        onClick={() => router.push('/perfil')}
                        className="bg-red-600 text-white px-8 py-3 rounded-full font-bold hover:bg-red-700 transition-all shadow-lg"
                    >
                        Ir a mi Perfil ahora
                    </button>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className={`flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-px ${perfilIncompleto ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <button
                    onClick={() => setActiveTab('info')}
                    className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 rounded-t-xl transition-all ${
                        activeTab === 'info'
                            ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                            : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-zinc-50'
                    }`}
                >
                    <Layout className="h-4 w-4" />
                    📝 Información General
                </button>
                <button
                    onClick={() => setActiveTab('modulos')}
                    className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 rounded-t-xl transition-all ${
                        activeTab === 'modulos'
                            ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                            : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-zinc-50'
                    }`}
                >
                    <BookOpen className="h-4 w-4" />
                    📚 Temario y Clases
                </button>
                <button
                    onClick={() => setActiveTab('examen')}
                    className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 rounded-t-xl transition-all ${
                        activeTab === 'examen'
                            ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                            : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-zinc-50'
                    }`}
                >
                    <BrainCircuit className="h-4 w-4" />
                    🧠 Evaluación Final (Examen)
                </button>
                <button
                    onClick={() => setActiveTab('avisos')}
                    className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 rounded-t-xl transition-all ${
                        activeTab === 'avisos'
                            ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                            : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-zinc-50'
                    }`}
                >
                    <MessageSquare className="h-4 w-4" />
                    🚀 Avisos y Notas
                </button>
            </div>

            <div className={`bg-white shadow-xl rounded-2xl border border-zinc-105 p-6 lg:p-8 ${perfilIncompleto ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                {mensaje && (
                    <div className={`mb-6 p-4 rounded-xl border ${mensaje.includes('Error') ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                        <p className="font-semibold text-sm">{mensaje}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* Tab 1: Info General */}
                    {activeTab === 'info' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">1. Información Básica del Curso</h2>
                                <p className="text-gray-500 text-xs mt-0.5">Modifica los campos principales del curso y la constancia.</p>
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
                                            <option value="desarrollo">🧠 Desarrollo Humano</option>
                                            <option value="salud">🩺 Salud y Medicina</option>
                                            <option value="arte">🎨 Arte y Cultura</option>
                                            <option value="tecnologia">💻 Tecnología y Ciencia</option>
                                            <option value="educacion">📚 Educación</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                                    {profile?.rol !== 'instructor' ? (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Precio de Venta (MXN)</label>
                                            <div className="relative rounded-xl shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <span className="text-gray-500">$</span>
                                                </div>
                                                <input type="number" step="0.01" name="precio" required min="0" value={formData.precio} onChange={handleChange} className="pl-8 w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 text-black bg-white" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 rounded-xl p-4 flex items-center">
                                            <p className="text-sm text-gray-500 italic">Eres un instructor validado. Tus cursos son gratuitos o gestionados por la institución.</p>
                                        </div>
                                    )}

                                    {profile?.rol !== 'instructor' && (
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
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button type="button" onClick={() => setActiveTab('modulos')} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md">
                                    Siguiente: Clases y Temas
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Temario y Clases (Módulos & PPT/Modular Exams) */}
                    {activeTab === 'modulos' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">2. Temario del Curso (Módulos)</h2>
                                <p className="text-gray-500 text-xs mt-0.5">Organiza las clases de tu temario. Soporta archivos PDF, videos de YouTube, PowerPoint (.ppt, .pptx) o HTML.</p>
                            </div>

                            <div className="space-y-6">
                                {modulos.map((modulo, index) => (
                                    <div key={index} className="bg-white border-2 border-zinc-150 p-6 rounded-2xl relative shadow-md hover:border-zinc-200 transition">
                                        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                                            <h3 className="text-md font-bold text-gray-800 flex items-center gap-2">
                                                <span className="bg-blue-600 text-white text-xs h-6 w-6 rounded-full flex items-center justify-center font-black">{index + 1}</span>
                                                Clase / Objeto de Aprendizaje {modulo.id ? <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Existente</span> : <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">Nuevo</span>}
                                            </h3>
                                            <button type="button" onClick={() => handleEliminarModulo(index)} className="text-red-500 hover:text-red-700 flex items-center text-xs font-bold transition">
                                                <Trash2 className="h-4 w-4 mr-1" /> Eliminar Módulo
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="col-span-full">
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Título de la Clase / Módulo</label>
                                                <input type="text" required placeholder="Ej. Introducción a la Fisiología" value={modulo.titulo} onChange={(e) => handleModuloChange(index, 'titulo', e.target.value)} className="w-full text-sm rounded-lg border-gray-300 p-2.5 border bg-white text-black" />
                                            </div>

                                            <div className="space-y-4 pt-2 col-span-full">
                                                <div className="flex justify-between items-center">
                                                    <label className="block text-xs font-extrabold text-gray-600 uppercase tracking-wider">Recursos del Módulo ({modulo.recursos.length})</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAgregarRecurso(index)}
                                                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-extrabold transition flex items-center gap-1 border border-blue-200"
                                                    >
                                                        <Plus className="h-3.5 w-3.5" /> Añadir Recurso
                                                    </button>
                                                </div>

                                                {modulo.recursos.length === 0 ? (
                                                    <p className="text-xs text-gray-500 italic py-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">No hay recursos en este módulo. Los alumnos verán solo el título y la evaluación (si requiere).</p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {modulo.recursos.map((recurso, rIdx) => (
                                                            <div key={rIdx} className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4 relative shadow-sm hover:shadow transition">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleEliminarRecurso(index, rIdx)}
                                                                    className="absolute top-3 right-3 text-zinc-400 hover:text-red-500 transition"
                                                                    title="Eliminar recurso"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>

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
                                                                            {(['video', 'pdf', 'ppt', 'html'] as const).map(tipoOpt => (
                                                                                <label key={tipoOpt} className="flex items-center text-xs font-semibold text-gray-700 cursor-pointer">
                                                                                    <input
                                                                                        type="radio"
                                                                                        checked={recurso.tipo === tipoOpt}
                                                                                        onChange={() => handleRecursoChange(index, rIdx, 'tipo', tipoOpt)}
                                                                                        className="mr-1.5 h-3.5 w-3.5 text-blue-600 focus:ring-blue-500"
                                                                                    />
                                                                                    {tipoOpt.toUpperCase()}
                                                                                </label>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    <div className="col-span-full pt-1">
                                                                        {recurso.tipo === 'video' ? (
                                                                            <div key={`video-input-container-${index}-${rIdx}`}>
                                                                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Enlace del Video (YouTube o Vimeo)</label>
                                                                                <input
                                                                                    type="url"
                                                                                    required
                                                                                    placeholder="https://www.youtube.com/watch?v=..."
                                                                                    value={recurso.url_contenido || ''}
                                                                                    onChange={(e) => handleRecursoChange(index, rIdx, 'url_contenido', e.target.value)}
                                                                                    className="w-full text-xs rounded border-gray-300 p-2 border bg-white text-black"
                                                                                />
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
                                                    <div className="mt-4 pl-0 sm:pl-6 border-l-0 sm:border-l-2 border-indigo-200 space-y-4">
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
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAgregarPreguntaModulo(index)}
                                                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition flex items-center gap-1 shadow-sm"
                                                            >
                                                                <Plus className="h-3.5 w-3.5" /> Agregar Pregunta al Examen
                                                            </button>
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
                                                                                        <option value="respuesta_libre">✏️ Respuesta Libre (Abierta)</option>
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
                                <button type="button" onClick={() => setActiveTab('info')} className="px-6 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl transition hover:bg-zinc-50">
                                    Atrás
                                </button>
                                <button type="button" onClick={() => setActiveTab('examen')} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md">
                                    Siguiente: Examen Final
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Examen Final */}
                    {activeTab === 'examen' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">3. Configuración del Examen Final del Curso</h2>
                                <p className="text-gray-500 text-xs mt-0.5">El examen final habilitará la generación de constancias premium de la IEDCH para los alumnos inscritos.</p>
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
                                                                            <option value="respuesta_libre">✏️ Respuesta Libre (Abierta)</option>
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
                                <button type="button" onClick={() => setActiveTab('modulos')} className="px-6 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl transition hover:bg-zinc-50">
                                    Atrás
                                </button>
                                <button type="button" onClick={() => setActiveTab('avisos')} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md">
                                    Siguiente: Avisos y Notas
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Tab 4: Avisos e Historial */}
                    {activeTab === 'avisos' && (
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
                                    <button type="button" onClick={() => setActiveTab('examen')} className="px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl transition hover:bg-zinc-50">
                                        Atrás
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-grow py-3 px-6 border border-transparent rounded-xl shadow-md text-base font-black text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50 hover:scale-[1.01]"
                                    >
                                        {saving ? 'Guardando Borrador...' : (estadoActual === 'aprobado' ? 'Guardar Borrador y Solicitar Revisión' : 'Guardar Cambios y Solicitar Revisión')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
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
        </div>
    )
}
