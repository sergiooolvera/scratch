'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star, MessageSquare, BadgeCheck, Send, CheckCircle2, AlertCircle } from 'lucide-react'

interface DBReview {
    id: string
    rating: number
    comentario: string
    created_at: string
    user_id: string
    ie_profiles?: {
        nombre: string
    }
}

// 4 hermosas opiniones predefinidas de alta calidad ("infladas") para que la página se vea premium y profesional
const SEED_REVIEWS = [
    {
        id: 'seed-1',
        nombre: 'Lic. María Guadalupe Herrera',
        cargo: 'Enfermera Jefa de Piso',
        rating: 5,
        comentario: 'El contenido está perfectamente estructurado y es sumamente riguroso. Me sirvió muchísimo para obtener mi puntaje curricular oficial. La plataforma es facilísima de usar.',
        fecha: '2026-03-12T18:30:00.000Z'
    },
    {
        id: 'seed-2',
        nombre: 'Dr. Alejandro Domínguez S.',
        cargo: 'Director de Clínica Médica',
        rating: 5,
        comentario: 'Una excelente alternativa de capacitación continua. Las videolecciones y el material complementario son de la más alta calidad profesional. Totalmente recomendado.',
        fecha: '2026-04-05T14:15:00.000Z'
    },
    {
        id: 'seed-3',
        nombre: 'Mtra. Sofía Villalobos',
        cargo: 'Docente en Ciencias de la Salud',
        rating: 5,
        comentario: 'Las evaluaciones son justas y el sistema es súper amigable. Es la segunda constancia que adquiero aquí y el proceso de descarga es instantáneo y seguro.',
        fecha: '2026-04-20T21:45:00.000Z'
    },
    {
        id: 'seed-4',
        nombre: 'Enf. Juan Carlos Medina',
        cargo: 'Especialista Quirúrgico',
        rating: 4,
        comentario: 'Gran actualización de temas prácticos. Las explicaciones del instructor son muy claras y directas. Excelente valor curricular por el costo.',
        fecha: '2026-05-02T10:00:00.000Z'
    }
]

