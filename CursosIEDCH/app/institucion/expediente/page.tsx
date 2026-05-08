'use client'

import { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Building2, Search, FileText, PlusCircle, X, Download, AlertTriangle, Users } from 'lucide-react'

export default function ExpedienteInstitucionPage() {
    const [actividades, setActividades] = useState<any[]>([])
    const [creditos, setCreditos] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    
    const [selectedActividad, setSelectedActividad] = useState<any>(null)
    const [alumnos, setAlumnos] = useState<any[]>([])
    const [loadingAlumnos, setLoadingAlumnos] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    
    const [nuevoAlumno, setNuevoAlumno] = useState({ nombre: '', correo: '' })
    const [savingAlumno, setSavingAlumno] = useState(false)
    const [mensajeModal, setMensajeModal] = useState('')

    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/login')
            return
        }

        // Fetch Creditos
        const { data: creds } = await supabase
            .from('ie_institucion_creditos')
            .select('creditos_restantes, plan_actual')
            .eq('user_id', user.id)
            .single()
        setCreditos({
            saldo_constancias: creds?.creditos_restantes || 0,
            plan_actual: creds?.plan_actual || 'Ninguno'
        })

        // Fetch Actividades
        const { data: acts } = await supabase
            .from('ie_actividad_institucion')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
        setActividades(acts || [])

        setLoading(false)
    }

    const openModal = async (actividad: any) => {
        setSelectedActividad(actividad)
        setIsModalOpen(true)
        setMensajeModal('')
        setNuevoAlumno({ nombre: '', correo: '' })
        fetchAlumnos(actividad.id)
    }

    const fetchAlumnos = async (actividadId: string) => {
        setLoadingAlumnos(true)
        const { data } = await supabase
            .from('ie_actividad_alumnos')
            .select('*')
            .eq('actividad_id', actividadId)
            .order('created_at', { ascending: true })
        setAlumnos(data || [])
        setLoadingAlumnos(false)
    }

    const handleAgregarAlumno = async (e: React.FormEvent) => {
        e.preventDefault()
        setMensajeModal('')

        if (creditos?.saldo_constancias <= 0) {
            setMensajeModal('Error: No tienes saldo de constancias suficiente.')
            return
        }

        if (!nuevoAlumno.nombre.trim()) {
            setMensajeModal('Error: El nombre es obligatorio.')
            return
        }

        setSavingAlumno(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Insertar Alumno (Constancia)
        const { data: alumnoGuardado, error: insertError } = await supabase
            .from('ie_actividad_alumnos')
            .insert({
                actividad_id: selectedActividad.id,
                nombre_alumno: nuevoAlumno.nombre,
                correo_alumno: nuevoAlumno.correo
            }).select().single()

        if (insertError) {
            setMensajeModal('Error al registrar alumno: ' + insertError.message)
            setSavingAlumno(false)
            return
        }

        // Deducir 1 crédito
        const nuevoSaldo = creditos.saldo_constancias - 1
        await supabase.from('ie_institucion_creditos')
            .update({ creditos_restantes: nuevoSaldo })
            .eq('user_id', user.id)

        setCreditos({ ...creditos, saldo_constancias: nuevoSaldo })
        setAlumnos([...alumnos, alumnoGuardado])
        setNuevoAlumno({ nombre: '', correo: '' })
        setMensajeModal('¡Constancia generada exitosamente! Saldo deducido.')
        setSavingAlumno(false)
    }

    const filteredActividades = actividades.filter(a => 
        (a.nombre_actividad?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (a.tipo_actividad?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando expediente...</div>

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                <FileText className="h-8 w-8 text-indigo-600" />
                Expediente de Actividades
            </h1>

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 w-full md:w-auto flex items-center gap-4">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Saldo Constancias</p>
                        <p className={`text-2xl font-black ${creditos?.saldo_constancias > 0 ? 'text-indigo-600' : 'text-red-500'}`}>
                            {creditos?.saldo_constancias || 0}
                        </p>
                    </div>
                    {creditos?.saldo_constancias <= 0 && (
                        <button onClick={() => router.push('/institucion/registrar-actividad')} className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-2 rounded-lg hover:bg-indigo-100">
                            Comprar Plan
                        </button>
                    )}
                </div>

                <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 flex items-center w-full md:max-w-md">
                    <Search className="h-5 w-5 text-gray-400 mx-2" />
                    <input 
                        type="text" 
                        placeholder="Buscar actividad..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full border-none focus:ring-0 text-sm p-2 text-black bg-white"
                    />
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-indigo-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-900 uppercase tracking-wider">Actividad</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-900 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-900 uppercase tracking-wider">Fecha / Duración</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-900 uppercase tracking-wider">Facilitador</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-indigo-900 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredActividades.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 font-medium">
                                        No se encontraron actividades registradas.
                                    </td>
                                </tr>
                            ) : (
                                filteredActividades.map((act) => (
                                    <tr key={act.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{act.nombre_actividad}</div>
                                            <div className="text-xs text-gray-500 mt-1 line-clamp-1">{act.ubicacion || 'Sin ubicación específica'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-blue-100 text-blue-800">
                                                {act.tipo_actividad}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <div className="font-medium text-gray-900">{formatFecha(act.fecha_ejecucion)}</div>
                                            <div className="text-xs text-gray-500">{act.duracion}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {act.autor}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                                            <button 
                                                onClick={() => router.push(`/institucion/actividad/${act.id}/constancia`)}
                                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-md font-bold transition-colors flex items-center"
                                                title="Ver Constancia de Registro"
                                            >
                                                <FileText className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => openModal(act)}
                                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-md font-bold transition-colors"
                                            >
                                                Ver Detalle
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Detalle y Alumnos */}
            {isModalOpen && selectedActividad && (
                <ErrorBoundary>
                    <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}></div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="relative z-10 inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full border border-gray-200">
                            
                            <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                                <h3 className="text-lg leading-6 font-bold text-white flex items-center gap-2" id="modal-title">
                                    <FileText className="h-5 w-5" />
                                    Detalle de Actividad
                                </h3>
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => router.push(`/institucion/actividad/${selectedActividad.id}/constancia`)}
                                        className="text-sm bg-white text-indigo-700 hover:bg-indigo-50 font-bold px-3 py-1 rounded-md transition"
                                    >
                                        Ver Constancia
                                    </button>
                                    <button onClick={() => setIsModalOpen(false)} className="text-indigo-200 hover:text-white transition-colors">
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="px-6 py-5 bg-gray-50 border-b border-gray-200">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actividad</p>
                                        <p className="font-bold text-gray-900">{selectedActividad.nombre_actividad}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tipo</p>
                                        <p className="font-semibold text-gray-700">{selectedActividad.tipo_actividad}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fecha</p>
                                        <p className="font-semibold text-gray-700">
                                            {formatFecha(selectedActividad.fecha_ejecucion)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Facilitador</p>
                                        <p className="font-semibold text-gray-700">{selectedActividad.autor}</p>
                                    </div>
                                </div>

                                {/* Fotografías y Documentos de Respaldo */}
                                {selectedActividad.fotos && selectedActividad.fotos.length > 0 && (
                                    <div className="mt-5 pt-4 border-t border-gray-200">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Documentos / Fotografías de Respaldo</p>
                                        <div className="flex flex-wrap gap-3">
                                            {selectedActividad.fotos.map((url: string, index: number) => {
                                                const isImage = /\.(jpg|jpeg|png|webp|gif)/i.test(url) || url.includes('image');
                                                return (
                                                    <a 
                                                        key={index} 
                                                        href={url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 px-3 py-2 rounded-lg text-xs font-bold text-gray-700 hover:text-indigo-700 transition shadow-sm cursor-pointer"
                                                    >
                                                        {isImage ? (
                                                            <div className="relative w-8 h-8 rounded overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50 flex items-center justify-center">
                                                                <img src={url} alt={`Evidencia ${index + 1}`} className="object-cover w-full h-full" />
                                                            </div>
                                                        ) : (
                                                            <FileText className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                                                        )}
                                                        <span>Evidencia {index + 1}</span>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="px-6 py-6 border-t border-gray-200 bg-white">
                                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-indigo-500" />
                                    Detalle General del Registro
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 border border-gray-150 rounded-xl p-4 transition-all hover:shadow-sm">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Duración Validez Curricular</p>
                                        <p className="font-bold text-gray-900 mt-1 text-base">{selectedActividad.duracion}</p>
                                    </div>
                                    <div className="bg-gray-50 border border-gray-150 rounded-xl p-4 transition-all hover:shadow-sm">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ubicación / Sede</p>
                                        <p className="font-bold text-gray-900 mt-1 text-base">{selectedActividad.ubicacion || 'Presencial / En Línea'}</p>
                                    </div>
                                    <div className="bg-gray-50 border border-gray-150 rounded-xl p-4 md:col-span-2 transition-all hover:shadow-sm">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Institución que Acredita</p>
                                        <p className="font-semibold text-gray-800 mt-1 text-sm">{selectedActividad.institucion_acredita || 'INSTITUTO EDUCATIVO DE ESPECIALIDADES PARA LA CAPACITACION NACIONAL'}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/30 border border-indigo-100 rounded-xl p-4 md:col-span-2 transition-all hover:shadow-sm">
                                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Folio Único de Registro</p>
                                        <p className="font-black text-indigo-950 font-mono text-lg mt-1 tracking-wide">
                                            IEECDH-{selectedActividad.id.split('-')[0].toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            </div>
                        </div>
                    </div>
                </ErrorBoundary>
            )}
        </div>
    )
}

const formatFecha = (fechaStr: string) => {
    if (!fechaStr) return '';
    try {
        const d = new Date(fechaStr);
        if (isNaN(d.getTime())) return fechaStr || '';
        return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        return fechaStr || '';
    }
}

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error inside Modal:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black bg-opacity-60">
          <div className="bg-white p-6 rounded-xl shadow-xl border border-red-100 text-center max-w-sm">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50 mb-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Error de Renderizado</h3>
            <p className="text-sm text-red-600 mb-4 font-mono text-left bg-red-50 p-3 rounded overflow-auto max-h-32">{this.state.error?.message}</p>
            <button onClick={() => window.location.reload()} className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg text-sm hover:bg-indigo-700 transition">
              Cargar de nuevo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
