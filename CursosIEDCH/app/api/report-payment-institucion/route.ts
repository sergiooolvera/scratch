import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
    try {
        const { planId, userId, publicURL, metodo } = await req.json()

        const supabaseUser = await createServerClient()
        const { data: { user } } = await supabaseUser.auth.getUser()

        if (!user || user.id !== userId) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Asignar créditos según el plan
        let creditosAComprar = 1;
        let vigenciaMeses = 3;
        
        if (planId === 'pro') creditosAComprar = 10;
        else if (planId === 'ultra') creditosAComprar = 100;

        const { data: credsActuales } = await supabaseAdmin
            .from('ie_institucion_creditos')
            .select('creditos_restantes')
            .eq('user_id', userId)
            .single();

        const creditosActualesInt = credsActuales?.creditos_restantes || 0;

        const vencimientoDate = new Date();
        vencimientoDate.setMonth(vencimientoDate.getMonth() + vigenciaMeses);

        const { error } = await supabaseAdmin.from('ie_institucion_creditos')
            .upsert({
                user_id: userId,
                creditos_restantes: creditosActualesInt + creditosAComprar,
                plan_actual: planId?.toUpperCase() || 'INDIVIDUAL',
                pago_recurrente: false,
                fecha_compra: new Date().toISOString(),
                vence_en: vencimientoDate.toISOString(),
            });

        if (error) {
            console.error("Error guardando créditos de institución en DB:", error);
            throw new Error("Database Error");
        }

        return NextResponse.json({ success: true, message: 'Comprobante recibido y créditos habilitados.' })
    } catch (error: any) {
        console.error('[API_REPORT_PAYMENT_INSTITUCION_ERROR]', error)
        return NextResponse.json({ success: false, error: 'Hubo un error procesando la solicitud', details: error?.message || String(error) }, { status: 500 })
    }
}