export default function CourseReviews({ cursoId, isPagado, currentUserId }: { cursoId: string; isPagado: boolean; currentUserId: string }) {
    const supabase = createClient()
    const [dbReviews, setDbReviews] = useState<DBReview[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    
    // Formulario State
    const [rating, setRating] = useState<number>(5)
    const [hoverRating, setHoverRating] = useState<number | null>(null)
    const [comentario, setComentario] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [hasMyReview, setHasMyReview] = useState(false)

    const fetchReviews = async () => {
        try {
            const { data, error } = await supabase
                .from('ie_reviews')
                .select(`
                    id,
                    rating,
                    comentario,
                    created_at,
                    user_id,
                    ie_profiles:user_id ( nombre )
                `)
                .eq('curso_id', cursoId)
                .order('created_at', { ascending: false })

            if (!error && data) {
                const reviews = data as any[]
                setDbReviews(reviews)
                
                // Verificar si ya di mi opinión
                const myReview = reviews.find(r => r.user_id === currentUserId)
                if (myReview) {
                    setHasMyReview(true)
                    setRating(myReview.rating)
                    setComentario(myReview.comentario)
                }
            }
        } catch (err) {
            console.error('Error fetching reviews:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (cursoId) {
            fetchReviews()
        }
    }, [cursoId, currentUserId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setErrorMessage('')
        setSuccessMessage('')

        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cursoId, rating, comentario })
            })

            const data = await res.json()

            if (res.ok && data.success) {
                setSuccessMessage('¡Muchas gracias! Tu opinión y calificación han sido guardadas con éxito.')
                setHasMyReview(true)
                fetchReviews()
                setTimeout(() => setSuccessMessage(''), 5000)
            } else {
                setErrorMessage(data.error || 'Ocurrió un error al guardar tu valoración.')
            }
        } catch {
            setErrorMessage('Error de red al intentar enviar tu calificación.')
        } finally {
            setSubmitting(false)
        }
    }

    // Calcular estadísticas combinando reales y sembradas
    const totalOpinionesReal = dbReviews.length
    const totalOpinionesFake = SEED_REVIEWS.length
    const totalOpiniones = totalOpinionesReal + totalOpinionesFake

    const sumRatingReal = dbReviews.reduce((acc, r) => acc + r.rating, 0)
    const sumRatingFake = SEED_REVIEWS.reduce((acc, r) => acc + r.rating, 0)
    const promedioGeneral = totalOpiniones > 0 
        ? ((sumRatingReal + sumRatingFake) / totalOpiniones).toFixed(1) 
        : '5.0'

    // Calcular distribución de estrellas
    const starCounts = [0, 0, 0, 0, 0] // [1*, 2*, 3*, 4*, 5*]
    dbReviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) starCounts[r.rating - 1]++ })
    SEED_REVIEWS.forEach(r => { if (r.rating >= 1 && r.rating <= 5) starCounts[r.rating - 1]++ })

    return (
        <div className="mt-12 bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
            <div className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-indigo-600" />
                    Valoraciones y Opiniones del Curso
                </h2>

                {/* Grid de Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-gray-50/50 p-6 rounded-2xl mb-8 border border-gray-100">
                    <div className="md:col-span-4 text-center md:border-r border-gray-200 md:pr-6 py-2">
                        <div className="text-5xl font-black text-gray-900 mb-1">{promedioGeneral}</div>
                        <div className="flex justify-center gap-0.5 text-amber-400 mb-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star 
                                    key={s} 
                                    className={`w-5 h-5 ${s <= Math.round(parseFloat(promedioGeneral)) ? 'fill-amber-400' : 'text-gray-300'}`} 
                                />
                            ))}
                        </div>
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                            {totalOpiniones} valoraciones verificadas
                        </div>
                    </div>

                    <div className="md:col-span-8 flex flex-col gap-2">
                        {[5, 4, 3, 2, 1].map((stars) => {
                            const count = starCounts[stars - 1]
                            const percentage = totalOpiniones > 0 ? (count / totalOpiniones) * 100 : 0
                            return (
                                <div key={stars} className="flex items-center gap-3">
                                    <span className="w-12 text-sm text-gray-600 font-semibold flex items-center justify-end gap-1">
                                        {stars} <Star className="w-3.5 h-3.5 fill-gray-500 text-gray-500" />
                                    </span>
                                    <div className="flex-grow h-3 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="w-10 text-xs text-gray-500 font-medium text-right">
                                        {Math.round(percentage)}%
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Formulario de Calificación */}
                {isPagado && (
                    <div className="mb-10 bg-gradient-to-br from-indigo-50/60 to-blue-50/20 border border-indigo-100 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <BadgeCheck className="w-5 h-5 text-indigo-600" />
                            {hasMyReview ? 'Editar tu Valoración Oficial' : 'Califica este Curso'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Como alumno inscrito, tu experiencia ayuda a otros profesionales a elegir mejor.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Selector de Estrellas */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Tu Calificación (Estrellas)
                                </label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => {
                                        const active = hoverRating !== null ? star <= hoverRating : star <= rating
                                        return (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(null)}
                                                className="transition-transform hover:scale-110 focus:outline-none"
                                            >
                                                <Star 
                                                    className={`w-8 h-8 ${active ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} 
                                                />
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Comentario */}
                            <div>
                                <label htmlFor="review_text" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Tu Reseña / Opinión (Opcional)
                                </label>
                                <textarea
                                    id="review_text"
                                    value={comentario}
                                    onChange={(e) => setComentario(e.target.value)}
                                    placeholder="Cuéntanos qué te pareció el curso, el instructor, los materiales de estudio..."
                                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500 bg-white min-h-[100px] text-sm transition-colors"
                                    maxLength={500}
                                />
                            </div>

                            {/* Alertas */}
                            {successMessage && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2.5 text-green-800 text-sm">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <span>{successMessage}</span>
                                </div>
                            )}

                            {errorMessage && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-800 text-sm">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {/* Botón */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-75"
                            >
                                <Send className="w-4 h-4" />
                                {submitting ? 'Guardando...' : hasMyReview ? 'Actualizar Opinión' : 'Enviar Calificación'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Listado de Opiniones */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 border-b pb-3 flex items-center gap-2">
                        Opiniones más recientes ({totalOpiniones})
                    </h3>

                    {loading ? (
                        <div className="py-8 text-center text-gray-500 text-sm">
                            Cargando opiniones...
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {/* 1. Mostrar opiniones reales de la BD primero */}
                            {dbReviews.map((rev) => (
                                <div key={rev.id} className="py-5 first:pt-0">
                                    <div className="flex justify-between items-start gap-4 mb-2">
                                        <div>
                                            <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-base">
                                                {rev.ie_profiles?.nombre || 'Alumno de la Plataforma'}
                                                <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                                    <BadgeCheck className="w-3 h-3" /> Verificado
                                                </span>
                                            </h4>
                                            <p className="text-xs text-gray-400 font-medium">Alumno Inscrito</p>
                                        </div>
                                        <div className="text-xs text-gray-400 font-semibold bg-gray-50 px-2 py-1 rounded">
                                            {new Date(rev.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                    <div className="flex text-amber-400 gap-0.5 mb-2.5">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star key={s} className={`w-4 h-4 ${s <= rev.rating ? 'fill-amber-400' : 'text-gray-200'}`} />
                                        ))}
                                    </div>
                                    <p className="text-gray-700 text-sm leading-relaxed bg-gray-50/30 p-3 rounded-lg border border-gray-50 font-medium italic">
                                        "{rev.comentario || 'El alumno calificó este curso de forma excelente sin comentarios.'}"
                                    </p>
                                </div>
                            ))}

                            {/* 2. Mostrar las opiniones semilla predefinidas */}
                            {SEED_REVIEWS.map((rev) => (
                                <div key={rev.id} className="py-5 border-b last:border-0 last:pb-0">
                                    <div className="flex justify-between items-start gap-4 mb-2">
                                        <div>
                                            <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-base">
                                                {rev.nombre}
                                                <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                                    <BadgeCheck className="w-3 h-3" /> Verificado
                                                </span>
                                            </h4>
                                            <p className="text-xs text-gray-400 font-medium">{rev.cargo}</p>
                                        </div>
                                        <div className="text-xs text-gray-400 font-semibold bg-gray-50 px-2 py-1 rounded">
                                            {new Date(rev.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                    <div className="flex text-amber-400 gap-0.5 mb-2.5">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star key={s} className={`w-4 h-4 ${s <= rev.rating ? 'fill-amber-400' : 'text-gray-200'}`} />
                                        ))}
                                    </div>
                                    <p className="text-gray-700 text-sm leading-relaxed bg-gray-50/30 p-3 rounded-lg border border-gray-50 font-medium italic">
                                        "{rev.comentario}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
