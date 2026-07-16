import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import AcademyPortalClient from '@/components/AcademyPortalClient'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function AcademyPage({ params }: PageProps) {
    const resolvedParams = await params
    const { id } = resolvedParams

    const supabase = await createClient()

    // 1. Verificar si es un ID ficticio o si debemos usar mockups
    const isMock = id.startsWith('mock-')

    if (isMock) {
        // Generar datos ficticios basados en el ID para mantener consistencia con el mockup
        const mockAcademia = {
            id,
            nombre: id === 'mock-1' ? 'Academia de Salud EGAC' : id === 'mock-2' ? 'Academia de Negocios EGAC' : id === 'mock-3' ? 'Academia de Tecnología EGAC' : 'Academia de Idiomas EGAC',
            descripcion: 'Espacio de formación continua para profesionales y estudiantes del área. Cursos de alta calidad con validez oficial e instructores certificados.',
            categoria: id === 'mock-1' ? 'Salud' : id === 'mock-2' ? 'Negocios' : id === 'mock-3' ? 'Tecnología' : 'Idiomas',
            color_principal: id === 'mock-1' ? '#10b981' : id === 'mock-2' ? '#3b82f6' : id === 'mock-3' ? '#6366f1' : '#f59e0b',
            publica: id !== 'mock-2', // Hacemos que la de negocios (mock-2) sea privada para probar el flujo de código de acceso
            codigo_acceso: '1234',
            correo_contacto: 'contacto@academiaegac.com',
            telefono_contacto: '+52 722 123 4567',
            redes_sociales: { facebook: '#', instagram: '#', linkedin: '#', youtube: '#' },
            created_at: new Date(2023, 2, 15).toISOString(),
            logo_url: null,
            banner_url: null
        }

        const mockCreador = {
            nombre: 'Dr. Juan Pérez',
            fotografia_perfil: null,
            correo_contacto: 'juan.perez@academiaegac.com',
            telefono_contacto: '+52 722 123 4567',
            redes_sociales: { facebook: '#', instagram: '#' }
        }

        const mockGrupos = [
            { id: 'g-1', nombre: 'Enfermería General', descripcion: '320 miembros' },
            { id: 'g-2', nombre: 'Cuidados Intensivos', descripcion: '180 miembros' },
            { id: 'g-3', nombre: 'Farmacología Clínica', descripcion: '95 miembros' },
            { id: 'g-4', nombre: 'Salud Pública', descripcion: '120 miembros' }
        ]

        const mockCursos = [
            { id: 'c-1', titulo: 'Toma Correcta de la Presión Arterial', precio: 0, imagen_url: null, profesor: { nombre: 'Ana Torres', fotografia_perfil: null } },
            { id: 'c-2', titulo: 'Farmacología Básica Hospitalaria', precio: 499, imagen_url: null, profesor: { nombre: 'María López', fotografia_perfil: null } },
            { id: 'c-3', titulo: 'Cuidados de Ostomías y Colostomías', precio: 499, imagen_url: null, profesor: { nombre: 'Carlos Méndez', fotografia_perfil: null } },
            { id: 'c-4', titulo: 'Hemodiálisis para Enfermería', precio: 499, imagen_url: null, profesor: { nombre: 'Dr. Juan Pérez', fotografia_perfil: null } }
        ]

        const mockAlumnosCount = id === 'mock-1' ? 1250 : id === 'mock-2' ? 980 : id === 'mock-3' ? 850 : 760

        return (
            <AcademyPortalClient
                academia={mockAcademia}
                creador={mockCreador}
                grupos={mockGrupos}
                cursos={mockCursos}
                alumnosCount={mockAlumnosCount}
                esMock={true}
            />
        )
    }

    // 2. Consulta real en Base de Datos para academias reales
    const { data: academia, error: acError } = await supabase
        .from('ie_academias')
        .select('*')
        .eq('id', id)
        .single()

    if (acError || !academia) {
        notFound()
    }

    // Obtener creador
    const { data: creador } = await supabase
        .from('ie_profiles')
        .select('*')
        .eq('id', academia.creado_por)
        .single()

    // Obtener grupos
    const { data: gruposData } = await supabase
        .from('ie_grupos')
        .select('*')
        .eq('academia_id', id)
        .eq('activo', true)

    const grupos = gruposData || []
    const grupoIds = grupos.map(g => g.id)

    // Obtener cursos vinculados a grupos
    let cursos: any[] = []
    if (grupoIds.length > 0) {
        const { data: grupoCursos } = await supabase
            .from('ie_grupo_cursos')
            .select('curso_id')
            .in('grupo_id', grupoIds)
        
        const cursoIds = grupoCursos?.map(gc => gc.curso_id) || []
        if (cursoIds.length > 0) {
            const { data: dbCursos } = await supabase
                .from('ie_cursos')
                .select('*, profesor:ie_profiles!creado_por(nombre, fotografia_perfil)')
                .in('id', cursoIds)
                .eq('estado', 'aprobado')
            cursos = dbCursos || []
        }
    }

    // Obtener alumnos count directamente de la relación alumno-academia
    const { count } = await supabase
        .from('ie_academia_alumnos')
        .select('*', { count: 'exact', head: true })
        .eq('academia_id', id)

    const alumnosCount = count || 0

    return (
        <AcademyPortalClient
            academia={academia}
            creador={creador}
            grupos={grupos}
            cursos={cursos}
            alumnosCount={alumnosCount}
            esMock={false}
        />
    )
}
