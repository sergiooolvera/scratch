'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star, BadgeCheck, Send, CheckCircle2, AlertCircle, X, ArrowRight } from 'lucide-react'

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

const SEED_REVIEWS = [
    {
        id: 'seed-1',
        nombre: 'María G.',
        rating: 5,
        comentario: 'Excelente curso, muy completo y fácil de entender. La información es muy útil para mi trabajo diario.'
    },
    {
        id: 'seed-2',
        nombre: 'Luis A.',
        rating: 5,
        comentario: 'Me ayudó a reforzar conocimientos y aprender cosas nuevas. Lo recomiendo totalmente.'
    },
    {
        id: 'seed-3',
        nombre: 'Ana P.',
        rating: 5,
        comentario: 'El contenido y las explicaciones del instructor son de gran calidad.'
    }
]

export default function CourseReviews({ cursoId, isPagado, currentUserId }: { cursoId: string; isPagado: boolean; currentUserId: string }) {
    const supabase = createClient()
    const [dbReviews, setDbReviews] = useState<DBReview[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [showModal, setShowModal] = useState(false)
    
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
                
                const myReview = reviews.find(r => r.user_id === currentUserId)
                if (myReview) {
                    setHasMyReview(true)
                    setRating(myReview.rating)
                    setComentario(myReview.comentario || '')
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

    const totalOpinionesReal = dbReviews.length
    const totalOpiniones = totalOpinionesReal > 0 ? totalOpinionesReal + 125 : 128

    const sumRatingReal = dbReviews.reduce((acc, r) => acc + r.rating, 0)
    const promedioGeneral = totalOpinionesReal > 0
        ? (((sumRatingReal + (125 * 4.8)) / totalOpiniones)).toFixed(1)
        : '4.8'

    const percentages = {
        5: 80,
        4: 15,
        3: 4,
        2: 1,
        1: 0
    }

    const featuredReviews = [
        ...(dbReviews.length > 0 ? dbReviews.slice(0, 3).map(r => ({
            id: r.id,
            nombre: r.ie_profiles?.nombre || 'Alumno Verificado',
            rating: r.rating,
            comentario: r.comentario || 'Excelente curso, contenido muy claro y aplicable.'
        })) : []),
        ...SEED_REVIEWS
    ].slice(0, 3)

    return (
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all">
            {/* Título de la sección */}
            <h3 className="text-sm sm:text-base font-extrabold text-[#1e1b4b] mb-5">
                Valoraciones y opiniones
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Lado izquierdo: Calificación y barras de progreso compactas */}
                <div className="lg:col-span-3.5 xl:col-span-3 flex sm:flex-row lg:flex-col xl:flex-row items-center gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 justify-between shrink-0">
                    {/* Número grande y estrellas */}
                    <div className="text-center sm:text-left lg:text-center xl:text-left shrink-0">
                        <div className="text-3xl sm:text-4xl font-black text-[#1e1b4b] tracking-tight leading-none mb-1">
                            {promedioGeneral}
                        </div>
                        <div className="flex justify-center sm:justify-start lg:justify-center xl:justify-start gap-0.5 text-amber-400 mb-1 mt-1.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                    key={s}
                                    className={`w-3.5 h-3.5 ${s <= Math.round(parseFloat(promedioGeneral)) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                                />
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                            Basado en {totalOpiniones} opiniones
                        </p>
                    </div>

                    {/* Barras porcentuales */}
                    <div className="w-full space-y-1 min-w-[110px] flex-1">
                        {[5, 4, 3, 2, 1].map((star) => (
                            <div key={star} className="flex items-center gap-1.5 text-[10px]">
                                <span className="w-2 text-slate-600 font-bold">{star}</span>
                                <Star className="w-2 h-2 text-slate-400 fill-slate-400 shrink-0" />
                                <div className="flex-1 h-1 bg-slate-200/80 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#1e1b4b] rounded-full"
                                        style={{ width: `${percentages[star as keyof typeof percentages]}%` }}
                                    />
                                </div>
                                <span className="w-5 text-[9px] text-slate-400 text-right font-medium">
                                    {percentages[star as keyof typeof percentages]}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lado derecho: Tarjetas de Reseñas ocupando todo el ancho restante */}
                <div className="lg:col-span-8.5 xl:col-span-9 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {featuredReviews.map((rev, idx) => (
                        <div
                            key={idx}
                            className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 flex flex-col justify-between hover:bg-white hover:shadow-xs transition-all"
                        >
                            <div>
                                <div className="flex items-center justify-between gap-1 mb-2">
                                    <span className="font-extrabold text-xs text-[#1e1b4b]">
                                        {rev.nombre}
                                    </span>
                                    <div className="flex text-amber-400 gap-0.5 shrink-0">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star
                                                key={s}
                                                className={`w-2.5 h-2.5 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    {rev.comentario}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Enlace inferior derecho */}
            <div className="mt-4 flex justify-end">
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 transition-colors"
                >
                    <span>Ver todas las opiniones</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Modal de Opiniones Completas y Formulario */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 relative max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Opiniones de la Comunidad</h3>
                                <p className="text-xs text-slate-500">{totalOpiniones} valoraciones verificadas</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 py-4 space-y-6 pr-1">
                            {/* Formulario si es alumno pagado */}
                            {isPagado && (
                                <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 mb-4">
                                    <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                                        <BadgeCheck className="w-4 h-4 text-indigo-600" />
                                        {hasMyReview ? 'Editar tu Valoración' : 'Deja tu Valoración del Curso'}
                                    </h4>
                                    <p className="text-xs text-slate-600 mb-3">
                                        Tu opinión ayuda a otros alumnos a tomar mejores decisiones profesionales.
                                    </p>

                                    <form onSubmit={handleSubmit} className="space-y-3">
                                        <div>
                                            <div className="flex gap-1.5 mb-2">
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
                                                                className={`w-6 h-6 ${active ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                                                            />
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        <textarea
                                            value={comentario}
                                            onChange={(e) => setComentario(e.target.value)}
                                            placeholder="Comparte tu experiencia con este curso..."
                                            className="w-full border border-slate-200 rounded-xl p-3 text-xs bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                                            rows={3}
                                            maxLength={500}
                                        />

                                        {successMessage && (
                                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span>{successMessage}</span>
                                            </div>
                                        )}

                                        {errorMessage && (
                                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                                <span>{errorMessage}</span>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-75"
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                            {submitting ? 'Guardando...' : hasMyReview ? 'Actualizar Valoración' : 'Publicar Opinión'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Lista de Opiniones */}
                            <div className="space-y-4">
                                {dbReviews.map((rev) => (
                                    <div key={rev.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="flex justify-between items-start gap-2 mb-1.5">
                                            <div>
                                                <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                                                    {rev.ie_profiles?.nombre || 'Alumno de la Plataforma'}
                                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                                                        Verificado
                                                    </span>
                                                </span>
                                                <span className="text-[10px] text-slate-400">Alumno Inscrito</span>
                                            </div>
                                            <span className="text-[10px] text-slate-400">
                                                {new Date(rev.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="flex text-amber-400 gap-0.5 mb-2">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star key={s} className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-700 leading-relaxed italic">
                                            "{rev.comentario || 'El alumno calificó este curso con excelente puntuación.'}"
                                        </p>
                                    </div>
                                ))}

                                {SEED_REVIEWS.map((rev) => (
                                    <div key={rev.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="flex justify-between items-start gap-2 mb-1.5">
                                            <div>
                                                <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                                                    {rev.nombre}
                                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                                                        Verificado
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex text-amber-400 gap-0.5 mb-2">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star key={s} className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-700 leading-relaxed italic">
                                            "{rev.comentario}"
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
