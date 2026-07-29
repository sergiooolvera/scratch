import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const supabaseSession = await createServerClient();
        const { data: { user } } = await supabaseSession.auth.getUser();

        if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const { data: profile } = await supabaseSession
            .from('ie_profiles')
            .select('rol, permisos_adminjr')
            .eq('id', user.id)
            .single();

        const rol = profile?.rol;
        const permisos = Array.isArray(profile?.permisos_adminjr) ? (profile.permisos_adminjr as string[]) : [];

        // Habilitar acceso a administradores o adminjr que tengan el permiso 'auditoria'
        if (rol !== 'admin' && (rol !== 'adminjr' || !permisos.includes('auditoria'))) {
            return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
        }

        // Cliente de Supabase con Service Role para leer Auth Users y perfiles sin RLS
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Obtener parámetros de búsqueda
        const { searchParams } = new URL(req.url);
        const evento = searchParams.get('evento');
        const fechaInicio = searchParams.get('fechaInicio');
        const fechaFin = searchParams.get('fechaFin');
        const search = searchParams.get('search')?.trim().toLowerCase();

        // 1. Obtener todos los usuarios de Auth para el mapeo de emails
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({
            perPage: 1000
        });

        const emailMap: Record<string, string> = {};
        authUsers?.users?.forEach(u => {
            emailMap[u.id] = u.email || 'N/A';
        });

        // 2. Construir la consulta a ie_auditoria_logs
        let query = supabaseAdmin
            .from('ie_auditoria_logs')
            .select(`
                *,
                profile:ie_profiles (
                    nombre,
                    apellido_paterno,
                    apellido_materno,
                    rol
                )
            `)
            .order('created_at', { ascending: false });

        if (evento && evento !== 'todos') {
            query = query.eq('evento', evento);
        }

        if (fechaInicio) {
            query = query.gte('created_at', `${fechaInicio}T00:00:00.000Z`);
        }

        if (fechaFin) {
            query = query.lte('created_at', `${fechaFin}T23:59:59.999Z`);
        }

        const { data: logs, error: logsError } = await query;

        if (logsError) throw logsError;

        // 3. Enriquecer los resultados
        let enrichedLogs = (logs || []).map((log: any) => {
            const nombreCompleto = log.profile
                ? [log.profile.nombre, log.profile.apellido_paterno, log.profile.apellido_materno].filter(Boolean).join(' ')
                : 'Usuario Externo / Invitado';
            
            return {
                ...log,
                email: emailMap[log.user_id || ''] || 'Invitado/N/A',
                nombre_completo: nombreCompleto,
                rol_usuario: log.profile?.rol || 'N/A'
            };
        });

        // 4. Filtrar por término de búsqueda (si se proporciona)
        if (search) {
            enrichedLogs = enrichedLogs.filter(log => {
                const coincideNombre = log.nombre_completo.toLowerCase().includes(search);
                const coincideEmail = log.email.toLowerCase().includes(search);
                const coincideEvento = log.evento.toLowerCase().includes(search);
                const coincideId = log.user_id && log.user_id.toLowerCase().includes(search);
                return coincideNombre || coincideEmail || coincideEvento || coincideId;
            });
        }

        return NextResponse.json({ data: enrichedLogs });

    } catch (err: any) {
        console.error('Error fetching auditoria logs:', err);
        return NextResponse.json({ error: err.message, details: err?.message || String(err) }, { status: 500 });
    }
}
