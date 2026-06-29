'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminNavbar from '@/components/AdminNavbar'
import { 
  MessageSquare, 
  Search, 
  Calendar, 
  User, 
  Mail, 
  Clock, 
  FileText, 
  Filter, 
  Users, 
  UserMinus, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react'

export default function AdminComentariosPage() {
  const supabase = createClient()
  
  const [comentarios, setComentarios] = useState<any[]>([])
  const [filteredComentarios, setFilteredComentarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Datos del perfil para el AdminNavbar
  const [userProfile, setUserProfile] = useState<{ rol: string; permisos: string[] }>({
    rol: 'alumno',
    permisos: []
  })

  // Estados de Filtro y Búsqueda
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'todos' | 'autenticados' | 'anonimos' | 'alumno' | 'profesor' | 'vendedor'>('todos')
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    hoy: 0,
    autenticados: 0,
    anonimos: 0
  })

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        
        // 1. Obtener información del usuario actual para el Navbar
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

        // 2. Obtener comentarios con el perfil relacionado
        const { data: dataComentarios, error: fetchError } = await supabase
          .from('ie_comentarios')
          .select(`
            id,
            nombre,
            email,
            mensaje,
            created_at,
            user_id,
            profile:ie_profiles (
              nombre,
              apellido_paterno,
              apellido_materno,
              rol
            )
          `)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError

        const mappedComentarios = (dataComentarios || []).map((com: any) => {
          const hasProfile = !!com.profile
          const userRol = com.profile?.rol || null
          const nombreCompleto = hasProfile 
            ? [com.profile.nombre, com.profile.apellido_paterno, com.profile.apellido_materno].filter(Boolean).join(' ') 
            : com.nombre || null

          return {
            id: com.id,
            mensaje: com.mensaje,
            created_at: com.created_at,
            email: com.email || (hasProfile ? 'Registrado en cuenta' : null),
            nombre: nombreCompleto || 'Invitado Anónimo',
            user_id: com.user_id,
            rol: userRol,
            is_anonimo: !com.user_id
          }
        })

        setComentarios(mappedComentarios)
        setFilteredComentarios(mappedComentarios)

        // Calcular Estadísticas
        const hoyStr = new Date().toDateString()
        const countHoy = mappedComentarios.filter(c => new Date(c.created_at).toDateString() === hoyStr).length
        const countAutenticados = mappedComentarios.filter(c => !c.is_anonimo).length
        const countAnonimos = mappedComentarios.filter(c => c.is_anonimo).length

        setStats({
          total: mappedComentarios.length,
          hoy: countHoy,
          autenticados: countAutenticados,
          anonimos: countAnonimos
        })

      } catch (err: any) {
        console.error('Error al cargar datos de administración:', err)
        setError('Ocurrió un error al obtener los comentarios. Verifica tus permisos de administrador.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  // Aplicar Filtros y Búsqueda
  useEffect(() => {
    let result = [...comentarios]

    // Filtrar por término de búsqueda
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase()
      result = result.filter(c => 
        (c.nombre && c.nombre.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.mensaje && c.mensaje.toLowerCase().includes(q))
      )
    }

    // Filtrar por tipo
    if (filterType === 'autenticados') {
      result = result.filter(c => !c.is_anonimo)
    } else if (filterType === 'anonimos') {
      result = result.filter(c => c.is_anonimo)
    } else if (filterType !== 'todos') {
      result = result.filter(c => c.rol === filterType)
    }

    setFilteredComentarios(result)
    setCurrentPage(1) // Resetear a la primera página tras filtrar
  }, [searchQuery, filterType, comentarios])

  // Paginación de resultados
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredComentarios.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredComentarios.length / itemsPerPage)

  const getRolBadgeColor = (rol: string | null) => {
    switch (rol) {
      case 'admin':
        return 'bg-red-50 text-red-700 border-red-100'
      case 'profesor':
      case 'instructor':
        return 'bg-blue-50 text-blue-700 border-blue-100'
      case 'vendedor':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'alumno':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100'
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100'
    }
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      {/* Navbar de Administración */}
      <AdminNavbar rol={userProfile.rol} permisos={userProfile.permisos} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            Revisión de Comentarios y Sugerencias
          </h1>
          <p className="mt-2 text-slate-600 max-w-3xl">
            Bandeja de entrada para revisar las opiniones, sugerencias y reportes enviados por los usuarios de la plataforma.
          </p>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex items-start gap-4">
            <UserMinus className="w-6 h-6 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-lg">Error de Acceso</h3>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        ) : loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-4"></div>
            <p className="text-slate-500 font-medium">Cargando comentarios...</p>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* Tarjetas de Estadísticas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Comentarios</span>
                <span className="text-3xl font-extrabold text-slate-900 mt-2">{stats.total}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recibidos Hoy</span>
                <span className="text-3xl font-extrabold text-blue-600 mt-2">{stats.hoy}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuarios Logueados</span>
                <span className="text-3xl font-extrabold text-indigo-600 mt-2">{stats.autenticados}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Invitados Anónimos</span>
                <span className="text-3xl font-extrabold text-emerald-600 mt-2">{stats.anonimos}</span>
              </div>
            </div>

            {/* Controles de Búsqueda y Filtro */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
              {/* Barra de Búsqueda */}
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, correo o mensaje..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Filtros */}
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
                <select
                  value={filterType}
                  onChange={(e: any) => setFilterType(e.target.value)}
                  className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="todos">Todos los comentarios</option>
                  <option value="autenticados">Solo Autenticados</option>
                  <option value="anonimos">Solo Anónimos</option>
                  <option value="alumno">Solo Alumnos</option>
                  <option value="profesor">Solo Profesores/Instructores</option>
                  <option value="vendedor">Solo Vendedores</option>
                </select>
              </div>
            </div>

            {/* Tabla / Lista de Comentarios */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {currentItems.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50/70">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Autor</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Comentario / Sugerencia</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {currentItems.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                            {/* Celda: Autor */}
                            <td className="px-6 py-5 whitespace-nowrap align-top">
                              <div className="flex flex-col gap-1.5">
                                <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                  <User className="w-4 h-4 text-slate-400" />
                                  {c.nombre}
                                </span>
                                {c.email && (
                                  <span className="text-xs text-slate-500 flex items-center gap-1.5 font-mono">
                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                    {c.email}
                                  </span>
                                )}
                                {c.rol ? (
                                  <span className={`inline-flex items-center self-start px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRolBadgeColor(c.rol)} uppercase tracking-wider`}>
                                    {c.rol}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center self-start px-2 py-0.5 rounded-full text-[10px] font-bold border bg-slate-50 text-slate-500 border-slate-200 uppercase tracking-wider">
                                    Invitado
                                  </span>
                                )}
                              </div>
                            </td>
                            {/* Celda: Mensaje */}
                            <td className="px-6 py-5 align-top">
                              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-w-2xl bg-slate-50/40 p-4 rounded-2xl border border-slate-100/50">
                                {c.mensaje}
                              </p>
                            </td>
                            {/* Celda: Fecha */}
                            <td className="px-6 py-5 whitespace-nowrap align-top text-xs text-slate-400 font-semibold font-mono">
                              <div className="flex items-center gap-1.5 mt-1">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(c.created_at).toLocaleString('es-MX', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación */}
                  {totalPages > 1 && (
                    <div className="bg-slate-50/40 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">
                        Mostrando del {indexOfFirstItem + 1} al {Math.min(indexOfLastItem, filteredComentarios.length)} de {filteredComentarios.length} comentarios
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold text-slate-700 px-3">
                          Página {currentPage} de {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-20 text-center">
                  <div className="mx-auto h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                    <UserMinus className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">No se encontraron comentarios</h3>
                  <p className="text-slate-500 max-w-xs mx-auto mt-1 text-sm">
                    Intenta cambiar los filtros o el término de búsqueda actual.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
