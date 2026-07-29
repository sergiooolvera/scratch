'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminNavbar from '@/components/AdminNavbar'
import { 
  Search, 
  Calendar, 
  Clock, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  SlidersHorizontal,
  X,
  Laptop,
  Smartphone,
  Eye,
  Activity,
  User,
  ShieldAlert,
  Database
} from 'lucide-react'

interface AuditLog {
  id: string
  user_id: string | null
  evento: string
  detalles: any
  ip_address: string | null
  user_agent: string | null
  created_at: string
  email: string
  nombre_completo: string
  rol_usuario: string
}

export default function AdminAuditoriaPage() {
  const supabase = createClient()
  
  // Datos del perfil para el AdminNavbar
  const [userProfile, setUserProfile] = useState<{ rol: string; permisos: string[] }>({
    rol: 'alumno',
    permisos: []
  })
  
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchApplied, setSearchApplied] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Filtros de Búsqueda
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvento, setSelectedEvento] = useState<string>('todos')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  
  // Modal de detalles
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  useEffect(() => {
    async function loadAdminProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('ie_profiles')
            .select('rol, permisos_adminjr')
            .eq('id', user.id)
            .single()
            
          if (profile) {
            setUserProfile({
              rol: profile.rol,
              permisos: profile.permisos_adminjr || []
            })
          }
        }
      } catch (err) {
        console.error('Error al cargar perfil de administrador:', err)
      }
    }
    loadAdminProfile()
  }, [])

  const fetchLogs = async () => {
    // Validar que exista al menos un criterio de búsqueda para no hacer la consulta pesada
    const hasFilter = searchQuery.trim() !== '' || (selectedEvento && selectedEvento !== 'todos') || startDate !== '' || endDate !== ''

    if (!hasFilter) {
      setError('Por favor, ingresa al menos un criterio de búsqueda (usuario, tipo de actividad o fechas) para consultar los logs.')
      setLogs([])
      setFilteredLogs([])
      setSearchApplied(false)
      return
    }

    setLoading(true)
    setError(null)
    setSearchApplied(true)
    try {
      // Construir query string de los filtros
      const params = new URLSearchParams()
      if (selectedEvento && selectedEvento !== 'todos') params.append('evento', selectedEvento)
      if (startDate) params.append('fechaInicio', startDate)
      if (endDate) params.append('fechaFin', endDate)
      if (searchQuery) params.append('search', searchQuery)

      const res = await fetch(`/api/admin/auditoria?${params.toString()}`)
      const result = await res.json()

      if (res.ok) {
        setLogs(result.data || [])
        setFilteredLogs(result.data || [])
      } else {
        throw new Error(result.error || 'Error al obtener los logs')
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchLogs()
    setIsRefreshing(false)
    setCurrentPage(1)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchLogs()
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedEvento('todos')
    setStartDate('')
    setEndDate('')
    // Esperar a que se actualicen las variables locales y volver a fetch
    setTimeout(() => {
      fetchLogs()
      setCurrentPage(1)
    }, 50)
  }

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)

  // Obtener Badge del Evento con estilos premium
  const getEventoBadge = (evento: string) => {
    const base = "px-3 py-1 text-xs font-semibold rounded-full border text-center inline-block whitespace-nowrap"
    let clases = ""
    switch (evento) {
      case 'INICIO_SESION':
        clases = `${base} bg-blue-50/70 text-blue-700 border-blue-200/50`
        break
      case 'EXAMEN_ENTREGADO':
        clases = `${base} bg-amber-50/70 text-amber-700 border-amber-200/50`
        break
      case 'COMPRA_CURSO_STRIPE':
      case 'COMPRA_PLAN_INSTITUCION':
        clases = `${base} bg-emerald-50/70 text-emerald-700 border-emerald-200/50`
        break
      case 'PAGO_MANUAL_APROBADO':
        clases = `${base} bg-teal-50/70 text-teal-700 border-teal-200/50`
        break
      case 'PAGO_MANUAL_RECHAZADO':
        clases = `${base} bg-rose-50/70 text-rose-700 border-rose-200/50`
        break
      case 'CONSTANCIA_DESCARGADA':
        clases = `${base} bg-purple-50/70 text-purple-700 border-purple-200/50`
        break
      case 'MODULO_VISTO':
        clases = `${base} bg-slate-100/70 text-slate-700 border-slate-200/50`
        break
      default:
        clases = `${base} bg-zinc-100 text-zinc-700 border-zinc-200`
    }
    return <span className={clases}>{evento.replace(/_/g, ' ')}</span>
  };

  // Convertir metadata JSON en una frase amigable e intuitiva
  const renderLogDescripcion = (log: AuditLog) => {
    const { evento, detalles, nombre_completo } = log
    if (!detalles) return 'Acción realizada'

    switch (evento) {
      case 'INICIO_SESION':
        return `Inicio de sesión exitoso por ${detalles.metodo === 'contrasena_maestra' ? 'Contraseña Maestra 🔑' : 'Contraseña estándar 👤'}.`
      case 'EXAMEN_ENTREGADO':
        return `${detalles.tipo === 'final' ? 'Examen Final' : 'Examen Modular'} entregado. Calificación: ${detalles.calificacion}% (${detalles.aprobado ? 'Aprobado ✅' : 'Reprobado ❌'}).`
      case 'COMPRA_CURSO_STRIPE':
        return `Compró el curso vía Stripe. Monto: $${detalles.monto} MXN (${detalles.pago_completo ? 'Liquidado completo 💳' : 'Pago parcial'}).`
      case 'COMPRA_PLAN_INSTITUCION':
        return `Compró plan institucional: ${detalles.plan_id?.toUpperCase()}. Acreditó +${detalles.creditos} créditos.`
      case 'PAGO_MANUAL_APROBADO':
        return `Pago manual validado e inscrito. Aprobado por Admin ID: ${detalles.aprobado_por || 'N/A'}.`
      case 'PAGO_MANUAL_RECHAZADO':
        return `Pago manual rechazado. Nota: "${detalles.notas || 'Sin comentarios'}". Rechazado por Admin.`
      case 'CONSTANCIA_DESCARGADA':
        return `Descargó archivo PDF de ${detalles.tipo || 'constancia'} para el curso "${detalles.titulo_curso || 'N/A'}".`
      case 'MODULO_VISTO':
        return `Vio y completó el recurso: "${detalles.titulo_modulo || 'N/A'}".`
      default:
        return detalles.mensaje || 'Detalle no especificado'
    }
  }

  // Deducir dispositivo básico del user agent
  const renderDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Laptop className="w-4 h-4 text-slate-400" />
    const ua = userAgent.toLowerCase()
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="w-4 h-4 text-slate-400" title={userAgent} />
    }
    return <Laptop className="w-4 h-4 text-slate-400" title={userAgent} />
  }

  // Estadísticas rápidas del set actual
  const statsLogs = {
    total: filteredLogs.length,
    iniciosSesion: filteredLogs.filter(l => l.evento === 'INICIO_SESION').length,
    examenes: filteredLogs.filter(l => l.evento === 'EXAMEN_ENTREGADO').length,
    compras: filteredLogs.filter(l => l.evento.includes('COMPRA') || l.evento === 'PAGO_MANUAL_APROBADO').length
  }

  return (
    <div className="bg-zinc-50 min-h-screen font-sans">
      <AdminNavbar rol={userProfile.rol} permisos={userProfile.permisos} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Cabecera y Título */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Activity className="h-8 w-8 text-blue-600 animate-pulse" />
              Logs de Auditoría
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Monitoreo en tiempo real de actividades críticas de usuarios, seguridad, compras y avance escolar.
            </p>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-700 transition active:scale-95 disabled:opacity-50 select-none cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar logs
          </button>
        </div>

        {/* Tarjetas de Estadísticas Rápidas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Actividades</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{statsLogs.total}</h3>
            </div>
          </div>
          <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Inicios Sesión</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{statsLogs.iniciosSesion}</h3>
            </div>
          </div>
          <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Exámenes</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{statsLogs.examenes}</h3>
            </div>
          </div>
          <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Compras/Pagos</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{statsLogs.compras}</h3>
            </div>
          </div>
        </div>

        {/* Panel de Filtros */}
        <div className="bg-white border border-slate-200/70 p-6 rounded-3xl shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-700">Filtros y Búsqueda Avanzada</h2>
          </div>
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Buscador */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Usuario / Email / Evento</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Nombre, correo, evento o ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white text-slate-800"
                />
              </div>
            </div>

            {/* Actividad */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tipo de Actividad</label>
              <select
                value={selectedEvento}
                onChange={(e) => {
                  setSelectedEvento(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white text-slate-800 font-medium select-none"
              >
                <option value="todos">Todos los eventos</option>
                <option value="INICIO_SESION">Inicios de Sesión (LOGIN)</option>
                <option value="EXAMEN_ENTREGADO">Exámenes Entregados</option>
                <option value="COMPRA_CURSO_STRIPE">Compras Stripe (Cursos)</option>
                <option value="COMPRA_PLAN_INSTITUCION">Compras Planes (Institucional)</option>
                <option value="PAGO_MANUAL_APROBADO">Pagos Manuales Aprobados</option>
                <option value="PAGO_MANUAL_RECHAZADO">Pagos Manuales Rechazados</option>
                <option value="CONSTANCIA_DESCARGADA">Descargas de Constancia/Microcredencial</option>
                <option value="MODULO_VISTO">Clases/Módulos Vistos</option>
              </select>
            </div>

            {/* Fecha Inicio */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fecha Desde</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white text-slate-800"
                />
              </div>
            </div>

            {/* Fecha Fin */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fecha Hasta</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white text-slate-800"
                />
              </div>
            </div>

          </form>

          {/* Botones de acción */}
          <div className="mt-5 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition select-none cursor-pointer"
            >
              Limpiar Filtros
            </button>
            <button
              onClick={fetchLogs}
              className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm select-none cursor-pointer"
            >
              Buscar
            </button>
          </div>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl mb-6 shadow-sm flex items-start gap-3">
            <Info className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-800">Error al obtener logs</h4>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Tabla de Logs */}
        <div className="bg-white border border-slate-200/70 rounded-3xl shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            {!searchApplied ? (
              <div className="flex flex-col items-center justify-center p-20 text-center">
                <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 border border-slate-100/50">
                  <SlidersHorizontal className="h-8 w-8 animate-pulse" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Consulta de historial de auditoría</h3>
                <p className="text-slate-400 text-xs mt-1.5 max-w-md mx-auto">
                  Para optimizar el rendimiento, por favor define al menos un criterio de búsqueda (usuario, tipo de actividad o fechas) y haz clic en "Buscar" para visualizar los logs.
                </p>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center p-20 gap-3">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-slate-500 text-sm font-medium">Buscando actividades en el servidor...</p>
              </div>
            ) : currentLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-center">
                <div className="h-16 w-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                  <SlidersHorizontal className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No se encontraron logs de auditoría</h3>
                <p className="text-slate-400 text-xs mt-1 max-w-sm">No existen registros que coincidan con los filtros seleccionados actualmente. Intenta con otros parámetros.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-100 text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha / Hora</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Usuario / Email</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Actividad</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Descripción</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {currentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/40 transition">
                      
                      {/* Fecha y Hora */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium text-slate-700">
                            {new Date(log.created_at).toLocaleDateString('es-MX', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="text-slate-400 text-xs">
                            {new Date(log.created_at).toLocaleTimeString('es-MX', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Usuario */}
                      <td className="px-6 py-4.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-xs tracking-wide">
                            {log.nombre_completo}
                          </span>
                          <span className="text-slate-400 text-xs mt-0.5 font-medium">
                            {log.email}
                          </span>
                        </div>
                      </td>

                      {/* Evento Badge */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        {getEventoBadge(log.evento)}
                      </td>

                      {/* Descripción Corta */}
                      <td className="px-6 py-4.5">
                        <span className="text-slate-600 text-xs font-medium line-clamp-2">
                          {renderLogDescripcion(log)}
                        </span>
                      </td>

                      {/* Botón Ver Detalle JSON */}
                      <td className="px-6 py-4.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-xl transition cursor-pointer"
                          title="Inspeccionar datos técnicos del log"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200/60 pt-4 px-1">
            <span className="text-xs font-semibold text-slate-400">
              Mostrando logs {indexOfFirstItem + 1} al {Math.min(indexOfLastItem, filteredLogs.length)} de {filteredLogs.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-50 select-none cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700">
                Pág. {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-50 select-none cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Modal Interactivo de Inspección de Log */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="relative bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header del Modal */}
            <div className="flex items-center justify-between px-6 py-4.5 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Inspección de Actividad</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5 font-mono">ID: {selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-5">
              
              {/* Información General */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Usuario Titular</h4>
                  <p className="text-xs font-bold text-slate-800 mt-1">{selectedLog.nombre_completo}</p>
                  <p className="text-xs text-slate-400">{selectedLog.email}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Fecha de Creación</h4>
                  <p className="text-xs font-bold text-slate-800 mt-1">
                    {new Date(selectedLog.created_at).toLocaleString('es-MX', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Datos Técnicos IP / User Agent */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    {renderDeviceIcon(selectedLog.user_agent)}
                  </div>
                  <div>
                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Dispositivo / Agente</h5>
                    <p className="text-[11px] font-bold text-slate-700 truncate max-w-[200px]" title={selectedLog.user_agent || 'N/A'}>
                      {selectedLog.user_agent || 'Desconocido/API'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <Laptop className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Dirección IP</h5>
                    <p className="text-[11px] font-bold text-slate-700 font-mono">
                      {selectedLog.ip_address || 'No capturada'}
                    </p>
                  </div>
                </div>
              </div>

              {/* JSON de Detalles */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Metadatos del Evento (detalles JSONB)</h4>
                <pre className="bg-slate-950 text-slate-100 font-mono p-4.5 rounded-2xl overflow-x-auto text-xs whitespace-pre-wrap leading-relaxed max-h-60 shadow-inner">
                  {JSON.stringify(selectedLog.detalles, null, 2)}
                </pre>
              </div>

            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-xs font-bold text-white rounded-xl transition shadow-sm select-none cursor-pointer"
              >
                Cerrar Visor
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
