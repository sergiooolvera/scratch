'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Eye, X, FileText, PlayCircle, Trash2, Activity } from 'lucide-react'

type Curso = any;

export default function AdminCursosPage() {
    const [cursos, setCursos] = useState<Curso[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [procesandoAccion, setProcesandoAccion] = useState<string | null>(null)

    // Preview Modal state
    const [previewCurso, setPreviewCurso] = useState<Curso | null>(null)
    const [previewModulos, setPreviewModulos] = useState<any[]>([])
    const [loadingPreview, setLoadingPreview] = useState(false)

    // Draft audit modal state
    const [auditCurso, setAuditCurso] = useState<Curso | null>(null)
    const [auditOriginal, setAuditOriginal] = useState<any | null>(null)
    const [auditDraft, setAuditDraft] = useState<any | null>(null)
    const [loadingAudit, setLoadingAudit] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        fetchCursos()
    }, [])

    const fetchCursos = async () => {
        const { data } = await supabase.from('ie_cursos').select('*, creador:ie_profiles!creado_por(nombre)').order('created_at', { ascending: false })
        if (data) setCursos(data)
        setLoading(false)
    }

    const handleEstadoChange = async (cursoId: string, newEstado: string) => {
        let razon = '';
        if (newEstado === 'rechazado') {
            const inputRazon = prompt('Por favor, ingresa el motivo del rechazo del curso (este mensaje se enviará al usuario):');
            if (inputRazon === null) return;
            if (inputRazon.trim() === '') {
                alert('Debes ingresar un motivo para poder rechazar el curso.');
                return;
            }
            razon = inputRazon.trim();
        }

        const { error } = await supabase.from('ie_cursos').update({ estado: newEstado }).eq('id', cursoId)
        if (!error) {
            setCursos(cursos.map(c => c.id === cursoId ? { ...c, estado: newEstado } : c))

            // AUTO-NOTIFY on approval
            if (newEstado === 'aprobado') {
                try {
                    fetch('/api/profesor/notificar-reunion', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cursoId })
                    }).then(res => res.json()).then(data => {
                        console.log('[AUTO-NOTIFY] Status:', data)
                    })
                } catch (notifyErr) {
                    console.error('[AUTO-NOTIFY-ERROR]', notifyErr)
                }
            }

            if (newEstado === 'rechazado') {
                const cursoRechazado = cursos.find(c => c.id === cursoId);
                try {
                    const response = await fetch('/api/send-rejection-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: 'sergio.olver@gmail.com',
                            courseTitle: cursoRechazado?.titulo || 'Desconocido',
                            instructorName: cursoRechazado?.creador?.nombre || cursoRechazado?.instructor || 'Instructor',
                            reason: razon
                        })
                    });

                    if (response.ok) {
                        alert(`El curso fue rechazado y se ha enviado un correo a sergio.olver@gmail.com con el motivo.`);
                    } else {
                        const data = await response.json();
                        console.error('API Error:', data.error);
                        alert(`El curso se rechazó en la base de datos, pero hubo un error enviando el correo: ${data.error}`);
                    }
                } catch (err) {
                    console.error('Fetch Error:', err);
                    alert('El curso se rechazó, pero hubo un error intentando enviar el correo.');
                }
            }
        } else {
            alert('Error al actualizar el estado: ' + error.message)
        }
    }

    const handleEliminarCurso = async (cursoId: string) => {
        const confirmar = window.confirm("¿Estás seguro de querer eliminar este curso lógicamente? Desaparecerá del catálogo.");
        if (!confirmar) return;

        // 1. Verificar si tiene compras
        const { data: compras, error: errCompras } = await supabase
            .from('ie_compras')
            .select('id')
            .eq('curso_id', cursoId)
            .limit(1);

        if (errCompras) {
            alert("Error al verificar compras: " + errCompras.message);
            return;
        }

        if (compras && compras.length > 0) {
            alert("No se puede eliminar este curso porque ya ha sido comprado por alumnos.");
            return;
        }

        // 2. Si no hay compras, aplicar borrado lógico
        const { error } = await supabase.from('ie_cursos').update({ estado: 'eliminado' }).eq('id', cursoId);

        if (error) {
            alert("Error al eliminar el curso: " + error.message);
        } else {
            alert("Curso eliminado lógicamente con éxito.");
            setCursos(cursos.map(c => c.id === cursoId ? { ...c, estado: 'eliminado' } : c));
        }
    }

    const handleAprobarCambios = async (cursoId: string, draft: any) => {
        const confirmar = window.confirm("¿Aprobar y publicar estos cambios? Reemplazarán la versión actual del curso en el catálogo.");
        if (!confirmar) return;

        try {
            setProcesandoAccion(cursoId);
            const res = await fetch('/api/admin/aprobar-borrador', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cursoId, draft })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }

            alert("Los cambios han sido aprobados y el curso está actualizado");
            fetchCursos();
            closeAudit();
        } catch (err: any) {
            alert("Error aprobando cambios: " + err.message);
        } finally {
            setProcesandoAccion(null);
        }
    }

    const handleSuperCursoToggle = async (cursoId: string, checked: boolean) => {
        const { error } = await supabase
            .from('ie_cursos')
            .update({ es_super_curso: checked })
            .eq('id', cursoId)

        if (error) {
            alert('Error actualizando Super Curso: ' + error.message)
            return
        }

        setCursos(cursos.map(c => c.id === cursoId ? { ...c, es_super_curso: checked } : c))
    }

    const handleRechazarCambios = async (cursoId: string) => {
        const confirmar = window.confirm("¿Rechazar estos cambios? El borrador se borrará pero la versión pública original seguirá intacta.");
        if (!confirmar) return;

        await supabase.from('ie_cursos').update({ cambios_pendientes: null }).eq('id', cursoId);
        alert("Borrador rechazado y eliminado.");
        fetchCursos();
    }

    const handleOpenPreview = async (curso: Curso) => {
        setPreviewCurso(curso)
        setLoadingPreview(true)

        // Fetch modules for this course
        const { data } = await supabase
            .from('ie_curso_modulos')
            .select('*')
            .eq('curso_id', curso.id)
            .order('orden', { ascending: true })

        setPreviewModulos(data || [])
        setLoadingPreview(false)
    }

    const closePreview = () => {
        setPreviewCurso(null)
        setPreviewModulos([])
    }

    const inferTipoRecurso = (url?: string, fallback?: string) => {
        if (fallback) return fallback
        const ext = (url || '').split('?')[0].split('.').pop()?.toLowerCase()
        if (ext === 'pdf') return 'pdf'
        if (ext === 'ppt' || ext === 'pptx') return 'ppt'
        if (ext === 'html' || ext === 'htm') return 'html'
        return 'video'
    }

    const normalizePregunta = (p: any, idx: number) => ({
        pregunta: p?.pregunta || '',
        tipo_pregunta: p?.tipo_pregunta || 'opcion_multiple',
        opcion_a: p?.opcion_a || '',
        opcion_b: p?.opcion_b || '',
        opcion_c: p?.opcion_c || '',
        opcion_d: p?.opcion_d || '',
        respuesta_correcta: p?.respuesta_correcta || 'A',
        orden: p?.orden || idx + 1
    })

    const normalizeDraftModule = (m: any, idx: number) => ({
        titulo: m?.titulo || '',
        orden: m?.orden || idx + 1,
        url_contenido: m?.url_contenido || '',
        recursos: (m?.recursos && Array.isArray(m.recursos) ? m.recursos : (m?.url_contenido ? [{ titulo: 'Material del Módulo', url_contenido: m.url_contenido }] : [])).map((r: any, rIdx: number) => ({
            titulo: r?.titulo || `Recurso ${rIdx + 1}`,
            tipo: inferTipoRecurso(r?.url_contenido, r?.tipo),
            url_contenido: r?.url_contenido || '',
            orden: r?.orden || rIdx + 1
        })),
        examen: m?.examen ? {
            min_aprobacion: m.examen.min_aprobacion ?? 80,
            tiempo_limite: m.examen.tiempo_limite ?? null,
            seguridad_aumentada: !!m.examen.seguridad_aumentada,
            max_cambios_pantalla: m.examen.max_cambios_pantalla !== undefined ? m.examen.max_cambios_pantalla : 2,
            intentos_permitidos: m.examen.intentos_permitidos !== undefined ? m.examen.intentos_permitidos : 2,
            preguntas: (m.examen.preguntas || []).map(normalizePregunta)
        } : null,
        requiereTarea: !!m?.requiereTarea,
        tareaInstrucciones: m?.tareaInstrucciones || '',
        tareaPuntos: m?.tareaPuntos || '',
        requiereCuestionario: !!m?.requiereCuestionario,
        cuestionarioPreguntas: m?.cuestionarioPreguntas || []
    })

    const normalizeExam = (exam: any, preguntas: any[] = []) => exam ? ({
        min_aprobacion: exam.min_aprobacion ?? 80,
        tiempo_limite: exam.tiempo_limite ?? null,
        seguridad_aumentada: !!exam.seguridad_aumentada,
        max_cambios_pantalla: exam.max_cambios_pantalla ?? 3,
        intentos_permitidos: exam.intentos_permitidos ?? 3,
        preguntas: preguntas.map(normalizePregunta)
    }) : null

    const handleOpenAudit = async (curso: Curso) => {
        setAuditCurso(curso)
        setAuditDraft({
            ...curso.cambios_pendientes,
            modalidad: curso.cambios_pendientes?.modalidad,
            limite_inscripcion: curso.cambios_pendientes?.limite_inscripcion ? new Date(curso.cambios_pendientes.limite_inscripcion).toISOString().split('T')[0] : null,
            modulos: (curso.cambios_pendientes?.modulos || []).map(normalizeDraftModule),
            examen: curso.cambios_pendientes?.examen ? normalizeExam(curso.cambios_pendientes.examen, curso.cambios_pendientes.examen.preguntas || []) : null
        })
        setAuditOriginal(null)
        setLoadingAudit(true)

        const [{ data: modulos }, { data: examenes }, { data: respuestas }] = await Promise.all([
            supabase
                .from('ie_curso_modulos')
                .select('*')
                .eq('curso_id', curso.id)
                .order('orden', { ascending: true }),
            supabase
                .from('ie_examenes')
                .select('*')
                .eq('curso_id', curso.id),
            supabase
                .from('ie_preguntas_respuestas')
                .select('pregunta')
                .eq('curso_id', curso.id)
                .eq('respuesta', 'TAREA_DEFINICION')
        ])

        const moduloIds = (modulos || []).map((m: any) => m.id)
        const examenIds = (examenes || []).map((e: any) => e.id)

        const [{ data: recursos }, { data: preguntas }, { data: cuestionarios }] = await Promise.all([
            moduloIds.length > 0
                ? supabase
                    .from('ie_modulo_recursos')
                    .select('*')
                    .in('modulo_id', moduloIds)
                    .order('orden', { ascending: true })
                : Promise.resolve({ data: [] } as any),
            examenIds.length > 0
                ? supabase
                    .from('ie_preguntas')
                    .select('*')
                    .in('examen_id', examenIds)
                    .order('orden', { ascending: true })
                : Promise.resolve({ data: [] } as any),
            moduloIds.length > 0
                ? supabase
                    .from('ie_cuestionario_preguntas')
                    .select('*')
                    .in('modulo_id', moduloIds)
                    .order('orden', { ascending: true })
                : Promise.resolve({ data: [] } as any)
        ])

        const normalizedModules = (modulos || []).map((m: any, idx: number) => {
            const moduloRecursos = (recursos || []).filter((r: any) => r.modulo_id === m.id)
            const moduloExam = (examenes || []).find((e: any) => e.modulo_id === m.id)
            const moduloPreguntas = moduloExam ? (preguntas || []).filter((p: any) => p.examen_id === moduloExam.id) : []

            const tareaDefData = (respuestas || []).find((r: any) => r.pregunta.startsWith(`TAREA_DEFINICION:${m.id}::`));
            let requiereTarea = false;
            let tareaInstrucciones = '';
            let tareaPuntos = '';
            
            if (tareaDefData) {
                requiereTarea = true;
                const parts = tareaDefData.pregunta.split('::');
                try {
                    const payload = JSON.parse(parts.slice(1).join('::'));
                    tareaInstrucciones = payload.instrucciones || '';
                    tareaPuntos = payload.puntos || '';
                } catch (e) {}
            }

            return {
                titulo: m.titulo || '',
                orden: m.orden || idx + 1,
                url_contenido: m.url_contenido || '',
                recursos: (moduloRecursos.length > 0 ? moduloRecursos : (m.url_contenido ? [{ titulo: 'Material del Módulo', url_contenido: m.url_contenido, orden: 1 }] : [])).map((r: any, rIdx: number) => ({
                    titulo: r.titulo || `Recurso ${rIdx + 1}`,
                    tipo: inferTipoRecurso(r.url_contenido, r.tipo),
                    url_contenido: r.url_contenido || '',
                    orden: r.orden || rIdx + 1
                })),
                examen: moduloExam ? normalizeExam(moduloExam, moduloPreguntas) : null,
                requiereTarea,
                tareaInstrucciones,
                tareaPuntos,
                requiereCuestionario: (cuestionarios || []).filter((q: any) => q.modulo_id === m.id).length > 0,
                cuestionarioPreguntas: (cuestionarios || []).filter((q: any) => q.modulo_id === m.id).map((q: any) => ({
                    id: q.id,
                    pregunta: q.pregunta,
                    orden: q.orden
                }))
            }
        })

        const finalExam = (examenes || []).find((e: any) => !e.modulo_id)
        const finalQuestions = finalExam ? (preguntas || []).filter((p: any) => p.examen_id === finalExam.id) : []

        setAuditOriginal({
            titulo: curso.titulo,
            descripcion: curso.descripcion,
            beneficios: curso.beneficios,
            duracion: curso.duracion,
            precio: curso.precio,
            instructor: curso.instructor,
            categoria: curso.categoria,
            vigencia_anos: curso.vigencia_anos,
            requiere_pago_completo: curso.requiere_pago_completo,
            requiere_examen: curso.requiere_examen,
            reunion_url: curso.reunion_url,
            nota_profesor: curso.nota_profesor,
            modalidad: curso.modalidad,
            limite_inscripcion: curso.limite_inscripcion ? new Date(curso.limite_inscripcion).toISOString().split('T')[0] : null,
            modulos: normalizedModules,
            examen: normalizeExam(finalExam, finalQuestions)
        })
        setLoadingAudit(false)
    }

    const closeAudit = () => {
        setAuditCurso(null)
        setAuditOriginal(null)
        setAuditDraft(null)
        setLoadingAudit(false)
    }

    const sameValue = (a: any, b: any) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
    const textValue = (value: any) => {
        if (value === true) return 'Sí'
        if (value === false) return 'No'
        if (value === null || value === undefined || value === '') return 'Sin dato'
        
        // Si el valor tiene el patrón de fecha YYYY-MM-DD (ej. 2026-06-03)
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            const [y, m, d] = value.split('-')
            return `${d}/${m}/${y}`
        }
        
        return String(value)
    }

    const renderFieldCompare = (label: string, key: string) => {
        const originalValue = auditOriginal?.[key]
        const draftValue = auditDraft?.[key]
        const changed = !sameValue(originalValue, draftValue)

        return (
            <div className={`grid grid-cols-1 md:grid-cols-[180px_1fr_1fr] gap-3 p-3 border rounded-lg ${changed ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white'}`}>
                <div className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Original</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">{textValue(originalValue)}</p>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Nuevo</p>
                    <p className={`text-sm whitespace-pre-wrap break-words ${changed ? 'font-semibold text-amber-900' : 'text-gray-900'}`}>{textValue(draftValue)}</p>
                </div>
            </div>
        )
    }

    const renderQuestionList = (preguntas: any[] = []) => {
        if (!preguntas.length) return <p className="text-xs text-gray-500 italic">Sin preguntas</p>
        return (
            <ol className="space-y-2">
                {preguntas.map((p: any, idx: number) => (
                    <li key={idx} className="text-xs text-gray-700 border border-gray-100 rounded p-2 bg-white">
                        <p className="font-semibold text-gray-900">{idx + 1}. {p.pregunta || 'Pregunta sin texto'}</p>
                        <p className="mt-1 text-gray-500">Tipo: {p.tipo_pregunta || 'opcion_multiple'} · Respuesta: {p.respuesta_correcta || 'A'}</p>
                    </li>
                ))}
            </ol>
        )
    }

    const renderModuleColumn = (mod: any) => {
        if (!mod) return <p className="text-sm text-gray-400 italic">No existe</p>
        return (
            <div className="space-y-3">
                <div>
                    <p className="font-semibold text-gray-900">{mod.orden}. {mod.titulo || 'Módulo sin título'}</p>
                    {mod.url_contenido && <p className="text-xs text-blue-600 break-all mt-1">{mod.url_contenido}</p>}
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Recursos</p>
                    {mod.recursos?.length ? (
                        <ul className="space-y-1">
                            {mod.recursos.map((r: any, idx: number) => (
                                <li key={idx} className="text-xs text-gray-700">
                                    <span className="font-medium">{idx + 1}. {r.titulo}</span>
                                    <span className="text-gray-400"> ({r.tipo})</span>
                                    <p className="text-blue-600 break-all">{r.url_contenido}</p>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-xs text-gray-500 italic">Sin recursos</p>}
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Tarea del módulo</p>
                    {mod.requiereTarea ? (
                        <div className="space-y-1 bg-blue-50 p-2 rounded-md border border-blue-100">
                            <p className="text-xs font-semibold text-blue-900">Instrucciones:</p>
                            <p className="text-xs text-blue-800 whitespace-pre-wrap">{mod.tareaInstrucciones || 'Sin instrucciones'}</p>
                            {mod.tareaPuntos && <p className="text-xs text-blue-800 mt-1 font-semibold">Valor: {mod.tareaPuntos} pts</p>}
                        </div>
                    ) : <p className="text-xs text-gray-500 italic">No requiere tarea</p>}
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Examen del módulo</p>
                    {mod.examen ? (
                        <div className="space-y-2">
                            <p className="text-xs text-gray-700">
                                Mínimo: {mod.examen.min_aprobacion}% · 
                                Tiempo: {mod.examen.tiempo_limite ? `${mod.examen.tiempo_limite} min` : 'Sin límite'} · 
                                Intentos: {mod.examen.intentos_permitidos !== undefined ? mod.examen.intentos_permitidos : 2}
                            </p>
                            <p className="text-xs text-gray-700">
                                Seguridad aumentada: {mod.examen.seguridad_aumentada ? 'Sí' : 'No'}
                                {mod.examen.seguridad_aumentada && ` · Pestañas permitidas: ${mod.examen.max_cambios_pantalla !== undefined ? mod.examen.max_cambios_pantalla : 2}`}
                            </p>
                            {renderQuestionList(mod.examen.preguntas || [])}
                        </div>
                    ) : <p className="text-xs text-gray-500 italic">Sin examen modular</p>}
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Cuestionario del módulo</p>
                    {mod.requiereCuestionario && mod.cuestionarioPreguntas && mod.cuestionarioPreguntas.length > 0 ? (
                        <div className="space-y-2">
                            {mod.cuestionarioPreguntas.map((p: any, i: number) => (
                                <div key={i} className="bg-white p-2 rounded-md border border-gray-100 text-xs">
                                    <p className="font-bold text-gray-800">{i + 1}. {p.pregunta}</p>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-xs text-gray-500 italic">No requiere cuestionario</p>}
                </div>
            </div>
        )
    }

    const renderModulesCompare = () => {
        const originals = auditOriginal?.modulos || []
        const drafts = auditDraft?.modulos || []
        const maxLength = Math.max(originals.length, drafts.length)
        if (!maxLength) return <p className="text-sm text-gray-500 italic">No hay módulos en ninguna versión.</p>

        return Array.from({ length: maxLength }).map((_, idx) => {
            const original = originals[idx]
            const draft = drafts[idx]
            const changed = !sameValue(original, draft)
            return (
                <div key={idx} className={`border rounded-xl p-4 ${changed ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-gray-900">Módulo {idx + 1}</h4>
                        {changed && <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-100 px-2 py-1 rounded-full">Cambió</span>}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Original</p>
                            {renderModuleColumn(original)}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Nuevo</p>
                            {renderModuleColumn(draft)}
                        </div>
                    </div>
                </div>
            )
        })
    }

    const renderFinalExamCompare = () => {
        const changed = !sameValue(auditOriginal?.examen, auditDraft?.examen)
        return (
            <div className={`border rounded-xl p-4 ${changed ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-900">Examen final</h4>
                    {changed && <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-100 px-2 py-1 rounded-full">Cambió</span>}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[['Original', auditOriginal?.examen], ['Nuevo', auditDraft?.examen]].map(([label, exam]: any) => (
                        <div key={label}>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">{label}</p>
                            {exam ? (
                                <div className="space-y-2">
                                    <p className="text-xs text-gray-700">Mínimo: {exam.min_aprobacion}% · Tiempo: {exam.tiempo_limite || 'Sin límite'} · Intentos: {exam.intentos_permitidos || 3}</p>
                                    <p className="text-xs text-gray-700">Seguridad aumentada: {textValue(exam.seguridad_aumentada)} · Cambios de pantalla: {exam.max_cambios_pantalla || 3}</p>
                                    {renderQuestionList(exam.preguntas || [])}
                                </div>
                            ) : <p className="text-sm text-gray-400 italic">No existe</p>}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 relative">
            <h1 className="text-2xl font-bold mb-6">Revisión de Cursos</h1>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Buscar curso por título o instructor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/3 px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm text-black bg-white"
                />
            </div>

            {/* Modal Preview */}
            {previewCurso && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-75 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-5 border-b border-gray-200">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Previsualizando: {previewCurso.titulo}</h2>
                                <p className="text-sm text-gray-500 mt-1">Instructor: {previewCurso.instructor}</p>
                            </div>
                            <button onClick={closePreview} className="text-gray-400 hover:text-gray-600 transition p-1">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto bg-gray-50 flex-grow">
                            {/* Main format info */}
                            <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Información General</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <p><span className="text-gray-500">Duración:</span> {previewCurso.duracion}</p>
                                    <p><span className="text-gray-500">Precio:</span> ${previewCurso.precio}</p>
                                    <p className="col-span-2"><span className="text-gray-500">Beneficios:</span> {previewCurso.beneficios}</p>
                                </div>
                            </div>

                            {/* Contenido (Módulos o Legacy Single URL) */}
                            <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Contenido (Videos / Documentos)</h3>
                                {loadingPreview ? (
                                    <p className="text-gray-500 text-sm py-4">Cargando material...</p>
                                ) : previewModulos.length > 0 ? (
                                    <ul className="divide-y divide-gray-100">
                                        {previewModulos.map((mod, i) => (
                                            <li key={i} className="py-3 flex items-start gap-3">
                                                <PlayCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">Módulo {i + 1}: {mod.titulo}</p>
                                                    <a href={mod.url_contenido} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs break-all">
                                                        {mod.url_contenido}
                                                    </a>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : previewCurso.url_contenido ? (
                                    <div className="flex items-start gap-3 py-2">
                                        <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">Documento o Video Principal</p>
                                            <a href={previewCurso.url_contenido} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs break-all">
                                                {previewCurso.url_contenido}
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-red-500 text-sm">No se encontró contenido para este curso.</p>
                                )}
                            </div>

                            {/* Examen */}
                            {previewCurso.requiere_examen && previewCurso.url_examen && (
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <h3 className="text-sm font-semibold text-green-900 uppercase tracking-wider mb-2">Examen / Constancia</h3>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-green-800">El instructor requiere examen en PDF para este curso.</p>
                                        <a href={previewCurso.url_examen} target="_blank" rel="noopener noreferrer" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium shadow-sm transition">
                                            Ver PDF
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t border-gray-200 bg-white flex justify-end">
                            <button onClick={closePreview} className="px-5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                                Cerrar Previsualización
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Auditoría de Borrador */}
            {auditCurso && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-75 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col">
                        <div className="flex justify-between items-start p-5 border-b border-gray-200">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
                                    <Activity className="h-4 w-4" /> Comparación de borrador pendiente
                                </p>
                                <h2 className="text-xl font-bold text-gray-900 mt-1">{auditCurso.titulo}</h2>
                                <p className="text-sm text-gray-500 mt-1">Revisa exactamente qué se reemplazará al aprobar la edición.</p>
                            </div>
                            <button onClick={closeAudit} className="text-gray-400 hover:text-gray-600 transition p-1">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto bg-gray-50 flex-grow space-y-6">
                            {loadingAudit ? (
                                <p className="text-gray-500 text-sm py-10 text-center">Cargando comparación completa...</p>
                            ) : (
                                <>
                                    <section className="space-y-3">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Datos generales</h3>
                                            <p className="text-xs text-gray-500 mt-1">Las filas en amarillo indican valores distintos entre la versión publicada y el borrador.</p>
                                        </div>
                                        {renderFieldCompare('Título', 'titulo')}
                                        {renderFieldCompare('Descripción', 'descripcion')}
                                        {renderFieldCompare('Competencias', 'competencias')}
                                        {renderFieldCompare('Beneficios', 'beneficios')}
                                        {renderFieldCompare('Duración', 'duracion')}
                                        {renderFieldCompare('Precio', 'precio')}
                                        {renderFieldCompare('Instructor', 'instructor')}
                                        {renderFieldCompare('Categoría', 'categoria')}
                                        {renderFieldCompare('Vigencia años', 'vigencia_anos')}
                                        {renderFieldCompare('Pago completo', 'requiere_pago_completo')}
                                        {renderFieldCompare('Requiere examen', 'requiere_examen')}
                                        {renderFieldCompare('Enlace reunión', 'reunion_url')}
                                        {renderFieldCompare('Nota instructor', 'nota_profesor')}
                                        {renderFieldCompare('Modalidad', 'modalidad')}
                                        {renderFieldCompare('Límite Inscripción', 'limite_inscripcion')}
                                    </section>

                                    <section className="space-y-3">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Módulos, recursos y exámenes modulares</h3>
                                        {renderModulesCompare()}
                                    </section>

                                    <section className="space-y-3">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Examen final</h3>
                                        {renderFinalExamCompare()}
                                    </section>
                                </>
                            )}
                        </div>

                        <div className="p-5 border-t border-gray-200 bg-white flex justify-end gap-3">
                            <button onClick={closeAudit} className="px-5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                                Cerrar
                            </button>
                            <button
                                onClick={() => {
                                    if (auditCurso?.cambios_pendientes) {
                                        handleAprobarCambios(auditCurso.id, auditCurso.cambios_pendientes)
                                    }
                                }}
                                disabled={procesandoAccion === auditCurso.id || loadingAudit}
                                className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-md text-sm font-bold transition"
                            >
                                {procesandoAccion === auditCurso.id ? 'Aprobando...' : 'Aprobar edición'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Curso</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instructor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Super Curso</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado actual</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase text-center">Revisar Contenido</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {cursos.filter(c =>
                            c.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.instructor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.creador?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
                        ).filter(c => c.estado !== 'eliminado').map(c => (
                            <tr key={c.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.titulo}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.creador?.nombre || c.instructor}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${c.precio}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <label className="inline-flex items-center gap-2 select-none">
                                        <input
                                            type="checkbox"
                                            checked={!!c.es_super_curso}
                                            onChange={(e) => handleSuperCursoToggle(c.id, e.target.checked)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <span className="text-xs font-semibold text-gray-700">Super</span>
                                    </label>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.estado === 'aprobado' ? 'bg-green-100 text-green-800' : c.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                        {c.estado}
                                    </span>
                                    {c.cambios_pendientes && (
                                        <span className="block mt-1 px-2 inline-flex text-xs leading-5 font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                            Borrador Pendiente
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <button
                                        onClick={() => c.cambios_pendientes ? handleOpenAudit(c) : handleOpenPreview(c)}
                                        className="inline-flex items-center px-3 py-1.5 border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md text-xs font-medium transition-colors"
                                    >
                                        <Eye className="h-4 w-4 mr-1" /> {c.cambios_pendientes ? 'Ver Cambios' : 'Ver Módulos'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        {!c.cambios_pendientes && (
                                            <select
                                                value={c.estado}
                                                onChange={(e) => handleEstadoChange(c.id, e.target.value)}
                                                className="block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border text-black bg-white"
                                            >
                                                <option value="pendiente">Pendiente</option>
                                                <option value="aprobado">Aprobado</option>
                                                <option value="rechazado">Rechazado</option>
                                            </select>
                                        )}
                                        <button
                                            onClick={() => handleEliminarCurso(c.id)}
                                            className="text-red-600 hover:text-red-900 p-1.5 bg-red-50 hover:bg-red-100 rounded transition-colors ml-auto"
                                            title="Eliminar curso lógicamente"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                    {c.cambios_pendientes && (
                                        <div className="flex gap-2 w-full mt-1">
                                            <button
                                                onClick={() => handleAprobarCambios(c.id, c.cambios_pendientes)}
                                                disabled={procesandoAccion === c.id}
                                                className={`flex-1 bg-green-100 text-green-800 hover:bg-green-200 px-2 py-1.5 rounded text-xs font-bold transition-colors shadow-sm border border-green-200 ${procesandoAccion === c.id ? 'opacity-50 cursor-wait' : ''}`}
                                            >
                                                {procesandoAccion === c.id ? 'Aprobando...' : 'Aprobar Edición'}
                                            </button>
                                            <button
                                                onClick={() => handleRechazarCambios(c.id)}
                                                className="flex-1 bg-red-100 text-red-800 hover:bg-red-200 px-2 py-1.5 rounded text-xs font-bold transition-colors shadow-sm border border-red-200"
                                            >
                                                Rechazar Edición
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {cursos.length === 0 && !loading && (
                            <tr><td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">No hay cursos creados</td></tr>
                        )}
                        {loading && <tr><td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">Cargando...</td></tr>}
                    </tbody>
                 </table>
                 </div>
             </div>
        </div>
    )
}
