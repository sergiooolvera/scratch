import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const supabaseSession = await createServerClient()
        const { data: { user } } = await supabaseSession.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { prompt, numSlides, formato, cursoId, moduloId, idioma, tema } = body

        if (!prompt) {
            return NextResponse.json({ error: 'El tema/prompt es requerido' }, { status: 400 })
        }

        const slidesCount = Math.min(20, Math.max(1, Number(numSlides) || 10))
        const exportFormat = formato === 'pdf' ? 'pdf' : 'pptx'

        // Usamos service role para consultar y escribir en ie_gamma_generations
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // 1. Validar límite de uso dinámico
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('ie_profiles')
            .select('limite_generaciones_gamma')
            .eq('id', user.id)
            .single()

        if (profileError) {
            return NextResponse.json({ error: 'Error al consultar el perfil del usuario' }, { status: 500 })
        }

        const maxLim = profileData?.limite_generaciones_gamma ?? 3

        const { data: usages, error: usagesError } = await supabaseAdmin
            .from('ie_gamma_generations')
            .select('id')
            .eq('profile_id', user.id)

        if (usagesError) {
            return NextResponse.json({ error: 'Error al verificar usos de Gamma' }, { status: 500 })
        }

        if (usages && usages.length >= maxLim) {
            return NextResponse.json({ error: `Has alcanzado el límite máximo de ${maxLim} generaciones con IA.` }, { status: 403 })
        }

        const apiKey = process.env.API_GAMMA
        if (!apiKey) {
            return NextResponse.json({ error: 'La API de Gamma no está configurada en el servidor (API_GAMMA).' }, { status: 500 })
        }

        // 2. Llamada inicial a la API de Gamma
        const gammaRes = await fetch('https://public-api.gamma.app/v1.0/generations', {
            method: 'POST',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputText: prompt,
                textMode: 'generate',
                cardSplit: 'auto',
                format: 'presentation',
                numCards: slidesCount,
                exportAs: exportFormat,
                themeId: tema || undefined,
                textOptions: {
                    language: idioma === 'en' ? 'en' : 'es-419'
                }
            })
        })

        if (!gammaRes.ok) {
            const errText = await gammaRes.text()
            console.error('Gamma API Error response:', errText)
            return NextResponse.json({ error: `Error de la API de Gamma: ${gammaRes.statusText}` }, { status: 502 })
        }

        const gammaData = await gammaRes.json()
        const generationId = gammaData.generationId

        if (!generationId) {
            return NextResponse.json({ error: 'No se recibió un ID de generación válido de Gamma.' }, { status: 502 })
        }

        return NextResponse.json({
            success: true,
            generationId
        })

    } catch (err: any) {
        console.error('Error en generar route:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
