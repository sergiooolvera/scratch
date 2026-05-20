'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import ActividadConstanciaDocument from '@/components/ActividadConstanciaDocument'
import { Download, AlertTriangle, ArrowLeft } from 'lucide-react'
import ResponsiveCertificateWrapper from '@/components/ResponsiveCertificateWrapper'

export default function VerConstanciaInstitucional() {
    const params = useParams()
    const router = useRouter()
    const { id } = params
    
    const [constanciaData, setConstanciaData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [downloading, setDownloading] = useState(false)
    const constanciaRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchConstancia()
    }, [id])

    const fetchConstancia = async () => {
        if (!id) return
        setLoading(true)
        
        try {
            const { data, error } = await supabase
                .from('ie_actividad_alumnos')
                .select(`
                    *,
                    actividad:ie_actividad_institucion(*)
                `)
                .eq('id', id)
                .single()

            if (error || !data) {
                throw new Error(error?.message || 'Constancia no encontrada')
            }
            
            setConstanciaData(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async () => {
        if (!constanciaRef.current || !constanciaData) return;
        setDownloading(true);

        try {
            const [htmlToImage, jsPDF] = await Promise.all([
                import('html-to-image'),
                import('jspdf').then(mod => mod.jsPDF)
            ]);

            const element = constanciaRef.current;

            const dataUrl = await htmlToImage.toPng(element, { 
                quality: 1.0, 
                pixelRatio: 2,
                width: 1056,
                height: 816,
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left'
                }
            });

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [1056, 816] 
            });

            pdf.addImage(dataUrl, 'PNG', 0, 0, 1056, 816);
            pdf.save(`Constancia_${constanciaData.nombre_alumno.replace(/[^a-z0-9]/gi, '_')}.pdf`);
            
        } catch (error) {
            console.error('Error generando PDF:', error);
            alert('Hubo un error al generar el PDF. Por favor, intente de nuevo.');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Cargando constancia...</div>
    }

    if (error || !constanciaData) {
        return (
            <div className="max-w-3xl mx-auto p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar la constancia</h1>
                <p className="text-gray-600 mb-6">{error}</p>
                <button onClick={() => router.back()} className="text-indigo-600 hover:underline">Volver</button>
            </div>
        )
    }

    // Datos mapeados para el componente
    const baseHost = typeof window !== 'undefined' ? window.location.origin : 'https://iedch-2.vercel.app'
    const validacionUrl = `${baseHost}/validar?folio=${constanciaData.folio_constancia}`

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-[1100px] mx-auto mb-6 flex justify-between items-center">
                <button 
                    onClick={() => router.back()} 
                    className="flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 mr-1" /> Volver al Expediente
                </button>
                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                    <Download className="h-5 w-5" />
                    {downloading ? 'Generando PDF...' : 'Descargar PDF'}
                </button>
            </div>

            <div className="max-w-[1056px] mx-auto shadow-2xl rounded-sm ring-1 ring-gray-200 bg-white">
                <ResponsiveCertificateWrapper>
                    <ActividadConstanciaDocument
                        documentRef={constanciaRef}
                        alumnoNombre={constanciaData.nombre_alumno}
                        actividadNombre={constanciaData.actividad.nombre_actividad}
                        actividadTipo={constanciaData.actividad.tipo_actividad}
                        duracion={constanciaData.actividad.duracion}
                        fechaAprobacion={new Date(constanciaData.actividad.fecha_ejecucion).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                        facilitador={constanciaData.actividad.autor}
                        ubicacion={constanciaData.actividad.ubicacion}
                        folio={constanciaData.folio_constancia}
                        qrUrl={validacionUrl}
                        institucionNombre={constanciaData.actividad.institucion_acredita}
                    />
                </ResponsiveCertificateWrapper>
            </div>
        </div>
    )
}
