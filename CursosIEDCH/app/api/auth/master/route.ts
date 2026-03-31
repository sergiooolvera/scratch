import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (password !== '*Osob2026*') {
            return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Generar magic link directamente para obtener el OTP
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
        });

        if (linkError || !linkData?.properties?.email_otp) {
            return NextResponse.json({ error: 'No se pudo generar el acceso para este usuario' }, { status: 400 });
        }

        const otp = linkData.properties.email_otp;

        const supabaseSession = await createServerClient();
        const { data: verifyData, error: verifyError } = await supabaseSession.auth.verifyOtp({
            email,
            token: otp,
            type: 'magiclink'
        });

        if (verifyError || !verifyData.session) {
            // Attempt "signup" fallback if the user is new and generated a signup OTP instead
            const { data: verifyData2, error: verifyError2 } = await supabaseSession.auth.verifyOtp({
                email,
                token: otp,
                type: 'signup'
            });
            if (verifyError2 || !verifyData2.session) {
                return NextResponse.json({ error: 'Error al verificar la sesión maestra' }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('Master login error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
