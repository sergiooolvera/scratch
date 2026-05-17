'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User, Save, CheckCircle, GraduationCap, Copy, Link2 } from 'lucide-react'

export default function PerfilPage() {
    const [nombre, setNombre] = useState('')
    const [apellidoPaterno, setApellidoPaterno] = useState('')
    const [apellidoMaterno, setApellidoMaterno] = useState('')
    const [email, setEmail] = useState('')
    const [rol, setRol] = useState('')
    const [referralCode, setReferralCode] = useState<string | null>(null)
    const [telefono, setTelefono] = useState('')
    const [banco, setBanco] = useState('')
    const [clabe, setClabe] = useState('')
    const [datosBancariosCapturados, setDatosBancariosCapturados] = useState(false)
    const [solicitudCambioDatos, setSolicitudCambioDatos] = useState(false)
    const [rfc, setRfc] = useState('')
    const [csfUrl, setCsfUrl] = useState('')
    const [fotografiaPerfil, setFotografiaPerfil] = useState('')
    const [identidadValidada, setIdentidadValidada] = useState(false)
    
    const [correoAdicional, setCorreoAdicional] = useState('')
    const [profesionEspecialidad, setProfesionEspecialidad] = useState('')
    const [tipoInstitucion, setTipoInstitucion] = useState('')
    const [nombreInstitucion, setNombreInstitucion] = useState('')
    const [estadoMunicipio, setEstadoMunicipio] = useState('')
    const [cedulaProfesional, setCedulaProfesional] = useState('')
    
    const [csfFile, setCsfFile] = useState<File | null>(null)
    const [fotoFile, setFotoFile] = useState<File | null>(null)
    
    const [copiado, setCopiado] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    const router = useRouter()
    const supabase = createClient()

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validaciones
        if (!file.type.startsWith('image/')) {
            setError('Por favor, selecciona un archivo de imagen válido.')
            return
        }
        if (file.size > 2 * 1024 * 1024) {
            setError('La imagen no debe pesar más de 2MB.')
            return
        }

        setUploadingAvatar(true)
        setError('')
        setSuccess('')

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const ext = file.name.split('.').pop()
            const fileName = `foto_${user.id}_${Date.now()}.${ext}`
            const { error: upErr } = await supabase.storage.from('perfiles').upload(fileName, file)
            
            if (upErr) {
                setError('Error subiendo Fotografía: ' + upErr.message)
                setUploadingAvatar(false)
                return
            }

            const publicUrl = supabase.storage.from('perfiles').getPublicUrl(fileName).data.publicUrl
            setFotografiaPerfil(publicUrl)

            // Actualizar el perfil en la BD inmediatamente
            const { error: updateError } = await supabase
                .from('ie_profiles')
                .update({ fotografia_perfil: publicUrl })
                .eq('id', user.id)

            if (updateError) {
                setError('Error al actualizar la foto en el perfil: ' + updateError.message)
            } else {
                setSuccess('Foto de perfil actualizada correctamente.')
                window.dispatchEvent(new Event('profile-updated'))
            }
        } catch (err) {
            setError('Error al procesar la imagen.')
        } finally {
            setUploadingAvatar(false)
        }
    }

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            setEmail(user.email || '')

            // Usamos la API route para garantizar que se lean todos los campos (bypassa RLS)
            const res = await fetch('/api/perfil')
            const result = await res.json()
            const prof = result.data

            if (prof) {
                setNombre(prof.nombre || '')
                setApellidoPaterno(prof.apellido_paterno || '')
                setApellidoMaterno(prof.apellido_materno || '')
                setRol(prof.rol || 'alumno')
                setReferralCode(prof.referral_code || null)
                setTelefono(prof.telefono || '')
                setBanco(prof.banco || '')
                setClabe(prof.clabe || '')
                setRfc(prof.rfc || '')
                setCsfUrl(prof.constancia_situacion_fiscal || '')
                setFotografiaPerfil(prof.fotografia_perfil || '')
                setIdentidadValidada(prof.identidad_validada || false)
                setDatosBancariosCapturados(prof.datos_bancarios_capturados || false)
                setSolicitudCambioDatos(prof.solicitud_cambio_datos || false)
                setCorreoAdicional(prof.correo_adicional || '')
                setProfesionEspecialidad(prof.profesion_especialidad || '')
                setEstadoMunicipio(prof.estado_municipio || '')
                setCedulaProfesional(prof.cedula_profesional || '')
                
                if (prof.institucion_labora) {
                    if (prof.institucion_labora.startsWith('Pública - ')) {
                        setTipoInstitucion('Pública');
                        setNombreInstitucion(prof.institucion_labora.replace('Pública - ', ''));
                    } else if (prof.institucion_labora.startsWith('Privada - ')) {
                        setTipoInstitucion('Privada');
                        setNombreInstitucion(prof.institucion_labora.replace('Privada - ', ''));
                    } else if (prof.institucion_labora.startsWith('Otra - ')) {
                        setTipoInstitucion('Otra');
                        setNombreInstitucion(prof.institucion_labora.replace('Otra - ', ''));
                    } else {
                        setTipoInstitucion('Otra');
                        setNombreInstitucion(prof.institucion_labora);
                    }
                }
            }
            setLoading(false)
        }
        loadProfile()
    }, [router, supabase])


    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setSuccess('')
        setError('')

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        let finalCsfUrl = csfUrl;
        let finalFotoUrl = fotografiaPerfil;

        if (csfFile) {
            const ext = csfFile.name.split('.').pop();
            const fileName = `csf_${user.id}_${Date.now()}.${ext}`;
            const { error: upErr } = await supabase.storage.from('perfiles').upload(fileName, csfFile);
            if (upErr) {
                setError('Error subiendo CSF: ' + upErr.message);
                setSaving(false);
                return;
            }
            finalCsfUrl = supabase.storage.from('perfiles').getPublicUrl(fileName).data.publicUrl;
        }

        if (fotoFile) {
            const ext = fotoFile.name.split('.').pop();
            const fileName = `foto_${user.id}_${Date.now()}.${ext}`;
            const { error: upErr } = await supabase.storage.from('perfiles').upload(fileName, fotoFile);
            if (upErr) {
                setError('Error subiendo Fotografía: ' + upErr.message);
                setSaving(false);
                return;
            }
            finalFotoUrl = supabase.storage.from('perfiles').getPublicUrl(fileName).data.publicUrl;
        }

        const nuevosDatosCapturados = (telefono && banco && clabe && !datosBancariosCapturados) ? true : datosBancariosCapturados;

        const combinedInstitucion = tipoInstitucion && nombreInstitucion 
            ? `${tipoInstitucion} - ${nombreInstitucion}` 
            : (nombreInstitucion || tipoInstitucion || '');

        const { error: updateError } = await supabase
            .from('ie_profiles')
            .update({ 
                nombre,
                apellido_paterno: apellidoPaterno,
                apellido_materno: apellidoMaterno,
                telefono,
                banco,
                clabe,
                rfc,
                constancia_situacion_fiscal: finalCsfUrl,
                fotografia_perfil: finalFotoUrl,
                datos_bancarios_capturados: nuevosDatosCapturados,
                correo_adicional: correoAdicional,
                profesion_especialidad: profesionEspecialidad,
                institucion_labora: combinedInstitucion,
                estado_municipio: estadoMunicipio,
                cedula_profesional: cedulaProfesional
            })
            .eq('id', user.id)

        if (!updateError && nuevosDatosCapturados && !datosBancariosCapturados) {
            setDatosBancariosCapturados(true);
        }

        if (updateError) {
            setError('Error al actualizar el perfil: ' + updateError.message)
        } else {
            setSuccess('Perfil actualizado correctamente.')
        }
        setSaving(false)
    }

    const solicitarAjuste = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/perfil/solicitar-ajuste', { method: 'POST' })
            if (res.ok) {
                setSolicitudCambioDatos(true)
                setSuccess('Solicitud enviada. Un administrador revisará tu petición pronto.')
            } else {
                const data = await res.json()
                setError(data.error || 'Error al enviar la solicitud.')
            }
        } catch (err) {
            setError('Error de conexión al solicitar ajuste.')
        }
        setSaving(false)
    }

    if (loading) return (
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-zinc-50 p-8">
            <div className="text-gray-500 animate-pulse text-lg">Cargando perfil...</div>
        </div>
    )

    return (
        <div className="min-h-[calc(100vh-64px)] bg-zinc-50 font-sans py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                    <div 
                        onClick={handleAvatarClick}
                        className="relative flex items-center justify-center h-20 w-20 bg-blue-100 text-blue-600 rounded-full mx-auto mb-6 cursor-pointer hover:opacity-80 transition-opacity overflow-hidden"
                    >
                        {fotografiaPerfil ? (
                            <img src={fotografiaPerfil} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                            <User className="h-10 w-10" />
                        )}
                        {uploadingAvatar && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                <div className="border-4 border-t-blue-500 border-gray-200 rounded-full h-6 w-6 animate-spin"></div>
                            </div>
                        )}
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleAvatarChange} 
                        accept="image/*" 
                        className="hidden" 
                    />
                    
                    <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">Mi Perfil</h1>

                    {success && (
                        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center text-green-700">
                            <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                            <p className="text-sm font-medium">{success}</p>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Correo Electrónico (Solo Lectura)</label>
                            <input 
                                type="text" 
                                disabled 
                                value={email} 
                                className="block w-full border-gray-300 rounded-md bg-gray-100 text-gray-500 px-4 py-3 sm:text-sm border"
                            />
                            <p className="mt-1 text-xs text-gray-400">El correo electrónico no puede ser modificado aquí.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Rol
                            </label>
                            <div className="flex items-center space-x-2 bg-gray-50 px-4 py-3 rounded-md border text-gray-700">
                                <GraduationCap className="h-5 w-5 text-gray-400" />
                                <span className="capitalize font-medium">{rol}</span>
                            </div>
                        </div>

                        {/* Tarjeta de código de referido */}
                        {referralCode && (
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Link2 className="w-5 h-5 text-indigo-600" />
                                    <h2 className="text-base font-bold text-indigo-800">Mi Código de Referido</h2>
                                </div>
                                <p className="text-xs text-indigo-500 mb-4 leading-relaxed">
                                    Comparte este código con tus referidos para que lo ingresen al momento de inscribirse. Ganarás comisión por cada venta generada.
                                </p>
                                <div className="bg-white border-2 border-indigo-200 rounded-xl px-4 py-3 flex items-center justify-between mb-4">
                                    <span className="text-2xl font-mono font-extrabold tracking-widest text-indigo-700">{referralCode}</span>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            await navigator.clipboard.writeText(referralCode)
                                            setCopiado(true)
                                            setTimeout(() => setCopiado(false), 2000)
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs font-semibold rounded-lg transition-colors"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                        {copiado ? '¡Copiado!' : 'Copiar'}
                                    </button>
                                </div>

                            </div>
                        )}

                        <div className="pt-4 border-t border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">Información Personal</h2>
                            <p className="text-sm text-gray-500 mb-5 leading-relaxed">Estos son los datos que aparecerán impresos en tus constancias y certificados de los cursos acreditados. Asegúrate de que estén escritos correctamente.</p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Nombre(s)</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={nombre} 
                                        onChange={(e) => setNombre(e.target.value)}
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md px-4 py-3 sm:text-base border text-black font-medium"
                                        placeholder="Ej. Juan Carlos"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Apellido Paterno</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={apellidoPaterno} 
                                        onChange={(e) => setApellidoPaterno(e.target.value)}
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md px-4 py-3 sm:text-base border text-black font-medium"
                                        placeholder="Ej. Pérez"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Apellido Materno (Opcional)</label>
                                    <input 
                                        type="text" 
                                        value={apellidoMaterno} 
                                        onChange={(e) => setApellidoMaterno(e.target.value)}
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md px-4 py-3 sm:text-base border text-black font-medium"
                                        placeholder="Ej. García"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                        Correo Electrónico Adicional <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="email" 
                                        required 
                                        value={correoAdicional} 
                                        onChange={(e) => setCorreoAdicional(e.target.value)}
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md px-4 py-3 sm:text-base border text-black font-medium"
                                        placeholder="Ej. correo.secundario@gmail.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                        Profesión / Especialidad <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        required
                                        value={profesionEspecialidad} 
                                        onChange={(e) => setProfesionEspecialidad(e.target.value)}
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md px-4 py-3 sm:text-base border text-black font-medium"
                                        placeholder="Ej. Lic. en Enfermería, Psicólogo Clínico"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                        Sector Institucional <span className="text-red-500">*</span>
                                    </label>
                                    <select 
                                        required
                                        value={tipoInstitucion} 
                                        onChange={(e) => setTipoInstitucion(e.target.value)}
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md px-4 py-3 sm:text-base border text-black font-medium bg-white"
                                    >
                                        <option value="">Seleccione sector...</option>
                                        <option value="Pública">Pública</option>
                                        <option value="Privada">Privada</option>
                                        <option value="Otra">Otra / Independiente</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                        Estado y Municipio de Residencia <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        required
                                        value={estadoMunicipio} 
                                        onChange={(e) => setEstadoMunicipio(e.target.value)}
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md px-4 py-3 sm:text-base border text-black font-medium"
                                        placeholder="Ej. Chiapas, Tuxtla Gutiérrez"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                        Cédula Profesional (Si aplica)
                                    </label>
                                    <input 
                                        type="text" 
                                        value={cedulaProfesional} 
                                        onChange={(e) => setCedulaProfesional(e.target.value)}
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md px-4 py-3 sm:text-base border text-black font-medium"
                                        placeholder="Ej. 12345678 (Opcional)"
                                    />
                                </div>
                            </div>
                        </div>

                        {(rol === 'profesor' || rol === 'vendedor' || rol === 'instructor') && (
                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-gray-800">Validación de Identidad</h2>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${identidadValidada ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {identidadValidada ? 'Validado' : 'Pendiente'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                                    Para operar en la plataforma necesitas completar estos datos. Una vez guardados, el administrador validará tu identidad.
                                </p>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">RFC</label>
                                        <input 
                                            type="text" 
                                            value={rfc} 
                                            onChange={(e) => setRfc(e.target.value.toUpperCase())}
                                            className="focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md px-4 py-3 sm:text-base border text-black font-medium"
                                            placeholder="Ej. XAXX010101000"
                                            maxLength={13}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Constancia de Situación Fiscal (PDF) (Opcional)</label>
                                        {csfUrl && <p className="text-xs text-blue-600 truncate mb-1">Archivo actual guardado</p>}
                                        <input 
                                            type="file" 
                                            accept=".pdf"
                                            onChange={(e) => setCsfFile(e.target.files?.[0] || null)}
                                            className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border p-1 rounded-md bg-white border-gray-300"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {(rol === 'profesor' || rol === 'vendedor' || rol === 'instructor') && (
                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-gray-800">Datos de Contacto y Pago</h2>
                                    <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">Obligatorio</span>
                                </div>
                                <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                                    Como profesor o vendedor, estos datos son obligatorios para poder gestionar cursos y recibir tus comisiones. 
                                    {datosBancariosCapturados && !solicitudCambioDatos && " Por seguridad, estos datos están bloqueados tras su captura."}
                                </p>
                                
                                <div className={`space-y-4 ${datosBancariosCapturados ? 'opacity-75' : ''}`}>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono</label>
                                        <input 
                                            type="tel" 
                                            required={rol === 'profesor' || rol === 'vendedor' || rol === 'instructor'}
                                            value={telefono} 
                                            onChange={(e) => setTelefono(e.target.value)}
                                            disabled={datosBancariosCapturados}
                                            className="focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md px-4 py-3 sm:text-base border text-black font-medium disabled:bg-gray-100 disabled:text-gray-500"
                                            placeholder="Ej. 961 123 4567"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Banco</label>
                                            <input 
                                                type="text" 
                                                required={rol === 'profesor' || rol === 'vendedor' || rol === 'instructor'}
                                                value={banco} 
                                                onChange={(e) => setBanco(e.target.value)}
                                                disabled={datosBancariosCapturados}
                                                className="focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md px-4 py-3 sm:text-base border text-black font-medium disabled:bg-gray-100 disabled:text-gray-500"
                                                placeholder="Ej. BBVA, Banorte..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">CLABE Interbancaria</label>
                                            <input 
                                                type="text" 
                                                required={rol === 'profesor' || rol === 'vendedor' || rol === 'instructor'}
                                                value={clabe} 
                                                onChange={(e) => setClabe(e.target.value)}
                                                disabled={datosBancariosCapturados}
                                                className="focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md px-4 py-3 sm:text-base border text-black font-medium disabled:bg-gray-100 disabled:text-gray-500"
                                                placeholder="18 dígitos"
                                                maxLength={18}
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                {datosBancariosCapturados && (
                                    <div className="mt-4 flex justify-end">
                                        {solicitudCambioDatos ? (
                                            <span className="text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                                                Solicitud de ajuste pendiente de revisión
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={solicitarAjuste}
                                                disabled={saving}
                                                className="text-sm font-bold text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
                                            >
                                                Solicitar ajuste de datos
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-full shadow-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all font-semibold"
                            >
                                {saving ? 'Guardando cambios...' : (
                                    <>
                                        <Save className="h-5 w-5 mr-2" />
                                        Guardar Perfil
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
