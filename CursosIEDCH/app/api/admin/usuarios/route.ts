import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabaseSession = await createServerClient();
        const { data: { user } } = await supabaseSession.auth.getUser();

        if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const { data: profile } = await supabaseSession
            .from('ie_profiles')
            .select('rol')
            .eq('id', user.id)
            .single();

        if (profile?.rol !== 'admin') return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });

        // Cliente con Service Role para leer Auth Users y perfiles sin RLS
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Ojo: listUsers retorna hasta 50 por defecto. Podemos especificar perPage.
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
            perPage: 1000
        });
        
        const { data: profiles, error: profError } = await supabaseAdmin
            .from('ie_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (profError) throw profError;

        // Mapa de emails por ID
        const emailMap: Record<string, string> = {};
        authUsers?.users?.forEach(u => {
            emailMap[u.id] = u.email || 'N/A';
        });

        // Combinar datos
        const mergedUsers = profiles?.map(p => ({
            ...p,
            email: emailMap[p.id] || 'N/A'
        })) || [];

        return NextResponse.json({ data: mergedUsers });

    } catch (err: any) {
        console.error('Error fetching admin users:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
