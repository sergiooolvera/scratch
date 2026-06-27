import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token de autenticación faltante.' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Sesión inválida o expirada.' }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code || code.trim().length !== 6) {
      return NextResponse.json({ error: 'Código inválido.' }, { status: 400 });
    }

    const { data: info, error: fetchError } = await supabaseAdmin
      .from('qui_promoter_info')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError || !info) {
      return NextResponse.json({ error: 'No se encontró solicitud de verificación.' }, { status: 404 });
    }

    if (info.phone_verified) {
      return NextResponse.json({ success: true, message: 'Teléfono ya verificado.' });
    }

    if (info.verification_code !== code.trim()) {
      return NextResponse.json({ error: 'Código incorrecto.' }, { status: 400 });
    }

    if (new Date(info.code_expires_at) < new Date()) {
      return NextResponse.json({ error: 'El código ha expirado. Solicita uno nuevo.' }, { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('qui_promoter_info')
      .update({ phone_verified: true, verification_code: null, code_expires_at: null })
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: 'Teléfono verificado correctamente.' });
  } catch (err: any) {
    console.error('Error in verify-code:', err.message);
    return NextResponse.json({ error: `Error interno: ${err.message}` }, { status: 500 });
  }
}
