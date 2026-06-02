import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const supabaseSession = await createServerClient()
        const { data: { user } } = await supabaseSession.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const generationId = searchParams.get('generationId')
        const prompt = searchParams.get('prompt') || ''
        const numSlides = Number(searchParams.get('numSlides')) || 10
        const formato = searchParams.get('formato') === 'pdf' ? 'pdf' : 'pptx'
        const cursoId = searchParams.get('cursoId') || null
        const moduloId = searchParams.get('moduloId') || null

        if (!generationId) {
            return NextResponse.json({ error: 'Falta generationId' }, { status: 400 })
        }

        const apiKey = process.env.API_GAMMA
        if (!apiKey) {
            return NextResponse.json({ error: 'La API de Gamma no está configurada (API_GAMMA).' }, { status: 500 })
        }

        // Consultar estado en Gamma
        const checkRes = await fetch(`https://public-api.gamma.app/v1.0/generations/${generationId}`, {
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json'
            }
        })

        if (!checkRes.ok) {
            const errText = await checkRes.text()
            console.error('Error al checar status de Gamma:', errText)
            return NextResponse.json({ error: 'Error al consultar estado en el servidor de Gamma.' }, { status: 502 })
        }

        const checkData = await checkRes.json()
        const status = checkData.status || 'generating'
        const gammaUrl = checkData.gammaUrl || ''
        const exportUrl = checkData.exportUrl || ''
        
        const rawCredits = checkData.credits || checkData.creditsUsed;
        const creditsUsed = typeof rawCredits === 'object' && rawCredits !== null
            ? (rawCredits.deducted || 0)
            : (Number(rawCredits) || (numSlides * 4));

        if (status === 'failed') {
            return NextResponse.json({ success: true, status: 'failed' })
        }

        if (status === 'completed') {
            // Conectar como Admin para insertar en DB
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            // Buscar si ya lo guardamos
            const { data: existing } = await supabaseAdmin
                .from('ie_gamma_generations')
                .select('id')
                .eq('export_url', exportUrl)
                .eq('profile_id', user.id)
                .maybeSingle()

            let dbId = existing?.id || null

            if (!existing && exportUrl) {
                const { data: dbRecord, error: dbError } = await supabaseAdmin
                    .from('ie_gamma_generations')
                    .insert({
                        profile_id: user.id,
                        curso_id: cursoId === 'null' || !cursoId ? null : cursoId,
                        modulo_id: moduloId === 'null' || !moduloId ? null : moduloId,
                        prompt: prompt,
                        num_slides: numSlides,
                        formato: formato,
                        gamma_url: gammaUrl,
                        export_url: exportUrl,
                        descargado: false,
                        utilizado: false,
                        credits_used: creditsUsed
                    })
                    .select()
                    .single()

                if (dbError) {
                    console.error('Error insertando registro en DB:', dbError)
                } else if (dbRecord) {
                    dbId = dbRecord.id
                }
            }

            return NextResponse.json({
                success: true,
                status: 'completed',
                id: dbId,
                gammaUrl,
                exportUrl,
                creditsUsed
            })
        }

        // Sigue generando
        return NextResponse.json({
            success: true,
            status: 'generating'
        })

    } catch (err: any) {
        console.error('Error en status route:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
